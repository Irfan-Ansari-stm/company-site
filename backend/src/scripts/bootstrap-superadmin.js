#!/usr/bin/env node
/**
 * Bootstrap / Manage the Designated Sole Super Admin
 *
 * Usage:
 *   node src/scripts/bootstrap-superadmin.js
 *   node src/scripts/bootstrap-superadmin.js --email superadmin@company.com --password "SecurePass123!"
 *   node src/scripts/bootstrap-superadmin.js --transfer-to newadmin@company.com
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'enterprise_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : null;
  };

  const email = getArg('email') || process.env.SUPERADMIN_EMAIL || 'admin@company.com';
  const password = getArg('password') || process.env.SUPERADMIN_PASSWORD || 'Admin123!@#';
  const transferTo = getArg('transfer-to');

  console.log('--- Designated Sole Super Admin Provisioning ---');

  try {
    // 1. Ensure super_admin role exists
    const roleRes = await pool.query(
      `INSERT INTO auth_schema.roles (name, slug, description, is_system, is_active)
       VALUES ('Super Admin', 'super_admin', 'Designated Sole Super Admin with full platform authority', TRUE, TRUE)
       ON CONFLICT (slug) DO UPDATE SET is_active = TRUE
       RETURNING id, slug`
    );
    const roleId = roleRes.rows[0].id;

    // Check existing super admins
    const currentSuperAdmins = await pool.query(
      `SELECT id, email, display_name, is_active, created_at 
         FROM auth_schema.users 
        WHERE role = 'super_admin' AND deleted_at IS NULL`
    );

    if (transferTo) {
      // Transfer sole Super Admin to target email
      console.log(`Transferring Super Admin status to ${transferTo}...`);
      const targetUser = await pool.query(
        `SELECT id, email, role FROM auth_schema.users WHERE email = $1 AND deleted_at IS NULL`,
        [transferTo]
      );
      if (!targetUser.rows.length) {
        throw new Error(`Target user with email ${transferTo} not found.`);
      }

      const newSuperId = targetUser.rows[0].id;

      // Begin transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Demote existing super admins to 'admin'
        for (const sa of currentSuperAdmins.rows) {
          if (sa.id !== newSuperId) {
            await client.query(
              `UPDATE auth_schema.users SET role = 'admin' WHERE id = $1`,
              [sa.id]
            );
          }
        }

        // Promote new user
        await client.query(
          `UPDATE auth_schema.users SET role = 'super_admin', is_active = TRUE, is_verified = TRUE WHERE id = $1`,
          [newSuperId]
        );

        // Audit log
        await client.query(
          `INSERT INTO system_schema.audit_logs (actor_id, action, resource_type, resource_id, metadata)
           VALUES ($1, 'UPDATE', 'super_admin_transfer', $2, $3)`,
          [newSuperId, newSuperId, JSON.stringify({ transfer_to: transferTo })]
        );

        await client.query('COMMIT');
        console.log(`Successfully transferred Sole Super Admin designation to ${transferTo}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    }

    if (currentSuperAdmins.rows.length > 0) {
      const sa = currentSuperAdmins.rows[0];
      console.log(`Active Designated Super Admin already present: ${sa.email} (${sa.display_name})`);

      // If user passed explicit password to reset
      if (getArg('password')) {
        const hash = await bcrypt.hash(password, 12);
        await pool.query(
          `UPDATE auth_schema.users SET password_hash = $1, is_active = TRUE, is_verified = TRUE WHERE id = $2`,
          [hash, sa.id]
        );
        console.log(`Password updated for Super Admin ${sa.email}`);
      }
      return;
    }

    // No super admin exists: check if user with specified email exists
    const existingUser = await pool.query(
      `SELECT id, email, display_name FROM auth_schema.users WHERE email = $1`,
      [email]
    );

    const hash = await bcrypt.hash(password, 12);

    if (existingUser.rows.length > 0) {
      const u = existingUser.rows[0];
      await pool.query(
        `UPDATE auth_schema.users
            SET role = 'super_admin',
                password_hash = COALESCE($1, password_hash),
                is_active = TRUE,
                is_verified = TRUE
          WHERE id = $2`,
        [hash, u.id]
      );
      console.log(`Existing user ${email} promoted to designated Sole Super Admin.`);
    } else {
      const publicId = Math.random().toString(36).substring(2, 18);
      await pool.query(
        `INSERT INTO auth_schema.users (
           email, password_hash, first_name, last_name, role, is_active, is_verified, public_id
         ) VALUES ($1, $2, 'Super', 'Admin', 'super_admin', TRUE, TRUE, $3)`,
        [email, hash, publicId]
      );
      console.log(`Created new designated Sole Super Admin account: ${email}`);
    }

    console.log('Bootstrap completed successfully.');
  } catch (err) {
    console.error('Bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

