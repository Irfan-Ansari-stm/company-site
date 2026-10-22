// src/routes/support.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generatePublicId, success, created, noContent } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  SUPPORT TICKETS
// ════════════════════════════════════════════════════════════
router.get('/tickets', authenticate, requirePermission('ticket.read'), paginate, asyncHandler(async (req, res) => {
  const { status, priority, client_id, assigned_to, type, from_date, to_date, search } = req.query;
  const isAgentOrAdmin = !['client','candidate'].includes(req.user?.role);

  const conditions = ['t.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (!isAgentOrAdmin) {
    conditions.push(`(t.client_id IN (SELECT id FROM client_schema.clients WHERE user_id=$${idx}) OR t.reporter_id=$${idx})`);
    params.push(req.userId); idx++;
  }
  if (status)      { conditions.push(`t.status=$${idx}::ticket_status`); params.push(status); idx++; }
  if (priority)    { conditions.push(`t.priority=$${idx}::ticket_priority`); params.push(priority); idx++; }
  if (client_id)   { conditions.push(`t.client_id=$${idx}`);   params.push(client_id); idx++; }
  if (assigned_to) { conditions.push(`t.assigned_to=$${idx}`); params.push(assigned_to); idx++; }
  if (type)        { conditions.push(`t.type=$${idx}`);         params.push(type); idx++; }
  if (from_date)   { conditions.push(`t.created_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)     { conditions.push(`t.created_at <= $${idx}`); params.push(to_date);   idx++; }
  if (search) {
    conditions.push(`(t.subject ILIKE $${idx} OR t.ticket_number ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT t.id, t.ticket_number, t.subject, t.status, t.priority, t.type,
              t.first_response_at, t.resolved_at, t.created_at, t.updated_at,
              u.display_name AS assigned_to_name,
              cl.company_name AS client_name,
              COALESCE(reporter.display_name, t.reporter_name) AS reporter_name,
              COUNT(tr.id) AS reply_count
         FROM support_schema.tickets t
         LEFT JOIN auth_schema.users     u        ON t.assigned_to=u.id
         LEFT JOIN client_schema.clients cl       ON t.client_id=cl.id
         LEFT JOIN auth_schema.users     reporter ON t.reporter_id=reporter.id
         LEFT JOIN support_schema.ticket_messages tr ON tr.ticket_id=t.id AND tr.deleted_at IS NULL
        WHERE ${where}
        GROUP BY t.id, u.display_name, cl.company_name, reporter.display_name
        ORDER BY t.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM support_schema.tickets t WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/tickets/stats', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `AND (client_id IN (SELECT id FROM client_schema.clients WHERE user_id=$1) OR reporter_id=$1)`
    : '';
  const params = isClient ? [req.userId] : [];

  const { rows } = await query(
    `SELECT
       COUNT(*)::bigint AS total_tickets,
       COUNT(*) FILTER (WHERE status IN ('open', 'in_progress', 'pending_client', 'on_hold'))::bigint AS open_count,
       COUNT(*) FILTER (WHERE status = 'in_progress')::bigint AS in_progress_count,
       COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::bigint AS resolved_count,
       COUNT(*) FILTER (WHERE status IN ('resolved', 'closed') AND resolved_at >= CURRENT_DATE)::bigint AS resolved_today,
       COUNT(*) FILTER (WHERE priority = 'critical')::bigint AS critical_count
     FROM support_schema.tickets
     WHERE deleted_at IS NULL ${clientFilter}`,
    params
  );
  const row = rows[0] || {};
  return success(res, {
    total_tickets: parseInt(row.total_tickets || 0),
    open_count: parseInt(row.open_count || 0),
    in_progress_count: parseInt(row.in_progress_count || 0),
    resolved_count: parseInt(row.resolved_count || 0),
    resolved_today: parseInt(row.resolved_today || 0),
    critical_count: parseInt(row.critical_count || 0),
  });
}));

router.get('/tickets/:id', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const { rows } = await query(
    `SELECT t.*,
            u.display_name AS assigned_to_name,
            cl.company_name AS client_name,
            COALESCE(reporter.display_name, t.reporter_name) AS reporter_name,
            COALESCE(reporter.email, t.reporter_email) AS reporter_email
       FROM support_schema.tickets t
       LEFT JOIN auth_schema.users     u        ON t.assigned_to=u.id
       LEFT JOIN client_schema.clients cl       ON t.client_id=cl.id
       LEFT JOIN auth_schema.users     reporter ON t.reporter_id=reporter.id
      WHERE t.id=$1 AND t.deleted_at IS NULL
        ${isClient ? 'AND (t.client_id IN (SELECT id FROM client_schema.clients WHERE user_id=$2) OR t.reporter_id=$2)' : ''}`,
    isClient ? [req.params.id, req.userId] : [req.params.id]
  );
  if (!rows.length) throw new AppError('Ticket not found', 404);

  const ticket = rows[0];
  const [replies, attachments, history] = await Promise.all([
    query(
      `SELECT r.id, r.ticket_id, r.author_id, r.content, r.is_internal, r.is_edited, r.created_at,
              u.display_name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
         FROM support_schema.ticket_messages r
         JOIN auth_schema.users u ON r.author_id=u.id
        WHERE r.ticket_id=$1 AND r.deleted_at IS NULL
          ${isClient ? 'AND r.is_internal=FALSE' : ''}
        ORDER BY r.created_at ASC`,
      [ticket.id]
    ),
    query(
      `SELECT ta.* FROM support_schema.ticket_attachments ta WHERE ta.ticket_id=$1`,
      [ticket.id]
    ),
    query(
      `SELECT th.*, u.display_name AS actor_name
         FROM support_schema.ticket_history th
         LEFT JOIN auth_schema.users u ON th.actor_id=u.id
        WHERE th.ticket_id=$1 ORDER BY th.created_at DESC LIMIT 20`,
      [ticket.id]
    ),
  ]);

  return success(res, {
    ...ticket,
    replies: replies.rows,
    attachments: attachments.rows,
    history: history.rows
  });
}));

router.post('/tickets', optionalAuth, asyncHandler(async (req, res) => {
  const { client_id, subject, description, type, priority, project_id,
          reporter_email, reporter_name, cc_emails } = req.body;
  if (!subject || !description) throw new AppError('subject and description required');

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await query(
    `INSERT INTO support_schema.tickets
       (ticket_number, client_id, reporter_id, reporter_email, reporter_name, project_id,
        subject, description, type, priority, cc_emails, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::ticket_priority,$11,'open') RETURNING *`,
    [ticketNumber, client_id || null, req.userId || null, reporter_email || null, reporter_name || null,
     project_id || null, subject, description, type || 'support',
     priority || 'medium', cc_emails || []]
  );
  return created(res, rows[0]);
}));

router.patch('/tickets/:id', authenticate, requirePermission('ticket.manage'), asyncHandler(async (req, res) => {
  const { status, priority, assigned_to, type, tags, resolution, sla_paused } = req.body;
  const { rows } = await query(
    `UPDATE support_schema.tickets
        SET status      = COALESCE($2::ticket_status, status),
            priority    = COALESCE($3::ticket_priority, priority),
            assigned_to = COALESCE($4, assigned_to),
            type        = COALESCE($5, type),
            tags        = COALESCE($6, tags),
            resolution  = COALESCE($7, resolution),
            sla_paused  = COALESCE($8, sla_paused),
            resolved_at = CASE WHEN $2='resolved' AND status != 'resolved' THEN NOW() ELSE resolved_at END,
            closed_at   = CASE WHEN $2='closed'   AND status != 'closed'   THEN NOW() ELSE closed_at END,
            updated_at  = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, status, priority, assigned_to, type, tags, resolution, sla_paused]
  );
  if (!rows.length) throw new AppError('Ticket not found', 404);
  return success(res, rows[0]);
}));

// Ticket Replies
router.post('/tickets/:id/replies', authenticate, asyncHandler(async (req, res) => {
  const { content, is_internal } = req.body;
  if (!content) throw new AppError('content required');

  const isClient = req.user?.role === 'client';
  const internalNote = isClient ? false : (is_internal === true);

  const reply = await withTransaction(async (client) => {
    const repRes = await client.query(
      `INSERT INTO support_schema.ticket_messages (ticket_id, author_id, content, is_internal)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.userId, content, internalNote]
    );

    // Update ticket status and first_response_at
    await client.query(
      `UPDATE support_schema.tickets
          SET status = CASE WHEN status='open' THEN 'in_progress' ELSE status END,
              first_response_at = CASE WHEN first_response_at IS NULL THEN NOW() ELSE first_response_at END,
              updated_at = NOW()
        WHERE id=$1`,
      [req.params.id]
    );

    return repRes.rows[0];
  });

  return created(res, reply);
}));

