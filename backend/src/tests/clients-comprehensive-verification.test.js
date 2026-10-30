// src/tests/clients-comprehensive-verification.test.js
// Complete verification test suite for Clients module
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
  console.log('\n--- CLIENTS COMPREHENSIVE VERIFICATION SUITE ---\n');

  // Find an admin user
  const adminRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') AND is_active = true LIMIT 1"
  );
  if (!adminRes.rows.length) {
    throw new Error('No admin user found in database');
  }
  adminToken = generateToken(adminRes.rows[0].id, adminRes.rows[0].role);

  // Find or mock a client user for RBAC test
  const clientRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role = 'client' LIMIT 1"
  );
  const clientUserId = clientRes.rows.length ? clientRes.rows[0].id : '00000000-0000-0000-0000-000000000001';
  clientToken = generateToken(clientUserId, 'client');

  // Setup Express server with clients route
  const app = express();
  app.use(express.json());
  const clientsRouter = require('../routes/clients');
  app.use('/api/v1/clients', clientsRouter);

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1/clients`;
      resolve();
    });
  });

  let createdClientId = null;
  let testContactPerson = `TestContact_${Date.now()}`;
  let testCompanyName = `Test Enterprise ${Date.now()}`;
  let testEmail = `enterprise_${Date.now()}@testclient.com`;

  try {
    // 1. GET Overview metrics
    await test('GET /overview returns calculated real stats', async () => {
      const res = await api('/overview', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const stats = res.data.data;
      assert(typeof stats.total === 'number');
      assert(typeof stats.active === 'number');
      assert(typeof stats.companies === 'number');
      assert(typeof stats.individuals === 'number');
      assert(typeof stats.new_this_month === 'number');
      assert(stats.total >= 0);
    });

    // 2. GET Client listing with pagination
    await test('GET / returns paginated client records with project counts', async () => {
      const res = await api('', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      assert(res.data.pagination);
      assert(typeof res.data.pagination.total === 'number');
      if (res.data.data.length > 0) {
        const client = res.data.data[0];
        assert('project_count' in client);
        assert('type' in client);
        assert('status' in client);
      }
    });

    // 3. GET Account managers
    await test('GET /account-managers returns staff members for assignment', async () => {
      const res = await api('/account-managers', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      for (const user of res.data.data) {
        assert.notStrictEqual(user.role, 'client');
      }
    });

    // 4. GET CSV Export
    await test('GET /export produces well-formed CSV download', async () => {
      const res = await api('/export', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(typeof res.data === 'string');
      assert(res.data.includes('"Client ID"'));
      assert(res.data.includes('"Name"'));
      assert(res.data.includes('"Status"'));
    });

    // 5. POST Create client with contact person
    await test('POST / creates client with primary contact and audit log', async () => {
      const res = await api('', {
        method: 'POST',
        token: adminToken,
        body: {
          name: testCompanyName,
          company_name: testCompanyName,
          type: 'company',
          industry: 'technology',
          email: testEmail,
          phone: '+1 555-0199',
          website: 'https://testclient.example.com',
          country: 'United States',
          city: 'San Francisco',
          contact_person: testContactPerson,
          status: 'active',
          description: 'Created during comprehensive verification run',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.id);
      createdClientId = res.data.data.id;
      assert.strictEqual(res.data.data.company_name, testCompanyName);

      // Verify contact was automatically created
      const ctCheck = await pool.query(
        'SELECT * FROM client_schema.client_contacts WHERE client_id = $1',
        [createdClientId]
      );
      assert(ctCheck.rows.length >= 1);
      assert(ctCheck.rows[0].is_primary === true);

      // Verify audit log
      const auditCheck = await pool.query(
        "SELECT * FROM system_schema.audit_logs WHERE action = 'CREATE' AND resource_type = 'client' AND resource_id = $1",
        [createdClientId]
      );
      assert(auditCheck.rows.length >= 1);
    });

    // 6. GET /:id Client detail
    await test('GET /:id returns complete client profile with related entities', async () => {
      assert(createdClientId);
      const res = await api(`/${createdClientId}`, { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const client = res.data.data;
      assert.strictEqual(client.id, createdClientId);
      assert(Array.isArray(client.contacts));
      assert(Array.isArray(client.projects));
      assert(Array.isArray(client.recent_invoices));
      assert(Array.isArray(client.recent_tickets));
      assert(Array.isArray(client.notes));
    });

    // 7. GET / with search filter
    await test('GET /?search= filters properly by company or contact', async () => {
      const res = await api(`?search=${encodeURIComponent(testCompanyName)}`, { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.length >= 1);
      assert(res.data.data.some(c => c.id === createdClientId));
    });

    // 8. GET / with type and status filters
    await test('GET /?type=company&status=active returns matching records', async () => {
      const res = await api('?type=company&status=active', { token: adminToken });
      assert.strictEqual(res.status, 200);
      for (const c of res.data.data) {
        assert.strictEqual(c.type, 'company');
        assert.strictEqual(c.status, 'active');
      }
    });

    // 9. GET / with safe sorting
    await test('GET /?sort_by=name&sort_dir=ASC sorts alphabetically', async () => {
      const res = await api('?sort_by=name&sort_dir=ASC&limit=5', { token: adminToken });
      assert.strictEqual(res.status, 200);
      if (res.data.data.length >= 2) {
        const first = (res.data.data[0].name || res.data.data[0].company_name || '').toLowerCase();
        const second = (res.data.data[1].name || res.data.data[1].company_name || '').toLowerCase();
        assert(first.localeCompare(second) <= 0);
      }
    });

    // 10. PATCH /:id Update client
    await test('PATCH /:id updates client fields and logs audit event', async () => {
      const updatedIndustry = 'finance';
      const updatedPhone = '+1 555-9999';
      const res = await api(`/${createdClientId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          industry: updatedIndustry,
          phone: updatedPhone,
          status: 'inactive',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.industry, updatedIndustry);
      assert.strictEqual(res.data.data.phone, updatedPhone);
      assert.strictEqual(res.data.data.status, 'inactive');

      // Verify audit log
      const auditCheck = await pool.query(
        "SELECT * FROM system_schema.audit_logs WHERE action = 'UPDATE' AND resource_type = 'client' AND resource_id = $1",
        [createdClientId]
      );
      assert(auditCheck.rows.length >= 1);
    });

    // 11. POST /:id/contacts Add secondary contact
    await test('POST /:id/contacts adds a contact to the client', async () => {
      const res = await api(`/${createdClientId}/contacts`, {
        method: 'POST',
        token: adminToken,
        body: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'janedoe@testclient.example.com',
          phone: '+1 555-8888',
          designation: 'VP of Technology',
          is_primary: false,
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.first_name, 'Jane');
    });

    // 12. POST /:id/notes Add note
    await test('POST /:id/notes creates note for client', async () => {
      const res = await api(`/${createdClientId}/notes`, {
        method: 'POST',
        token: adminToken,
        body: {
          content: 'Discussed Q4 expansion roadmap.',
          is_pinned: true,
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.content, 'Discussed Q4 expansion roadmap.');
    });

    // 13. DELETE /:id Soft deletes client
    await test('DELETE /:id soft deletes / archives client', async () => {
      const res = await api(`/${createdClientId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert([200, 204].includes(res.status));

      // Verify in DB that it is soft-deleted
      const check = await pool.query(
        'SELECT status, is_active, deleted_at FROM client_schema.clients WHERE id = $1',
        [createdClientId]
      );
      assert.strictEqual(check.rows[0].status, 'archived');
      assert.strictEqual(check.rows[0].is_active, false);
      assert(check.rows[0].deleted_at !== null);
    });

    // 14. RBAC security: Client role cannot access overview or list
    await test('RBAC: Non-admin client token is blocked (403 Forbidden)', async () => {
      const resOverview = await api('/overview', { token: clientToken });
      assert.strictEqual(resOverview.status, 403);

      const resList = await api('', { token: clientToken });
      assert.strictEqual(resList.status, 403);
    });

  } finally {
    // Cleanup test record
    if (createdClientId) {
      await pool.query('DELETE FROM client_schema.client_notes WHERE client_id = $1', [createdClientId]);
      await pool.query('DELETE FROM client_schema.client_contacts WHERE client_id = $1', [createdClientId]);
      await pool.query('DELETE FROM client_schema.clients WHERE id = $1', [createdClientId]);
      await pool.query('DELETE FROM system_schema.audit_logs WHERE resource_id = $1', [createdClientId]);
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
  console.error('Test execution failed:', err);
  process.exit(1);
});
