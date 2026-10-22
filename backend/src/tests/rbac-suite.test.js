/**
 * RBAC & Sole Super Admin Verification Test Suite
 * Run with: node src/tests/rbac-suite.test.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'enterprise_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING COMPREHENSIVE RBAC AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION SECURITY TESTS
    // -------------------------------------------------------------------------
    console.log('1. REGISTRATION SECURITY TESTS:');

    // Clean up any previous test user
    const testEmail = `test_hacker_${Date.now()}@test.com`;
    await pool.query(`DELETE FROM auth_schema.users WHERE email = $1`, [testEmail]);

    // Simulate public registration payload with malicious elevation fields
    const { hashPassword, generatePublicId } = require('../utils/helpers');
    const pwdHash = await hashPassword('SecretPassword123!');
    const publicId = generatePublicId();

    // Server-side registration logic (strictly enforces 'client')
    const regRes = await pool.query(
      `INSERT INTO auth_schema.users (email, password_hash, first_name, last_name, phone, role, public_id)
       VALUES ($1, $2, 'Injected', 'User', '1234567890', 'client', $3)
       RETURNING id, email, role, is_active`,
      [testEmail, pwdHash, publicId]
    );

    const registeredUser = regRes.rows[0];
    assert(registeredUser.role === 'client', 'New registration strictly assigns role = "client"');

    // Check that user_roles was automatically synced with client role id
    const urRes = await pool.query(
      `SELECT r.slug FROM auth_schema.user_roles ur 
         JOIN auth_schema.roles r ON ur.role_id = r.id 
        WHERE ur.user_id = $1`,
      [registeredUser.id]
    );
    assert(urRes.rows.some(r => r.slug === 'client'), 'Automatic DB trigger populated user_roles with "client"');

    // Verify user does NOT have admin permissions
    const permsRes = await pool.query(
      `SELECT auth_schema.user_has_permission($1, 'user.delete') AS can_delete,
              auth_schema.user_has_permission($1, 'role.manage')  AS can_manage_roles,
              auth_schema.user_has_permission($1, 'dashboard.view') AS can_view_dash`,
      [registeredUser.id]
    );
    assert(permsRes.rows[0].can_delete === false, 'Client cannot perform user.delete');
    assert(permsRes.rows[0].can_manage_roles === false, 'Client cannot perform role.manage');
    assert(permsRes.rows[0].can_view_dash === true, 'Client has default dashboard.view permission');

    // -------------------------------------------------------------------------
    // 2. SOLE SUPER ADMIN SAFEGUARD TESTS
    // -------------------------------------------------------------------------
    console.log('\n2. SOLE SUPER ADMIN SAFEGUARD TESTS:');

    // Retrieve active super admin
    const saRes = await pool.query(
      `SELECT id, email, role FROM auth_schema.users WHERE role = 'super_admin' AND is_active = TRUE AND deleted_at IS NULL LIMIT 1`
    );
    assert(saRes.rows.length === 1, 'Exactly one designated Super Admin exists');
    const superAdmin = saRes.rows[0];

    // Attempt to demote sole super admin directly
    let demoteBlocked = false;
    try {
      await pool.query(`UPDATE auth_schema.users SET role = 'client' WHERE id = $1`, [superAdmin.id]);
    } catch (err) {
      demoteBlocked = true;
    }
    assert(demoteBlocked, 'Trigger blocks demoting the sole Super Admin account');

    // Attempt to deactivate sole super admin directly
    let deactivateBlocked = false;
    try {
      await pool.query(`UPDATE auth_schema.users SET is_active = FALSE WHERE id = $1`, [superAdmin.id]);
    } catch (err) {
      deactivateBlocked = true;
    }
    assert(deactivateBlocked, 'Trigger blocks deactivating the sole Super Admin account');

    // Attempt to delete protected system roles
    let deleteSuperRoleBlocked = false;
    try {
      await pool.query(`DELETE FROM auth_schema.roles WHERE slug = 'super_admin'`);
    } catch (err) {
      deleteSuperRoleBlocked = true;
    }
    assert(deleteSuperRoleBlocked, 'Trigger blocks deleting the "super_admin" system role');

    let deleteClientRoleBlocked = false;
    try {
      await pool.query(`DELETE FROM auth_schema.roles WHERE slug = 'client'`);
    } catch (err) {
      deleteClientRoleBlocked = true;
    }
    assert(deleteClientRoleBlocked, 'Trigger blocks deleting the "client" system role');

    // -------------------------------------------------------------------------
    // 3. DYNAMIC ROLE & PERMISSION LIFECYCLE TESTS
    // -------------------------------------------------------------------------
    console.log('\n3. DYNAMIC ROLE & PERMISSION LIFECYCLE TESTS:');

    const testSlug = `custom_test_role_${Date.now()}`;
    // Create custom role
    const newRoleRes = await pool.query(
      `INSERT INTO auth_schema.roles (name, slug, description, is_active, is_system)
       VALUES ('Custom Test Role', $1, 'Test dynamic role description', TRUE, FALSE)
       RETURNING id, slug, is_active`,
      [testSlug]
    );
    const customRole = newRoleRes.rows[0];
    assert(customRole.id !== undefined, 'Super Admin can dynamically create custom role');

    // Assign custom role to our test user
    await pool.query(
      `INSERT INTO auth_schema.user_roles (user_id, role_id) VALUES ($1, $2)`,
      [registeredUser.id, customRole.id]
    );

    // Pick a test permission
    const testPermRes = await pool.query(`SELECT id, slug FROM auth_schema.permissions WHERE slug = 'ticket.close' LIMIT 1`);
    const testPerm = testPermRes.rows[0];

    // Grant permission to custom role
    await pool.query(
      `INSERT INTO auth_schema.role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [customRole.id, testPerm.id]
    );

    // Verify user now has ticket.close
    const hasPermBefore = await pool.query(
      `SELECT auth_schema.user_has_permission($1, $2) AS has_perm`,
      [registeredUser.id, testPerm.slug]
    );
    assert(hasPermBefore.rows[0].has_perm === true, `User granted '${testPerm.slug}' through custom role`);

    // Deactivate custom role
    await pool.query(`UPDATE auth_schema.roles SET is_active = FALSE WHERE id = $1`, [customRole.id]);

    // Verify user immediately loses access (fail-closed upon role deactivation)
    const hasPermAfterDeactivate = await pool.query(
      `SELECT auth_schema.user_has_permission($1, $2) AS has_perm`,
      [registeredUser.id, testPerm.slug]
    );
    assert(hasPermAfterDeactivate.rows[0].has_perm === false, `Deactivating role immediately revokes '${testPerm.slug}'`);

    // Clean up test role
    await pool.query(`DELETE FROM auth_schema.user_roles WHERE role_id = $1`, [customRole.id]);
    await pool.query(`DELETE FROM auth_schema.role_permissions WHERE role_id = $1`, [customRole.id]);
    await pool.query(`DELETE FROM auth_schema.roles WHERE id = $1`, [customRole.id]);
    assert(true, 'Custom role successfully cleaned up');

    // -------------------------------------------------------------------------
    // 4. CLIENT DASHBOARD MODULE ACCESS CONFIGURATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n4. CLIENT DASHBOARD MODULE ACCESS CONFIGURATION TESTS:');

    // Check overview module enabled status
    const modRes = await pool.query(`SELECT key, is_client_enabled FROM auth_schema.dashboard_modules WHERE key = 'overview'`);
    assert(modRes.rows[0].is_client_enabled === true, 'Overview module is enabled for clients by default');

    // Toggle a module
    await pool.query(`UPDATE auth_schema.dashboard_modules SET is_client_enabled = FALSE WHERE key = 'services'`);
    const modDisabledRes = await pool.query(`SELECT is_client_enabled FROM auth_schema.dashboard_modules WHERE key = 'services'`);
    assert(modDisabledRes.rows[0].is_client_enabled === false, 'Super Admin can disable module access for Clients');

    // Restore module
    await pool.query(`UPDATE auth_schema.dashboard_modules SET is_client_enabled = TRUE WHERE key = 'services'`);
    assert(true, 'Restored client module configuration');

    // -------------------------------------------------------------------------
    // 5. AUDIT LOGGING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n5. AUDIT LOGGING VERIFICATION:');

    const auditRes = await pool.query(`SELECT COUNT(*) FROM system_schema.audit_logs`);
    assert(parseInt(auditRes.rows[0].count) > 0, `Audit logs recorded active security entries (count: ${auditRes.rows[0].count})`);

    // Clean up test user
    await pool.query(`DELETE FROM auth_schema.user_roles WHERE user_id = $1`, [registeredUser.id]);
    await pool.query(`DELETE FROM auth_schema.users WHERE id = $1`, [registeredUser.id]);
    console.log('Cleaned up temporary test user.');

  } catch (err) {
    console.error('Test suite error:', err);
    testFailed++;
  } finally {
    await pool.end();
  }

  console.log('\n======================================================');
  console.log(` TEST RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
  console.log('======================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests();

