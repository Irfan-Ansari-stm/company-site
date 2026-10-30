// src/routes/clients.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { success, created, noContent } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Helper to resolve client_id for authenticated user
async function getClientIdForUser(userId) {
  const { rows } = await query(
    `SELECT id FROM client_schema.clients WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0]?.id || null;
}

// ════════════════════════════════════════════════════════════
//  CLIENTS OVERVIEW STATS
// ════════════════════════════════════════════════════════════
router.get('/overview', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Access to client directory metrics is restricted to administrators', 403);
  }

  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active' AND (is_active IS TRUE OR is_active IS NULL))::int AS active,
      COUNT(*) FILTER (WHERE type = 'company' OR type IS NULL)::int AS companies,
      COUNT(*) FILTER (WHERE type = 'individual')::int AS individuals,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS new_this_month
    FROM client_schema.clients
    WHERE deleted_at IS NULL
  `);

  return success(res, rows[0] || { total: 0, active: 0, companies: 0, individuals: 0, new_this_month: 0 });
}));

// ════════════════════════════════════════════════════════════
//  CLIENT DIRECTORY (LIST)
// ════════════════════════════════════════════════════════════
router.get('/', authenticate, requirePermission('client.read'), paginate, asyncHandler(async (req, res) => {
  // Client users cannot view the full global client directory
  if (req.user.role === 'client') {
    throw new AppError('Access to client directory is restricted to administrators', 403);
  }

  const { search, industry, type, status, account_manager_id, is_active } = req.query;
  const conditions = ['c.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (search) {
    conditions.push(`(c.company_name ILIKE $${idx} OR c.name ILIKE $${idx} OR c.email ILIKE $${idx} OR c.billing_email ILIKE $${idx} OR c.phone ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  if (industry) {
    conditions.push(`c.industry = $${idx}`);
    params.push(industry); idx++;
  }
  if (type) {
    conditions.push(`c.type = $${idx}`);
    params.push(type); idx++;
  }
  if (status) {
    conditions.push(`c.status = $${idx}`);
    params.push(status); idx++;
  }
  if (account_manager_id) {
    conditions.push(`c.account_manager = $${idx}`);
    params.push(account_manager_id); idx++;
  }
  if (is_active !== undefined) {
    conditions.push(`c.is_active = $${idx}`);
    params.push(is_active === 'true'); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes, summaryRes] = await Promise.all([
    query(
      `SELECT c.id,
              COALESCE(c.name, c.company_name) AS name,
              c.company_name,
              COALESCE(c.email, c.billing_email) AS email,
              c.billing_email,
              c.phone,
              COALESCE(c.type, 'company') AS type,
              c.industry,
              c.company_size,
              c.country,
              c.city,
              c.website,
              c.logo_url,
              COALESCE(c.status, CASE WHEN c.is_active = FALSE THEN 'inactive' ELSE 'active' END) AS status,
              c.is_active,
              c.health_score,
              c.currency,
              c.created_at,
              c.updated_at,
              c.account_manager,
              u.display_name AS account_manager_name,
              COUNT(DISTINCT p.id)::int AS project_count
         FROM client_schema.clients c
         LEFT JOIN auth_schema.users       u ON c.account_manager = u.id
         LEFT JOIN client_schema.client_projects p ON p.client_id = c.id
        WHERE ${where}
        GROUP BY c.id, u.display_name
        ORDER BY c.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM client_schema.clients c WHERE ${where}`, params),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND (is_active IS TRUE OR is_active IS NULL))::int AS active,
        COUNT(*) FILTER (WHERE type = 'company' OR type IS NULL)::int AS companies,
        COUNT(*) FILTER (WHERE type = 'individual')::int AS individuals
      FROM client_schema.clients
      WHERE deleted_at IS NULL
    `),
  ]);

  const response = paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination);
  response.summary = summaryRes.rows[0] || { total: 0, active: 0, companies: 0, individuals: 0 };
  return res.json(response);
}));

