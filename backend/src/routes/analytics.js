// src/routes/analytics.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/common');
const { success } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  DATE RANGE HELPER
// ════════════════════════════════════════════════════════════
function parseDateRange(req) {
  const { days, preset, from_date, to_date } = req.query;

  const now = new Date();
  let endDate = new Date(now);
  let startDate = new Date(now);

  if (from_date && to_date) {
    startDate = new Date(from_date);
    endDate = new Date(to_date);
    // Make sure endDate encompasses the whole day
    endDate.setHours(23, 59, 59, 999);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date format. Expected YYYY-MM-DD', 400);
    }
    if (startDate > endDate) {
      throw new AppError('from_date must be before to_date', 400);
    }
  } else if (preset === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now);
  } else if (preset === 'prev_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    const numDays = Math.min(Math.max(parseInt(days || '30', 10), 1), 365);
    startDate = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);
    endDate = new Date(now);
  }

  // Duration for comparison period
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    prevStartDate: prevStartDate.toISOString(),
    prevEndDate: prevEndDate.toISOString(),
  };
}

// Safe percent change calculation: avoids divide by zero
function calcGrowth(curr, prev) {
  const c = parseFloat(curr) || 0;
  const p = parseFloat(prev) || 0;
  if (p === 0) {
    return c > 0 ? 100.0 : 0.0;
  }
  return parseFloat((((c - p) / p) * 100).toFixed(1));
}

// ════════════════════════════════════════════════════════════
//  1. GET /analytics/dashboard (Used by Analytics & Dashboard pages)
// ════════════════════════════════════════════════════════════
router.get('/dashboard', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const { startDate, endDate, prevStartDate, prevEndDate } = parseDateRange(req);

  const [
    currSummaryRes,
    prevSummaryRes,
    viewsByDateRes,
    topPagesRes,
    topReferrersRes,
    devicesRes,
    countriesRes,
    leadPipelineRes,
  ] = await Promise.all([
    // Current period summary
    query(
      `SELECT
         COUNT(*)::int AS page_views,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors,
         COUNT(DISTINCT session_id)::int AS total_sessions,
         COALESCE(AVG(duration_sec), 0)::int AS avg_session_duration,
         CASE
           WHEN COUNT(DISTINCT session_id) > 0 THEN
             ROUND((COUNT(DISTINCT session_id) FILTER (WHERE duration_sec IS NULL OR duration_sec < 10)::numeric / COUNT(DISTINCT session_id)::numeric) * 100, 1)
           ELSE 0
         END AS bounce_rate
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    ),

    // Previous period summary (for growth comparison)
    query(
      `SELECT
         COUNT(*)::int AS page_views,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2`,
      [prevStartDate, prevEndDate]
    ),

    // Page views by date
    query(
      `SELECT
         TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
         COUNT(*)::int AS views,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    ),

    // Top pages
    query(
      `SELECT
         page_path AS page_url,
         COALESCE(page_title, page_path) AS page_title,
         COUNT(*)::int AS views,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY page_path, page_title
       ORDER BY views DESC
       LIMIT 10`,
      [startDate, endDate]
    ),

    // Top referrers
    query(
      `SELECT
         COALESCE(NULLIF(referrer, ''), 'Direct') AS referrer,
         COUNT(DISTINCT session_id)::int AS sessions,
         COUNT(*)::int AS views
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct')
       ORDER BY sessions DESC
       LIMIT 10`,
      [startDate, endDate]
    ),

    // Device breakdown
    query(
      `SELECT
         COALESCE(device_type, 'desktop') AS device_type,
         COUNT(*)::int AS count
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY device_type
       ORDER BY count DESC`,
      [startDate, endDate]
    ),

    // Country breakdown
    query(
      `SELECT
         COALESCE(country, 'Unknown') AS country,
         COUNT(DISTINCT session_id)::int AS sessions
       FROM analytics_schema.page_views
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY country
       ORDER BY sessions DESC
       LIMIT 10`,
      [startDate, endDate]
    ),

    // Lead pipeline from CRM
    query(
      `SELECT
         stage,
         COUNT(*)::int AS count,
         COALESCE(SUM(expected_value), 0)::numeric AS pipeline_value
       FROM crm_schema.leads
       WHERE deleted_at IS NULL
       GROUP BY stage
       ORDER BY count DESC`
    ),
  ]);

  const curr = currSummaryRes.rows[0] || { page_views: 0, unique_visitors: 0, avg_session_duration: 0, bounce_rate: 0 };
  const prev = prevSummaryRes.rows[0] || { page_views: 0, unique_visitors: 0 };

  const totalDeviceCount = devicesRes.rows.reduce((sum, d) => sum + parseInt(d.count, 10), 0);
  const deviceBreakdown = devicesRes.rows.map(d => ({
    device_type: d.device_type,
    count: parseInt(d.count, 10),
    percent: totalDeviceCount > 0 ? parseFloat((d.count / totalDeviceCount).toFixed(2)) : 0,
  }));

  return success(res, {
    period: {
      from: startDate,
      to: endDate,
    },
    summary: {
      page_views: parseInt(curr.page_views || 0, 10),
      page_views_growth: calcGrowth(curr.page_views, prev.page_views),
      unique_visitors: parseInt(curr.unique_visitors || 0, 10),
      visitors_growth: calcGrowth(curr.unique_visitors, prev.unique_visitors),
      avg_session_duration: parseInt(curr.avg_session_duration || 0, 10),
      bounce_rate: parseFloat(curr.bounce_rate || 0),
    },
    page_views_by_date: viewsByDateRes.rows,
    top_pages: topPagesRes.rows,
    top_referrers: topReferrersRes.rows,
    device_breakdown: deviceBreakdown,
    country_breakdown: countriesRes.rows,
    lead_pipeline: leadPipelineRes.rows,
  });
}));

