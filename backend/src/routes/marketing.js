// src/routes/marketing.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  NEWSLETTER SUBSCRIBERS
// ════════════════════════════════════════════════════════════
router.get('/subscribers', authenticate, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, list_id, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (status)  { conditions.push(`s.status=$${idx}::subscriber_status`); params.push(status); idx++; }
  if (list_id) { conditions.push(`EXISTS (SELECT 1 FROM marketing_schema.list_subscribers ls WHERE ls.subscriber_id=s.id AND ls.list_id=$${idx})`); params.push(list_id); idx++; }
  if (search)  { conditions.push(`(s.email ILIKE $${idx} OR s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT s.id, s.email, s.first_name, s.last_name, s.status, s.source,
              s.open_rate, s.click_rate, s.subscribed_at, s.unsubscribed_at
         FROM marketing_schema.subscribers s ${where}
        ORDER BY s.subscribed_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM marketing_schema.subscribers s ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// Public subscribe endpoint
router.post('/subscribers/subscribe', asyncHandler(async (req, res) => {
  const { email, first_name, last_name, source, list_ids, metadata } = req.body;
  if (!email) throw new AppError('email required');

  const { rows } = await withTransaction(async (client) => {
    const subRes = await client.query(
      `INSERT INTO marketing_schema.subscribers (email, first_name, last_name, source, metadata)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (email) DO UPDATE
         SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
             status=CASE WHEN marketing_schema.subscribers.status='unsubscribed'
                         THEN 'active'::subscriber_status
                         ELSE marketing_schema.subscribers.status END
       RETURNING *`,
      [email, first_name, last_name, source || 'website', JSON.stringify(metadata || {})]
    );
    const sub = subRes.rows[0];

    // Add to lists
    if (list_ids && list_ids.length) {
      for (const listId of list_ids) {
        await client.query(
          `INSERT INTO marketing_schema.list_subscribers (list_id, subscriber_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [listId, sub.id]
        );
      }
    }
    return subRes.rows;
  });
  return created(res, { id: rows[0].id }, 'Subscribed successfully');
}));

// Unsubscribe
router.post('/subscribers/unsubscribe', asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  if (!email) throw new AppError('email required');
  await query(
    `UPDATE marketing_schema.subscribers
        SET status='unsubscribed', unsubscribed_at=NOW()
      WHERE email=$1`,
    [email]
  );
  return success(res, {}, 'Unsubscribed successfully');
}));

router.get('/subscribers/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT s.*, ARRAY_AGG(DISTINCT ml.name) FILTER (WHERE ml.name IS NOT NULL) AS lists
       FROM marketing_schema.subscribers s
       LEFT JOIN marketing_schema.list_subscribers ls ON s.id=ls.subscriber_id
       LEFT JOIN marketing_schema.mailing_lists    ml ON ls.list_id=ml.id
      WHERE s.id=$1
      GROUP BY s.id`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Subscriber not found', 404);
  return success(res, rows[0]);
}));

router.patch('/subscribers/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { status, tags, custom_fields } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.subscribers
        SET status       = COALESCE($2::subscriber_status, status),
            tags         = COALESCE($3, tags),
            custom_fields= CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE custom_fields END
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, tags, custom_fields ? JSON.stringify(custom_fields) : null]
  );
  if (!rows.length) throw new AppError('Subscriber not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  MAILING LISTS
// ════════════════════════════════════════════════════════════
router.get('/lists', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT ml.*, COUNT(ls.subscriber_id) AS subscriber_count
       FROM marketing_schema.mailing_lists ml
       LEFT JOIN marketing_schema.list_subscribers ls ON ml.id=ls.list_id
      GROUP BY ml.id ORDER BY ml.name`
  );
  return success(res, rows);
}));

router.post('/lists', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, description, is_double_optin, tags } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO marketing_schema.mailing_lists (name, slug, description, is_double_optin, tags)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, generateSlug(name), description, is_double_optin || false, tags || []]
  );
  return created(res, rows[0]);
}));

router.patch('/lists/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, description, is_active } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.mailing_lists
        SET name=COALESCE($2,name), description=COALESCE($3,description), is_active=COALESCE($4,is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, description, is_active]
  );
  if (!rows.length) throw new AppError('List not found', 404);
  return success(res, rows[0]);
}));

