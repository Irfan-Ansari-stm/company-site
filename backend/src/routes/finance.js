// src/routes/finance.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  FINANCE OVERVIEW / DASHBOARD
// ════════════════════════════════════════════════════════════
router.get('/overview', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `AND (i.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$1) OR i.client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$1 OR user_id=$1))`
    : '';
  const params = isClient ? [req.userId] : [];

  const [summaryRes, trendsRes, recentInvRes, recentPayRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_invoices,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
         COUNT(*) FILTER (WHERE status = 'sent')::int AS pending_count,
         COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('paid', 'cancelled')))::int AS overdue_count,
         COALESCE(SUM(total_amount), 0)::numeric AS total_value,
         COALESCE(SUM(amount_paid), 0)::numeric AS total_collected,
         COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status NOT IN ('paid', 'cancelled')), 0)::numeric AS outstanding_amount,
         COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('paid', 'cancelled'))), 0)::numeric AS overdue_amount
       FROM billing_schema.invoices i
       WHERE i.deleted_at IS NULL ${clientFilter}`,
      params
    ),
    query(
      `SELECT
         TO_CHAR(issue_date, 'YYYY-MM') AS month,
         COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
         COALESCE(SUM(amount_paid), 0)::numeric AS collected,
         COUNT(*)::int AS invoice_count
       FROM billing_schema.invoices i
       WHERE i.deleted_at IS NULL ${clientFilter}
         AND issue_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
       ORDER BY month ASC`,
      params
    ),
    query(
      `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date,
              i.total_amount, i.amount_paid, i.currency, cl.company_name AS client_name
         FROM billing_schema.invoices i
         LEFT JOIN client_schema.clients cl ON i.client_id=cl.id
        WHERE i.deleted_at IS NULL ${clientFilter}
        ORDER BY i.created_at DESC LIMIT 6`,
      params
    ),
    query(
      `SELECT p.id, p.amount, p.currency, p.method, p.status, p.paid_at,
              i.invoice_number, cl.company_name AS client_name
         FROM billing_schema.payments p
         LEFT JOIN billing_schema.invoices i ON p.invoice_id=i.id
         LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
        WHERE 1=1 ${isClient ? `AND (p.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$1) OR p.client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$1 OR user_id=$1))` : ''}
        ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC LIMIT 6`,
      params
    ),
  ]);

  const s = summaryRes.rows[0] || {};
  const totalInvoiced = parseFloat(s.total_value || 0);
  const totalCollected = parseFloat(s.total_collected || 0);
  const outstandingAmount = parseFloat(s.outstanding_amount || 0);
  const overdueAmount = parseFloat(s.overdue_amount || 0);

  return success(res, {
    total_invoiced: totalInvoiced,
    total_collected: totalCollected,
    outstanding_amount: outstandingAmount,
    overdue_amount: overdueAmount,
    total_invoices: parseInt(s.total_invoices || 0),
    paid_count: parseInt(s.paid_count || 0),
    pending_count: parseInt(s.pending_count || 0),
    overdue_count: parseInt(s.overdue_count || 0),
    monthly_trend: trendsRes.rows.map(r => ({
      month: r.month,
      invoiced: parseFloat(r.invoiced),
      collected: parseFloat(r.collected),
      invoice_count: parseInt(r.invoice_count),
    })),
    recent_invoices: recentInvRes.rows,
    recent_payments: recentPayRes.rows,
  });
}));

router.get('/dashboard', authenticate, requirePermission('invoice.read'), (req, res, next) => {
  req.url = '/overview';
  router.handle(req, res, next);
});

// ════════════════════════════════════════════════════════════
//  INVOICES
// ════════════════════════════════════════════════════════════
router.get('/invoices', authenticate, requirePermission('invoice.read'), paginate, asyncHandler(async (req, res) => {
  const { status, client_id, project_id, from_date, to_date, overdue, search } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'created_at');

  const conditions = ['i.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (req.user?.role === 'client') {
    conditions.push(`(i.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$${idx}) OR i.client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$${idx} OR user_id=$${idx}))`);
    params.push(req.userId);
    idx++;
  }

  if (search && search.trim()) {
    conditions.push(`(i.invoice_number ILIKE $${idx} OR cl.company_name ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }

  if (status === 'overdue' || overdue === 'true') {
    conditions.push(`(i.status = 'overdue' OR (i.due_date < NOW() AND i.status NOT IN ('paid','cancelled')))`);
  } else if (status) {
    conditions.push(`i.status=$${idx}::invoice_status`);
    params.push(status);
    idx++;
  }

  if (client_id)  { conditions.push(`i.client_id=$${idx}`);  params.push(client_id);  idx++; }
  if (project_id) { conditions.push(`i.project_id=$${idx}`); params.push(project_id); idx++; }
  if (from_date)  { conditions.push(`i.issue_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`i.issue_date <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date,
              i.subtotal, i.tax_amount, i.discount_amount, i.total_amount,
              i.amount_paid, i.amount_due, i.currency, i.sent_at, i.paid_at, i.created_at,
              cl.company_name AS client_name, cl.email AS client_email,
              p.name AS project_name
         FROM billing_schema.invoices i
         LEFT JOIN client_schema.clients   cl ON i.client_id=cl.id
         LEFT JOIN project_schema.projects p  ON i.project_id=p.id
        WHERE ${where}
        ORDER BY i.${col} ${dir}
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(
      `SELECT COUNT(*), SUM(i.total_amount) AS total_value, SUM(i.amount_paid) AS total_collected
         FROM billing_schema.invoices i
         LEFT JOIN client_schema.clients cl ON i.client_id=cl.id
        WHERE ${where}`, params
    ),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    totals: {
      total_value:     parseFloat(countRes.rows[0].total_value || 0),
      total_collected: parseFloat(countRes.rows[0].total_collected || 0),
    },
  });
}));