// ════════════════════════════════════════════════════════════
//  2. GET /analytics/traffic-sources
// ════════════════════════════════════════════════════════════
router.get('/traffic-sources', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const { startDate, endDate } = parseDateRange(req);

  const { rows } = await query(
    `SELECT
       COALESCE(NULLIF(utm_source, ''), NULLIF(referrer, ''), 'Direct') AS source,
       COUNT(DISTINCT session_id)::int AS sessions,
       COUNT(*)::int AS page_views
     FROM analytics_schema.page_views
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY COALESCE(NULLIF(utm_source, ''), NULLIF(referrer, ''), 'Direct')
     ORDER BY sessions DESC
     LIMIT 20`,
    [startDate, endDate]
  );

  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  3. GET /analytics/conversion (Conversion Funnel)
// ════════════════════════════════════════════════════════════
router.get('/conversion', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const { rows } = await query(`SELECT * FROM analytics_schema.v_conversion_funnel`);
  const data = rows[0] || { visitors: 0, leads: 0, proposals: 0, clients: 0 };

  return success(res, {
    visitors: parseInt(data.visitors || 0, 10),
    leads: parseInt(data.leads || 0, 10),
    proposals: parseInt(data.proposals || 0, 10),
    clients: parseInt(data.clients || 0, 10),
  });
}));

// ════════════════════════════════════════════════════════════
//  4. GET /analytics/realtime
// ════════════════════════════════════════════════════════════
router.get('/realtime', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const { rows } = await query(
    `SELECT
       COUNT(DISTINCT session_id)::int AS active_sessions,
       COUNT(*)::int AS page_views_last_5min
     FROM analytics_schema.page_views
     WHERE created_at >= NOW() - INTERVAL '5 minutes'`
  );

  return success(res, rows[0] || { active_sessions: 0, page_views_last_5min: 0 });
}));