// ════════════════════════════════════════════════════════════
//  GET CLIENT DETAILS
// ════════════════════════════════════════════════════════════
router.get('/:id', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  let targetId = req.params.id;

  // Support /clients/me for client portal
  if (targetId === 'me') {
    const userClientId = await getClientIdForUser(req.userId);
    if (!userClientId) throw new AppError('No associated client account found for current user', 404);
    targetId = userClientId;
  }

  // Client user can ONLY access their own client record
  if (req.user.role === 'client') {
    const userClientId = await getClientIdForUser(req.userId);
    if (!userClientId || userClientId !== targetId) {
      throw new AppError('Access denied: You can only view your own client record', 403);
    }
  }

  const { rows } = await query(
    `SELECT c.*,
            COALESCE(c.name, c.company_name) AS name,
            COALESCE(c.email, c.billing_email) AS email,
            COALESCE(c.status, CASE WHEN c.is_active = FALSE THEN 'inactive' ELSE 'active' END) AS status,
            u.display_name AS account_manager_name,
            u.email AS account_manager_email
       FROM client_schema.clients c
       LEFT JOIN auth_schema.users u ON c.account_manager = u.id
      WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [targetId]
  );
  if (!rows.length) throw new AppError('Client not found', 404);

  const client = rows[0];
  const [contacts, projects, invoices, tickets, notes] = await Promise.all([
    query(
      `SELECT * FROM client_schema.client_contacts WHERE client_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [client.id]
    ),
    query(
      `SELECT id, title AS name, title, status, start_date, end_date, progress_percent, budget, spent
         FROM client_schema.client_projects
        WHERE client_id = $1
        ORDER BY created_at DESC`,
      [client.id]
    ),
    query(
      `SELECT id, invoice_number, status, total_amount, amount_paid, due_date, issue_date
         FROM billing_schema.invoices
        WHERE client_id = $1
        ORDER BY issue_date DESC LIMIT 10`,
      [client.id]
    ),
    query(
      `SELECT id, ticket_number, subject, status, priority, created_at
         FROM support_schema.tickets
        WHERE client_id = $1
        ORDER BY created_at DESC LIMIT 10`,
      [client.id]
    ),
    query(
      `SELECT n.*, u.display_name AS author_name
         FROM client_schema.client_notes n
         LEFT JOIN auth_schema.users u ON n.author_id = u.id
        WHERE n.client_id = $1
        ORDER BY n.is_pinned DESC, n.created_at DESC`,
      [client.id]
    ),
  ]);

  return success(res, {
    ...client,
    contacts: contacts.rows,
    projects: projects.rows,
    recent_invoices: invoices.rows,
    recent_tickets: tickets.rows,
    notes: notes.rows,
  });
}));

