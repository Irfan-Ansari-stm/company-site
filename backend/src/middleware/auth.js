// src/middleware/auth.js
const jwt     = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT access token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Load fresh user from DB (ensure not deleted/deactivated)
    const { rows } = await query(
      `SELECT id, email, role, is_active, is_verified, two_factor_enabled
         FROM auth_schema.users
        WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user   = rows[0];
    req.userId = rows[0].id;
    req.userIp = req.ip || req.connection.remoteAddress;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  }
};

// Optional auth — sets req.user if token present, doesn't fail
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const { rows } = await query(
      `SELECT id, email, role, is_active FROM auth_schema.users WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );

    if (rows.length && rows[0].is_active) {
      req.user   = rows[0];
      req.userId = rows[0].id;
    }
  } catch (_) {}
  next();
};

// Permission check middleware factory
const requirePermission = (...permissions) => async (req, res, next) => {
  if (!req.userId) return res.status(401).json({ success: false, message: 'Authentication required' });

  // Super admin bypasses all permission checks
  if (req.user.role === 'super_admin') return next();

  const { rows } = await query(
    `SELECT auth_schema.user_has_permission($1, $2) AS has_perm`,
    [req.userId, permissions[0]]
  );

  // If multiple permissions, check if user has ANY of them
  if (permissions.length > 1) {
    const checks = await Promise.all(
      permissions.map(p =>
        query(`SELECT auth_schema.user_has_permission($1, $2) AS has_perm`, [req.userId, p])
      )
    );
    const hasAny = checks.some(r => r.rows[0]?.has_perm);
    if (!hasAny) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    return next();
  }

  if (!rows[0]?.has_perm) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

// Role check middleware factory
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (req.user.role === 'super_admin') return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient role' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requirePermission, requireRole };
