// src/tests/dashboard-modules-verification.test.js
// Verification suite for Marketing, Services, Portfolio, Blog, and CMS Studio dashboard modules
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
    ...(options.token !== undefined ? (options.token ? { Authorization: `Bearer ${options.token}` } : {}) : { Authorization: `Bearer ${adminToken}` }),
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
  console.log(' ADMIN DASHBOARD MODULES COMPREHENSIVE VERIFICATION');
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

  app.use('/api/v1/marketing', require('../routes/marketing'));
  const { router: servicesRouter, industriesRouter, solutionsRouter } = require('../routes/services');
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/industries', industriesRouter);
  app.use('/api/v1/solutions', solutionsRouter);
  app.use('/api/v1/portfolio', require('../routes/portfolio'));
  app.use('/api/v1/blog', require('../routes/blog'));
  app.use('/api/v1/cms', require('../routes/cms'));

  const { errorHandler } = require('../middleware/errorHandler');
  app.use(errorHandler);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const adminRes = await pool.query(
    `SELECT id FROM auth_schema.users WHERE role='super_admin' AND is_active=TRUE LIMIT 1`
  );
  if (adminRes.rows.length > 0) {
    adminUserId = adminRes.rows[0].id;
  } else {
    const newAdmin = await pool.query(
      `INSERT INTO auth_schema.users (email, password_hash, full_name, display_name, role, is_active)
       VALUES ('admin.test@sysmaira.internal', 'hash', 'Test Admin', 'TestAdmin', 'super_admin', TRUE)
       RETURNING id`
    );
    adminUserId = newAdmin.rows[0].id;
  }
  adminToken = generateToken(adminUserId, 'super_admin');

  // ============================================================
  // 1. MARKETING MODULE
  // ============================================================
  console.log('\n--- 1. Marketing Dashboard Module ---');

  await test('Marketing Stats API returns real database counts', async () => {
    const res = await api('/marketing/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(typeof res.data.data.total_subscribers === 'number');
    assert(typeof res.data.data.email_lists === 'number');
    assert(typeof res.data.data.campaigns === 'number');
    assert(typeof res.data.data.active_coupons === 'number');
  });

  let testCampaignId;
  await test('Create, Duplicate, and Delete Campaign', async () => {
    const createRes = await api('/marketing/campaigns', {
      method: 'POST',
      body: {
        name: 'Verification Campaign Q4',
        subject: 'Special Product Announcement',
        content: '<h1>Hello Sysmaira</h1>',
        campaign_type: 'newsletter',
      },
    });
    assert.strictEqual(createRes.status, 201);
    testCampaignId = createRes.data.data.id;

    // Duplicate
    const dupRes = await api(`/marketing/campaigns/${testCampaignId}/duplicate`, {
      method: 'POST',
    });
    assert.strictEqual(dupRes.status, 201);
    const duplicatedId = dupRes.data.data.id;
    assert.strictEqual(dupRes.data.data.name, 'Verification Campaign Q4 (Copy)');

    // Delete duplicated and original
    const delDup = await api(`/marketing/campaigns/${duplicatedId}`, { method: 'DELETE' });
    assert.strictEqual(delDup.status, 204);
    const delOrig = await api(`/marketing/campaigns/${testCampaignId}`, { method: 'DELETE' });
    assert.strictEqual(delOrig.status, 204);
  });

  let testSubId;
  await test('Subscribe and Delete Subscriber', async () => {
    const subEmail = `test.sub.${Date.now()}@example.com`;
    const subRes = await api('/marketing/subscribers/subscribe', {
      method: 'POST',
      body: {
        email: subEmail,
        first_name: 'Tester',
      },
    });
    assert.strictEqual(subRes.status, 201);
    testSubId = subRes.data.data.id;

    const delSub = await api(`/marketing/subscribers/${testSubId}`, { method: 'DELETE' });
    assert.strictEqual(delSub.status, 204);
  });

  // ============================================================
  // 2. SERVICES MODULE
  // ============================================================
  console.log('\n--- 2. Services Dashboard Module ---');

  await test('Get Services returns active services with category name', async () => {
    const res = await api('/services?limit=10');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
  });

  let testServiceId;
  let testFeatureId;
  await test('Create Service, Add Feature, Update, and Delete Service', async () => {
    const sTitle = `Cloud Architecture AI ${Date.now()}`;
    const createRes = await api('/services', {
      method: 'POST',
      body: {
        title: sTitle,
        pricing_type: 'fixed',
        starting_price: 15000,
        summary: 'High availability scalable cloud blueprints',
      },
    });
    assert.strictEqual(createRes.status, 201);
    testServiceId = createRes.data.data.id;

    // Add Feature
    const featRes = await api(`/services/${testServiceId}/features`, {
      method: 'POST',
      body: {
        title: 'Terraform IaC automation',
        description: 'Zero drift infrastructure deployment',
      },
    });
    assert.strictEqual(featRes.status, 201);
    testFeatureId = featRes.data.data.id;

    // Remove Feature
    const remFeat = await api(`/services/${testServiceId}/features/${testFeatureId}`, { method: 'DELETE' });
    assert.strictEqual(remFeat.status, 204);

    // Update Service
    const patchRes = await api(`/services/${testServiceId}`, {
      method: 'PATCH',
      body: {
        is_featured: true,
        starting_price: 18000,
      },
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.data.is_featured, true);

    // Delete Service
    const delRes = await api(`/services/${testServiceId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 204);
  });

  // ============================================================
  // 3. PORTFOLIO MODULE
  // ============================================================
  console.log('\n--- 3. Portfolio Dashboard Module ---');

  let testProjectId;
  let testMetricId;
  await test('Create Project, Add Metric, Update, and Delete Project', async () => {
    const pTitle = `Enterprise FinTech Hub ${Date.now()}`;
    const createRes = await api('/portfolio', {
      method: 'POST',
      body: {
        title: pTitle,
        client_name: 'Bank Corp',
        summary: 'Ultra-low latency settlement ledger',
        project_url: 'https://bankcorp.example.com',
        is_published: true,
      },
    });
    assert.strictEqual(createRes.status, 201);
    testProjectId = createRes.data.data.id;

    // Add Metric
    const mRes = await api(`/portfolio/${testProjectId}/metrics`, {
      method: 'POST',
      body: {
        metric_name: 'Transaction Latency',
        value: '45',
        suffix: 'ms',
      },
    });
    assert.strictEqual(mRes.status, 201);
    testMetricId = mRes.data.data.id;

    // Remove Metric
    const remM = await api(`/portfolio/${testProjectId}/metrics/${testMetricId}`, { method: 'DELETE' });
    assert.strictEqual(remM.status, 204);

    // Update Project
    const patchRes = await api(`/portfolio/${testProjectId}`, {
      method: 'PATCH',
      body: {
        client_name: 'Bank Corp International',
        is_featured: true,
      },
    });
    assert.strictEqual(patchRes.status, 200);

    // Delete Project
    const delRes = await api(`/portfolio/${testProjectId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 204);
  });

  // ============================================================
  // 4. BLOG MODULE
  // ============================================================
  console.log('\n--- 4. Blog Dashboard Module ---');

  let testPostId;
  let testCatId;
  await test('Create Category, Post, Update, and Archive Post', async () => {
    const catName = `DevOps ${Date.now()}`;
    const catRes = await api('/blog/categories', {
      method: 'POST',
      body: {
        name: catName,
        slug: `devops-${Date.now()}`,
        description: 'DevOps practices and pipelines',
      },
    });
    assert.strictEqual(catRes.status, 201);
    testCatId = catRes.data.data.id;

    // Create Post
    const postRes = await api('/blog/posts', {
      method: 'POST',
      body: {
        title: `Zero-Downtime Deployments with K8s ${Date.now()}`,
        content: '# Deployment Guide\n\nStep by step zero-downtime rolling update configuration.',
        category_id: testCatId,
        cover_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
        status: 'draft',
      },
    });
    assert.strictEqual(postRes.status, 201);
    testPostId = postRes.data.data.id;

    // Update Post to published
    const patchRes = await api(`/blog/posts/${testPostId}`, {
      method: 'PATCH',
      body: {
        status: 'published',
        is_featured: true,
      },
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.data.status, 'published');
    assert.strictEqual(patchRes.data.data.is_featured, true);

    // Archive Post
    const delRes = await api(`/blog/posts/${testPostId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 204);

    // Delete Category
    const delCat = await api(`/blog/categories/${testCatId}`, { method: 'DELETE' });
    assert.strictEqual(delCat.status, 204);
  });

  // ============================================================
  // 5. CMS STUDIO MODULE
  // ============================================================
  console.log('\n--- 5. CMS Studio Module ---');

  await test('CMS Studio Stats and Site Settings', async () => {
    const statsRes = await api('/cms/stats');
    assert.strictEqual(statsRes.status, 200);
    assert(statsRes.data.data.pages !== undefined);

    const themeRes = await api('/cms/theme-settings');
    assert.strictEqual(themeRes.status, 200);

    const siteSettings = await api('/cms/site-settings');
    assert.strictEqual(siteSettings.status, 200);
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
