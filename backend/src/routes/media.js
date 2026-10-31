// src/routes/media.js
const router   = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, upload, uploadLimiter } = require('../middleware/common');
const { success, created, noContent, isUUID } = require('../utils/helpers');
const { recordAuditLog } = require('../utils/audit');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const crypto = require('crypto');
const path   = require('path');

// Storage handler (S3 or local)
const uploadToStorage = async (file, folder = 'uploads') => {
  const provider = process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local';
  const ext      = path.extname(file.originalname).toLowerCase();
  const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  if (provider === 's3') {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.AWS_S3_BUCKET,
      Key:         fileName,
      Body:        file.buffer,
      ContentType: file.mimetype,
    }));
    const cdnBase = process.env.CDN_BASE_URL || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    return { url: `${cdnBase}/${fileName}`, key: fileName, provider: 's3' };
  }

  // Local fallback — save to /uploads (for dev)
  const fs   = require('fs');
  const dir  = path.join(__dirname, '../../uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  const localPath = path.join(dir, path.basename(fileName));
  fs.writeFileSync(localPath, file.buffer);
  return { url: `/uploads/${fileName}`, key: fileName, provider: 'local' };
};

// GET /media
router.get('/', authenticate, paginate, asyncHandler(async (req, res) => {
  const { folder_id, type, search, uploaded_by } = req.query;
  const conditions = ['m.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (folder_id) {
    if (folder_id === 'null' || folder_id === 'root') {
      conditions.push(`m.folder_id IS NULL`);
    } else {
      conditions.push(`m.folder_id=$${idx}`);
      params.push(folder_id);
      idx++;
    }
  }

  if (type) {
    conditions.push(`m.media_type=$${idx}`);
    params.push(type);
    idx++;
  }
  if (uploaded_by) {
    conditions.push(`m.uploaded_by=$${idx}`);
    params.push(uploaded_by);
    idx++;
  }
  if (search) {
    conditions.push(`(m.file_name ILIKE $${idx} OR m.original_name ILIKE $${idx} OR m.alt_text ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT m.id, m.file_name, m.original_name, m.cdn_url, m.media_type,
              COALESCE(m.file_size, m.size_bytes) AS file_size,
              COALESCE(m.size_bytes, m.file_size) AS size_bytes,
              m.mime_type, m.extension, m.width, m.height, m.alt_text,
              m.caption, m.tags, m.folder_id, m.created_at,
              u.display_name AS uploaded_by_name
         FROM cms_schema.media m
         LEFT JOIN auth_schema.users u ON m.uploaded_by=u.id
        WHERE ${where}
        ORDER BY m.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM cms_schema.media m WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// ── Folders (Declared BEFORE /:id to prevent route shadowing) ─────
router.get('/folders', authenticate, asyncHandler(async (req, res) => {
  const { parent_id } = req.query;
  const validParent = parent_id && isUUID(parent_id) ? parent_id : null;

  const { rows } = await query(
    `SELECT f.*, COUNT(m.id) AS file_count
       FROM cms_schema.media_folders f
       LEFT JOIN cms_schema.media m ON m.folder_id=f.id AND m.deleted_at IS NULL
      WHERE ($1::uuid IS NULL AND f.parent_id IS NULL) OR f.parent_id=$1
      GROUP BY f.id ORDER BY f.name`,
    [validParent]
  );
  return success(res, rows);
}));

router.post('/folders', authenticate, asyncHandler(async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name || !name.trim()) throw new AppError('name required');
  const validParent = parent_id && isUUID(parent_id) ? parent_id : null;

  const { rows } = await query(
    `INSERT INTO cms_schema.media_folders (name, parent_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
    [name.trim(), validParent, req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/folders/:id', authenticate, asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid folder ID', 400);
  const { name, parent_id } = req.body;
  const validParent = parent_id && isUUID(parent_id) ? parent_id : null;

  const { rows } = await query(
    `UPDATE cms_schema.media_folders
        SET name=COALESCE($2,name), parent_id=COALESCE($3,parent_id), updated_at=NOW()
      WHERE id=$1 RETURNING *`,
    [req.params.id, name ? name.trim() : null, validParent]
  );
  if (!rows.length) throw new AppError('Folder not found', 404);
  return success(res, rows[0]);
}));

router.delete('/folders/:id', authenticate, asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid folder ID', 400);
  const { rows: mediaRows } = await query(
    `SELECT COUNT(*) FROM cms_schema.media WHERE folder_id=$1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  if (parseInt(mediaRows[0].count) > 0) {
    throw new AppError('Folder is not empty. Move or delete contained files first.', 409);
  }
  await query(`DELETE FROM cms_schema.media_folders WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// GET /media/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid media ID', 400);
  const { rows } = await query(
    `SELECT m.id, m.file_name, m.original_name, m.cdn_url, m.media_type,
            COALESCE(m.file_size, m.size_bytes) AS file_size,
            m.mime_type, m.extension, m.width, m.height, m.alt_text,
            m.caption, m.tags, m.folder_id, m.created_at,
            u.display_name AS uploaded_by_name
       FROM cms_schema.media m
       LEFT JOIN auth_schema.users u ON m.uploaded_by=u.id
      WHERE m.id=$1 AND m.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Media not found', 404);
  return success(res, rows[0]);
}));

// POST /media/upload
router.post('/upload', authenticate, uploadLimiter, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('File required');

  const { folder_id, alt_text, caption, tags } = req.body;
  const targetFolder = (folder_id && isUUID(folder_id)) ? `folders/${folder_id}` : 'uploads';
  const { url, key, provider } = await uploadToStorage(req.file, targetFolder);

  // Determine media type from mime
  let mediaType = 'other';
  if (req.file.mimetype.startsWith('image/'))       mediaType = 'image';
  else if (req.file.mimetype.startsWith('video/'))  mediaType = 'video';
  else if (req.file.mimetype.startsWith('audio/'))  mediaType = 'audio';
  else if (req.file.mimetype === 'application/pdf') mediaType = 'document';

  const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'bin';
  const tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.trim() ? [tags.trim()] : []);

  const { rows } = await query(
    `INSERT INTO cms_schema.media
       (file_name, original_name, file_path, cdn_url, storage_key, storage_provider, media_type,
        file_size, size_bytes, mime_type, extension, alt_text, caption, tags, folder_id, uploaded_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::storage_provider,$7,$8,$8,$9,$10,$11,$12,$13::text[],$14,$15,'{}'::jsonb)
     RETURNING *`,
    [
      path.basename(key),
      req.file.originalname,
      key,
      url,
      key,
      provider,
      mediaType,
      req.file.size,
      req.file.mimetype,
      ext,
      alt_text || null,
      caption  || null,
      tagsArray,
      (folder_id && isUUID(folder_id)) ? folder_id : null,
      req.userId,
    ]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'UPLOAD_MEDIA',
    resourceType: 'media',
    resourceId: rows[0].id,
    newData: { file_name: rows[0].file_name, size: req.file.size },
    req
  });

  return created(res, rows[0]);
}));

// POST /media/upload-multiple
router.post('/upload-multiple', authenticate, uploadLimiter, upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new AppError('Files required');
  const { folder_id } = req.body;
  const targetFolder = (folder_id && isUUID(folder_id)) ? `folders/${folder_id}` : 'uploads';

  const results = await Promise.all(req.files.map(async (file) => {
    const { url, key, provider } = await uploadToStorage(file, targetFolder);
    let mediaType = 'other';
    if (file.mimetype.startsWith('image/'))      mediaType = 'image';
    else if (file.mimetype.startsWith('video/')) mediaType = 'video';
    else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
    else if (file.mimetype === 'application/pdf') mediaType = 'document';

    const ext = path.extname(file.originalname).replace('.', '').toLowerCase() || 'bin';

    const { rows } = await query(
      `INSERT INTO cms_schema.media
         (file_name, original_name, file_path, cdn_url, storage_key, storage_provider, media_type,
          file_size, size_bytes, mime_type, extension, folder_id, uploaded_by, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6::storage_provider,$7,$8,$8,$9,$10,$11,$12,'{}'::text[],'{}'::jsonb)
       RETURNING *`,
      [
        path.basename(key),
        file.originalname,
        key,
        url,
        key,
        provider,
        mediaType,
        file.size,
        file.mimetype,
        ext,
        (folder_id && isUUID(folder_id)) ? folder_id : null,
        req.userId
      ]
    );
    return rows[0];
  }));

  return created(res, results, `${results.length} file(s) uploaded`);
}));

// PATCH /media/:id
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid media ID', 400);
  const { alt_text, caption, tags, folder_id, original_name } = req.body;

  const tagsParam = tags !== undefined
    ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.trim() ? [tags.trim()] : []))
    : null;

  const { rows } = await query(
    `UPDATE cms_schema.media
        SET alt_text      = COALESCE($2, alt_text),
            caption       = COALESCE($3, caption),
            tags          = CASE WHEN $4::text[] IS NOT NULL THEN $4::text[] ELSE tags END,
            folder_id     = COALESCE($5, folder_id),
            original_name = COALESCE($6, original_name),
            updated_at    = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, alt_text, caption, tagsParam, (folder_id && isUUID(folder_id)) ? folder_id : null, original_name ? original_name.trim() : null]
  );
  if (!rows.length) throw new AppError('Media not found', 404);
  return success(res, rows[0]);
}));

// DELETE /media/:id
router.delete('/:id', authenticate, requirePermission('media.delete', 'settings.manage'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid media ID', 400);
  const targetRes = await query(`SELECT id, file_name FROM cms_schema.media WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!targetRes.rows.length) throw new AppError('Media not found', 404);

  await query(`UPDATE cms_schema.media SET deleted_at=NOW() WHERE id=$1`, [req.params.id]);

  await recordAuditLog({
    actorId: req.userId,
    action: 'DELETE_MEDIA',
    resourceType: 'media',
    resourceId: req.params.id,
    oldData: targetRes.rows[0],
    req
  });

  return noContent(res);
}));

module.exports = router;
