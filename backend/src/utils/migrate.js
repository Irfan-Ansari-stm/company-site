// src/utils/migrate.js
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  console.log('--- Running Database Migrations ---');
  const client = await pool.connect();
  try {
    const migrationsDir = path.resolve(__dirname, '../../../db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Applying migration: ${file}...`);
      await client.query(sql);
      console.log(`✓ Applied ${file}`);
    }

    console.log('✓ All migrations applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

