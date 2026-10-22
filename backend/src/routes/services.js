// src/routes/services.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  SERVICE CATEGORIES
// ════════════════════════════════════════════════════════════
router.get('/categories', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT sc.*, COUNT(s.id) FILTER (WHERE s.is_active=TRUE AND s.deleted_at IS NULL) AS service_count
       FROM cms_schema.service_categories sc
       LEFT JOIN cms_schema.services s ON sc.id=s.category_id
      WHERE sc.is_active=TRUE
      GROUP BY sc.id ORDER BY sc.sort_order ASC`
  );
  return success(res, rows);
}));

router.post('/categories', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, icon, color, sort_order, parent_id } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO cms_schema.service_categories (name, slug, description, icon, color, sort_order, parent_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, slug, description, icon, color, sort_order || 0, parent_id || null]
  );
  return created(res, rows[0]);
}));

router.patch('/categories/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, description, icon, color, sort_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.service_categories
        SET name       = COALESCE($2, name),
            description= COALESCE($3, description),
            icon       = COALESCE($4, icon),
            color      = COALESCE($5, color),
            sort_order = COALESCE($6, sort_order),
            is_active  = COALESCE($7, is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, description, icon, color, sort_order, is_active]
  );
  if (!rows.length) throw new AppError('Category not found', 404);
  return success(res, rows[0]);
}));

router.delete('/categories/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.service_categories SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SERVICES
// ════════════════════════════════════════════════════════════
router.get('/', optionalAuth, paginate, asyncHandler(async (req, res) => {
  const { category_id, is_featured, is_active, search, pricing_type } = req.query;
  const isAdmin = req.user?.role && !['client','candidate'].includes(req.user.role);

  const conditions = ['s.deleted_at IS NULL'];
  const params     = [];
  let idx = 1;

  if (!isAdmin) {
    conditions.push('s.is_active=TRUE');
  } else if (is_active !== undefined) {
    conditions.push(`s.is_active=$${idx}`);
    params.push(is_active === 'true');
    idx++;
  }

  if (category_id) { conditions.push(`s.category_id=$${idx}`); params.push(category_id); idx++; }
  if (is_featured !== undefined) { conditions.push(`s.is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  if (pricing_type) { conditions.push(`s.pricing_type=$${idx}::pricing_type`); params.push(pricing_type); idx++; }
  if (search) {
    conditions.push(`to_tsvector('english', s.title || ' ' || COALESCE(s.summary,'')) @@ plainto_tsquery('english',$${idx})`);
    params.push(search); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT s.id, s.title, s.slug, s.tagline, s.summary, s.icon, s.pricing_type,
              s.starting_price, s.currency, s.duration_min, s.duration_max,
              s.is_featured, s.sort_order, s.tech_stack,
              sc.name AS category_name, sc.slug AS category_slug, sc.icon AS category_icon,
              COUNT(sp.id) FILTER (WHERE sp.is_active=TRUE) AS package_count
         FROM cms_schema.services s
         LEFT JOIN cms_schema.service_categories sc ON s.category_id=sc.id
         LEFT JOIN cms_schema.service_packages   sp ON s.id=sp.service_id
        WHERE ${where}
        GROUP BY s.id, sc.name, sc.slug, sc.icon
        ORDER BY s.sort_order ASC, s.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM cms_schema.services s WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/catalog', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.v_services_catalog`);
  return success(res, rows);
}));

router.get('/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT s.*,
            sc.name AS category_name, sc.slug AS category_slug,
            sm.meta_title, sm.meta_description, sm.og_image_url
       FROM cms_schema.services s
       LEFT JOIN cms_schema.service_categories sc ON s.category_id=sc.id
       LEFT JOIN cms_schema.seo_meta           sm ON s.seo_id=sm.id
      WHERE s.${byId ? 'id' : 'slug'}=$1 AND s.is_active=TRUE AND s.deleted_at IS NULL`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Service not found', 404);

  // Load features and packages
  const [features, packages, stats] = await Promise.all([
    query(`SELECT * FROM cms_schema.service_features WHERE service_id=$1 ORDER BY sort_order`, [rows[0].id]),
    query(`SELECT * FROM cms_schema.service_packages WHERE service_id=$1 AND is_active=TRUE ORDER BY sort_order`, [rows[0].id]),
    query(`SELECT * FROM cms_schema.mv_service_stats WHERE service_id=$1`, [rows[0].id]),
  ]);

  return success(res, { ...rows[0], features: features.rows, packages: packages.rows, stats: stats.rows[0] });
}));

router.post('/', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { category_id, title, slug, tagline, summary, description, icon, pricing_type, starting_price,
          currency, duration_min, duration_max, is_featured, sort_order, faq_items, process_steps,
          tech_stack, delivery_items, locale, translations } = req.body;
  if (!title) throw new AppError('title required');

  const finalSlug = slug || generateSlug(title);
  const { rows } = await query(
    `INSERT INTO cms_schema.services
       (category_id, title, slug, tagline, summary, description, icon, pricing_type, starting_price,
        currency, duration_min, duration_max, is_featured, sort_order, faq_items, process_steps,
        tech_stack, delivery_items, locale, translations, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::pricing_type,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,
             $17,$18,$19,$20::jsonb,$21)
     RETURNING *`,
    [category_id || null, title, finalSlug, tagline, summary, description, icon,
     pricing_type || 'custom', starting_price || null, currency || 'USD', duration_min, duration_max,
     is_featured || false, sort_order || 0, JSON.stringify(faq_items || []),
     JSON.stringify(process_steps || []), tech_stack || [], JSON.stringify(delivery_items || []),
     locale || 'en', JSON.stringify(translations || {}), req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { title, tagline, summary, description, is_active, is_featured, sort_order,
          starting_price, faq_items, process_steps, tech_stack } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.services
        SET title          = COALESCE($2, title),
            tagline        = COALESCE($3, tagline),
            summary        = COALESCE($4, summary),
            description    = COALESCE($5, description),
            is_active      = COALESCE($6, is_active),
            is_featured    = COALESCE($7, is_featured),
            sort_order     = COALESCE($8, sort_order),
            starting_price = COALESCE($9, starting_price),
            faq_items      = CASE WHEN $10::jsonb IS NOT NULL THEN $10::jsonb ELSE faq_items END,
            process_steps  = CASE WHEN $11::jsonb IS NOT NULL THEN $11::jsonb ELSE process_steps END,
            tech_stack     = COALESCE($12, tech_stack)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, title, tagline, summary, description, is_active, is_featured, sort_order,
     starting_price, faq_items ? JSON.stringify(faq_items) : null,
     process_steps ? JSON.stringify(process_steps) : null, tech_stack || null]
  );
  if (!rows.length) throw new AppError('Service not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.services SET deleted_at=NOW(), is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Service Features
router.post('/:id/features', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { title, description, icon, sort_order } = req.body;
  if (!title) throw new AppError('title required');
  const { rows } = await query(
    `INSERT INTO cms_schema.service_features (service_id, title, description, icon, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, title, description, icon, sort_order || 0]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/features/:featureId', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.service_features WHERE id=$1 AND service_id=$2`, [req.params.featureId, req.params.id]);
  return noContent(res);
}));