router.patch('/tickets/:id/replies/:replyId', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { rows } = await query(
    `UPDATE support_schema.ticket_messages
        SET content=$3, is_edited=TRUE
      WHERE id=$1 AND ticket_id=$2 AND author_id=$4 RETURNING *`,
    [req.params.replyId, req.params.id, content, req.userId]
  );
  if (!rows.length) throw new AppError('Reply not found or not yours', 404);
  return success(res, rows[0]);
}));

router.delete('/tickets/:id/replies/:replyId', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE support_schema.ticket_messages SET deleted_at=NOW() WHERE id=$1 AND ticket_id=$2 AND (author_id=$3 OR $4 = 'super_admin')`,
    [req.params.replyId, req.params.id, req.userId, req.user?.role]
  );
  return noContent(res);
}));

// CSAT rating
router.post('/tickets/:id/rate', asyncHandler(async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError('rating must be 1-5');
  await query(
    `UPDATE support_schema.tickets SET satisfaction=$1, updated_at=NOW() WHERE id=$2`,
    [rating, req.params.id]
  );
  return success(res, {}, 'Rating submitted');
}));

// Knowledge base / FAQ
router.get('/kb', asyncHandler(async (req, res) => {
  const { search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (search) {
    conditions.push(`(title ILIKE $${idx} OR summary ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT id, title, slug, summary AS excerpt
       FROM cms_schema.services
      ${where}
      ORDER BY sort_order ASC
      LIMIT 20`,
    params
  );
  return success(res, rows);
}));

module.exports = router;
