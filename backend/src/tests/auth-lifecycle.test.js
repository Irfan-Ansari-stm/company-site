// backend/src/tests/auth-lifecycle.test.js
// Comprehensive Automated Authentication, Token Lifecycle, Session Security & RBAC Test Suite

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const http = require('http');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { pool } = require('../config/database');
const { hashToken, comparePassword } = require('../utils/helpers');

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function pass(name, extra = '') {
  console.log(`  ✓ PASS: ${name}${extra ? ` (${extra})` : ''}`);
  passed++;
}

function fail(name, err) {
  console.error(`  ✗ FAIL: ${name}`, err?.message || err);
  failed++;
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    data,
  };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' STARTING COMPLETE AUTHENTICATION & SECURITY TEST SUITE');
  console.log('======================================================\n');

  const testTimestamp = Date.now();
  const testUserEmail = `authtest.${testTimestamp}@sysmairatest.org`;
  const testPassword = 'StrongPassword123!';
  let registeredUserId;
  let testAccessToken;
  let testRefreshToken;
  let superAdminToken;

  try {
    // Start temporary test server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 1. REGISTRATION & ACCOUNT CREATION TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('1. REGISTRATION & PRIVILEGE ESCALATION SAFEGUARDS:');

    // 1.1 Incomplete inputs rejected
    try {
      const res = await request('/auth/register', {
        method: 'POST',
        body: { email: testUserEmail }, // Missing required fields
      });
      assert(res.status === 400 || res.status === 422, 'Incomplete registration must return 400');
      pass('Rejects incomplete registration payloads (missing required fields)');
    } catch (e) { fail('Incomplete registration payload', e); }

    // 1.2 Invalid email format rejected
    try {
      const res = await request('/auth/register', {
        method: 'POST',
        body: {
          email: 'invalid-email-no-at-domain',
          password: testPassword,
          first_name: 'Test',
          last_name: 'User',
        },
      });
      assert.strictEqual(res.status, 400);
      pass('Rejects invalid email format without @ or domain');
    } catch (e) { fail('Invalid email format', e); }

    // 1.3 Short password rejected (< 8 chars)
    try {
      const res = await request('/auth/register', {
        method: 'POST',
        body: {
          email: `shortpass.${testTimestamp}@test.org`,
          password: 'short',
          first_name: 'Test',
          last_name: 'User',
        },
      });
      assert.strictEqual(res.status, 400);
      pass('Enforces minimum password length >= 8 characters');
    } catch (e) { fail('Short password check', e); }

    // 1.4 Unauthorized privilege escalation attempt is ignored & strictly assigned 'client'
    try {
      const res = await request('/auth/register', {
        method: 'POST',
        body: {
          email: testUserEmail,
          password: testPassword,
          first_name: 'Security',
          last_name: 'Tester',
          phone: '+15551234567',
          // Malicious attempt to escalate role
          role: 'super_admin',
          isSuperAdmin: true,
          permissions: ['*'],
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data?.data?.user?.role, 'client', 'User role must be client regardless of body payload');
      assert.strictEqual(res.data?.data?.user?.isSuperAdmin, false, 'isSuperAdmin must be false');
      assert(res.data?.data?.accessToken, 'Access token must be returned');
      assert(res.data?.data?.refreshToken, 'Refresh token must be returned');

      registeredUserId = res.data.data.user.id;
      testAccessToken = res.data.data.accessToken;
      testRefreshToken = res.data.data.refreshToken;

      pass('Registration strictly forces role = "client" and rejects privilege escalation');
    } catch (e) { fail('Registration privilege escalation check', e); }

    // 1.5 Verify password is never plaintext in database
    try {
      const dbRes = await pool.query(`SELECT password_hash FROM auth_schema.users WHERE id = $1`, [registeredUserId]);
      const storedHash = dbRes.rows[0]?.password_hash;
      assert(storedHash && storedHash.startsWith('$2'), 'Password must be hashed with bcrypt');
      assert.notStrictEqual(storedHash, testPassword, 'Password must never equal plaintext');
      const isValid = await comparePassword(testPassword, storedHash);
      assert.strictEqual(isValid, true, 'Bcrypt compare must succeed for valid password');
      pass('Passwords securely stored with bcrypt (salted & hashed, never plaintext)');
    } catch (e) { fail('Password hash verification', e); }

    // 1.6 Duplicate email rejected with 409
    try {
      const dupRes = await request('/auth/register', {
        method: 'POST',
        body: {
          email: testUserEmail,
          password: testPassword,
          first_name: 'Duplicate',
          last_name: 'User',
        },
      });
      assert.strictEqual(dupRes.status, 409, 'Duplicate email registration must return 409 Conflict');
      pass('Duplicate account registration handled cleanly with 409 Conflict');
    } catch (e) { fail('Duplicate registration check', e); }

    // ─────────────────────────────────────────────────────────────
    // 2. LOGIN & CREDENTIAL VALIDATION TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. LOGIN, CREDENTIAL VALIDATION & BRUTE FORCE DEFENSE:');

    // 2.1 Correct credentials succeed (case-insensitive email normalization)
    try {
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: {
          email: testUserEmail.toUpperCase(), // Testing case normalization
          password: testPassword,
        },
      });
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginRes.data?.data?.user?.email.toLowerCase(), testUserEmail.toLowerCase());
      assert(loginRes.data?.data?.accessToken, 'Access token must be present');
      assert(loginRes.data?.data?.refreshToken, 'Refresh token must be present');
      testAccessToken = loginRes.data.data.accessToken;
      testRefreshToken = loginRes.data.data.refreshToken;
      pass('Valid credentials authenticate successfully with email normalization');
    } catch (e) { fail('Valid credentials login', e); }

    // 2.2 Incorrect password fails
    try {
      const failRes = await request('/auth/login', {
        method: 'POST',
        body: {
          email: testUserEmail,
          password: 'IncorrectPassword999!',
        },
      });
      assert.strictEqual(failRes.status, 401, 'Incorrect password must return 401 Unauthorized');
      pass('Incorrect password rejected safely (401 Unauthorized)');
    } catch (e) { fail('Incorrect password login', e); }

    // 2.3 Non-existent user fails safely without user enumeration
    try {
      const unknownRes = await request('/auth/login', {
        method: 'POST',
        body: {
          email: 'nonexistent.user.9999@testcompany.org',
          password: 'SomeRandomPassword123!',
        },
      });
      assert.strictEqual(unknownRes.status, 401, 'Non-existent account must return 401');
      assert.strictEqual(unknownRes.data?.message, 'Invalid credentials');
      pass('Non-existent account login returns identical generic message (prevents enumeration)');
    } catch (e) { fail('Non-existent account login', e); }

    // 2.4 Deactivated user cannot log in
    try {
      await pool.query(`UPDATE auth_schema.users SET is_active = FALSE WHERE id = $1`, [registeredUserId]);
      const deactRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testUserEmail, password: testPassword },
      });
      assert.strictEqual(deactRes.status, 401);
      assert.strictEqual(deactRes.data?.message, 'Account is deactivated');
      // Restore active status
      await pool.query(`UPDATE auth_schema.users SET is_active = TRUE WHERE id = $1`, [registeredUserId]);
      pass('Deactivated account blocked from logging in (fail-closed)');
    } catch (e) { fail('Deactivated account login', e); }

    // ─────────────────────────────────────────────────────────────
    // 3. SESSION, TOKEN MANAGEMENT & ROTATION TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. TOKEN MANAGEMENT, ROTATION & REVOCATION:');

    // 3.1 Authenticate using valid token on /auth/me
    try {
      const meRes = await request('/auth/me', { token: testAccessToken });
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.data?.data?.id, registeredUserId);
      assert.strictEqual(meRes.data?.data?.role, 'client');
      pass('GET /auth/me verifies valid token and returns active user profile');
    } catch (e) { fail('GET /auth/me verification', e); }

    // 3.2 Refresh token rotation works and invalidates previous token
    let rotatedAccessToken;
    let rotatedRefreshToken;
    try {
      const refreshRes = await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: testRefreshToken },
      });
      assert.strictEqual(refreshRes.status, 200);
      assert(refreshRes.data?.data?.accessToken, 'New access token must be returned');
      assert(refreshRes.data?.data?.refreshToken, 'New rotated refresh token must be returned');

      rotatedAccessToken = refreshRes.data.data.accessToken;
      rotatedRefreshToken = refreshRes.data.data.refreshToken;
      assert.notStrictEqual(rotatedRefreshToken, testRefreshToken, 'Refresh token must be rotated');
      pass('Token refresh generates new access token and rotates refresh token');
    } catch (e) { fail('Token refresh', e); }

    // 3.3 Reusing previous refresh token fails (single-use rotation protection)
    try {
      const reuseRes = await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: testRefreshToken }, // Old token
      });
      assert.strictEqual(reuseRes.status, 401, 'Reused refresh token must be rejected');
      pass('Replay attack protection: Reusing previous refresh token fails (401)');
    } catch (e) { fail('Refresh token replay protection', e); }

    // 3.4 Tampered or malformed access token rejected
    try {
      const tamperedToken = testAccessToken.slice(0, -6) + 'abcdef';
      const tamperedRes = await request('/auth/me', { token: tamperedToken });
      assert.strictEqual(tamperedRes.status, 401, 'Tampered token must return 401');
      pass('Tampered token cryptographically rejected (401 Unauthorized)');
    } catch (e) { fail('Tampered token check', e); }

    // 3.5 Logout invalidates session
    try {
      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        token: rotatedAccessToken,
        body: { refreshToken: rotatedRefreshToken },
      });
      assert.strictEqual(logoutRes.status, 200);

      // Verify that the refresh token is now inactive in database
      const sessionCheck = await pool.query(
        `SELECT is_active FROM auth_schema.sessions WHERE token_hash = $1`,
        [hashToken(rotatedRefreshToken)]
      );
      assert.strictEqual(sessionCheck.rows[0]?.is_active, false, 'Session must be marked inactive');

      // Attempting to refresh with the logged-out token fails
      const refreshAfterLogout = await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: rotatedRefreshToken },
      });
      assert.strictEqual(refreshAfterLogout.status, 401, 'Logged out session cannot refresh');
      pass('POST /auth/logout deactivates session and revokes refresh token in database');
    } catch (e) { fail('Logout session invalidation', e); }

    // ─────────────────────────────────────────────────────────────
    // 4. ROLE-BASED ACCESS CONTROL & PERMISSION GUARDS
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. ROLE-BASED ACCESS CONTROL & SERVER-SIDE AUTHORIZATION:');

    // Login Super Admin
    try {
      const saRes = await request('/auth/login', {
        method: 'POST',
        body: {
          email: 'superadmin@company.com',
          password: 'SuperAdmin123!',
        },
      });
      assert.strictEqual(saRes.status, 200);
      assert.strictEqual(saRes.data?.data?.user?.role, 'super_admin');
      superAdminToken = saRes.data?.data?.accessToken;
      pass('Super Admin logs in successfully');
    } catch (e) { fail('Super Admin login', e); }

    // Login Client test user
    let clientToken;
    try {
      const clientLogin = await request('/auth/login', {
        method: 'POST',
        body: { email: testUserEmail, password: testPassword },
      });
      assert.strictEqual(clientLogin.status, 200);
      clientToken = clientLogin.data?.data?.accessToken;
      pass('Client user logs in successfully');
    } catch (e) { fail('Client login', e); }

    // 4.1 Anonymous request to protected admin route fails (401)
    try {
      const anonRes = await request('/users');
      assert.strictEqual(anonRes.status, 401, 'Unauthenticated users must receive 401');
      pass('Anonymous request to /users rejected (401 Unauthorized)');
    } catch (e) { fail('Anonymous protection check', e); }

    // 4.2 Client user blocked from administrative endpoints (403)
    try {
      const clientUsersRes = await request('/users', { token: clientToken });
      assert.strictEqual(clientUsersRes.status, 403, 'Client role must be forbidden from /users');
      pass('Client user strictly forbidden from user management (403 Forbidden)');
    } catch (e) { fail('Client /users check', e); }

    // 4.3 Client user blocked from CMS stats & mutations (403)
    try {
      const clientCmsRes = await request('/cms/stats', { token: clientToken });
      assert.strictEqual(clientCmsRes.status, 403, 'Client role must be forbidden from /cms/stats');
      pass('Client user strictly forbidden from CMS management (403 Forbidden)');
    } catch (e) { fail('Client /cms/stats check', e); }

    // 4.4 Super Admin accesses protected admin endpoint successfully
    try {
      const saUsersRes = await request('/users', { token: superAdminToken });
      assert.strictEqual(saUsersRes.status, 200, 'Super Admin must access /users');
      pass('Super Admin successfully accesses /users');
    } catch (e) { fail('Super Admin /users check', e); }

    // 4.5 Non-super_admin cannot create roles
    try {
      const clientRoleCreate = await request('/roles', {
        method: 'POST',
        token: clientToken,
        body: { name: 'Escalated Role', slug: 'escalated' },
      });
      assert.strictEqual(clientRoleCreate.status, 403, 'Client cannot create roles');
      pass('Role creation restricted to authorized administrators (403 Forbidden)');
    } catch (e) { fail('Client role creation check', e); }

    // ─────────────────────────────────────────────────────────────
    // 5. PASSWORD RECOVERY & EMAIL VERIFICATION FLOWS
    // ─────────────────────────────────────────────────────────────
    console.log('\n5. PASSWORD RECOVERY & SECURE TOKEN VERIFICATION:');

    // 5.1 Forgot password triggers single-use token
    let rawResetToken;
    try {
      const forgotRes = await request('/auth/forgot-password', {
        method: 'POST',
        body: { email: testUserEmail },
      });
      assert.strictEqual(forgotRes.status, 200);

      // Verify token record in database
      const tokenRes = await pool.query(
        `SELECT token_hash, expires_at, used_at FROM auth_schema.password_reset_tokens
          WHERE user_id = $1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [registeredUserId]
      );
      assert(tokenRes.rows.length === 1, 'Token record must exist in database');
      assert(tokenRes.rows[0].expires_at > new Date(), 'Token must have future expiry');
      assert.strictEqual(tokenRes.rows[0].used_at, null, 'Token must not be marked used yet');

      // Generate a mock reset token for end-to-end verification
      rawResetToken = 'test-reset-token-' + Date.now();
      await pool.query(
        `INSERT INTO auth_schema.password_reset_tokens (user_id, token_hash) VALUES ($1, $2)`,
        [registeredUserId, hashToken(rawResetToken)]
      );

      pass('Forgot password generates secure, time-limited reset token');
    } catch (e) { fail('Forgot password token generation', e); }

    // 5.2 Reset password with invalid token fails
    try {
      const badTokenRes = await request('/auth/reset-password', {
        method: 'POST',
        body: { token: 'invalid-token-12345', password: 'NewStrongPassword123!' },
      });
      assert.strictEqual(badTokenRes.status, 400);
      pass('Reset password with invalid token rejected (400 Bad Request)');
    } catch (e) { fail('Bad token reset password', e); }

    // 5.3 Reset password with valid token succeeds and updates password
    const newPassword = 'NewlyUpdatedPassword123!';
    try {
      const resetRes = await request('/auth/reset-password', {
        method: 'POST',
        body: { token: rawResetToken, password: newPassword },
      });
      assert.strictEqual(resetRes.status, 200);
      assert.strictEqual(resetRes.data?.message, 'Password reset successfully');

      // Verify old password fails
      const oldLoginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testUserEmail, password: testPassword },
      });
      assert.strictEqual(oldLoginRes.status, 401, 'Old password must no longer work');

      // Verify new password succeeds
      const newLoginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testUserEmail, password: newPassword },
      });
      assert.strictEqual(newLoginRes.status, 200, 'New password must succeed');
      pass('Password reset takes effect immediately; old password invalidated');
    } catch (e) { fail('Valid password reset flow', e); }

    // 5.4 Token reuse fails
    try {
      const reuseRes = await request('/auth/reset-password', {
        method: 'POST',
        body: { token: rawResetToken, password: 'AnotherPassword123!' },
      });
      assert.strictEqual(reuseRes.status, 400, 'Reusing reset token must be rejected');
      pass('Single-use enforcement: Used password reset token cannot be reused');
    } catch (e) { fail('Reset token reuse prevention', e); }

    // 5.5 Email verification flow
    try {
      const rawVerifyToken = 'test-verify-token-' + Date.now();
      await pool.query(
        `INSERT INTO auth_schema.email_verification_tokens (user_id, email, token_hash) VALUES ($1, $2, $3)`,
        [registeredUserId, testUserEmail, hashToken(rawVerifyToken)]
      );

      // Verify email via GET endpoint
      const verifyRes = await request(`/auth/verify-email?token=${rawVerifyToken}`);
      assert.strictEqual(verifyRes.status, 200);

      const userCheck = await pool.query(`SELECT is_verified FROM auth_schema.users WHERE id = $1`, [registeredUserId]);
      assert.strictEqual(userCheck.rows[0].is_verified, true, 'is_verified must be TRUE');

      // Token reuse fails
      const reuseVerifyRes = await request(`/auth/verify-email?token=${rawVerifyToken}`);
      assert.strictEqual(reuseVerifyRes.status, 400, 'Reusing verification token must fail');

      pass('Email verification flow marks account verified and prevents token reuse');
    } catch (e) { fail('Email verification flow', e); }

    // ─────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────
    if (registeredUserId) {
      await pool.query(`DELETE FROM auth_schema.sessions WHERE user_id = $1`, [registeredUserId]);
      await pool.query(`DELETE FROM auth_schema.password_reset_tokens WHERE user_id = $1`, [registeredUserId]);
      await pool.query(`DELETE FROM auth_schema.email_verification_tokens WHERE user_id = $1`, [registeredUserId]);
      await pool.query(`DELETE FROM auth_schema.user_roles WHERE user_id = $1`, [registeredUserId]);
      await pool.query(`DELETE FROM auth_schema.users WHERE id = $1`, [registeredUserId]);
    }

  } catch (fatal) {
    console.error('Fatal test execution error:', fatal);
    failed++;
  } finally {
    if (server) server.close();
    await pool.end();

    console.log('\n======================================================');
    console.log(` AUTHENTICATION TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
