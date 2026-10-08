// src/routes/cms.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  PAGES
// ════════════════════════════════════════════════════════════

// GET /cms/pages
router.get('/pages', optionalAuth, paginate, asyncHandler(async (req, res) => {
  const { search, visibility, template, parent_id } = req.query;
  const isAdmin = req.user?.role && !['client','candidate'].includes(req.user.role);

  const conditions = ['p.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (!isAdmin) { conditions.push(`p.visibility = 'public'`); }
  else if (visibility) { conditions.push(`p.visibility = $${idx}`); params.push(visibility); idx++; }

  if (search) { conditions.push(`p.title ILIKE $${idx}`); params.push(`%${search}%`); idx++; }
  if (template) { conditions.push(`p.template = $${idx}`); params.push(template); idx++; }
  if (parent_id) { conditions.push(`p.parent_id = $${idx}`); params.push(parent_id); idx++; }
  if (parent_id === 'null') { conditions.push(`p.parent_id IS NULL`); }

  const where = conditions.join(' AND ');
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'sort_order');

  const [dataRes, countRes] = await Promise.all([
    query(`SELECT p.id, p.title, p.slug, p.template, p.visibility, p.sort_order,
                  p.is_homepage, p.published_at, p.parent_id, p.locale, p.created_at
             FROM cms_schema.pages p WHERE ${where}
            ORDER BY p.${col === 'sort_order' ? 'sort_order' : col} ${dir}
            LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM cms_schema.pages p WHERE ${where}`, params),
  ]);

  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// GET /cms/pages/:slug - public (by slug) or admin (by id)
router.get('/pages/:slugOrId', optionalAuth, asyncHandler(async (req, res) => {
  const { slugOrId } = req.params;
  const byId = isUUID(slugOrId);
  const col  = byId ? 'id' : 'slug';

  const { rows } = await query(
    `SELECT p.*, sm.meta_title, sm.meta_description, sm.og_image_url, sm.canonical_url,
            sm.focus_keyword, sm.schema_json,
            u.display_name AS created_by_name
       FROM cms_schema.pages p
       LEFT JOIN cms_schema.seo_meta sm ON p.seo_id = sm.id
       LEFT JOIN auth_schema.users   u  ON p.created_by = u.id
      WHERE p.${col} = $1 AND p.deleted_at IS NULL`,
    [slugOrId]
  );
  if (!rows.length) throw new AppError('Page not found', 404);
  return success(res, rows[0]);
}));

// GET /cms/pages/:id/sections
router.get('/pages/:id/sections', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.page_sections WHERE page_id=$1 AND is_visible=TRUE ORDER BY sort_order`,
    [req.params.id]
  );
  return success(res, rows);
}));

// POST /cms/pages
router.post('/pages', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { title, slug, excerpt, template, visibility, password, seo_id, parent_id,
          sort_order, is_homepage, allow_comments, scheduled_at, locale, translations, metadata } = req.body;
  if (!title) throw new AppError('title required');

  const finalSlug = slug || generateSlug(title);
  const { rows } = await query(
    `INSERT INTO cms_schema.pages
       (title, slug, excerpt, template, visibility, password, seo_id, parent_id,
        sort_order, is_homepage, allow_comments, scheduled_at, locale, translations, metadata,
        created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5::visibility_type,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16,$16)
     RETURNING *`,
    [title, finalSlug, excerpt, template || 'default', visibility || 'draft',
     password, seo_id || null, parent_id || null, sort_order || 0,
     is_homepage || false, allow_comments || false, scheduled_at || null,
     locale || 'en', JSON.stringify(translations || {}), JSON.stringify(metadata || {}), req.userId]
  );
  return created(res, rows[0]);
}));

// PATCH /cms/pages/:id
router.patch('/pages/:id', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { title, slug, excerpt, template, visibility, sort_order, is_homepage,
          allow_comments, scheduled_at, locale, translations, metadata, published_at } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.pages
        SET title        = COALESCE($2, title),
            slug         = COALESCE($3, slug),
            excerpt      = COALESCE($4, excerpt),
            template     = COALESCE($5, template),
            visibility   = COALESCE($6::visibility_type, visibility),
            sort_order   = COALESCE($7, sort_order),
            is_homepage  = COALESCE($8, is_homepage),
            allow_comments = COALESCE($9, allow_comments),
            published_at = COALESCE($10, published_at),
            updated_by   = $11
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, title, slug, excerpt, template, visibility, sort_order,
     is_homepage, allow_comments, published_at, req.userId]
  );
  if (!rows.length) throw new AppError('Page not found', 404);
  return success(res, rows[0]);
}));

// DELETE /cms/pages/:id
router.delete('/pages/:id', authenticate, requirePermission('page.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.pages SET deleted_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// POST /cms/pages/:id/sections
router.post('/pages/:id/sections', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { block_type, block_props, sort_order, is_visible, animation, css_class, locale } = req.body;
  if (!block_type) throw new AppError('block_type required');
  const { rows } = await query(
    `INSERT INTO cms_schema.page_sections (page_id, block_type, block_props, sort_order, is_visible, animation, css_class, locale)
     VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.id, block_type, JSON.stringify(block_props || {}), sort_order || 0,
     is_visible !== false, animation, css_class, locale || 'en']
  );
  return created(res, rows[0]);
}));

