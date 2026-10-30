// src/routes/crm.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { recordAuditLog } = require('../utils/audit');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  GLOBAL RBAC RESTRICTION FOR CLIENT ROLE
// ════════════════════════════════════════════════════════════
router.use((req, res, next) => {
  // Public lead submission (contact/inquiry forms) does not require user authentication
  if (req.path === '/leads/public') {
    return next();
  }
  authenticate(req, res, () => {
    if (req.user && req.user.role === 'client') {
      return next(new AppError('Access to CRM module is restricted to administrators and staff members', 403));
    }
    next();
  });
});

// ════════════════════════════════════════════════════════════
//  CRM OVERVIEW & STATS
// ════════════════════════════════════════════════════════════
router.get('/overview', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const [statsRes, clientsRes, funnelRes] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_leads,
        COUNT(*) FILTER (WHERE stage NOT IN ('won', 'lost'))::int AS active_leads,
        COUNT(*) FILTER (WHERE stage = 'won')::int AS won_deals,
        COUNT(*) FILTER (WHERE stage = 'lost')::int AS lost_deals,
        COALESCE(SUM(expected_value) FILTER (WHERE stage NOT IN ('won', 'lost')), 0)::numeric AS pipeline_value,
        COALESCE(SUM(COALESCE(deal_value, expected_value)) FILTER (WHERE stage = 'won'), 0)::numeric AS won_revenue,
        COUNT(*) FILTER (WHERE next_follow_up <= NOW() AND stage NOT IN ('won', 'lost'))::int AS follow_ups_due,
        COUNT(*) FILTER (WHERE next_follow_up > NOW() AND stage NOT IN ('won', 'lost'))::int AS upcoming_follow_ups,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS new_this_month
      FROM crm_schema.leads
      WHERE deleted_at IS NULL AND is_archived = FALSE
    `),
    query(`
      SELECT
        COUNT(*)::int AS total_clients,
        COUNT(*) FILTER (WHERE status = 'active' AND (is_active IS TRUE OR is_active IS NULL))::int AS active_clients
      FROM client_schema.clients
      WHERE deleted_at IS NULL
    `),
    query(`SELECT * FROM crm_schema.pipeline_summary()`),
  ]);

  const stats = statsRes.rows[0] || {};
  const clientStats = clientsRes.rows[0] || {};
  const totalDecided = (stats.won_deals || 0) + (stats.lost_deals || 0);
  const winRate = totalDecided > 0 ? Math.round(((stats.won_deals || 0) / totalDecided) * 100) : 0;

  return success(res, {
    total_leads: stats.total_leads || 0,
    active_leads: stats.active_leads || 0,
    won_deals: stats.won_deals || 0,
    lost_deals: stats.lost_deals || 0,
    pipeline_value: parseFloat(stats.pipeline_value || 0),
    won_revenue: parseFloat(stats.won_revenue || 0),
    win_rate: winRate,
    follow_ups_due: stats.follow_ups_due || 0,
    upcoming_follow_ups: stats.upcoming_follow_ups || 0,
    new_this_month: stats.new_this_month || 0,
    total_clients: clientStats.total_clients || 0,
    active_clients: clientStats.active_clients || 0,
    pipeline: funnelRes.rows.map(r => ({
      stage: r.stage,
      count: parseInt(r.count || r.lead_count || 0, 10),
      total_value: parseFloat(r.total_value || 0),
      avg_score: parseFloat(r.avg_score || 0),
      overdue_followups: parseInt(r.overdue_followups || 0, 10)
    })),
  });
}));

// ════════════════════════════════════════════════════════════
//  ASSIGNEES & TEAM
// ════════════════════════════════════════════════════════════
router.get('/assignees', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT id, email, display_name, first_name, last_name, avatar_url, role
    FROM auth_schema.users
    WHERE role != 'client' AND is_active = TRUE
    ORDER BY display_name ASC, first_name ASC
  `);
  return success(res, rows);
}));

