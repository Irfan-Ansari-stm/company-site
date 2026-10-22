// src/routes/dashboard.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { success } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Helper to resolve client_id for authenticated client user
async function getClientIdForUser(userId) {
  const { rows } = await query(
    `SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0]?.id || null;
}

// ════════════════════════════════════════════════════════════
//  GET /dashboard/summary
// ════════════════════════════════════════════════════════════
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';

  if (isClient) {
    const clientId = await getClientIdForUser(req.userId);

    const [invoicesRes, projectsRes, ticketsRes, tasksRes] = await Promise.all([
      clientId
        ? query(
            `SELECT
               COUNT(*)::int AS total_invoices,
               COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
               COUNT(*) FILTER (WHERE status = 'sent')::int AS pending_count,
               COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue_count,
               COALESCE(SUM(total_amount), 0)::numeric AS total_invoiced,
               COALESCE(SUM(amount_paid), 0)::numeric AS total_collected
             FROM billing_schema.invoices
             WHERE client_id = $1`,
            [clientId]
          )
        : Promise.resolve({ rows: [{ total_invoices: 0, paid_count: 0, pending_count: 0, overdue_count: 0, total_invoiced: 0, total_collected: 0 }] }),

      clientId
        ? query(
            `SELECT
               COUNT(*)::int AS total_projects,
               COUNT(*) FILTER (WHERE status IN ('discovery','planning','design','development','testing','review'))::int AS active_projects,
               COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed_projects
             FROM client_schema.client_projects
             WHERE client_id = $1`,
            [clientId]
          )
        : Promise.resolve({ rows: [{ total_projects: 0, active_projects: 0, completed_projects: 0 }] }),

      query(
        `SELECT
           COUNT(*)::int AS total_tickets,
           COUNT(*) FILTER (WHERE status IN ('open','in_progress','pending_client','on_hold'))::int AS open_count,
           COUNT(*) FILTER (WHERE status IN ('resolved','closed'))::int AS resolved_count,
           COUNT(*) FILTER (WHERE status IN ('resolved','closed') AND resolved_at >= CURRENT_DATE)::int AS resolved_today
         FROM support_schema.tickets
         WHERE (${clientId ? 'client_id = $1 OR ' : ''}reporter_id = $2)`,
        clientId ? [clientId, req.userId] : [null, req.userId]
      ),

      query(
        `SELECT COUNT(*)::int AS assigned_tasks
         FROM client_schema.tasks
         WHERE assigned_to = $1 AND status NOT IN ('completed','done','cancelled')`,
        [req.userId]
      ),
    ]);

    const inv = invoicesRes.rows[0];
    const proj = projectsRes.rows[0];
    const tkt = ticketsRes.rows[0];
    const tsk = tasksRes.rows[0];

    return success(res, {
      role: 'client',
      revenue: {
        total_revenue: parseFloat(inv.total_collected || 0),
        settled_invoices_count: parseInt(inv.paid_count || 0),
        pending_invoices_count: parseInt(inv.pending_count || 0),
        overdue_invoices_count: parseInt(inv.overdue_count || 0),
        total_invoiced: parseFloat(inv.total_invoiced || 0),
        currency: 'USD',
      },
      projects: {
        active_projects: parseInt(proj.active_projects || 0),
        total_projects: parseInt(proj.total_projects || 0),
        completed_projects: parseInt(proj.completed_projects || 0),
      },
      tickets: {
        open_tickets: parseInt(tkt.open_count || 0),
        resolved_tickets: parseInt(tkt.resolved_count || 0),
        resolved_today: parseInt(tkt.resolved_today || 0),
      },
      tasks: {
        assigned_tasks: parseInt(tsk.assigned_tasks || 0),
      },
    });
  }

  // Staff / Super Admin view
  const canViewAnalytics = req.user.role === 'super_admin' || req.user.permissions?.includes('analytics.read');
  const canViewBilling   = req.user.role === 'super_admin' || req.user.permissions?.includes('billing.read') || req.user.permissions?.includes('invoice.read');
  const canViewProjects  = req.user.role === 'super_admin' || req.user.permissions?.includes('project.read');
  const canViewTickets   = req.user.role === 'super_admin' || req.user.permissions?.includes('ticket.read');

  const [revRes, projRes, tktRes, trafficRes, realtimeRes] = await Promise.all([
    canViewBilling
      ? query(
          `SELECT
             COALESCE(SUM(amount_paid), 0)::numeric AS total_collected,
             COALESCE(SUM(total_amount), 0)::numeric AS total_invoiced,
             COUNT(*)::int AS total_invoices,
             COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
             COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue_count,
             COUNT(*) FILTER (WHERE status = 'sent')::int AS sent_count
           FROM billing_schema.invoices`
        )
      : Promise.resolve({ rows: [{ total_collected: 0, total_invoiced: 0, total_invoices: 0, paid_count: 0, overdue_count: 0, sent_count: 0 }] }),

    canViewProjects
      ? query(
          `SELECT
             COUNT(*)::int AS total_projects,
             COUNT(*) FILTER (WHERE status IN ('discovery','planning','design','development','testing','review'))::int AS active_projects,
             COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed_projects,
             COUNT(*) FILTER (WHERE health = 'at_risk')::int AS at_risk_projects
           FROM client_schema.client_projects`
        )
      : Promise.resolve({ rows: [{ total_projects: 0, active_projects: 0, completed_projects: 0, at_risk_projects: 0 }] }),

    canViewTickets
      ? query(
          `SELECT
             COUNT(*)::int AS total_tickets,
             COUNT(*) FILTER (WHERE status IN ('open','in_progress','pending_client','on_hold'))::int AS open_count,
             COUNT(*) FILTER (WHERE status IN ('resolved','closed'))::int AS resolved_count,
             COUNT(*) FILTER (WHERE status IN ('resolved','closed') AND resolved_at >= CURRENT_DATE)::int AS resolved_today,
             COUNT(*) FILTER (WHERE priority = 'critical' AND status IN ('open','in_progress','pending_client','on_hold'))::int AS critical_count
           FROM support_schema.tickets`
        )
      : Promise.resolve({ rows: [{ total_tickets: 0, open_count: 0, resolved_count: 0, resolved_today: 0, critical_count: 0 }] }),

    canViewAnalytics
      ? query(
          `SELECT
             COUNT(*)::int AS page_views,
             COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
           FROM analytics_schema.page_views
           WHERE created_at >= NOW() - INTERVAL '30 days'`
        )
      : Promise.resolve({ rows: [{ page_views: 0, unique_visitors: 0 }] }),

    canViewAnalytics
      ? query(
          `SELECT
             COUNT(DISTINCT session_id)::int AS active_sessions,
             COUNT(*)::int AS page_views_last_5min
           FROM analytics_schema.page_views
           WHERE created_at >= NOW() - INTERVAL '5 minutes'`
        )
      : Promise.resolve({ rows: [{ active_sessions: 0, page_views_last_5min: 0 }] }),
  ]);

  const rev = revRes.rows[0];
  const proj = projRes.rows[0];
  const tkt = tktRes.rows[0];
  const traffic = trafficRes.rows[0];
  const realtime = realtimeRes.rows[0];

  return success(res, {
    role: req.user.role,
    revenue: {
      total_revenue: parseFloat(rev.total_collected || 0),
      settled_invoices_count: parseInt(rev.paid_count || 0),
      overdue_invoices_count: parseInt(rev.overdue_count || 0),
      total_invoiced: parseFloat(rev.total_invoiced || 0),
      currency: 'USD',
    },
    projects: {
      active_projects: parseInt(proj.active_projects || 0),
      completed_projects: parseInt(proj.completed_projects || 0),
      at_risk_projects: parseInt(proj.at_risk_projects || 0),
      total_projects: parseInt(proj.total_projects || 0),
    },
    tickets: {
      open_tickets: parseInt(tkt.open_count || 0),
      resolved_tickets: parseInt(tkt.resolved_count || 0),
      resolved_today: parseInt(tkt.resolved_today || 0),
      critical_tickets: parseInt(tkt.critical_count || 0),
      total_tickets: parseInt(tkt.total_tickets || 0),
    },
    traffic: canViewAnalytics ? {
      page_views_30d: parseInt(traffic.page_views || 0),
      unique_visitors_30d: parseInt(traffic.unique_visitors || 0),
      active_sessions: parseInt(realtime.active_sessions || 0),
    } : null,
  });
}));

// ════════════════════════════════════════════════════════════
//  GET /dashboard/revenue
// ════════════════════════════════════════════════════════════
router.get('/revenue', authenticate, asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  const canViewBilling = req.user.role === 'super_admin' || req.user.permissions?.includes('billing.read');

  if (isClient) {
    const clientId = await getClientIdForUser(req.userId);
    if (!clientId) return success(res, []);

    const { rows } = await query(
      `SELECT
         TO_CHAR(issue_date, 'YYYY-MM') AS month,
         COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
         COALESCE(SUM(amount_paid), 0)::numeric AS collected,
         COUNT(*)::int AS count
       FROM billing_schema.invoices
       WHERE client_id = $1 AND issue_date >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [clientId]
    );
    return success(res, rows.map(r => ({
      month: r.month,
      invoiced: parseFloat(r.invoiced),
      collected: parseFloat(r.collected),
      count: parseInt(r.count),
    })));
  }

  if (!canViewBilling) {
    return res.status(403).json({ success: false, message: 'Permission denied for revenue analytics' });
  }

  const { rows } = await query(
    `SELECT
       TO_CHAR(issue_date, 'YYYY-MM') AS month,
       COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
       COALESCE(SUM(amount_paid), 0)::numeric AS collected,
       COUNT(*)::int AS invoice_count
     FROM billing_schema.invoices
     WHERE issue_date >= NOW() - INTERVAL '12 months'
     GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
     ORDER BY month ASC`
  );

  return success(res, rows.map(r => ({
    month: r.month,
    invoiced: parseFloat(r.invoiced),
    collected: parseFloat(r.collected),
    invoice_count: parseInt(r.invoice_count),
  })));
}));