router.get('/invoices/summary', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `AND (client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$1) OR client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$1 OR user_id=$1))`
    : '';
  const params = isClient ? [req.userId] : [];

  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total_invoices,
       COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
       COUNT(*) FILTER (WHERE status = 'sent')::int AS pending_count,
       COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('paid', 'cancelled')))::int AS overdue_count,
       COALESCE(SUM(total_amount), 0)::numeric AS total_value,
       COALESCE(SUM(amount_paid), 0)::numeric AS total_collected,
       COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status NOT IN ('paid', 'cancelled')), 0)::numeric AS outstanding_amount,
       COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('paid', 'cancelled'))), 0)::numeric AS overdue_amount
     FROM billing_schema.invoices
     WHERE deleted_at IS NULL ${clientFilter}`,
    params
  );
  const row = rows[0] || {};
  const totalInvoiced = parseFloat(row.total_value || 0);
  const totalCollected = parseFloat(row.total_collected || 0);
  const outstandingAmount = parseFloat(row.outstanding_amount || 0);
  const overdueAmount = parseFloat(row.overdue_amount || 0);

  return success(res, {
    total_invoices: parseInt(row.total_invoices || 0),
    total_invoiced: totalInvoiced,
    total_value: totalInvoiced,
    total_collected: totalCollected,
    outstanding_amount: outstandingAmount,
    overdue_amount: overdueAmount,
    overdue_count: parseInt(row.overdue_count || 0),
    paid_count: parseInt(row.paid_count || 0),
    pending_count: parseInt(row.pending_count || 0),
  });
}));

router.get('/invoices/overdue', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const { rows } = await query(
    `SELECT i.*, cl.company_name AS client_name
       FROM billing_schema.invoices i
       LEFT JOIN client_schema.clients cl ON i.client_id=cl.id
      WHERE i.deleted_at IS NULL AND (i.status = 'overdue' OR (i.due_date < NOW() AND i.status NOT IN ('paid','cancelled')))
        ${isClient ? 'AND (i.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$1) OR i.client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$1 OR user_id=$1))' : ''}
      ORDER BY i.due_date ASC`,
    isClient ? [req.userId] : []
  );
  return success(res, rows);
}));

router.get('/invoices/:id', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const idOrNumber = req.params.id;
  const isIdUUID = isUUID(idOrNumber);
  const whereId = isIdUUID ? 'i.id=$1' : 'i.invoice_number=$1';

  const { rows } = await query(
    `SELECT i.*,
            cl.company_name AS client_name, cl.email AS client_email,
            cl.phone AS client_phone, cl.billing_address, cl.billing_email,
            cl.city, cl.country,
            p.name AS project_name, p.code AS project_code
       FROM billing_schema.invoices i
       LEFT JOIN client_schema.clients   cl ON i.client_id=cl.id
       LEFT JOIN project_schema.projects p  ON i.project_id=p.id
      WHERE ${whereId} AND i.deleted_at IS NULL
        ${isClient ? 'AND (i.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$2) OR i.client_id IN (SELECT id FROM client_schema.clients WHERE user_id=$2))' : ''}`,
    isClient ? [idOrNumber, req.userId] : [idOrNumber]
  );
  if (!rows.length) throw new AppError('Invoice not found', 404);

  const invoice = rows[0];
  const { rows: payments } = await query(
    `SELECT * FROM billing_schema.payments WHERE invoice_id=$1 ORDER BY paid_at DESC, created_at DESC`,
    [invoice.id]
  );

  return success(res, {
    ...invoice,
    line_items: Array.isArray(invoice.line_items) ? invoice.line_items : [],
    payments,
    reminders: [],
  });
}));

router.post('/invoices', authenticate, requirePermission('invoice.create'), asyncHandler(async (req, res) => {
  const {
    client_id, project_id, milestone_id, currency = 'USD', issue_date, due_date,
    notes, terms, footer, tax_percent = 0, discount_percent = 0,
    line_items = []
  } = req.body;

  if (!client_id || !issue_date || !due_date) throw new AppError('client_id, issue_date, due_date required');
  if (!line_items.length) throw new AppError('At least one line item required');

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const subtotal       = line_items.reduce((s, item) => s + (Number(item.quantity || 1) * Number(item.unit_price || 0)), 0);
  const discountAmount = subtotal * (Number(discount_percent || 0) / 100);
  const taxableAmount  = subtotal - discountAmount;
  const taxAmount      = taxableAmount * (Number(tax_percent || 0) / 100);
  const totalAmount    = taxableAmount + taxAmount;

  const { rows } = await query(
    `INSERT INTO billing_schema.invoices
       (invoice_number, client_id, project_id, milestone_id, status,
        issue_date, due_date, line_items, subtotal, discount_amount,
        tax_amount, total_amount, amount_paid, currency,
        notes, terms, footer, created_by)
     VALUES ($1,$2,$3,$4,'draft',$5,$6,$7::jsonb,$8,$9,$10,$11,0,$12,$13,$14,$15,$16)
     RETURNING *`,
    [invoiceNumber, client_id, project_id || null, milestone_id || null,
     issue_date, due_date, JSON.stringify(line_items), subtotal, discountAmount,
     taxAmount, totalAmount, currency, notes || null, terms || null, footer || null, req.userId]
  );

  return created(res, rows[0]);
}));

router.patch('/invoices/:id', authenticate, requirePermission('invoice.edit'), asyncHandler(async (req, res) => {
  const { status, due_date, notes, terms, footer, sent_at, viewed_at, paid_at } = req.body;
  const { rows } = await query(
    `UPDATE billing_schema.invoices
        SET status      = COALESCE($2::invoice_status, status),
            due_date    = COALESCE($3, due_date),
            notes       = COALESCE($4, notes),
            terms       = COALESCE($5, terms),
            footer      = COALESCE($6, footer),
            sent_at     = COALESCE($7, sent_at),
            viewed_at   = COALESCE($8, viewed_at),
            paid_at     = COALESCE($9, paid_at),
            updated_at  = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, status, due_date, notes, terms, footer, sent_at, viewed_at, paid_at]
  );
  if (!rows.length) throw new AppError('Invoice not found', 404);
  return success(res, rows[0]);
}));

