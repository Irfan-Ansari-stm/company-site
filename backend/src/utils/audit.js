// src/utils/audit.js
const { query } = require('../config/database');

/**
 * Record an audit event into system_schema.audit_logs
 */
const recordAuditLog = async ({
  actorId = null,
  action,
  resourceType,
  resourceId = null,
  oldData = null,
  newData = null,
  metadata = {},
  ip = null,
  userAgent = null,
  req = null,
}) => {
  try {
    const actor = actorId || (req && (req.userId || req.user?.id)) || null;
    const clientIp = ip || (req && (req.ip || req.connection?.remoteAddress)) || null;
    const ua = userAgent || (req && req.headers ? req.headers['user-agent'] : null);

    await query(
      `INSERT INTO system_schema.audit_logs (
         actor_id, action, resource_type, resource_id,
         old_data, new_data, metadata, ip_address, user_agent
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        actor,
        action,
        resourceType,
        resourceId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        JSON.stringify(metadata || {}),
        clientIp,
        ua ? ua.substring(0, 500) : null,
      ]
    );
  } catch (err) {
    // Non-blocking: log error to console but do not break caller transaction unless critical
    console.error('Audit logging error:', err.message);
  }
};

module.exports = { recordAuditLog };

