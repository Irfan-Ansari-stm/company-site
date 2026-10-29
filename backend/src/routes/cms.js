// src/routes/cms.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sanitizeHtmlMarkup } = require('../utils/sanitizer');
const { memoryCache } = require('../utils/cache');

// Automatic cache invalidation on any CMS mutations
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    memoryCache.flush();
  }
  next();
});

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
  const isAdmin = req.user?.role && !['client','candidate'].includes(req.user.role);
  const includeHidden = isAdmin || req.query.include_hidden === 'true';
  const whereClause = includeHidden ? 'page_id=$1' : 'page_id=$1 AND is_visible=TRUE';

  const { rows } = await query(
    `SELECT * FROM cms_schema.page_sections WHERE ${whereClause} ORDER BY sort_order ASC, created_at ASC`,
    [req.params.id]
  );
  return success(res, rows);
}));

// PUT /cms/pages/:id/sections/reorder
router.put('/pages/:id/sections/reorder', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { sectionIds } = req.body;
  if (!Array.isArray(sectionIds)) throw new AppError('sectionIds array required', 400);

  await withTransaction(async (client) => {
    for (let i = 0; i < sectionIds.length; i++) {
      await client.query(
        `UPDATE cms_schema.page_sections SET sort_order = $1 WHERE id = $2 AND page_id = $3`,
        [i + 1, sectionIds[i], req.params.id]
      );
    }
  });

  return success(res, null, 'Sections reordered successfully');
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

  // Sanitize custom HTML if provided
  const cleanedProps = { ...(block_props || {}) };
  if (cleanedProps.custom_html) {
    cleanedProps.custom_html = sanitizeHtmlMarkup(cleanedProps.custom_html);
  }

  const { rows } = await query(
    `INSERT INTO cms_schema.page_sections (page_id, block_type, block_props, sort_order, is_visible, animation, css_class, locale)
     VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.id, block_type, JSON.stringify(cleanedProps), sort_order || 0,
     is_visible !== false, animation, css_class, locale || 'en']
  );
  return created(res, rows[0]);
}));

// POST /cms/pages/:id/duplicate-section/:sectionId
router.post('/pages/:id/duplicate-section/:sectionId', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { rows: source } = await query(
    `SELECT * FROM cms_schema.page_sections WHERE id=$1 AND page_id=$2`,
    [req.params.sectionId, req.params.id]
  );
  if (!source.length) throw new AppError('Source section not found', 404);

  const sec = source[0];
  const nextOrder = sec.sort_order + 1;

  // Bump subsequent sections
  await query(
    `UPDATE cms_schema.page_sections SET sort_order = sort_order + 1 WHERE page_id=$1 AND sort_order >= $2`,
    [req.params.id, nextOrder]
  );

  const { rows: createdRow } = await query(
    `INSERT INTO cms_schema.page_sections (page_id, block_type, block_props, sort_order, is_visible, animation, css_class, locale)
     VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.id, sec.block_type, JSON.stringify(sec.block_props || {}), nextOrder,
     sec.is_visible, sec.animation, sec.css_class, sec.locale]
  );

  return created(res, createdRow[0], 'Section duplicated successfully');
}));

// PATCH /cms/pages/:pageId/sections/:sectionId
router.patch('/pages/:pageId/sections/:sectionId', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { block_props, sort_order, is_visible, animation, css_class } = req.body;

  let cleanedProps = block_props;
  if (cleanedProps && typeof cleanedProps === 'object') {
    cleanedProps = { ...cleanedProps };
    if (cleanedProps.custom_html) {
      cleanedProps.custom_html = sanitizeHtmlMarkup(cleanedProps.custom_html);
    }
  }

  const { rows } = await query(
    `UPDATE cms_schema.page_sections
        SET block_props = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE block_props END,
            sort_order  = COALESCE($4, sort_order),
            is_visible  = COALESCE($5, is_visible),
            animation   = COALESCE($6, animation),
            css_class   = COALESCE($7, css_class)
      WHERE id=$1 AND page_id=$2 RETURNING *`,
    [req.params.sectionId, req.params.pageId,
     cleanedProps ? JSON.stringify(cleanedProps) : null, sort_order, is_visible, animation, css_class]
  );
  if (!rows.length) throw new AppError('Section not found', 404);
  return success(res, rows[0]);
}));