// Follow-ups list
router.get('/follow-ups', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT l.id, l.public_id, l.full_name, l.email, l.company, l.phone,
           l.stage, l.lead_score, l.lead_temperature, l.next_follow_up,
           l.expected_value, l.deal_value, l.currency, l.urgency,
           u.display_name AS assigned_to_name
      FROM crm_schema.leads l
      LEFT JOIN auth_schema.users u ON l.assigned_to = u.id
     WHERE l.next_follow_up IS NOT NULL
       AND l.deleted_at IS NULL
       AND l.is_archived = FALSE
       AND l.stage NOT IN ('won', 'lost')
     ORDER BY l.next_follow_up ASC
     LIMIT 100
  `);
  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  LEADS
// ════════════════════════════════════════════════════════════
router.get('/leads/export', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { stage, search } = req.query;
  const conditions = ['l.deleted_at IS NULL', 'l.is_archived = FALSE'];
  const params = [];
  let idx = 1;
  if (stage) { conditions.push(`l.stage = $${idx}::lead_stage`); params.push(stage); idx++; }
  if (search) {
    conditions.push(`(l.full_name ILIKE $${idx} OR l.email ILIKE $${idx} OR l.company ILIKE $${idx} OR l.phone ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  const where = conditions.join(' AND ');
  const { rows } = await query(`
    SELECT l.public_id, l.full_name, l.email, l.phone, l.company,
           l.stage, l.lead_score, l.source, l.urgency,
           COALESCE(l.deal_value, l.expected_value, 0) AS value,
           l.currency, l.next_follow_up, l.created_at,
           u.display_name AS assigned_to
    FROM crm_schema.leads l
    LEFT JOIN auth_schema.users u ON l.assigned_to = u.id
    WHERE ${where}
    ORDER BY l.created_at DESC
  `, params);

  const headers = ['"Public ID"', '"Name"', '"Email"', '"Phone"', '"Company"', '"Stage"', '"Score"', '"Source"', '"Priority"', '"Value"', '"Currency"', '"Next Follow-up"', '"Created At"', '"Assigned To"'];
  const csvRows = [headers.join(',')];
  for (const r of rows) {
    csvRows.push([
      `"${r.public_id || ''}"`,
      `"${(r.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.company || '').replace(/"/g, '""')}"`,
      `"${r.stage || ''}"`,
      r.lead_score || 0,
      `"${r.source || ''}"`,
      `"${r.urgency || ''}"`,
      r.value || 0,
      `"${r.currency || 'USD'}"`,
      `"${r.next_follow_up ? new Date(r.next_follow_up).toISOString() : ''}"`,
      `"${r.created_at ? new Date(r.created_at).toISOString() : ''}"`,
      `"${(r.assigned_to || '').replace(/"/g, '""')}"`
    ].join(','));
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads-export-${Date.now()}.csv"`);
  return res.send(csvRows.join('\n'));
}));

