// src/routes/portfolio.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// GET /portfolio
router.get('/', optionalAuth, paginate, asyncHandler(async (req, res) => {
  const { category_id, industry_id, is_featured, is_published, search, tech } = req.query;
  const isAdmin = req.user?.role && !['client','candidate'].includes(req.user.role);

  const conditions = ['p.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (!isAdmin) {
    conditions.push('p.is_published=TRUE');
  } else if (is_published !== undefined) {
    conditions.push(`p.is_published=$${idx}`);
    params.push(is_published === 'true');
    idx++;
  }

  if (category_id) { conditions.push(`p.category_id=$${idx}`); params.push(category_id); idx++; }
  if (industry_id) { conditions.push(`p.industry_id=$${idx}`); params.push(industry_id); idx++; }
  if (is_featured !== undefined) { conditions.push(`p.is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  if (tech) { conditions.push(`$${idx}=ANY(p.tech_stack)`); params.push(tech); idx++; }
  if (search) {
    conditions.push(`to_tsvector('english', p.title || ' ' || COALESCE(p.summary,'')) @@ plainto_tsquery('english',$${idx})`);
    params.push(search); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.id, p.title, p.slug, p.client_name, p.summary, p.budget_range,
              p.duration_weeks, p.tech_stack, p.tags, p.display_order,
              p.cover_image, p.is_featured, p.is_published, p.end_date, p.region,
              p.project_url, p.github_url, p.category_id,
              sc.name AS category_name, sc.slug AS category_slug,
              i.name AS industry_name
         FROM portfolio_schema.projects p
         LEFT JOIN cms_schema.service_categories sc ON p.category_id=sc.id
         LEFT JOIN cms_schema.industries          i  ON p.industry_id=i.id
        WHERE ${where}
        ORDER BY p.display_order ASC, p.end_date DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM portfolio_schema.projects p WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// GET /portfolio/:slugOrId
router.get('/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT p.*,
            sc.name AS category_name, i.name AS industry_name,
            sm.meta_title, sm.meta_description, sm.og_image_url
       FROM portfolio_schema.projects p
       LEFT JOIN cms_schema.service_categories sc ON p.category_id=sc.id
       LEFT JOIN cms_schema.industries          i  ON p.industry_id=i.id
       LEFT JOIN cms_schema.seo_meta           sm ON p.seo_id=sm.id
      WHERE p.${byId ? 'id' : 'slug'}=$1 AND p.deleted_at IS NULL`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Project not found', 404);

  const [gallery, metrics, testimonial] = await Promise.all([
    query(`SELECT pg.*, m.cdn_url, m.alt_text FROM portfolio_schema.project_gallery pg
            JOIN cms_schema.media m ON pg.media_id=m.id
           WHERE pg.project_id=$1 ORDER BY pg.sort_order`, [rows[0].id]),
    query(`SELECT * FROM portfolio_schema.project_metrics WHERE project_id=$1 ORDER BY sort_order`, [rows[0].id]),
    rows[0].testimonial_id
      ? query(`SELECT * FROM cms_schema.testimonials WHERE id=$1`, [rows[0].testimonial_id])
      : { rows: [] },
  ]);

  return success(res, {
    ...rows[0],
    gallery: gallery.rows,
    metrics: metrics.rows,
    testimonial: testimonial.rows[0] || null,
  });
}));

// POST /portfolio
router.post('/', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  const { title, slug, client_name, client_url, category_id, industry_id, solution_id,
          summary, challenge, solution, result, budget_range, duration_weeks, start_date, end_date,
          tech_stack, tags, is_featured, is_published, display_order, region, project_url, github_url,
          locale, translations, metadata } = req.body;
  if (!title) throw new AppError('title required');

  const finalSlug = slug || generateSlug(title);
  const { rows } = await query(
    `INSERT INTO portfolio_schema.projects
       (title, slug, client_name, client_url, category_id, industry_id, solution_id,
        summary, challenge, solution, result, budget_range, duration_weeks, start_date, end_date,
        tech_stack, tags, is_featured, is_published, display_order, region, project_url, github_url,
        locale, translations, metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26::jsonb,$27)
     RETURNING *`,
    [title, finalSlug, client_name, client_url, category_id || null, industry_id || null, solution_id || null,
     summary, challenge, solution, result, budget_range, duration_weeks, start_date, end_date,
     tech_stack || [], tags || [], is_featured || false, is_published || false, display_order || 0,
     region, project_url, github_url, locale || 'en',
     JSON.stringify(translations || {}), JSON.stringify(metadata || {}), req.userId]
  );
  return created(res, rows[0]);
}));

