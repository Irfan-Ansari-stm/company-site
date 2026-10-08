// src/routes/system.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission, requireRole } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSecureToken, hashToken, success, created, noContent } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  SYSTEM SETTINGS
// ════════════════════════════════════════════════════════════
router.get('/settings', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { group } = req.query;
  const { rows } = await query(
    `SELECT key, value, group_name, description, is_public
       FROM system_schema.settings
      WHERE ($1::text IS NULL OR group_name=$1)
      ORDER BY group_name, key`,
    [group || null]
  );
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = {
      value: row.value,
      description: row.description,
      group: row.group_name,
      is_public: row.is_public,
    };
    return acc;
  }, {});
  return success(res, settings);
}));

router.get('/settings/public', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT key, value FROM system_schema.settings WHERE is_public=TRUE ORDER BY group_name, key`
  );
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  return success(res, settings);
}));

router.put('/settings', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') throw new AppError('settings object required');

  await withTransaction(async (client) => {
    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `UPDATE system_schema.settings SET value=$2::jsonb, updated_by=$3 WHERE key=$1`,
        [key, JSON.stringify(value), req.userId]
      );
    }
  });
  return success(res, {}, 'Settings updated');
}));

router.put('/settings/:key', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { value } = req.body;
  if (value === undefined) throw new AppError('value required');
  const { rowCount } = await query(
    `UPDATE system_schema.settings SET value=$2::jsonb, updated_by=$3 WHERE key=$1`,
    [req.params.key, JSON.stringify(value), req.userId]
  );
  if (!rowCount) throw new AppError('Setting not found', 404);
  return success(res, {}, 'Setting updated');
}));

// ════════════════════════════════════════════════════════════
//  AUDIT LOGS
// ════════════════════════════════════════════════════════════
router.get('/audit-logs', authenticate, requirePermission('audit.read'), paginate, asyncHandler(async (req, res) => {
  const { actor_id, action, resource_type, from_date, to_date } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (actor_id)     { conditions.push(`al.actor_id=$${idx}`);       params.push(actor_id); idx++; }
  if (action)       { conditions.push(`al.action=$${idx}`);          params.push(action); idx++; }
  if (resource_type){ conditions.push(`al.resource_type=$${idx}`);   params.push(resource_type); idx++; }
  if (from_date)    { conditions.push(`al.created_at >= $${idx}`);  params.push(from_date); idx++; }
  if (to_date)      { conditions.push(`al.created_at <= $${idx}`);  params.push(to_date); idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT al.*, u.display_name AS actor_name, u.email AS actor_email
         FROM system_schema.audit_logs al
         LEFT JOIN auth_schema.users u ON al.actor_id=u.id
         ${where}
        ORDER BY al.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM system_schema.audit_logs al ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// ════════════════════════════════════════════════════════════
//  API KEYS
// ════════════════════════════════════════════════════════════
router.get('/api-keys', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, key_prefix, scopes, expires_at, last_used_at, is_active, created_at
       FROM system_schema.api_keys
      WHERE user_id=$1
      ORDER BY created_at DESC`,
    [req.userId]
  );
  return success(res, rows);
}));

router.post('/api-keys', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { name, scopes, expires_at } = req.body;
  if (!name) throw new AppError('name required');

  const rawKey   = `sk_${generateSecureToken()}`;
  const keyHash  = hashToken(rawKey);
  const keyPrefix = rawKey.substring(0, 10);

  const { rows } = await query(
    `INSERT INTO system_schema.api_keys (name, key_hash, key_prefix, scopes, expires_at, user_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, key_prefix, scopes, expires_at, created_at`,
    [name, keyHash, keyPrefix, scopes || [], expires_at || null, req.userId]
  );
  // Return the raw key ONCE — never stored in plain text
  return created(res, { ...rows[0], key: rawKey }, 'API key created. Save it now — it will not be shown again.');
}));

router.delete('/api-keys/:id', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  await query(
    `UPDATE system_schema.api_keys SET is_active=FALSE WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  WEBHOOKS
// ════════════════════════════════════════════════════════════
router.get('/webhooks', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, url, events, is_active, 0 AS failure_count, NULL::timestamptz AS last_triggered_at, created_at
       FROM system_schema.webhooks WHERE created_by=$1 ORDER BY created_at DESC`,
    [req.userId]
  );
  return success(res, rows);
}));

router.post('/webhooks', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { name, url, events, secret } = req.body;
  if (!name || !url || !events?.length) throw new AppError('name, url, events required');

  const sigSecret = secret || generateSecureToken();
  const { rows } = await query(
    `INSERT INTO system_schema.webhooks (name, url, events, secret, created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, url, events, is_active, created_at`,
    [name, url, events, sigSecret, req.userId]
  );
  return created(res, { ...rows[0], secret: sigSecret });
}));