// PATCH /cms/pages/:pageId/sections/:sectionId
router.patch('/pages/:pageId/sections/:sectionId', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { block_props, sort_order, is_visible, animation, css_class } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.page_sections
        SET block_props = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE block_props END,
            sort_order  = COALESCE($4, sort_order),
            is_visible  = COALESCE($5, is_visible),
            animation   = COALESCE($6, animation),
            css_class   = COALESCE($7, css_class)
      WHERE id=$1 AND page_id=$2 RETURNING *`,
    [req.params.sectionId, req.params.pageId,
     block_props ? JSON.stringify(block_props) : null, sort_order, is_visible, animation, css_class]
  );
  if (!rows.length) throw new AppError('Section not found', 404);
  return success(res, rows[0]);
}));

// DELETE /cms/pages/:pageId/sections/:sectionId
router.delete('/pages/:pageId/sections/:sectionId', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.page_sections WHERE id=$1 AND page_id=$2`, [req.params.sectionId, req.params.pageId]);
  return noContent(res);
}));

// Page revisions
router.get('/pages/:id/revisions', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT pr.id, pr.revision_num, pr.title, pr.note, pr.created_at, u.display_name AS saved_by_name
       FROM cms_schema.page_revisions pr
       LEFT JOIN auth_schema.users u ON pr.saved_by = u.id
      WHERE pr.page_id=$1 ORDER BY pr.revision_num DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/pages/:id/revisions', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { title, sections, seo_data, note } = req.body;
  // Get next revision number
  const { rows: revRows } = await query(
    `SELECT COALESCE(MAX(revision_num), 0)+1 AS next FROM cms_schema.page_revisions WHERE page_id=$1`,
    [req.params.id]
  );
  const revNum = revRows[0].next;
  const { rows } = await query(
    `INSERT INTO cms_schema.page_revisions (page_id, revision_num, title, sections, seo_data, saved_by, note)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) RETURNING *`,
    [req.params.id, revNum, title, JSON.stringify(sections || []), JSON.stringify(seo_data || null), req.userId, note]
  );
  await query(`UPDATE cms_schema.pages SET revision_count=revision_count+1 WHERE id=$1`, [req.params.id]);
  return created(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  SEO META
// ════════════════════════════════════════════════════════════
router.get('/seo', authenticate, paginate, asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.seo_meta ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [req.pagination.limit, req.pagination.offset]);
  return success(res, rows);
}));

router.post('/seo', authenticate, requirePermission('seo.manage'), asyncHandler(async (req, res) => {
  const { meta_title, meta_description, og_title, og_description, og_image_url, og_type,
          twitter_card, canonical_url, robots, schema_json, focus_keyword } = req.body;
  const { rows } = await query(
    `INSERT INTO cms_schema.seo_meta
       (meta_title, meta_description, og_title, og_description, og_image_url, og_type,
        twitter_card, canonical_url, robots, schema_json, focus_keyword)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) RETURNING *`,
    [meta_title, meta_description, og_title, og_description, og_image_url, og_type || 'website',
     twitter_card || 'summary_large_image', canonical_url, robots || 'index,follow',
     schema_json ? JSON.stringify(schema_json) : null, focus_keyword]
  );
  return created(res, rows[0]);
}));

