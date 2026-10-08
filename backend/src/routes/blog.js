// src/routes/blog.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ── Categories ───────────────────────────────────────────────
router.get('/categories', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, COUNT(p.id) FILTER (WHERE p.status='published' AND p.deleted_at IS NULL) AS post_count
       FROM blog_schema.categories c
       LEFT JOIN blog_schema.posts p ON c.id=p.category_id
      WHERE c.is_active=TRUE
      GROUP BY c.id ORDER BY c.sort_order, c.name`
  );
  return success(res, rows);
}));

router.post('/categories', authenticate, requirePermission('post.publish'), asyncHandler(async (req, res) => {
  const { name, slug, description, color, icon, parent_id, sort_order } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO blog_schema.categories (name, slug, description, color, icon, parent_id, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, slug, description, color, icon, parent_id || null, sort_order || 0]
  );
  return created(res, rows[0]);
}));

router.patch('/categories/:id', authenticate, requirePermission('post.publish'), asyncHandler(async (req, res) => {
  const { name, description, color, icon, sort_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE blog_schema.categories
        SET name       = COALESCE($2, name),
            description= COALESCE($3, description),
            color      = COALESCE($4, color),
            icon       = COALESCE($5, icon),
            sort_order = COALESCE($6, sort_order),
            is_active  = COALESCE($7, is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, description, color, icon, sort_order, is_active]
  );
  if (!rows.length) throw new AppError('Category not found', 404);
  return success(res, rows[0]);
}));

router.delete('/categories/:id', authenticate, requirePermission('post.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE blog_schema.categories SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ── Tags ─────────────────────────────────────────────────────
router.get('/tags', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.name, t.slug, COUNT(pt.post_id) FILTER (WHERE p.status='published') AS usage_count
       FROM blog_schema.tags t
       LEFT JOIN blog_schema.post_tags pt ON t.id=pt.tag_id
       LEFT JOIN blog_schema.posts p ON pt.post_id=p.id
      GROUP BY t.id ORDER BY usage_count DESC, t.name`
  );
  return success(res, rows);
}));

router.get('/tags/cloud', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM blog_schema.mv_tag_cloud ORDER BY usage_count DESC LIMIT 50`);
  return success(res, rows);
}));

router.post('/tags', authenticate, asyncHandler(async (req, res) => {
  const { name, slug } = req.body;
  if (!name) throw new AppError('name required');
  const finalSlug = slug || generateSlug(name);
  const { rows } = await query(
    `INSERT INTO blog_schema.tags (name, slug) VALUES ($1,$2) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING *`,
    [name, finalSlug]
  );
  return created(res, rows[0]);
}));

// ── Posts ────────────────────────────────────────────────────
router.get('/posts', paginate, asyncHandler(async (req, res) => {
  const { status, category_id, author_id, is_featured, search, tag } = req.query;
  const isAdmin = req.user?.role && !['client','candidate'].includes(req.user?.role);

  const conditions = ['p.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (!isAdmin) conditions.push(`p.status='published'`);
  else if (status) { conditions.push(`p.status=$${idx}::post_status`); params.push(status); idx++; }

  if (category_id) { conditions.push(`p.category_id=$${idx}`); params.push(category_id); idx++; }
  if (author_id)   { conditions.push(`p.author_id=$${idx}`);   params.push(author_id); idx++; }
  if (is_featured !== undefined) { conditions.push(`p.is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  if (search) {
    conditions.push(`to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt,'')) @@ plainto_tsquery('english',$${idx})`);
    params.push(search); idx++;
  }
  if (tag) {
    conditions.push(`EXISTS (SELECT 1 FROM blog_schema.post_tags pt JOIN blog_schema.tags t ON pt.tag_id=t.id WHERE pt.post_id=p.id AND t.slug=$${idx})`);
    params.push(tag); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.status, p.is_featured,
              p.read_time_min, p.view_count, p.like_count, p.cover_image,
              p.published_at, p.created_at,
              c.name AS category_name, c.slug AS category_slug,
              u.display_name AS author_name, u.avatar_url AS author_avatar
         FROM blog_schema.posts p
         LEFT JOIN blog_schema.categories c ON p.category_id=c.id
         LEFT JOIN auth_schema.users       u ON p.author_id=u.id
        WHERE ${where}
        ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM blog_schema.posts p WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/posts/published', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM blog_schema.v_posts_published LIMIT 20`);
  return success(res, rows);
}));

