// src/tests/admin-tools.test.js
// Automated test suite for Access Control, Administration, AI Assistant, Media Library, Users, and System Settings
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local'), override: true });

const assert = require('assert');
const jwt = require('jsonwebtoken');
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

async function setup() {
  const express = require('express');
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const { router: usersRouter, rolesRouter, permissionsRouter } = require('../routes/users');
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/roles', rolesRouter);
  app.use('/api/v1/permissions', permissionsRouter);
  app.use('/api/v1/system', require('../routes/system'));
  app.use('/api/v1/ai', require('../routes/ai'));
  app.use('/api/v1/media', require('../routes/media'));

  const { errorHandler } = require('../middleware/errorHandler');
  app.use(errorHandler);

  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });

  const adminRes = await pool.query(
    `SELECT id, email, role FROM auth_schema.users WHERE role='super_admin' AND is_active=TRUE LIMIT 1`
  );
  if (!adminRes.rows.length) {
    throw new Error('Super Admin user not found. Please run seed script first.');
  }
  adminUserId = adminRes.rows[0].id;
  adminToken = generateToken(adminUserId, 'super_admin');

  const clientRes = await pool.query(
    `SELECT id, email, role FROM auth_schema.users WHERE email='client@company.com' LIMIT 1`
  );
  if (!clientRes.rows.length) {
    throw new Error('Client user not found. Please run seed script first.');
  }
  clientUserId = clientRes.rows[0].id;
  clientToken = generateToken(clientUserId, 'client');

  console.log('[SETUP] Admin User:', adminRes.rows[0].email, '(super_admin)');
  console.log('[SETUP] Client User:', clientRes.rows[0].email, '(client)');
}

