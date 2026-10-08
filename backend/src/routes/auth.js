// src/routes/auth.js
const router  = require('express').Router();
const crypto  = require('crypto');
const speakeasy = require('speakeasy');
const qrcode  = require('qrcode');
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { authLimiter, paginate } = require('../middleware/common');
const {
  generateAccessToken, generateRefreshToken, hashToken,
  hashPassword, comparePassword, generateSecureToken,
  generatePublicId, sendEmail, success, created, noContent, isUUID,
} = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ── POST /auth/register ───────────────────────────────────────
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone, role = 'client' } = req.body;
  if (!email || !password || !first_name || !last_name)
    throw new AppError('email, password, first_name, last_name are required');

  const passwordHash = await hashPassword(password);
  const publicId     = generatePublicId();

  const { rows } = await query(
    `INSERT INTO auth_schema.users
       (email, password_hash, first_name, last_name, phone, role, public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, email, display_name, role, created_at`,
    [email, passwordHash, first_name, last_name, phone, role, publicId]
  );

  const user = rows[0];

  // Send verification email
  const verifyToken = generateSecureToken();
  await query(
    `INSERT INTO auth_schema.email_verification_tokens (user_id, email, token_hash) VALUES ($1,$2,$3)`,
    [user.id, email, hashToken(verifyToken)]
  );
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `<p>Click <a href="${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}">here</a> to verify your email.</p>`,
  });

  const accessToken  = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await query(
    `INSERT INTO auth_schema.sessions (user_id, token_hash, expires_at, ip_address, device_name, browser, os)
     VALUES ($1,$2, NOW() + INTERVAL '7 days', $3,$4,$5,$6)`,
    [user.id, hashToken(refreshToken), req.ip,
     req.headers['user-agent']?.substring(0, 200),
     req.headers['x-browser'], req.headers['x-os']]
  );

  return created(res, { user, accessToken, refreshToken }, 'Registration successful');
}));

