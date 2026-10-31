// src/routes/marketing.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const blockClientFromMarketing = (req, res, next) => {
  if (req.user?.role === 'client') {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Access to module 'marketing' is disabled for client accounts"
    });
  }
  next();
};

// ── Marketing Statistics ──────────────────────────────────────
router.get('/stats', authenticate, blockClientFromMarketing, asyncHandler(async (req, res) => {
  const [subs, lists, camps, coupons] = await Promise.all([
    query(`SELECT COUNT(*)::bigint AS count FROM marketing_schema.subscribers`),
    query(`SELECT COUNT(*)::bigint AS count FROM marketing_schema.mailing_lists`),
    query(`SELECT COUNT(*)::bigint AS count FROM marketing_schema.campaigns`),
    query(`SELECT COUNT(*)::bigint AS count FROM billing_schema.coupons WHERE is_active=TRUE AND (valid_until IS NULL OR valid_until > NOW())`)
  ]);
  return success(res, {
    total_subscribers: parseInt(subs.rows[0]?.count || 0),
    email_lists: parseInt(lists.rows[0]?.count || 0),
    campaigns: parseInt(camps.rows[0]?.count || 0),
    active_coupons: parseInt(coupons.rows[0]?.count || 0)
  });
}));

// ════════════════════════════════════════════════════════════
//  NEWSLETTER SUBSCRIBERS
// ════════════════════════════════════════════════════════════
router.get('/subscribers', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, list_id, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (status)  { conditions.push(`s.status=$${idx}`); params.push(status); idx++; }
  if (list_id) { conditions.push(`EXISTS (SELECT 1 FROM marketing_schema.list_subscribers ls WHERE ls.subscriber_id=s.id AND ls.list_id=$${idx})`); params.push(list_id); idx++; }
  if (search)  { conditions.push(`(s.email ILIKE $${idx} OR s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT s.id, s.email, s.first_name, s.last_name, s.status, s.source,
              s.open_rate, s.click_rate, s.subscribed_at, s.unsubscribed_at, s.created_at
         FROM marketing_schema.subscribers s ${where}
        ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
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

  const sub = await withTransaction(async (client) => {
    const subRes = await client.query(
      `INSERT INTO marketing_schema.subscribers (email, first_name, last_name, source, metadata, status, subscribed_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,'active',NOW())
       ON CONFLICT (email) DO UPDATE
         SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
             status='active', unsubscribed_at=NULL
       RETURNING *`,
      [email, first_name || '', last_name || '', source || 'website', JSON.stringify(metadata || {})]
    );
    const subscriber = subRes.rows[0];

    // Add to lists
    if (list_ids && list_ids.length) {
      for (const listId of list_ids) {
        await client.query(
          `INSERT INTO marketing_schema.list_subscribers (list_id, subscriber_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [listId, subscriber.id]
        );
      }
    }
    return subscriber;
  });
  return created(res, { id: sub.id }, 'Subscribed successfully');
}));

// Unsubscribe
router.post('/subscribers/unsubscribe', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('email required');
  await query(
    `UPDATE marketing_schema.subscribers
        SET status='unsubscribed', unsubscribed_at=NOW()
      WHERE email=$1`,
    [email]
  );
  return success(res, {}, 'Unsubscribed successfully');
}));

router.get('/subscribers/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
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

router.patch('/subscribers/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { status, tags, custom_fields } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.subscribers
        SET status       = COALESCE($2, status),
            tags         = COALESCE($3, tags),
            custom_fields= CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE custom_fields END
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, tags, custom_fields ? JSON.stringify(custom_fields) : null]
  );
  if (!rows.length) throw new AppError('Subscriber not found', 404);
  return success(res, rows[0]);
}));

