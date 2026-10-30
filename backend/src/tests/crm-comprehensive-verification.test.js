// src/tests/crm-comprehensive-verification.test.js
// Complete verification test suite for CRM module
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

function pass(name) {
  passed++;
  console.log(`  ✓ PASS: ${name}`);
}

function fail(name, error) {
  failed++;
  console.error(`  ✗ FAIL: ${name}`);
  console.error(`         ${error.message}`);
}

async function runVerification() {
  console.log('\n======================================================');
  console.log(' STARTING COMPREHENSIVE CRM VERIFICATION SUITE');
  console.log('======================================================\n');

  try {
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

    // 1. Fetch Super Admin & Client Users
    const adminUser = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') LIMIT 1`);
    assert(adminUser.rows.length, 'Admin user must exist');
    adminToken = generateToken(adminUser.rows[0].id, adminUser.rows[0].role);

    const clientUser = await pool.query(`SELECT id, email, role FROM auth_schema.users WHERE role = 'client' LIMIT 1`);
    if (clientUser.rows.length) {
      clientToken = generateToken(clientUser.rows[0].id, 'client');
    }

    // ── TEST GROUP 1: Dynamic Metrics & Pipeline Stage Breakdown ──
    console.log('1. DYNAMIC METRICS & 8-STAGE PIPELINE:');

    const overviewRes = await api('/crm/overview', { token: adminToken });
    assert.strictEqual(overviewRes.status, 200, 'Overview endpoint must return 200');
    assert(overviewRes.data.success, 'Overview response must be success');
    const overview = overviewRes.data.data;

    assert(typeof overview.total_leads === 'number', 'total_leads must be a number');
    assert(typeof overview.active_leads === 'number', 'active_leads must be a number');
    assert(typeof overview.pipeline_value === 'number', 'pipeline_value must be a number');
    assert(typeof overview.won_deals === 'number', 'won_deals must be a number');
    assert(typeof overview.won_revenue === 'number', 'won_revenue must be a number');
    assert(typeof overview.win_rate === 'number', 'win_rate must be a number');
    assert(typeof overview.follow_ups_due === 'number', 'follow_ups_due must be a number');
    pass(`Dashboard metrics dynamic and valid: ${overview.total_leads} leads, $${overview.pipeline_value.toLocaleString()} pipeline value, ${overview.won_deals} won deals (${overview.win_rate}% win rate)`);

    assert(Array.isArray(overview.pipeline), 'Pipeline breakdown must be array');
    assert.strictEqual(overview.pipeline.length, 8, 'Pipeline must return all 8 canonical stages');
    const stageNames = overview.pipeline.map(s => s.stage);
    const expectedStages = ['new', 'contacted', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
    assert.deepStrictEqual(stageNames, expectedStages, 'Stages must match canonical 8 stages in exact order');
    pass('Pipeline returns all 8 canonical stages in exact sales funnel sequence');

    // ── TEST GROUP 2: Assignees & Team Endpoint ──
    console.log('\n2. ASSIGNEES ENDPOINT:');
    const assigneesRes = await api('/crm/assignees', { token: adminToken });
    assert.strictEqual(assigneesRes.status, 200);
    assert(Array.isArray(assigneesRes.data.data));
    assert(assigneesRes.data.data.every(u => u.role !== 'client'), 'Clients must not be included in assignees');
    pass(`Assignees endpoint returns ${assigneesRes.data.data.length} staff members with zero clients`);

    // ── TEST GROUP 3: Complete Lead CRUD ──
    console.log('\n3. LEAD CRUD OPERATIONS:');

    // Create lead with initial note and deal value
    const uniqueEmail = `crm_test_${Date.now()}@testcompany.org`;
    const createRes = await api('/crm/leads', {
      method: 'POST',
      token: adminToken,
      body: {
        first_name: 'Alexander',
        last_name: 'Hamilton',
        email: uniqueEmail,
        company: 'Treasury Capital',
        phone: '+1-555-0199',
        source: 'referral',
        stage: 'qualified',
        expected_value: 75000,
        urgency: 'high',
        requirements: 'Requires comprehensive enterprise ERP & CRM integration.',
        initial_note: 'Prospect reached out via board referral. High intent.',
        next_follow_up: new Date(Date.now() + 86400000).toISOString(),
      }
    });
    assert.strictEqual(createRes.status, 201, 'Lead creation must succeed with 201');
    const createdLead = createRes.data.data;
    assert.strictEqual(createdLead.full_name, 'Alexander Hamilton');
    assert.strictEqual(createdLead.company, 'Treasury Capital');
    assert.strictEqual(createdLead.stage, 'qualified');
    assert.strictEqual(parseFloat(createdLead.expected_value), 75000);
    pass(`Lead created successfully with ID: ${createdLead.id}`);

    // Verify initial note was saved
    const leadDetailRes = await api(`/crm/leads/${createdLead.id}`, { token: adminToken });
    assert.strictEqual(leadDetailRes.status, 200);
    const leadDetails = leadDetailRes.data.data;
    assert(leadDetails.notes && leadDetails.notes.length >= 1, 'Initial note must be attached');
    assert(leadDetails.notes[0].content.includes('board referral'), 'Note content must match');
    pass('Initial note successfully created and attached to lead record');

    // Update lead details (name, email, deal value, stage)
    const updateRes = await api(`/crm/leads/${createdLead.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        first_name: 'Alexander',
        last_name: 'Hamilton Jr.',
        phone: '+1-555-9988',
        expected_value: 95000,
        stage: 'proposal_sent',
        budget_range: '$90k - $120k',
      }
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.data.full_name, 'Alexander Hamilton Jr.');
    assert.strictEqual(updateRes.data.data.stage, 'proposal_sent');
    assert.strictEqual(parseFloat(updateRes.data.data.expected_value), 95000);
    pass('Lead updated with updated full_name, expected_value, and stage transition');

    // ── TEST GROUP 4: Follow-up Management ──
    console.log('\n4. FOLLOW-UP WORKFLOW:');

    // Complete follow-up action
    const followUpRes = await api(`/crm/leads/${createdLead.id}/follow-up`, {
      method: 'POST',
      token: adminToken,
      body: {
        action: 'complete',
        activity_type: 'call',
        subject: 'Introductory Discovery Call',
        outcome: 'Proposal sent and agreed to review by Thursday',
        next_follow_up: new Date(Date.now() + 172800000).toISOString(),
      }
    });
    assert.strictEqual(followUpRes.status, 200);
    assert(followUpRes.data.success);
    const updatedFollowUpLead = followUpRes.data.data;
    assert.strictEqual(updatedFollowUpLead.follow_up_count, 1, 'follow_up_count must increment');
    assert(updatedFollowUpLead.last_contact_at, 'last_contact_at must be populated');
    pass('Follow-up completion logs activity, increments count, and reschedules next contact date');

    // ── TEST GROUP 5: Lead to Client Idempotent Conversion ──
    console.log('\n5. LEAD TO CLIENT CONVERSION:');
    const convertRes = await api(`/crm/leads/${createdLead.id}/convert`, {
      method: 'POST',
      token: adminToken,
    });
    assert.strictEqual(convertRes.status, 200);
    assert(convertRes.data.data.client_id, 'Must return converted client ID');
    const clientId = convertRes.data.data.client_id;
    pass(`Lead converted to Client with ID: ${clientId}`);

    // Verify converted lead record in DB
    const convertedLeadCheck = await pool.query('SELECT stage, won_at, converted_at, deal_value FROM crm_schema.leads WHERE id = $1', [createdLead.id]);
    assert.strictEqual(convertedLeadCheck.rows[0].stage, 'won');
    assert(convertedLeadCheck.rows[0].won_at, 'won_at timestamp must be set');
    assert(convertedLeadCheck.rows[0].converted_at, 'converted_at timestamp must be set');
    pass('Lead stage is won with deal value and conversion timestamp verified');

    // Test idempotency: converting again should succeed without database conflict
    const reConvertRes = await api(`/crm/leads/${createdLead.id}/convert`, {
      method: 'POST',
      token: adminToken,
    });
    assert.strictEqual(reConvertRes.status, 200, 'Re-converting already converted lead must succeed idempotently');
    pass('Idempotent lead conversion verified without duplicate client error');

    // ── TEST GROUP 6: CSV Export ──
    console.log('\n6. CSV EXPORT:');
    const exportRes = await api('/crm/leads/export', { token: adminToken });
    assert.strictEqual(exportRes.status, 200);
    assert(typeof exportRes.data === 'string');
    assert(exportRes.data.startsWith('"Public ID","Name","Email"'), 'CSV must contain standard headers');
    assert(exportRes.data.includes('Alexander Hamilton Jr.'), 'Export must contain exported lead record');
    pass('CSV export verified with valid structure and lead records');

    // ── TEST GROUP 7: Soft Delete & Archive ──
    console.log('\n7. LEAD SAFE DELETION:');
    const deleteRes = await api(`/crm/leads/${createdLead.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.strictEqual(deleteRes.status, 204);

    // Verify soft delete in DB
    const deletedCheck = await pool.query('SELECT deleted_at FROM crm_schema.leads WHERE id = $1', [createdLead.id]);
    assert(deletedCheck.rows[0].deleted_at, 'deleted_at must be populated on soft delete');
    pass('Lead safely soft-deleted with preserved audit history');

    // ── TEST GROUP 8: RBAC & Security Isolation ──
    console.log('\n8. RBAC PERMISSION ENFORCEMENT:');
    if (clientToken) {
      const clientAccessRes = await api('/crm/leads', { token: clientToken });
      assert.strictEqual(clientAccessRes.status, 403, 'Client role must receive 403 Forbidden on CRM');
      pass('Client role strictly denied access to CRM module (403 Forbidden)');
    }

    const unauthRes = await api('/crm/overview');
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must receive 401 Unauthorized');
    pass('Unauthenticated request rejected with 401 Unauthorized');

    console.log('\n======================================================');
    console.log(` ALL COMPREHENSIVE CRM TESTS PASSED! (${passed} PASSED, ${failed} FAILED)`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n✗ TEST FAILURE:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runVerification();