// PATCH /portfolio/:id
router.patch('/:id', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  const { title, summary, challenge, solution, result, is_published, is_featured,
          display_order, tech_stack, tags, client_name, client_url, category_id,
          industry_id, budget_range, duration_weeks, end_date, project_url, github_url, cover_image } = req.body;
  const { rows } = await query(
    `UPDATE portfolio_schema.projects
        SET title         = COALESCE($2, title),
            summary       = COALESCE($3, summary),
            challenge     = COALESCE($4, challenge),
            solution      = COALESCE($5, solution),
            result        = COALESCE($6, result),
            is_published  = COALESCE($7, is_published),
            is_featured   = COALESCE($8, is_featured),
            display_order = COALESCE($9, display_order),
            tech_stack    = COALESCE($10, tech_stack),
            tags          = COALESCE($11, tags),
            client_name   = COALESCE($12, client_name),
            client_url    = COALESCE($13, client_url),
            category_id   = COALESCE($14, category_id),
            industry_id   = COALESCE($15, industry_id),
            budget_range  = COALESCE($16, budget_range),
            duration_weeks= COALESCE($17, duration_weeks),
            end_date      = COALESCE($18, end_date),
            project_url   = COALESCE($19, project_url),
            github_url    = COALESCE($20, github_url),
            cover_image   = COALESCE($21, cover_image),
            updated_at    = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING id, title, slug, is_published, is_featured, updated_at`,
    [req.params.id, title, summary, challenge, solution, result, is_published, is_featured,
     display_order, tech_stack, tags, client_name, client_url, category_id,
     industry_id, budget_range, duration_weeks, end_date, project_url, github_url, cover_image]
  );
  if (!rows.length) throw new AppError('Project not found', 404);
  return success(res, rows[0]);
}));

// DELETE /portfolio/:id
router.delete('/:id', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE portfolio_schema.projects SET deleted_at=NOW(), is_published=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Gallery
router.post('/:id/gallery', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  const { media_id, caption, alt_text, sort_order, is_cover } = req.body;
  if (!media_id) throw new AppError('media_id required');
  const { rows } = await query(
    `INSERT INTO portfolio_schema.project_gallery (project_id, media_id, caption, alt_text, sort_order, is_cover)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, media_id, caption, alt_text, sort_order || 0, is_cover || false]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/gallery/:galleryId', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM portfolio_schema.project_gallery WHERE id=$1 AND project_id=$2`, [req.params.galleryId, req.params.id]);
  return noContent(res);
}));

// Metrics
router.post('/:id/metrics', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  const { metric_name, value, prefix, suffix, description, icon, sort_order } = req.body;
  if (!metric_name || !value) throw new AppError('metric_name and value required');
  const { rows } = await query(
    `INSERT INTO portfolio_schema.project_metrics (project_id, metric_name, value, prefix, suffix, description, icon, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.id, metric_name, value, prefix, suffix, description, icon, sort_order || 0]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/metrics/:metricId', authenticate, requirePermission('portfolio.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM portfolio_schema.project_metrics WHERE id=$1 AND project_id=$2`, [req.params.metricId, req.params.id]);
  return noContent(res);
}));

module.exports = router;
