// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { isUUID } = require('../utils/helpers');

// ════════════════════════════════════════════════════════════
//  CENTRALIZED AUTHORIZATION SERVICE
// ════════════════════════════════════════════════════════════

const getUserRoles = async (userId) => {
  const { rows } = await query(
    `SELECT r.id, r.name, r.slug, r.is_active, r.is_system
       FROM auth_schema.user_roles ur
       JOIN auth_schema.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND r.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
    [userId]
  );
  return rows;
};

const getUserPermissions = async (userId) => {
  const { rows } = await query(
    `SELECT auth_schema.get_user_permissions($1) AS permissions`,
    [userId]
  );
  return rows[0]?.permissions || [];
};

const hasPermission = async (user, permissionKey) => {
  if (!user || !user.id) return false;
  if (user.role === 'super_admin') return true;
  const { rows } = await query(
    `SELECT auth_schema.user_has_permission($1, $2) AS has_perm`,
    [user.id, permissionKey]
  );
  return !!rows[0]?.has_perm;
};

const hasAnyPermission = async (user, permissionKeys = []) => {
  if (!user || !user.id) return false;
  if (user.role === 'super_admin') return true;
  if (!permissionKeys.length) return false;

  for (const perm of permissionKeys) {
    const granted = await hasPermission(user, perm);
    if (granted) return true;
  }
  return false;
};

const hasAllPermissions = async (user, permissionKeys = []) => {
  if (!user || !user.id) return false;
  if (user.role === 'super_admin') return true;
  if (!permissionKeys.length) return true;

  for (const perm of permissionKeys) {
    const granted = await hasPermission(user, perm);
    if (!granted) return false;
  }
  return true;
};

const canAccessModule = async (user, moduleKey) => {
  if (!user || !user.id) return false;
  if (user.role === 'super_admin') return true;

  // Check if module is enabled
  const { rows } = await query(
    `SELECT key, is_client_enabled FROM auth_schema.dashboard_modules WHERE key = $1`,
    [moduleKey]
  );
  if (!rows.length) return false;

  if (user.role === 'client') {
    return !!rows[0].is_client_enabled;
  }

  // For non-client custom roles, check if they have any permission in that module
  const perms = await getUserPermissions(user.id);
  return perms.some(p => p.startsWith(`${moduleKey}.`) || p.split('.')[0] === moduleKey);
};

const canPerformAction = async (user, resource, action) => {
  const permKey = `${resource}.${action}`;
  return hasPermission(user, permKey);
};

const canAccessResource = (user, resource, ownerIdField = 'user_id') => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (resource && resource[ownerIdField] === user.id) return true;
  return false;
};

// ════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════════════════════════

// Verify JWT access token & load fresh identity and permissions
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (!decoded.userId || !isUUID(decoded.userId)) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Load fresh user from DB
    const { rows } = await query(
      `SELECT u.id, u.email, u.display_name, u.first_name, u.last_name, u.role,
              u.is_active, u.is_verified, u.two_factor_enabled, u.avatar_url,
              auth_schema.get_user_permissions(u.id) AS permissions
         FROM auth_schema.users u
        WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    const user = rows[0];
    user.isSuperAdmin = (user.role === 'super_admin');
    user.permissions = user.permissions || [];

    req.user   = user;
    req.userId = user.id;
    req.userIp = req.ip || req.connection?.remoteAddress;
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
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    }
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!decoded.userId || !isUUID(decoded.userId)) return next();

    const { rows } = await query(
      `SELECT id, email, display_name, role, is_active,
              auth_schema.get_user_permissions(id) AS permissions
         FROM auth_schema.users
        WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );

    if (rows.length && rows[0].is_active) {
      const user = rows[0];
      user.isSuperAdmin = (user.role === 'super_admin');
      req.user   = user;
      req.userId = user.id;
    }
  } catch (_) {}
  next();
};

// Permission check middleware factory
const requirePermission = (...permissions) => async (req, res, next) => {
  if (!req.userId || !req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Sole Super admin bypasses all permission checks
  if (req.user.role === 'super_admin') return next();

  // If multiple permissions passed, user must have AT LEAST ONE of them
  const hasAccess = await hasAnyPermission(req.user, permissions);
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient permissions',
      required: permissions,
    });
  }

  next();
};

// Strict Super Admin only guard
const requireSuperAdmin = (req, res, next) => {
  if (!req.userId || !req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Super Admin privileges required',
    });
  }
  next();
};

// Role check middleware factory
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (req.user.role === 'super_admin') return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' });
  }
  next();
};

// Module access check middleware
const requireModuleAccess = (moduleKey) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (req.user.role === 'super_admin') return next();

  const allowed = await canAccessModule(req.user, moduleKey);
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access to module '${moduleKey}' is disabled`,
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePermission,
  requireSuperAdmin,
  requireRole,
  requireModuleAccess,
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessModule,
  canPerformAction,
  canAccessResource,
};
