// src/routes/notifications.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { success, noContent } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.get('/', authenticate, paginate, asyncHandler(async (req, res) => {
  const { is_read, type } = req.query;
  const conditions = ['n.user_id=$1'];
  const params     = [req.userId];
  let   idx        = 2;

  if (is_read !== undefined) { conditions.push(`n.is_read=$${idx}`); params.push(is_read === 'true'); idx++; }
  if (type)                  { conditions.push(`n.type=$${idx}`);    params.push(type); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes, unreadCount] = await Promise.all([
    query(
      `SELECT * FROM system_schema.notifications n WHERE ${where}
       ORDER BY n.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM system_schema.notifications n WHERE ${where}`, params),
    query(`SELECT COUNT(*) AS count FROM system_schema.notifications WHERE user_id=$1 AND is_read=FALSE`, [req.userId]),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    unread_count: parseInt(unreadCount.rows[0].count),
  });
}));

router.get('/count', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(*) AS count FROM system_schema.notifications WHERE user_id=$1 AND is_read=FALSE`,
    [req.userId]
  );
  return success(res, { count: parseInt(rows[0].count) });
}));

router.post('/read/:id', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE system_schema.notifications SET is_read=TRUE, read_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  return noContent(res);
}));

router.post('/read-all', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE system_schema.notifications SET is_read=TRUE, read_at=NOW() WHERE user_id=$1 AND is_read=FALSE`,
    [req.userId]
  );
  return success(res, {}, 'All notifications marked as read');
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await query(
    `DELETE FROM system_schema.notifications WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  return noContent(res);
}));

// Notification preferences
router.get('/preferences', authenticate, asyncHandler(async (req, res) => {
  return success(res, {});
}));

router.put('/preferences', authenticate, asyncHandler(async (req, res) => {
  const { email_enabled, push_enabled, sms_enabled, in_app_enabled, preferences } = req.body;
  return success(res, {
    email_enabled: email_enabled !== false,
    push_enabled: push_enabled !== false,
    sms_enabled: sms_enabled || false,
    in_app_enabled: in_app_enabled !== false,
    preferences: preferences || {},
  }, 'Preferences updated');
}));

// Push subscriptions
router.post('/push-subscribe', authenticate, asyncHandler(async (req, res) => {
  const { endpoint, keys, device_name } = req.body;
  if (!endpoint || !keys) throw new AppError('endpoint and keys required');
  await query(
    `INSERT INTO notification_schema.push_subscriptions (user_id, endpoint, keys, device_name)
     VALUES ($1,$2,$3::jsonb,$4)
     ON CONFLICT (endpoint) DO UPDATE SET keys=EXCLUDED.keys, updated_at=NOW()`,
    [req.userId, endpoint, JSON.stringify(keys), device_name]
  );
  return success(res, {}, 'Push subscription saved');
}));

module.exports = router;

// ═════════════════════════════════════════════════════════════
//  ANALYTICS ROUTES
// ═════════════════════════════════════════════════════════════
const analyticsRouter = require('express').Router();

analyticsRouter.post('/pageview', require('../middleware/common').apiLimiter, asyncHandler(async (req, res) => {
  const { page_url, page_title, referrer, session_id, visitor_id } = req.body;
  await query(
    `INSERT INTO analytics_schema.page_views
       (user_id, session_id, visitor_id, page_url, page_title, referrer, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [req.userId || null, session_id, visitor_id, page_url, page_title,
     referrer, req.ip, req.headers['user-agent']]
  );
  return res.status(204).send();
}));

analyticsRouter.post('/event', require('../middleware/common').apiLimiter, asyncHandler(async (req, res) => {
  const { event_name, event_category, event_label, event_value, page_url, session_id, visitor_id, metadata } = req.body;
  if (!event_name) throw new AppError('event_name required');
  await query(
    `INSERT INTO analytics_schema.events
       (user_id, session_id, visitor_id, event_name, event_category, event_label, event_value,
        page_url, ip_address, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
    [req.userId || null, session_id, visitor_id, event_name, event_category, event_label,
     event_value, page_url, req.ip, JSON.stringify(metadata || {})]
  );
  return res.status(204).send();
}));

analyticsRouter.get('/dashboard', authenticate, requirePermission('analytics.view'), asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const fromDate = from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate   = to_date   || new Date().toISOString().split('T')[0];

  const [pageViews, topPages, eventStats, visitors, leadStats] = await Promise.all([
    query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS views
         FROM analytics_schema.page_views WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at) ORDER BY date`,
      [fromDate, toDate]
    ),
    query(
      `SELECT page_url, page_title, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS unique_visitors
         FROM analytics_schema.page_views WHERE created_at BETWEEN $1 AND $2
        GROUP BY page_url, page_title ORDER BY views DESC LIMIT 10`,
      [fromDate, toDate]
    ),
    query(
      `SELECT event_name, event_category, COUNT(*) AS count
         FROM analytics_schema.events WHERE created_at BETWEEN $1 AND $2
        GROUP BY event_name, event_category ORDER BY count DESC LIMIT 20`,
      [fromDate, toDate]
    ),
    query(
      `SELECT COUNT(DISTINCT visitor_id) AS unique_visitors, COUNT(DISTINCT session_id) AS sessions,
              COUNT(*) AS page_views
         FROM analytics_schema.page_views WHERE created_at BETWEEN $1 AND $2`,
      [fromDate, toDate]
    ),
    query(
      `SELECT stage, COUNT(*) AS count, SUM(expected_value) AS pipeline_value
         FROM crm_schema.leads WHERE created_at BETWEEN $1 AND $2 AND deleted_at IS NULL
        GROUP BY stage`,
      [fromDate, toDate]
    ),
  ]);

  return success(res, {
    period: { from: fromDate, to: toDate },
    summary: visitors.rows[0],
    page_views_by_date: pageViews.rows,
    top_pages: topPages.rows,
    events: eventStats.rows,
    lead_pipeline: leadStats.rows,
  });
}));

analyticsRouter.get('/traffic-sources', authenticate, requirePermission('analytics.view'), asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const { rows } = await query(
    `SELECT * FROM analytics_schema.v_traffic_sources
      WHERE ($1::date IS NULL OR date >= $1) AND ($2::date IS NULL OR date <= $2)
      ORDER BY date DESC, visits DESC LIMIT 50`,
    [from_date || null, to_date || null]
  );
  return success(res, rows);
}));

analyticsRouter.get('/conversion', authenticate, requirePermission('analytics.view'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM analytics_schema.v_conversion_funnel`);
  return success(res, rows);
}));

analyticsRouter.get('/realtime', authenticate, requirePermission('analytics.view'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(DISTINCT session_id) AS active_sessions,
            COUNT(*) AS page_views_last_5min
       FROM analytics_schema.page_views
      WHERE created_at > NOW() - INTERVAL '5 minutes'`
  );
  return success(res, rows[0]);
}));

module.exports = { router, analyticsRouter };
