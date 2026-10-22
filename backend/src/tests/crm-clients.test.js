// src/tests/crm-clients.test.js
// Automated test suite for Sales & CRM + Clients end-to-end integration
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
let clientUserId;
let clientClientId;
let otherClientId;

const TEST_EMAIL = 'client@company.com';

function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_min_32_chars',
    { expiresIn: '1h' }
  );
}

// Helper HTTP request using native fetch
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
  console.log(' STARTING CRM & CLIENTS AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  try {
    // ── Setup Test App & Routes ────────────────────────────────────
    const app = express();
    app.use(express.json());
    app.use('/api/v1/crm', require('../routes/crm'));
    app.use('/api/v1/clients', require('../routes/clients'));
    const { errorHandler } = require('../middleware/errorHandler');
    app.use(errorHandler);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Fetch Super Admin User
    const adminUserRes = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') LIMIT 1`);
    assert(adminUserRes.rows.length, 'Admin user must exist in database');
    const adminUser = adminUserRes.rows[0];
    adminToken = generateToken(adminUser.id, adminUser.role);

    // 2. Fetch Client User
    const clientUserRes = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE email = $1`, [TEST_EMAIL]);
    assert(clientUserRes.rows.length, 'Client user must exist in database');
    const clientUser = clientUserRes.rows[0];
    clientUserId = clientUser.id;
    clientToken = generateToken(clientUser.id, 'client');

    // Fetch Client IDs
    const clientRecordRes = await pool.query(`SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`, [clientUserId]);
    clientClientId = clientRecordRes.rows[0]?.id;

    const otherClientRecordRes = await pool.query(`SELECT id FROM client_schema.clients WHERE id != $1 AND deleted_at IS NULL LIMIT 1`, [clientClientId || '00000000-0000-0000-0000-000000000000']);
    otherClientId = otherClientRecordRes.rows[0]?.id;

    // ── 1. CRM Overview Tests ──────────────────────────────────────
    console.log('1. CRM OVERVIEW & PIPELINE METRIC TESTS:');
    try {
      const res = await api('/crm/overview', { token: adminToken });
      assert.strictEqual(res.status, 200, `CRM overview returned status ${res.status}`);
      const data = res.data.data;

      assert(typeof data.total_leads === 'number' && data.total_leads > 0, `total_leads must be > 0 (found ${data.total_leads})`);
      pass(`Total leads count loads from DB records (count: ${data.total_leads})`);

      assert(typeof data.active_leads === 'number' && data.active_leads > 0, 'active_leads must be > 0');
      pass(`Active leads in open pipeline calculated (active: ${data.active_leads})`);

      assert(typeof data.pipeline_value === 'number' && data.pipeline_value > 0, `pipeline_value must be > 0 (value: $${data.pipeline_value})`);
      pass(`Pipeline value calculated from expected_value ($${data.pipeline_value.toLocaleString()})`);

      assert(typeof data.won_deals === 'number' && data.won_deals > 0, 'won_deals must be > 0');
      pass(`Won deals counted from settled lead records (won: ${data.won_deals})`);

      assert(typeof data.win_rate === 'number', 'win_rate must be a percentage number');
      pass(`Lead win rate computed (${data.win_rate}%)`);

      assert(Array.isArray(data.pipeline) && data.pipeline.length > 0, 'Pipeline stages summary must be an array');
      pass(`Pipeline stage breakdown returned (${data.pipeline.length} stages)`);
    } catch (e) { fail('CRM Overview Metrics', e); }

    // ── 2. CRM Leads Directory & Filters ───────────────────────────
    console.log('\n2. CRM LEADS DIRECTORY & FILTERING TESTS:');
    try {
      const listRes = await api('/crm/leads?page=1&limit=10', { token: adminToken });
      assert.strictEqual(listRes.status, 200, 'Leads list returns 200');
      assert(Array.isArray(listRes.data.data), 'data must be an array of leads');
      assert(listRes.data.total > 0, 'total leads must be > 0');
      pass(`Leads directory supports pagination (returned ${listRes.data.data.length} of ${listRes.data.total})`);

      const stageRes = await api('/crm/leads?stage=qualified', { token: adminToken });
      assert.strictEqual(stageRes.status, 200, 'Stage filter returns 200');
      const allQualified = stageRes.data.data.every(l => l.stage === 'qualified');
      assert(allQualified, 'All returned leads must match stage=qualified');
      pass(`Stage filter accurately bounds query results (found ${stageRes.data.data.length} qualified)`);

      const searchRes = await api('/crm/leads?search=Executive', { token: adminToken });
      assert.strictEqual(searchRes.status, 200, 'Search returns 200');
      assert(searchRes.data.data.length > 0, 'Search by keyword returns matching results');
      pass(`Keyword search query matches lead records (found ${searchRes.data.data.length} results)`);

      const followUpRes = await api('/crm/follow-ups', { token: adminToken });
      assert.strictEqual(followUpRes.status, 200, 'Follow-ups list returns 200');
      assert(Array.isArray(followUpRes.data.data), 'Follow-ups must return an array');
      pass(`Follow-up schedule queries upcoming/overdue leads (${followUpRes.data.data.length} scheduled)`);
    } catch (e) { fail('Leads Directory & Filtering', e); }

    // ── 3. Lead Conversion to Client ───────────────────────────────
    console.log('\n3. LEAD CONVERSION WORKFLOW TESTS:');
    try {
      // Create a test lead to convert
      const newLeadRes = await api('/crm/leads', {
        method: 'POST',
        token: adminToken,
        body: {
          first_name: 'Convertible',
          last_name: 'Lead',
          email: `convert_${Date.now()}@example.com`,
          company: 'Acquisition Target LLC',
          source: 'website',
          stage: 'proposal_sent',
          expected_value: 45000,
        },
      });
      assert.strictEqual(newLeadRes.status, 201, 'Create lead returns 201 Created');
      const convertibleLeadId = newLeadRes.data.data.id;
      pass(`Lead created for conversion testing (ID: ${convertibleLeadId})`);

      // Convert lead
      const convRes = await api(`/crm/leads/${convertibleLeadId}/convert`, {
        method: 'POST',
        token: adminToken,
      });
      assert.strictEqual(convRes.status, 200, 'Convert lead returns 200 OK');
      const newClientId = convRes.data.data.client_id;
      assert(newClientId, 'Response contains new client_id');
      pass(`Lead successfully converted to Client (Client ID: ${newClientId})`);

      // Verify lead is won
      const leadCheck = await pool.query(`SELECT stage, won_at, converted_at FROM crm_schema.leads WHERE id = $1`, [convertibleLeadId]);
      assert.strictEqual(leadCheck.rows[0].stage, 'won', 'Lead stage is updated to won');
      assert(leadCheck.rows[0].won_at, 'Lead won_at timestamp is set');
      assert(leadCheck.rows[0].converted_at, 'Lead converted_at timestamp is set');
      pass(`Lead record verified with won status and conversion timestamps`);

      // Verify client record created in client_schema
      const clientCheck = await pool.query(`SELECT id, company_name, billing_email, status FROM client_schema.clients WHERE id = $1`, [newClientId]);
      assert.strictEqual(clientCheck.rows.length, 1, 'Client record exists in client_schema.clients');
      assert.strictEqual(clientCheck.rows[0].company_name, 'Acquisition Target LLC');
      pass(`New client record verified in client_schema.clients (${clientCheck.rows[0].company_name})`);

      // Verify primary contact created
      const contactCheck = await pool.query(`SELECT first_name, last_name, is_primary FROM client_schema.client_contacts WHERE client_id = $1`, [newClientId]);
      assert(contactCheck.rows.length > 0, 'Client primary contact created');
      pass(`Client contact created automatically from lead profile`);
    } catch (e) { fail('Lead Conversion Workflow', e); }

    // ── 4. Client Directory & Overview ─────────────────────────────
    console.log('\n4. CLIENT DIRECTORY & DETAILS TESTS:');
    try {
      const overviewRes = await api('/clients/overview', { token: adminToken });
      assert.strictEqual(overviewRes.status, 200, 'Clients overview returns 200');
      const stats = overviewRes.data.data;
      assert(stats.total > 0, `Total clients must be > 0 (found ${stats.total})`);
      assert(stats.active > 0, `Active clients must be > 0 (found ${stats.active})`);
      assert(stats.companies > 0, 'Companies count must be > 0');
      pass(`Client directory overview statistics verified (Total: ${stats.total}, Active: ${stats.active})`);

      const listRes = await api('/clients?page=1&limit=10', { token: adminToken });
      assert.strictEqual(listRes.status, 200, 'Clients list returns 200');
      assert(Array.isArray(listRes.data.data), 'Clients list returns array');
      assert(listRes.data.summary, 'Clients list includes summary totals');
      pass(`Clients directory returns paginated records with overview summary`);

      const typeRes = await api('/clients?type=individual', { token: adminToken });
      assert.strictEqual(typeRes.status, 200, 'Filter by type returns 200');
      const allIndividuals = typeRes.data.data.every(c => c.type === 'individual');
      assert(allIndividuals, 'All filtered clients must match type=individual');
      pass(`Client type filter verified (found ${typeRes.data.data.length} individual clients)`);

      const clientDetailRes = await api(`/clients/${clientClientId}`, { token: adminToken });
      assert.strictEqual(clientDetailRes.status, 200, 'Client detail returns 200');
      const detail = clientDetailRes.data.data;
      assert.strictEqual(detail.id, clientClientId);
      assert(Array.isArray(detail.contacts), 'Client detail includes contacts');
      assert(Array.isArray(detail.projects), 'Client detail includes associated projects');
      assert(Array.isArray(detail.recent_invoices), 'Client detail includes recent invoices');
      assert(Array.isArray(detail.recent_tickets), 'Client detail includes recent tickets');
      assert(Array.isArray(detail.notes), 'Client detail includes notes');
      pass(`Client profile returned complete 360-degree view (contacts, projects, invoices, tickets, notes)`);
    } catch (e) { fail('Client Directory & Details', e); }

    // ── 5. Client CRUD Operations ──────────────────────────────────
    console.log('\n5. CLIENT CRUD OPERATIONS:');
    let createdClientId = null;
    try {
      const createRes = await api('/clients', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Nexus Alpha Ventures',
          type: 'company',
          industry: 'finance',
          email: 'finance@nexusalpha.io',
          phone: '+1-555-8888',
          website: 'https://nexusalpha.io',
          country: 'United States',
          city: 'San Francisco',
        },
      });
      assert.strictEqual(createRes.status, 201, 'Create client returns 201 Created');
      createdClientId = createRes.data.data.id;
      pass(`Client created successfully (ID: ${createdClientId})`);

      const updateRes = await api(`/clients/${createdClientId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          phone: '+1-555-9999',
          health_score: 95,
          status: 'active',
        },
      });
      assert.strictEqual(updateRes.status, 200, 'Update client returns 200 OK');
      assert.strictEqual(updateRes.data.data.phone, '+1-555-9999');
      assert.strictEqual(updateRes.data.data.health_score, 95);
      pass(`Client updated successfully`);

      const addNoteRes = await api(`/clients/${createdClientId}/notes`, {
        method: 'POST',
        token: adminToken,
        body: { content: 'Quarterly enterprise review scheduled for Q4.', is_pinned: true },
      });
      assert.strictEqual(addNoteRes.status, 201, 'Add note returns 201');
      pass(`Client note created and pinned`);

      const addContactRes = await api(`/clients/${createdClientId}/contacts`, {
        method: 'POST',
        token: adminToken,
        body: {
          first_name: 'Arthur',
          last_name: 'Dent',
          email: 'arthur@nexusalpha.io',
          phone: '+1-555-7777',
          designation: 'Managing Partner',
          is_primary: true,
        },
      });
      assert.strictEqual(addContactRes.status, 201, 'Add contact returns 201');
      pass(`Client contact added successfully`);

      const deleteRes = await api(`/clients/${createdClientId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.strictEqual(deleteRes.status, 204, 'Soft delete client returns 204 No Content');
      const delCheck = await pool.query(`SELECT deleted_at, is_active FROM client_schema.clients WHERE id = $1`, [createdClientId]);
      assert(delCheck.rows[0].deleted_at, 'deleted_at timestamp is populated');
      assert.strictEqual(delCheck.rows[0].is_active, false, 'is_active set to false');
      pass(`Client soft deleted and archived safely`);
    } catch (e) { fail('Client CRUD Operations', e); }

    // ── 6. RBAC & Data Isolation Enforcement ───────────────────────
    console.log('\n6. RBAC PERMISSIONS & CLIENT DATA ISOLATION:');
    try {
      // 1. Client user blocked from global CRM leads
      const clientCrmRes = await api('/crm/leads', { token: clientToken });
      assert.strictEqual(clientCrmRes.status, 403, 'Client user blocked from CRM leads');
      pass(`Client user strictly blocked from CRM leads directory (403 Forbidden)`);

      // 2. Client user blocked from CRM overview
      const clientCrmOverview = await api('/crm/overview', { token: clientToken });
      assert.strictEqual(clientCrmOverview.status, 403, 'Client user blocked from CRM overview');
      pass(`Client user strictly blocked from CRM overview metrics (403 Forbidden)`);

      // 3. Client user blocked from global client directory
      const clientListRes = await api('/clients', { token: clientToken });
      assert.strictEqual(clientListRes.status, 403, 'Client user blocked from global client list');
      pass(`Client user strictly blocked from global client directory (403 Forbidden)`);

      // 4. Client user blocked from other clients' profile
      if (otherClientId) {
        const otherClientRes = await api(`/clients/${otherClientId}`, { token: clientToken });
        assert.strictEqual(otherClientRes.status, 403, 'Client user blocked from other client profile');
        pass(`Client user blocked from accessing other clients' accounts (403 Forbidden)`);
      }

      // 5. Client user can view their OWN profile via /clients/me or /clients/:ownId
      const ownClientRes = await api(`/clients/${clientClientId}`, { token: clientToken });
      assert.strictEqual(ownClientRes.status, 200, 'Client user can access their own profile');
      assert.strictEqual(ownClientRes.data.data.id, clientClientId);
      pass(`Client user can securely access their own profile (${ownClientRes.data.data.name})`);

      // 6. Client user blocked from creating new clients
      const clientCreateRes = await api('/clients', {
        method: 'POST',
        token: clientToken,
        body: { name: 'Hacker Company' },
      });
      assert.strictEqual(clientCreateRes.status, 403, 'Client user cannot create clients');
      pass(`Client user cannot create clients (403 Forbidden)`);

      // 7. Unauthenticated request to /crm/leads returns 401
      const unauthCrmRes = await api('/crm/leads');
      assert.strictEqual(unauthCrmRes.status, 401, 'Unauthenticated request returns 401');
      pass(`Unauthenticated request to CRM returns 401 Unauthorized`);
    } catch (e) { fail('RBAC & Client Data Isolation', e); }

  } catch (err) {
    console.error('\nFatal test execution error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();

    console.log('\n======================================================');
    console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