// ════════════════════════════════════════════════════════════
//  5. GET /analytics/overview (Consolidated high-level stats)
// ════════════════════════════════════════════════════════════
router.get('/overview', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const [revRes, projRes, tktRes, trafficRes] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(amount_paid), 0)::numeric AS total_revenue,
         COALESCE(SUM(total_amount), 0)::numeric AS total_invoiced,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count
       FROM billing_schema.invoices`
    ),
    query(
      `SELECT
         COUNT(*)::int AS total_projects,
         COUNT(*) FILTER (WHERE status IN ('discovery','planning','design','development','testing','review'))::int AS active_projects,
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed_projects
       FROM client_schema.client_projects`
    ),
    query(
      `SELECT
         COUNT(*)::int AS total_tickets,
         COUNT(*) FILTER (WHERE status IN ('open','in_progress','pending_client','on_hold'))::int AS open_tickets,
         COUNT(*) FILTER (WHERE status IN ('resolved','closed'))::int AS resolved_tickets,
         COUNT(*) FILTER (WHERE status IN ('resolved','closed') AND resolved_at >= CURRENT_DATE)::int AS resolved_today
       FROM support_schema.tickets`
    ),
    query(
      `SELECT
         COUNT(*)::int AS page_views_30d,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors_30d
       FROM analytics_schema.page_views
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    ),
  ]);

  return success(res, {
    revenue: revRes.rows[0],
    projects: projRes.rows[0],
    tickets: tktRes.rows[0],
    traffic: trafficRes.rows[0],
  });
}));

// ════════════════════════════════════════════════════════════
//  6. GET /analytics/revenue (Detailed revenue breakdown)
// ════════════════════════════════════════════════════════════
router.get('/revenue', authenticate, requirePermission('billing.read'), asyncHandler(async (req, res) => {
  const { startDate, endDate, prevStartDate, prevEndDate } = parseDateRange(req);

  const [currRes, prevRes, monthlyRes, clientRevenueRes] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(amount_paid), 0)::numeric AS collected,
         COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
         COUNT(*)::int AS invoice_count
       FROM billing_schema.invoices
       WHERE issue_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    ),
    query(
      `SELECT
         COALESCE(SUM(amount_paid), 0)::numeric AS collected,
         COALESCE(SUM(total_amount), 0)::numeric AS invoiced
       FROM billing_schema.invoices
       WHERE issue_date BETWEEN $1 AND $2`,
      [prevStartDate, prevEndDate]
    ),
    query(
      `SELECT
         TO_CHAR(issue_date, 'YYYY-MM') AS month,
         COALESCE(SUM(amount_paid), 0)::numeric AS collected,
         COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
         COUNT(*)::int AS count
       FROM billing_schema.invoices
       WHERE issue_date BETWEEN $1 AND $2
       GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [startDate, endDate]
    ),
    query(
      `SELECT
         cl.company_name AS client_name,
         COALESCE(SUM(i.amount_paid), 0)::numeric AS total_paid,
         COALESCE(SUM(i.total_amount), 0)::numeric AS total_invoiced,
         COUNT(i.id)::int AS invoice_count
       FROM billing_schema.invoices i
       JOIN client_schema.clients cl ON i.client_id = cl.id
       WHERE i.issue_date BETWEEN $1 AND $2
       GROUP BY cl.company_name
       ORDER BY total_paid DESC
       LIMIT 10`,
      [startDate, endDate]
    ),
  ]);

  const curr = currRes.rows[0];
  const prev = prevRes.rows[0];

  return success(res, {
    summary: {
      collected: parseFloat(curr.collected || 0),
      invoiced: parseFloat(curr.invoiced || 0),
      invoice_count: parseInt(curr.invoice_count || 0),
      growth_collected: calcGrowth(curr.collected, prev.collected),
      growth_invoiced: calcGrowth(curr.invoiced, prev.invoiced),
    },
    monthly: monthlyRes.rows.map(r => ({
      month: r.month,
      collected: parseFloat(r.collected),
      invoiced: parseFloat(r.invoiced),
      count: parseInt(r.count),
    })),
    top_clients: clientRevenueRes.rows.map(r => ({
      client_name: r.client_name,
      total_paid: parseFloat(r.total_paid),
      total_invoiced: parseFloat(r.total_invoiced),
      invoice_count: parseInt(r.invoice_count),
    })),
  });
}));

// ════════════════════════════════════════════════════════════
//  7. GET /analytics/projects (Project distribution & analytics)
// ════════════════════════════════════════════════════════════
router.get('/projects', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  let clientId = null;
  if (isClient) {
    const { rows } = await query(`SELECT id FROM client_schema.clients WHERE user_id = $1`, [req.userId]);
    clientId = rows[0]?.id;
    if (!clientId) return success(res, { status_distribution: [], health_distribution: [], total: 0 });
  }

  const [statusRes, healthRes] = await Promise.all([
    query(
      `SELECT
         status,
         COUNT(*)::int AS count
       FROM client_schema.client_projects
       ${isClient ? 'WHERE client_id = $1' : ''}
       GROUP BY status
       ORDER BY count DESC`,
      isClient ? [clientId] : []
    ),
    query(
      `SELECT
         COALESCE(health, 'on_track') AS health,
         COUNT(*)::int AS count
       FROM client_schema.client_projects
       ${isClient ? 'WHERE client_id = $1' : ''}
       GROUP BY health`,
      isClient ? [clientId] : []
    ),
  ]);

  return success(res, {
    status_distribution: statusRes.rows,
    health_distribution: healthRes.rows,
  });
}));

// ════════════════════════════════════════════════════════════
//  8. GET /analytics/tickets (Ticket status & resolution analytics)
// ════════════════════════════════════════════════════════════
router.get('/tickets', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  let clientId = null;
  if (isClient) {
    const { rows } = await query(`SELECT id FROM client_schema.clients WHERE user_id = $1`, [req.userId]);
    clientId = rows[0]?.id;
  }

  const clientFilter = isClient
    ? `WHERE (${clientId ? 'client_id = $1 OR ' : ''}reporter_id = $2)`
    : '';
  const clientParams = isClient
    ? (clientId ? [clientId, req.userId] : [req.userId])
    : [];

  const [statusRes, priorityRes, avgTimeRes] = await Promise.all([
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM support_schema.tickets
       ${clientFilter}
       GROUP BY status`,
      clientParams
    ),
    query(
      `SELECT priority, COUNT(*)::int AS count
       FROM support_schema.tickets
       ${clientFilter}
       GROUP BY priority`,
      clientParams
    ),
    query(
      `SELECT
         COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1), 0) AS avg_resolution_hours
       FROM support_schema.tickets
       ${clientFilter ? `${clientFilter} AND` : 'WHERE'} resolved_at IS NOT NULL`,
      clientParams
    ),
  ]);

  return success(res, {
    status_distribution: statusRes.rows,
    priority_distribution: priorityRes.rows,
    avg_resolution_hours: parseFloat(avgTimeRes.rows[0]?.avg_resolution_hours || 0),
  });
}));