router.patch('/seo/:id', authenticate, requirePermission('seo.manage'), asyncHandler(async (req, res) => {
  const { meta_title, meta_description, og_title, og_description, og_image_url,
          canonical_url, robots, schema_json, focus_keyword } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.seo_meta
        SET meta_title       = COALESCE($2, meta_title),
            meta_description = COALESCE($3, meta_description),
            og_title         = COALESCE($4, og_title),
            og_description   = COALESCE($5, og_description),
            og_image_url     = COALESCE($6, og_image_url),
            canonical_url    = COALESCE($7, canonical_url),
            robots           = COALESCE($8, robots),
            focus_keyword    = COALESCE($9, focus_keyword)
      WHERE id=$1 RETURNING *`,
    [req.params.id, meta_title, meta_description, og_title, og_description, og_image_url,
     canonical_url, robots, focus_keyword]
  );
  if (!rows.length) throw new AppError('SEO meta not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  MENUS
// ════════════════════════════════════════════════════════════
router.get('/menus', asyncHandler(async (req, res) => {
  const { location } = req.query;
  const { rows } = await query(
    `SELECT * FROM cms_schema.menus WHERE is_active=TRUE ${location ? 'AND location=$1' : ''} ORDER BY name`,
    location ? [location] : []
  );
  return success(res, rows);
}));

router.get('/menus/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT * FROM cms_schema.menus WHERE ${byId ? 'id' : 'slug'}=$1 AND is_active=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Menu not found', 404);
  return success(res, rows[0]);
}));

router.post('/menus', authenticate, requirePermission('menu.manage'), asyncHandler(async (req, res) => {
  const { name, slug, location, items } = req.body;
  if (!name || !slug || !location) throw new AppError('name, slug, location required');
  const { rows } = await query(
    `INSERT INTO cms_schema.menus (name, slug, location, items) VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
    [name, slug, location, JSON.stringify(items || [])]
  );
  return created(res, rows[0]);
}));

router.patch('/menus/:id', authenticate, requirePermission('menu.manage'), asyncHandler(async (req, res) => {
  const { name, items, is_active } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.menus
        SET name      = COALESCE($2, name),
            items     = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE items END,
            is_active = COALESCE($4, is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, items ? JSON.stringify(items) : null, is_active]
  );
  if (!rows.length) throw new AppError('Menu not found', 404);
  return success(res, rows[0]);
}));

router.delete('/menus/:id', authenticate, requirePermission('menu.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.menus WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  REDIRECTS
// ════════════════════════════════════════════════════════════
router.get('/redirects', authenticate, paginate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.redirects WHERE is_active=TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [req.pagination.limit, req.pagination.offset]
  );
  return success(res, rows);
}));

router.get('/redirects/resolve', asyncHandler(async (req, res) => {
  const { path } = req.query;
  if (!path) throw new AppError('path required');
  const { rows } = await query(
    `SELECT * FROM cms_schema.redirects WHERE source_path=$1 AND is_active=TRUE LIMIT 1`,
    [path]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'No redirect found' });
  await query(`UPDATE cms_schema.redirects SET hit_count=hit_count+1 WHERE id=$1`, [rows[0].id]);
  return success(res, rows[0]);
}));

router.post('/redirects', authenticate, requirePermission('redirect.manage'), asyncHandler(async (req, res) => {
  const { source_path, target_path, status_code = 301 } = req.body;
  if (!source_path || !target_path) throw new AppError('source_path and target_path required');
  const { rows } = await query(
    `INSERT INTO cms_schema.redirects (source_path, target_path, status_code, created_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [source_path, target_path, status_code, req.userId]
  );
  return created(res, rows[0]);
}));

router.delete('/redirects/:id', authenticate, requirePermission('redirect.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.redirects SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  FORMS & SUBMISSIONS
// ════════════════════════════════════════════════════════════
router.get('/forms', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.forms WHERE is_active=TRUE ORDER BY name`);
  return success(res, rows);
}));

router.get('/forms/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT id, name, slug, description, fields, settings FROM cms_schema.forms
      WHERE ${byId ? 'id' : 'slug'}=$1 AND is_active=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Form not found', 404);
  return success(res, rows[0]);
}));