router.post('/invoices/:id/send', authenticate, requirePermission('invoice.edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE billing_schema.invoices
        SET status='sent', sent_at=NOW(), updated_at=NOW()
      WHERE id=$1 AND deleted_at IS NULL
      RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Invoice not found', 404);
  return success(res, rows[0], 'Invoice sent');
}));

router.delete('/invoices/:id', authenticate, requirePermission('invoice.delete'), asyncHandler(async (req, res) => {
  await query(
    `UPDATE billing_schema.invoices SET deleted_at=NOW(), status='cancelled', updated_at=NOW() WHERE id=$1`,
    [req.params.id]
  );
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  PAYMENTS
// ════════════════════════════════════════════════════════════
router.get('/payments', authenticate, requirePermission('payment.read'), paginate, asyncHandler(async (req, res) => {
  const { invoice_id, client_id, method, status, from_date, to_date } = req.query;
  const isClient = req.user?.role === 'client';
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (isClient) {
    conditions.push(`(p.client_id IN (SELECT client_id FROM client_schema.client_portal_access WHERE user_id=$${idx}) OR p.client_id IN (SELECT id FROM client_schema.clients WHERE primary_contact_id=$${idx} OR user_id=$${idx}))`);
    params.push(req.userId);
    idx++;
  }

  if (invoice_id) { conditions.push(`p.invoice_id=$${idx}`); params.push(invoice_id); idx++; }
  if (client_id)  { conditions.push(`p.client_id=$${idx}`);  params.push(client_id);  idx++; }
  if (method)     { conditions.push(`p.method=$${idx}::payment_method`); params.push(method); idx++; }
  if (status)     { conditions.push(`p.status=$${idx}::payment_status_type`); params.push(status); idx++; }
  if (from_date)  { conditions.push(`p.paid_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`p.paid_at <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.id, p.invoice_id, p.client_id, p.amount, p.currency, p.method,
              p.status, p.gateway_provider, p.gateway_txn_id, p.gateway_ref,
              p.paid_at AS payment_date, p.paid_at, p.notes, p.created_at,
              i.invoice_number, cl.company_name AS client_name
         FROM billing_schema.payments p
         LEFT JOIN billing_schema.invoices i  ON p.invoice_id=i.id
         LEFT JOIN client_schema.clients  cl ON p.client_id=cl.id
         ${where}
        ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), SUM(p.amount) AS total FROM billing_schema.payments p ${where}`, params),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    total_amount: parseFloat(countRes.rows[0].total || 0),
  });
}));

const handleCreatePayment = async (req, res) => {
  const { invoice_id, client_id, amount, currency = 'USD', method = 'bank_transfer',
          payment_date, transaction_id, gateway_ref, notes } = req.body;
  if (!invoice_id || !amount) throw new AppError('invoice_id and amount required');

  const validMethods = ['stripe', 'razorpay', 'bank_transfer', 'paypal', 'crypto', 'other'];
  let paymentMethod = (method || 'bank_transfer').toLowerCase().trim();
  if (paymentMethod === 'credit_card' || paymentMethod === 'card') paymentMethod = 'stripe';
  if (paymentMethod === 'wire' || paymentMethod === 'check') paymentMethod = 'bank_transfer';
  if (!validMethods.includes(paymentMethod)) paymentMethod = 'other';

  const paymentRecord = await withTransaction(async (client) => {
    let invRes;
    if (isUUID(invoice_id)) {
      invRes = await client.query(`SELECT * FROM billing_schema.invoices WHERE id=$1 AND deleted_at IS NULL`, [invoice_id]);
    } else {
      invRes = await client.query(`SELECT * FROM billing_schema.invoices WHERE invoice_number=$1 AND deleted_at IS NULL`, [invoice_id]);
    }
    if (!invRes.rows.length) throw new AppError('Invoice not found', 404);
    const invoice = invRes.rows[0];
    const actualInvId = invoice.id;
    const clientId = client_id || invoice.client_id;

    const payRes = await client.query(
      `INSERT INTO billing_schema.payments
         (invoice_id, client_id, amount, currency, method, status,
          gateway_txn_id, gateway_ref, paid_at, notes)
       VALUES ($1,$2,$3,$4,$5::payment_method,'completed',$6,$7,$8,$9) RETURNING *`,
      [actualInvId, clientId, amount, currency, paymentMethod,
       transaction_id || null, gateway_ref || null, payment_date || new Date(), notes || null]
    );

    const newPaid = parseFloat(invoice.amount_paid || 0) + parseFloat(amount);
    const total = parseFloat(invoice.total_amount || 0);
    const newStatus = newPaid >= total ? 'paid' : (newPaid > 0 ? 'partial' : invoice.status);
    const paidAt = newPaid >= total ? new Date() : invoice.paid_at;

    await client.query(
      `UPDATE billing_schema.invoices
          SET amount_paid=$2, status=$3::invoice_status,
              paid_at=$4, updated_at=NOW()
        WHERE id=$1`,
      [actualInvId, newPaid, newStatus, paidAt]
    );

    return payRes.rows[0];
  });

  return created(res, paymentRecord);
};

router.post('/payments', authenticate, requirePermission('payment.create'), asyncHandler(handleCreatePayment));

router.post('/invoices/:id/payments', authenticate, requirePermission('payment.create'), asyncHandler(async (req, res) => {
  req.body.invoice_id = req.params.id;
  return handleCreatePayment(req, res);
}));

router.get('/payments/:id', authenticate, requirePermission('payment.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, i.invoice_number, cl.company_name AS client_name
       FROM billing_schema.payments p
       LEFT JOIN billing_schema.invoices i ON p.invoice_id=i.id
       LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
      WHERE p.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Payment not found', 404);
  return success(res, rows[0]);
}));

router.patch('/payments/:id', authenticate, requirePermission('payment.create'), asyncHandler(async (req, res) => {
  const { status, notes, refunded_at, refund_amount } = req.body;
  const { rows } = await query(
    `UPDATE billing_schema.payments
        SET status        = COALESCE($2::payment_status_type, status),
            notes         = COALESCE($3, notes),
            refunded_at   = COALESCE($4, refunded_at),
            refund_amount = COALESCE($5, refund_amount)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, notes, refunded_at, refund_amount]
  );
  if (!rows.length) throw new AppError('Payment not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  EXPENSES
// ════════════════════════════════════════════════════════════
router.get('/expenses', authenticate, requirePermission('finance.read'), paginate, asyncHandler(async (req, res) => {
  const { project_id, category, status, from_date, to_date, user_id } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (project_id) { conditions.push(`e.project_id=$${idx}`); params.push(project_id); idx++; }
  if (category)   { conditions.push(`e.category=$${idx}`);   params.push(category);   idx++; }
  if (status)     { conditions.push(`e.status=$${idx}`);     params.push(status);     idx++; }
  if (user_id)    { conditions.push(`e.submitted_by=$${idx}`); params.push(user_id);  idx++; }
  if (from_date)  { conditions.push(`e.expense_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`e.expense_date <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT e.*, u.display_name AS submitted_by_name, p.name AS project_name
         FROM finance_schema.expenses e
         LEFT JOIN auth_schema.users        u ON e.submitted_by=u.id
         LEFT JOIN project_schema.projects  p ON e.project_id=p.id
         ${where}
        ORDER BY e.expense_date DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), SUM(e.amount) AS total FROM finance_schema.expenses e ${where}`, params),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    total_amount: parseFloat(countRes.rows[0].total || 0),
  });
}));

router.post('/expenses', authenticate, asyncHandler(async (req, res) => {
  const { project_id, category, description, amount, currency, expense_date,
          is_billable, vendor, receipt_media_id, notes } = req.body;
  if (!amount || !category) throw new AppError('amount and category required');
  const { rows } = await query(
    `INSERT INTO finance_schema.expenses
       (project_id, submitted_by, category, description, amount, currency, expense_date,
        is_billable, vendor, receipt_media_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [project_id || null, req.userId, category, description, amount, currency || 'USD',
     expense_date || new Date(), is_billable || false, vendor, receipt_media_id || null, notes]
  );
  return created(res, rows[0]);
}));

router.patch('/expenses/:id', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { status, notes, approved_by, approved_at, rejected_at, rejection_reason } = req.body;
  const { rows } = await query(
    `UPDATE finance_schema.expenses
        SET status          = COALESCE($2, status),
            notes           = COALESCE($3, notes),
            approved_by     = COALESCE($4, approved_by),
            approved_at     = COALESCE($5, approved_at),
            rejected_at     = COALESCE($6, rejected_at),
            rejection_reason= COALESCE($7, rejection_reason)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, notes, approved_by || req.userId, approved_at, rejected_at, rejection_reason]
  );
  if (!rows.length) throw new AppError('Expense not found', 404);
  return success(res, rows[0]);
}));

router.delete('/expenses/:id', authenticate, asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM finance_schema.expenses WHERE id=$1 AND (submitted_by=$2 OR $3 = 'super_admin')`,
    [req.params.id, req.userId, req.user?.role]
  );
  if (!rowCount) throw new AppError('Expense not found or access denied', 403);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════
router.get('/subscriptions', authenticate, requirePermission('finance.read'), paginate, asyncHandler(async (req, res) => {
  const { status, plan_id, client_id } = req.query;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (status)    { conditions.push(`s.status=$${idx}`);   params.push(status);    idx++; }
  if (plan_id)   { conditions.push(`s.plan_id=$${idx}`);  params.push(plan_id);   idx++; }
  if (client_id) { conditions.push(`s.client_id=$${idx}`);params.push(client_id); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT s.*, sp.name AS plan_name, sp.interval, cl.company_name AS client_name
         FROM finance_schema.subscriptions s
         LEFT JOIN finance_schema.subscription_plans sp ON s.plan_id=sp.id
         LEFT JOIN client_schema.clients cl ON s.client_id=cl.id
         ${where}
        ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM finance_schema.subscriptions s ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/subscriptions', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { client_id, plan_id, user_id, start_date, trial_end_date, metadata } = req.body;
  if (!client_id || !plan_id) throw new AppError('client_id and plan_id required');

  const { rows: planRows } = await query(`SELECT * FROM finance_schema.subscription_plans WHERE id=$1 AND is_active=TRUE`, [plan_id]);
  if (!planRows.length) throw new AppError('Plan not found', 404);
  const plan = planRows[0];

  const { rows } = await query(
    `INSERT INTO finance_schema.subscriptions
       (client_id, plan_id, user_id, amount, currency, interval, current_period_start, current_period_end, trial_end_date, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,
       $7::date + INTERVAL '1 month',
       $8,$9::jsonb)
     RETURNING *`,
    [client_id, plan_id, user_id || null, plan.price, plan.currency, plan.interval,
     start_date || new Date(), trial_end_date || null, JSON.stringify(metadata || {})]
  );
  return created(res, rows[0]);
}));

router.patch('/subscriptions/:id', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { status, cancel_at_period_end, cancelled_at, pause_reason } = req.body;
  const { rows } = await query(
    `UPDATE finance_schema.subscriptions
        SET status               = COALESCE($2, status),
            cancel_at_period_end = COALESCE($3, cancel_at_period_end),
            cancelled_at         = COALESCE($4, cancelled_at),
            pause_reason         = COALESCE($5, pause_reason)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, cancel_at_period_end, cancelled_at, pause_reason]
  );
  if (!rows.length) throw new AppError('Subscription not found', 404);
  return success(res, rows[0]);
}));

// Subscription Plans
router.get('/subscription-plans', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM finance_schema.subscription_plans WHERE is_active=TRUE ORDER BY sort_order ASC, price ASC`);
  return success(res, rows);
}));

router.post('/subscription-plans', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { name, slug, description, price, currency, interval, features, is_popular, sort_order, trial_days } = req.body;
  if (!name || price === undefined) throw new AppError('name, price required');
  const { rows } = await query(
    `INSERT INTO finance_schema.subscription_plans
       (name, slug, description, price, currency, interval, features, is_popular, sort_order, trial_days)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) RETURNING *`,
    [name, slug || generatePublicId(), description, price, currency || 'USD', interval || 'monthly',
     JSON.stringify(features || []), is_popular || false, sort_order || 0, trial_days || 0]
  );
  return created(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  QUOTES
// ════════════════════════════════════════════════════════════
router.get('/quotes', authenticate, requirePermission('invoice.read'), paginate, asyncHandler(async (req, res) => {
  const { status, client_id } = req.query;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (status)    { conditions.push(`status=$${idx}`);     params.push(status);    idx++; }
  if (client_id) { conditions.push(`client_id=$${idx}`);  params.push(client_id); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(`SELECT q.*, cl.company_name AS client_name FROM finance_schema.quotes q
            LEFT JOIN client_schema.clients cl ON q.client_id=cl.id
            ${where} ORDER BY q.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*) FROM finance_schema.quotes q ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/quotes', authenticate, requirePermission('invoice.create'), asyncHandler(async (req, res) => {
  const { client_id, title, notes, line_items, tax_percent, discount_percent, currency, valid_until } = req.body;
  if (!client_id || !line_items?.length) throw new AppError('client_id and line_items required');

  const subtotal       = line_items.reduce((s, i) => s + (Number(i.quantity || 1) * Number(i.unit_price || 0)), 0);
  const discountAmount = subtotal * ((discount_percent || 0) / 100);
  const taxAmount      = (subtotal - discountAmount) * ((tax_percent || 0) / 100);
  const totalAmount    = subtotal - discountAmount + taxAmount;

  const { rows } = await query(
    `INSERT INTO finance_schema.quotes
       (client_id, created_by, title, notes, line_items, tax_percent, discount_percent,
        subtotal, tax_amount, discount_amount, total_amount, currency, valid_until)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [client_id, req.userId, title, notes, JSON.stringify(line_items), tax_percent || 0, discount_percent || 0,
     subtotal, taxAmount, discountAmount, totalAmount, currency || 'USD', valid_until || null]
  );
  return created(res, rows[0]);
}));

router.patch('/quotes/:id', authenticate, requirePermission('invoice.edit'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE finance_schema.quotes
        SET status      = COALESCE($2, status),
            accepted_at = CASE WHEN $2='accepted' THEN NOW() ELSE accepted_at END,
            rejected_at = CASE WHEN $2='rejected' THEN NOW() ELSE rejected_at END
      WHERE id=$1 RETURNING *`,
    [req.params.id, status]
  );
  if (!rows.length) throw new AppError('Quote not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  FINANCIAL REPORTS
// ════════════════════════════════════════════════════════════
router.get('/reports/revenue', authenticate, requirePermission('billing.read', 'report.read', 'invoice.read'), asyncHandler(async (req, res) => {
  const { year } = req.query;
  const { rows } = await query(
    `SELECT
       TO_CHAR(issue_date, 'YYYY-MM-01') AS month,
       COALESCE(SUM(total_amount), 0)::numeric AS invoiced,
       COALESCE(SUM(amount_paid), 0)::numeric AS collected,
       COUNT(*)::int AS invoice_count
     FROM billing_schema.invoices
     WHERE deleted_at IS NULL
       AND ($1::int IS NULL OR EXTRACT(YEAR FROM issue_date) = $1)
     GROUP BY TO_CHAR(issue_date, 'YYYY-MM-01')
     ORDER BY month DESC LIMIT 24`,
    [year ? parseInt(year, 10) : null]
  );
  return success(res, rows.map(r => ({
    month: r.month,
    invoiced: parseFloat(r.invoiced),
    collected: parseFloat(r.collected),
    invoice_count: parseInt(r.invoice_count),
  })));
}));

router.get('/reports/profitability', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       cp.id AS project_id, cp.title AS project_name, cl.company_name AS client_name,
       COALESCE(cp.budget, 0)::numeric AS budget,
       COALESCE(cp.spent, 0)::numeric AS spent,
       COALESCE(SUM(i.total_amount), 0)::numeric AS total_invoiced,
       COALESCE(SUM(i.amount_paid), 0)::numeric AS total_collected,
       COALESCE(SUM(i.amount_paid), 0)::numeric - COALESCE(cp.spent, 0)::numeric AS profit
     FROM client_schema.client_projects cp
     LEFT JOIN client_schema.clients cl ON cp.client_id = cl.id
     LEFT JOIN billing_schema.invoices i ON i.project_id = cp.id AND i.deleted_at IS NULL
     GROUP BY cp.id, cp.title, cl.company_name, cp.budget, cp.spent
     LIMIT 50`
  );
  return success(res, rows);
}));

router.get('/reports/aging', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(amount_due) FILTER (WHERE due_date >= CURRENT_DATE), 0)::numeric AS current,
       COALESCE(SUM(amount_due) FILTER (WHERE due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - 30), 0)::numeric AS days_1_30,
       COALESCE(SUM(amount_due) FILTER (WHERE due_date < CURRENT_DATE - 30 AND due_date >= CURRENT_DATE - 60), 0)::numeric AS days_31_60,
       COALESCE(SUM(amount_due) FILTER (WHERE due_date < CURRENT_DATE - 60 AND due_date >= CURRENT_DATE - 90), 0)::numeric AS days_61_90,
       COALESCE(SUM(amount_due) FILTER (WHERE due_date < CURRENT_DATE - 90), 0)::numeric AS days_90_plus,
       COALESCE(SUM(amount_due), 0)::numeric AS total_outstanding
     FROM billing_schema.invoices
     WHERE deleted_at IS NULL AND status NOT IN ('paid', 'cancelled')`
  );
  return success(res, rows[0] || {});
}));

router.get('/reports/cash-flow', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       TO_CHAR(paid_at, 'YYYY-MM') AS month,
       COALESCE(SUM(amount), 0)::numeric AS inflow,
       0::numeric AS outflow,
       COALESCE(SUM(amount), 0)::numeric AS net_cash_flow
     FROM billing_schema.payments
     WHERE status = 'completed' AND paid_at >= CURRENT_DATE - INTERVAL '12 months'
     GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
     ORDER BY month ASC`
  );
  return success(res, rows);
}));

module.exports = router;