// ── POST /auth/login ──────────────────────────────────────────
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('email and password required');

  const { rows } = await query(
    `SELECT id, email, password_hash, role, is_active, is_verified, display_name,
            two_factor_enabled, failed_login_attempts, locked_until
       FROM auth_schema.users
      WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );

  const user = rows[0];
  if (!user) throw new AppError('Invalid credentials', 401);
  if (!user.is_active) throw new AppError('Account is deactivated', 401);
  if (user.locked_until && new Date(user.locked_until) > new Date())
    throw new AppError('Account temporarily locked. Try again later.', 401);

  const valid = await comparePassword(password, user.password_hash || '');
  if (!valid) {
    // Increment failed attempts
    await query(
      `UPDATE auth_schema.users
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes' ELSE NULL END
        WHERE id = $1`,
      [user.id]
    );
    throw new AppError('Invalid credentials', 401);
  }

  // Reset failed attempts
  await query(
    `UPDATE auth_schema.users SET failed_login_attempts=0, last_login_at=NOW(), last_login_ip=$2 WHERE id=$1`,
    [user.id, req.ip]
  );

  if (user.two_factor_enabled) {
    // Return partial token for 2FA step
    const partial = generateAccessToken(user.id, '__2fa_pending__');
    return success(res, { requires2FA: true, partialToken: partial });
  }

  const accessToken  = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await query(
    `INSERT INTO auth_schema.sessions (user_id, token_hash, expires_at, ip_address, device_name)
     VALUES ($1,$2, NOW() + INTERVAL '7 days', $3,$4)`,
    [user.id, hashToken(refreshToken), req.ip, req.headers['user-agent']?.substring(0, 200)]
  );

  return success(res, { user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role }, accessToken, refreshToken });
}));

// ── POST /auth/2fa/verify ─────────────────────────────────────
router.post('/2fa/verify', asyncHandler(async (req, res) => {
  const { partialToken, code } = req.body;
  if (!partialToken || !code) throw new AppError('partialToken and code required');

  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(partialToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Invalid or expired partial token', 401);
  }

  if (decoded.role !== '__2fa_pending__') throw new AppError('Invalid partial token', 401);

  const { rows } = await query(
    `SELECT id, email, role, two_factor_secret FROM auth_schema.users WHERE id=$1`,
    [decoded.userId]
  );
  const user = rows[0];
  if (!user) throw new AppError('User not found', 401);

  const valid = speakeasy.totp.verify({
    secret:   user.two_factor_secret,
    encoding: 'base32',
    token:    code,
    window:   1,
  });
  if (!valid) throw new AppError('Invalid 2FA code', 401);

  const accessToken  = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await query(
    `INSERT INTO auth_schema.sessions (user_id, token_hash, expires_at, ip_address)
     VALUES ($1,$2, NOW() + INTERVAL '7 days', $3)`,
    [user.id, hashToken(refreshToken), req.ip]
  );

  return success(res, { accessToken, refreshToken });
}));

// ── POST /auth/2fa/setup ──────────────────────────────────────
router.post('/2fa/setup', authenticate, asyncHandler(async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `Platform (${req.user.email})`, length: 20 });
  await query(
    `UPDATE auth_schema.users SET two_factor_secret=$1 WHERE id=$2`,
    [secret.base32, req.userId]
  );
  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  return success(res, { secret: secret.base32, qrCode: qrDataUrl });
}));

// ── POST /auth/2fa/enable ─────────────────────────────────────
router.post('/2fa/enable', authenticate, asyncHandler(async (req, res) => {
  const { code } = req.body;
  const { rows } = await query(`SELECT two_factor_secret FROM auth_schema.users WHERE id=$1`, [req.userId]);
  const valid = speakeasy.totp.verify({ secret: rows[0].two_factor_secret, encoding: 'base32', token: code, window: 1 });
  if (!valid) throw new AppError('Invalid 2FA code');
  await query(`UPDATE auth_schema.users SET two_factor_enabled=TRUE WHERE id=$1`, [req.userId]);
  return success(res, {}, '2FA enabled');
}));

// ── POST /auth/2fa/disable ────────────────────────────────────
router.post('/2fa/disable', authenticate, asyncHandler(async (req, res) => {
  const { code } = req.body;
  const { rows } = await query(`SELECT two_factor_secret FROM auth_schema.users WHERE id=$1`, [req.userId]);
  const valid = speakeasy.totp.verify({ secret: rows[0].two_factor_secret, encoding: 'base32', token: code, window: 1 });
  if (!valid) throw new AppError('Invalid 2FA code');
  await query(`UPDATE auth_schema.users SET two_factor_enabled=FALSE, two_factor_secret=NULL WHERE id=$1`, [req.userId]);
  return success(res, {}, '2FA disabled');
}));

// ── POST /auth/refresh ────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required');

  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const { rows } = await query(
    `SELECT s.id, u.id as user_id, u.role FROM auth_schema.sessions s
      JOIN auth_schema.users u ON s.user_id = u.id
     WHERE s.token_hash=$1 AND s.is_active=TRUE AND s.expires_at > NOW() AND u.deleted_at IS NULL`,
    [tokenHash]
  );

  if (!rows.length) throw new AppError('Session not found or expired', 401);

  const session = rows[0];
  const newAccessToken  = generateAccessToken(session.user_id, session.role);
  const newRefreshToken = generateRefreshToken(session.user_id);

  // Rotate refresh token
  await query(
    `UPDATE auth_schema.sessions SET token_hash=$1, last_used_at=NOW(), expires_at=NOW()+INTERVAL '7 days' WHERE id=$2`,
    [hashToken(newRefreshToken), session.id]
  );

  return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
}));

// ── POST /auth/logout ─────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query(
      `UPDATE auth_schema.sessions SET is_active=FALSE WHERE token_hash=$1 AND user_id=$2`,
      [hashToken(refreshToken), req.userId]
    );
  }
  return noContent(res);
}));

// ── POST /auth/logout-all ──────────────────────────────────────
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  await query(`UPDATE auth_schema.sessions SET is_active=FALSE WHERE user_id=$1`, [req.userId]);
  return noContent(res);
}));

// ── POST /auth/forgot-password ────────────────────────────────
router.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email required');

  const { rows } = await query(`SELECT id FROM auth_schema.users WHERE email=$1 AND deleted_at IS NULL`, [email]);
  // Always return 200 (security: don't reveal if email exists)
  if (!rows.length) return success(res, {}, 'If an account exists, a reset email has been sent');

  const token     = generateSecureToken();
  const tokenHash = hashToken(token);
  await query(
    `INSERT INTO auth_schema.password_reset_tokens (user_id, token_hash) VALUES ($1,$2)`,
    [rows[0].id, tokenHash]
  );

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Reset your password: <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Click here</a>. Expires in 2 hours.</p>`,
  });

  return success(res, {}, 'If an account exists, a reset email has been sent');
}));

// ── POST /auth/reset-password ─────────────────────────────────
router.post('/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError('Token and new password required');
  if (password.length < 8) throw new AppError('Password must be at least 8 characters');

  const tokenHash = hashToken(token);
  const { rows } = await query(
    `SELECT id, user_id FROM auth_schema.password_reset_tokens
      WHERE token_hash=$1 AND expires_at > NOW() AND used_at IS NULL`,
    [tokenHash]
  );
  if (!rows.length) throw new AppError('Invalid or expired reset token');

  const passwordHash = await hashPassword(password);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE auth_schema.users SET password_hash=$1, password_changed_at=NOW() WHERE id=$2`,
      [passwordHash, rows[0].user_id]
    );
    await client.query(
      `UPDATE auth_schema.password_reset_tokens SET used_at=NOW() WHERE id=$1`,
      [rows[0].id]
    );
    // Invalidate all sessions
    await client.query(`UPDATE auth_schema.sessions SET is_active=FALSE WHERE user_id=$1`, [rows[0].user_id]);
  });

  return success(res, {}, 'Password reset successfully');
}));

// ── GET /auth/verify-email ────────────────────────────────────
router.get('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new AppError('Token required');

  const tokenHash = hashToken(token);
  const { rows } = await query(
    `SELECT id, user_id FROM auth_schema.email_verification_tokens
      WHERE token_hash=$1 AND expires_at > NOW() AND used_at IS NULL`,
    [tokenHash]
  );
  if (!rows.length) throw new AppError('Invalid or expired verification token');

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE auth_schema.users SET is_verified=TRUE, email_verified_at=NOW() WHERE id=$1`,
      [rows[0].user_id]
    );
    await client.query(
      `UPDATE auth_schema.email_verification_tokens SET used_at=NOW() WHERE id=$1`,
      [rows[0].id]
    );
  });

  return success(res, {}, 'Email verified successfully');
}));

