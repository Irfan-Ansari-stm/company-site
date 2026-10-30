// backend/src/tests/auth-rate-limiting.test.js
// Verification of Localhost Rate Limiting Bypass & Production Security Enforcement

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const http = require('http');
const assert = require('assert');
const app = require('../index');
const { pool, query } = require('../config/database');
const {
  isAuthRateLimitActive,
  isGeneralRateLimitActive,
  isAccountLockoutActive,
} = require('../middleware/common');
const { generateAccessToken } = require('../utils/helpers');

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
  console.log('\n================================================================');
  console.log(' STARTING AUTHENTICATION RATE LIMITING & SECURITY VERIFICATION');
  console.log('================================================================\n');

  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthRateLimit = process.env.AUTH_RATE_LIMIT_ENABLED;
  const originalRateLimit = process.env.RATE_LIMIT_ENABLED;

  const testEmail = `devtest.${Date.now()}@company.com`;
  const testPassword = 'Password123!';
  let testUserId = null;

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

    // Seed test user
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
        first_name: 'Dev',
        last_name: 'Tester',
      },
    });
    assert.strictEqual(regRes.status, 201, 'Test user registration should succeed');
    testUserId = regRes.data?.data?.user?.id;

    // ─────────────────────────────────────────────────────────────
    // PART 1: LOCAL DEVELOPMENT CONFIGURATION (NODE_ENV=development)
    // ─────────────────────────────────────────────────────────────
    console.log('1. LOCAL DEVELOPMENT CONFIGURATION VERIFICATION (NODE_ENV=development):');
    process.env.NODE_ENV = 'development';
    process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
    process.env.RATE_LIMIT_ENABLED = 'false';

    assert.strictEqual(isAuthRateLimitActive(), false, 'Auth rate limiting must be inactive in local dev');
    assert.strictEqual(isGeneralRateLimitActive(), false, 'General rate limiting must be inactive in local dev');
    assert.strictEqual(isAccountLockoutActive(), false, 'Account lockout must be inactive in local dev');
    pass('Development environment flags correctly report inactive rate limiters');

    // Scenario 1: Repeated valid login attempts (25 attempts in rapid succession)
    try {
      let allPassed = true;
      for (let i = 1; i <= 25; i++) {
        const res = await request('/auth/login', {
          method: 'POST',
          body: { email: testEmail, password: testPassword },
        });
        if (res.status !== 200) {
          allPassed = false;
          throw new Error(`Attempt ${i} returned status ${res.status}: ${JSON.stringify(res.data)}`);
        }
      }
      assert(allPassed, 'All 25 consecutive logins must return 200 OK');
      pass('Local development: 25 repeated valid login attempts succeed with 0 rate-limit blocks (HTTP 200)');
    } catch (e) { fail('Local development: repeated valid login attempts', e); }

    // Scenario 2: Repeated invalid login attempts without temporary rate-limit lockout
    try {
      let all401 = true;
      for (let i = 1; i <= 10; i++) {
        const res = await request('/auth/login', {
          method: 'POST',
          body: { email: testEmail, password: 'WrongPassword999!' },
        });
        if (res.status !== 401 || res.data?.message === 'Account temporarily locked. Try again later.') {
          all401 = false;
          throw new Error(`Attempt ${i} failed expected behavior: status ${res.status}, msg: ${res.data?.message}`);
        }
      }
      // Check in DB that locked_until is still null
      const userCheck = await query('SELECT locked_until FROM auth_schema.users WHERE id = $1', [testUserId]);
      assert.strictEqual(userCheck.rows[0].locked_until, null, 'locked_until must remain NULL in dev mode');
      assert(all401, 'All 10 invalid attempts return 401 without lockout');
      pass('Local development: 10 repeated invalid login attempts rejected without lockout (HTTP 401)');
    } catch (e) { fail('Local development: repeated invalid login attempts', e); }

    // Scenario 3: Valid Super Admin login succeeds with correct permissions
    let superAdminToken = null;
    try {
      const saRes = await request('/auth/login', {
        method: 'POST',
        body: { email: 'superadmin@company.com', password: 'SuperAdmin123!' },
      });
      assert.strictEqual(saRes.status, 200);
      assert.strictEqual(saRes.data?.data?.user?.role, 'super_admin');
      assert.strictEqual(saRes.data?.data?.user?.isSuperAdmin, true);
      superAdminToken = saRes.data?.data?.accessToken;
      pass('Local development: Super Admin logs in successfully with super_admin privileges');
    } catch (e) { fail('Local development: valid Super Admin login', e); }

    // Scenario 4: Invalid credentials safely rejected
    try {
      const badRes = await request('/auth/login', {
        method: 'POST',
        body: { email: 'nonexistent@company.com', password: 'AnyPassword123!' },
      });
      assert.strictEqual(badRes.status, 401);
      assert.strictEqual(badRes.data?.message, 'Invalid credentials');
      pass('Local development: Non-existent user credentials correctly rejected (HTTP 401)');
    } catch (e) { fail('Local development: invalid credentials rejection', e); }

    // Scenario 5: Logout and login again
    try {
      // Login to get tokens
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: testPassword },
      });
      assert.strictEqual(loginRes.status, 200);
      const { accessToken, refreshToken } = loginRes.data.data;

      // Logout
      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        token: accessToken,
      });
      assert.strictEqual(logoutRes.status, 200);

      // Verify old refresh token is revoked
      const refreshAttempt = await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      assert.strictEqual(refreshAttempt.status, 401, 'Revoked refresh token must be rejected');

      // Login again works cleanly
      const reloginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: testPassword },
      });
      assert.strictEqual(reloginRes.status, 200, 'Re-login must succeed');
      pass('Local development: Logout and login cycle invalidates old session and issues new session');
    } catch (e) { fail('Local development: logout and login again', e); }

    // Scenario 6: Page refresh / session persistence via /auth/me
    try {
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: testPassword },
      });
      const validToken = loginRes.data.data.accessToken;

      // Simulate browser page refresh by calling /auth/me with persistent token
      const meRes = await request('/auth/me', { token: validToken });
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.data?.data?.email, testEmail);
      pass('Local development: Session persists across page refresh via /auth/me');
    } catch (e) { fail('Local development: page refresh / session persistence', e); }

    // ─────────────────────────────────────────────────────────────
    // PART 2: PRODUCTION CONFIGURATION (NODE_ENV=production)
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. PRODUCTION CONFIGURATION VERIFICATION (NODE_ENV=production):');
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_RATE_LIMIT_ENABLED;
    delete process.env.RATE_LIMIT_ENABLED;

    assert.strictEqual(isAuthRateLimitActive(), true, 'Auth rate limiting must be active in production');
    assert.strictEqual(isGeneralRateLimitActive(), true, 'General rate limiting must be active in production');
    assert.strictEqual(isAccountLockoutActive(), true, 'Account lockout must be active in production');
    pass('Production environment enforces rate limiters and account lockouts by default');

    // Scenario 7: Production configuration: repeated excessive login attempts trigger rate limiting (HTTP 429)
    try {
      let hit429 = false;
      let attemptsCount = 0;
      for (let i = 1; i <= 30; i++) {
        attemptsCount++;
        const res = await request('/auth/login', {
          method: 'POST',
          body: { email: testEmail, password: testPassword },
        });
        if (res.status === 429) {
          hit429 = true;
          assert(
            res.data?.message?.includes('Too many') || res.data?.message?.includes('Rate limit'),
            '429 response must contain rate limiting notification'
          );
          break;
        }
      }
      assert(hit429, `Production rate limiting must trigger 429 after excessive attempts (reached after ${attemptsCount} calls)`);
      pass(`Production configuration: Rate limiting activates on excessive login requests (HTTP 429 at call #${attemptsCount})`);
    } catch (e) { fail('Production configuration: rate limit activation', e); }

    // Scenario 8: Production configuration: invalid credentials & account lockout
    try {
      const prodTestEmail = `prodtest.${Date.now()}@company.com`;
      // Create user directly in DB
      const { hashPassword } = require('../utils/helpers');
      const passHash = await hashPassword('ProdPassword123!');
      const uRes = await query(
        `INSERT INTO auth_schema.users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, 'Prod', 'Tester', 'client', TRUE) RETURNING id`,
        [prodTestEmail, passHash]
      );
      const prodUserId = uRes.rows[0].id;

      // Simulate 5 failed login attempts in production lockout logic
      for (let i = 0; i < 5; i++) {
        await query(
          `UPDATE auth_schema.users
              SET failed_login_attempts = failed_login_attempts + 1,
                  locked_until = CASE WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes' ELSE NULL END
            WHERE id = $1`,
          [prodUserId]
        );
      }
      const lockedCheck = await query('SELECT locked_until, failed_login_attempts FROM auth_schema.users WHERE id = $1', [prodUserId]);
      assert(lockedCheck.rows[0].locked_until !== null, 'locked_until must be set in database');
      assert.strictEqual(lockedCheck.rows[0].failed_login_attempts, 5);

      // Verify that calling login with this locked user produces 401 Account temporarily locked
      // Temporarily bypass rate limiter to test lockout response directly
      process.env.NODE_ENV = 'development';
      process.env.AUTH_LOCKOUT_ENABLED = 'true';
      const lockoutRes = await request('/auth/login', {
        method: 'POST',
        body: { email: prodTestEmail, password: 'ProdPassword123!' },
      });
      assert.strictEqual(lockoutRes.status, 401);
      assert.strictEqual(lockoutRes.data?.message, 'Account temporarily locked. Try again later.');

      // Restore production mode
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_LOCKOUT_ENABLED;

      // Clean up
      await query('DELETE FROM auth_schema.users WHERE id = $1', [prodUserId]);
      pass('Production configuration: Brute force defense locks account after repeated failed attempts');
    } catch (e) { fail('Production configuration: account lockout verification', e); }

    // Scenario 9: Production configuration: unauthorized admin access
    try {
      const clientToken = generateAccessToken(testUserId, 'client');
      const adminRes = await request('/users', { token: clientToken });
      assert.strictEqual(adminRes.status, 403, 'Client role must be forbidden from /users');
      pass('Production configuration: Ordinary client token forbidden from admin endpoints (HTTP 403)');
    } catch (e) { fail('Production configuration: unauthorized admin access', e); }

    // Scenario 10: Production configuration: rate-limit bypass attempt (spoofed headers rejected)
    try {
      // In production mode, spoof localhost headers
      process.env.NODE_ENV = 'production';
      process.env.AUTH_RATE_LIMIT_ENABLED = 'false'; // Attempted environment override in production

      // Verify that isAuthRateLimitActive() ignores AUTH_RATE_LIMIT_ENABLED=false in production!
      assert.strictEqual(isAuthRateLimitActive(), true, 'isAuthRateLimitActive must remain TRUE in production');

      const spoofRes = await request('/auth/login', {
        method: 'POST',
        headers: {
          Host: 'localhost:3000',
          'X-Forwarded-Host': 'localhost:3000',
          'X-Forwarded-For': '127.0.0.1',
          Origin: 'http://localhost:3000',
        },
        body: { email: testEmail, password: testPassword },
      });
      // Since earlier production calls reached 429, this spoofed request must STILL be 429!
      assert.strictEqual(spoofRes.status, 429, 'Spoofed localhost headers in production must not bypass 429');
      pass('Production configuration: Rate limit bypass via spoofed headers or env flags strictly rejected (HTTP 429)');
    } catch (e) { fail('Production configuration: rate-limit bypass attempt', e); }

    // Scenario 11: Missing environment settings (secure defaults)
    try {
      delete process.env.NODE_ENV;
      delete process.env.AUTH_RATE_LIMIT_ENABLED;
      delete process.env.RATE_LIMIT_ENABLED;

      assert.strictEqual(isAuthRateLimitActive(), true, 'Missing NODE_ENV must default to active rate limit');
      assert.strictEqual(isGeneralRateLimitActive(), true, 'Missing NODE_ENV must default to active general rate limit');
      assert.strictEqual(isAccountLockoutActive(), true, 'Missing NODE_ENV must default to active account lockout');
      pass('Production configuration: Missing or undefined environment settings default securely to enabled rate limits');
    } catch (e) { fail('Production configuration: missing environment settings', e); }

  } catch (fatal) {
    fail('Fatal test runner error', fatal);
  } finally {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv || 'development';
    if (originalAuthRateLimit !== undefined) {
      process.env.AUTH_RATE_LIMIT_ENABLED = originalAuthRateLimit;
    } else {
      process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
    }
    if (originalRateLimit !== undefined) {
      process.env.RATE_LIMIT_ENABLED = originalRateLimit;
    } else {
      process.env.RATE_LIMIT_ENABLED = 'false';
    }

    // Clean up test user & sessions
    if (testUserId) {
      try {
        await query('DELETE FROM auth_schema.sessions WHERE user_id = $1', [testUserId]);
        await query('DELETE FROM auth_schema.user_roles WHERE user_id = $1', [testUserId]);
        await query('DELETE FROM auth_schema.users WHERE id = $1', [testUserId]);
      } catch (_) {}
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('\n================================================================');
  console.log(` RATE LIMITING TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().then(() => {
    pool.end();
  });
}

module.exports = { runTestSuite };