router.get('/leads', requirePermission('lead.read'), paginate, asyncHandler(async (req, res) => {
  const { stage, assigned_to, temperature, source, search, is_archived, from_date, to_date } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'created_at');

  const conditions = ['l.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (stage)       { conditions.push(`l.stage=$${idx}::lead_stage`); params.push(stage); idx++; }
  if (assigned_to) { conditions.push(`l.assigned_to=$${idx}`);       params.push(assigned_to); idx++; }
  if (temperature) { conditions.push(`l.lead_temperature=$${idx}`);  params.push(temperature); idx++; }
  if (source)      { conditions.push(`l.source=$${idx}::lead_source`); params.push(source); idx++; }
  if (is_archived !== undefined) { conditions.push(`l.is_archived=$${idx}`); params.push(is_archived === 'true'); idx++; }
  else conditions.push(`l.is_archived=FALSE`);
  if (from_date) { conditions.push(`l.created_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)   { conditions.push(`l.created_at <= $${idx}`); params.push(to_date);   idx++; }
  if (search) {
    conditions.push(`(l.full_name ILIKE $${idx} OR l.email ILIKE $${idx} OR l.company ILIKE $${idx} OR l.phone ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT l.id, l.public_id, l.first_name, l.last_name, l.full_name, l.email, l.company, l.phone,
              l.stage, l.lead_score, l.lead_temperature, l.budget_range,
              l.expected_value, l.deal_value, l.currency, l.source, l.urgency,
              l.services_needed, l.requirements, l.next_follow_up, l.last_contact_at,
              l.created_at, l.updated_at, l.assigned_to,
              u.display_name AS assigned_to_name, u.avatar_url AS assigned_to_avatar
         FROM crm_schema.leads l
         LEFT JOIN auth_schema.users u ON l.assigned_to=u.id
        WHERE ${where}
        ORDER BY l.${col} ${dir}
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.leads l WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// Overview view
router.get('/leads/overview', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM crm_schema.v_leads_overview ORDER BY created_at DESC LIMIT 100`);
  return success(res, rows);
}));

// Pipeline summary
router.get('/leads/pipeline', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { assigned_to } = req.query;
  const { rows } = await query(
    `SELECT * FROM crm_schema.pipeline_summary($1)`,
    [assigned_to || null]
  );
  const formatted = rows.map(r => ({
    stage: r.stage,
    count: parseInt(r.count || r.lead_count || 0, 10),
    lead_count: parseInt(r.lead_count || r.count || 0, 10),
    total_value: parseFloat(r.total_value || 0),
    avg_score: parseFloat(r.avg_score || 0),
    overdue_followups: parseInt(r.overdue_followups || 0, 10)
  }));
  return success(res, formatted);
}));

// Lead funnel analytics
router.get('/leads/funnel', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM crm_schema.v_lead_funnel ORDER BY week DESC LIMIT 12`);
  return success(res, rows);
}));

// Source stats
router.get('/leads/source-stats', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM crm_schema.mv_lead_source_stats ORDER BY total_leads DESC`);
  return success(res, rows);
}));

// GET /crm/leads/:id
router.get('/leads/:id', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const byPublic = req.params.id.length === 16;
  const col = byPublic ? 'public_id' : 'id';
  const { rows } = await query(
    `SELECT l.*,
            u.display_name AS assigned_to_name, u.email AS assigned_to_email,
            u.avatar_url AS assigned_to_avatar
       FROM crm_schema.leads l
       LEFT JOIN auth_schema.users u ON l.assigned_to=u.id
      WHERE l.${col}=$1 AND l.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Lead not found', 404);

  const lead = rows[0];
  const [notes, activities, proposals, meetings] = await Promise.all([
    query(`SELECT n.*, u.display_name AS author_name FROM crm_schema.lead_notes n
            LEFT JOIN auth_schema.users u ON n.author_id=u.id
           WHERE n.lead_id=$1 ORDER BY n.is_pinned DESC, n.created_at DESC`, [lead.id]),
    query(`SELECT a.*, u.display_name AS actor_name FROM crm_schema.lead_activities a
            LEFT JOIN auth_schema.users u ON a.actor_id=u.id
           WHERE a.lead_id=$1 ORDER BY a.occurred_at DESC LIMIT 20`, [lead.id]),
    query(`SELECT id, title, status, total_amount, currency, sent_at FROM crm_schema.proposals
            WHERE lead_id=$1 ORDER BY created_at DESC`, [lead.id]),
    query(`SELECT id, title, status, scheduled_at, meeting_type FROM crm_schema.meetings
            WHERE lead_id=$1 ORDER BY scheduled_at DESC`, [lead.id]),
  ]);

  return success(res, { ...lead, notes: notes.rows, activities: activities.rows, proposals: proposals.rows, meetings: meetings.rows });
}));

// POST /crm/leads
router.post('/leads', requirePermission('lead.create'), asyncHandler(async (req, res) => {
  const {
    source, source_campaign, source_medium, landing_page, referrer,
    first_name, last_name, email, phone, company, company_size, designation,
    website, linkedin_url, country, city, timezone,
    project_type, services_needed, budget_range, timeline, requirements, urgency,
    assigned_to, expected_value, deal_value, currency, tags, metadata, next_follow_up,
    stage = 'new', initial_note
  } = req.body;

  if (!first_name || !last_name || !email) throw new AppError('first_name, last_name, email required');

  const publicId = generatePublicId();
  const isWon = stage === 'won';
  const finalDealVal = isWon ? (deal_value || expected_value || 0) : (deal_value || null);
  const wonAt = isWon ? new Date() : null;

  const { rows } = await query(
    `INSERT INTO crm_schema.leads
       (public_id, source, source_campaign, source_medium, landing_page, referrer,
        first_name, last_name, email, phone, company, company_size, designation,
        website, linkedin_url, country, city, timezone,
        project_type, services_needed, budget_range, timeline, requirements, urgency,
        assigned_to, expected_value, deal_value, won_at, stage, currency, tags, metadata, next_follow_up)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
             $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29::lead_stage,$30,$31,$32::jsonb,$33)
     RETURNING *`,
    [publicId, source || 'website', source_campaign, source_medium, landing_page, referrer,
     first_name, last_name, email, phone, company, company_size, designation,
     website, linkedin_url, country, city, timezone,
     project_type, services_needed || [], budget_range, timeline, requirements, urgency || 'medium',
     assigned_to || null, expected_value || 0, finalDealVal, wonAt, stage, currency || 'USD', tags || [],
     JSON.stringify(metadata || {}), next_follow_up || null]
  );
  const lead = rows[0];

  // Insert initial activity
  await query(
    `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description)
     VALUES ($1, $2, 'creation', 'Lead created', 'Lead profile initialized in CRM pipeline')`,
    [lead.id, req.userId]
  );

  // If initial_note was provided, create note
  if (initial_note && initial_note.trim()) {
    await query(
      `INSERT INTO crm_schema.lead_notes (lead_id, author_id, content) VALUES ($1, $2, $3)`,
      [lead.id, req.userId, initial_note.trim()]
    );
  }

  // Audit log
  await recordAuditLog({
    req,
    action: 'CREATE',
    resourceType: 'lead',
    resourceId: lead.id,
    newData: lead,
  });

  return created(res, lead);
}));

// Public lead submission (contact/inquiry form)
router.post('/leads/public', asyncHandler(async (req, res) => {
  // Honeypot spam protection: silently filter bot submissions
  if (req.body.website_url || req.body.honeypot || req.body.hp_company) {
    return created(res, { public_id: 'SPAM-FILTERED' }, 'Inquiry submitted successfully. We will be in touch shortly.');
  }

  let {
    first_name, last_name, name, email, phone, company, services_needed, subject,
    budget_range, budget, requirements, message, urgency, source = 'website',
    source_campaign, landing_page, referrer, metadata = {}
  } = req.body;

  // Gracefully handle combined 'name' field if separate first/last name not supplied
  if ((!first_name || !last_name) && name) {
    const parts = name.trim().split(/\s+/);
    first_name = first_name || parts[0] || 'Inquirer';
    last_name = last_name || (parts.length > 1 ? parts.slice(1).join(' ') : 'Contact');
  }

  if (!first_name) first_name = 'Inquirer';
  if (!last_name) last_name = 'Contact';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('A valid work email address is required', 400);
  }

  // Validate against PostgreSQL lead_source enum
  const allowedSources = ['website', 'referral', 'linkedin', 'google_ads', 'meta_ads', 'cold_outreach', 'partner', 'event', 'other'];
  const sanitizedSource = allowedSources.includes(source) ? source : 'website';
  const finalRequirements = requirements || (subject ? `Subject: ${subject}\n\n${message || ''}` : message || '');
  const finalBudgetRange = budget_range || budget || null;
  const mergedMetadata = {
    ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
    subject: subject || undefined,
    original_source: source,
    submitted_at: new Date().toISOString(),
  };

  const publicId = generatePublicId();
  const { rows } = await query(
    `INSERT INTO crm_schema.leads
       (public_id, source, source_campaign, landing_page, referrer,
        first_name, last_name, email, phone, company,
        services_needed, budget_range, requirements, urgency, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
     RETURNING id, public_id, email, first_name, last_name, company, budget_range`,
    [publicId, sanitizedSource, source_campaign, landing_page, referrer,
     first_name, last_name, email, phone, company,
     services_needed || [], finalBudgetRange, finalRequirements, urgency || 'medium',
     JSON.stringify(mergedMetadata)]
  );
  return created(res, rows[0], 'Inquiry submitted successfully. We will be in touch shortly.');
}));

