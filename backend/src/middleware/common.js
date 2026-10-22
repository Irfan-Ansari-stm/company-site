// src/middleware/common.js
const multer      = require('multer');
const path        = require('path');
const crypto      = require('crypto');
const rateLimit   = require('express-rate-limit');

// ── Pagination helper ────────────────────────────────────────
const paginate = (req, res, next) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  req.pagination = { page, limit, offset };
  next();
};

const paginateResponse = (data, total, pagination) => {
  const totalNum = parseInt(total, 10) || 0;
  const totalPages = Math.ceil(totalNum / pagination.limit) || 1;
  return {
    success: true,
    data,
    total: totalNum,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    pagination: {
      page:       pagination.page,
      limit:      pagination.limit,
      total:      totalNum,
      totalPages,
      hasNext:    pagination.page * pagination.limit < totalNum,
      hasPrev:    pagination.page > 1,
    },
  };
};

// ── File upload ──────────────────────────────────────────────
const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain','text/csv',
  'application/zip','application/x-zip-compressed',
]);

const memStorage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage:  memStorage,
  limits:   { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
  fileFilter,
});

// ── Rate limiters ─────────────────────────────────────────────
const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { success: false, message: message || 'Too many requests, please try again later' },
    keyGenerator:    (req) => req.ip,
  });

const authLimiter    = createRateLimiter(15 * 60 * 1000, 20,  'Too many login attempts');
const apiLimiter     = createRateLimiter(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
                                          parseInt(process.env.RATE_LIMIT_MAX) || 100);
const strictLimiter  = createRateLimiter(60 * 1000, 5, 'Rate limit exceeded');
const uploadLimiter  = createRateLimiter(60 * 1000, 20, 'Upload rate limit exceeded');

// ── Sort/Filter helpers ───────────────────────────────────────
const SAFE_SORT_COLS = new Set(['created_at','updated_at','name','title','email','slug',
  'stage','status','priority','score','published_at','due_date','amount']);

const safeSort = (sortBy, sortDir, fallback = 'created_at') => {
  const col = SAFE_SORT_COLS.has(sortBy) ? sortBy : fallback;
  const dir = sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return { col, dir };
};

module.exports = { paginate, paginateResponse, upload, authLimiter, apiLimiter, strictLimiter, uploadLimiter, safeSort };
