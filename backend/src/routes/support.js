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
    conditions.push(`t.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$${idx})`);
    params.push(req.userId); idx++;
  }
  if (status)      { conditions.push(`t.status=$${idx}::ticket_status`); params.push(status); idx++; }
  if (priority)    { conditions.push(`t.priority=$${idx}::priority_level`); params.push(priority); idx++; }
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
              reporter.display_name AS reporter_name,
              COUNT(tr.id) AS reply_count
         FROM support_schema.tickets t
         LEFT JOIN auth_schema.users     u        ON t.assigned_to=u.id
         LEFT JOIN client_schema.clients cl       ON t.client_id=cl.id
         LEFT JOIN auth_schema.users     reporter ON t.reporter_id=reporter.id
         LEFT JOIN support_schema.ticket_replies tr ON tr.ticket_id=t.id AND tr.deleted_at IS NULL
        WHERE ${where}
        GROUP BY t.id, u.display_name, cl.company_name, reporter.display_name
        ORDER BY t.priority DESC, t.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM support_schema.tickets t WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/tickets/stats', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM support_schema.v_ticket_stats`);
  return success(res, rows[0]);
}));

router.get('/tickets/:id', authenticate, requirePermission('ticket.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.*,
            u.display_name AS assigned_to_name,
            cl.company_name AS client_name,
            reporter.display_name AS reporter_name,
            reporter.email AS reporter_email
       FROM support_schema.tickets t
       LEFT JOIN auth_schema.users     u        ON t.assigned_to=u.id
       LEFT JOIN client_schema.clients cl       ON t.client_id=cl.id
       LEFT JOIN auth_schema.users     reporter ON t.reporter_id=reporter.id
      WHERE t.id=$1 AND t.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Ticket not found', 404);

  const ticket = rows[0];
  const [replies, attachments, history] = await Promise.all([
    query(
      `SELECT r.*, u.display_name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
         FROM support_schema.ticket_replies r
         JOIN auth_schema.users u ON r.author_id=u.id
        WHERE r.ticket_id=$1 AND r.deleted_at IS NULL AND r.is_internal=FALSE
        ORDER BY r.created_at ASC`,
      [ticket.id]
    ),
    query(
      `SELECT ta.*, m.cdn_url, m.file_name, m.file_size FROM support_schema.ticket_attachments ta
         JOIN cms_schema.media m ON ta.media_id=m.id WHERE ta.ticket_id=$1`,
      [ticket.id]
    ),
    query(`SELECT * FROM support_schema.ticket_history WHERE ticket_id=$1 ORDER BY created_at DESC LIMIT 20`, [ticket.id]),
  ]);

  return success(res, { ...ticket, replies: replies.rows, attachments: attachments.rows, history: history.rows });
}));

router.post('/tickets', optionalAuth, asyncHandler(async (req, res) => {
  const { client_id, subject, description, type, priority, project_id,
          reporter_email, reporter_name, cc_emails } = req.body;
  if (!subject || !description) throw new AppError('subject and description required');

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await query(
    `INSERT INTO support_schema.tickets
       (ticket_number, client_id, reporter_id, reporter_email, reporter_name, project_id,
        subject, description, type, priority, cc_emails)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [ticketNumber, client_id || null, req.userId || null, reporter_email, reporter_name,
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
            priority    = COALESCE($3::priority_level, priority),
            assigned_to = COALESCE($4, assigned_to),
            type        = COALESCE($5, type),
            tags        = COALESCE($6, tags),
            resolution  = COALESCE($7, resolution),
            sla_paused  = COALESCE($8, sla_paused),
            resolved_at = CASE WHEN $2='resolved' AND status != 'resolved' THEN NOW() ELSE resolved_at END,
            closed_at   = CASE WHEN $2='closed'   AND status != 'closed'   THEN NOW() ELSE closed_at END
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

  const { rows } = await withTransaction(async (client) => {
    const repRes = await client.query(
      `INSERT INTO support_schema.ticket_replies (ticket_id, author_id, content, is_internal)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.userId, content, is_internal || false]
    );

    // Update ticket status and first_response_at
    await client.query(
      `UPDATE support_schema.tickets
          SET status = CASE WHEN status='open' THEN 'in_progress' ELSE status END,
              first_response_at = CASE WHEN first_response_at IS NULL THEN NOW() ELSE first_response_at END
        WHERE id=$1`,
      [req.params.id]
    );

    return repRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/tickets/:id/replies/:replyId', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { rows } = await query(
    `UPDATE support_schema.ticket_replies
        SET content=$3, is_edited=TRUE
      WHERE id=$1 AND ticket_id=$2 AND author_id=$4 RETURNING *`,
    [req.params.replyId, req.params.id, content, req.userId]
  );
  if (!rows.length) throw new AppError('Reply not found or not yours', 404);
  return success(res, rows[0]);
}));

router.delete('/tickets/:id/replies/:replyId', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE support_schema.ticket_replies SET deleted_at=NOW() WHERE id=$1 AND ticket_id=$2 AND author_id=$3`,
    [req.params.replyId, req.params.id, req.userId]
  );
  return noContent(res);
}));

// CSAT rating
router.post('/tickets/:id/rate', asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError('rating must be 1-5');
  await query(
    `UPDATE support_schema.tickets SET csat_rating=$1, csat_feedback=$2, csat_submitted_at=NOW() WHERE id=$3`,
    [rating, feedback, req.params.id]
  );
  return success(res, {}, 'Rating submitted');
}));

// Knowledge base / FAQ
router.get('/kb', asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const conditions = ['is_published=TRUE'];
  const params     = [];
  let   idx        = 1;
  if (category) { conditions.push(`category_id=$${idx}`); params.push(category); idx++; }
  if (search) {
    conditions.push(`to_tsvector('english', title || ' ' || COALESCE(content,'')) @@ plainto_tsquery('english',$${idx})`);
    params.push(search); idx++;
  }
  const where = conditions.join(' AND ');
  const { rows } = await query(
    `SELECT id, title, slug, LEFT(content, 180) AS excerpt, category_id, view_count
       FROM support_schema.knowledge_base
      WHERE ${where}
      ORDER BY view_count DESC
      LIMIT 20`,
    params
  );
  return success(res, rows);
}));

router.get('/kb/:slugOrId', asyncHandler(async (req, res) => {
  const bySlug = !require('../utils/helpers').isUUID(req.params.slugOrId);
  const col = bySlug ? 'slug' : 'id';
  const { rows } = await query(
    `SELECT * FROM support_schema.knowledge_base WHERE ${col}=$1 AND is_published=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Article not found', 404);
  await query(`UPDATE support_schema.knowledge_base SET view_count=view_count+1 WHERE id=$1`, [rows[0].id]);
  return success(res, rows[0]);
}));

router.post('/kb', authenticate, requirePermission('ticket.manage'), asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, category_id, tags } = req.body;
  if (!title || !content) throw new AppError('title and content required');
  const { rows } = await query(
    `INSERT INTO support_schema.knowledge_base (title, slug, excerpt, content, category_id, tags, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [title, slug || generatePublicId(), excerpt, content, category_id || null, tags || [], req.userId]
  );
  return created(res, rows[0]);
}));

module.exports = router;
