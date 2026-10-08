// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'enterprise_db',
  user:     process.env.DB_USER     || 'app_user',
  password: process.env.DB_PASSWORD || '',
  min:      parseInt(process.env.DB_POOL_MIN || '2'),
  max:      parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Helper: set per-request audit context (for RLS triggers)
const withAuditContext = async (client, userId, ip) => {
  if (userId) {
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
  }
  if (ip) {
    await client.query(`SELECT set_config('app.current_ip', $1, true)`, [ip]);
  }
};

// Helper: run queries with automatic client release
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 200) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 80));
  }
  return res;
};

// Helper: transaction wrapper
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction, withAuditContext };