async function teardown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING ACCESS CONTROL, ADMIN & TOOLS TEST SUITE');
  console.log(' (Roles, Client Access, Audit Logs, AI, Media, Users, System)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error('    Error:', err.message);
      failed++;
    }
  }

  try {
    await setup();

    // ─────────────────────────────────────────────────────────────
    // 1. ROLES & PERMISSIONS (RBAC)
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 1. ROLES & PERMISSIONS MODULE ───');

    await test('Super Admin can list roles with user and permission counts', async () => {
      const res = await api('/roles', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data), 'Roles data should be an array');
      const superAdminRole = res.data.data.find(r => r.slug === 'super_admin');
      assert(superAdminRole, 'super_admin role should exist');
      assert.strictEqual(superAdminRole.is_system, true);
    });

    await test('Super Admin can list all system permissions in catalog', async () => {
      const res = await api('/permissions', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      assert(res.data.data.length > 0, 'Permissions catalog should not be empty');
    });

    let createdRoleId = null;
    await test('Super Admin can create a custom role with clean slug', async () => {
      const res = await api('/roles', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'QA Automation Lead',
          slug: 'qa_lead',
          description: 'Quality assurance lead responsible for regression testing',
          is_active: true,
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.slug, 'qa_lead');
      assert.strictEqual(res.data.data.is_system, false);
      createdRoleId = res.data.data.id;
    });

    await test('Creation of role using reserved system slugs is rejected (400 Bad Request)', async () => {
      const res = await api('/roles', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Fake Super Admin',
          slug: 'super_admin',
          description: 'Attempting to overwrite system role',
        },
      });
      assert.strictEqual(res.status, 400);
    });

    await test('Assign permissions matrix to role and verify persistence', async () => {
      const permsRes = await api('/permissions?module=audit', { token: adminToken });
      const permIds = permsRes.data.data.slice(0, 2).map(p => p.id);

      const res = await api(`/roles/${createdRoleId}/permissions`, {
        method: 'PUT',
        token: adminToken,
        body: { permission_ids: permIds },
      });
      assert.strictEqual(res.status, 200);

      const assignedRes = await api(`/roles/${createdRoleId}/permissions`, { token: adminToken });
      assert.strictEqual(assignedRes.status, 200);
      assert.strictEqual(assignedRes.data.data.length, permIds.length);
    });

    await test('Protected system roles (super_admin / client) cannot be deleted (403 Forbidden)', async () => {
      const rolesRes = await api('/roles', { token: adminToken });
      const superAdminRole = rolesRes.data.data.find(r => r.slug === 'super_admin');

      const delRes = await api(`/roles/${superAdminRole.id}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(delRes.status, 403);
    });

    await test('Custom role can be cleanly deleted after testing', async () => {
      const res = await api(`/roles/${createdRoleId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 204);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. CLIENT DASHBOARD ACCESS CONTROL
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 2. CLIENT ACCESS CONTROL MODULE ───');

    await test('Super Admin can fetch client dashboard modules configuration', async () => {
      const res = await api('/system/client-modules', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      const supportMod = res.data.data.find(m => m.key === 'support');
      assert(supportMod, 'Support module should be present in client modules list');
    });

    await test('Super Admin can update client module configuration and widgets', async () => {
      const res = await api('/system/client-modules/support', {
        method: 'PUT',
        token: adminToken,
        body: {
          is_client_enabled: true,
          widgets: [{ key: 'ticket_list', name: 'Ticket History', enabled: true }],
          actions: ['view', 'create', 'reply'],
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.is_client_enabled, true);
    });

    await test('Super Admin can preview client dashboard view and permissions', async () => {
      const res = await api('/system/client-preview', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.preview_role, 'client');
      assert(Array.isArray(res.data.data.enabled_modules));
      assert(Array.isArray(res.data.data.client_permissions));
    });

    await test('Client user is forbidden from modifying client dashboard modules (403 Forbidden)', async () => {
      const res = await api('/system/client-modules', {
        method: 'GET',
        token: clientToken,
      });
      assert.strictEqual(res.status, 403);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. AUDIT LOGS MODULE
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 3. AUDIT LOGS MODULE ───');

    await test('Super Admin can fetch paginated audit logs', async () => {
      const res = await api('/system/audit-logs?page=1&limit=20', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data));
      assert(res.data.total >= 0);
      if (res.data.data.length > 0) {
        const item = res.data.data[0];
        assert(item.action, 'Audit item should have an action');
        assert(item.created_at, 'Audit item should have created_at');
      }
    });

    await test('Super Admin can filter audit logs by action', async () => {
      const res = await api('/system/audit-logs?action=LOGIN&limit=10', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data));
      res.data.data.forEach(item => {
        assert.strictEqual(item.action, 'LOGIN');
      });
    });

    await test('Client user is strictly forbidden from viewing audit logs (403 Forbidden)', async () => {
      const res = await api('/system/audit-logs', { token: clientToken });
      assert.strictEqual(res.status, 403);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. AI ASSISTANT MODULE
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 4. AI ASSISTANT MODULE ───');

    await test('AI Assistant reports provider status and model configuration', async () => {
      const res = await api('/ai/status', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(['openai', 'local-adapter'].includes(res.data.data.provider));
      assert.strictEqual(res.data.data.status, 'online');
    });

    let testConvId = null;
    await test('User can create a new AI conversation session', async () => {
      const res = await api('/ai/conversations', {
        method: 'POST',
        token: adminToken,
        body: {
          title: 'Infrastructure Scaling Q4',
          mode: 'code',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.title, 'Infrastructure Scaling Q4');
      testConvId = res.data.data.id;
    });

    await test('POST /ai/chat generates assistant reply and persists messages in DB', async () => {
      const res = await api('/ai/chat', {
        method: 'POST',
        token: adminToken,
        body: {
          conversation_id: testConvId,
          message: 'Can you summarize our project deliverables and active tasks?',
          mode: 'general',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.message || res.data.data.response, 'Should return assistant reply');
      assert(res.data.data.tokens_used > 0, 'Tokens used should be recorded');
    });

    await test('GET /ai/conversations/:id returns conversation with message history', async () => {
      const res = await api(`/ai/conversations/${testConvId}`, { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.id, testConvId);
      assert(Array.isArray(res.data.data.messages));
      assert(res.data.data.messages.length >= 2, 'Should have user and assistant messages');
    });

    await test('AI Proposal generator returns structured enterprise proposal specification', async () => {
      const res = await api('/ai/generate/proposal', {
        method: 'POST',
        token: adminToken,
        body: {
          lead_data: { company: 'Vanguard Global', full_name: 'Sarah Connor' },
          services: ['Cloud Architecture', 'DevOps CI/CD'],
          budget: '$45,000',
          timeline: '10 Weeks',
        },
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.executive_summary, 'Proposal should contain executive summary');
      assert(Array.isArray(res.data.data.deliverables), 'Deliverables should be an array');
    });

    await test('AI Blog generator returns structured markdown post', async () => {
      const res = await api('/ai/generate/blog', {
        method: 'POST',
        token: adminToken,
        body: {
          topic: 'Zero-Trust Enterprise Security Architectures',
          tone: 'authoritative',
          length: 'medium',
        },
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.title);
      assert(res.data.data.content);
    });

    await test('Clean up test AI conversation', async () => {
      const res = await api(`/ai/conversations/${testConvId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 204);
    });

    // ─────────────────────────────────────────────────────────────
    // 5. MEDIA LIBRARY MODULE
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 5. MEDIA LIBRARY MODULE ───');

    let testFolderId = null;
    await test('Admin can create and list media folders', async () => {
      const createRes = await api('/media/folders', {
        method: 'POST',
        token: adminToken,
        body: { name: 'Audit Compliance Proofs' },
      });
      assert.strictEqual(createRes.status, 201);
      assert.strictEqual(createRes.data.data.name, 'Audit Compliance Proofs');
      testFolderId = createRes.data.data.id;

      const listRes = await api('/media/folders', { token: adminToken });
      assert.strictEqual(listRes.status, 200);
      assert(Array.isArray(listRes.data.data));
    });

    await test('Admin can list media library assets with metadata', async () => {
      const res = await api('/media?limit=10', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data));
      if (res.data.data.length > 0) {
        const item = res.data.data[0];
        assert(item.file_name);
        assert(item.file_size !== undefined);
      }
    });

    let createdMediaId = null;
    await test('Direct DB insertion of test asset and metadata retrieval', async () => {
      const insertRes = await pool.query(
        `INSERT INTO cms_schema.media
           (file_name, original_name, file_path, cdn_url, storage_key, storage_provider, media_type,
            file_size, size_bytes, mime_type, extension, alt_text, tags, folder_id, uploaded_by, metadata)
         VALUES
           ('security-audit-cert.pdf', 'cert.pdf', 'docs/cert.pdf', '/uploads/docs/cert.pdf', 'docs/cert.pdf', 'local', 'document',
            1048576, 1048576, 'application/pdf', 'pdf', 'SOC 2 Type II Certification', '{"compliance"}'::text[], $1, $2, '{}'::jsonb)
         RETURNING id`,
        [testFolderId, adminUserId]
      );
      createdMediaId = insertRes.rows[0].id;

      const getRes = await api(`/media/${createdMediaId}`, { token: adminToken });
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.data.data.file_name, 'security-audit-cert.pdf');
    });

    await test('Admin can update media asset metadata (caption, tags, alt_text)', async () => {
      const res = await api(`/media/${createdMediaId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          alt_text: 'Updated ISO 27001 & SOC 2 Certification',
          tags: ['security', 'compliance', 'iso27001'],
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.alt_text, 'Updated ISO 27001 & SOC 2 Certification');
    });

    await test('Admin can soft-delete media asset and delete media folder', async () => {
      const delMediaRes = await api(`/media/${createdMediaId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(delMediaRes.status, 204);

      const delFolderRes = await api(`/media/folders/${testFolderId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(delFolderRes.status, 204);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. USER MANAGEMENT & SUPER ADMIN PROTECTION
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 6. USER MANAGEMENT & SECURITY INVARIANTS ───');

    await test('Admin can list users with pagination and search', async () => {
      const res = await api('/users?page=1&limit=10', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data));
      assert(res.data.total > 0);
    });

    let newCreatedUserId = null;
    const testDevEmail = `test.dev.${Date.now()}@company.com`;
    await test('Admin can create a new user account with client role', async () => {
      const res = await api('/users', {
        method: 'POST',
        token: adminToken,
        body: {
          email: testDevEmail,
          password: 'Password123!',
          first_name: 'Dev',
          last_name: 'Test',
          role: 'client',
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.email, testDevEmail);
      newCreatedUserId = res.data.data.id;
    });

    await test('Non-super_admin is forbidden from promoting an account to Super Admin (403 Forbidden)', async () => {
      const res = await api(`/users/${newCreatedUserId}`, {
        method: 'PATCH',
        token: clientToken,
        body: { role: 'super_admin' },
      });
      assert.strictEqual(res.status, 403);
    });

    await test('Sole Super Admin account cannot be deleted or deactivated (403 Forbidden)', async () => {
      const res = await api(`/users/${adminUserId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 400); // Or 403 cannot delete your own account / sole Super Admin
    });

    await test('Admin can update user status and reset user password', async () => {
      const patchRes = await api(`/users/${newCreatedUserId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { first_name: 'UpdatedDev', is_active: true },
      });
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchRes.data.data.first_name, 'UpdatedDev');

      const resetRes = await api(`/users/${newCreatedUserId}/reset-password`, {
        method: 'POST',
        token: adminToken,
        body: { password: 'NewSecurePassword2026!' },
      });
      assert.strictEqual(resetRes.status, 200);
    });

    await test('Clean up created user account with soft-delete', async () => {
      const res = await api(`/users/${newCreatedUserId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(res.status, 204);
    });

    // ─────────────────────────────────────────────────────────────
    // 7. SYSTEM SETTINGS & COMPANY PROFILE
    // ─────────────────────────────────────────────────────────────
    console.log('\n─── 7. SYSTEM SETTINGS & COMPANY PROFILE ───');

    await test('Admin can fetch system settings list and map formats', async () => {
      const listRes = await api('/system/settings', { token: adminToken });
      assert.strictEqual(listRes.status, 200);
      assert(Array.isArray(listRes.data.data), 'Default settings should be an array for UI');

      const mapRes = await api('/system/settings?format=map', { token: adminToken });
      assert.strictEqual(mapRes.status, 200);
      assert(typeof mapRes.data.data === 'object' && !Array.isArray(mapRes.data.data));
    });

    await test('Public settings endpoint returns branding keys without authentication', async () => {
      const res = await api('/system/settings/public');
      assert.strictEqual(res.status, 200);
      assert(res.data.data['site.name']);
    });

    await test('Admin can update system settings via PUT and PATCH', async () => {
      const putRes = await api('/system/settings', {
        method: 'PUT',
        token: adminToken,
        body: {
          settings: {
            'site.tagline': 'High-Performance Enterprise Platforms — Updated',
          },
        },
      });
      assert.strictEqual(putRes.status, 200);

      const patchRes = await api('/system/settings', {
        method: 'PATCH',
        token: adminToken,
        body: {
          settings: {
            'site.tagline': 'High-Performance Enterprise Platforms',
          },
        },
      });
      assert.strictEqual(patchRes.status, 200);
    });

    await test('Admin can fetch and update corporate company profile', async () => {
      const getRes = await api('/system/company-profile', { token: adminToken });
      assert.strictEqual(getRes.status, 200);
      assert(getRes.data.data.company_name);

      const patchRes = await api('/system/company-profile', {
        method: 'PATCH',
        token: adminToken,
        body: {
          tagline: 'Engineering Next-Generation Enterprise Systems & Cloud Platforms',
          team_size: 72,
        },
      });
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchRes.data.data.team_size, 72);
    });

    await test('Admin can dispatch a diagnostic test email', async () => {
      const res = await api('/system/test-email', {
        method: 'POST',
        token: adminToken,
        body: { recipient: 'admin.diagnostics@company.com' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

  } finally {
    await teardown();
  }

  console.log('\n======================================================');
  console.log(` ADMIN & TOOLS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
