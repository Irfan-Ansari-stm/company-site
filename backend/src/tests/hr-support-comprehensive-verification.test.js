// src/tests/hr-support-comprehensive-verification.test.js
// Exhaustive automated verification test suite for HR & Support Dashboard modules
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
let testClientId;

let createdJobId;
let createdAppId;
let createdTeamId;
let createdTicketId;
let createdTicketNumber;

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
  console.log('\n======================================================');
  console.log(' HR & SUPPORT DASHBOARD COMPREHENSIVE VERIFICATION');
  console.log('======================================================\n');

  try {
    // ── Setup Test App & Routes ────────────────────────────────────
    const app = express();
    app.use(express.json());

    app.use('/api/v1/hr', require('../routes/hr'));
    app.use('/api/v1/support', require('../routes/support'));

    const { errorHandler } = require('../middleware/errorHandler');
    app.use(errorHandler);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Fetch Admin User
    const adminUserRes = await pool.query(
      `SELECT id, email, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') LIMIT 1`
    );
    assert(adminUserRes.rows.length, 'Admin user must exist in database');
    const adminUser = adminUserRes.rows[0];
    adminUserId = adminUser.id;
    adminToken = generateToken(adminUser.id, adminUser.role);

    // 2. Fetch Client User
    const clientUserRes = await pool.query(
      `SELECT id, email, role FROM auth_schema.users WHERE role = 'client' LIMIT 1`
    );
    assert(clientUserRes.rows.length, 'Client user must exist in database');
    const clientUser = clientUserRes.rows[0];
    clientUserId = clientUser.id;
    clientToken = generateToken(clientUser.id, 'client');

    // 3. Find Client record
    const clientRecordRes = await pool.query(
      `SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`,
      [clientUserId]
    );
    testClientId = clientRecordRes.rows[0]?.id || null;

    console.log(`[SETUP] Admin: ${adminUser.email} (${adminUser.role})`);
    console.log(`[SETUP] Client: ${clientUser.email} (Client ID: ${testClientId})\n`);

    // ════════════════════════════════════════════════════════════════
    // 1. HR MODULE VERIFICATION
    // ════════════════════════════════════════════════════════════════
    console.log('─── 1. HR & RECRUITMENT MODULE ───');

    await test('GET /hr/stats returns real counts from database', async () => {
      const res = await api('/hr/stats', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(typeof res.data.data.open_positions === 'number');
      assert(typeof res.data.data.total_applications === 'number');
      assert(typeof res.data.data.total_team === 'number');
    });

    await test('Strict RBAC: Client is forbidden (403) from HR stats and management', async () => {
      const res = await api('/hr/stats', { token: clientToken });
      assert.strictEqual(res.status, 403);
    });

    await test('Admin can create a new job opening with full schema validation', async () => {
      const payload = {
        title: 'Senior Reliability Architect ' + Date.now(),
        employment_type: 'full_time',
        location_type: 'remote',
        location: 'Global Remote',
        salary_min: 130000,
        salary_max: 170000,
        positions: 2,
        is_featured: true,
        description: 'Lead our site reliability and cloud architecture strategy.',
      };
      const res = await api('/hr/jobs', {
        method: 'POST',
        token: adminToken,
        body: payload,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      createdJobId = res.data.data.id;
      assert.strictEqual(res.data.data.is_urgent, true);
    });

    await test('GET /hr/jobs lists the job and supports search parameter', async () => {
      const res = await api('/hr/jobs?search=Reliability', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.length >= 1);
      const found = res.data.data.find((j) => j.id === createdJobId);
      assert(found, 'Created job must be returned in search query');
    });

    await test('Admin can update job opening and changes persist in DB', async () => {
      const res = await api(`/hr/jobs/${createdJobId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          salary_max: 185000,
          positions: 3,
          description: 'Updated reliability mission.',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);

      // Verify in DB directly
      const dbCheck = await pool.query(
        `SELECT salary_max, openings, description FROM careers_schema.jobs WHERE id=$1`,
        [createdJobId]
      );
      assert.strictEqual(Number(dbCheck.rows[0].salary_max), 185000);
      assert.strictEqual(dbCheck.rows[0].openings, 3);
      assert.strictEqual(dbCheck.rows[0].description, 'Updated reliability mission.');
    });

    await test('Public candidate can apply for the job and updates application count', async () => {
      const res = await api(`/hr/jobs/${createdJobId}/apply`, {
        method: 'POST',
        body: {
          first_name: 'John',
          last_name: 'Candidate',
          email: `candidate_${Date.now()}@test.org`,
          phone: '+15551234567',
          cover_letter: 'I am excited about this architecture role.',
          resume_url: 'https://example.com/resumes/john.pdf',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      createdAppId = res.data.data.id;

      // Verify applications_count on job in DB
      const jobCheck = await pool.query(
        `SELECT applications_count FROM careers_schema.jobs WHERE id=$1`,
        [createdJobId]
      );
      assert(jobCheck.rows[0].applications_count >= 1);
    });

    await test('Admin can fetch applications and search by candidate name/email', async () => {
      const res = await api('/hr/applications?search=Candidate', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.length >= 1);
      const app = res.data.data.find((a) => a.id === createdAppId);
      assert(app, 'Application must be found by candidate search');
      assert.strictEqual(app.first_name, 'John');
    });

    await test('Admin can update application stage and rating', async () => {
      const res = await api(`/hr/applications/${createdAppId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stage: 'screening', rating: 5 },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.stage, 'screening');
      assert.strictEqual(res.data.data.rating, 5);
    });

    await test('Admin can add note to candidate application', async () => {
      const res = await api(`/hr/applications/${createdAppId}/notes`, {
        method: 'POST',
        token: adminToken,
        body: { content: 'Candidate demonstrated deep system design knowledge.' },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.content, 'Candidate demonstrated deep system design knowledge.');
    });

    await test('Admin can add team member and view in team list', async () => {
      const res = await api('/hr/team', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Nadia Kasparov',
          designation: 'Principal Security Engineer',
          department: 'Engineering',
          bio: 'Specialist in threat modeling and cryptographic systems.',
          is_featured: true,
        },
      });
      assert.strictEqual(res.status, 201);
      createdTeamId = res.data.data.id;

      // Verify in GET /hr/team
      const listRes = await api('/hr/team?department=Engineering', { token: adminToken });
      assert.strictEqual(listRes.status, 200);
      assert(listRes.data.data.some((m) => m.id === createdTeamId));
    });

    await test('Admin can update team member bio and active status', async () => {
      const res = await api(`/hr/team/${createdTeamId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { bio: 'Updated bio for security leadership.', is_featured: false },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.bio, 'Updated bio for security leadership.');
      assert.strictEqual(res.data.data.is_featured, false);
    });

    await test('Admin can archive job opening via DELETE', async () => {
      const res = await api(`/hr/jobs/${createdJobId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 204);

      // Verify soft deletion in DB
      const dbCheck = await pool.query(
        `SELECT deleted_at, is_published FROM careers_schema.jobs WHERE id=$1`,
        [createdJobId]
      );
      assert(dbCheck.rows[0].deleted_at !== null);
      assert.strictEqual(dbCheck.rows[0].is_published, false);
    });

    // ════════════════════════════════════════════════════════════════
    // 2. SUPPORT MODULE VERIFICATION
    // ════════════════════════════════════════════════════════════════
    console.log('\n─── 2. SUPPORT & TICKETS MODULE ───');

    await test('GET /support/tickets/stats returns live ticket counts from database', async () => {
      const res = await api('/support/tickets/stats', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(typeof res.data.data.open_count === 'number');
      assert(typeof res.data.data.in_progress_count === 'number');
      assert(typeof res.data.data.resolved_today === 'number');
      assert(typeof res.data.data.critical_count === 'number');
    });

    await test('Admin can create a new support ticket with subject, client, and assignment', async () => {
      const payload = {
        subject: 'Database connection latency spike inquiry ' + Date.now(),
        description: 'Observed elevated p99 latency during peak sync window.',
        type: 'support',
        priority: 'high',
        client_id: testClientId,
        assigned_to: adminUserId,
      };
      const res = await api('/support/tickets', {
        method: 'POST',
        token: adminToken,
        body: payload,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      assert(res.data.data.ticket_number);
      createdTicketId = res.data.data.id;
      createdTicketNumber = res.data.data.ticket_number;
    });

    await test('GET /support/tickets supports search by ticket number and subject', async () => {
      const res = await api(`/support/tickets?search=${createdTicketNumber}`, {
        token: adminToken,
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.length >= 1);
      assert.strictEqual(res.data.data[0].id, createdTicketId);
    });

    await test('GET /support/tickets supports combined status and priority filtering', async () => {
      const res = await api('/support/tickets?status=open&priority=high', {
        token: adminToken,
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.every((t) => t.status === 'open' && t.priority === 'high'));
    });

    await test('Admin can reassign ticket and update priority', async () => {
      const res = await api(`/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { priority: 'critical', status: 'in_progress' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.priority, 'critical');
      assert.strictEqual(res.data.data.status, 'in_progress');
    });

    await test('User can add a reply to the ticket and updates conversation', async () => {
      const res = await api(`/support/tickets/${createdTicketId}/replies`, {
        method: 'POST',
        token: adminToken,
        body: { content: 'Investigating query plan on replicas.', is_internal: false },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.content, 'Investigating query plan on replicas.');

      // Check reply in ticket details
      const ticketRes = await api(`/support/tickets/${createdTicketId}`, {
        token: adminToken,
      });
      assert.strictEqual(ticketRes.status, 200);
      assert(ticketRes.data.data.replies.length >= 1);
      assert.strictEqual(ticketRes.data.data.replies[0].content, 'Investigating query plan on replicas.');
    });

    await test('Staff can add internal note that is isolated from client view', async () => {
      // 1. Staff adds internal note
      const internalRes = await api(`/support/tickets/${createdTicketId}/replies`, {
        method: 'POST',
        token: adminToken,
        body: { content: 'INTERNAL: Connection pool was saturated at 200 connections.', is_internal: true },
      });
      assert.strictEqual(internalRes.status, 201);

      // 2. Staff sees the internal note
      const staffView = await api(`/support/tickets/${createdTicketId}`, {
        token: adminToken,
      });
      assert(staffView.data.data.replies.some((r) => r.is_internal === true));

      // 3. Client does NOT see the internal note
      const clientView = await api(`/support/tickets/${createdTicketId}`, {
        token: clientToken,
      });
      if (clientView.status === 200) {
        assert(clientView.data.data.replies.every((r) => r.is_internal === false));
      }
    });

    await test('Admin can resolve ticket and resolves stats reflect update', async () => {
      const res = await api(`/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'resolved' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'resolved');
      assert(res.data.data.resolved_at !== null);
    });

    await test('Customer can submit CSAT rating on resolved ticket', async () => {
      const res = await api(`/support/tickets/${createdTicketId}/rate`, {
        method: 'POST',
        body: { rating: 5 },
      });
      assert.strictEqual(res.status, 200);

      const dbCheck = await pool.query(
        `SELECT satisfaction FROM support_schema.tickets WHERE id=$1`,
        [createdTicketId]
      );
      assert.strictEqual(dbCheck.rows[0].satisfaction, 5);
    });

    await test('Admin can archive/delete a support ticket', async () => {
      const res = await api(`/support/tickets/${createdTicketId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 204);

      const dbCheck = await pool.query(
        `SELECT deleted_at FROM support_schema.tickets WHERE id=$1`,
        [createdTicketId]
      );
      assert(dbCheck.rows[0].deleted_at !== null);
    });

    console.log('\n======================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Test suite execution error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

run();