// ════════════════════════════════════════════════════════════
//  9. GET /analytics/traffic
// ════════════════════════════════════════════════════════════
router.get('/traffic', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const { startDate, endDate } = parseDateRange(req);

  const { rows } = await query(
    `SELECT
       TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
       COUNT(*)::int AS views,
       COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
     FROM analytics_schema.page_views
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [startDate, endDate]
  );

  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  10. Public tracking: POST /analytics/pageview & POST /analytics/event
// ════════════════════════════════════════════════════════════
router.post('/pageview', apiLimiter, asyncHandler(async (req, res) => {
  const { page_path, page_url, page_title, referrer, session_id, visitor_id, device_type, country } = req.body;
  const path = page_path || page_url || '/';
  const sessId = session_id || 'anon_' + Math.random().toString(36).substring(2, 12);
  const visId = visitor_id || sessId;

  await query(
    `INSERT INTO analytics_schema.page_views
       (user_id, session_id, visitor_id, page_path, page_title, referrer, device_type, country, ip_address, browser)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      req.userId || null,
      sessId,
      visId,
      path.substring(0, 500),
      (page_title || '').substring(0, 500),
      (referrer || '').substring(0, 500),
      (device_type || 'desktop').substring(0, 20),
      (country || 'United States').substring(0, 80),
      req.ip || null,
      (req.headers['user-agent'] || '').substring(0, 80),
    ]
  );

  return res.status(204).send();
}));

router.post('/event', apiLimiter, asyncHandler(async (req, res) => {
  const { event_name, page_path, session_id, event_props } = req.body;
  if (!event_name) throw new AppError('event_name is required', 400);

  await query(
    `INSERT INTO analytics_schema.events
       (user_id, session_id, event_name, event_props, page_path)
     VALUES ($1, $2, $3, $4::jsonb, $5)`,
    [
      req.userId || null,
      session_id || 'anon_session',
      event_name,
      JSON.stringify(event_props || {}),
      page_path || '/',
    ]
  );

  return res.status(204).send();
}));

module.exports = router;