// Service Packages
router.get('/:id/packages', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.service_packages WHERE service_id=$1 AND is_active=TRUE ORDER BY sort_order`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/packages', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, price, currency, billing_period, features, is_popular, sort_order } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO cms_schema.service_packages
       (service_id, name, slug, description, price, currency, billing_period, features, is_popular, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) RETURNING *`,
    [req.params.id, name, slug || generateSlug(name), description, price, currency || 'USD',
     billing_period, JSON.stringify(features || []), is_popular || false, sort_order || 0]
  );
  return created(res, rows[0]);
}));

router.patch('/:id/packages/:pkgId', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { price, is_active, is_popular, features } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.service_packages
        SET price      = COALESCE($3, price),
            is_active  = COALESCE($4, is_active),
            is_popular = COALESCE($5, is_popular),
            features   = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE features END
      WHERE id=$1 AND service_id=$2 RETURNING *`,
    [req.params.pkgId, req.params.id, price, is_active, is_popular,
     req.body.features ? JSON.stringify(req.body.features) : null]
  );
  if (!rows.length) throw new AppError('Package not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id/packages/:pkgId', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.service_packages WHERE id=$1 AND service_id=$2`, [req.params.pkgId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  INDUSTRIES
// ════════════════════════════════════════════════════════════
const industriesRouter = require('express').Router();

industriesRouter.get('/', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.industries WHERE is_active=TRUE ORDER BY sort_order`);
  return success(res, rows);
}));

industriesRouter.get('/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT i.*, sm.meta_title, sm.meta_description FROM cms_schema.industries i
      LEFT JOIN cms_schema.seo_meta sm ON i.seo_id=sm.id
     WHERE i.${byId ? 'id' : 'slug'}=$1 AND i.is_active=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Industry not found', 404);
  return success(res, rows[0]);
}));

industriesRouter.post('/', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, icon, sort_order } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO cms_schema.industries (name, slug, description, icon, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, slug, description, icon, sort_order || 0]
  );
  return created(res, rows[0]);
}));

industriesRouter.patch('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, description, is_active, sort_order } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.industries SET name=COALESCE($2,name), description=COALESCE($3,description),
      is_active=COALESCE($4,is_active), sort_order=COALESCE($5,sort_order)
     WHERE id=$1 RETURNING *`,
    [req.params.id, name, description, is_active, sort_order]
  );
  if (!rows.length) throw new AppError('Industry not found', 404);
  return success(res, rows[0]);
}));

industriesRouter.delete('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.industries SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SOLUTIONS
// ════════════════════════════════════════════════════════════
const solutionsRouter = require('express').Router();

solutionsRouter.get('/', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.solutions WHERE is_active=TRUE ORDER BY sort_order`);
  return success(res, rows);
}));

solutionsRouter.get('/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT s.*, sm.meta_title, sm.meta_description FROM cms_schema.solutions s
      LEFT JOIN cms_schema.seo_meta sm ON s.seo_id=sm.id
     WHERE s.${byId ? 'id' : 'slug'}=$1 AND s.is_active=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Solution not found', 404);
  return success(res, rows[0]);
}));

solutionsRouter.post('/', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, use_cases, features, sort_order } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO cms_schema.solutions (name, slug, description, use_cases, features, sort_order)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6) RETURNING *`,
    [name, slug, description, JSON.stringify(use_cases || []), JSON.stringify(features || []), sort_order || 0]
  );
  return created(res, rows[0]);
}));

solutionsRouter.patch('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  const { name, description, use_cases, features, is_active } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.solutions
        SET name       = COALESCE($2, name),
            description= COALESCE($3, description),
            use_cases  = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE use_cases END,
            features   = CASE WHEN $5::jsonb IS NOT NULL THEN $5::jsonb ELSE features END,
            is_active  = COALESCE($6, is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, description,
     use_cases ? JSON.stringify(use_cases) : null, features ? JSON.stringify(features) : null, is_active]
  );
  if (!rows.length) throw new AppError('Solution not found', 404);
  return success(res, rows[0]);
}));

solutionsRouter.delete('/:id', authenticate, requirePermission('service.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.solutions SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

module.exports = { router, industriesRouter, solutionsRouter };