// DELETE /cms/pages/:pageId/sections/:sectionId
router.delete('/pages/:pageId/sections/:sectionId', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.page_sections WHERE id=$1 AND page_id=$2`, [req.params.sectionId, req.params.pageId]);
  return noContent(res);
}));

// POST /cms/pages/:id/publish (Snapshot to revisions and publish)
router.post('/pages/:id/publish', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { rows: pageRows } = await query(`SELECT * FROM cms_schema.pages WHERE id=$1`, [req.params.id]);
  if (!pageRows.length) throw new AppError('Page not found', 404);
  const p = pageRows[0];

  // Fetch all current sections
  const { rows: sections } = await query(
    `SELECT * FROM cms_schema.page_sections WHERE page_id=$1 ORDER BY sort_order ASC, created_at ASC`,
    [req.params.id]
  );

  // Create snapshot revision
  const { rows: revRows } = await query(
    `SELECT COALESCE(MAX(revision_num), 0)+1 AS next FROM cms_schema.page_revisions WHERE page_id=$1`,
    [req.params.id]
  );
  const revNum = revRows[0].next;

  await query(
    `INSERT INTO cms_schema.page_revisions (page_id, revision_num, title, sections, seo_data, saved_by, note)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)`,
    [req.params.id, revNum, p.title, JSON.stringify(sections || []), JSON.stringify(p.seo_metadata || null), req.userId, req.body.note || 'Published via CMS Studio']
  );

  // Update page visibility
  const { rows: updatedPage } = await query(
    `UPDATE cms_schema.pages
        SET visibility = 'public', published_at = NOW(), revision_count = revision_count + 1
      WHERE id=$1 RETURNING *`,
    [req.params.id]
  );

  return success(res, { page: updatedPage[0], revisionNum: revNum }, 'Page published successfully with version snapshot');
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

// POST /cms/pages/:id/revisions/:revId/rollback (Roll back page sections to revision)
router.post('/pages/:id/revisions/:revId/rollback', authenticate, requirePermission('page.edit'), asyncHandler(async (req, res) => {
  const { rows: revRows } = await query(
    `SELECT * FROM cms_schema.page_revisions WHERE id=$1 AND page_id=$2`,
    [req.params.revId, req.params.id]
  );
  if (!revRows.length) throw new AppError('Revision snapshot not found', 404);

  const rev = revRows[0];
  const sectionsToRestore = rev.sections || [];

  await withTransaction(async (client) => {
    // Delete current sections
    await client.query(`DELETE FROM cms_schema.page_sections WHERE page_id=$1`, [req.params.id]);

    // Restore sections
    for (let i = 0; i < sectionsToRestore.length; i++) {
      const s = sectionsToRestore[i];
      await client.query(
        `INSERT INTO cms_schema.page_sections (page_id, block_type, block_props, sort_order, is_visible, animation, css_class, locale)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8)`,
        [req.params.id, s.block_type, JSON.stringify(s.block_props || {}), i + 1,
         s.is_visible !== false, s.animation, s.css_class, s.locale || 'en']
      );
    }
  });

  return success(res, null, `Successfully rolled back to Revision #${rev.revision_num}`);
}));

// ── Theme Settings (Design System Management) ─────────────────
router.get('/theme-settings', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT value FROM system_schema.settings WHERE key = 'theme.tokens'`);
  const tokens = rows[0]?.value || {
    primaryColor: '#0284c7',
    primaryHover: '#0369a1',
    accentColor: '#6366f1',
    backgroundColor: '#f8fafc',
    foregroundColor: '#0f172a',
    cardBackground: '#ffffff',
    containerMaxWidth: '80rem',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, system-ui, sans-serif'
  };
  return success(res, tokens);
}));

router.put('/theme-settings', authenticate, requirePermission('settings.edit'), asyncHandler(async (req, res) => {
  const tokens = req.body;
  if (!tokens || typeof tokens !== 'object') throw new AppError('Theme tokens object required', 400);

  await query(
    `INSERT INTO system_schema.settings (key, value, description, is_public, updated_at)
     VALUES ('theme.tokens', $1::jsonb, 'Global Design System & Semantic Theme Tokens', TRUE, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(tokens)]
  );

  return success(res, tokens, 'Global theme design tokens updated successfully');
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
  const byId = isUUID(req.params.id);
  const itemsJson = items !== undefined ? (typeof items === 'string' ? items : JSON.stringify(items)) : null;
  const { rows } = await query(
    `UPDATE cms_schema.menus
        SET name       = COALESCE($2, name),
            items      = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE items END,
            is_active  = COALESCE($4, is_active),
            updated_at = NOW()
      WHERE ${byId ? 'id' : 'slug'}=$1 RETURNING *`,
    [req.params.id, name, itemsJson, is_active]
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

// ════════════════════════════════════════════════════════════
//  CMS OVERVIEW & METRICS
// ════════════════════════════════════════════════════════════
router.get('/stats', authenticate, asyncHandler(async (_req, res) => {
  const [
    totalPages,
    publishedPages,
    draftPages,
    totalServices,
    totalSolutions,
    totalShowcases,
    publishedPosts,
    draftPosts,
    totalFaqs,
    totalLeads,
    totalMedia,
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.pages WHERE deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.pages WHERE visibility = 'public' AND deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.pages WHERE visibility = 'draft' AND deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.services WHERE deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.solutions`),
    query(`SELECT COUNT(*)::int AS count FROM portfolio_schema.projects WHERE deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM blog_schema.posts WHERE status = 'published' AND deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM blog_schema.posts WHERE status = 'draft' AND deleted_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.faqs`),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.leads`),
    query(`SELECT COUNT(*)::int AS count FROM cms_schema.media`),
  ]);

  return success(res, {
    pages: {
      total: totalPages.rows[0].count,
      published: publishedPages.rows[0].count,
      draft: draftPages.rows[0].count,
    },
    services: totalServices.rows[0].count,
    solutions: totalSolutions.rows[0].count,
    showcases: totalShowcases.rows[0].count,
    blog: {
      published: publishedPosts.rows[0].count,
      draft: draftPosts.rows[0].count,
    },
    faqs: totalFaqs.rows[0].count,
    leads: totalLeads.rows[0].count,
    media: totalMedia.rows[0].count,
  });
}));

