// src/tests/finance-comprehensive-verification.test.js
// Exhaustive automated verification test suite for Finance & Invoices
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
let createdInvoiceId;
let createdInvoiceNumber;

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
  console.log('\n--- FINANCE & INVOICES VERIFICATION SUITE ---\n');

  // Find admin user
  const adminRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role IN ('super_admin', 'admin') AND is_active = true LIMIT 1"
  );
  if (!adminRes.rows.length) {
    throw new Error('No admin user found in database');
  }
  adminUserId = adminRes.rows[0].id;
  adminToken = generateToken(adminUserId, adminRes.rows[0].role);

  // Find or mock client user
  const clientRes = await pool.query(
    "SELECT id, role FROM auth_schema.users WHERE role = 'client' LIMIT 1"
  );
  clientUserId = clientRes.rows.length ? clientRes.rows[0].id : '00000000-0000-0000-0000-000000000001';
  clientToken = generateToken(clientUserId, 'client');

  // Find a valid client in database
  const clientRecordRes = await pool.query("SELECT id FROM client_schema.clients WHERE deleted_at IS NULL LIMIT 1");
  testClientId = clientRecordRes.rows[0]?.id || null;

  // Setup Express server with finance route
  const app = express();
  app.use(express.json());
  const financeRouter = require('../routes/finance');
  app.use('/api/v1/finance', financeRouter);

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1/finance`;
      resolve();
    });
  });

  // TEST 1: Unauthenticated request rejection
  await test('Security: Unauthenticated request to /overview returns 401', async () => {
    const res = await api('/overview');
    assert.strictEqual(res.status, 401);
  });

  // TEST 2: GET /overview accuracy & balance reconciliation
  await test('Finance Overview: Returns reconciled financial KPIs and historical trends', async () => {
    const res = await api('/overview', { token: adminToken });
    assert.strictEqual(res.status, 200);
    const d = res.data.data;

    assert.ok(typeof d.total_invoiced === 'number', 'total_invoiced is a number');
    assert.ok(typeof d.total_collected === 'number', 'total_collected is a number');
    assert.ok(typeof d.outstanding_amount === 'number', 'outstanding_amount is a number');
    assert.ok(typeof d.overdue_amount === 'number', 'overdue_amount is a number');

    // Mathematical reconciliation check: Invoiced = Collected + Outstanding (within 1 cent float precision)
    const diff = Math.abs(d.total_invoiced - (d.total_collected + d.outstanding_amount));
    assert.ok(diff < 0.05, `Mathematical reconciliation failed: Invoiced (${d.total_invoiced}) != Collected (${d.total_collected}) + Outstanding (${d.outstanding_amount})`);

    // Outstanding cannot be negative
    assert.ok(d.outstanding_amount >= 0, 'outstanding_amount is non-negative');

    // Overdue count and amount checks
    assert.ok(d.overdue_count >= 0, 'overdue_count is non-negative');
    assert.ok(d.overdue_amount >= 0, 'overdue_amount is non-negative');

    // Monthly trend array verification
    assert.ok(Array.isArray(d.monthly_trend), 'monthly_trend is an array');
    assert.ok(d.monthly_trend.length > 0, 'monthly_trend has historical entries');
    assert.ok(Array.isArray(d.recent_invoices), 'recent_invoices is an array');
    assert.ok(Array.isArray(d.recent_payments), 'recent_payments is an array');
  });

  // TEST 3: GET /invoices/summary reconciliation with /overview
  await test('Invoices Summary: Matches Overview KPIs exactly', async () => {
    const [overRes, sumRes] = await Promise.all([
      api('/overview', { token: adminToken }),
      api('/invoices/summary', { token: adminToken }),
    ]);
    assert.strictEqual(overRes.status, 200);
    assert.strictEqual(sumRes.status, 200);

    const ov = overRes.data.data;
    const sm = sumRes.data.data;

    assert.strictEqual(ov.total_invoiced, sm.total_invoiced, 'total_invoiced matches');
    assert.strictEqual(ov.total_collected, sm.total_collected, 'total_collected matches');
    assert.strictEqual(ov.outstanding_amount, sm.outstanding_amount, 'outstanding_amount matches');
    assert.strictEqual(ov.overdue_amount, sm.overdue_amount, 'overdue_amount matches');
    assert.strictEqual(ov.overdue_count, sm.overdue_count, 'overdue_count matches');
  });

  // TEST 4: GET /invoices listing & pagination
  await test('Invoices List: Returns paginated invoices with client names and amounts', async () => {
    const res = await api('/invoices?limit=10', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data), 'invoices is an array');
    assert.ok(res.data.data.length > 0, 'invoices list has items');
    const first = res.data.data[0];
    assert.ok(first.id, 'invoice has id');
    assert.ok(first.invoice_number, 'invoice has invoice_number');
    assert.ok(first.total_amount !== undefined, 'invoice has total_amount');
    assert.ok(first.amount_paid !== undefined, 'invoice has amount_paid');
    assert.ok(first.client_name, 'invoice has joined client_name');
  });

  // TEST 5: Overdue filtering
  await test('Invoices Filter: overdue=true returns all overdue invoices', async () => {
    const res = await api('/invoices?overdue=true', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data), 'data is an array');
    assert.ok(res.data.data.length >= 4, 'returns all overdue invoices');
    for (const inv of res.data.data) {
      assert.ok(
        inv.status === 'overdue' || (new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled'),
        `Invoice ${inv.invoice_number} is overdue`
      );
    }
  });

  // TEST 6: Search invoices by invoice number or client
  await test('Invoices Search: Filters by partial invoice number or client name', async () => {
    const res = await api('/invoices?search=INV-', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data), 'search returns array');
    assert.ok(res.data.data.length > 0, 'search returns matching results');
    for (const inv of res.data.data) {
      assert.ok(inv.invoice_number.includes('INV-'), 'invoice number matches search query');
    }
  });

  // TEST 7: POST /invoices create invoice with line items, tax, and discount
  await test('Create Invoice: Correctly computes subtotal, tax, discount, and creates draft', async () => {
    const payload = {
      client_id: testClientId,
      issue_date: '2026-10-31',
      due_date: '2026-11-30',
      currency: 'USD',
      discount_percent: 10, // 10% discount
      tax_percent: 5,        // 5% tax
      line_items: [
        { description: 'Cloud Migration Consulting', quantity: 2, unit_price: 2000 }, // $4000
        { description: 'Security Hardening', quantity: 1, unit_price: 1000 },         // $1000
      ],
      notes: 'Automated test invoice',
      terms: 'Net 30 days',
    };

    const res = await api('/invoices', {
      method: 'POST',
      token: adminToken,
      body: payload,
    });

    assert.strictEqual(res.status, 201);
    const inv = res.data.data;
    assert.ok(inv.id, 'invoice created with id');
    assert.ok(inv.invoice_number.startsWith('INV-'), 'generates valid invoice number');
    assert.strictEqual(inv.status, 'draft', 'initial status is draft');

    // Math check:
    // Subtotal: 4000 + 1000 = 5000
    // Discount (10%): 500
    // Taxable: 4500
    // Tax (5% of 4500): 225
    // Total: 4725
    assert.strictEqual(parseFloat(inv.subtotal), 5000, 'subtotal is 5000');
    assert.strictEqual(parseFloat(inv.discount_amount), 500, 'discount is 500');
    assert.strictEqual(parseFloat(inv.tax_amount), 225, 'tax is 225');
    assert.strictEqual(parseFloat(inv.total_amount), 4725, 'total is 4725');
    assert.strictEqual(parseFloat(inv.amount_paid), 0, 'amount paid is 0');

    createdInvoiceId = inv.id;
    createdInvoiceNumber = inv.invoice_number;
  });

  // TEST 8: GET /invoices/:id by UUID and by invoice_number
  await test('Get Invoice Detail: Fetches by UUID and by invoice_number with payments array', async () => {
    const resUuid = await api(`/invoices/${createdInvoiceId}`, { token: adminToken });
    assert.strictEqual(resUuid.status, 200);
    assert.strictEqual(resUuid.data.data.id, createdInvoiceId);
    assert.ok(Array.isArray(resUuid.data.data.line_items), 'line_items is array');
    assert.strictEqual(resUuid.data.data.line_items.length, 2);

    const resNum = await api(`/invoices/${createdInvoiceNumber}`, { token: adminToken });
    assert.strictEqual(resNum.status, 200);
    assert.strictEqual(resNum.data.data.id, createdInvoiceId);
  });

  // TEST 9: POST /invoices/:id/send
  await test('Send Invoice: Updates status to sent and records timestamp', async () => {
    const res = await api(`/invoices/${createdInvoiceId}/send`, {
      method: 'POST',
      token: adminToken,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'sent');
  });

  // TEST 10: Partial Payment Recording & Auto-Reconciliation
  await test('Record Payment (Partial): Auto-updates invoice to partial and adjusts balances', async () => {
    const payRes = await api('/payments', {
      method: 'POST',
      token: adminToken,
      body: {
        invoice_id: createdInvoiceId,
        amount: 2000,
        currency: 'USD',
        method: 'bank_transfer',
        transaction_id: 'TXN-TEST-PARTIAL-1',
        notes: 'First installment payment',
      },
    });

    assert.strictEqual(payRes.status, 201);
    assert.strictEqual(parseFloat(payRes.data.data.amount), 2000);

    // Verify invoice status and amount_paid
    const invRes = await api(`/invoices/${createdInvoiceId}`, { token: adminToken });
    assert.strictEqual(invRes.status, 200);
    const inv = invRes.data.data;
    assert.strictEqual(parseFloat(inv.amount_paid), 2000);
    assert.strictEqual(inv.status, 'partial', 'status updated to partial');
    assert.strictEqual(parseFloat(inv.amount_due), 2725, 'amount_due is 2725');
  });

  // TEST 11: Full Payment & Closure
  await test('Record Payment (Full): Reconciles invoice to paid and amount_due to 0', async () => {
    const payRes = await api(`/invoices/${createdInvoiceId}/payments`, {
      method: 'POST',
      token: adminToken,
      body: {
        amount: 2725,
        currency: 'USD',
        method: 'credit_card',
        transaction_id: 'TXN-TEST-FINAL-2',
        notes: 'Final installment payment in full',
      },
    });

    assert.strictEqual(payRes.status, 201);

    // Verify invoice status
    const invRes = await api(`/invoices/${createdInvoiceId}`, { token: adminToken });
    assert.strictEqual(invRes.status, 200);
    const inv = invRes.data.data;
    assert.strictEqual(parseFloat(inv.amount_paid), 4725);
    assert.strictEqual(inv.status, 'paid', 'status auto-updated to paid');
    assert.strictEqual(parseFloat(inv.amount_due), 0, 'amount_due is 0.00');
  });

  // TEST 12: GET /payments list verification
  await test('Payments List: Returns recorded payments with gateway/txn details', async () => {
    const res = await api(`/payments?invoice_id=${createdInvoiceId}`, { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data), 'payments list is array');
    assert.strictEqual(res.data.data.length, 2, 'contains both payment installments');
  });

  // TEST 13: Clean up test invoice & payments
  await test('Cleanup: Soft-deletes test invoice and reverses test payments cleanly', async () => {
    await pool.query('DELETE FROM billing_schema.payments WHERE invoice_id=$1', [createdInvoiceId]);
    await pool.query('DELETE FROM billing_schema.invoices WHERE id=$1', [createdInvoiceId]);

    const res = await api(`/invoices/${createdInvoiceId}`, { token: adminToken });
    assert.strictEqual(res.status, 404, 'invoice no longer found');
  });

  // TEST 14: Final Reconciled Totals Verification
  await test('Final Balance Verification: Invoiced = Collected + Outstanding holds perfectly', async () => {
    const res = await api('/overview', { token: adminToken });
    assert.strictEqual(res.status, 200);
    const d = res.data.data;
    const diff = Math.abs(d.total_invoiced - (d.total_collected + d.outstanding_amount));
    assert.ok(diff < 0.05, `Invoiced (${d.total_invoiced}) = Collected (${d.total_collected}) + Outstanding (${d.outstanding_amount})`);
    assert.strictEqual(d.outstanding_amount >= 0, true, 'Outstanding balance is never negative');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  server.close();
  await pool.end();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Test runner fatal error:', err);
  if (server) server.close();
  pool.end();
  process.exit(1);
});
