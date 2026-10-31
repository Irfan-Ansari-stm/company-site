// src/tests/audit-clientaccess-roles.test.js
// Verification suite for Audit Logs, Client Access Control, and Roles & Permissions
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
    ...(options.token !== undefined
      ? options.token
        ? { Authorization: `Bearer ${options.token}` }
        : {}
      : { Authorization: `Bearer ${adminToken}` }),
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

async function runTests() {
  console.log('\n======================================================');
  console.log(' AUDIT LOGS, CLIENT ACCESS & ROLES TEST SUITE');
  console.log('======================================================\n');
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

  // Setup Express server and routes
  const app = express();
  app.use(express.json());

  app.use('/api/v1/system', require('../routes/system'));
  const { router: usersRouter, rolesRouter, permissionsRouter } = require('../routes/users');
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/roles', rolesRouter);
  app.use('/api/v1/permissions', permissionsRouter);

  const { errorHandler } = require('../middleware/errorHandler');
  app.use(errorHandler);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/v1`;

  // Fetch Super Admin User
  const adminRes = await pool.query(
    `SELECT id, role FROM auth_schema.users WHERE role='super_admin' AND is_active=TRUE LIMIT 1`
  );
  if (adminRes.rows.length > 0) {
    adminUserId = adminRes.rows[0].id;
  } else {
    const newAdmin = await pool.query(
      `INSERT INTO auth_schema.users (email, password_hash, full_name, display_name, role, is_active)
       VALUES ('admin.test.rbac@sysmaira.internal', 'hash', 'Test Super Admin', 'TestAdmin', 'super_admin', TRUE)
       RETURNING id`
    );
    adminUserId = newAdmin.rows[0].id;
  }
  adminToken = generateToken(adminUserId, 'super_admin');

  // Fetch or Create Client User
  const clientRes = await pool.query(
    `SELECT id, role FROM auth_schema.users WHERE role='client' AND is_active=TRUE LIMIT 1`
  );
  if (clientRes.rows.length > 0) {
    clientUserId = clientRes.rows[0].id;
  } else {
    const newClient = await pool.query(
      `INSERT INTO auth_schema.users (email, password_hash, full_name, display_name, role, is_active)
       VALUES ('client.test.rbac@sysmaira.internal', 'hash', 'Test Client', 'TestClient', 'client', TRUE)
       RETURNING id`
    );
    clientUserId = newClient.rows[0].id;
  }
  clientToken = generateToken(clientUserId, 'client');

  // ============================================================
  // 1. AUDIT LOGS TESTS
  // ============================================================
  console.log('\n--- 1. System Audit Logs Module ---');

  await test('GET /system/audit-logs returns real database records and pagination', async () => {
    const res = await api('/system/audit-logs?limit=10');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data));
    assert(typeof res.data.pagination.total === 'number');
  });

  await test('GET /system/audit-logs supports filtering by action and search', async () => {
    const res = await api('/system/audit-logs?action=CREATE&limit=5');
    assert.strictEqual(res.status, 200);
    if (res.data.data.length > 0) {
      assert.strictEqual(res.data.data[0].action, 'CREATE');
    }

    const searchRes = await api('/system/audit-logs?search=users&limit=5');
    assert.strictEqual(searchRes.status, 200);
  });

  await test('GET /system/audit-logs/:id returns single audit event detail', async () => {
    const listRes = await api('/system/audit-logs?limit=1');
    if (listRes.data.data.length > 0) {
      const sampleId = listRes.data.data[0].id;
      const detailRes = await api(`/system/audit-logs/${sampleId}`);
      assert.strictEqual(detailRes.status, 200);
      assert.strictEqual(detailRes.data.data.id, sampleId);
    }
  });

  await test('Security: Client role is strictly forbidden (403) from audit logs', async () => {
    const res = await api('/system/audit-logs', { token: clientToken });
    assert.strictEqual(res.status, 403);
  });

  // ============================================================
  // 2. CLIENT ACCESS CONTROL TESTS
  // ============================================================
  console.log('\n--- 2. Client Dashboard Access Control Module ---');

  let sampleModuleKey;
  await test('GET /system/client-modules lists all modules with client configuration', async () => {
    const res = await api('/system/client-modules');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length > 0);
    sampleModuleKey = res.data.data[0].key;
  });

  await test('PUT /system/client-modules/:key updates module enabled state and actions', async () => {
    assert(sampleModuleKey, 'Sample module must exist');
    const updateRes = await api(`/system/client-modules/${sampleModuleKey}`, {
      method: 'PUT',
      body: {
        is_client_enabled: true,
        actions: ['view', 'create', 'update'],
      },
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.data.is_client_enabled, true);
  });

  await test('PUT /system/client-modules bulk saves dashboard configuration', async () => {
    const listRes = await api('/system/client-modules');
    const modules = listRes.data.data;

    const bulkRes = await api('/system/client-modules', {
      method: 'PUT',
      body: { modules },
    });
    assert.strictEqual(bulkRes.status, 200);
    assert(Array.isArray(bulkRes.data.data));
  });

  await test('GET /system/client-preview returns simulated client perspective', async () => {
    const res = await api('/system/client-preview');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.preview_role, 'client');
    assert(Array.isArray(res.data.data.enabled_modules));
  });

  await test('Security: Client role cannot modify client access configuration (403)', async () => {
    const res = await api('/system/client-modules', {
      method: 'PUT',
      body: { modules: [] },
      token: clientToken,
    });
    assert.strictEqual(res.status, 403);
  });

  // ============================================================
  // 3. ROLES & PERMISSIONS TESTS
  // ============================================================
  console.log('\n--- 3. Roles & Permissions RBAC Module ---');

  await test('GET /roles lists all system and custom roles with user/permission counts', async () => {
    const res = await api('/roles');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    const superAdminRole = res.data.data.find((r) => r.slug === 'super_admin');
    assert(superAdminRole, 'super_admin role must exist');
  });

  let createdRoleId;
  const testRoleSlug = `test_qa_lead_${Date.now()}`;
  await test('POST /roles creates custom role with validation', async () => {
    const createRes = await api('/roles', {
      method: 'POST',
      body: {
        name: 'Quality Assurance Lead',
        slug: testRoleSlug,
        description: 'Oversees QA test suites and release sign-offs',
        is_active: true,
      },
    });
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.data.data.slug, testRoleSlug);
    createdRoleId = createRes.data.data.id;
  });

  await test('GET /roles/:id returns role overview with assigned permissions and users', async () => {
    assert(createdRoleId, 'Created role must exist');
    const res = await api(`/roles/${createdRoleId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.id, createdRoleId);
    assert(Array.isArray(res.data.data.permissions));
  });

  await test('PUT /roles/:id/permissions updates assigned permissions', async () => {
    assert(createdRoleId, 'Created role must exist');
    const permsRes = await api('/permissions');
    assert(permsRes.data.data.length > 0);
    const samplePermIds = permsRes.data.data.slice(0, 3).map((p) => p.id);

    const updateRes = await api(`/roles/${createdRoleId}/permissions`, {
      method: 'PUT',
      body: { permission_ids: samplePermIds },
    });
    assert.strictEqual(updateRes.status, 200);

    // Verify in GET /roles/:id/permissions
    const getPerms = await api(`/roles/${createdRoleId}/permissions`);
    assert.strictEqual(getPerms.status, 200);
    assert.strictEqual(getPerms.data.data.length, samplePermIds.length);
  });

  await test('PATCH /roles/:id updates role metadata', async () => {
    assert(createdRoleId, 'Created role must exist');
    const patchRes = await api(`/roles/${createdRoleId}`, {
      method: 'PATCH',
      body: {
        name: 'Senior QA Lead',
        description: 'Updated scope description',
      },
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.data.name, 'Senior QA Lead');
  });

  await test('Security Policy: Protected system roles cannot be deleted or deactivated', async () => {
    const listRes = await api('/roles');
    const superAdmin = listRes.data.data.find((r) => r.slug === 'super_admin');
    assert(superAdmin, 'super_admin role must exist');

    // Attempt delete
    const delRes = await api(`/roles/${superAdmin.id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 403);

    // Attempt deactivate
    const patchRes = await api(`/roles/${superAdmin.id}`, {
      method: 'PATCH',
      body: { is_active: false },
    });
    assert.strictEqual(patchRes.status, 403);
  });

  await test('DELETE /roles/:id safely deletes custom role', async () => {
    assert(createdRoleId, 'Created role must exist');
    const delRes = await api(`/roles/${createdRoleId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 204);
  });

  await test('Security: Client role cannot manage roles (403)', async () => {
    const res = await api('/roles', {
      method: 'POST',
      body: { name: 'Hacker Role', slug: 'hacker' },
      token: clientToken,
    });
    assert.strictEqual(res.status, 403);
  });

  // Teardown
  server.close();
  await pool.end();

  console.log(`\n========================================`);
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
