// src/routes/users.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission, requireRole } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { hashPassword, generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// All user routes require authentication
router.use(authenticate);

// ── GET /users ────────────────────────────────────────────────
router.get('/', requirePermission('user.read'), paginate, asyncHandler(async (req, res) => {
  const { page, limit, offset } = req.pagination;
  const { search, role, is_active } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir);

  const conditions = ['u.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (search) {
    conditions.push(`(u.email ILIKE $${idx} OR u.display_name ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  if (role) { conditions.push(`u.role = $${idx}`); params.push(role); idx++; }
  if (is_active !== undefined) { conditions.push(`u.is_active = $${idx}`); params.push(is_active === 'true'); idx++; }

  const where = conditions.join(' AND ');

  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.is_verified,
              u.phone, u.avatar_url, u.last_login_at, u.created_at
         FROM auth_schema.users u WHERE ${where}
        ORDER BY u.${col} ${dir} LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM auth_schema.users u WHERE ${where}`, params),
  ]);

  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// ── POST /users ───────────────────────────────────────────────
router.post('/', requirePermission('user.create'), asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone, role = 'client', avatar_url } = req.body;
  if (!email || !password || !first_name || !last_name)
    throw new AppError('email, password, first_name, last_name required');

  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO auth_schema.users (email, password_hash, first_name, last_name, phone, role, avatar_url, is_verified, public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)
     RETURNING id, email, display_name, role, is_active, created_at`,
    [email, passwordHash, first_name, last_name, phone, role, avatar_url, generatePublicId()]
  );
  return created(res, rows[0]);
}));

// ── GET /users/:id ────────────────────────────────────────────
router.get('/:id', requirePermission('user.read'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid user ID', 400);
  const { rows } = await query(
    `SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name,
            u.phone, u.avatar_url, u.bio, u.role, u.is_active, u.is_verified,
            u.two_factor_enabled, u.last_login_at, u.timezone, u.locale,
            u.preferences, u.metadata, u.created_at, u.updated_at,
            ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles,
            auth_schema.get_user_permissions(u.id) AS permissions
       FROM auth_schema.users u
       LEFT JOIN auth_schema.user_roles ur ON u.id = ur.user_id
       LEFT JOIN auth_schema.roles r ON ur.role_id = r.id
      WHERE u.id=$1 AND u.deleted_at IS NULL
      GROUP BY u.id`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return success(res, rows[0]);
}));

// ── PATCH /users/:id ──────────────────────────────────────────
router.patch('/:id', requirePermission('user.edit'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid user ID', 400);
  const { first_name, last_name, phone, bio, role, is_active, timezone, locale, avatar_url, must_change_password } = req.body;
  const { rows } = await query(
    `UPDATE auth_schema.users
        SET first_name          = COALESCE($2, first_name),
            last_name           = COALESCE($3, last_name),
            phone               = COALESCE($4, phone),
            bio                 = COALESCE($5, bio),
            role                = COALESCE($6::user_role, role),
            is_active           = COALESCE($7, is_active),
            timezone            = COALESCE($8, timezone),
            locale              = COALESCE($9, locale),
            avatar_url          = COALESCE($10, avatar_url),
            must_change_password= COALESCE($11, must_change_password)
      WHERE id=$1 AND deleted_at IS NULL
      RETURNING id, email, display_name, role, is_active, updated_at`,
    [req.params.id, first_name, last_name, phone, bio, role, is_active, timezone, locale, avatar_url, must_change_password]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return success(res, rows[0]);
}));

// ── DELETE /users/:id (soft delete) ──────────────────────────
router.delete('/:id', requirePermission('user.delete'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid user ID', 400);
  if (req.params.id === req.userId) throw new AppError('Cannot delete your own account');
  await query(
    `UPDATE auth_schema.users SET deleted_at=NOW(), is_active=FALSE WHERE id=$1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  return noContent(res);
}));

