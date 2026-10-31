// src/routes/users.js
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission, requireSuperAdmin } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { recordAuditLog } = require('../utils/audit');
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
      `SELECT u.id, u.email, u.display_name, u.first_name, u.last_name, u.role, u.is_active, u.is_verified,
              u.phone, u.avatar_url, u.last_login_at, u.created_at,
              (u.role = 'super_admin') AS "isSuperAdmin",
              auth_schema.get_user_permissions(u.id) AS permissions,
              ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
         FROM auth_schema.users u
         LEFT JOIN auth_schema.user_roles ur ON u.id = ur.user_id
         LEFT JOIN auth_schema.roles r ON ur.role_id = r.id
        WHERE ${where}
        GROUP BY u.id
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

  // Only the designated Super Admin can create another super_admin
  if (role === 'super_admin' && req.user.role !== 'super_admin') {
    throw new AppError('Only the Super Admin can create accounts with the Super Admin role', 403);
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO auth_schema.users (email, password_hash, first_name, last_name, phone, role, avatar_url, is_verified, public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)
     RETURNING id, email, display_name, first_name, last_name, role, is_active, created_at`,
    [email, passwordHash, first_name, last_name, phone, role, avatar_url, generatePublicId()]
  );

  const newUser = rows[0];

  await recordAuditLog({
    actorId: req.userId,
    action: 'CREATE',
    resourceType: 'users',
    resourceId: newUser.id,
    newData: { email: newUser.email, role: newUser.role },
    req
  });

  return created(res, newUser);
}));

// ── GET /users/:id ────────────────────────────────────────────
router.get('/:id', requirePermission('user.read'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid user ID', 400);
  const { rows } = await query(
    `SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name,
            u.phone, u.avatar_url, u.bio, u.role, u.is_active, u.is_verified,
            u.two_factor_enabled, u.last_login_at, u.timezone, u.locale,
            u.preferences, u.metadata, u.created_at, u.updated_at,
            (u.role = 'super_admin') AS "isSuperAdmin",
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

  const targetRes = await query(`SELECT id, email, role, is_active FROM auth_schema.users WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!targetRes.rows.length) throw new AppError('User not found', 404);
  const target = targetRes.rows[0];

  // Restrict promotion to super_admin
  if (role === 'super_admin' && req.user.role !== 'super_admin') {
    throw new AppError('Security Policy: Only the Super Admin can promote accounts to Super Admin', 403);
  }

  // Prevent demoting or deactivating sole super_admin
  if (target.role === 'super_admin' && ( (role && role !== 'super_admin') || is_active === false )) {
    const countRes = await query(`SELECT COUNT(*) FROM auth_schema.users WHERE role='super_admin' AND is_active=TRUE AND deleted_at IS NULL`);
    if (parseInt(countRes.rows[0].count) <= 1) {
      throw new AppError('Security Policy Violation: Cannot delete, deactivate, or demote the sole Super Admin account', 403);
    }
  }

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
            must_change_password= COALESCE($11, must_change_password),
            updated_at          = NOW()
      WHERE id=$1 AND deleted_at IS NULL
      RETURNING id, email, display_name, first_name, last_name, role, is_active, updated_at`,
    [req.params.id, first_name, last_name, phone, bio, role, is_active, timezone, locale, avatar_url, must_change_password]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'UPDATE',
    resourceType: 'users',
    resourceId: req.params.id,
    oldData: target,
    newData: rows[0],
    req
  });

  return success(res, rows[0]);
}));

// ── DELETE /users/:id (soft delete) ──────────────────────────
router.delete('/:id', requirePermission('user.delete'), asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new AppError('Invalid user ID', 400);
  if (req.params.id === req.userId) throw new AppError('Cannot delete your own account');

  const targetRes = await query(`SELECT id, email, role FROM auth_schema.users WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!targetRes.rows.length) throw new AppError('User not found', 404);
  if (targetRes.rows[0].role === 'super_admin') {
    throw new AppError('Security Policy Violation: The sole Super Admin account cannot be deleted', 403);
  }

  await query(
    `UPDATE auth_schema.users SET deleted_at=NOW(), is_active=FALSE WHERE id=$1 AND deleted_at IS NULL`,
    [req.params.id]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'DELETE',
    resourceType: 'users',
    resourceId: req.params.id,
    oldData: targetRes.rows[0],
    req
  });

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
  await recordAuditLog({
    actorId: req.userId,
    action: 'RESET_PASSWORD',
    resourceType: 'users',
    resourceId: req.params.id,
    req
  });
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
//  ROLES ROUTER
// ════════════════════════════════════════════════════════════
const rolesRouter = require('express').Router();