// ════════════════════════════════════════════════════════════
//  GET /dashboard/projects
// ════════════════════════════════════════════════════════════
router.get('/projects', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  let clientId = null;
  if (isClient) {
    clientId = await getClientIdForUser(req.userId);
  }

  const conditions = [];
  const params = [];
  let idx = 1;

  if (isClient) {
    if (!clientId) return success(res, { summary: {}, projects: [] });
    conditions.push(`cp.client_id = $${idx}`);
    params.push(clientId);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [summaryRes, listRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE cp.status IN ('discovery','planning','design','development','testing','review'))::int AS active,
         COUNT(*) FILTER (WHERE cp.status = 'delivered')::int AS delivered,
         COUNT(*) FILTER (WHERE cp.status = 'on_hold')::int AS on_hold,
         COUNT(*) FILTER (WHERE cp.status = 'cancelled')::int AS cancelled
       FROM client_schema.client_projects cp
       ${whereClause}`,
      params
    ),
    query(
      `SELECT
         cp.id,
         cp.title AS name,
         cp.description,
         cp.status,
         cp.priority,
         cp.progress_percent,
         cp.health,
         cp.budget,
         cp.spent,
         cp.start_date,
         cp.end_date,
         cp.created_at,
         cl.company_name AS client_name,
         u.display_name AS manager_name
       FROM client_schema.client_projects cp
       LEFT JOIN client_schema.clients cl ON cp.client_id = cl.id
       LEFT JOIN auth_schema.users u ON cp.project_manager = u.id
       ${whereClause}
       ORDER BY cp.created_at DESC
       LIMIT 10`,
      params
    ),
  ]);

  return success(res, {
    summary: summaryRes.rows[0],
    projects: listRes.rows,
  });
}));

// ════════════════════════════════════════════════════════════
//  GET /dashboard/tickets
// ════════════════════════════════════════════════════════════
router.get('/tickets', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  let clientId = null;
  if (isClient) {
    clientId = await getClientIdForUser(req.userId);
  }

  const conditions = [];
  const params = [];
  let idx = 1;

  if (isClient) {
    conditions.push(`(${clientId ? `t.client_id = $${idx} OR ` : ''}t.reporter_id = $${clientId ? idx + 1 : idx})`);
    if (clientId) {
      params.push(clientId);
      params.push(req.userId);
      idx += 2;
    } else {
      params.push(req.userId);
      idx++;
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [statsRes, listRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE t.status IN ('open','in_progress','pending_client','on_hold'))::int AS open_count,
         COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress_count,
         COUNT(*) FILTER (WHERE t.status IN ('resolved','closed'))::int AS resolved_count,
         COUNT(*) FILTER (WHERE t.status IN ('resolved','closed') AND t.resolved_at >= CURRENT_DATE)::int AS resolved_today,
         COUNT(*) FILTER (WHERE t.priority = 'critical')::int AS critical_count
       FROM support_schema.tickets t
       ${whereClause}`,
      params
    ),
    query(
      `SELECT
         t.id,
         t.ticket_number,
         t.subject,
         t.status,
         t.priority,
         t.created_at,
         t.resolved_at,
         cl.company_name AS client_name,
         u.display_name AS assigned_to_name
       FROM support_schema.tickets t
       LEFT JOIN client_schema.clients cl ON t.client_id = cl.id
       LEFT JOIN auth_schema.users u ON t.assigned_to = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT 10`,
      params
    ),
  ]);

  return success(res, {
    stats: statsRes.rows[0],
    tickets: listRes.rows,
  });
}));

// ════════════════════════════════════════════════════════════
//  GET /dashboard/traffic
// ════════════════════════════════════════════════════════════
router.get('/traffic', authenticate, requirePermission('analytics.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ success: false, message: 'Access denied: Analytics restricted for client accounts' });
  }

  const [trendRes, realtimeRes] = await Promise.all([
    query(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*)::int AS views,
         COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS unique_visitors
       FROM analytics_schema.page_views
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ),
    query(
      `SELECT
         COUNT(DISTINCT session_id)::int AS active_sessions,
         COUNT(*)::int AS page_views_last_5min
       FROM analytics_schema.page_views
       WHERE created_at >= NOW() - INTERVAL '5 minutes'`
    ),
  ]);

  return success(res, {
    trend: trendRes.rows,
    realtime: realtimeRes.rows[0],
  });
}));

module.exports = router;