// ════════════════════════════════════════════════════════════
//  FAQS (ADMIN CRUD)
// ════════════════════════════════════════════════════════════
router.get('/faqs', optionalAuth, paginate, asyncHandler(async (req, res) => {
  const { category, search, status } = req.query;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (category) { conditions.push(`category = $${idx}`); params.push(category); idx++; }
  if (status === 'published') { conditions.push(`is_published = TRUE`); }
  else if (status === 'draft') { conditions.push(`is_published = FALSE`); }
  if (search) {
    conditions.push(`(question ILIKE $${idx} OR answer ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM cms_schema.faqs ${where} ORDER BY sort_order ASC, created_at ASC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM cms_schema.faqs ${where}`, params),
  ]);

  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/faqs', authenticate, asyncHandler(async (req, res) => {
  const { category, question, answer, sort_order, is_featured, is_published } = req.body;
  if (!question || !answer) throw new AppError('Question and answer required', 400);

  const { rows } = await query(
    `INSERT INTO cms_schema.faqs (category, question, answer, sort_order, is_featured, is_published)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [category || 'General', question, answer, sort_order || 0, is_featured || false, is_published !== false]
  );
  return created(res, rows[0]);
}));

router.patch('/faqs/:id', authenticate, asyncHandler(async (req, res) => {
  const { category, question, answer, sort_order, is_featured, is_published } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.faqs
        SET category     = COALESCE($2, category),
            question     = COALESCE($3, question),
            answer       = COALESCE($4, answer),
            sort_order   = COALESCE($5, sort_order),
            is_featured  = COALESCE($6, is_featured),
            is_published = COALESCE($7, is_published),
            updated_at   = NOW()
      WHERE id = $1 RETURNING *`,
    [req.params.id, category, question, answer, sort_order, is_featured, is_published]
  );
  if (!rows.length) throw new AppError('FAQ not found', 404);
  return success(res, rows[0]);
}));

router.delete('/faqs/:id', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.faqs WHERE id = $1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  DELIVERY PROCESS (ADMIN CRUD)
// ════════════════════════════════════════════════════════════
router.get('/delivery-process', optionalAuth, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.delivery_process ORDER BY sort_order ASC, step_number ASC`);
  return success(res, rows);
}));

router.post('/delivery-process', authenticate, asyncHandler(async (req, res) => {
  const { step_number, title, slug, description, deliverables, client_involvement, tools_methods, badge, sort_order, is_active } = req.body;
  if (!title || !description) throw new AppError('Title and description required', 400);

  const { rows } = await query(
    `INSERT INTO cms_schema.delivery_process
       (step_number, title, slug, description, deliverables, client_involvement, tools_methods, badge, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9, $10)
     RETURNING *`,
    [
      step_number || 1,
      title,
      slug || generateSlug(title),
      description,
      JSON.stringify(deliverables || []),
      client_involvement || null,
      JSON.stringify(tools_methods || []),
      badge || null,
      sort_order || 0,
      is_active !== false,
    ]
  );
  return created(res, rows[0]);
}));

router.patch('/delivery-process/:id', authenticate, asyncHandler(async (req, res) => {
  const { step_number, title, slug, description, deliverables, client_involvement, tools_methods, badge, sort_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.delivery_process
        SET step_number        = COALESCE($2, step_number),
            title              = COALESCE($3, title),
            slug               = COALESCE($4, slug),
            description        = COALESCE($5, description),
            deliverables       = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE deliverables END,
            client_involvement = COALESCE($7, client_involvement),
            tools_methods      = CASE WHEN $8::jsonb IS NOT NULL THEN $8::jsonb ELSE tools_methods END,
            badge              = COALESCE($9, badge),
            sort_order         = COALESCE($10, sort_order),
            is_active          = COALESCE($11, is_active),
            updated_at         = NOW()
      WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      step_number,
      title,
      slug,
      description,
      deliverables ? JSON.stringify(deliverables) : null,
      client_involvement,
      tools_methods ? JSON.stringify(tools_methods) : null,
      badge,
      sort_order,
      is_active,
    ]
  );
  if (!rows.length) throw new AppError('Process step not found', 404);
  return success(res, rows[0]);
}));

router.delete('/delivery-process/:id', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.delivery_process WHERE id = $1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  ENGAGEMENT MODELS (ADMIN CRUD)
// ════════════════════════════════════════════════════════════
router.get('/engagement-models', optionalAuth, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT * FROM cms_schema.engagement_models ORDER BY sort_order ASC`);
  return success(res, rows);
}));

