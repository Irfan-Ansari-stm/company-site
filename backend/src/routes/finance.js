// src/routes/finance.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  INVOICES
// ════════════════════════════════════════════════════════════
router.get('/invoices', authenticate, requirePermission('invoice.read'), paginate, asyncHandler(async (req, res) => {
  const { status, client_id, project_id, from_date, to_date, overdue } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'created_at');

  const conditions = ['i.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (status)     { conditions.push(`i.status=$${idx}::invoice_status`); params.push(status); idx++; }
  if (client_id)  { conditions.push(`i.client_id=$${idx}`);  params.push(client_id);  idx++; }
  if (project_id) { conditions.push(`i.project_id=$${idx}`); params.push(project_id); idx++; }
  if (from_date)  { conditions.push(`i.issue_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`i.issue_date <= $${idx}`); params.push(to_date);   idx++; }
  if (overdue === 'true') conditions.push(`i.due_date < NOW() AND i.status NOT IN ('paid','cancelled')`);

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date,
              i.subtotal, i.tax_amount, i.discount_amount, i.total_amount,
              i.amount_paid, i.currency, i.sent_at, i.paid_at, i.created_at,
              cl.company_name AS client_name, cl.email AS client_email,
              p.name AS project_name
         FROM finance_schema.invoices i
         LEFT JOIN client_schema.clients   cl ON i.client_id=cl.id
         LEFT JOIN project_schema.projects p  ON i.project_id=p.id
        WHERE ${where}
        ORDER BY i.${col} ${dir}
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(
      `SELECT COUNT(*), SUM(i.total_amount) AS total_value, SUM(i.amount_paid) AS total_collected
         FROM finance_schema.invoices i WHERE ${where}`, params
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
  const { rows } = await query(`SELECT * FROM finance_schema.v_invoice_summary`);
  return success(res, rows[0]);
}));

router.get('/invoices/overdue', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT i.*, cl.company_name AS client_name
       FROM finance_schema.invoices i
       LEFT JOIN client_schema.clients cl ON i.client_id=cl.id
      WHERE i.due_date < NOW() AND i.status IN ('sent','partially_paid') AND i.deleted_at IS NULL
      ORDER BY i.due_date ASC`
  );
  return success(res, rows);
}));

router.get('/invoices/:id', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT i.*,
            cl.company_name AS client_name, cl.email AS client_email,
            cl.phone AS client_phone, cl.address AS client_address,
            p.name AS project_name, p.code AS project_code
       FROM finance_schema.invoices i
       LEFT JOIN client_schema.clients   cl ON i.client_id=cl.id
       LEFT JOIN project_schema.projects p  ON i.project_id=p.id
      WHERE i.id=$1 AND i.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Invoice not found', 404);

  const invoice = rows[0];
  const [lineItems, payments, reminders] = await Promise.all([
    query(`SELECT * FROM finance_schema.invoice_line_items WHERE invoice_id=$1 ORDER BY sort_order`, [invoice.id]),
    query(`SELECT * FROM finance_schema.payments WHERE invoice_id=$1 ORDER BY payment_date DESC`, [invoice.id]),
    query(`SELECT * FROM finance_schema.invoice_reminders WHERE invoice_id=$1 ORDER BY sent_at DESC`, [invoice.id]),
  ]);

  return success(res, { ...invoice, line_items: lineItems.rows, payments: payments.rows, reminders: reminders.rows });
}));