// ════════════════════════════════════════════════════════════
//  CREATE CLIENT
// ════════════════════════════════════════════════════════════
router.post('/', authenticate, requirePermission('client.create', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Client users cannot create client accounts', 403);
  }

  const {
    name, company_name, email, billing_email, phone, type, industry,
    company_size, website, country, city, address, timezone, currency,
    account_manager, account_manager_id, logo_url, description, tags,
    contacts = []
  } = req.body;

  const clientName = name || company_name;
  if (!clientName) throw new AppError('Client name or company_name is required');

  const clientEmail = email || billing_email;
  const managerId = account_manager || account_manager_id || null;

  const createdClient = await withTransaction(async (client) => {
    const clientRes = await client.query(
      `INSERT INTO client_schema.clients
         (company_name, name, billing_email, email, phone, type, industry,
          company_size, website, country, city, billing_address, timezone,
          currency, account_manager, logo_url, notes, tags, status, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'active',TRUE)
       RETURNING *`,
      [
        clientName,
        clientName,
        clientEmail,
        clientEmail,
        phone || null,
        type || 'company',
        industry || null,
        company_size || null,
        website || null,
        country || null,
        city || null,
        address ? JSON.stringify(address) : null,
        timezone || 'UTC',
        currency || 'USD',
        managerId,
        logo_url || null,
        description || null,
        tags || [],
      ]
    );
    const clientRecord = clientRes.rows[0];

    // Add primary contacts if provided
    for (const ct of contacts) {
      if (ct.first_name && ct.last_name) {
        await client.query(
          `INSERT INTO client_schema.client_contacts
             (client_id, first_name, last_name, email, phone, designation, is_primary)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [clientRecord.id, ct.first_name, ct.last_name, ct.email, ct.phone, ct.designation, ct.is_primary || false]
        );
      }
    }
    return clientRecord;
  });

  return created(res, createdClient);
}));

// ════════════════════════════════════════════════════════════
//  UPDATE CLIENT
// ════════════════════════════════════════════════════════════
router.patch('/:id', authenticate, requirePermission('client.edit', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Client users cannot modify client accounts', 403);
  }

  const {
    name, company_name, email, billing_email, phone, type, industry,
    company_size, account_manager, account_manager_id, is_active, status,
    website, country, city, description, tags, health_score
  } = req.body;

  const managerId = account_manager !== undefined ? account_manager : account_manager_id;
  const clientName = name || company_name;
  const clientEmail = email || billing_email;

  const { rows } = await query(
    `UPDATE client_schema.clients
        SET name            = COALESCE($2, name),
            company_name    = COALESCE($2, company_name),
            email           = COALESCE($3, email),
            billing_email   = COALESCE($3, billing_email),
            phone           = COALESCE($4, phone),
            type            = COALESCE($5, type),
            industry        = COALESCE($6, industry),
            company_size    = COALESCE($7, company_size),
            account_manager = COALESCE($8, account_manager),
            is_active       = COALESCE($9, is_active),
            status          = COALESCE($10, status),
            website         = COALESCE($11, website),
            country         = COALESCE($12, country),
            city            = COALESCE($13, city),
            notes           = COALESCE($14, notes),
            tags            = COALESCE($15, tags),
            health_score    = COALESCE($16, health_score),
            churned_at      = CASE WHEN $10 = 'churned' AND churned_at IS NULL THEN NOW() ELSE churned_at END,
            updated_at      = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *`,
    [
      req.params.id,
      clientName,
      clientEmail,
      phone,
      type,
      industry,
      company_size,
      managerId,
      is_active,
      status,
      website,
      country,
      city,
      description,
      tags,
      health_score
    ]
  );
  if (!rows.length) throw new AppError('Client not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  DELETE CLIENT (SOFT DELETE)
// ════════════════════════════════════════════════════════════
router.delete('/:id', authenticate, requirePermission('client.delete', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Client users cannot delete client accounts', 403);
  }

  await query(
    `UPDATE client_schema.clients
        SET deleted_at = NOW(),
            is_active = FALSE,
            status = 'archived'
      WHERE id = $1`,
    [req.params.id]
  );
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  CLIENT CONTACTS
// ════════════════════════════════════════════════════════════
router.get('/:id/contacts', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    const userClientId = await getClientIdForUser(req.userId);
    if (!userClientId || userClientId !== req.params.id) {
      throw new AppError('Access denied', 403);
    }
  }

  const { rows } = await query(
    `SELECT * FROM client_schema.client_contacts WHERE client_id = $1 ORDER BY is_primary DESC, created_at ASC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/contacts', authenticate, requirePermission('client.edit', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Client users cannot add contacts', 403);
  }

  const { first_name, last_name, email, phone, designation, is_primary } = req.body;
  if (!first_name || !last_name) throw new AppError('first_name and last_name are required');

  if (is_primary) {
    await query(`UPDATE client_schema.client_contacts SET is_primary = FALSE WHERE client_id = $1`, [req.params.id]);
  }

  const { rows } = await query(
    `INSERT INTO client_schema.client_contacts (client_id, first_name, last_name, email, phone, designation, is_primary)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.id, first_name, last_name, email, phone, designation, is_primary || false]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/contacts/:contactId', authenticate, requirePermission('client.edit', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Client users cannot delete contacts', 403);
  }

  await query(`DELETE FROM client_schema.client_contacts WHERE id = $1 AND client_id = $2`, [req.params.contactId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  CLIENT PORTAL ACCESS
// ════════════════════════════════════════════════════════════
router.get('/:id/portal', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT cp.client_id, cp.user_id, cp.company_name, u.email AS user_email,
            COALESCE(g.permissions, '{}'::jsonb) AS permissions,
            g.granted_at, g.granted_by
       FROM client_schema.client_portal_access cp
       JOIN auth_schema.users u ON cp.user_id = u.id
       LEFT JOIN client_schema.client_portal_grants g ON g.client_id = cp.client_id AND g.user_id = cp.user_id
      WHERE cp.client_id = $1`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/portal', authenticate, requirePermission('client.edit', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Access denied', 403);
  }

  const { user_id, permissions } = req.body;
  if (!user_id) throw new AppError('user_id required');

  const { rows } = await query(
    `INSERT INTO client_schema.client_portal_grants (client_id, user_id, permissions, granted_by)
     VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (client_id, user_id) DO UPDATE SET permissions = $3::jsonb, granted_by = $4, granted_at = NOW()
     RETURNING *`,
    [req.params.id, user_id, JSON.stringify(permissions || {}), req.userId]
  );
  return created(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  CLIENT NOTES
// ════════════════════════════════════════════════════════════
router.get('/:id/notes', authenticate, requirePermission('client.read'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Clients cannot view internal notes', 403);
  }

  const { rows } = await query(
    `SELECT n.*, u.display_name AS author_name
       FROM client_schema.client_notes n
       LEFT JOIN auth_schema.users u ON n.author_id = u.id
      WHERE n.client_id = $1
      ORDER BY n.is_pinned DESC, n.created_at DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/notes', authenticate, requirePermission('client.edit', 'client.manage'), asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    throw new AppError('Clients cannot add internal notes', 403);
  }

  const { content, is_pinned } = req.body;
  if (!content) throw new AppError('content required');

  const { rows } = await query(
    `INSERT INTO client_schema.client_notes (client_id, author_id, content, is_pinned)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, req.userId, content, is_pinned || false]
  );
  return created(res, rows[0]);
}));

module.exports = router;