// Add subscriber to list
router.post('/lists/:id/subscribers', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { subscriber_id } = req.body;
  if (!subscriber_id) throw new AppError('subscriber_id required');
  await query(
    `INSERT INTO marketing_schema.list_subscribers (list_id, subscriber_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, subscriber_id]
  );
  return success(res, {}, 'Subscriber added to list');
}));

router.delete('/lists/:id/subscribers/:subscriberId', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM marketing_schema.list_subscribers WHERE list_id=$1 AND subscriber_id=$2`, [req.params.id, req.params.subscriberId]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  EMAIL CAMPAIGNS
// ════════════════════════════════════════════════════════════
router.get('/campaigns', authenticate, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (status) { conditions.push(`status=$${idx}::campaign_status`); params.push(status); idx++; }
  if (type)   { conditions.push(`type=$${idx}`);                    params.push(type);   idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(`SELECT c.*, u.display_name AS created_by_name FROM marketing_schema.campaigns c
            LEFT JOIN auth_schema.users u ON c.created_by=u.id
            ${where} ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM marketing_schema.campaigns ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/campaigns/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM marketing_schema.campaigns WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Campaign not found', 404);
  const stats = await query(`SELECT * FROM marketing_schema.v_campaign_stats WHERE campaign_id=$1`, [req.params.id]);
  return success(res, { ...rows[0], stats: stats.rows[0] });
}));

router.post('/campaigns', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, type, subject, preview_text, from_name, from_email, reply_to,
          template_id, html_content, text_content, list_ids, scheduled_at, tags } = req.body;
  if (!name || !subject) throw new AppError('name and subject required');

  const { rows } = await query(
    `INSERT INTO marketing_schema.campaigns
       (name, type, subject, preview_text, from_name, from_email, reply_to,
        template_id, html_content, text_content, list_ids, scheduled_at, tags, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [name, type || 'regular', subject, preview_text, from_name, from_email,
     reply_to, template_id || null, html_content, text_content,
     list_ids || [], scheduled_at || null, tags || [], req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/campaigns/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, subject, html_content, text_content, status, scheduled_at } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.campaigns
        SET name         = COALESCE($2, name),
            subject      = COALESCE($3, subject),
            html_content = COALESCE($4, html_content),
            text_content = COALESCE($5, text_content),
            status       = COALESCE($6::campaign_status, status),
            scheduled_at = COALESCE($7, scheduled_at)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, subject, html_content, text_content, status, scheduled_at]
  );
  if (!rows.length) throw new AppError('Campaign not found', 404);
  return success(res, rows[0]);
}));

router.post('/campaigns/:id/send', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE marketing_schema.campaigns
        SET status='sending', sent_at=NOW()
      WHERE id=$1 AND status IN ('draft','scheduled') RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Campaign not found or not in sendable state', 400);
  // In a real system, enqueue to a job queue here
  return success(res, rows[0], 'Campaign queued for sending');
}));

router.delete('/campaigns/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM marketing_schema.campaigns WHERE id=$1 AND status='draft'`,
    [req.params.id]
  );
  if (!rowCount) throw new AppError('Campaign not found or cannot be deleted (not a draft)', 400);
  return noContent(res);
}));

// Campaign events (opens, clicks, bounces — webhook ingestion from ESP)
router.post('/campaigns/events', asyncHandler(async (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const evt of events) {
    await query(
      `INSERT INTO marketing_schema.campaign_events
         (campaign_id, subscriber_id, event_type, occurred_at, metadata)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT DO NOTHING`,
      [evt.campaign_id, evt.subscriber_id, evt.event_type,
       evt.occurred_at || new Date(), JSON.stringify(evt.metadata || {})]
    );
  }
  return res.status(204).send();
}));

// ════════════════════════════════════════════════════════════
//  COUPONS / DISCOUNT CODES
// ════════════════════════════════════════════════════════════
router.get('/coupons', authenticate, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { is_active } = req.query;
  const where = is_active !== undefined ? `WHERE is_active=$1` : '';
  const params = is_active !== undefined ? [is_active === 'true'] : [];
  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM marketing_schema.coupons ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM marketing_schema.coupons ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/coupons/validate', asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  if (!code) throw new AppError('code required');
  const { rows } = await query(
    `SELECT * FROM marketing_schema.coupons
      WHERE code=UPPER($1) AND is_active=TRUE
        AND (max_uses IS NULL OR uses_count < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())`,
    [code]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });

  const coupon = rows[0];
  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = (amount || 0) * coupon.discount_value / 100;
    if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount);
  } else {
    discount = coupon.discount_value;
  }

  return success(res, { coupon, discount_amount: discount });
}));

router.post('/coupons', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { code, description, discount_type, discount_value, max_discount_amount,
          min_order_amount, max_uses, expires_at, applicable_to } = req.body;
  if (!code || !discount_type || !discount_value) throw new AppError('code, discount_type, discount_value required');
  const { rows } = await query(
    `INSERT INTO marketing_schema.coupons
       (code, description, discount_type, discount_value, max_discount_amount,
        min_order_amount, max_uses, expires_at, applicable_to, created_by)
     VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING *`,
    [code, description, discount_type, discount_value, max_discount_amount,
     min_order_amount, max_uses || null, expires_at || null,
     JSON.stringify(applicable_to || {}), req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/coupons/:id', authenticate, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { is_active, max_uses, expires_at } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.coupons
        SET is_active = COALESCE($2, is_active),
            max_uses  = COALESCE($3, max_uses),
            expires_at= COALESCE($4, expires_at)
      WHERE id=$1 RETURNING *`,
    [req.params.id, is_active, max_uses, expires_at]
  );
  if (!rows.length) throw new AppError('Coupon not found', 404);
  return success(res, rows[0]);
}));

module.exports = router;