// PATCH /crm/leads/:id
router.patch('/leads/:id', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const currentLeadRes = await query(`SELECT * FROM crm_schema.leads WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
  if (!currentLeadRes.rows.length) throw new AppError('Lead not found', 404);
  const existing = currentLeadRes.rows[0];

  const {
    stage, assigned_to, lead_score, expected_value, next_follow_up, lost_reason,
    deal_value, tags, urgency, budget_range, requirements, company,
    services_needed, phone, designation, website, first_name, last_name, email
  } = req.body;

  const newFirstName = first_name !== undefined ? first_name : existing.first_name;
  const newLastName = last_name !== undefined ? last_name : existing.last_name;
  const newFullName = `${newFirstName} ${newLastName}`.trim();

  let newNextFollowUp = existing.next_follow_up;
  if ('next_follow_up' in req.body) {
    newNextFollowUp = (next_follow_up && next_follow_up !== '') ? next_follow_up : null;
  }

  const isChangingToWon = stage === 'won' && existing.stage !== 'won';
  const isChangingToLost = stage === 'lost' && existing.stage !== 'lost';
  const newStage = stage !== undefined ? stage : existing.stage;
  const newDealValue = isChangingToWon
    ? (deal_value || expected_value || existing.deal_value || existing.expected_value || 0)
    : (deal_value !== undefined ? deal_value : existing.deal_value);

  const { rows } = await query(
    `UPDATE crm_schema.leads
        SET stage          = $2::lead_stage,
            assigned_to    = $3,
            expected_value = COALESCE($4, expected_value),
            next_follow_up = $5,
            lost_reason    = COALESCE($6, lost_reason),
            deal_value     = $7,
            tags           = COALESCE($8, tags),
            urgency        = COALESCE($9, urgency),
            budget_range   = COALESCE($10, budget_range),
            requirements   = COALESCE($11, requirements),
            company        = COALESCE($12, company),
            services_needed= COALESCE($13, services_needed),
            phone          = COALESCE($14, phone),
            designation    = COALESCE($15, designation),
            website        = COALESCE($16, website),
            lead_score     = COALESCE($17, lead_score),
            first_name     = $18,
            last_name      = $19,
            email          = COALESCE($20, email),
            won_at         = CASE WHEN $21 THEN NOW() ELSE won_at END,
            lost_at        = CASE WHEN $22 THEN NOW() ELSE lost_at END,
            updated_at     = NOW()
      WHERE id=$1 AND deleted_at IS NULL
      RETURNING *`,
    [
      req.params.id,
      newStage,
      assigned_to !== undefined ? (assigned_to || null) : existing.assigned_to,
      expected_value !== undefined ? expected_value : existing.expected_value,
      newNextFollowUp,
      lost_reason !== undefined ? lost_reason : existing.lost_reason,
      newDealValue,
      tags !== undefined ? tags : existing.tags,
      urgency !== undefined ? urgency : existing.urgency,
      budget_range !== undefined ? budget_range : existing.budget_range,
      requirements !== undefined ? requirements : existing.requirements,
      company !== undefined ? company : existing.company,
      services_needed !== undefined ? services_needed : existing.services_needed,
      phone !== undefined ? phone : existing.phone,
      designation !== undefined ? designation : existing.designation,
      website !== undefined ? website : existing.website,
      lead_score !== undefined ? lead_score : existing.lead_score,
      newFirstName,
      newLastName,
      email,
      isChangingToWon,
      isChangingToLost,
    ]
  );
  const updatedLead = rows[0];

  // If stage changed, log activity
  if (stage && stage !== existing.stage) {
    await query(
      `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description)
       VALUES ($1, $2, 'stage_change', 'Stage updated', 'Stage changed from ' || $3 || ' to ' || $4)`,
      [req.params.id, req.userId, existing.stage, stage]
    );
  }

  // Record audit log
  await recordAuditLog({
    req,
    action: 'UPDATE',
    resourceType: 'lead',
    resourceId: req.params.id,
    oldData: existing,
    newData: updatedLead,
  });

  return success(res, updatedLead);
}));

// Follow-up actions (complete, reschedule, schedule)
router.post('/leads/:id/follow-up', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { action, next_follow_up, activity_type = 'call', subject, description, outcome } = req.body;

  const leadRes = await query(`SELECT * FROM crm_schema.leads WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
  if (!leadRes.rows.length) throw new AppError('Lead not found', 404);

  if (action === 'complete') {
    // Log completion activity
    await query(
      `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description, outcome, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.params.id, req.userId, activity_type, subject || 'Follow-up completed', description || null, outcome || null]
    );

    // Update lead follow-up
    const newNext = next_follow_up ? next_follow_up : null;
    const { rows } = await query(
      `UPDATE crm_schema.leads
          SET next_follow_up = $2,
              last_contact_at = NOW(),
              follow_up_count = follow_up_count + 1,
              updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [req.params.id, newNext]
    );
    return success(res, rows[0], 'Follow-up marked as completed');
  } else {
    // Schedule or reschedule
    if (!next_follow_up) throw new AppError('next_follow_up date required', 400);
    const { rows } = await query(
      `UPDATE crm_schema.leads
          SET next_follow_up = $2,
              updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [req.params.id, next_follow_up]
    );
    await query(
      `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description)
       VALUES ($1, $2, 'task', 'Follow-up scheduled', 'Next follow-up set for ' || $3)`,
      [req.params.id, req.userId, new Date(next_follow_up).toLocaleString()]
    );
    return success(res, rows[0], 'Follow-up scheduled');
  }
}));

// DELETE /crm/leads/:id (soft)
router.delete('/leads/:id', requirePermission('lead.delete'), asyncHandler(async (req, res) => {
  const currentLeadRes = await query(`SELECT * FROM crm_schema.leads WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
  if (!currentLeadRes.rows.length) throw new AppError('Lead not found', 404);
  const existing = currentLeadRes.rows[0];

  await query(`UPDATE crm_schema.leads SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);

  await query(
    `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description)
     VALUES ($1, $2, 'deletion', 'Lead deleted', 'Lead removed from active pipeline')`,
    [req.params.id, req.userId]
  );

  await recordAuditLog({
    req,
    action: 'DELETE',
    resourceType: 'lead',
    resourceId: req.params.id,
    oldData: existing,
  });

  return noContent(res);
}));

// Convert lead to client
router.post('/leads/:id/convert', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT crm_schema.fn_convert_lead_to_client($1, $2) AS client_id`,
    [req.params.id, req.userId]
  );
  return success(res, { client_id: rows[0]?.client_id }, 'Lead converted to client');
}));