router.post('/invoices', authenticate, requirePermission('invoice.create'), asyncHandler(async (req, res) => {
  const {
    client_id, project_id, milestone_id, currency, issue_date, due_date,
    payment_terms, notes, footer_notes, tax_percent, discount_percent,
    line_items = []
  } = req.body;

  if (!client_id || !issue_date || !due_date) throw new AppError('client_id, issue_date, due_date required');
  if (!line_items.length) throw new AppError('At least one line item required');

  const { rows } = await withTransaction(async (client) => {
    // Generate invoice number
    const { rows: numRows } = await client.query(
      `SELECT finance_schema.next_invoice_number() AS num`
    );
    const invoiceNumber = numRows[0]?.num || `INV-${Date.now()}`;

    // Calculate totals
    const subtotal        = line_items.reduce((s, item) => s + (item.quantity * item.unit_price), 0);
    const discountAmount  = subtotal * ((discount_percent || 0) / 100);
    const taxableAmount   = subtotal - discountAmount;
    const taxAmount       = taxableAmount * ((tax_percent || 0) / 100);
    const totalAmount     = taxableAmount + taxAmount;

    const invRes = await client.query(
      `INSERT INTO finance_schema.invoices
         (invoice_number, client_id, project_id, milestone_id, created_by, currency,
          issue_date, due_date, payment_terms, notes, footer_notes,
          tax_percent, discount_percent, subtotal, tax_amount, discount_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [invoiceNumber, client_id, project_id || null, milestone_id || null, req.userId,
       currency || 'USD', issue_date, due_date, payment_terms || 'net30',
       notes, footer_notes, tax_percent || 0, discount_percent || 0,
       subtotal, taxAmount, discountAmount, totalAmount]
    );
    const invoice = invRes.rows[0];

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const item = line_items[i];
      const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
      await client.query(
        `INSERT INTO finance_schema.invoice_line_items
           (invoice_id, description, quantity, unit_price, unit, discount_percent, total_price, sort_order, service_id, task_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.unit || 'unit',
         item.discount_percent || 0, lineTotal, i, item.service_id || null, item.task_id || null]
      );
    }
    return invRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/invoices/:id', authenticate, requirePermission('invoice.edit'), asyncHandler(async (req, res) => {
  const { status, due_date, notes, footer_notes, sent_at, viewed_at, paid_at, void_reason } = req.body;
  const { rows } = await query(
    `UPDATE finance_schema.invoices
        SET status      = COALESCE($2::invoice_status, status),
            due_date    = COALESCE($3, due_date),
            notes       = COALESCE($4, notes),
            footer_notes= COALESCE($5, footer_notes),
            sent_at     = COALESCE($6, sent_at),
            viewed_at   = COALESCE($7, viewed_at),
            paid_at     = COALESCE($8, paid_at),
            void_reason = COALESCE($9, void_reason)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, status, due_date, notes, footer_notes, sent_at, viewed_at, paid_at, void_reason]
  );
  if (!rows.length) throw new AppError('Invoice not found', 404);
  return success(res, rows[0]);
}));

router.post('/invoices/:id/send', authenticate, requirePermission('invoice.edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE finance_schema.invoices SET status='sent', sent_at=NOW() WHERE id=$1 AND status='draft' RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Invoice not found or not in draft status', 404);
  return success(res, rows[0], 'Invoice sent');
}));

router.delete('/invoices/:id', authenticate, requirePermission('invoice.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE finance_schema.invoices SET deleted_at=NOW(), status='cancelled' WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  PAYMENTS
// ════════════════════════════════════════════════════════════
router.get('/payments', authenticate, requirePermission('payment.read'), paginate, asyncHandler(async (req, res) => {
  const { invoice_id, client_id, method, status, from_date, to_date } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (invoice_id) { conditions.push(`p.invoice_id=$${idx}`); params.push(invoice_id); idx++; }
  if (client_id)  { conditions.push(`p.client_id=$${idx}`);  params.push(client_id);  idx++; }
  if (method)     { conditions.push(`p.method=$${idx}::payment_method`); params.push(method); idx++; }
  if (status)     { conditions.push(`p.status=$${idx}::payment_status_type`); params.push(status); idx++; }
  if (from_date)  { conditions.push(`p.payment_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`p.payment_date <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.*, i.invoice_number, cl.company_name AS client_name
         FROM finance_schema.payments p
         LEFT JOIN finance_schema.invoices  i  ON p.invoice_id=i.id
         LEFT JOIN client_schema.clients   cl ON p.client_id=cl.id
         ${where}
        ORDER BY p.payment_date DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), SUM(p.amount) AS total FROM finance_schema.payments p ${where}`, params),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    total_amount: parseFloat(countRes.rows[0].total || 0),
  });
}));

router.post('/payments', authenticate, requirePermission('payment.create'), asyncHandler(async (req, res) => {
  const { invoice_id, client_id, amount, currency, method, payment_date,
          transaction_id, gateway_ref, notes } = req.body;
  if (!invoice_id || !amount || !method) throw new AppError('invoice_id, amount, method required');

  const { rows } = await withTransaction(async (client) => {
    const payRes = await client.query(
      `INSERT INTO finance_schema.payments
         (invoice_id, client_id, recorded_by, amount, currency, method, payment_date,
          transaction_id, gateway_ref, notes)
       VALUES ($1,$2,$3,$4,$5,$6::payment_method,$7,$8,$9,$10) RETURNING *`,
      [invoice_id, client_id || null, req.userId, amount, currency || 'USD',
       method, payment_date || new Date(), transaction_id, gateway_ref, notes]
    );
    const payment = payRes.rows[0];

    // Update invoice amount_paid & status
    await client.query(`SELECT finance_schema.update_invoice_after_payment($1)`, [invoice_id]);

    return payRes.rows;
  });

  return created(res, rows[0]);
}));

