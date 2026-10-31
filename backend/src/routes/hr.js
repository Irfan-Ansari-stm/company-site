// src/routes/hr.js  — HR / Recruitment
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse } = require('../middleware/common');
const { generateSlug, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Guard against client role accessing HR module
const blockClientFromHR = (req, res, next) => {
  if (req.user?.role === 'client') {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Access to module 'hr' is disabled for client accounts"
    });
  }
  next();
};

// ── HR Statistics ─────────────────────────────────────────────
router.get('/stats', authenticate, blockClientFromHR, asyncHandler(async (req, res) => {
  const [jobsRes, appsRes, teamRes] = await Promise.all([
    query(`SELECT COUNT(*)::bigint AS count FROM careers_schema.jobs WHERE is_published=TRUE AND deleted_at IS NULL`),
    query(`SELECT COUNT(*)::bigint AS count FROM careers_schema.applications`),
    query(`SELECT COUNT(*)::bigint AS count FROM system_schema.team_members WHERE is_active=TRUE`)
  ]);

  return success(res, {
    open_positions: parseInt(jobsRes.rows[0]?.count || 0),
    total_applications: parseInt(appsRes.rows[0]?.count || 0),
    total_team: parseInt(teamRes.rows[0]?.count || 0),
  });
}));

// ── Job Departments ──────────────────────────────────────────
router.get('/departments', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT id, name, slug, head_id, created_at FROM careers_schema.departments ORDER BY name`);
  return success(res, rows);
}));

router.post('/departments', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { name, slug, head_id } = req.body;
  if (!name) throw new AppError('name required');
  const { rows } = await query(
    `INSERT INTO careers_schema.departments (name, slug, head_id) VALUES ($1,$2,$3) RETURNING *`,
    [name, slug || generateSlug(name), head_id || null]
  );
  return created(res, rows[0]);
}));

// ── Job Openings ──────────────────────────────────────────────
router.get('/jobs', paginate, asyncHandler(async (req, res) => {
  const { department_id, employment_type, location_type, is_featured, is_active, search } = req.query;
  const conditions = ['j.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  const isPublic = !req.user || ['client','candidate'].includes(req.user?.role);
  if (isPublic) conditions.push(`j.is_published=TRUE`);
  else if (is_active !== undefined) { conditions.push(`j.is_published=$${idx}`); params.push(is_active === 'true'); idx++; }

  if (department_id)   { conditions.push(`j.department_id=$${idx}`);          params.push(department_id); idx++; }
  if (employment_type) { conditions.push(`j.job_type::text=$${idx}`); params.push(employment_type); idx++; }
  if (location_type === 'remote') conditions.push(`j.is_remote=TRUE`);
  if (location_type === 'hybrid') conditions.push(`j.is_hybrid=TRUE`);
  if (is_featured !== undefined) { conditions.push(`j.is_urgent=$${idx}`); params.push(is_featured === 'true'); idx++; }
  if (search) {
    conditions.push(`(j.title ILIKE $${idx} OR d.name ILIKE $${idx} OR j.location ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT j.id, j.title, j.slug, j.description, j.department_id,
              j.job_type AS employment_type,
              CASE WHEN j.is_remote THEN 'remote' WHEN j.is_hybrid THEN 'hybrid' ELSE 'on_site' END AS location_type,
              j.location, j.salary_min, j.salary_max, j.currency,
              j.experience_years AS experience_min,
              j.experience_years AS experience_max,
              j.is_urgent AS is_featured,
              j.is_published AS is_active,
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
    query(`SELECT COUNT(*) FROM careers_schema.jobs j LEFT JOIN careers_schema.departments d ON j.department_id=d.id WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/jobs/:slugOrId', asyncHandler(async (req, res) => {
  const byId  = isUUID(req.params.slugOrId);
  const { rows } = await query(
    `SELECT j.*,
            j.job_type AS employment_type,
            CASE WHEN j.is_remote THEN 'remote' WHEN j.is_hybrid THEN 'hybrid' ELSE 'on_site' END AS location_type,
            j.is_published AS is_active,
            d.name AS department_name
       FROM careers_schema.jobs j
       LEFT JOIN careers_schema.departments d ON j.department_id=d.id
      WHERE j.${byId ? 'id' : 'slug'}=$1 AND j.deleted_at IS NULL`,
    [req.params.slugOrId]
  );
  if (!rows.length) throw new AppError('Job opening not found', 404);
  return success(res, rows[0]);
}));

router.post('/jobs', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { department_id, title, slug, description, responsibilities, requirements, nice_to_have,
          employment_type, location_type, location, salary_min, salary_max, currency,
          experience_min, positions, is_featured, closes_at, benefits } = req.body;
  if (!title) throw new AppError('title required');

  const isRemote = location_type === 'remote';
  const isHybrid = location_type === 'hybrid';

  const { rows } = await query(
    `INSERT INTO careers_schema.jobs
       (department_id, title, slug, description, responsibilities, requirements, nice_to_have,
        job_type, is_remote, is_hybrid, location, salary_min, salary_max, currency,
        experience_years, openings, is_urgent, apply_by, benefits, is_published, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::job_type,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,TRUE,$20)
     RETURNING *`,
    [department_id || null, title, slug || generateSlug(title), description || '',
     responsibilities ? JSON.stringify(responsibilities) : '[]',
     requirements ? JSON.stringify(requirements) : '[]',
     nice_to_have ? JSON.stringify(nice_to_have) : '[]',
     employment_type || 'full_time', isRemote, isHybrid, location || 'Remote',
     salary_min ? parseFloat(salary_min) : null, salary_max ? parseFloat(salary_max) : null,
     currency || 'USD', experience_min ? parseInt(experience_min) : 0,
     positions ? parseInt(positions) : 1, is_featured || false, closes_at || null,
     JSON.stringify(benefits || []), req.userId]
  );
  return created(res, rows[0]);
}));

router.patch('/jobs/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { title, description, is_active, is_featured, salary_min, salary_max, positions, closes_at,
          department_id, employment_type, location_type, location } = req.body;

  let isRemote = undefined;
  let isHybrid = undefined;
  if (location_type !== undefined) {
    isRemote = location_type === 'remote';
    isHybrid = location_type === 'hybrid';
  }

  const { rows } = await query(
    `UPDATE careers_schema.jobs
        SET title         = COALESCE($2, title),
            description   = COALESCE($3, description),
            is_published  = COALESCE($4, is_published),
            is_urgent     = COALESCE($5, is_urgent),
            salary_min    = COALESCE($6, salary_min),
            salary_max    = COALESCE($7, salary_max),
            openings      = COALESCE($8, openings),
            apply_by      = COALESCE($9, apply_by),
            department_id = COALESCE($10, department_id),
            job_type      = COALESCE($11::job_type, job_type),
            is_remote     = COALESCE($12, is_remote),
            is_hybrid     = COALESCE($13, is_hybrid),
            location      = COALESCE($14, location),
            updated_at    = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, title, description, is_active, is_featured, salary_min, salary_max, positions, closes_at,
     department_id, employment_type, isRemote, isHybrid, location]
  );
  if (!rows.length) throw new AppError('Job not found', 404);
  return success(res, rows[0]);
}));

