// src/routes/hr.js  — HR / Recruitment
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ── Job Departments ──────────────────────────────────────────
router.get('/departments', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT id, name, slug, head_id, created_at FROM careers_schema.departments ORDER BY name`);
  return success(res, rows);
}));

router.post('/departments', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { name, slug, description, head_id } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO hr_schema.departments (name, slug, description, head_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, slug || generateSlug(name), description, head_id || null]
  );
  return created(res, rows[0]);
}));

// ── Job Openings ──────────────────────────────────────────────
router.get('/jobs', paginate, asyncHandler(async (req, res) => {
  const { department_id, employment_type, location_type, is_featured, is_active } = req.query;
  const conditions = ['j.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  const isPublic = !req.user || ['client','candidate'].includes(req.user?.role);
  if (isPublic) conditions.push(`j.is_published=TRUE`);
  else if (is_active !== undefined) { conditions.push(`j.is_published=$${idx}`); params.push(is_active === 'true'); idx++; }

  if (department_id)   { conditions.push(`j.department_id=$${idx}`);          params.push(department_id); idx++; }
  if (employment_type) { conditions.push(`j.job_type=$${idx}::job_type`); params.push(employment_type); idx++; }
  if (location_type === 'remote') conditions.push(`j.is_remote=TRUE`);
  if (location_type === 'hybrid') conditions.push(`j.is_hybrid=TRUE`);
  if (is_featured !== undefined) { conditions.push(`j.is_urgent=$${idx}`);   params.push(is_featured === 'true'); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT j.id, j.title, j.slug,
              j.job_type AS employment_type,
              CASE WHEN j.is_remote THEN 'remote' WHEN j.is_hybrid THEN 'hybrid' ELSE 'on_site' END AS location_type,
              j.location, j.salary_min, j.salary_max, j.currency,
              j.experience_years AS experience_min,
              j.experience_years AS experience_max,
              j.is_urgent AS is_featured,
              j.openings AS positions,
              j.apply_by AS closes_at,
              j.created_at,
              d.name AS department_name,
              j.applications_count AS applicant_count
         FROM careers_schema.jobs j
         LEFT JOIN careers_schema.departments d ON j.department_id=d.id
        WHERE ${where}
        ORDER BY j.is_urgent DESC, j.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM careers_schema.jobs j WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/jobs/:slugOrId', asyncHandler(async (req, res) => {
  const byId  = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT j.*, d.name AS department_name, sm.meta_title, sm.meta_description
       FROM hr_schema.job_openings j
       LEFT JOIN hr_schema.departments d ON j.department_id=d.id
       LEFT JOIN cms_schema.seo_meta  sm ON j.seo_id=sm.id
      WHERE j.${byId ? 'id' : 'slug'}=$1 AND j.deleted_at IS NULL`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Job opening not found', 404);
  await query(`UPDATE hr_schema.job_openings SET view_count=view_count+1 WHERE id=$1`, [rows[0].id]);
  return success(res, rows[0]);
}));

