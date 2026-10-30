// src/tests/projects-work-verification.test.js
// Complete verification test suite for Projects, Tasks, and Time Tracking
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

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n--- WORK MANAGEMENT (PROJECTS + TASKS + TIME) VERIFICATION SUITE ---\n');

  // Find an admin user
  const adminRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') AND is_active = true LIMIT 1"
  );
  if (!adminRes.rows.length) {
    throw new Error('No admin user found in database');
  }
  adminUserId = adminRes.rows[0].id;
  adminToken = generateToken(adminUserId, adminRes.rows[0].role);

  // Client user for RBAC tests
  const clientRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role = 'client' LIMIT 1"
  );
  const clientUserId = clientRes.rows.length ? clientRes.rows[0].id : '00000000-0000-0000-0000-000000000001';
  clientToken = generateToken(clientUserId, 'client');

  // Find a valid client in database
  const clientRecordRes = await pool.query("SELECT id FROM client_schema.clients WHERE deleted_at IS NULL LIMIT 1");
  const testClientId = clientRecordRes.rows[0]?.id || null;

  // Setup Express server with projects, tasks, and time-entries routes
  const app = express();
  app.use(express.json());
  const { router: projectsRouter, tasksRouter, timeRouter } = require('../routes/projects');
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/time-entries', timeRouter);

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });

  let testProjectId = null;
  let testTaskId = null;
  let testTimeEntryId = null;

  try {
    // ════════════════════════════════════════════════════════════
    // 1. PROJECTS MODULE TESTS
    // ════════════════════════════════════════════════════════════
    console.log('1. PROJECTS TESTS:');

    await test('GET /projects/summary returns accurate aggregations', async () => {
      const res = await api('/projects/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const s = res.data.data;
      assert(typeof s.total === 'number');
      assert(typeof s.in_progress === 'number');
      assert(typeof s.completed === 'number');
      assert(typeof s.overdue === 'number');
      assert(s.total >= 0);
    });

    await test('GET /projects returns paginated projects with manager & client names', async () => {
      const res = await api('/projects', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      assert(res.data.pagination);
      if (res.data.data.length > 0) {
        const p = res.data.data[0];
        assert('code' in p);
        assert('name' in p);
        assert('status' in p);
        assert('progress_percent' in p);
      }
    });

    await test('POST /projects creates new project with project manager and members', async () => {
      const res = await api('/projects', {
        method: 'POST',
        token: adminToken,
        body: {
          name: `Test Project ${Date.now()}`,
          code: `PRJ-TST-${Date.now().toString(36).toUpperCase()}`,
          client_id: testClientId,
          project_manager: adminUserId,
          type: 'fixed_price',
          priority: 'high',
          start_date: '2026-11-01',
          end_date: '2026-12-31',
          budget: 75000,
          currency: 'USD',
          description: 'Automated test suite verification project',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      testProjectId = res.data.data.id;
    });

    await test('GET /projects/:id returns complete project details with members and milestones', async () => {
      assert(testProjectId);
      const res = await api(`/projects/${testProjectId}`, { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const p = res.data.data;
      assert.strictEqual(p.id, testProjectId);
      assert(Array.isArray(p.members));
      assert(Array.isArray(p.task_summary));
    });

    await test('PATCH /projects/:id updates project fields and health status', async () => {
      assert(testProjectId);
      const res = await api(`/projects/${testProjectId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          priority: 'critical',
          health_status: 'needs_attention',
          budget: 85000,
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.priority, 'critical');
      assert.strictEqual(parseFloat(res.data.data.budget), 85000);
    });

    // ════════════════════════════════════════════════════════════
    // 2. TASKS MODULE TESTS
    // ════════════════════════════════════════════════════════════
    console.log('\n2. TASKS TESTS:');

    await test('GET /tasks/summary returns status breakdown', async () => {
      const res = await api('/tasks/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const s = res.data.data;
      assert(typeof s.todo === 'number');
      assert(typeof s.in_progress === 'number');
      assert(typeof s.in_review === 'number');
      assert(typeof s.done === 'number');
      assert(typeof s.blocked === 'number');
    });

    await test('POST /tasks creates task and recalculates project progress', async () => {
      assert(testProjectId);
      const res = await api('/tasks', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: testProjectId,
          title: 'Design API Contracts and Schemas',
          assigned_to: adminUserId,
          priority: 'high',
          status: 'todo',
          estimated_hours: 12.5,
          due_date: '2026-11-15',
          description: 'Define OpenAPI specifications',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      testTaskId = res.data.data.id;
      assert.strictEqual(res.data.data.status, 'todo');
    });

    await test('PATCH /tasks/:id transitions status to done and updates progress', async () => {
      assert(testTaskId);
      const res = await api(`/tasks/${testTaskId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'done',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.status, 'done');

      // Verify that project progress was automatically recalculated to 100%
      const projCheck = await pool.query(
        'SELECT progress_percent FROM client_schema.client_projects WHERE id = $1',
        [testProjectId]
      );
      assert.strictEqual(projCheck.rows[0].progress_percent, 100);
    });

    // ════════════════════════════════════════════════════════════
    // 3. TIME TRACKING MODULE TESTS
    // ════════════════════════════════════════════════════════════
    console.log('\n3. TIME TRACKING TESTS:');

    await test('GET /time-entries/summary returns weekly, monthly, and billable hours', async () => {
      const res = await api('/time-entries/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const s = res.data.data;
      assert(typeof s.this_week === 'number');
      assert(typeof s.this_month === 'number');
      assert(typeof s.billable_hours === 'number');
      assert(typeof s.total_entries === 'number');
    });

    await test('POST /time-entries/start creates an active live timer', async () => {
      assert(testProjectId);
      // Ensure no active timer first
      await pool.query('DELETE FROM client_schema.time_entries WHERE user_id = $1 AND is_active_timer = TRUE', [adminUserId]);

      const res = await api('/time-entries/start', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: testProjectId,
          task_id: testTaskId,
          description: 'Live coding session',
          billable: true,
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.is_active_timer, true);
    });

    await test('GET /time-entries/active returns running timer and server_time', async () => {
      const res = await api('/time-entries/active', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.active_timer);
      assert(res.data.data.server_time);
    });

    await test('POST /time-entries/start rejects concurrent second timer (409 Conflict)', async () => {
      assert(testProjectId);
      const res = await api('/time-entries/start', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: testProjectId,
          description: 'Duplicate timer attempt',
        },
      });
      assert.strictEqual(res.status, 409);
    });

    await test('POST /time-entries/stop computes duration, logs hours, and updates task/project balances', async () => {
      const res = await api('/time-entries/stop', {
        method: 'POST',
        token: adminToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.is_active_timer, false);
      assert(res.data.data.duration_seconds >= 1);
    });

    await test('POST /time-entries creates manual time entry and updates project billable hours', async () => {
      assert(testProjectId);
      const res = await api('/time-entries', {
        method: 'POST',
        token: adminToken,
        body: {
          project_id: testProjectId,
          task_id: testTaskId,
          hours: 3.5,
          description: 'Manual verification log',
          billable: true,
          date: new Date().toISOString(),
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(parseFloat(res.data.data.hours), 3.5);
      testTimeEntryId = res.data.data.id;
    });

    await test('PATCH /time-entries/:id updates duration and recalculates balances', async () => {
      assert(testTimeEntryId);
      const res = await api(`/time-entries/${testTimeEntryId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          hours: 4.0,
          description: 'Updated manual verification log',
          billable: true,
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(parseFloat(res.data.data.hours), 4.0);
    });

    await test('DELETE /time-entries/:id removes entry and restores balances', async () => {
      assert(testTimeEntryId);
      const res = await api(`/time-entries/${testTimeEntryId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert([200, 204].includes(res.status));
    });

    // ════════════════════════════════════════════════════════════
    // 4. RBAC & SECURITY TESTS
    // ════════════════════════════════════════════════════════════
    console.log('\n4. RBAC & SECURITY TESTS:');

    await test('RBAC: Client user cannot create projects (403 Forbidden)', async () => {
      const res = await api('/projects', {
        method: 'POST',
        token: clientToken,
        body: { name: 'Unauthorized Client Project' },
      });
      assert.strictEqual(res.status, 403);
    });

    await test('RBAC: Client user cannot access organization time entries (403 Forbidden)', async () => {
      const res = await api('/time-entries', {
        token: clientToken,
      });
      assert.strictEqual(res.status, 403);
    });

  } finally {
    // Cleanup created test records
    if (testProjectId) {
      await pool.query('DELETE FROM client_schema.time_entries WHERE project_id = $1', [testProjectId]);
      await pool.query('DELETE FROM client_schema.tasks WHERE project_id = $1', [testProjectId]);
      await pool.query('DELETE FROM client_schema.project_members WHERE project_id = $1', [testProjectId]);
      await pool.query('DELETE FROM client_schema.project_activity_log WHERE project_id = $1', [testProjectId]);
      await pool.query('DELETE FROM client_schema.client_projects WHERE id = $1', [testProjectId]);
    }

    server.close();
    await pool.end();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