// ── GET /auth/me ──────────────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name,
            u.phone, u.avatar_url, u.bio, u.timezone, u.locale, u.role,
            u.is_active, u.is_verified, u.two_factor_enabled, u.last_login_at,
            u.preferences, u.created_at,
            auth_schema.get_user_permissions(u.id) AS permissions,
            ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
       FROM auth_schema.users u
       LEFT JOIN auth_schema.user_roles ur ON u.id = ur.user_id
       LEFT JOIN auth_schema.roles r ON ur.role_id = r.id
      WHERE u.id=$1
      GROUP BY u.id`,
    [req.userId]
  );
  return success(res, rows[0]);
}));

// ── PATCH /auth/me ────────────────────────────────────────────
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, bio, timezone, locale, username, preferences } = req.body;
  const { rows } = await query(
    `UPDATE auth_schema.users
        SET first_name  = COALESCE($2, first_name),
            last_name   = COALESCE($3, last_name),
            phone       = COALESCE($4, phone),
            bio         = COALESCE($5, bio),
            timezone    = COALESCE($6, timezone),
            locale      = COALESCE($7, locale),
            username    = COALESCE($8, username),
            preferences = CASE WHEN $9::jsonb IS NOT NULL THEN $9::jsonb ELSE preferences END
      WHERE id = $1
      RETURNING id, email, display_name, first_name, last_name, phone, bio, timezone, locale, username`,
    [req.userId, first_name, last_name, phone, bio, timezone, locale, username,
     preferences ? JSON.stringify(preferences) : null]
  );
  return success(res, rows[0], 'Profile updated');
}));

// ── POST /auth/change-password ────────────────────────────────
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('currentPassword and newPassword required');
  if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters');

  const { rows } = await query(`SELECT password_hash FROM auth_schema.users WHERE id=$1`, [req.userId]);
  const valid = await comparePassword(currentPassword, rows[0].password_hash || '');
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const hash = await hashPassword(newPassword);
  await query(
    `UPDATE auth_schema.users SET password_hash=$1, password_changed_at=NOW() WHERE id=$2`,
    [hash, req.userId]
  );
  return success(res, {}, 'Password changed successfully');
}));

// ── GET /auth/sessions ────────────────────────────────────────
router.get('/sessions', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, device_name, device_type, browser, os, ip_address, location, last_used_at, created_at
       FROM auth_schema.sessions
      WHERE user_id=$1 AND is_active=TRUE AND expires_at > NOW()
      ORDER BY last_used_at DESC`,
    [req.userId]
  );
  return success(res, rows);
}));

// ── DELETE /auth/sessions/:id ──────────────────────────────────
router.delete('/sessions/:id', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE auth_schema.sessions SET is_active=FALSE WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  return noContent(res);
}));

// ── OAuth callback (Google etc.) ──────────────────────────────
router.post('/oauth/callback', asyncHandler(async (req, res) => {
  const { provider, provider_user_id, email, first_name, last_name, access_token, profile_data } = req.body;
  if (!provider || !provider_user_id || !email) throw new AppError('provider, provider_user_id, email required');

  let userId;
  await withTransaction(async (client) => {
    // Upsert user
    const userRes = await client.query(
      `INSERT INTO auth_schema.users (email, first_name, last_name, is_verified, email_verified_at, public_id)
       VALUES ($1,$2,$3,TRUE,NOW(),$4)
       ON CONFLICT (email) DO UPDATE SET updated_at=NOW()
       RETURNING id, email, role`,
      [email, first_name, last_name, generatePublicId()]
    );
    userId = userRes.rows[0].id;

    // Upsert OAuth account
    await client.query(
      `INSERT INTO auth_schema.oauth_accounts (user_id, provider, provider_user_id, access_token, profile_data)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (provider, provider_user_id) DO UPDATE
         SET access_token=EXCLUDED.access_token, profile_data=EXCLUDED.profile_data, updated_at=NOW()`,
      [userId, provider, provider_user_id, access_token, JSON.stringify(profile_data || {})]
    );
  });

  const { rows } = await query(`SELECT id, role FROM auth_schema.users WHERE id=$1`, [userId]);
  const user = rows[0];
  const accessToken  = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await query(
    `INSERT INTO auth_schema.sessions (user_id, token_hash, expires_at, ip_address)
     VALUES ($1,$2,NOW()+INTERVAL '7 days',$3)`,
    [user.id, hashToken(refreshToken), req.ip]
  );

  return success(res, { accessToken, refreshToken });
}));

module.exports = router;
