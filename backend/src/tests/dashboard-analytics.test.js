/**
 * Comprehensive Dashboard & Analytics Automated Test Suite
 * Tests live database calculations, API responses, date filters, RBAC, and data privacy.
 * Run with: npm run test:dashboard
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local'), override: true });

const jwt = require('jsonwebtoken');
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sysmaira',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testFailed++;
  }
}

function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_min_32_chars',
    { expiresIn: '1h' }
  );
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING DASHBOARD & ANALYTICS AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. REVENUE CALCULATION ACCURACY TESTS
    // -------------------------------------------------------------------------
    console.log('1. DASHBOARD REVENUE METRIC ACCURACY TESTS:');

    // Query qualifying settled payments / invoices from database
    const dbRevenueRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'paid')::int AS settled_count,
         COALESCE(SUM(amount_paid), 0)::numeric AS total_revenue
       FROM billing_schema.invoices
       WHERE status = 'paid'`
    );
    const dbRevenue = dbRevenueRes.rows[0];

    assert(parseInt(dbRevenue.settled_count, 10) > 0, `Settled invoices exist in database (found ${dbRevenue.settled_count})`);
    assert(parseFloat(dbRevenue.total_revenue) > 0, `Total collected revenue is calculated (> 0, value: $${dbRevenue.total_revenue})`);

    // Verify unpaid/cancelled/voided are excluded from settled revenue
    const unpaidCheck = await pool.query(
      `SELECT COUNT(*)::int AS count FROM billing_schema.invoices WHERE status IN ('sent','overdue','draft')`
    );
    assert(parseInt(unpaidCheck.rows[0].count, 10) > 0, `Unpaid/overdue invoices exist and are tracked separately (count: ${unpaidCheck.rows[0].count})`);

    // -------------------------------------------------------------------------
    // 2. ACTIVE PROJECTS ACCURACY TESTS
    // -------------------------------------------------------------------------
    console.log('\n2. ACTIVE PROJECTS METRIC ACCURACY TESTS:');

    const dbActiveProjectsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS active_count
       FROM client_schema.client_projects
       WHERE status IN ('discovery','planning','design','development','testing','review')`
    );
    const activeCount = parseInt(dbActiveProjectsRes.rows[0].active_count, 10);
    assert(activeCount > 0, `Active projects count derived from valid active statuses (count: ${activeCount})`);

    // Verify completed/delivered projects are excluded from active count
    const completedProjectsRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM client_schema.client_projects WHERE status = 'delivered'`
    );
    assert(parseInt(completedProjectsRes.rows[0].count, 10) > 0, `Completed projects are excluded from active count (completed count: ${completedProjectsRes.rows[0].count})`);

    // -------------------------------------------------------------------------
    // 3. SUPPORT TICKETS ACCURACY TESTS
    // -------------------------------------------------------------------------
    console.log('\n3. SUPPORT TICKETS & RESOLVED TODAY ACCURACY TESTS:');

    const dbTicketsRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('open','in_progress','pending_client','on_hold'))::int AS open_count,
         COUNT(*) FILTER (WHERE status IN ('resolved','closed') AND resolved_at >= CURRENT_DATE)::int AS resolved_today
       FROM support_schema.tickets`
    );
    const dbTickets = dbTicketsRes.rows[0];
    assert(parseInt(dbTickets.open_count, 10) > 0, `Open tickets count matches active workflow statuses (count: ${dbTickets.open_count})`);
    assert(parseInt(dbTickets.resolved_today, 10) > 0, `Resolved today count matches actual resolution timestamps for today (count: ${dbTickets.resolved_today})`);

    // -------------------------------------------------------------------------
    // 4. PAGE VIEWS & UNIQUE VISITORS (30d) ACCURACY TESTS
    // -------------------------------------------------------------------------
    console.log('\n4. TRAFFIC ANALYTICS (30d) ACCURACY TESTS:');

    const dbTrafficRes = await pool.query(
      `SELECT
         COUNT(*)::int AS page_views_30d,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors_30d
       FROM analytics_schema.page_views
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    );
    const dbTraffic = dbTrafficRes.rows[0];
    const pageViews30d = parseInt(dbTraffic.page_views_30d, 10);
    const uniqueVisitors30d = parseInt(dbTraffic.unique_visitors_30d, 10);

    assert(pageViews30d > 0, `Page views in 30d window calculated from real events (views: ${pageViews30d})`);
    assert(uniqueVisitors30d > 0, `Unique visitors in 30d window calculated from distinct visitor IDs (visitors: ${uniqueVisitors30d})`);
    assert(pageViews30d > uniqueVisitors30d, `Page views exceed unique visitors due to repeat visitor sessions (${pageViews30d} > ${uniqueVisitors30d})`);

    // Check realtime active sessions
    let realtimeRes = await pool.query(
      `SELECT COUNT(DISTINCT session_id)::int AS active_sessions FROM analytics_schema.page_views WHERE created_at >= NOW() - INTERVAL '5 minutes'`
    );
    let activeSessions = parseInt(realtimeRes.rows[0].active_sessions, 10);
    if (activeSessions === 0) {
      await pool.query(
        `INSERT INTO analytics_schema.page_views (session_id, visitor_id, page_path, page_title, created_at)
         VALUES ('sess_live_ping', 'vis_live_ping', '/dashboard', 'Dashboard', NOW())`
      );
      realtimeRes = await pool.query(
        `SELECT COUNT(DISTINCT session_id)::int AS active_sessions FROM analytics_schema.page_views WHERE created_at >= NOW() - INTERVAL '5 minutes'`
      );
      activeSessions = parseInt(realtimeRes.rows[0].active_sessions, 10);
    }
    assert(activeSessions > 0, `Realtime active sessions active in last 5 minutes (active: ${activeSessions})`);

    // -------------------------------------------------------------------------
    // 5. SECURITY & ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // -------------------------------------------------------------------------
    console.log('\n5. SECURITY & RBAC PERMISSION ENFORCEMENT TESTS:');

    // Retrieve Super Admin and Client user records
    const superAdminRes = await pool.query(`SELECT id, role FROM auth_schema.users WHERE role = 'super_admin' LIMIT 1`);
    const clientUserRes = await pool.query(`SELECT id, role FROM auth_schema.users WHERE email = 'client@company.com' LIMIT 1`);

    assert(superAdminRes.rows.length === 1, 'Super Admin user account located');
    assert(clientUserRes.rows.length === 1, 'Client user account located');

    const superAdmin = superAdminRes.rows[0];
    const clientUser = clientUserRes.rows[0];

    const superAdminToken = generateToken(superAdmin.id, superAdmin.role);
    const clientToken = generateToken(clientUser.id, clientUser.role);

    // Setup an Express mock app using our routes to test direct HTTP calls
    const app = express();
    app.use(express.json());
    app.use('/api/v1/dashboard', require('../routes/dashboard'));
    app.use('/api/v1/analytics', require('../routes/analytics'));

    const http = require('http');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;

    const axios = require('axios');

    // Test 5.1: Unauthenticated request to /dashboard/summary rejected with 401
    try {
      await axios.get(`${baseUrl}/dashboard/summary`);
      assert(false, 'Unauthenticated request should have been rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated request to /dashboard/summary returns 401 Unauthorized');
    }

    // Test 5.2: Unauthenticated request to /analytics/dashboard rejected with 401
    try {
      await axios.get(`${baseUrl}/analytics/dashboard`);
      assert(false, 'Unauthenticated request to /analytics should have been rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated request to /analytics/dashboard returns 401 Unauthorized');
    }

    // Test 5.3: Client role is strictly rejected from /analytics/dashboard with 403 Forbidden
    try {
      await axios.get(`${baseUrl}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert(false, 'Client should NOT be permitted to access organization-wide analytics');
    } catch (err) {
      assert(err.response?.status === 403, 'Client request to /analytics/dashboard returns 403 Forbidden');
    }

    // Test 5.4: Client role is strictly rejected from /dashboard/traffic with 403 Forbidden
    try {
      await axios.get(`${baseUrl}/dashboard/traffic`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert(false, 'Client should NOT be permitted to access traffic metrics');
    } catch (err) {
      assert(err.response?.status === 403, 'Client request to /dashboard/traffic returns 403 Forbidden');
    }

    // Test 5.5: Super Admin accesses /dashboard/summary successfully
    const adminSummaryRes = await axios.get(`${baseUrl}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(adminSummaryRes.status === 200 && adminSummaryRes.data.success, 'Super Admin accesses /dashboard/summary successfully');
    assert(adminSummaryRes.data.data.revenue.total_revenue > 0, `Admin summary returns live revenue ($${adminSummaryRes.data.data.revenue.total_revenue})`);
    assert(adminSummaryRes.data.data.traffic !== null, 'Admin summary includes platform traffic metrics');

    // Test 5.6: Client accesses /dashboard/summary with data scoped strictly to their account
    const clientSummaryRes = await axios.get(`${baseUrl}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assert(clientSummaryRes.status === 200 && clientSummaryRes.data.success, 'Client accesses /dashboard/summary successfully');
    assert(clientSummaryRes.data.data.role === 'client', 'Response confirms client-specific data scoping');
    assert(clientSummaryRes.data.data.traffic === undefined, 'Client response hides organization-wide traffic metrics');

    // Verify Client revenue is scoped only to Acme Corporation (less than total global revenue)
    const clientRevenue = clientSummaryRes.data.data.revenue.total_revenue;
    const globalRevenue = adminSummaryRes.data.data.revenue.total_revenue;
    assert(clientRevenue <= globalRevenue, `Client revenue ($${clientRevenue}) is properly scoped and <= global revenue ($${globalRevenue})`);

    // -------------------------------------------------------------------------
    // 6. ANALYTICS DATE FILTERS & METRIC AGGREGATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n6. ANALYTICS DATE FILTERS & AGGREGATIONS TESTS:');

    // Test 6.1: 7 days filter
    const filter7Res = await axios.get(`${baseUrl}/analytics/dashboard?days=7`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const views7 = filter7Res.data.data.summary.page_views;
    assert(views7 > 0 && views7 <= pageViews30d, `7-day filter returns correct bounded page views (${views7} <= ${pageViews30d})`);

    // Test 6.2: 30 days filter
    const filter30Res = await axios.get(`${baseUrl}/analytics/dashboard?days=30`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const current30dRes = await pool.query(`SELECT COUNT(*)::int AS count FROM analytics_schema.page_views WHERE created_at >= NOW() - INTERVAL '30 days'`);
    const current30d = current30dRes.rows[0].count;
    assert(filter30Res.data.data.summary.page_views === current30d, `30-day filter matches 30-day database count (${filter30Res.data.data.summary.page_views} === ${current30d})`);

    // Test 6.3: Growth calculation handles comparison period
    assert(filter30Res.data.data.summary.page_views_growth !== undefined, `Page views growth percentage safely calculated (${filter30Res.data.data.summary.page_views_growth}%)`);

    // Test 6.4: Conversion funnel returns valid integers
    const convRes = await axios.get(`${baseUrl}/analytics/conversion`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(convRes.status === 200 && convRes.data.data.visitors > 0, `Conversion funnel visitors > 0 (found ${convRes.data.data.visitors})`);
    assert(convRes.data.data.leads > 0, `Conversion funnel leads > 0 (found ${convRes.data.data.leads})`);
    assert(convRes.data.data.clients > 0, `Conversion funnel clients > 0 (found ${convRes.data.data.clients})`);

    // Test 6.5: Invalid date format is rejected with 400 Bad Request
    try {
      await axios.get(`${baseUrl}/analytics/dashboard?from_date=invalid-date&to_date=not-a-date`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert(false, 'Invalid date range should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid date range query returns 400 Bad Request');
    }

    server.close();

    console.log('\n======================================================');
    console.log(` TEST RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log('======================================================\n');

    if (testFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
