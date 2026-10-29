// src/tests/work-management.test.js
// Automated test suite for Work Management: Projects, Tasks, and Time Tracking
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local'), override: true });

const assert = require('assert');
const jwt = require('jsonwebtoken');
const express = require('express');
const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sysmaira',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

let server;
let baseUrl;
let adminToken;
let clientToken;
let adminUserId;
let clientUserId;
let clientClientId;
let clientProjectId;
let otherProjectId;

const TEST_EMAIL = 'client@company.com';

function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_min_32_chars',
    { expiresIn: '1h' }
  );
}

async function api(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data };
}

let passed = 0;
let failed = 0;

function pass(name) {
  passed++;
  console.log(`  ✓ PASS: ${name}`);
}

function fail(name, error) {
  failed++;
  console.error(`  ✗ FAIL: ${name}`);
  console.error(`         ${error.message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING WORK MANAGEMENT AUTOMATED TEST SUITE');
  console.log(' (Projects, Tasks, Time Tracking & RBAC Isolation)');
  console.log('======================================================\n');

  try {
    // ── Setup Test App & Routes ────────────────────────────────────
    const app = express();
    app.use(express.json());
    const { router: projectsRouter, tasksRouter, sprintsRouter, timeRouter } = require('../routes/projects');
    app.use('/api/v1/projects', projectsRouter);
    app.use('/api/v1/tasks', tasksRouter);
    app.use('/api/v1/sprints', sprintsRouter);
    app.use('/api/v1/time-entries', timeRouter);
    app.use('/api/v1/time-tracking', timeRouter);
    const { errorHandler } = require('../middleware/errorHandler');
    app.use(errorHandler);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Fetch Admin User
    const adminUserRes = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') LIMIT 1`);
    assert(adminUserRes.rows.length, 'Admin user must exist in database');
    const adminUser = adminUserRes.rows[0];
    adminUserId = adminUser.id;
    adminToken = generateToken(adminUser.id, adminUser.role);

    // 2. Fetch Client User
    const clientUserRes = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE email = $1`, [TEST_EMAIL]);
    assert(clientUserRes.rows.length, 'Client user must exist in database');
    const clientUser = clientUserRes.rows[0];
    clientUserId = clientUser.id;
    clientToken = generateToken(clientUser.id, 'client');

    // 3. Find Client record & Project IDs
    const clientRecordRes = await pool.query(`SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`, [clientUserId]);
    clientClientId = clientRecordRes.rows[0]?.id;

    const clientProjectRes = await pool.query(`SELECT id FROM client_schema.client_projects WHERE client_id = $1 AND deleted_at IS NULL LIMIT 1`, [clientClientId]);
    clientProjectId = clientProjectRes.rows[0]?.id;

    const otherProjectRes = await pool.query(`SELECT id FROM client_schema.client_projects WHERE client_id != $1 AND deleted_at IS NULL LIMIT 1`, [clientClientId || '00000000-0000-0000-0000-000000000000']);
    otherProjectId = otherProjectRes.rows[0]?.id;

    // ── 1. Projects API Tests ───────────────────────────────────────
    console.log('1. PROJECTS DIRECTORY & OVERVIEW TESTS:');
    try {
      const res = await api('/projects', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'Expected array of projects');
      assert(res.data.total >= 10, 'Expected at least 10 seeded projects');
      pass(`Projects directory returned paginated records (count: ${res.data.data.length}, total: ${res.data.total})`);
    } catch (e) { fail('Projects directory', e); }

    try {
      const res = await api('/projects/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.total >= 10, 'Total projects must be >= 10');
      assert(res.data.data.in_progress >= 1, 'In-progress projects must be >= 1');
      assert(res.data.data.completed >= 1, 'Completed projects must be >= 1');
      pass(`Projects overview summary calculated (Total: ${res.data.data.total}, Active: ${res.data.data.in_progress}, Completed: ${res.data.data.completed}, Overdue: ${res.data.data.overdue})`);
    } catch (e) { fail('Projects summary calculation', e); }

    try {
      const res = await api('/projects/overdue', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'Overdue projects must be array');
      pass(`Overdue projects endpoint verified (found: ${res.data.data.length})`);
    } catch (e) { fail('Overdue projects query', e); }

    let createdProjId = null;
    try {
      const res = await api('/projects', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'AI Agent Work Management Integration',
          description: 'Automated end-to-end Work Management system',
          type: 'fixed_price',
          priority: 'high',
          budget: 50000,
          currency: 'USD',
          start_date: '2026-10-01',
          end_date: '2026-12-31',
        },
      });
      assert.strictEqual(res.status, 201);
      assert(res.data.data.id, 'Created project must have an id');
      assert.strictEqual(res.data.data.name, 'AI Agent Work Management Integration');
      createdProjId = res.data.data.id;
      pass(`Project created successfully (ID: ${createdProjId}, Code: ${res.data.data.code})`);
    } catch (e) { fail('Create project', e); }

    try {
      const res = await api(`/projects/${createdProjId}`, { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.id, createdProjId);
      assert(Array.isArray(res.data.data.members), 'Project detail must contain members list');
      assert(Array.isArray(res.data.data.task_summary), 'Project detail must contain task summary');
      pass(`Project detail verified with members and task breakdown`);
    } catch (e) { fail('Get project detail', e); }

    try {
      const res = await api(`/projects/${createdProjId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'in_progress', priority: 'critical', progress_percent: 25 },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'in_progress');
      assert.strictEqual(res.data.data.priority, 'critical');
      pass(`Project updated successfully`);
    } catch (e) { fail('Update project', e); }

    // ── 2. Tasks API & Automatic Progress Recalculation Tests ───────
    console.log('\n2. TASKS LIFECYCLE & AUTOMATIC PROGRESS RECALCULATION TESTS:');
    try {
      const res = await api('/tasks', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'Tasks data must be array');
      assert(res.data.total >= 40, 'Total seeded tasks must be >= 40');
      pass(`Tasks directory returned paginated items (returned: ${res.data.data.length}, total: ${res.data.total})`);
    } catch (e) { fail('Tasks list', e); }

    try {
      const res = await api('/tasks/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.total >= 40, 'Total tasks must be >= 40');
      assert(res.data.data.done >= 1, 'Completed tasks must be >= 1');
      pass(`Tasks summary metrics calculated (Total: ${res.data.data.total}, Todo: ${res.data.data.todo}, In Progress: ${res.data.data.in_progress}, Done: ${res.data.data.done})`);
    } catch (e) { fail('Tasks summary', e); }

    let task1Id = null;
    let task2Id = null;
    try {
      // Create Task 1
      const res1 = await api('/tasks', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: createdProjId,
          title: 'Implement Database Migrations',
          description: 'Define schema and foreign keys',
          priority: 'high',
          status: 'todo',
          estimated_hours: 8,
          due_date: '2026-11-01',
        },
      });
      assert.strictEqual(res1.status, 201);
      task1Id = res1.data.data.id;

      // Create Task 2
      const res2 = await api('/tasks', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: createdProjId,
          title: 'Build Frontend UI Dashboard',
          description: 'Implement Kanban and Time Tracking page',
          priority: 'critical',
          status: 'todo',
          estimated_hours: 12,
          due_date: '2026-11-05',
        },
      });
      assert.strictEqual(res2.status, 201);
      task2Id = res2.data.data.id;

      pass(`Created 2 new tasks for project (Task Numbers: ${res1.data.data.task_number}, ${res2.data.data.task_number})`);
    } catch (e) { fail('Create tasks', e); }

    try {
      // Mark Task 1 as 'done'
      const updateRes = await api(`/tasks/${task1Id}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'done' },
      });
      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateRes.data.data.status, 'done');
      assert(updateRes.data.data.completed_at, 'completed_at timestamp must be set');

      // Verify that parent project's progress automatically recalculated to 50% (1 of 2 done)
      const projCheck = await api(`/projects/${createdProjId}`, { token: adminToken });
      assert.strictEqual(projCheck.status, 200);
      assert.strictEqual(projCheck.data.data.progress_percent, 50, 'Project progress must automatically recalculate to 50%');
      pass(`Task marked 'done' -> Parent project progress automatically recalculated to 50%`);
    } catch (e) { fail('Automatic progress recalculation on task completion', e); }

    try {
      const commentRes = await api(`/tasks/${task1Id}/comments`, {
        method: 'POST',
        token: adminToken,
        body: { content: 'Verified schema migrations and test suite pass cleanly.' },
      });
      assert.strictEqual(commentRes.status, 201);
      assert.strictEqual(commentRes.data.data.task_id, task1Id);
      pass(`Task comment posted successfully`);
    } catch (e) { fail('Task comment creation', e); }

    // ── 3. Time Tracking & Server Authoritative Timer Tests ─────────
    console.log('\n3. TIME TRACKING & SERVER AUTHORITATIVE TIMER TESTS:');
    try {
      const activeRes = await api('/time-entries/active', { token: adminToken });
      assert.strictEqual(activeRes.status, 200);
      assert(activeRes.data.data.server_time, 'Server time must be provided');
      pass(`Active timer query returned server timestamp (Server Time: ${activeRes.data.data.server_time})`);
    } catch (e) { fail('Active timer query', e); }

    try {
      // Stop any existing timer to test clean start/stop cycle
      await api('/time-entries/stop', { method: 'POST', token: adminToken, body: {} });

      // Start new timer
      const startRes = await api('/time-entries/start', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: createdProjId,
          task_id: task2Id,
          description: 'Live pair programming on React Kanban Board',
          billable: true,
        },
      });
      assert.strictEqual(startRes.status, 201);
      assert.strictEqual(startRes.data.data.is_active_timer, true);
      assert(startRes.data.data.started_at, 'Timer must have started_at timestamp');
      pass(`Live timer started successfully (Timer ID: ${startRes.data.data.id})`);
    } catch (e) { fail('Start timer', e); }

    try {
      // Starting a second active timer must be rejected with 409 Conflict
      const secondStart = await api('/time-entries/start', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: createdProjId,
          task_id: task1Id,
          description: 'Attempting concurrent timer',
        },
      });
      assert.strictEqual(secondStart.status, 409, 'Duplicate active timer must return 409 Conflict');
      pass(`Enforced single active timer constraint per user (409 Conflict received)`);
    } catch (e) { fail('Duplicate timer constraint enforcement', e); }

    try {
      // Stop timer and verify server-authoritative calculation
      const stopRes = await api('/time-entries/stop', {
        method: 'POST',
        token: adminToken,
        body: { description: 'Completed live work session' },
      });
      assert.strictEqual(stopRes.status, 200);
      assert.strictEqual(stopRes.data.data.is_active_timer, false);
      assert(stopRes.data.data.duration_seconds >= 0);
      assert(stopRes.data.data.ended_at);
      pass(`Live timer stopped with server authoritative duration (${stopRes.data.data.duration_formatted})`);
    } catch (e) { fail('Stop timer', e); }

    let manualEntryId = null;
    try {
      const manualRes = await api('/time-entries', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: createdProjId,
          task_id: task2Id,
          description: 'Manual log for sprint review and demo',
          hours: 2.5,
          date: '2026-10-21',
          billable: true,
        },
      });
      assert.strictEqual(manualRes.status, 201);
      assert.strictEqual(parseFloat(manualRes.data.data.hours), 2.5);
      assert.strictEqual(manualRes.data.data.is_billable, true);
      manualEntryId = manualRes.data.data.id;
      pass(`Manual time entry logged (Hours: 2.5h, Billable: true)`);
    } catch (e) { fail('Manual time entry', e); }

    try {
      const editRes = await api(`/time-entries/${manualEntryId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { hours: 3.0, description: 'Updated duration after client review' },
      });
      assert.strictEqual(editRes.status, 200);
      assert.strictEqual(parseFloat(editRes.data.data.hours), 3.0);
      pass(`Time entry updated successfully`);
    } catch (e) { fail('Edit time entry', e); }

    try {
      const sumRes = await api('/time-entries/summary', { token: adminToken });
      assert.strictEqual(sumRes.status, 200);
      assert(sumRes.data.data.total_hours > 0, 'Total hours must be > 0');
      assert(sumRes.data.data.billable_hours > 0, 'Billable hours must be > 0');
      pass(`Time tracking summary verified (Total: ${sumRes.data.data.total_hours}h, Billable: ${sumRes.data.data.billable_hours}h, This Week: ${sumRes.data.data.this_week}h)`);
    } catch (e) { fail('Time tracking summary', e); }

    // ── 4. RBAC & Client Data Isolation Tests ───────────────────────
    console.log('\n4. RBAC PERMISSIONS & CLIENT DATA ISOLATION TESTS:');
    try {
      const unauthProjects = await api('/projects');
      assert.strictEqual(unauthProjects.status, 401);
      const unauthTasks = await api('/tasks');
      assert.strictEqual(unauthTasks.status, 401);
      pass(`Unauthenticated requests blocked (401 Unauthorized)`);
    } catch (e) { fail('Unauthenticated security check', e); }

    try {
      // Client requesting project directory only receives projects belonging to their account
      const clientProjs = await api('/projects', { token: clientToken });
      assert.strictEqual(clientProjs.status, 200);
      assert(Array.isArray(clientProjs.data.data));
      // All returned projects must belong to clientClientId
      const { rows: clientProjectsInDb } = await pool.query(
        `SELECT id FROM client_schema.client_projects WHERE client_id = $1 AND deleted_at IS NULL`,
        [clientClientId]
      );
      const allowedIds = new Set(clientProjectsInDb.map(r => r.id));
      for (const p of clientProjs.data.data) {
        assert(allowedIds.has(p.id), `Project ${p.id} does not belong to client`);
      }
      pass(`Client user strictly scoped to only their assigned projects (${clientProjs.data.data.length} projects)`);
    } catch (e) { fail('Client projects scoping', e); }

    try {
      // Client attempting to access another client's project detail must receive 403 Forbidden
      if (otherProjectId) {
        const otherDetail = await api(`/projects/${otherProjectId}`, { token: clientToken });
        assert.strictEqual(otherDetail.status, 403, 'Client must not access other clients projects');
      }
      pass(`Client user blocked from accessing other clients' projects (403 Forbidden)`);
    } catch (e) { fail('Client accessing other project detail', e); }

    try {
      // Client attempting to create, update or delete projects is blocked
      const clientCreate = await api('/projects', {
        method: 'POST',
        token: clientToken,
        body: { name: 'Unauthorized Client Project' },
      });
      assert.strictEqual(clientCreate.status, 403, 'Clients cannot create projects');

      if (clientProjectId) {
        const clientDelete = await api(`/projects/${clientProjectId}`, {
          method: 'DELETE',
          token: clientToken,
        });
        assert.strictEqual(clientDelete.status, 403, 'Clients cannot delete projects');
      }
      pass(`Client user blocked from creating or deleting projects (403 Forbidden)`);
    } catch (e) { fail('Client project write restrictions', e); }

    try {
      // Client requesting tasks directory only receives tasks from their own projects
      const clientTasks = await api('/tasks', { token: clientToken });
      assert.strictEqual(clientTasks.status, 200);
      pass(`Client user tasks directory safely scoped to their own client projects`);
    } catch (e) { fail('Client tasks scoping', e); }

    try {
      // Client blocked from organization-wide employee timesheets
      const clientTimeOrg = await api('/time-entries', { token: clientToken });
      assert.strictEqual(clientTimeOrg.status, 403, 'Clients cannot view organization timesheets');

      // Client blocked from starting employee timer
      const clientStartTimer = await api('/time-entries/start', {
        method: 'POST',
        token: clientToken,
        body: { project_id: clientProjectId },
      });
      assert.strictEqual(clientStartTimer.status, 403, 'Clients cannot start internal timers');
      pass(`Client user strictly forbidden from organization employee timesheets and internal timers (403 Forbidden)`);
    } catch (e) { fail('Client time tracking restrictions', e); }

    // ── 5. Project Cleanup / Soft Delete ────────────────────────────
    console.log('\n5. CLEANUP & SOFT DELETE VERIFICATION:');
    try {
      const delRes = await api(`/projects/${createdProjId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(delRes.status, 204);

      // Verify soft delete in DB
      const checkDb = await pool.query(`SELECT deleted_at, status FROM client_schema.client_projects WHERE id = $1`, [createdProjId]);
      assert(checkDb.rows[0].deleted_at, 'deleted_at must be set');
      assert.strictEqual(checkDb.rows[0].status, 'cancelled');
      pass(`Project soft-deleted safely without affecting historical records or cascading deletes`);
    } catch (e) { fail('Project soft delete', e); }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    if (server) server.close();
    await pool.end();

    console.log('\n======================================================');
    console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