router.post('/engagement-models', authenticate, asyncHandler(async (req, res) => {
  const { name, slug, tagline, description, suitable_for, key_features, client_responsibilities, our_responsibilities, badge, sort_order, is_active } = req.body;
  if (!name || !description) throw new AppError('Name and description required', 400);

  const finalSlug = slug || generateSlug(name);
  const { rows } = await query(
    `INSERT INTO cms_schema.engagement_models
       (name, slug, tagline, description, suitable_for, key_features, client_responsibilities, our_responsibilities, badge, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11)
     RETURNING *`,
    [
      name,
      finalSlug,
      tagline || null,
      description,
      JSON.stringify(suitable_for || []),
      JSON.stringify(key_features || []),
      JSON.stringify(client_responsibilities || []),
      JSON.stringify(our_responsibilities || []),
      badge || null,
      sort_order || 0,
      is_active !== false,
    ]
  );
  return created(res, rows[0]);
}));

router.patch('/engagement-models/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, slug, tagline, description, suitable_for, key_features, client_responsibilities, our_responsibilities, badge, sort_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.engagement_models
        SET name                    = COALESCE($2, name),
            slug                    = COALESCE($3, slug),
            tagline                 = COALESCE($4, tagline),
            description             = COALESCE($5, description),
            suitable_for            = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE suitable_for END,
            key_features            = CASE WHEN $7::jsonb IS NOT NULL THEN $7::jsonb ELSE key_features END,
            client_responsibilities = CASE WHEN $8::jsonb IS NOT NULL THEN $8::jsonb ELSE client_responsibilities END,
            our_responsibilities    = CASE WHEN $9::jsonb IS NOT NULL THEN $9::jsonb ELSE our_responsibilities END,
            badge                   = COALESCE($10, badge),
            sort_order              = COALESCE($11, sort_order),
            is_active               = COALESCE($12, is_active),
            updated_at              = NOW()
      WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      name,
      slug,
      tagline,
      description,
      suitable_for ? JSON.stringify(suitable_for) : null,
      key_features ? JSON.stringify(key_features) : null,
      client_responsibilities ? JSON.stringify(client_responsibilities) : null,
      our_responsibilities ? JSON.stringify(our_responsibilities) : null,
      badge,
      sort_order,
      is_active,
    ]
  );
  if (!rows.length) throw new AppError('Engagement model not found', 404);
  return success(res, rows[0]);
}));

router.delete('/engagement-models/:id', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM cms_schema.engagement_models WHERE id = $1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SITE SETTINGS & BRANDING (CMS ADMIN)
// ════════════════════════════════════════════════════════════
router.get('/site-settings', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT key, value, group_name FROM system_schema.settings WHERE group_name IN ('branding', 'social', 'contact', 'announcement')`);
  const data = {};
  rows.forEach(r => {
    try {
      data[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
    } catch {
      data[r.key] = r.value;
    }
  });
  return success(res, data);
}));

router.put('/site-settings', authenticate, asyncHandler(async (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') throw new AppError('Settings object required', 400);

  await withTransaction(async (client) => {
    for (const [key, val] of Object.entries(settings)) {
      if (val === undefined) continue;
      // PostgreSQL column system_schema.settings.value is JSONB.
      // All values (strings, objects, booleans, numbers) must be valid JSON strings when inserting into JSONB!
      const valJson = JSON.stringify(val);
      await client.query(
        `INSERT INTO system_schema.settings (key, value, is_public, group_name)
         VALUES ($1, $2::jsonb, TRUE, 'branding')
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, valJson]
      );
    }
  });

  return success(res, null, 'Site settings updated');
}));

module.exports = router;