router.post('/jobs', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { department_id, title, slug, description, responsibilities, requirements, nice_to_have,
          employment_type, location_type, location, salary_min, salary_max, currency,
          experience_min, experience_max, positions, is_featured, closes_at, benefits, tags } = req.body;
  if (!title) throw new AppError('title required');

  const { rows } = await query(
    `INSERT INTO hr_schema.job_openings
       (department_id, title, slug, description, responsibilities, requirements, nice_to_have,
        employment_type, location_type, location, salary_min, salary_max, currency,
        experience_min, experience_max, positions, is_featured, closes_at, benefits, tags, posted_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::employment_type,$9::location_type,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,$21)
     RETURNING *`,
    [department_id || null, title, slug || generateSlug(title), description,
     requirements ? JSON.stringify(responsibilities) : null,
     JSON.stringify(requirements || []), JSON.stringify(nice_to_have || []),
     employment_type || 'full_time', location_type || 'on_site', location,
     salary_min, salary_max, currency || 'USD', experience_min, experience_max,
     positions || 1, is_featured || false, closes_at || null,
     JSON.stringify(benefits || []), tags || [], req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/jobs/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { title, description, is_active, is_featured, salary_min, salary_max, positions, closes_at } = req.body;
  const { rows } = await query(
    `UPDATE hr_schema.job_openings
        SET title       = COALESCE($2, title),
            description = COALESCE($3, description),
            is_active   = COALESCE($4, is_active),
            is_featured = COALESCE($5, is_featured),
            salary_min  = COALESCE($6, salary_min),
            salary_max  = COALESCE($7, salary_max),
            positions   = COALESCE($8, positions),
            closes_at   = COALESCE($9, closes_at)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, title, description, is_active, is_featured, salary_min, salary_max, positions, closes_at]
  );
  if (!rows.length) throw new AppError('Job not found', 404);
  return success(res, rows[0]);
}));

router.delete('/jobs/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE hr_schema.job_openings SET deleted_at=NOW(), is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ── Applications ──────────────────────────────────────────────
router.get('/applications', authenticate, requirePermission('hr.manage'), paginate, asyncHandler(async (req, res) => {
  const { job_id, stage, from_date, to_date } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (job_id)   { conditions.push(`a.job_id=$${idx}`); params.push(job_id); idx++; }
  if (stage)    { conditions.push(`a.stage=$${idx}::application_stage`); params.push(stage); idx++; }
  if (from_date){ conditions.push(`a.applied_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)  { conditions.push(`a.applied_at <= $${idx}`); params.push(to_date); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT a.*, j.title AS job_title, j.department_id
         FROM hr_schema.applications a
         JOIN hr_schema.job_openings j ON a.job_id=j.id
         ${where}
        ORDER BY a.applied_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM hr_schema.applications a ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/applications/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT a.*, j.title AS job_title FROM hr_schema.applications a
      JOIN hr_schema.job_openings j ON a.job_id=j.id WHERE a.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Application not found', 404);
  const [interviews, notes] = await Promise.all([
    query(`SELECT i.*, u.display_name AS interviewer_name FROM hr_schema.interviews i
            LEFT JOIN auth_schema.users u ON i.interviewer_id=u.id WHERE i.application_id=$1 ORDER BY i.scheduled_at`, [req.params.id]),
    query(`SELECT n.*, u.display_name AS author_name FROM hr_schema.application_notes n
            JOIN auth_schema.users u ON n.author_id=u.id WHERE n.application_id=$1 ORDER BY n.created_at DESC`, [req.params.id]),
  ]);
  return success(res, { ...rows[0], interviews: interviews.rows, notes: notes.rows });
}));

// Public job application submission
router.post('/jobs/:jobId/apply', asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, cover_letter, resume_media_id,
          linkedin_url, portfolio_url, experience_years, current_company, source } = req.body;
  if (!first_name || !last_name || !email) throw new AppError('first_name, last_name, email required');
  if (!resume_media_id) throw new AppError('resume required');

  const { rows: jobRows } = await query(
    `SELECT id FROM hr_schema.job_openings WHERE id=$1 AND is_active=TRUE AND deleted_at IS NULL`,
    [req.params.jobId]
  );
  if (!jobRows.length) throw new AppError('Job not found or no longer active', 404);

  // Check for duplicate application
  const { rows: dupRows } = await query(
    `SELECT id FROM hr_schema.applications WHERE job_id=$1 AND email=$2`,
    [req.params.jobId, email]
  );
  if (dupRows.length) throw new AppError('You have already applied for this position');

  const { rows } = await query(
    `INSERT INTO hr_schema.applications
       (job_id, first_name, last_name, email, phone, cover_letter, resume_media_id,
        linkedin_url, portfolio_url, experience_years, current_company, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, email, applied_at`,
    [req.params.jobId, first_name, last_name, email, phone, cover_letter, resume_media_id,
     linkedin_url, portfolio_url, experience_years, current_company, source || 'website']
  );
  return created(res, rows[0], 'Application submitted successfully');
}));