router.get('/payments/:id', authenticate, requirePermission('payment.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, i.invoice_number, cl.company_name AS client_name
       FROM finance_schema.payments p
       LEFT JOIN finance_schema.invoices i ON p.invoice_id=i.id
       LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
      WHERE p.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Payment not found', 404);
  return success(res, rows[0]);
}));

router.patch('/payments/:id', authenticate, requirePermission('payment.create'), asyncHandler(async (req, res) => {
  const { status, notes, refunded_at, refund_reason } = req.body;
  const { rows } = await query(
    `UPDATE finance_schema.payments
        SET status       = COALESCE($2::payment_status_type, status),
            notes        = COALESCE($3, notes),
            refunded_at  = COALESCE($4, refunded_at),
            refund_reason= COALESCE($5, refund_reason)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, notes, refunded_at, refund_reason]
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
  if (status)     { conditions.push(`e.status=$${idx}::expense_status`); params.push(status); idx++; }
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
        SET status          = COALESCE($2::expense_status, status),
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
    `DELETE FROM finance_schema.expenses WHERE id=$1 AND submitted_by=$2 AND status='pending'`,
    [req.params.id, req.userId]
  );
  if (!rowCount) throw new AppError('Expense not found, not yours, or not deletable', 403);
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
  if (status)    { conditions.push(`s.status=$${idx}::subscription_status`); params.push(status); idx++; }
  if (plan_id)   { conditions.push(`s.plan_id=$${idx}`);   params.push(plan_id);   idx++; }
  if (client_id) { conditions.push(`s.client_id=$${idx}`); params.push(client_id); idx++; }
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
       $7 + CASE $6 WHEN 'monthly' THEN INTERVAL '1 month' WHEN 'yearly' THEN INTERVAL '1 year' ELSE INTERVAL '7 days' END,
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
        SET status               = COALESCE($2::subscription_status, status),
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
  return success(res, []);
}));

router.post('/subscription-plans', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { name, slug, description, price, currency, interval, features, is_popular, sort_order, trial_days } = req.body;
  if (!name || !price || !interval) throw new AppError('name, price, interval required');
  const { rows } = await query(
    `INSERT INTO finance_schema.subscription_plans
       (name, slug, description, price, currency, interval, features, is_popular, sort_order, trial_days)
     VALUES ($1,$2,$3,$4,$5,$6::billing_interval,$7::jsonb,$8,$9,$10) RETURNING *`,
    [name, slug || generatePublicId(), description, price, currency || 'USD', interval,
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
  if (status)    { conditions.push(`status=$${idx}::quote_status`); params.push(status); idx++; }
  if (client_id) { conditions.push(`client_id=$${idx}`);           params.push(client_id); idx++; }
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

  const subtotal       = line_items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
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
        SET status      = COALESCE($2::quote_status, status),
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
router.get('/reports/revenue', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const { rows } = await query(
    `SELECT * FROM finance_schema.v_monthly_revenue
      WHERE ($1::int IS NULL OR EXTRACT(YEAR FROM month) = $1)
        AND ($2::int IS NULL OR EXTRACT(MONTH FROM month) = $2)
      ORDER BY month DESC LIMIT 24`,
    [year || null, month || null]
  );
  return success(res, rows);
}));

router.get('/reports/profitability', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { project_id, from_date, to_date } = req.query;
  const { rows } = await query(
    `SELECT * FROM finance_schema.v_project_profitability
      WHERE ($1::uuid IS NULL OR project_id=$1)`,
    [project_id || null]
  );
  return success(res, rows);
}));

router.get('/reports/aging', authenticate, requirePermission('invoice.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM finance_schema.v_receivables_aging`);
  return success(res, rows);
}));

router.get('/reports/cash-flow', authenticate, requirePermission('finance.read'), asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const { rows } = await query(
    `SELECT * FROM finance_schema.v_cash_flow_statement
      WHERE ($1::date IS NULL OR period >= $1)
        AND ($2::date IS NULL OR period <= $2)
      ORDER BY period DESC`,
    [from_date || null, to_date || null]
  );
  return success(res, rows);
}));

module.exports = router;