// List all roles with counts
rolesRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.name, r.slug, r.description, r.is_system, r.is_active, r.created_at, r.updated_at,
            COUNT(DISTINCT ur.user_id) AS user_count,
            COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM auth_schema.roles r
       LEFT JOIN auth_schema.user_roles ur ON r.id = ur.role_id
       LEFT JOIN auth_schema.role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name ASC`
  );
  return success(res, rows);
}));

// Get single role with permissions & assigned users
rolesRouter.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.name, r.slug, r.description, r.is_system, r.is_active, r.created_at, r.updated_at,
            COUNT(DISTINCT ur.user_id) AS user_count,
            COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM auth_schema.roles r
       LEFT JOIN auth_schema.user_roles ur ON r.id = ur.role_id
       LEFT JOIN auth_schema.role_permissions rp ON r.id = rp.role_id
      WHERE r.id = $1
      GROUP BY r.id`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Role not found', 404);

  const [permsRes, usersRes] = await Promise.all([
    query(
      `SELECT p.* FROM auth_schema.permissions p
         JOIN auth_schema.role_permissions rp ON p.id=rp.permission_id
        WHERE rp.role_id=$1 ORDER BY p.module, p.name`,
      [req.params.id]
    ),
    query(
      `SELECT u.id, u.display_name, u.email, u.avatar_url, ur.granted_at
         FROM auth_schema.users u
         JOIN auth_schema.user_roles ur ON u.id=ur.user_id
        WHERE ur.role_id=$1 AND u.deleted_at IS NULL
        LIMIT 20`,
      [req.params.id]
    ),
  ]);

  return success(res, {
    ...rows[0],
    permissions: permsRes.rows,
    users: usersRes.rows,
  });
}));

// Create custom role
rolesRouter.post('/', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, is_active = true } = req.body;
  if (!name || !slug) throw new AppError('name and slug required');

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  if (['super_admin', 'client'].includes(cleanSlug)) {
    throw new AppError('Cannot create roles using reserved system slugs', 400);
  }

  const { rows } = await query(
    `INSERT INTO auth_schema.roles (name, slug, description, is_active, is_system)
     VALUES ($1,$2,$3,$4,FALSE) RETURNING *`,
    [name.trim(), cleanSlug, description, is_active]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'CREATE',
    resourceType: 'roles',
    resourceId: rows[0].id,
    newData: rows[0],
    req
  });

  return created(res, rows[0]);
}));

// Edit role
rolesRouter.patch('/:id', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, description, is_active } = req.body;
  const targetRes = await query(`SELECT * FROM auth_schema.roles WHERE id=$1`, [req.params.id]);
  if (!targetRes.rows.length) throw new AppError('Role not found', 404);
  const target = targetRes.rows[0];

  if (target.slug === 'super_admin' && is_active === false) {
    throw new AppError('Security Policy: Cannot deactivate the Super Admin role', 403);
  }
  if (target.slug === 'client' && is_active === false) {
    throw new AppError('Security Policy: Cannot deactivate the Client role', 403);
  }

  const { rows } = await query(
    `UPDATE auth_schema.roles
        SET name        = COALESCE($2, name),
            description = COALESCE($3, description),
            is_active   = COALESCE($4, is_active),
            updated_at  = NOW()
      WHERE id = $1
      RETURNING *`,
    [req.params.id, name, description, is_active]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'UPDATE',
    resourceType: 'roles',
    resourceId: req.params.id,
    oldData: target,
    newData: rows[0],
    req
  });

  return success(res, rows[0]);
}));

// Delete role
rolesRouter.delete('/:id', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const targetRes = await query(`SELECT * FROM auth_schema.roles WHERE id=$1`, [req.params.id]);
  if (!targetRes.rows.length) throw new AppError('Role not found', 404);
  const target = targetRes.rows[0];

  if (target.is_system || ['super_admin', 'client'].includes(target.slug)) {
    throw new AppError('Security Policy: Protected system roles cannot be deleted', 403);
  }

  // Check if assigned to active users
  const assigned = await query(`SELECT COUNT(*) FROM auth_schema.user_roles WHERE role_id=$1`, [req.params.id]);
  if (parseInt(assigned.rows[0].count) > 0) {
    throw new AppError(`Cannot delete role '${target.name}': ${assigned.rows[0].count} users are currently assigned. Reassign them first.`, 409);
  }

  await query(`DELETE FROM auth_schema.roles WHERE id=$1`, [req.params.id]);

  await recordAuditLog({
    actorId: req.userId,
    action: 'DELETE',
    resourceType: 'roles',
    resourceId: req.params.id,
    oldData: target,
    req
  });

  return noContent(res);
}));

