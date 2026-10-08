// src/routes/clients.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  CLIENTS
// ════════════════════════════════════════════════════════════
router.get('/', authenticate, requirePermission('client.read'), paginate, asyncHandler(async (req, res) => {
  const { search, industry, account_manager_id, is_active } = req.query;
  const conditions = ['c.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (search) {
    conditions.push(`(c.company_name ILIKE $${idx} OR c.email ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  if (industry)            { conditions.push(`c.industry=$${idx}`);            params.push(industry); idx++; }
  if (account_manager_id)  { conditions.push(`c.account_manager_id=$${idx}`);  params.push(account_manager_id); idx++; }
  if (is_active !== undefined) { conditions.push(`c.is_active=$${idx}`); params.push(is_active === 'true'); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT c.id, c.company_name, c.email, c.phone, c.industry, c.company_size,
              c.country, c.city, c.website, c.logo_url, c.is_active, c.health_score,
              c.lifetime_value, c.total_invoiced, c.total_paid, c.created_at,
              u.display_name AS account_manager_name,
              COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL) AS project_count
         FROM client_schema.clients c
         LEFT JOIN auth_schema.users       u ON c.account_manager_id=u.id
         LEFT JOIN project_schema.projects p ON p.client_id=c.id
        WHERE ${where}
        GROUP BY c.id, u.display_name
        ORDER BY c.company_name ASC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM client_schema.clients c WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/:id', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.*,
            u.display_name AS account_manager_name, u.email AS account_manager_email
       FROM client_schema.clients c
       LEFT JOIN auth_schema.users u ON c.account_manager_id=u.id
      WHERE c.id=$1 AND c.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Client not found', 404);

  const client = rows[0];
  const [contacts, projects, invoices, tickets] = await Promise.all([
    query(`SELECT * FROM client_schema.client_contacts WHERE client_id=$1 ORDER BY is_primary DESC`, [client.id]),
    query(`SELECT id, code, name, status, start_date, end_date, progress_percent FROM project_schema.projects WHERE client_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [client.id]),
    query(`SELECT id, invoice_number, status, total_amount, due_date FROM finance_schema.invoices WHERE client_id=$1 AND deleted_at IS NULL ORDER BY issue_date DESC LIMIT 5`, [client.id]),
    query(`SELECT id, ticket_number, subject, status, priority FROM support_schema.tickets WHERE client_id=$1 ORDER BY created_at DESC LIMIT 5`, [client.id]),
  ]);

  return success(res, { ...client, contacts: contacts.rows, projects: projects.rows, recent_invoices: invoices.rows, recent_tickets: tickets.rows });
}));

router.post('/', authenticate, requirePermission('client.create'), asyncHandler(async (req, res) => {
  const { company_name, email, phone, industry, company_size, website,
          country, city, address, timezone, currency, account_manager_id,
          logo_url, description, tags, contacts = [] } = req.body;
  if (!company_name) throw new AppError('company_name required');

  const { rows } = await withTransaction(async (client) => {
    const clientRes = await client.query(
      `INSERT INTO client_schema.clients
         (company_name, email, phone, industry, company_size, website,
          country, city, address, timezone, currency, account_manager_id,
          logo_url, description, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [company_name, email, phone, industry, company_size, website,
       country, city, address ? JSON.stringify(address) : null,
       timezone || 'UTC', currency || 'USD', account_manager_id || null,
       logo_url, description, tags || []]
    );
    const clientRecord = clientRes.rows[0];

    // Add primary contacts
    for (const ct of contacts) {
      await client.query(
        `INSERT INTO client_schema.client_contacts
           (client_id, first_name, last_name, email, phone, designation, is_primary)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [clientRecord.id, ct.first_name, ct.last_name, ct.email, ct.phone, ct.designation, ct.is_primary || false]
      );
    }
    return clientRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/:id', authenticate, requirePermission('client.edit'), asyncHandler(async (req, res) => {
  const { company_name, email, phone, industry, account_manager_id, is_active,
          website, country, description, tags, health_score } = req.body;
  const { rows } = await query(
    `UPDATE client_schema.clients
        SET company_name       = COALESCE($2, company_name),
            email              = COALESCE($3, email),
            phone              = COALESCE($4, phone),
            industry           = COALESCE($5, industry),
            account_manager_id = COALESCE($6, account_manager_id),
            is_active          = COALESCE($7, is_active),
            website            = COALESCE($8, website),
            country            = COALESCE($9, country),
            description        = COALESCE($10, description),
            tags               = COALESCE($11, tags),
            health_score       = COALESCE($12, health_score)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, company_name, email, phone, industry, account_manager_id,
     is_active, website, country, description, tags, health_score]
  );
  if (!rows.length) throw new AppError('Client not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id', authenticate, requirePermission('client.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE client_schema.clients SET deleted_at=NOW(), is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Contacts
router.get('/:id/contacts', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM client_schema.client_contacts WHERE client_id=$1 ORDER BY is_primary DESC`, [req.params.id]);
  return success(res, rows);
}));

router.post('/:id/contacts', authenticate, requirePermission('client.edit'), asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, designation, is_primary } = req.body;
  if (!first_name || !last_name) throw new AppError('first_name and last_name required');
  const { rows } = await query(
    `INSERT INTO client_schema.client_contacts (client_id, first_name, last_name, email, phone, designation, is_primary)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.id, first_name, last_name, email, phone, designation, is_primary || false]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/contacts/:contactId', authenticate, requirePermission('client.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM client_schema.client_contacts WHERE id=$1 AND client_id=$2`, [req.params.contactId, req.params.id]);
  return noContent(res);
}));

// Client Portal access
router.get('/:id/portal', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT cp.*, u.email AS user_email FROM client_schema.client_portal_access cp
      JOIN auth_schema.users u ON cp.user_id=u.id
     WHERE cp.client_id=$1`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/portal', authenticate, requirePermission('client.edit'), asyncHandler(async (req, res) => {
  const { user_id, permissions } = req.body;
  if (!user_id) throw new AppError('user_id required');
  const { rows } = await query(
    `INSERT INTO client_schema.client_portal_access (client_id, user_id, permissions, granted_by)
     VALUES ($1,$2,$3::jsonb,$4)
     ON CONFLICT (client_id, user_id) DO UPDATE SET permissions=$3::jsonb
     RETURNING *`,
    [req.params.id, user_id, JSON.stringify(permissions || {}), req.userId]
  );
  return created(res, rows[0]);
}));

// Notes
router.get('/:id/notes', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT n.*, u.display_name AS author_name FROM client_schema.client_notes n
      JOIN auth_schema.users u ON n.author_id=u.id
     WHERE n.client_id=$1 ORDER BY n.created_at DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/notes', authenticate, requirePermission('client.edit'), asyncHandler(async (req, res) => {
  const { content, is_pinned } = req.body;
  if (!content) throw new AppError('content required');
  const { rows } = await query(
    `INSERT INTO client_schema.client_notes (client_id, author_id, content, is_pinned)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.userId, content, is_pinned || false]
  );
  return created(res, rows[0]);
}));

module.exports = router;