router.get('/posts/:slugOrId', optionalAuth, asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT p.*,
            c.name AS category_name, c.slug AS category_slug,
            u.id AS author_id, u.display_name AS author_name, u.avatar_url AS author_avatar, u.bio AS author_bio,
            sm.meta_title, sm.meta_description, sm.og_image_url, sm.canonical_url, sm.schema_json
       FROM blog_schema.posts p
       LEFT JOIN blog_schema.categories c ON p.category_id=c.id
       LEFT JOIN auth_schema.users       u ON p.author_id=u.id
       LEFT JOIN cms_schema.seo_meta    sm ON p.seo_id=sm.id
      WHERE p.${byId ? 'id' : 'slug'}=$1 AND p.deleted_at IS NULL`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Post not found', 404);

  const post = rows[0];
  // Load tags and related posts
  const [tags, related] = await Promise.all([
    query(`SELECT t.id, t.name, t.slug FROM blog_schema.tags t
            JOIN blog_schema.post_tags pt ON t.id=pt.tag_id WHERE pt.post_id=$1`, [post.id]),
    query(`SELECT pr.id, pr.title, pr.slug, pr.cover_image FROM blog_schema.posts pr
            JOIN blog_schema.post_relations rel ON pr.id=rel.related_post_id
           WHERE rel.post_id=$1 AND pr.status='published' AND pr.deleted_at IS NULL
           ORDER BY rel.sort_order LIMIT 5`, [post.id]),
  ]);

  // Increment view count (fire and forget)
  query(`UPDATE blog_schema.posts SET view_count=view_count+1 WHERE id=$1`, [post.id]).catch(() => {});

  return success(res, { ...post, tags: tags.rows, related_posts: related.rows });
}));

router.post('/posts', authenticate, requirePermission('post.write'), asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, content_json, category_id, cover_image, status,
          is_featured, allow_comments, scheduled_at, locale, seo_id, tags, metadata } = req.body;
  if (!title || !content) throw new AppError('title and content required');

  const finalSlug = slug || generateSlug(title);
  const { rows } = await withTransaction(async (client) => {
    const postRes = await client.query(
      `INSERT INTO blog_schema.posts
         (title, slug, excerpt, content, content_json, author_id, category_id, cover_image,
          status, is_featured, allow_comments, scheduled_at, locale, seo_id, metadata)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::post_status,$10,$11,$12,$13,$14,$15::jsonb)
       RETURNING *`,
      [title, finalSlug, excerpt, content,
       content_json ? JSON.stringify(content_json) : null,
       req.userId, category_id || null, cover_image || null,
       status || 'draft', is_featured || false, allow_comments !== false,
       scheduled_at || null, locale || 'en', seo_id || null,
       JSON.stringify(metadata || {})]
    );
    const post = postRes.rows[0];

    // Assign tags
    if (tags && tags.length) {
      for (const tagId of tags) {
        await client.query(
          `INSERT INTO blog_schema.post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [post.id, tagId]
        );
      }
    }
    return postRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/posts/:id', authenticate, requirePermission('post.write'), asyncHandler(async (req, res) => {
  const { title, excerpt, content, content_json, status, is_featured, allow_comments,
          category_id, cover_image, scheduled_at, tags } = req.body;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE blog_schema.posts
          SET title         = COALESCE($2, title),
              excerpt       = COALESCE($3, excerpt),
              content       = COALESCE($4, content),
              content_json  = CASE WHEN $5::jsonb IS NOT NULL THEN $5::jsonb ELSE content_json END,
              status        = COALESCE($6::post_status, status),
              is_featured   = COALESCE($7, is_featured),
              allow_comments= COALESCE($8, allow_comments),
              category_id   = COALESCE($9, category_id),
              cover_image   = COALESCE($10, cover_image),
              scheduled_at  = COALESCE($11, scheduled_at)
        WHERE id=$1 AND deleted_at IS NULL`,
      [req.params.id, title, excerpt, content,
       content_json ? JSON.stringify(content_json) : null,
       status, is_featured, allow_comments, category_id, cover_image, scheduled_at]
    );

    if (tags !== undefined) {
      await client.query(`DELETE FROM blog_schema.post_tags WHERE post_id=$1`, [req.params.id]);
      for (const tagId of (tags || [])) {
        await client.query(
          `INSERT INTO blog_schema.post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [req.params.id, tagId]
        );
      }
    }
  });

  const { rows } = await query(`SELECT * FROM blog_schema.posts WHERE id=$1`, [req.params.id]);
  return success(res, rows[0]);
}));

