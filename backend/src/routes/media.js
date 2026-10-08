// src/routes/media.js
const router   = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, upload, uploadLimiter } = require('../middleware/common');
const { success, created, noContent } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const crypto = require('crypto');
const path   = require('path');

// Storage handler (S3 or local)
const uploadToStorage = async (file, folder = 'uploads') => {
  const provider = process.env.STORAGE_PROVIDER || 'local';
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
    return { url: `${cdnBase}/${fileName}`, key: fileName };
  }

  // Local fallback — save to /uploads (for dev)
  const fs   = require('fs');
  const dir  = path.join(__dirname, '../../uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  const localPath = path.join(dir, path.basename(fileName));
  fs.writeFileSync(localPath, file.buffer);
  return { url: `/uploads/${fileName}`, key: fileName };
};

// GET /media
router.get('/', authenticate, paginate, asyncHandler(async (req, res) => {
  const { folder_id, type, search, uploaded_by } = req.query;
  const conditions = ['m.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (folder_id)   { conditions.push(`m.folder_id=$${idx}`); params.push(folder_id); idx++; }
  else if (folder_id === 'null') conditions.push(`m.folder_id IS NULL`);

  if (type)        { conditions.push(`m.media_type=$${idx}::media_type`); params.push(type); idx++; }
  if (uploaded_by) { conditions.push(`m.uploaded_by=$${idx}`); params.push(uploaded_by); idx++; }
  if (search) {
    conditions.push(`(m.file_name ILIKE $${idx} OR m.alt_text ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT m.id, m.file_name, m.original_name, m.cdn_url, m.media_type,
              m.file_size, m.mime_type, m.width, m.height, m.alt_text,
              m.caption, m.folder_id, m.created_at,
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

// POST /media/upload
router.post('/upload', authenticate, uploadLimiter, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('File required');

  const { folder_id, alt_text, caption, tags } = req.body;
  const { url, key } = await uploadToStorage(req.file, folder_id ? `folders/${folder_id}` : 'uploads');

  // Determine media type from mime
  let mediaType = 'other';
  if (req.file.mimetype.startsWith('image/'))       mediaType = 'image';
  else if (req.file.mimetype.startsWith('video/'))  mediaType = 'video';
  else if (req.file.mimetype.startsWith('audio/'))  mediaType = 'audio';
  else if (req.file.mimetype === 'application/pdf') mediaType = 'document';

  const { rows } = await query(
    `INSERT INTO cms_schema.media
       (file_name, original_name, file_path, cdn_url, storage_key, media_type,
        file_size, mime_type, alt_text, caption, tags, folder_id, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      path.basename(key),
      req.file.originalname,
      key,
      url,
      key,
      mediaType,
      req.file.size,
      req.file.mimetype,
      alt_text || null,
      caption  || null,
      tags     ? JSON.stringify(tags) : '[]',
      folder_id || null,
      req.userId,
    ]
  );
  return created(res, rows[0]);
}));

// POST /media/upload-multiple
router.post('/upload-multiple', authenticate, uploadLimiter, upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new AppError('Files required');
  const { folder_id } = req.body;

  const results = await Promise.all(req.files.map(async (file) => {
    const { url, key } = await uploadToStorage(file, 'uploads');
    let mediaType = 'other';
    if (file.mimetype.startsWith('image/'))      mediaType = 'image';
    else if (file.mimetype.startsWith('video/')) mediaType = 'video';
    else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
    else if (file.mimetype === 'application/pdf') mediaType = 'document';

    const { rows } = await query(
      `INSERT INTO cms_schema.media
         (file_name, original_name, file_path, cdn_url, storage_key, media_type, file_size, mime_type, folder_id, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [path.basename(key), file.originalname, key, url, key, mediaType, file.size, file.mimetype, folder_id || null, req.userId]
    );
    return rows[0];
  }));

  return created(res, results, `${results.length} file(s) uploaded`);
}));

// PATCH /media/:id
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { alt_text, caption, tags, folder_id } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.media
        SET alt_text  = COALESCE($2, alt_text),
            caption   = COALESCE($3, caption),
            tags      = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE tags END,
            folder_id = COALESCE($5, folder_id)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, alt_text, caption, tags ? JSON.stringify(tags) : null, folder_id]
  );
  if (!rows.length) throw new AppError('Media not found', 404);
  return success(res, rows[0]);
}));

// DELETE /media/:id
router.delete('/:id', authenticate, requirePermission('media.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE cms_schema.media SET deleted_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ── Folders ───────────────────────────────────────────────────
router.get('/folders', authenticate, asyncHandler(async (req, res) => {
  const { parent_id } = req.query;
  const { rows } = await query(
    `SELECT f.*, COUNT(m.id) AS file_count FROM cms_schema.media_folders f
      LEFT JOIN cms_schema.media m ON m.folder_id=f.id AND m.deleted_at IS NULL
     WHERE ($1::uuid IS NULL AND f.parent_id IS NULL) OR f.parent_id=$1
     GROUP BY f.id ORDER BY f.name`,
    [parent_id || null]
  );
  return success(res, rows);
}));

router.post('/folders', authenticate, asyncHandler(async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO cms_schema.media_folders (name, parent_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
    [name, parent_id || null, req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/folders/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, parent_id } = req.body;
  const { rows } = await query(
    `UPDATE cms_schema.media_folders SET name=COALESCE($2,name), parent_id=COALESCE($3,parent_id) WHERE id=$1 RETURNING *`,
    [req.params.id, name, parent_id]
  );
  if (!rows.length) throw new AppError('Folder not found', 404);
  return success(res, rows[0]);
}));

router.delete('/folders/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows: mediaRows } = await query(`SELECT COUNT(*) FROM cms_schema.media WHERE folder_id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (parseInt(mediaRows[0].count) > 0) throw new AppError('Folder is not empty. Move or delete files first.');
  await query(`DELETE FROM cms_schema.media_folders WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

module.exports = router;