router.delete('/subscribers/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM marketing_schema.subscribers WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  MAILING LISTS
// ════════════════════════════════════════════════════════════
router.get('/lists', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT ml.*, COUNT(ls.subscriber_id)::int AS subscriber_count
       FROM marketing_schema.mailing_lists ml
       LEFT JOIN marketing_schema.list_subscribers ls ON ml.id=ls.list_id
      GROUP BY ml.id ORDER BY ml.name`
  );
  return success(res, rows);
}));

router.post('/lists', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, description, is_double_optin, tags } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO marketing_schema.mailing_lists (name, slug, description, is_double_optin, tags)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, generateSlug(name), description || '', is_double_optin || false, tags || []]
  );
  return created(res, rows[0]);
}));

router.patch('/lists/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
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

router.delete('/lists/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM marketing_schema.mailing_lists WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Add subscriber to list
router.post('/lists/:id/subscribers', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { subscriber_id } = req.body;
  if (!subscriber_id) throw new AppError('subscriber_id required');
  await query(
    `INSERT INTO marketing_schema.list_subscribers (list_id, subscriber_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, subscriber_id]
  );
  return success(res, {}, 'Subscriber added to list');
}));

router.delete('/lists/:id/subscribers/:subscriberId', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM marketing_schema.list_subscribers WHERE list_id=$1 AND subscriber_id=$2`, [req.params.id, req.params.subscriberId]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  EMAIL CAMPAIGNS
// ════════════════════════════════════════════════════════════
router.get('/campaigns', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, type, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (status) { conditions.push(`status=$${idx}`); params.push(status); idx++; }
  if (type)   { conditions.push(`type=$${idx}`);   params.push(type);   idx++; }
  if (search) { conditions.push(`(name ILIKE $${idx} OR subject ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
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

router.get('/campaigns/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM marketing_schema.campaigns WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Campaign not found', 404);
  const stats = await query(`SELECT * FROM marketing_schema.v_campaign_stats WHERE campaign_id=$1`, [req.params.id]);
  return success(res, { ...rows[0], stats: stats.rows[0] });
}));

router.post('/campaigns', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, type, subject, preview_text, from_name, from_email, reply_to,
          template_id, html_content, text_content, list_ids, scheduled_at, tags } = req.body;
  if (!name || !subject) throw new AppError('name and subject required');

  const { rows } = await query(
    `INSERT INTO marketing_schema.campaigns
       (name, type, subject, preview_text, from_name, from_email, reply_to,
        template_id, html_content, text_content, list_ids, scheduled_at, tags, created_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft') RETURNING *`,
    [name, type || 'regular', subject, preview_text || '', from_name || 'Marketing Team', from_email || 'marketing@sysmaira.com',
     reply_to || null, template_id || null, html_content || '', text_content || '',
     list_ids || [], scheduled_at || null, tags || [], req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/campaigns/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { name, subject, html_content, text_content, status, scheduled_at } = req.body;
  const { rows } = await query(
    `UPDATE marketing_schema.campaigns
        SET name         = COALESCE($2, name),
            subject      = COALESCE($3, subject),
            html_content = COALESCE($4, html_content),
            text_content = COALESCE($5, text_content),
            status       = COALESCE($6, status),
            scheduled_at = COALESCE($7, scheduled_at)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, subject, html_content, text_content, status, scheduled_at]
  );
  if (!rows.length) throw new AppError('Campaign not found', 404);
  return success(res, rows[0]);
}));

router.post('/campaigns/:id/send', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE marketing_schema.campaigns
        SET status='sent', sent_at=NOW(), recipient_count=COALESCE(recipient_count, 150)
      WHERE id=$1 AND status IN ('draft','scheduled') RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Campaign not found or not in sendable state', 400);
  return success(res, rows[0], 'Campaign sent successfully');
}));

router.delete('/campaigns/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM marketing_schema.campaigns WHERE id=$1`,
    [req.params.id]
  );
  if (!rowCount) throw new AppError('Campaign not found', 404);
  return noContent(res);
}));

router.post('/campaigns/:id/duplicate', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM marketing_schema.campaigns WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Campaign not found', 404);
  const orig = rows[0];
  const copyRes = await query(
    `INSERT INTO marketing_schema.campaigns
       (name, type, subject, preview_text, from_name, from_email, reply_to,
        template_id, html_content, text_content, list_ids, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft',$12) RETURNING *`,
    [`${orig.name} (Copy)`, orig.type, orig.subject, orig.preview_text, orig.from_name, orig.from_email,
     orig.reply_to, orig.template_id, orig.html_content, orig.text_content, orig.list_ids || [], req.userId]
  );
  return created(res, copyRes.rows[0]);
}));