// Get role permissions
rolesRouter.get('/:id/permissions', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.* FROM auth_schema.permissions p
       JOIN auth_schema.role_permissions rp ON p.id=rp.permission_id
      WHERE rp.role_id=$1 ORDER BY p.module, p.name`,
    [req.params.id]
  );
  return success(res, rows);
}));

// Update role permissions (full replacement)
rolesRouter.put('/:id/permissions', authenticate, requirePermission('role.permissions.manage', 'role.manage'), asyncHandler(async (req, res) => {
  const { permission_ids } = req.body;
  if (!Array.isArray(permission_ids)) throw new AppError('permission_ids array required');

  const targetRole = await query(`SELECT * FROM auth_schema.roles WHERE id=$1`, [req.params.id]);
  if (!targetRole.rows.length) throw new AppError('Role not found', 404);

  await query(`DELETE FROM auth_schema.role_permissions WHERE role_id=$1`, [req.params.id]);
  if (permission_ids.length) {
    const vals = permission_ids.map((pid, i) => `($1,$${i+2},$${permission_ids.length+2})`).join(',');
    await query(
      `INSERT INTO auth_schema.role_permissions (role_id, permission_id, granted_by) VALUES ${vals}`,
      [req.params.id, ...permission_ids, req.userId]
    );
  }

  await recordAuditLog({
    actorId: req.userId,
    action: 'UPDATE_PERMISSIONS',
    resourceType: 'roles',
    resourceId: req.params.id,
    metadata: {
      role_slug: targetRole.rows[0].slug,
      permissions_count: permission_ids.length
    },
    req
  });

  return success(res, {}, 'Role permissions updated');
}));

// Assign role to user
rolesRouter.post('/:id/users', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { user_id, expires_at } = req.body;
  if (!user_id) throw new AppError('user_id required');

  const roleRes = await query(`SELECT * FROM auth_schema.roles WHERE id=$1`, [req.params.id]);
  if (!roleRes.rows.length) throw new AppError('Role not found', 404);
  const targetRole = roleRes.rows[0];

  // Only Super Admin can assign super_admin role
  if (targetRole.slug === 'super_admin' && req.user.role !== 'super_admin') {
    throw new AppError('Only the Super Admin can assign the Super Admin role', 403);
  }

  await query(
    `INSERT INTO auth_schema.user_roles (user_id, role_id, granted_by, expires_at)
     VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, role_id) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
    [user_id, req.params.id, req.userId, expires_at || null]
  );

  // Also update primary user.role
  await query(
    `UPDATE auth_schema.users SET role = $1::user_role WHERE id = $2`,
    [targetRole.slug, user_id]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'ASSIGN_ROLE',
    resourceType: 'user_roles',
    resourceId: req.params.id,
    metadata: { user_id, role: targetRole.slug },
    req
  });

  return success(res, {}, 'Role assigned successfully');
}));

// Remove role from user
rolesRouter.delete('/:id/users/:userId', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const roleRes = await query(`SELECT slug FROM auth_schema.roles WHERE id=$1`, [req.params.id]);
  if (roleRes.rows.length && roleRes.rows[0].slug === 'super_admin') {
    const countRes = await query(`SELECT COUNT(*) FROM auth_schema.users WHERE role='super_admin' AND is_active=TRUE AND deleted_at IS NULL`);
    if (parseInt(countRes.rows[0].count) <= 1) {
      throw new AppError('Cannot remove Super Admin designation from the sole Super Admin account', 403);
    }
  }

  await query(
    `DELETE FROM auth_schema.user_roles WHERE role_id=$1 AND user_id=$2`,
    [req.params.id, req.params.userId]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'REVOKE_ROLE',
    resourceType: 'user_roles',
    resourceId: req.params.id,
    metadata: { user_id: req.params.userId },
    req
  });

  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  PERMISSIONS ROUTER
// ════════════════════════════════════════════════════════════
const permissionsRouter = require('express').Router();

permissionsRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const { module } = req.query;
  const { rows } = await query(
    `SELECT * FROM auth_schema.permissions ${module ? 'WHERE module=$1' : ''} ORDER BY module, slug, name`,
    module ? [module] : []
  );
  return success(res, rows);
}));

permissionsRouter.post('/', authenticate, requirePermission('role.manage'), asyncHandler(async (req, res) => {
  const { name, slug, module, description, action } = req.body;
  if (!name || !slug || !module) throw new AppError('name, slug, module required');
  const derivedAction = action || (slug.includes('.') ? slug.split('.')[1] : 'manage');

  const { rows } = await query(
    `INSERT INTO auth_schema.permissions (name, slug, module, description, action)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, action = EXCLUDED.action
     RETURNING *`,
    [name.trim(), slug.trim().toLowerCase(), module.trim().toLowerCase(), description, derivedAction]
  );

  await recordAuditLog({
    actorId: req.userId,
    action: 'CREATE_PERMISSION',
    resourceType: 'permissions',
    resourceId: rows[0].id,
    newData: rows[0],
    req
  });

  return created(res, rows[0]);
}));

module.exports = { router, rolesRouter, permissionsRouter };