router.patch('/webhooks/:id', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { name, url, events, is_active } = req.body;
  const { rows } = await query(
    `UPDATE system_schema.webhooks
        SET name      = COALESCE($2, name),
            url       = COALESCE($3, url),
            events    = COALESCE($4, events),
            is_active = COALESCE($5, is_active)
      WHERE id=$1 AND created_by=$6 RETURNING id, name, url, events, is_active`,
    [req.params.id, name, url, events, is_active, req.userId]
  );
  if (!rows.length) throw new AppError('Webhook not found', 404);
  return success(res, rows[0]);
}));

router.delete('/webhooks/:id', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM system_schema.webhooks WHERE id=$1 AND created_by=$2`, [req.params.id, req.userId]);
  return noContent(res);
}));

// Webhook delivery logs
router.get('/webhooks/:id/deliveries', authenticate, requirePermission('settings.manage'), paginate, asyncHandler(async (req, res) => {
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT * FROM system_schema.webhook_deliveries WHERE webhook_id=$1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.id, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM system_schema.webhook_deliveries WHERE webhook_id=$1`, [req.params.id]),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// ════════════════════════════════════════════════════════════
//  EMAIL TEMPLATES
// ════════════════════════════════════════════════════════════
router.get('/email-templates', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  return success(res, []);
}));

router.get('/email-templates/:slugOrId', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const bySlug = !require('../utils/helpers').isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT * FROM system_schema.email_templates WHERE ${bySlug ? 'slug' : 'id'}=$1`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Template not found', 404);
  return success(res, rows[0]);
}));

router.post('/email-templates', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { name, slug, subject, html_body, text_body, category, variables } = req.body;
  if (!name || !slug || !subject || !html_body) throw new AppError('name, slug, subject, html_body required');
  const { rows } = await query(
    `INSERT INTO system_schema.email_templates (name, slug, subject, html_body, text_body, category, variables, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) RETURNING *`,
    [name, slug, subject, html_body, text_body, category || 'general',
     JSON.stringify(variables || []), req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/email-templates/:id', authenticate, requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { subject, html_body, text_body, is_active } = req.body;
  const { rows } = await query(
    `UPDATE system_schema.email_templates
        SET subject   = COALESCE($2, subject),
            html_body = COALESCE($3, html_body),
            text_body = COALESCE($4, text_body),
            is_active = COALESCE($5, is_active),
            updated_by= $6
      WHERE id=$1 RETURNING *`,
    [req.params.id, subject, html_body, text_body, is_active, req.userId]
  );
  if (!rows.length) throw new AppError('Template not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  FEATURE FLAGS
// ════════════════════════════════════════════════════════════
router.get('/feature-flags', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT slug AS key, is_enabled AS enabled_for_user
       FROM system_schema.feature_flags
      ORDER BY name`
  );
  const flags = rows.reduce((acc, r) => { acc[r.key] = r.enabled_for_user; return acc; }, {});
  return success(res, flags);
}));

router.get('/feature-flags/all', authenticate, requireRole('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM system_schema.feature_flags ORDER BY name`);
  return success(res, rows);
}));

router.post('/feature-flags', authenticate, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { name, key, description, is_enabled, rollout_percent } = req.body;
  if (!name || !key) throw new AppError('name and key required');
  const { rows } = await query(
    `INSERT INTO system_schema.feature_flags (name, slug, description, is_enabled)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, key, description, is_enabled || false]
  );
  return created(res, rows[0]);
}));

router.patch('/feature-flags/:id', authenticate, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { is_enabled, rollout_percent } = req.body;
  const { rows } = await query(
    `UPDATE system_schema.feature_flags
        SET is_enabled = COALESCE($2, is_enabled)
      WHERE id=$1 RETURNING *`,
    [req.params.id, is_enabled]
  );
  if (!rows.length) throw new AppError('Flag not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  HEALTH & STATUS
// ════════════════════════════════════════════════════════════
router.get('/health', asyncHandler(async (req, res) => {
  const start = Date.now();
  await query('SELECT 1');
  const dbLatency = Date.now() - start;

  return res.json({
    status:  'ok',
    version: process.env.npm_package_version || '1.0.0',
    env:     process.env.NODE_ENV,
    uptime:  Math.floor(process.uptime()),
    db:      { status: 'ok', latency_ms: dbLatency },
    memory:  process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
}));

module.exports = router;