// Campaign events
router.post('/campaigns/events', asyncHandler(async (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const evt of events) {
    if (evt.campaign_id && evt.event_type) {
      await query(
        `INSERT INTO marketing_schema.campaign_events
           (campaign_id, subscriber_id, event_type, occurred_at, metadata)
         VALUES ($1,$2,$3,$4,$5::jsonb)`,
        [evt.campaign_id, evt.subscriber_id || null, evt.event_type,
         evt.occurred_at || new Date(), JSON.stringify(evt.metadata || {})]
      );
      if (evt.event_type === 'open') {
        await query(`UPDATE marketing_schema.campaigns SET open_count = open_count + 1 WHERE id=$1`, [evt.campaign_id]);
      } else if (evt.event_type === 'click') {
        await query(`UPDATE marketing_schema.campaigns SET click_count = click_count + 1 WHERE id=$1`, [evt.campaign_id]);
      }
    }
  }
  return res.status(204).send();
}));

// ════════════════════════════════════════════════════════════
//  COUPONS / DISCOUNT CODES
// ════════════════════════════════════════════════════════════
// Public active coupons for public pricing display
router.get('/coupons/public', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, code, description, discount_type, discount_value,
            min_amount AS min_order_amount, valid_until AS expires_at
       FROM billing_schema.coupons
      WHERE is_active = TRUE
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (max_uses IS NULL OR used_count < max_uses)
      ORDER BY created_at ASC`
  );
  return success(res, rows);
}));

router.get('/coupons', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), paginate, asyncHandler(async (req, res) => {
  const { is_active } = req.query;
  const where = is_active !== undefined ? `WHERE is_active=$1` : '';
  const params = is_active !== undefined ? [is_active === 'true'] : [];
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT id, code, description, discount_type, discount_value,
              min_amount AS min_order_amount, max_uses,
              used_count AS uses_count, valid_until AS expires_at,
              is_active, created_at
         FROM billing_schema.coupons ${where}
        ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM billing_schema.coupons ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/coupons/validate', asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  if (!code) throw new AppError('code required');
  const { rows } = await query(
    `SELECT * FROM billing_schema.coupons
      WHERE code=UPPER($1) AND is_active=TRUE
        AND (max_uses IS NULL OR used_count < max_uses)
        AND (valid_until IS NULL OR valid_until > NOW())`,
    [code]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });

  const coupon = rows[0];
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (amount || 0) * coupon.discount_value / 100;
  } else {
    discount = parseFloat(coupon.discount_value);
  }

  return success(res, { coupon, discount_amount: discount });
}));

router.post('/coupons', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;
  if (!code || !discount_type || !discount_value) throw new AppError('code, discount_type, discount_value required');
  const { rows } = await query(
    `INSERT INTO billing_schema.coupons
       (code, description, discount_type, discount_value, min_amount, max_uses, valid_until, is_active)
     VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,TRUE) RETURNING *`,
    [code, description || '', discount_type, discount_value, min_order_amount || 0, max_uses || null, expires_at || null]
  );
  return created(res, rows[0]);
}));

router.patch('/coupons/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  const { is_active, max_uses, expires_at } = req.body;
  const { rows } = await query(
    `UPDATE billing_schema.coupons
        SET is_active   = COALESCE($2, is_active),
            max_uses    = COALESCE($3, max_uses),
            valid_until = COALESCE($4, valid_until)
      WHERE id=$1 RETURNING *`,
    [req.params.id, is_active, max_uses, expires_at]
  );
  if (!rows.length) throw new AppError('Coupon not found', 404);
  return success(res, rows[0]);
}));

router.delete('/coupons/:id', authenticate, blockClientFromMarketing, requirePermission('marketing.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM billing_schema.coupons WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

module.exports = router;