router.delete('/jobs/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE careers_schema.jobs SET deleted_at=NOW(), is_published=FALSE, updated_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ── Applications ──────────────────────────────────────────────
router.get('/applications', authenticate, blockClientFromHR, requirePermission('hr.manage'), paginate, asyncHandler(async (req, res) => {
  const { job_id, stage, from_date, to_date, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (job_id)   { conditions.push(`a.job_id=$${idx}`); params.push(job_id); idx++; }
  if (stage)    { conditions.push(`a.stage::text=$${idx}`); params.push(stage); idx++; }
  if (from_date){ conditions.push(`a.applied_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)  { conditions.push(`a.applied_at <= $${idx}`); params.push(to_date); idx++; }
  if (search) {
    conditions.push(`(c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx} OR c.email ILIKE $${idx} OR j.title ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT a.*,
              c.first_name, c.last_name, c.email, c.phone,
              c.current_title AS current_company, c.years_exp AS experience_years,
              c.linkedin_url, c.source,
              j.title AS job_title, j.department_id,
              d.name AS department_name
         FROM careers_schema.applications a
         JOIN careers_schema.jobs j ON a.job_id=j.id
         LEFT JOIN careers_schema.candidates c ON a.candidate_id=c.id
         LEFT JOIN careers_schema.departments d ON j.department_id=d.id
         ${where}
        ORDER BY a.applied_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM careers_schema.applications a JOIN careers_schema.jobs j ON a.job_id=j.id LEFT JOIN careers_schema.candidates c ON a.candidate_id=c.id ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/applications/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT a.*,
            c.first_name, c.last_name, c.email, c.phone,
            c.current_title AS current_company, c.years_exp AS experience_years,
            c.linkedin_url, c.source,
            j.title AS job_title
       FROM careers_schema.applications a
       JOIN careers_schema.jobs j ON a.job_id=j.id
       LEFT JOIN careers_schema.candidates c ON a.candidate_id=c.id
      WHERE a.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Application not found', 404);

  const [interviews, notes] = await Promise.all([
    query(`SELECT i.*, u.display_name AS interviewer_name FROM careers_schema.interviews i
            LEFT JOIN auth_schema.users u ON i.interviewer_id=u.id WHERE i.application_id=$1 ORDER BY i.scheduled_at`, [req.params.id]),
    query(`SELECT n.*, u.display_name AS author_name FROM careers_schema.application_notes n
            JOIN auth_schema.users u ON n.author_id=u.id WHERE n.application_id=$1 ORDER BY n.created_at DESC`, [req.params.id]),
  ]);
  return success(res, { ...rows[0], interviews: interviews.rows, notes: notes.rows });
}));

// Public job application submission
router.post('/jobs/:jobId/apply', asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, cover_letter, resume_url,
          linkedin_url, portfolio_url, experience_years, current_company, source } = req.body;
  if (!first_name || !last_name || !email) throw new AppError('first_name, last_name, email required');

  const { rows: jobRows } = await query(
    `SELECT id FROM careers_schema.jobs WHERE id=$1 AND is_published=TRUE AND deleted_at IS NULL`,
    [req.params.jobId]
  );
  if (!jobRows.length) throw new AppError('Job not found or no longer active', 404);

  const application = await withTransaction(async (client) => {
    // Find or create candidate
    let candidateId;
    const candRes = await client.query(`SELECT id FROM careers_schema.candidates WHERE email=$1`, [email]);
    if (candRes.rows.length) {
      candidateId = candRes.rows[0].id;
    } else {
      const newCand = await client.query(
        `INSERT INTO careers_schema.candidates
           (first_name, last_name, email, phone, linkedin_url, portfolio_url, current_title, years_exp, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [first_name, last_name, email, phone || null, linkedin_url || null,
         portfolio_url || null, current_company || null, experience_years ? parseInt(experience_years) : 0, source || 'website']
      );
      candidateId = newCand.rows[0].id;
    }

    const appRes = await client.query(
      `INSERT INTO careers_schema.applications
         (job_id, candidate_id, cover_letter, resume_url, portfolio_url, stage)
       VALUES ($1,$2,$3,$4,$5,'applied') RETURNING id, applied_at`,
      [req.params.jobId, candidateId, cover_letter || null, resume_url || null, portfolio_url || null]
    );

    await client.query(`UPDATE careers_schema.jobs SET applications_count = applications_count + 1 WHERE id=$1`, [req.params.jobId]);

    return appRes.rows[0];
  });

  return created(res, application, 'Application submitted successfully');
}));

router.patch('/applications/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { stage, rating, rejection_reason } = req.body;
  const { rows } = await query(
    `UPDATE careers_schema.applications
        SET stage            = COALESCE($2::application_stage, stage),
            rating           = COALESCE($3, rating),
            rejection_reason = COALESCE($4, rejection_reason),
            updated_at       = NOW()
      WHERE id=$1 RETURNING *`,
    [req.params.id, stage, rating, rejection_reason]
  );
  if (!rows.length) throw new AppError('Application not found', 404);
  return success(res, rows[0]);
}));

// Interviews
router.post('/applications/:id/interviews', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { interviewer_id, round, interview_type, scheduled_at, duration_min, meeting_url } = req.body;
  if (!scheduled_at) throw new AppError('scheduled_at required');
  const { rows } = await query(
    `INSERT INTO careers_schema.interviews
       (application_id, interviewer_id, round, interview_type, scheduled_at, duration_min, meeting_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled') RETURNING *`,
    [req.params.id, interviewer_id || req.userId, round || 1, interview_type || 'video',
     scheduled_at, duration_min || 60, meeting_url]
  );
  return created(res, rows[0]);
}));

router.patch('/applications/:id/interviews/:intId', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { status, feedback, rating, completed_at } = req.body;
  const { rows } = await query(
    `UPDATE careers_schema.interviews
        SET status      = COALESCE($3, status),
            feedback    = COALESCE($4, feedback),
            rating      = COALESCE($5, rating),
            completed_at= COALESCE($6, completed_at)
      WHERE id=$1 AND application_id=$2 RETURNING *`,
    [req.params.intId, req.params.id, status, feedback, rating, completed_at]
  );
  if (!rows.length) throw new AppError('Interview not found', 404);
  return success(res, rows[0]);
}));

// Application Notes
router.post('/applications/:id/notes', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new AppError('content required');
  const { rows } = await query(
    `INSERT INTO careers_schema.application_notes (application_id, author_id, content) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.userId, content]
  );
  return created(res, rows[0]);
}));

// ── Team Members (public-facing & dashboard) ────────────────
router.get('/team', asyncHandler(async (req, res) => {
  const { department, is_featured, is_active, search } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (is_active !== undefined) {
    conditions.push(`t.is_active=$${idx}`);
    params.push(is_active === 'true');
    idx++;
  } else if (!req.user || ['client', 'candidate'].includes(req.user?.role)) {
    conditions.push(`t.is_active=TRUE`);
  }

  if (department) { conditions.push(`t.department=$${idx}`); params.push(department); idx++; }
  if (is_featured !== undefined) { conditions.push(`t.is_featured=$${idx}`); params.push(is_featured === 'true'); idx++; }
  if (search) {
    conditions.push(`(t.name ILIKE $${idx} OR t.designation ILIKE $${idx} OR t.department ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
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

router.post('/team', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { user_id, name, designation, department, bio, expertise,
          social_links, is_featured, display_order } = req.body;
  if (!name && !designation) throw new AppError('name and designation required');
  const { rows } = await query(
    `INSERT INTO system_schema.team_members
       (user_id, name, designation, department, bio, expertise,
        social_links, is_featured, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING *`,
    [user_id || null, name || 'Team Member', designation, department || 'Engineering',
     bio || '', expertise || [], JSON.stringify(social_links || {}),
     is_featured || false, display_order || 0]
  );
  return created(res, rows[0]);
}));

router.patch('/team/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  const { name, designation, department, bio, expertise, is_featured, display_order, is_active } = req.body;
  const { rows } = await query(
    `UPDATE system_schema.team_members
        SET name          = COALESCE($2, name),
            designation   = COALESCE($3, designation),
            department    = COALESCE($4, department),
            bio           = COALESCE($5, bio),
            expertise     = COALESCE($6, expertise),
            is_featured   = COALESCE($7, is_featured),
            display_order = COALESCE($8, display_order),
            is_active     = COALESCE($9, is_active),
            updated_at    = NOW()
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, designation, department, bio, expertise, is_featured, display_order, is_active]
  );
  if (!rows.length) throw new AppError('Team member not found', 404);
  return success(res, rows[0]);
}));

router.delete('/team/:id', authenticate, blockClientFromHR, requirePermission('hr.manage'), asyncHandler(async (req, res) => {
  await query(`UPDATE system_schema.team_members SET is_active=FALSE, updated_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

module.exports = router;