// Assign lead
router.post('/leads/:id/assign', requirePermission('lead.assign'), asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) throw new AppError('user_id required');
  const { rows } = await query(
    `UPDATE crm_schema.leads SET assigned_to=$1, assigned_at=NOW() WHERE id=$2 RETURNING *`,
    [user_id, req.params.id]
  );
  if (!rows.length) throw new AppError('Lead not found', 404);
  // Log activity
  await query(
    `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject)
     VALUES ($1,$2,'assignment','Lead assigned')`,
    [req.params.id, req.userId]
  );
  return success(res, rows[0]);
}));

// ── Lead Notes ───────────────────────────────────────────────
router.get('/leads/:id/notes', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT n.*, u.display_name AS author_name FROM crm_schema.lead_notes n
      LEFT JOIN auth_schema.users u ON n.author_id=u.id
     WHERE n.lead_id=$1 ORDER BY n.is_pinned DESC, n.created_at DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/leads/:id/notes', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { content, is_pinned } = req.body;
  if (!content) throw new AppError('content required');
  const { rows } = await query(
    `INSERT INTO crm_schema.lead_notes (lead_id, author_id, content, is_pinned) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.userId, content, is_pinned || false]
  );
  return created(res, rows[0]);
}));

router.patch('/leads/:leadId/notes/:noteId', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { content, is_pinned } = req.body;
  const { rows } = await query(
    `UPDATE crm_schema.lead_notes
        SET content   = COALESCE($3, content),
            is_pinned = COALESCE($4, is_pinned)
      WHERE id=$1 AND lead_id=$2 AND author_id=$5 RETURNING *`,
    [req.params.noteId, req.params.leadId, content, is_pinned, req.userId]
  );
  if (!rows.length) throw new AppError('Note not found', 404);
  return success(res, rows[0]);
}));

router.delete('/leads/:leadId/notes/:noteId', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM crm_schema.lead_notes WHERE id=$1 AND lead_id=$2`, [req.params.noteId, req.params.leadId]);
  return noContent(res);
}));