router.delete('/posts/:id', authenticate, requirePermission('post.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE blog_schema.posts SET deleted_at=NOW(), status='archived' WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Like post
router.post('/posts/:id/like', optionalAuth, asyncHandler(async (req, res) => {
  await query(`UPDATE blog_schema.posts SET like_count=like_count+1 WHERE id=$1 AND status='published'`, [req.params.id]);
  return success(res, {}, 'Post liked');
}));

// Related posts
router.put('/posts/:id/related', authenticate, requirePermission('post.write'), asyncHandler(async (req, res) => {
  const { related_post_ids } = req.body;
  if (!Array.isArray(related_post_ids)) throw new AppError('related_post_ids array required');
  await query(`DELETE FROM blog_schema.post_relations WHERE post_id=$1`, [req.params.id]);
  for (let i = 0; i < related_post_ids.length; i++) {
    await query(
      `INSERT INTO blog_schema.post_relations (post_id, related_post_id, sort_order) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [req.params.id, related_post_ids[i], i]
    );
  }
  return success(res, {}, 'Related posts updated');
}));

// ── Resources ────────────────────────────────────────────────
router.get('/resources', paginate, asyncHandler(async (req, res) => {
  const { type, category_id, requires_email } = req.query;
  const conditions = ['is_published=TRUE'];
  const params     = [];
  let   idx        = 1;

  if (type) { conditions.push(`type=$${idx}`); params.push(type); idx++; }
  if (category_id) { conditions.push(`category_id=$${idx}`); params.push(category_id); idx++; }
  if (requires_email !== undefined) { conditions.push(`requires_email=$${idx}`); params.push(requires_email === 'true'); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM blog_schema.resources WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM blog_schema.resources WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/resources/:slugOrId', asyncHandler(async (req, res) => {
  const byId = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT * FROM blog_schema.resources WHERE ${byId ? 'id' : 'slug'}=$1 AND is_published=TRUE`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Resource not found', 404);
  return success(res, rows[0]);
}));

router.post('/resources', authenticate, requirePermission('post.write'), asyncHandler(async (req, res) => {
  const { type, title, slug, description, cover_image, file_id, webinar_url, requires_email, category_id } = req.body;
  if (!type || !title) throw new AppError('type and title required');
  const finalSlug = slug || generateSlug(title);
  const { rows } = await query(
    `INSERT INTO blog_schema.resources (type, title, slug, description, cover_image, file_id, webinar_url, requires_email, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [type, title, finalSlug, description, cover_image || null, file_id || null, webinar_url, requires_email !== false, category_id || null]
  );
  return created(res, rows[0]);
}));

router.post('/resources/:id/download', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM blog_schema.resources WHERE id=$1 AND is_published=TRUE`, [req.params.id]);
  if (!rows.length) throw new AppError('Resource not found', 404);
  await query(`UPDATE blog_schema.resources SET download_count=download_count+1 WHERE id=$1`, [req.params.id]);
  return success(res, { file_url: rows[0].file_id }, 'Download recorded');
}));

module.exports = router;
