// src/tests/enterprise-modules.test.js
// Automated test suite for Enterprise Modules: Finance, Support, HR, Blog, CMS, Portfolio, Services, Marketing
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
  console.log(' STARTING ENTERPRISE MODULES AUTOMATED TEST SUITE');
  console.log(' (Finance, Support, HR, Marketing, Blog, CMS, Portfolio, Services)');
  console.log('======================================================\n');

  try {
    // ── Setup Test App & Routes ────────────────────────────────────
    const app = express();
    app.use(express.json());

    app.use('/api/v1/finance', require('../routes/finance'));
    app.use('/api/v1/support', require('../routes/support'));
    app.use('/api/v1/hr', require('../routes/hr'));
    app.use('/api/v1/marketing', require('../routes/marketing'));
    app.use('/api/v1/blog', require('../routes/blog'));
    app.use('/api/v1/cms', require('../routes/cms'));
    app.use('/api/v1/portfolio', require('../routes/portfolio'));
    const servicesMod = require('../routes/services');
    app.use('/api/v1/services', servicesMod.router || servicesMod);

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

    // 3. Find Client record
    const clientRecordRes = await pool.query(`SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`, [clientUserId]);
    clientClientId = clientRecordRes.rows[0]?.id;

    console.log(`[SETUP] Admin User: ${adminUser.email} (${adminUser.role})`);
    console.log(`[SETUP] Client User: ${clientUser.email} (Client ID: ${clientClientId})\n`);

    // ════════════════════════════════════════════════════════════════
    // 1. FINANCE & INVOICES TESTS
    // ════════════════════════════════════════════════════════════════
    console.log('─── 1. FINANCE & INVOICING MODULE ───');

    // 1.1 Finance Overview
    try {
      const res = await api('/finance/overview', { token: adminToken });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      assert(res.data.success, 'Response must have success: true');
      const d = res.data.data;
      assert(typeof d.total_invoiced === 'number', 'total_invoiced must be numeric');
      assert(typeof d.total_collected === 'number', 'total_collected must be numeric');
      assert(typeof d.outstanding_amount === 'number', 'outstanding_amount must be numeric');
      assert(Array.isArray(d.monthly_trend), 'monthly_trend must be an array');
      assert(Array.isArray(d.recent_invoices), 'recent_invoices must be an array');
      assert(Array.isArray(d.recent_payments), 'recent_payments must be an array');
      pass('Admin can fetch comprehensive finance dashboard overview metrics');
    } catch (e) {
      fail('Admin can fetch comprehensive finance dashboard overview metrics', e);
    }

    // 1.2 Invoices Summary
    try {
      const res = await api('/finance/invoices/summary', { token: adminToken });
      assert.strictEqual(res.status, 200);
      const s = res.data.data;
      assert(s.total_invoiced !== undefined, 'total_invoiced must exist');
      assert(s.total_collected !== undefined, 'total_collected must exist');
      assert(s.outstanding_amount !== undefined, 'outstanding_amount must exist');
      pass('GET /finance/invoices/summary returns standardized totals and counts');
    } catch (e) {
      fail('GET /finance/invoices/summary returns standardized totals and counts', e);
    }

    // 1.3 Create Invoice
    let createdInvoiceId;
    try {
      const payload = {
        client_id: clientClientId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        tax_percent: 10,
        discount_percent: 5,
        notes: 'Enterprise platform cloud consulting invoice',
        line_items: [
          { description: 'Cloud Infrastructure Architecture Phase 1', quantity: 1, unit_price: 10000 },
          { description: 'Security Auditing & Penetration Testing', quantity: 2, unit_price: 2500 }
        ]
      };
      const res = await api('/finance/invoices', { method: 'POST', body: payload, token: adminToken });
      assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
      assert(res.data.data?.id, 'Invoice must return an id');
      createdInvoiceId = res.data.data.id;
      assert.strictEqual(res.data.data.status, 'draft', 'New invoice should be draft');
      // Subtotal = 10000 + 5000 = 15000; Discount 5% = 750; Taxable = 14250; Tax 10% = 1425; Total = 15675
      assert.strictEqual(parseFloat(res.data.data.total_amount), 15675, 'Total amount must match calculated line items');
      pass('Admin can create invoice with computed totals, tax, and JSONB line items');
    } catch (e) {
      fail('Admin can create invoice with computed totals, tax, and JSONB line items', e);
    }

    // 1.4 Send Invoice
    try {
      const res = await api(`/finance/invoices/${createdInvoiceId}/send`, { method: 'POST', token: adminToken });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'sent', 'Invoice status must transition to sent');
      assert(res.data.data.sent_at, 'Invoice sent_at timestamp must be set');
      pass('Admin can mark draft invoice as sent');
    } catch (e) {
      fail('Admin can mark draft invoice as sent', e);
    }

    // 1.5 Record Payment & Verify Automatic Status Transition
    try {
      const payPayload = {
        invoice_id: createdInvoiceId,
        amount: 15675,
        currency: 'USD',
        method: 'bank_transfer',
        transaction_id: `TXN-${Date.now()}`,
        notes: 'Full payment wire received'
      };
      const res = await api('/finance/payments', { method: 'POST', body: payPayload, token: adminToken });
      assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);

      // Verify invoice updated to paid
      const invCheck = await api(`/finance/invoices/${createdInvoiceId}`, { token: adminToken });
      assert.strictEqual(invCheck.status, 200);
      assert.strictEqual(invCheck.data.data.status, 'paid', 'Invoice status must transition to paid');
      assert.strictEqual(parseFloat(invCheck.data.data.amount_paid), 15675, 'amount_paid must equal total');
      assert.strictEqual(parseFloat(invCheck.data.data.amount_due), 0, 'amount_due must be 0');
      pass('Recording full payment automatically marks invoice paid and clears amount_due');
    } catch (e) {
      fail('Recording full payment automatically marks invoice paid and clears amount_due', e);
    }

    // ════════════════════════════════════════════════════════════════
    // 2. SUPPORT & TICKET PRIVACY TESTS
    // ════════════════════════════════════════════════════════════════
    console.log('\n─── 2. SUPPORT & TICKET PRIVACY MODULE ───');

    // 2.1 Ticket Stats
    try {
      const res = await api('/support/tickets/stats', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(typeof res.data.data.open_count === 'number', 'open_count must be numeric');
      assert(typeof res.data.data.critical_count === 'number', 'critical_count must be numeric');
      pass('GET /support/tickets/stats derives live statistics from database');
    } catch (e) {
      fail('GET /support/tickets/stats derives live statistics from database', e);
    }

    // 2.2 Create Ticket
    let testTicketId;
    try {
      const payload = {
        client_id: clientClientId,
        subject: 'Database connection latency spike inquiry',
        description: 'Observing intermittent query timeout on heavy analytics dashboard widgets.',
        type: 'support',
        priority: 'high',
        reporter_name: 'Client Admin',
        reporter_email: TEST_EMAIL
      };
      const res = await api('/support/tickets', { method: 'POST', body: payload, token: clientToken });
      assert.strictEqual(res.status, 201);
      testTicketId = res.data.data.id;
      assert(testTicketId, 'Created ticket must return id');
      assert(res.data.data.ticket_number.startsWith('TKT-'), 'Ticket number must have TKT- prefix');
      pass('Client can submit support ticket with generated ticket number');
    } catch (e) {
      fail('Client can submit support ticket with generated ticket number', e);
    }

    // 2.3 Post Internal Note as Admin vs Public Reply
    try {
      // 1. Admin posts public reply
      await api(`/support/tickets/${testTicketId}/replies`, {
        method: 'POST',
        body: { content: 'We are investigating the database connection pool settings.', is_internal: false },
        token: adminToken
      });

      // 2. Admin posts INTERNAL NOTE
      await api(`/support/tickets/${testTicketId}/replies`, {
        method: 'POST',
        body: { content: 'INTERNAL AUDIT: pg_stat_activity shows vacuum lock on page_views table.', is_internal: true },
        token: adminToken
      });

      // 3. Admin gets ticket: MUST see internal note
      const adminView = await api(`/support/tickets/${testTicketId}`, { token: adminToken });
      const adminReplies = adminView.data.data.replies || [];
      const hasInternal = adminReplies.some(r => r.is_internal === true);
      assert(hasInternal, 'Admin must be able to view internal notes');

      // 4. Client gets ticket: MUST NOT see internal note
      const clientView = await api(`/support/tickets/${testTicketId}`, { token: clientToken });
      const clientReplies = clientView.data.data.replies || [];
      const clientSawInternal = clientReplies.some(r => r.is_internal === true);
      assert.strictEqual(clientSawInternal, false, 'Client must NEVER see internal notes');

      pass('Strict Support privacy: Staff sees internal notes while Clients are completely isolated');
    } catch (e) {
      fail('Strict Support privacy: Staff sees internal notes while Clients are completely isolated', e);
    }

    // ════════════════════════════════════════════════════════════════
    // 3. HR & RECRUITMENT RBAC TESTS
    // ════════════════════════════════════════════════════════════════
    console.log('\n─── 3. HR & RECRUITMENT MODULE ───');

    // 3.1 Client Forbidden from HR
    try {
      const res = await api('/hr/applications', { token: clientToken });
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden for client, got ${res.status}`);
      pass('Client role is strictly forbidden (403) from accessing HR applications');
    } catch (e) {
      fail('Client role is strictly forbidden (403) from accessing HR applications', e);
    }

    // 3.2 Admin Lists Jobs & Applications
    try {
      const jobsRes = await api('/hr/jobs', { token: adminToken });
      assert.strictEqual(jobsRes.status, 200);
      assert(Array.isArray(jobsRes.data.data), 'jobs data must be an array');
      assert(jobsRes.data.data.length > 0, 'seeded jobs must be returned');

      const appsRes = await api('/hr/applications', { token: adminToken });
      assert.strictEqual(appsRes.status, 200);
      assert(Array.isArray(appsRes.data.data), 'applications data must be an array');
      pass('Admin can access HR job openings and applicant pipeline');
    } catch (e) {
      fail('Admin can access HR job openings and applicant pipeline', e);
    }

    // 3.3 Public Team Members
    try {
      const res = await api('/hr/team');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'team data must be an array');
      assert(res.data.data.length > 0, 'seeded team members must be returned');
      pass('Public team endpoint returns active corporate leadership & team members');
    } catch (e) {
      fail('Public team endpoint returns active corporate leadership & team members', e);
    }

    // ════════════════════════════════════════════════════════════════
    // 4. MARKETING, BLOG, CMS, PORTFOLIO & SERVICES
    // ════════════════════════════════════════════════════════════════
    console.log('\n─── 4. MARKETING & CONTENT MODULES ───');

    // 4.1 Client Forbidden from Marketing Campaigns
    try {
      const res = await api('/marketing/campaigns', { token: clientToken });
      assert.strictEqual(res.status, 403, `Expected 403 for client, got ${res.status}`);
      pass('Client role is strictly forbidden (403) from accessing Marketing campaigns');
    } catch (e) {
      fail('Client role is strictly forbidden (403) from accessing Marketing campaigns', e);
    }

    // 4.2 Admin Lists Marketing Campaigns, Subscribers & Coupons
    try {
      const [campRes, subRes, cpnRes] = await Promise.all([
        api('/marketing/campaigns', { token: adminToken }),
        api('/marketing/subscribers', { token: adminToken }),
        api('/marketing/coupons', { token: adminToken }),
      ]);
      assert.strictEqual(campRes.status, 200);
      assert.strictEqual(subRes.status, 200);
      assert.strictEqual(cpnRes.status, 200);
      assert(campRes.data.data.length > 0, 'seeded campaigns must be returned');
      assert(subRes.data.data.length > 0, 'seeded subscribers must be returned');
      assert(cpnRes.data.data.length > 0, 'seeded coupons must be returned');
      pass('Admin can query marketing email campaigns, subscribers, and coupon codes');
    } catch (e) {
      fail('Admin can query marketing email campaigns, subscribers, and coupon codes', e);
    }

    // 4.3 Public Newsletter Subscription
    try {
      const res = await api('/marketing/subscribers/subscribe', {
        method: 'POST',
        body: { email: `test.subscriber.${Date.now()}@example.com`, first_name: 'Test', last_name: 'User' }
      });
      assert.strictEqual(res.status, 201);
      pass('Public user can subscribe to newsletter through marketing endpoint');
    } catch (e) {
      fail('Public user can subscribe to newsletter through marketing endpoint', e);
    }

    // 4.4 Blog: Admin sees draft posts while Public only sees published
    try {
      const adminPosts = await api('/blog/posts', { token: adminToken });
      assert.strictEqual(adminPosts.status, 200);
      const hasDraft = adminPosts.data.data.some(p => p.status === 'draft');
      assert(hasDraft, 'Admin must be able to see draft posts');

      const publicPosts = await api('/blog/posts');
      assert.strictEqual(publicPosts.status, 200);
      const allPublished = publicPosts.data.data.every(p => p.status === 'published');
      assert(allPublished, 'Unauthenticated public query must only return published posts');
      pass('Blog drafts are visible to Admin and protected from public unauthenticated reads');
    } catch (e) {
      fail('Blog drafts are visible to Admin and protected from public unauthenticated reads', e);
    }

    // 4.5 CMS Pages & Navigation
    try {
      const res = await api('/cms/pages', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'cms pages must be array');
      assert(res.data.data.some(p => p.slug === 'home'), 'home page must exist in CMS');
      pass('CMS pages management endpoint returns structured corporate page metadata');
    } catch (e) {
      fail('CMS pages management endpoint returns structured corporate page metadata', e);
    }

    // 4.6 Portfolio Case Studies
    try {
      const res = await api('/portfolio', { token: adminToken });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'portfolio items must be array');
      assert(res.data.data.length > 0, 'seeded portfolio case studies must be returned');
      pass('Portfolio endpoint serves enterprise case studies with tech stack metadata');
    } catch (e) {
      fail('Portfolio endpoint serves enterprise case studies with tech stack metadata', e);
    }

    // 4.7 Services Catalog
    try {
      const res = await api('/services');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data), 'services catalog must be array');
      assert(res.data.data.length > 0, 'seeded service offerings must be returned');
      pass('Services catalog serves live corporate digital service offerings');
    } catch (e) {
      fail('Services catalog serves live corporate digital service offerings', e);
    }

  } catch (err) {
    console.error('Test Suite encountered fatal error:', err);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();

    console.log('\n======================================================');
    console.log(` ENTERPRISE MODULES TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
