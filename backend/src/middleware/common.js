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

// ── Rate Limiting & Environment Security Controls ──────────────
/**
 * Determines whether authentication-specific rate limits and protections are active.
 *
 * Rules:
 * 1. Default to ENABLED: If NODE_ENV is unset, production, staging, or unrecognized,
 *    rate limiting is strictly enforced (secure default).
 * 2. In production or staging (NODE_ENV === 'production' || NODE_ENV === 'staging'):
 *    Authentication rate limiting CANNOT be bypassed under any circumstances, even if
 *    client-side headers attempt to spoof host/IP or AUTH_RATE_LIMIT_ENABLED is set to false.
 * 3. In local development (NODE_ENV === 'development'):
 *    Authentication rate limiting is bypassed by default to permit unrestricted developer testing.
 *    If a developer explicitly sets AUTH_RATE_LIMIT_ENABLED=true in their local environment,
 *    rate limiting activates locally for testing.
 * 4. In automated test runs (NODE_ENV === 'test'):
 *    Rate limiting is disabled by default so test suites execute with full velocity,
 *    unless AUTH_RATE_LIMIT_ENABLED=true is explicitly set for rate-limit tests.
 */
const isAuthRateLimitActive = () => {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'production' || env === 'staging') {
    return true;
  }
  if (env === 'development') {
    return process.env.AUTH_RATE_LIMIT_ENABLED === 'true';
  }
  if (env === 'test') {
    return process.env.AUTH_RATE_LIMIT_ENABLED === 'true';
  }
  return true;
};

const isGeneralRateLimitActive = () => {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'production' || env === 'staging') {
    return true;
  }
  if (env === 'development') {
    return process.env.RATE_LIMIT_ENABLED === 'true';
  }
  if (env === 'test') {
    return process.env.RATE_LIMIT_ENABLED === 'true';
  }
  return true;
};

const isAccountLockoutActive = () => {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'production' || env === 'staging') {
    return true;
  }
  if (env === 'development') {
    return process.env.AUTH_RATE_LIMIT_ENABLED === 'true' || process.env.AUTH_LOCKOUT_ENABLED === 'true';
  }
  if (env === 'test') {
    return process.env.AUTH_RATE_LIMIT_ENABLED === 'true' || process.env.AUTH_LOCKOUT_ENABLED === 'true';
  }
  return true;
};

const createRateLimiter = (windowMs, max, message, type = 'general') => {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { success: false, message: message || 'Too many requests, please try again later' },
    keyGenerator:    (req) => req.ip,
  });

  return (req, res, next) => {
    const active = type === 'auth' ? isAuthRateLimitActive() : isGeneralRateLimitActive();
    if (!active) {
      // In local development / test: completely bypass rate limit tracking
      return next();
    }
    return limiter(req, res, next);
  };
};

const authLimiter    = createRateLimiter(15 * 60 * 1000, 20,  'Too many login attempts', 'auth');
const apiLimiter     = createRateLimiter(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
                                          parseInt(process.env.RATE_LIMIT_MAX) || 100,
                                          'Too many requests, please try again later',
                                          'general');
const strictLimiter  = createRateLimiter(60 * 1000, 5, 'Rate limit exceeded', 'auth');
const uploadLimiter  = createRateLimiter(60 * 1000, 20, 'Upload rate limit exceeded', 'general');

// ── Sort/Filter helpers ───────────────────────────────────────
const SAFE_SORT_COLS = new Set(['created_at','updated_at','name','title','email','slug',
  'stage','status','priority','score','published_at','due_date','amount']);

const safeSort = (sortBy, sortDir, fallback = 'created_at') => {
  const col = SAFE_SORT_COLS.has(sortBy) ? sortBy : fallback;
  const dir = sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return { col, dir };
};

module.exports = {
  paginate,
  paginateResponse,
  upload,
  authLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter,
  isAuthRateLimitActive,
  isGeneralRateLimitActive,
  isAccountLockoutActive,
  createRateLimiter,
  safeSort,
};