// ── Lead Activities ───────────────────────────────────────────
router.get('/leads/:id/activities', requirePermission('lead.read'), paginate, asyncHandler(async (req, res) => {
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT a.*, u.display_name AS actor_name FROM crm_schema.lead_activities a
        LEFT JOIN auth_schema.users u ON a.actor_id=u.id
       WHERE a.lead_id=$1 ORDER BY a.occurred_at DESC LIMIT $2 OFFSET $3`,
      [req.params.id, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.lead_activities WHERE lead_id=$1`, [req.params.id]),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/leads/:id/activities', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { activity_type, subject, description, outcome, duration_min, occurred_at, metadata } = req.body;
  if (!activity_type) throw new AppError('activity_type required');
  const { rows } = await query(
    `INSERT INTO crm_schema.lead_activities
       (lead_id, actor_id, activity_type, subject, description, outcome, duration_min, occurred_at, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
     RETURNING *`,
    [req.params.id, req.userId, activity_type, subject, description, outcome,
     duration_min, occurred_at || new Date(), JSON.stringify(metadata || {})]
  );
  // Update last_contact_at
  await query(`UPDATE crm_schema.leads SET last_contact_at=NOW(), follow_up_count=follow_up_count+1 WHERE id=$1`, [req.params.id]);
  return created(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  MEETINGS
// ════════════════════════════════════════════════════════════
router.get('/meetings', requirePermission('meeting.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, host_id, from_date, to_date } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (status)    { conditions.push(`m.status=$${idx}::meeting_status`); params.push(status); idx++; }
  if (host_id)   { conditions.push(`m.host_id=$${idx}`);   params.push(host_id); idx++; }
  if (from_date) { conditions.push(`m.scheduled_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)   { conditions.push(`m.scheduled_at <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT m.*, l.full_name AS lead_name, l.email AS lead_email,
              u.display_name AS host_name
         FROM crm_schema.meetings m
         LEFT JOIN crm_schema.leads l ON m.lead_id=l.id
         LEFT JOIN auth_schema.users u ON m.host_id=u.id
         ${where}
        ORDER BY m.scheduled_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.meetings m ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/meetings/:id', requirePermission('meeting.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT m.*, l.full_name AS lead_name, u.display_name AS host_name
       FROM crm_schema.meetings m
       LEFT JOIN crm_schema.leads l ON m.lead_id=l.id
       LEFT JOIN auth_schema.users u ON m.host_id=u.id
      WHERE m.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Meeting not found', 404);
  const attendees = await query(`SELECT * FROM crm_schema.meeting_attendees WHERE meeting_id=$1`, [req.params.id]);
  return success(res, { ...rows[0], attendees: attendees.rows });
}));

router.post('/meetings', requirePermission('meeting.manage'), asyncHandler(async (req, res) => {
  const { lead_id, client_id, title, agenda, meeting_type, scheduled_at, duration_min,
          timezone, meeting_url, location, attendees } = req.body;
  if (!title || !scheduled_at) throw new AppError('title and scheduled_at required');

  const { rows } = await withTransaction(async (client) => {
    const meetRes = await client.query(
      `INSERT INTO crm_schema.meetings
         (lead_id, client_id, host_id, title, agenda, meeting_type, scheduled_at, duration_min, timezone, meeting_url, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [lead_id || null, client_id || null, req.userId, title, agenda, meeting_type || 'video_call',
       scheduled_at, duration_min || 30, timezone || 'UTC', meeting_url, location]
    );
    const meeting = meetRes.rows[0];

    if (attendees && attendees.length) {
      for (const att of attendees) {
        await client.query(
          `INSERT INTO crm_schema.meeting_attendees (meeting_id, email, name, user_id)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [meeting.id, att.email, att.name, att.user_id || null]
        );
      }
    }

    if (lead_id) {
      await client.query(
        `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, metadata)
         VALUES ($1,$2,'meeting','Meeting scheduled',$3::jsonb)`,
        [lead_id, req.userId, JSON.stringify({ meeting_id: meeting.id, scheduled_at })]
      );
    }
    return meetRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/meetings/:id', requirePermission('meeting.manage'), asyncHandler(async (req, res) => {
  const { status, notes, outcome, recording_url, completed_at, cancelled_at, cancel_reason } = req.body;
  const { rows } = await query(
    `UPDATE crm_schema.meetings
        SET status       = COALESCE($2::meeting_status, status),
            notes        = COALESCE($3, notes),
            outcome      = COALESCE($4, outcome),
            recording_url= COALESCE($5, recording_url),
            completed_at = COALESCE($6, completed_at),
            cancelled_at = COALESCE($7, cancelled_at),
            cancel_reason= COALESCE($8, cancel_reason)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, notes, outcome, recording_url, completed_at, cancelled_at, cancel_reason]
  );
  if (!rows.length) throw new AppError('Meeting not found', 404);
  return success(res, rows[0]);
}));

router.delete('/meetings/:id', requirePermission('meeting.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE crm_schema.meetings SET status='cancelled', cancelled_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  PROPOSALS
// ════════════════════════════════════════════════════════════
router.get('/proposals', requirePermission('proposal.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, lead_id, client_id } = req.query;
  const conditions = [];
  const params     = [];
  let idx = 1;

  if (status)    { conditions.push(`p.status=$${idx}::proposal_status`); params.push(status); idx++; }
  if (lead_id)   { conditions.push(`p.lead_id=$${idx}`);   params.push(lead_id);   idx++; }
  if (client_id) { conditions.push(`p.client_id=$${idx}`); params.push(client_id); idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.*, l.full_name AS lead_name, u.display_name AS created_by_name
         FROM crm_schema.proposals p
         LEFT JOIN crm_schema.leads l ON p.lead_id=l.id
         LEFT JOIN auth_schema.users u ON p.created_by=u.id
         ${where}
        ORDER BY p.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.proposals p ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/proposals/:id', requirePermission('proposal.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, l.full_name AS lead_name, l.email AS lead_email,
            u.display_name AS created_by_name
       FROM crm_schema.proposals p
       LEFT JOIN crm_schema.leads l ON p.lead_id=l.id
       LEFT JOIN auth_schema.users u ON p.created_by=u.id
      WHERE p.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Proposal not found', 404);
  return success(res, rows[0]);
}));

router.post('/proposals', requirePermission('proposal.manage'), asyncHandler(async (req, res) => {
  const { lead_id, client_id, title, summary, scope, deliverables, timeline, milestones,
          total_amount, currency, tax_percent, discount_percent, line_items, terms,
          validity_days, notes } = req.body;
  if (!title) throw new AppError('title required');

  const { rows } = await query(
    `INSERT INTO crm_schema.proposals
       (lead_id, client_id, created_by, title, summary, scope, deliverables, timeline, milestones,
        total_amount, currency, tax_percent, discount_percent, line_items, terms, validity_days, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13,$14::jsonb,$15,$16,$17)
     RETURNING *`,
    [lead_id || null, client_id || null, req.userId, title, summary, scope,
     JSON.stringify(deliverables || []), JSON.stringify(timeline || {}), JSON.stringify(milestones || []),
     total_amount || 0, currency || 'USD', tax_percent || 0, discount_percent || 0,
     JSON.stringify(line_items || []), terms, validity_days || 30, notes]
  );
  return created(res, rows[0]);
}));

router.patch('/proposals/:id', requirePermission('proposal.manage'), asyncHandler(async (req, res) => {
  const { status, total_amount, line_items, sent_at, viewed_at, accepted_at, rejected_at, reject_reason, pdf_url } = req.body;
  const { rows } = await query(
    `UPDATE crm_schema.proposals
        SET status       = COALESCE($2::proposal_status, status),
            total_amount = COALESCE($3, total_amount),
            line_items   = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE line_items END,
            sent_at      = COALESCE($5, sent_at),
            viewed_at    = COALESCE($6, viewed_at),
            accepted_at  = COALESCE($7, accepted_at),
            rejected_at  = COALESCE($8, rejected_at),
            reject_reason= COALESCE($9, reject_reason),
            pdf_url      = COALESCE($10, pdf_url)
      WHERE id=$1 RETURNING *`,
    [req.params.id, status, total_amount, line_items ? JSON.stringify(line_items) : null,
     sent_at, viewed_at, accepted_at, rejected_at, reject_reason, pdf_url]
  );
  if (!rows.length) throw new AppError('Proposal not found', 404);
  return success(res, rows[0]);
}));

router.post('/proposals/:id/send', requirePermission('proposal.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE crm_schema.proposals SET status='sent', sent_at=NOW() WHERE id=$1 AND status='draft' RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Proposal not found or not in draft status', 404);
  return success(res, rows[0], 'Proposal sent');
}));

router.delete('/proposals/:id', requirePermission('proposal.manage'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM crm_schema.proposals WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  CRM ACCOUNTS
// ════════════════════════════════════════════════════════════
router.get('/accounts', requirePermission('lead.read'), paginate, asyncHandler(async (req, res) => {
  const { search, is_client } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (search)    { conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (is_client !== undefined) { conditions.push(`is_client=$${idx}`); params.push(is_client === 'true'); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM crm_schema.accounts ${where} ORDER BY name LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.accounts ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/accounts/:id', requirePermission('lead.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM crm_schema.accounts WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Account not found', 404);
  const contacts = await query(`SELECT * FROM crm_schema.contacts WHERE account_id=$1 ORDER BY is_primary DESC`, [req.params.id]);
  return success(res, { ...rows[0], contacts: contacts.rows });
}));

router.post('/accounts', requirePermission('lead.create'), asyncHandler(async (req, res) => {
  const { name, website, industry, company_size, country, city, phone, email,
          linkedin_url, description, tags } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO crm_schema.accounts
       (name, website, industry, company_size, country, city, phone, email, linkedin_url, description, tags, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [name, website, industry, company_size, country, city, phone, email,
     linkedin_url, description, tags || [], req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/accounts/:id', requirePermission('lead.edit'), asyncHandler(async (req, res) => {
  const { name, website, industry, description, tags, is_client } = req.body;
  const { rows } = await query(
    `UPDATE crm_schema.accounts
        SET name      = COALESCE($2, name),
            website   = COALESCE($3, website),
            industry  = COALESCE($4, industry),
            description=COALESCE($5, description),
            tags      = COALESCE($6, tags),
            is_client = COALESCE($7, is_client)
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, website, industry, description, tags, is_client]
  );
  if (!rows.length) throw new AppError('Account not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  CRM CONTACTS
// ════════════════════════════════════════════════════════════
router.get('/contacts', requirePermission('lead.read'), paginate, asyncHandler(async (req, res) => {
  const { account_id, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (account_id) { conditions.push(`account_id=$${idx}`); params.push(account_id); idx++; }
  if (search) { conditions.push(`(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataRes, countRes] = await Promise.all([
    query(`SELECT * FROM crm_schema.contacts ${where} ORDER BY is_primary DESC, created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]),
    query(`SELECT COUNT(*)::int AS count FROM crm_schema.contacts ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.post('/contacts', requirePermission('lead.create'), asyncHandler(async (req, res) => {
  const { account_id, first_name, last_name, email, phone, designation, linkedin_url, is_primary } = req.body;
  if (!first_name || !last_name) throw new AppError('first_name and last_name required');
  const { rows } = await query(
    `INSERT INTO crm_schema.contacts (account_id, first_name, last_name, email, phone, designation, linkedin_url, is_primary, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [account_id || null, first_name, last_name, email, phone, designation, linkedin_url, is_primary || false, req.userId]
  );
  return created(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  PIPELINES
// ════════════════════════════════════════════════════════════
router.get('/pipelines', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM crm_schema.pipelines ORDER BY is_default DESC, name`);
  for (const pipeline of rows) {
    const stages = await query(`SELECT * FROM crm_schema.pipeline_stages WHERE pipeline_id=$1 ORDER BY sort_order`, [pipeline.id]);
    pipeline.stages = stages.rows;
  }
  return success(res, rows);
}));

router.post('/pipelines', requirePermission('pipeline.read'), asyncHandler(async (req, res) => {
  const { name, description, stages = [] } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await withTransaction(async (client) => {
    const pipeRes = await client.query(
      `INSERT INTO crm_schema.pipelines (name, description) VALUES ($1,$2) RETURNING *`,
      [name, description]
    );
    const pipeline = pipeRes.rows[0];
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      await client.query(
        `INSERT INTO crm_schema.pipeline_stages (pipeline_id, name, slug, color, probability, sort_order, is_won, is_lost)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [pipeline.id, s.name, s.slug || generatePublicId(), s.color, s.probability || 0, i, s.is_won || false, s.is_lost || false]
      );
    }
    return pipeRes.rows;
  });
  return created(res, rows[0]);
}));

module.exports = router;