// ── POST /users/:id/reset-password ────────────────────────────
router.post('/:id/reset-password', requirePermission('user.edit'), asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) throw new AppError('Password must be at least 8 characters');
  const hash = await hashPassword(password);
  await query(
    `UPDATE auth_schema.users SET password_hash=$1, must_change_password=TRUE, password_changed_at=NOW() WHERE id=$2`,
    [hash, req.params.id]
  );
  return success(res, {}, 'Password reset');
}));

// ── GET /users/:id/activity ──────────────────────────────────
router.get('/:id/activity', requirePermission('user.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, action, resource_type, resource_id, ip_address, created_at
       FROM system_schema.audit_logs WHERE actor_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.params.id]
  );
  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  ROLES
// ════════════════════════════════════════════════════════════
const rolesRouter = require('express').Router();

rolesRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM auth_schema.roles ORDER BY name`);
  return success(res, rows);
}));

rolesRouter.post('/', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');
  const { rows } = await query(
    `INSERT INTO auth_schema.roles (name, slug, description) VALUES ($1,$2,$3) RETURNING *`,
    [name, slug, description]
  );
  return created(res, rows[0]);
}));

rolesRouter.patch('/:id', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await query(
    `UPDATE auth_schema.roles SET name=COALESCE($2,name), description=COALESCE($3,description)
      WHERE id=$1 AND is_system=FALSE RETURNING *`,
    [req.params.id, name, description]
  );
  if (!rows.length) throw new AppError('Role not found or is a system role', 404);
  return success(res, rows[0]);
}));

rolesRouter.delete('/:id', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM auth_schema.roles WHERE id=$1 AND is_system=FALSE`,
    [req.params.id]
  );
  if (!rowCount) throw new AppError('Role not found or is a system role', 404);
  return noContent(res);
}));

// Role permissions
rolesRouter.get('/:id/permissions', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.* FROM auth_schema.permissions p
      JOIN auth_schema.role_permissions rp ON p.id=rp.permission_id
     WHERE rp.role_id=$1 ORDER BY p.module, p.name`,
    [req.params.id]
  );
  return success(res, rows);
}));

rolesRouter.put('/:id/permissions', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { permission_ids } = req.body;
  if (!Array.isArray(permission_ids)) throw new AppError('permission_ids array required');
  await query(`DELETE FROM auth_schema.role_permissions WHERE role_id=$1`, [req.params.id]);
  if (permission_ids.length) {
    const vals = permission_ids.map((pid, i) => `($1,$${i+2})`).join(',');
    await query(
      `INSERT INTO auth_schema.role_permissions (role_id, permission_id, granted_by) VALUES ${vals}`,
      [req.params.id, ...permission_ids]
    );
  }
  return success(res, {}, 'Permissions updated');
}));

// Assign role to user
rolesRouter.post('/:id/users', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { user_id, expires_at } = req.body;
  if (!user_id) throw new AppError('user_id required');
  await query(
    `INSERT INTO auth_schema.user_roles (user_id, role_id, granted_by, expires_at)
     VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
    [user_id, req.params.id, req.userId, expires_at || null]
  );
  return success(res, {}, 'Role assigned');
}));

rolesRouter.delete('/:id/users/:userId', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  await query(
    `DELETE FROM auth_schema.user_roles WHERE role_id=$1 AND user_id=$2`,
    [req.params.id, req.params.userId]
  );
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  PERMISSIONS
// ════════════════════════════════════════════════════════════
const permissionsRouter = require('express').Router();

permissionsRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const { module } = req.query;
  const { rows } = await query(
    `SELECT * FROM auth_schema.permissions ${module ? 'WHERE module=$1' : ''} ORDER BY module, name`,
    module ? [module] : []
  );
  return success(res, rows);
}));

permissionsRouter.post('/', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, slug, module, description } = req.body;
  if (!name || !slug || !module) throw new AppError('name, slug, module required');
  const { rows } = await query(
    `INSERT INTO auth_schema.permissions (name, slug, module, description) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, slug, module, description]
  );
  return created(res, rows[0]);
}));

module.exports = { router, rolesRouter, permissionsRouter };
