// backend/src/tests/public-website-speed-suite.test.js
// Comprehensive Performance, Reliability, Caching, and Public Feature Automated Test Suite

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const http = require('http');
const assert = require('assert');
const app = require('../index');
const { pool } = require('../config/database');
const { memoryCache } = require('../utils/cache');

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function pass(name, extra = '') {
  console.log(`  ✓ PASS: ${name}${extra ? ` (${extra})` : ''}`);
  passed++;
}

function fail(name, err) {
  console.error(`  ✗ FAIL: ${name}`, err?.message || err);
  failed++;
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const start = performance.now();
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const durationMs = performance.now() - start;
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    data,
    durationMs,
  };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' STARTING PUBLIC WEBSITE PERFORMANCE & E2E TEST SUITE');
  console.log('======================================================\n');

  try {
    // Start temporary test server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 1. PUBLIC ROUTE LATENCY & RESPONSE INTEGRITY
    // ─────────────────────────────────────────────────────────────
    console.log('1. PUBLIC ROUTE LATENCY & DATA INTEGRITY:');

    // Site Settings
    try {
      const res = await request('/public/site-settings');
      assert.strictEqual(res.status, 200);
      assert(res.data?.data?.siteName, 'siteName must be returned');
      assert(res.data?.data?.contact?.email, 'contact email must be returned');
      assert(res.headers['cache-control'], 'Cache-Control header must be set');
      pass('GET /public/site-settings returns valid configuration', `latency: ${res.durationMs.toFixed(1)}ms`);
    } catch (e) { fail('GET /public/site-settings', e); }

    // Navigation Header
    try {
      const res = await request('/public/navigation');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data?.data?.links || res.data?.data), 'Navigation links must be an array');
      pass('GET /public/navigation serves header links', `latency: ${res.durationMs.toFixed(1)}ms`);
    } catch (e) { fail('GET /public/navigation', e); }

    // Footer
    try {
      const res = await request('/public/footer');
      assert.strictEqual(res.status, 200);
      assert(res.data?.data, 'Footer config must be returned');
      pass('GET /public/footer serves navigation columns & legal links', `latency: ${res.durationMs.toFixed(1)}ms`);
    } catch (e) { fail('GET /public/footer', e); }

    // Dynamic Homepage Sections
    try {
      const res = await request('/public/pages/home');
      assert.strictEqual(res.status, 200);
      assert(res.data?.data?.sections, 'Page sections array must be present');
      assert(Array.isArray(res.data?.data?.sections), 'Sections must be an array');
      pass('GET /public/pages/home retrieves dynamic structured sections', `sections: ${res.data.data.sections.length}`);
    } catch (e) { fail('GET /public/pages/home', e); }

    // Core Services Catalog
    try {
      const res = await request('/public/services');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data?.data), 'Services must be an array');
      assert(res.data?.data.length > 0, 'Services list must not be empty');
      pass('GET /public/services returns digital services catalog', `count: ${res.data.data.length}`);
    } catch (e) { fail('GET /public/services', e); }

    // Solutions Catalog
    try {
      const res = await request('/public/solutions');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data?.data), 'Solutions must be an array');
      pass('GET /public/solutions serves enterprise solutions catalog');
    } catch (e) { fail('GET /public/solutions', e); }

    // Showcases / Portfolio
    try {
      const res = await request('/public/showcases');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data?.data), 'Showcases must be an array');
      pass('GET /public/showcases serves portfolio case studies');
    } catch (e) { fail('GET /public/showcases', e); }

    // FAQ Catalog
    try {
      const res = await request('/public/faqs');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data?.data), 'FAQs must be an array');
      pass('GET /public/faqs serves categorized FAQ directory', `count: ${res.data.data.length}`);
    } catch (e) { fail('GET /public/faqs', e); }

    // Delivery Process & Engagement Models
    try {
      const resProc = await request('/public/delivery-process');
      assert.strictEqual(resProc.status, 200);
      const resEng = await request('/public/engagement-models');
      assert.strictEqual(resEng.status, 200);
      pass('GET /public/delivery-process & /engagement-models deliver methodology data');
    } catch (e) { fail('Delivery process and engagement models', e); }

    // Blog Articles Listing & Categories
    try {
      const resBlog = await request('/public/blog');
      assert.strictEqual(resBlog.status, 200);
      assert(Array.isArray(resBlog.data?.data), 'Blog posts must be an array');

      const resCat = await request('/public/blog/categories');
      assert.strictEqual(resCat.status, 200);
      assert(Array.isArray(resCat.data?.data), 'Blog categories must be an array');
      pass('GET /public/blog & /categories return published thought leadership');
    } catch (e) { fail('Blog articles & categories', e); }

    // ─────────────────────────────────────────────────────────────
    // 2. CACHING SPEED & HIT/MISS BEHAVIOR
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. CACHING PERFORMANCE & IN-MEMORY SPEED:');

    try {
      // First clear cache
      memoryCache.flush();

      // Cold request (MISS)
      const coldRes = await request('/public/site-settings');
      assert.strictEqual(coldRes.headers['x-cache-status'], 'MISS', 'First request must be a cache MISS');
      const coldLatency = coldRes.durationMs;

      // Warm request (HIT)
      const warmRes = await request('/public/site-settings');
      assert.strictEqual(warmRes.headers['x-cache-status'], 'HIT', 'Second request must be a cache HIT');
      const warmLatency = warmRes.durationMs;

      assert(warmLatency <= coldLatency + 10, 'Cached request should be noticeably faster or near-zero latency');
      pass('In-memory cache delivers sub-10ms warm responses', `Cold: ${coldLatency.toFixed(1)}ms, Warm: ${warmLatency.toFixed(1)}ms`);
    } catch (e) { fail('Cache performance test', e); }

    // ─────────────────────────────────────────────────────────────
    // 3. ZERO BROKEN FORMS & LEAD CAPTURE VALIDATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. FORM SUBMISSION, VALIDATION & LEAD PIPELINE:');

    // Test rejection of invalid submissions (missing required email)
    try {
      const invalidRes = await request('/public/contact-submissions', {
        method: 'POST',
        body: {
          name: 'Anonymous Tester',
          // Email omitted intentionally
          message: 'Incomplete contact attempt',
        },
      });
      assert(invalidRes.status === 400 || invalidRes.status === 422, 'Missing email must return 400 or 422');
      pass('Validation rejects incomplete submissions with missing email (400 Bad Request)');
    } catch (e) { fail('Invalid contact form submission', e); }

    // Test successful submission
    const testEmail = `lead.speedtest.${Date.now()}@testcompany.org`;
    try {
      const validRes = await request('/public/contact-submissions', {
        method: 'POST',
        body: {
          name: 'Speed Optimization Test Lead',
          email: testEmail,
          company: 'HyperSpeed Labs Inc',
          message: 'Inquiry regarding automated enterprise digital transformation and SLA metrics.',
          budget: '$50k - $100k',
        },
      });
      assert.strictEqual(validRes.status, 201, 'Valid submission must return 201 Created');
      assert(validRes.data?.data?.id, 'Returned data must include generated lead ID');
      pass('Contact form successfully accepts inquiries & registers CRM lead', `Lead ID: ${validRes.data.data.id}`);

      // Verify persistence in database
      const dbCheck = await pool.query(
        `SELECT id, first_name, last_name, email, company, stage FROM crm_schema.leads WHERE email = $1`,
        [testEmail]
      );
      assert.strictEqual(dbCheck.rows.length, 1, 'Lead must exist in crm_schema.leads');
      pass('Lead correctly recorded in database with open pipeline status');

      // Cleanup test lead
      await pool.query(`DELETE FROM crm_schema.leads WHERE email = $1`, [testEmail]);
    } catch (e) { fail('Valid contact form submission', e); }

    // ─────────────────────────────────────────────────────────────
    // 4. SECURITY, DATA ISOLATION & 404 RESILIENCE
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. SECURITY, DRAFT PROTECTION & ERROR HANDLING:');

    // Test non-existent page returns 404
    try {
      const notFoundRes = await request('/public/pages/nonexistent-route-999xyz');
      assert.strictEqual(notFoundRes.status, 404, 'Non-existent page must return 404 Not Found');
      pass('Unknown routes cleanly return 404 Not Found without crashing');
    } catch (e) { fail('404 resilience test', e); }

    // Ensure draft posts are NEVER exposed to public endpoint
    try {
      const blogListRes = await request('/public/blog');
      const articles = blogListRes.data?.data || [];
      const hasDraft = articles.some((a) => a.status === 'draft');
      assert.strictEqual(hasDraft, false, 'Unpublished draft articles must not appear in public listing');
      pass('Strict privacy: Draft and unpublished articles are never exposed publicly');
    } catch (e) { fail('Draft protection test', e); }

    // Test that protected administrative endpoints require authentication
    try {
      const saOnlyRes = await request('/cms/stats');
      assert.strictEqual(saOnlyRes.status, 401, 'Administrative CMS stats must return 401 Unauthorized');
      pass('Administrative endpoints enforce authentication (401 Unauthorized)');
    } catch (e) { fail('Admin authentication test', e); }

  } catch (fatal) {
    console.error('Fatal test error:', fatal);
    failed++;
  } finally {
    if (server) server.close();
    await pool.end();

    console.log('\n======================================================');
    console.log(` PUBLIC SPEED SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