router.patch('/applications/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { stage, rating, rejection_reason, hired_at } = req.body;
  const { rows } = await query(
    `UPDATE hr_schema.applications
        SET stage            = COALESCE($2::application_stage, stage),
            rating           = COALESCE($3, rating),
            rejection_reason = COALESCE($4, rejection_reason),
            hired_at         = COALESCE($5, hired_at)
      WHERE id=$1 RETURNING *`,
    [req.params.id, stage, rating, rejection_reason, hired_at]
  );
  if (!rows.length) throw new AppError('Application not found', 404);
  return success(res, rows[0]);
}));

// Interviews
router.post('/applications/:id/interviews', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { interviewer_id, round, interview_type, scheduled_at, duration_min, meeting_url, notes } = req.body;
  if (!scheduled_at) throw new AppError('scheduled_at required');
  const { rows } = await query(
    `INSERT INTO hr_schema.interviews
       (application_id, interviewer_id, round, interview_type, scheduled_at, duration_min, meeting_url, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.id, interviewer_id || req.userId, round || 1, interview_type || 'video',
     scheduled_at, duration_min || 60, meeting_url, notes]
  );
  return created(res, rows[0]);
}));

router.patch('/applications/:id/interviews/:intId', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { status, feedback, rating, completed_at } = req.body;
  const { rows } = await query(
    `UPDATE hr_schema.interviews
        SET status      = COALESCE($3::interview_status, status),
            feedback    = COALESCE($4, feedback),
            rating      = COALESCE($5, rating),
            completed_at= COALESCE($6, completed_at)
      WHERE id=$1 AND application_id=$2 RETURNING *`,
    [req.params.intId, req.params.id, status, req.body.feedback, req.body.rating, req.body.completed_at]
  );
  if (!rows.length) throw new AppError('Interview not found', 404);
  return success(res, rows[0]);
}));

// Application Notes
router.post('/applications/:id/notes', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new AppError('content required');
  const { rows } = await query(
    `INSERT INTO hr_schema.application_notes (application_id, author_id, content) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.userId, content]
  );
  return created(res, rows[0]);
}));

// ── Team Members (public-facing about/team page) ─────────────
router.get('/team', asyncHandler(async (req, res) => {
  const { department_id, is_featured } = req.query;
  const conditions = ['t.is_active=TRUE'];
  const params     = [];
  let   idx        = 1;
  if (department_id) { conditions.push(`t.department=$${idx}`); params.push(department_id); idx++; }
  if (is_featured !== undefined) { conditions.push(`t.is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  const where = conditions.join(' AND ');
  const { rows } = await query(
    `SELECT t.*, t.department AS department_name
       FROM system_schema.team_members t
      WHERE ${where}
      ORDER BY t.display_order ASC, t.joined_date ASC`,
    params
  );
  return success(res, rows);
}));

router.post('/team', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { user_id, department_id, designation, bio, expertise, certifications,
          social_links, is_featured, sort_order } = req.body;
  const { rows } = await query(
    `INSERT INTO hr_schema.team_members
       (user_id, department_id, designation, bio, expertise, certifications,
        social_links, is_featured, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING *`,
    [user_id || null, department_id || null, designation, bio, expertise || [],
     certifications || [], JSON.stringify(social_links || {}), is_featured || false, sort_order || 0]
  );
  return created(res, rows[0]);
}));

router.patch('/team/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { designation, bio, expertise, is_featured, sort_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE hr_schema.team_members
        SET designation = COALESCE($2, designation),
            bio         = COALESCE($3, bio),
            expertise   = COALESCE($4, expertise),
            is_featured = COALESCE($5, is_featured),
            sort_order  = COALESCE($6, sort_order),
            is_active   = COALESCE($7, is_active)
      WHERE id=$1 RETURNING *`,
    [req.params.id, designation, bio, expertise, is_featured, sort_order, is_active]
  );
  if (!rows.length) throw new AppError('Team member not found', 404);
  return success(res, rows[0]);
}));

router.delete('/team/:id', authenticate, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE hr_schema.team_members SET is_active=FALSE WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

module.exports = router;