router.post('/forms', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { name, slug, description, fields, settings, notification_emails } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO cms_schema.forms (name, slug, description, fields, settings, notification_emails, created_by)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) RETURNING *`,
    [name, slug, description, JSON.stringify(fields || []), JSON.stringify(settings || {}),
     notification_emails || null, req.userId]
  );
  return created(res, rows[0]);
}));

router.post('/forms/:id/submit', optionalAuth, asyncHandler(async (req, res) => {
  const { data } = req.body;
  if (!data) throw new AppError('Form data required');

  const { rows: formRows } = await query(`SELECT id FROM cms_schema.forms WHERE id=$1 AND is_active=TRUE`, [req.params.id]);
  if (!formRows.length) throw new AppError('Form not found', 404);

  const { rows } = await query(
    `INSERT INTO cms_schema.form_submissions (form_id, data, ip_address, user_agent, referrer)
     VALUES ($1,$2::jsonb,$3,$4,$5) RETURNING *`,
    [req.params.id, JSON.stringify(data), req.ip, req.headers['user-agent'], req.headers.referer]
  );
  return created(res, rows[0], 'Form submitted successfully');
}));

router.get('/forms/:id/submissions', authenticate, requirePermission('page.edit'), paginate, asyncHandler(async (req, res) => {
  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM cms_schema.form_submissions WHERE form_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.id, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM cms_schema.form_submissions WHERE form_id=$1`, [req.params.id]),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// ════════════════════════════════════════════════════════════
//  TESTIMONIALS
// ════════════════════════════════════════════════════════════
router.get('/testimonials', paginate, asyncHandler(async (req, res) => {
  const { is_featured } = req.query;
  const conditions = ['is_published=TRUE'];
  const params     = [];
  let idx = 1;
  if (is_featured !== undefined) { conditions.push(`is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  const where = conditions.join(' AND ');

  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM cms_schema.testimonials WHERE ${where} ORDER BY display_order ASC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM cms_schema.testimonials WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/testimonials', authenticate, asyncHandler(async (req, res) => {
  const { author_name, author_title, author_company, content, rating, source, source_url,
          service_id, project_id, is_featured, display_order } = req.body;
  if (!author_name || !content) throw new AppError('author_name and content required');
  const { rows } = await query(
    `INSERT INTO cms_schema.testimonials
       (author_name, author_title, author_company, content, rating, source, source_url,
        service_id, project_id, is_featured, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [author_name, author_title, author_company, content, rating, source, source_url,
     service_id || null, project_id || null, is_featured || false, display_order || 0]
  );
  return created(res, rows[0]);
}));

router.patch('/testimonials/:id', authenticate, asyncHandler(async (req, res) => {
  const { content, rating, is_featured, is_published, display_order } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.testimonials
        SET content       = COALESCE($2, content),
            rating        = COALESCE($3, rating),
            is_featured   = COALESCE($4, is_featured),
            is_published  = COALESCE($5, is_published),
            display_order = COALESCE($6, display_order)
      WHERE id=$1 RETURNING *`,
    [req.params.id, content, rating, is_featured, is_published, display_order]
  );
  if (!rows.length) throw new AppError('Testimonial not found', 404);
  return success(res, rows[0]);
}));

router.delete('/testimonials/:id', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.testimonials WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  POPUPS / BANNERS
// ════════════════════════════════════════════════════════════
router.get('/popups', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.popups WHERE is_active=TRUE
      AND (start_at IS NULL OR start_at <= NOW())
      AND (end_at IS NULL OR end_at >= NOW())
     ORDER BY created_at DESC`
  );
  return success(res, rows);
}));

router.post('/popups', authenticate, asyncHandler(async (req, res) => {
  const { name, type, content, trigger_type, trigger_val, target_pages, audience, start_at, end_at } = req.body;
  const { rows } = await query(
    `INSERT INTO cms_schema.popups (name, type, content, trigger_type, trigger_val, target_pages, audience, start_at, end_at)
     VALUES ($1,$2,$3::jsonb,$4,$5::jsonb,$6,$7::jsonb,$8,$9) RETURNING *`,
    [name, type || 'modal', JSON.stringify(content || {}), trigger_type || 'time_delay',
     JSON.stringify(trigger_val || {}), target_pages || null,
     JSON.stringify(audience || {}), start_at || null, end_at || null]
  );
  return created(res, rows[0]);
}));

router.patch('/popups/:id', authenticate, asyncHandler(async (req, res) => {
  const { is_active, content, start_at, end_at } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.popups
        SET is_active = COALESCE($2, is_active),
            content   = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE content END,
            start_at  = COALESCE($4, start_at),
            end_at    = COALESCE($5, end_at)
      WHERE id=$1 RETURNING *`,
    [req.params.id, is_active, content ? JSON.stringify(content) : null, start_at, end_at]
  );
  if (!rows.length) throw new AppError('Popup not found', 404);
  return success(res, rows[0]);
}));

module.exports = router;
