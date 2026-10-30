// src/routes/projects.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  HELPER: Recalculate Project Progress from Tasks
// ════════════════════════════════════════════════════════════
async function recalculateProjectProgress(projectId) {
  if (!projectId) return;
  try {
    const { rows: projRows } = await query(
      `SELECT status FROM client_schema.client_projects WHERE id = $1`,
      [projectId]
    );
    const status = projRows[0]?.status;

    const { rows } = await query(
      `SELECT
         COUNT(*) AS total_tasks,
         COUNT(*) FILTER (WHERE status = 'done') AS done_tasks
       FROM client_schema.tasks
       WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    const total = parseInt(rows[0]?.total_tasks || 0, 10);
    const done = parseInt(rows[0]?.done_tasks || 0, 10);
    const percent = total > 0
      ? Math.min(100, Math.max(0, Math.round((done / total) * 100)))
      : (status === 'completed' || status === 'delivered' ? 100 : 0);

    await query(
      `UPDATE client_schema.client_projects
          SET progress_percent = $1,
              updated_at = NOW()
        WHERE id = $2`,
      [percent, projectId]
    );
  } catch (err) {
    console.error('Error recalculating project progress:', err.message);
  }
}

// ════════════════════════════════════════════════════════════
//  PROJECTS ROUTER
// ════════════════════════════════════════════════════════════

// List projects
router.get('/', authenticate, requirePermission('project.read', 'project.manage'), paginate, asyncHandler(async (req, res) => {
  const { status, client_id, manager_id, priority, from_date, to_date, search } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'created_at', [
    'created_at', 'name', 'status', 'priority', 'budget', 'end_date', 'start_date', 'progress_percent'
  ]);

  const conditions = ['p.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (req.user?.role === 'client') {
    conditions.push(`p.client_id IN (SELECT id FROM client_schema.clients WHERE user_id=$${idx})`);
    params.push(req.userId);
    idx++;
  }

  if (status)     { conditions.push(`p.status = $${idx}`); params.push(status); idx++; }
  if (client_id)  { conditions.push(`p.client_id = $${idx}`);  params.push(client_id);  idx++; }
  if (manager_id) { conditions.push(`p.manager_id = $${idx}`); params.push(manager_id); idx++; }
  if (priority)   { conditions.push(`p.priority = $${idx}`); params.push(priority); idx++; }
  if (from_date)  { conditions.push(`p.start_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`p.end_date <= $${idx}`); params.push(to_date);   idx++; }
  if (search)     {
    conditions.push(`(p.name ILIKE $${idx} OR p.code ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.id, p.code, p.name, p.status, p.priority, p.health_status,
              p.start_date, p.end_date, p.budget, p.budget_used, p.currency,
              p.progress_percent, p.billable_hours, p.non_billable_hours,
              p.created_at, p.updated_at,
              u.display_name  AS manager_name,
              cl.company_name AS client_name
         FROM project_schema.projects p
         LEFT JOIN auth_schema.users   u  ON p.manager_id=u.id
         LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
        WHERE ${where}
        ORDER BY p.${col} ${dir}
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM project_schema.projects p WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// Projects summary metrics for dashboard cards
router.get('/summary', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `AND p.client_id IN (SELECT id FROM client_schema.clients WHERE user_id = '${req.userId}')`
    : '';

  const { rows } = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE p.status IN ('in_progress', 'development', 'design', 'testing', 'review')) AS in_progress,
       COUNT(*) FILTER (WHERE p.status = 'planning') AS planning,
       COUNT(*) FILTER (WHERE p.status IN ('completed', 'delivered')) AS completed,
       COUNT(*) FILTER (WHERE p.status = 'on_hold') AS on_hold,
       COUNT(*) FILTER (WHERE p.status = 'cancelled') AS cancelled,
       COUNT(*) FILTER (WHERE p.end_date < CURRENT_DATE AND p.status NOT IN ('completed', 'delivered', 'cancelled', 'on_hold')) AS overdue,
       COALESCE(ROUND(AVG(p.progress_percent)), 0) AS avg_progress
     FROM project_schema.projects p
    WHERE p.deleted_at IS NULL ${clientFilter}`
  );

  const row = rows[0] || {};
  return success(res, {
    total: parseInt(row.total || 0, 10),
    in_progress: parseInt(row.in_progress || 0, 10),
    planning: parseInt(row.planning || 0, 10),
    completed: parseInt(row.completed || 0, 10),
    on_hold: parseInt(row.on_hold || 0, 10),
    cancelled: parseInt(row.cancelled || 0, 10),
    overdue: parseInt(row.overdue || 0, 10),
    avg_progress: parseInt(row.avg_progress || 0, 10),
  });
}));

// Overdue projects
router.get('/overdue', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const conditions = [
    `p.end_date < CURRENT_DATE`,
    `p.status NOT IN ('completed','delivered','cancelled','on_hold')`,
    `p.deleted_at IS NULL`
  ];
  const params = [];

  if (req.user?.role === 'client') {
    conditions.push(`p.client_id IN (SELECT id FROM client_schema.clients WHERE user_id = $1)`);
    params.push(req.userId);
  }

  const { rows } = await query(
    `SELECT p.id, p.code, p.name, p.end_date, p.status, p.priority,
            u.display_name AS manager_name,
            cl.company_name AS client_name
       FROM project_schema.projects p
       LEFT JOIN auth_schema.users u ON p.manager_id=u.id
       LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.end_date ASC`,
    params
  );
  return success(res, rows);
}));

// Legacy dashboard endpoint
router.get('/dashboard', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `WHERE client_id IN (SELECT id FROM client_schema.clients WHERE user_id = '${req.userId}')`
    : '';
  const { rows } = await query(`SELECT * FROM project_schema.v_project_dashboard ${clientFilter} ORDER BY created_at DESC LIMIT 50`);
  return success(res, rows);
}));

// Project detail
router.get('/:id', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const byCode = !isUUID(req.params.id);
  const col    = byCode ? 'code' : 'id';

  const { rows } = await query(
    `SELECT p.*,
            u.display_name AS manager_name, u.avatar_url AS manager_avatar,
            cl.company_name AS client_name
       FROM project_schema.projects p
       LEFT JOIN auth_schema.users     u  ON p.manager_id=u.id
       LEFT JOIN client_schema.clients cl ON p.client_id=cl.id
      WHERE p.${col}=$1 AND p.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Project not found', 404);

  const proj = rows[0];

  // RBAC check: Client can only view their own project
  if (req.user?.role === 'client') {
    const { rows: clientCheck } = await query(
      `SELECT id FROM client_schema.clients WHERE id = $1 AND user_id = $2`,
      [proj.client_id, req.userId]
    );
    if (!clientCheck.length) {
      throw new AppError('Forbidden: You do not have access to this project', 403);
    }
  }

  const [members, milestones, taskSummary, recentActivity] = await Promise.all([
    query(
      `SELECT pm.*, u.display_name, u.avatar_url, u.email
         FROM client_schema.project_members pm
         JOIN auth_schema.users u ON pm.user_id=u.id
        WHERE pm.project_id=$1 AND pm.left_at IS NULL`,
      [proj.id]
    ),
    query(`SELECT * FROM client_schema.milestones WHERE project_id=$1 ORDER BY due_date ASC`, [proj.id]),
    query(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(estimated_h), 0) AS estimated_hours
         FROM client_schema.tasks WHERE project_id=$1 AND deleted_at IS NULL GROUP BY status`,
      [proj.id]
    ),
    query(
      `SELECT al.* FROM client_schema.project_activity_log al WHERE al.project_id=$1 ORDER BY al.created_at DESC LIMIT 20`,
      [proj.id]
    ),
  ]);

  return success(res, {
    ...proj,
    members: members.rows,
    milestones: milestones.rows,
    task_summary: taskSummary.rows,
    recent_activity: recentActivity.rows,
  });
}));

// Create project
router.post('/', authenticate, requirePermission('project.create', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot create projects', 403);
  }

  const {
    client_id, name, code, description, type, priority,
    start_date, end_date, budget, currency, members, project_manager
  } = req.body;

  if (!name || !name.trim()) throw new AppError('Project name is required', 400);

  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    throw new AppError('End date cannot be earlier than start date', 400);
  }

  const finalCode = code?.trim() || `PRJ-${Date.now().toString(36).toUpperCase()}`;
  const managerId = project_manager || req.userId;

  // Verify client_id if provided
  let targetClientId = client_id || null;
  if (!targetClientId) {
    const { rows: firstClient } = await query(`SELECT id FROM client_schema.clients WHERE deleted_at IS NULL LIMIT 1`);
    targetClientId = firstClient[0]?.id || null;
  }

  const rows = await withTransaction(async (client) => {
    const projRes = await client.query(
      `INSERT INTO client_schema.client_projects
         (client_id, title, code, description, type,
          status, priority, start_date, end_date,
          budget, spent, currency, progress_percent,
          project_manager, tech_stack, metadata)
       VALUES ($1, $2, $3, $4, $5, 'planning', $6, $7, $8, $9, 0, $10, 0, $11, ARRAY[]::text[], '{}'::jsonb)
       RETURNING *`,
      [
        targetClientId,
        name.trim(),
        finalCode,
        description || null,
        type || 'fixed_price',
        priority || 'medium',
        start_date || null,
        end_date || null,
        budget ? parseFloat(budget) : null,
        currency || 'USD',
        managerId,
      ]
    );
    const project = projRes.rows[0];

    // Add manager as member
    await client.query(
      `INSERT INTO client_schema.project_members (project_id, user_id, role, added_by)
       VALUES ($1, $2, 'manager', $2) ON CONFLICT (project_id, user_id) DO NOTHING`,
      [project.id, managerId]
    );

    // Add extra members
    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (m.user_id) {
          await client.query(
            `INSERT INTO client_schema.project_members (project_id, user_id, role, added_by)
             VALUES ($1, $2, $3, $4) ON CONFLICT (project_id, user_id) DO NOTHING`,
            [project.id, m.user_id, m.role || 'member', req.userId]
          );
        }
      }
    }

    // Activity log
    await client.query(
      `INSERT INTO client_schema.project_activity_log (project_id, user_id, action, metadata)
       VALUES ($1, $2, 'Project created', $3::jsonb)`,
      [project.id, req.userId, JSON.stringify({ name: project.title, code: project.code })]
    );

    return projRes.rows;
  });

  return created(res, {
    ...rows[0],
    name: rows[0].title,
  });
}));

// Update project
router.patch('/:id', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot modify project details', 403);
  }

  const {
    name, title, client_id, description, type, status, priority,
    health_status, health, start_date, end_date, budget, currency,
    progress_percent, project_manager, manager_id
  } = req.body;

  const projectTitle = name !== undefined ? name : title;
  const projectHealth = health_status !== undefined ? health_status : health;
  const managerUser = project_manager !== undefined ? project_manager : manager_id;

  const { rows } = await query(
    `UPDATE client_schema.client_projects
        SET title            = COALESCE($2, title),
            client_id        = COALESCE($3, client_id),
            description      = COALESCE($4, description),
            type             = COALESCE($5, type),
            status           = COALESCE($6::project_status, status),
            priority         = COALESCE($7, priority),
            health           = COALESCE($8, health),
            start_date       = COALESCE($9, start_date),
            end_date         = COALESCE($10, end_date),
            budget           = COALESCE($11, budget),
            currency         = COALESCE($12, currency),
            progress_percent = COALESCE($13, progress_percent),
            project_manager  = COALESCE($14, project_manager),
            actual_end_date  = CASE
                                 WHEN $6::project_status IN ('completed', 'delivered') AND actual_end_date IS NULL THEN NOW()
                                 ELSE actual_end_date
                               END,
            updated_at       = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [
      req.params.id,
      projectTitle !== undefined ? projectTitle : null,
      client_id !== undefined ? client_id : null,
      description !== undefined ? description : null,
      type !== undefined ? type : null,
      status !== undefined ? status : null,
      priority !== undefined ? priority : null,
      projectHealth !== undefined ? projectHealth : null,
      start_date !== undefined ? start_date : null,
      end_date !== undefined ? end_date : null,
      budget !== undefined ? (budget === '' || budget === null ? null : parseFloat(budget)) : null,
      currency !== undefined ? currency : null,
      progress_percent !== undefined ? Math.min(100, Math.max(0, parseInt(progress_percent, 10))) : null,
      managerUser !== undefined ? (managerUser || null) : null,
    ]
  );
  if (!rows.length) throw new AppError('Project not found', 404);

  // If manager changed, ensure they are registered in project_members
  if (managerUser) {
    await query(
      `INSERT INTO client_schema.project_members (project_id, user_id, role, added_by)
       VALUES ($1, $2, 'manager', $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'manager'`,
      [req.params.id, managerUser, req.userId]
    );
  }

  // Recalculate progress if status changed
  if (status) {
    await recalculateProjectProgress(req.params.id);
  }

  // Log activity
  await query(
    `INSERT INTO client_schema.project_activity_log (project_id, user_id, action, metadata)
     VALUES ($1, $2, 'Project updated', $3::jsonb)`,
    [req.params.id, req.userId, JSON.stringify({ status, priority, progress_percent, title: projectTitle })]
  );

  return success(res, {
    ...rows[0],
    name: rows[0].title,
  });
}));

// Soft delete / archive project
router.delete('/:id', authenticate, requirePermission('project.delete', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot delete projects', 403);
  }

  const { rowCount } = await query(
    `UPDATE client_schema.client_projects
        SET deleted_at = NOW(),
            status = 'cancelled',
            updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rowCount) throw new AppError('Project not found', 404);

  return noContent(res);
}));

// Project Members
router.get('/:id/members', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    const { rows: pCheck } = await query(
      `SELECT id FROM client_schema.client_projects WHERE id = $1 AND client_id IN (SELECT id FROM client_schema.clients WHERE user_id = $2)`,
      [req.params.id, req.userId]
    );
    if (!pCheck.length) throw new AppError('Forbidden', 403);
  }

  const { rows } = await query(
    `SELECT pm.*, u.display_name, u.avatar_url, u.email, u.role AS user_role
       FROM client_schema.project_members pm
       JOIN auth_schema.users u ON pm.user_id=u.id
      WHERE pm.project_id=$1 AND pm.left_at IS NULL ORDER BY pm.role, u.display_name`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/members', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  const { user_id, role = 'member', hourly_rate } = req.body;
  if (!user_id) throw new AppError('user_id required', 400);

  const { rows } = await query(
    `INSERT INTO client_schema.project_members (project_id, user_id, role, hourly_rate, added_by)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (project_id, user_id)
     DO UPDATE SET role=$3, hourly_rate=$4, left_at=NULL
     RETURNING *`,
    [req.params.id, user_id, role, hourly_rate || null, req.userId]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/members/:userId', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  await query(
    `UPDATE client_schema.project_members SET left_at=NOW() WHERE project_id=$1 AND user_id=$2`,
    [req.params.id, req.params.userId]
  );
  return noContent(res);
}));

// Milestones
router.get('/:id/milestones', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM client_schema.milestones WHERE project_id=$1 ORDER BY due_date ASC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/milestones', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  const { name, description, due_date, amount, is_billable } = req.body;
  if (!name || !due_date) throw new AppError('name and due_date required', 400);
  const { rows } = await query(
    `INSERT INTO client_schema.milestones (project_id, name, description, due_date, amount, is_billable)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, name, description, due_date, amount || 0, is_billable !== false]
  );
  return created(res, rows[0]);
}));

router.patch('/:id/milestones/:milestoneId', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  const { name, description, due_date, status, completed_at } = req.body;
  const { rows } = await query(
    `UPDATE client_schema.milestones
        SET name        = COALESCE($3, name),
            description = COALESCE($4, description),
            due_date    = COALESCE($5, due_date),
            status      = COALESCE($6, status),
            completed_at= COALESCE($7, completed_at)
      WHERE id=$1 AND project_id=$2 RETURNING *`,
    [req.params.milestoneId, req.params.id, name, description, due_date, status, completed_at]
  );
  if (!rows.length) throw new AppError('Milestone not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id/milestones/:milestoneId', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  await query(`DELETE FROM client_schema.milestones WHERE id=$1 AND project_id=$2`, [req.params.milestoneId, req.params.id]);
  return noContent(res);
}));

// Files
router.get('/:id/files', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT pf.*, m.cdn_url, m.file_name, m.file_size, m.mime_type, u.display_name AS uploaded_by_name
       FROM client_schema.project_files pf
       JOIN cms_schema.media m ON pf.media_id=m.id
       LEFT JOIN auth_schema.users u ON pf.uploaded_by=u.id
      WHERE pf.project_id=$1 ORDER BY pf.created_at DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/files', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  const { media_id, name, description, category } = req.body;
  if (!media_id) throw new AppError('media_id required', 400);
  const { rows } = await query(
    `INSERT INTO client_schema.project_files (project_id, media_id, name, description, category, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, media_id, name, description, category || 'general', req.userId]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/files/:fileId', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  await query(`DELETE FROM client_schema.project_files WHERE id=$1 AND project_id=$2`, [req.params.fileId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  TASKS ROUTER
// ════════════════════════════════════════════════════════════
const tasksRouter = require('express').Router();

// List tasks
tasksRouter.get('/', authenticate, requirePermission('task.read', 'task.manage'), paginate, asyncHandler(async (req, res) => {
  const { project_id, assignee_id, status, priority, parent_id, sprint_id, search, due_before } = req.query;
  const conditions = ['t.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (req.user?.role === 'client') {
    conditions.push(`t.project_id IN (
      SELECT cp.id FROM client_schema.client_projects cp
      JOIN client_schema.clients cl ON cp.client_id = cl.id
      WHERE cl.user_id = $${idx} AND cp.deleted_at IS NULL
    )`);
    params.push(req.userId);
    idx++;
  }

  if (project_id)  { conditions.push(`t.project_id=$${idx}`);    params.push(project_id);  idx++; }
  if (assignee_id) { conditions.push(`t.assigned_to=$${idx}`);   params.push(assignee_id); idx++; }
  if (status)      { conditions.push(`t.status=$${idx}`);        params.push(status); idx++; }
  if (priority)    { conditions.push(`t.priority=$${idx}`);      params.push(priority); idx++; }
  if (sprint_id)   { conditions.push(`t.sprint_id=$${idx}`);     params.push(sprint_id);  idx++; }
  if (parent_id === 'null') conditions.push(`t.parent_id IS NULL`);
  else if (parent_id) { conditions.push(`t.parent_id=$${idx}`);  params.push(parent_id);  idx++; }
  if (due_before)  { conditions.push(`t.due_date <= $${idx}`);   params.push(due_before); idx++; }
  if (search) {
    conditions.push(`(t.title ILIKE $${idx} OR t.description ILIKE $${idx} OR t.task_number ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT t.id,
              COALESCE(t.task_number, 'TSK-' || UPPER(SUBSTRING(t.id::text, 1, 6))) AS task_number,
              t.title, t.description, t.status, t.priority, t.type,
              t.due_date, t.estimated_h AS estimated_hours, t.logged_h AS actual_hours,
              t.story_points, t.tags, t.created_at, t.completed_at,
              u.display_name AS assignee_name, u.avatar_url AS assignee_avatar,
              t.assigned_to AS assignee_id,
              p.title AS project_name, COALESCE(p.code, 'PRJ') AS project_code,
              t.project_id,
              COUNT(sub.id) FILTER (WHERE sub.deleted_at IS NULL) AS subtask_count
         FROM client_schema.tasks t
         LEFT JOIN auth_schema.users        u ON t.assigned_to=u.id
         LEFT JOIN client_schema.client_projects p ON t.project_id=p.id
         LEFT JOIN client_schema.tasks   sub ON sub.parent_id=t.id
        WHERE ${where}
        GROUP BY t.id, u.display_name, u.avatar_url, t.assigned_to, p.title, p.code
        ORDER BY t.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM client_schema.tasks t WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// Tasks summary statistics
tasksRouter.get('/summary', authenticate, requirePermission('task.read', 'task.manage'), asyncHandler(async (req, res) => {
  const isClient = req.user?.role === 'client';
  const clientFilter = isClient
    ? `AND t.project_id IN (
        SELECT cp.id FROM client_schema.client_projects cp
        JOIN client_schema.clients cl ON cp.client_id = cl.id
        WHERE cl.user_id = '${req.userId}' AND cp.deleted_at IS NULL
       )`
    : '';

  const { rows } = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE t.status = 'todo') AS todo,
       COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress,
       COUNT(*) FILTER (WHERE t.status = 'in_review') AS in_review,
       COUNT(*) FILTER (WHERE t.status = 'done') AS done,
       COUNT(*) FILTER (WHERE t.status = 'blocked') AS blocked,
       COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done') AS overdue,
       COUNT(*) FILTER (WHERE t.due_date = CURRENT_DATE AND t.status != 'done') AS due_today,
       COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.status != 'done') AS my_tasks
     FROM client_schema.tasks t
    WHERE t.deleted_at IS NULL ${clientFilter}`,
    [req.userId]
  );

  const row = rows[0] || {};
  return success(res, {
    total: parseInt(row.total || 0, 10),
    todo: parseInt(row.todo || 0, 10),
    in_progress: parseInt(row.in_progress || 0, 10),
    in_review: parseInt(row.in_review || 0, 10),
    done: parseInt(row.done || 0, 10),
    blocked: parseInt(row.blocked || 0, 10),
    overdue: parseInt(row.overdue || 0, 10),
    due_today: parseInt(row.due_today || 0, 10),
    my_tasks: parseInt(row.my_tasks || 0, 10),
  });
}));

// My tasks
tasksRouter.get('/my', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.id,
            COALESCE(t.task_number, 'TSK-' || UPPER(SUBSTRING(t.id::text, 1, 6))) AS task_number,
            t.title, t.status, t.priority, t.due_date,
            t.estimated_h AS estimated_hours, t.logged_h AS actual_hours,
            p.title AS project_name, p.code AS project_code, t.project_id
       FROM client_schema.tasks t
       JOIN client_schema.client_projects p ON t.project_id=p.id
      WHERE t.assigned_to=$1 AND t.status NOT IN ('done','cancelled') AND t.deleted_at IS NULL
      ORDER BY t.priority DESC, t.due_date ASC NULLS LAST
      LIMIT 50`,
    [req.userId]
  );
  return success(res, rows);
}));

// Task detail
tasksRouter.get('/:id', authenticate, requirePermission('task.read', 'task.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.*,
            COALESCE(t.task_number, 'TSK-' || UPPER(SUBSTRING(t.id::text, 1, 6))) AS task_number,
            t.estimated_h AS estimated_hours, t.logged_h AS actual_hours,
            u.display_name AS assignee_name, u.avatar_url AS assignee_avatar,
            r.display_name AS reporter_name,
            p.title AS project_name, p.code AS project_code
       FROM client_schema.tasks t
       LEFT JOIN auth_schema.users       u ON t.assigned_to=u.id
       LEFT JOIN auth_schema.users       r ON t.reporter_id=r.id
       LEFT JOIN client_schema.client_projects p ON t.project_id=p.id
      WHERE t.id=$1 AND t.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Task not found', 404);

  const task = rows[0];

  // RBAC for Client
  if (req.user?.role === 'client') {
    const { rows: accessCheck } = await query(
      `SELECT cp.id FROM client_schema.client_projects cp
       JOIN client_schema.clients cl ON cp.client_id = cl.id
       WHERE cp.id = $1 AND cl.user_id = $2`,
      [task.project_id, req.userId]
    );
    if (!accessCheck.length) throw new AppError('Forbidden: Access to this task is restricted', 403);
  }

  const [subtasks, comments, attachments, timeEntries] = await Promise.all([
    query(
      `SELECT t.id, COALESCE(t.task_number, 'TSK') AS task_number, t.title, t.status, u.display_name AS assignee_name
         FROM client_schema.tasks t LEFT JOIN auth_schema.users u ON t.assigned_to=u.id
        WHERE t.parent_id=$1 AND t.deleted_at IS NULL ORDER BY t.created_at`,
      [task.id]
    ),
    query(
      `SELECT c.*, u.display_name AS author_name, u.avatar_url AS author_avatar
         FROM client_schema.task_comments c
         JOIN auth_schema.users u ON c.author_id=u.id
        WHERE c.task_id=$1 AND c.deleted_at IS NULL ORDER BY c.created_at ASC`,
      [task.id]
    ),
    query(
      `SELECT ta.*, m.cdn_url, m.file_name, m.file_size
         FROM client_schema.task_attachments ta
         JOIN cms_schema.media m ON ta.media_id=m.id
        WHERE ta.task_id=$1`,
      [task.id]
    ),
    query(
      `SELECT te.*, u.display_name AS user_name FROM client_schema.time_entries te
         JOIN auth_schema.users u ON te.user_id=u.id
        WHERE te.task_id=$1 ORDER BY te.started_at DESC LIMIT 10`,
      [task.id]
    ),
  ]);

  return success(res, {
    ...task,
    subtasks: subtasks.rows,
    comments: comments.rows,
    attachments: attachments.rows,
    time_entries: timeEntries.rows,
  });
}));

// Create task
tasksRouter.post('/', authenticate, requirePermission('task.create', 'task.manage'), asyncHandler(async (req, res) => {
  const {
    project_id, parent_id, sprint_id, milestone_id, assignee_id, assigned_to,
    title, description, type, status, priority, due_date, estimated_hours,
    story_points, tags
  } = req.body;

  if (!project_id || !title || !title.trim()) {
    throw new AppError('project_id and title are required', 400);
  }

  // Verify project exists
  const { rows: projRows } = await query(
    `SELECT id, code, client_id FROM client_schema.client_projects WHERE id=$1 AND deleted_at IS NULL`,
    [project_id]
  );
  if (!projRows.length) throw new AppError('Project not found', 404);

  // Client RBAC check
  if (req.user?.role === 'client') {
    const { rows: clientCheck } = await query(
      `SELECT id FROM client_schema.clients WHERE id = $1 AND user_id = $2`,
      [projRows[0].client_id, req.userId]
    );
    if (!clientCheck.length) throw new AppError('Forbidden: Cannot create task for this project', 403);
  }

  // Generate task number
  const { rows: numRows } = await query(
    `SELECT COALESCE(COUNT(*), 0) + 1 AS next FROM client_schema.tasks WHERE project_id=$1`,
    [project_id]
  );
  const prefix = projRows[0]?.code || 'TSK';
  const taskNumber = `${prefix}-${numRows[0].next}`;

  const assignedUser = assignee_id || assigned_to || null;
  const estH = estimated_hours ? parseFloat(estimated_hours) : null;

  const { rows } = await query(
    `INSERT INTO client_schema.tasks
       (project_id, parent_id, sprint_id, milestone_id, reporter_id, assigned_to,
        task_number, title, description, type, status, priority, due_date,
        estimated_h, story_points, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      project_id, parent_id || null, sprint_id || null, milestone_id || null,
      req.userId, assignedUser, taskNumber, title.trim(), description || null,
      type || 'task', status || 'todo', priority || 'medium', due_date || null,
      estH, story_points || null, tags || []
    ]
  );

  const newTask = rows[0];
  await recalculateProjectProgress(project_id);

  return created(res, {
    ...newTask,
    estimated_hours: newTask.estimated_h,
    actual_hours: newTask.logged_h,
  });
}));

// Update task
tasksRouter.patch('/:id', authenticate, requirePermission('task.edit', 'task.manage'), asyncHandler(async (req, res) => {
  const {
    title, description, status, priority, assignee_id, assigned_to, due_date,
    estimated_hours, story_points, tags, completed_at, sprint_id
  } = req.body;

  const { rows: existing } = await query(`SELECT * FROM client_schema.tasks WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!existing.length) throw new AppError('Task not found', 404);
  const currentTask = existing[0];

  // Client check
  if (req.user?.role === 'client') {
    const { rows: clientCheck } = await query(
      `SELECT cp.id FROM client_schema.client_projects cp
       JOIN client_schema.clients cl ON cp.client_id = cl.id
       WHERE cp.id = $1 AND cl.user_id = $2`,
      [currentTask.project_id, req.userId]
    );
    if (!clientCheck.length) throw new AppError('Forbidden: Cannot edit this task', 403);
  }

  const assignedProvided = assignee_id !== undefined || assigned_to !== undefined;
  const assignedUser = assignee_id !== undefined ? assignee_id : assigned_to;
  const cleanAssignedUser = (assignedUser === '' || assignedUser === null || assignedUser === 'unassigned') ? null : assignedUser;

  const isDoneNow = status === 'done';
  const wasDone = currentTask.status === 'done';

  let finalCompletedAt = completed_at;
  if (isDoneNow && !wasDone) {
    finalCompletedAt = new Date();
  } else if (!isDoneNow && status && wasDone) {
    finalCompletedAt = null;
  }

  const { rows } = await query(
    `UPDATE client_schema.tasks
        SET title          = COALESCE($2, title),
            description    = COALESCE($3, description),
            status         = COALESCE($4, status),
            priority       = COALESCE($5, priority),
            assigned_to    = CASE WHEN $6::boolean THEN $7::uuid ELSE assigned_to END,
            due_date       = COALESCE($8, due_date),
            estimated_h    = COALESCE($9, estimated_h),
            story_points   = COALESCE($10, story_points),
            tags           = COALESCE($11, tags),
            completed_at   = CASE WHEN $12::boolean IS TRUE THEN $13::timestamptz ELSE completed_at END,
            sprint_id      = COALESCE($14, sprint_id),
            updated_at     = NOW()
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [
      req.params.id,
      title !== undefined ? title : null,
      description !== undefined ? description : null,
      status !== undefined ? status : null,
      priority !== undefined ? priority : null,
      assignedProvided,
      cleanAssignedUser,
      due_date !== undefined ? due_date : null,
      estimated_hours !== undefined ? (estimated_hours === '' || estimated_hours === null ? null : parseFloat(estimated_hours)) : null,
      story_points !== undefined ? story_points : null,
      tags !== undefined ? tags : null,
      (status !== undefined || completed_at !== undefined),
      finalCompletedAt,
      sprint_id !== undefined ? sprint_id : null,
    ]
  );

  const updatedTask = rows[0];
  await recalculateProjectProgress(currentTask.project_id);

  return success(res, {
    ...updatedTask,
    estimated_hours: updatedTask.estimated_h,
    actual_hours: updatedTask.logged_h,
  });
}));

// Delete task
tasksRouter.delete('/:id', authenticate, requirePermission('task.delete', 'task.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT project_id FROM client_schema.tasks WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!rows.length) throw new AppError('Task not found', 404);

  if (req.user?.role === 'client') throw new AppError('Forbidden: Clients cannot delete tasks', 403);

  await query(`UPDATE client_schema.tasks SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1`, [req.params.id]);
  await recalculateProjectProgress(rows[0].project_id);

  return noContent(res);
}));

// Task Comments
tasksRouter.post('/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { content, parent_id } = req.body;
  if (!content || !content.trim()) throw new AppError('content required', 400);

  const { rows } = await query(
    `INSERT INTO client_schema.task_comments (task_id, author_id, content, parent_id)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.userId, content.trim(), parent_id || null]
  );
  return created(res, rows[0]);
}));

tasksRouter.patch('/:id/comments/:commentId', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { rows } = await query(
    `UPDATE client_schema.task_comments SET content=$3, is_edited=TRUE
      WHERE id=$1 AND task_id=$2 AND author_id=$4 AND deleted_at IS NULL RETURNING *`,
    [req.params.commentId, req.params.id, content, req.userId]
  );
  if (!rows.length) throw new AppError('Comment not found or not yours', 404);
  return success(res, rows[0]);
}));

tasksRouter.delete('/:id/comments/:commentId', authenticate, asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `UPDATE client_schema.task_comments SET deleted_at=NOW() WHERE id=$1 AND author_id=$2`,
    [req.params.commentId, req.userId]
  );
  if (!rowCount) throw new AppError('Comment not found or not yours', 404);
  return noContent(res);
}));

// Task Attachments
tasksRouter.post('/:id/attachments', authenticate, asyncHandler(async (req, res) => {
  const { media_id } = req.body;
  if (!media_id) throw new AppError('media_id required', 400);
  const { rows } = await query(
    `INSERT INTO client_schema.task_attachments (task_id, media_id, uploaded_by) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, media_id, req.userId]
  );
  return created(res, rows[0]);
}));

tasksRouter.delete('/:id/attachments/:attachId', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM client_schema.task_attachments WHERE id=$1 AND task_id=$2`, [req.params.attachId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SPRINTS ROUTER
// ════════════════════════════════════════════════════════════
const sprintsRouter = require('express').Router();

sprintsRouter.get('/', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const { project_id, status } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (project_id) { conditions.push(`s.project_id=$${idx}`); params.push(project_id); idx++; }
  if (status)     { conditions.push(`s.status=$${idx}`); params.push(status); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT s.*, COUNT(t.id) AS task_count,
            COUNT(t.id) FILTER (WHERE t.status='done') AS completed_count
       FROM client_schema.sprints s
       LEFT JOIN client_schema.tasks t ON t.sprint_id=s.id AND t.deleted_at IS NULL
       ${where}
      GROUP BY s.id ORDER BY s.start_date DESC`,
    params
  );
  return success(res, rows);
}));

sprintsRouter.get('/:id', authenticate, requirePermission('project.read', 'project.manage'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM client_schema.sprints WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Sprint not found', 404);
  const tasks = await query(
    `SELECT t.id, t.task_number, t.title, t.status, t.priority, t.story_points,
            u.display_name AS assignee_name FROM client_schema.tasks t
       LEFT JOIN auth_schema.users u ON t.assigned_to=u.id
      WHERE t.sprint_id=$1 AND t.deleted_at IS NULL ORDER BY t.priority DESC`,
    [req.params.id]
  );
  return success(res, { ...rows[0], tasks: tasks.rows });
}));

sprintsRouter.post('/', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  const { project_id, name, goal, start_date, end_date } = req.body;
  if (!project_id || !name || !start_date || !end_date) throw new AppError('project_id, name, start_date, end_date required', 400);
  const { rows } = await query(
    `INSERT INTO client_schema.sprints (project_id, name, goal, start_date, end_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [project_id, name, goal, start_date, end_date, req.userId]
  );
  return created(res, rows[0]);
}));

sprintsRouter.patch('/:id', authenticate, requirePermission('project.edit', 'project.manage'), asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') throw new AppError('Forbidden', 403);
  const { name, goal, status, start_date, end_date, velocity } = req.body;
  const { rows } = await query(
    `UPDATE client_schema.sprints
        SET name       = COALESCE($2, name),
            goal       = COALESCE($3, goal),
            status     = COALESCE($4, status),
            start_date = COALESCE($5, start_date),
            end_date   = COALESCE($6, end_date),
            velocity   = COALESCE($7, velocity),
            started_at = CASE WHEN $4='active' AND status='planned' THEN NOW() ELSE started_at END,
            completed_at=CASE WHEN $4='completed' AND status='active' THEN NOW() ELSE completed_at END
      WHERE id=$1 RETURNING *`,
    [req.params.id, name, goal, status, start_date, end_date, velocity]
  );
  if (!rows.length) throw new AppError('Sprint not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  TIME TRACKING ROUTER
// ════════════════════════════════════════════════════════════
const timeRouter = require('express').Router();

// List organization time entries (blocked for clients)
timeRouter.get('/', authenticate, requirePermission('time.read', 'time.manage'), paginate, asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot access organization time entries', 403);
  }

  const { project_id, task_id, user_id, from_date, to_date, is_billable } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (project_id)  { conditions.push(`te.project_id=$${idx}`); params.push(project_id); idx++; }
  if (task_id)     { conditions.push(`te.task_id=$${idx}`);    params.push(task_id);    idx++; }
  if (user_id)     { conditions.push(`te.user_id=$${idx}`);    params.push(user_id);    idx++; }
  if (is_billable !== undefined) { conditions.push(`te.is_billable=$${idx}`); params.push(is_billable === 'true' || is_billable === true); idx++; }
  if (from_date)   { conditions.push(`te.started_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)     { conditions.push(`te.started_at <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT te.*,
              te.started_at AS date,
              te.is_billable AS billable,
              u.display_name AS user_name, u.avatar_url AS user_avatar,
              t.title AS task_title, t.task_number,
              p.title AS project_name, p.code AS project_code
         FROM client_schema.time_entries te
         JOIN auth_schema.users u ON te.user_id=u.id
         LEFT JOIN client_schema.tasks    t ON te.task_id=t.id
         LEFT JOIN client_schema.client_projects p ON te.project_id=p.id
         ${where}
        ORDER BY te.started_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), COALESCE(SUM(te.hours), 0) AS total_hours, COALESCE(SUM(te.hours) FILTER (WHERE te.is_billable), 0) AS billable_hours FROM client_schema.time_entries te ${where}`, params),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    total_hours: parseFloat(countRes.rows[0].total_hours || 0),
    billable_hours: parseFloat(countRes.rows[0].billable_hours || 0),
  });
}));

// My time entries
timeRouter.get('/my', authenticate, paginate, asyncHandler(async (req, res) => {
  const { from_date, to_date, project_id } = req.query;
  const conditions = ['te.user_id = $1'];
  const params = [req.userId];
  let idx = 2;

  if (from_date) { conditions.push(`te.started_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)   { conditions.push(`te.started_at <= $${idx}`); params.push(to_date); idx++; }
  if (project_id){ conditions.push(`te.project_id = $${idx}`); params.push(project_id); idx++; }

  const where = conditions.join(' AND ');

  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT te.*,
              te.started_at AS date,
              te.is_billable AS billable,
              t.title AS task_title,
              p.title AS project_name, p.code AS project_code
         FROM client_schema.time_entries te
         LEFT JOIN client_schema.tasks    t ON te.task_id=t.id
         LEFT JOIN client_schema.client_projects p ON te.project_id=p.id
        WHERE ${where}
        ORDER BY te.started_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), COALESCE(SUM(hours), 0) AS total_hours FROM client_schema.time_entries te WHERE ${where}`, params),
  ]);

  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

// Active timer for current user
timeRouter.get('/active', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT te.*,
            te.started_at AS date,
            te.is_billable AS billable,
            p.title AS project_name, p.code AS project_code,
            t.title AS task_title
       FROM client_schema.time_entries te
       LEFT JOIN client_schema.client_projects p ON te.project_id=p.id
       LEFT JOIN client_schema.tasks t ON te.task_id=t.id
      WHERE te.user_id=$1 AND te.is_active_timer=TRUE
      LIMIT 1`,
    [req.userId]
  );

  return success(res, {
    active_timer: rows[0] || null,
    server_time: new Date().toISOString(),
  });
}));

// Start timer (single active timer per user constraint)
timeRouter.post('/start', authenticate, asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot log time entries', 403);
  }

  const { project_id, task_id, description, is_billable, billable, billing_rate } = req.body;
  if (!project_id) throw new AppError('project_id required to start timer', 400);

  // Check if project exists
  const { rows: projCheck } = await query(`SELECT id FROM client_schema.client_projects WHERE id=$1 AND deleted_at IS NULL`, [project_id]);
  if (!projCheck.length) throw new AppError('Project not found', 404);

  // Check for existing active timer
  const { rows: activeExisting } = await query(
    `SELECT id, started_at FROM client_schema.time_entries WHERE user_id=$1 AND is_active_timer=TRUE LIMIT 1`,
    [req.userId]
  );
  if (activeExisting.length) {
    return res.status(409).json({
      success: false,
      message: 'Active timer already running. Stop the current timer before starting a new one.',
      active_timer: activeExisting[0],
    });
  }

  const billableValue = billable !== undefined ? billable : (is_billable !== undefined ? is_billable : true);

  const { rows } = await query(
    `INSERT INTO client_schema.time_entries
       (project_id, task_id, user_id, description, hours, duration_seconds, started_at, is_billable, billing_rate, is_active_timer)
     VALUES ($1,$2,$3,$4, 0, 0, NOW(), $5, $6, TRUE)
     RETURNING *`,
    [project_id, task_id || null, req.userId, description || null, billableValue, billing_rate || 0]
  );

  return created(res, {
    ...rows[0],
    date: rows[0].started_at,
    billable: rows[0].is_billable,
    server_time: new Date().toISOString(),
  });
}));

// Stop timer (server authoritative duration calculation)
timeRouter.post('/stop', authenticate, asyncHandler(async (req, res) => {
  const { id, description } = req.body;

  let timerQuery = `SELECT * FROM client_schema.time_entries WHERE user_id=$1 AND is_active_timer=TRUE`;
  const timerParams = [req.userId];
  if (id) {
    timerQuery += ` AND id=$2`;
    timerParams.push(id);
  }
  timerQuery += ` LIMIT 1`;

  const { rows: timerRows } = await query(timerQuery, timerParams);
  if (!timerRows.length) {
    throw new AppError('No active timer found to stop', 404);
  }

  const timer = timerRows[0];
  const now = new Date();
  const startedAt = new Date(timer.started_at);
  const durationSeconds = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 1000));
  const hours = Number((durationSeconds / 3600).toFixed(2));

  const { rows: updatedRows } = await query(
    `UPDATE client_schema.time_entries
        SET ended_at = NOW(),
            duration_seconds = $1,
            hours = $2,
            is_active_timer = FALSE,
            description = COALESCE($3, description),
            updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
    [durationSeconds, hours, description || null, timer.id]
  );
  const entry = updatedRows[0];

  // Atomically update task logged hours if linked
  if (entry.task_id) {
    await query(
      `UPDATE client_schema.tasks
          SET logged_h = COALESCE(logged_h, 0) + $1,
              updated_at = NOW()
        WHERE id = $2`,
      [hours, entry.task_id]
    );
  }

  // Atomically update project hours
  const projectHourField = entry.is_billable ? 'billable_hours' : 'non_billable_hours';
  await query(
    `UPDATE client_schema.client_projects
        SET ${projectHourField} = COALESCE(${projectHourField}, 0) + $1,
            spent = COALESCE(spent, 0) + ($1 * COALESCE(NULLIF(ROUND(budget / 100.0, 2), 0), 50)),
            updated_at = NOW()
      WHERE id = $2`,
    [hours, entry.project_id]
  );

  return success(res, {
    ...entry,
    date: entry.started_at,
    billable: entry.is_billable,
    duration_formatted: `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m ${durationSeconds % 60}s`,
  });
}));

// Manual time entry creation
timeRouter.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.user?.role === 'client') {
    throw new AppError('Forbidden: Clients cannot log time entries', 403);
  }

  const { project_id, task_id, description, hours, date, started_at, ended_at, billable, is_billable, billing_rate } = req.body;
  if (!project_id) throw new AppError('project_id required', 400);

  const numHours = parseFloat(hours);
  if (isNaN(numHours) || numHours <= 0) {
    throw new AppError('Valid hours (> 0) required', 400);
  }

  // Verify project exists
  const { rows: projCheck } = await query(`SELECT id FROM client_schema.client_projects WHERE id=$1 AND deleted_at IS NULL`, [project_id]);
  if (!projCheck.length) throw new AppError('Project not found', 404);

  // If task_id provided, verify task belongs to project
  if (task_id) {
    const { rows: taskCheck } = await query(`SELECT id FROM client_schema.tasks WHERE id=$1 AND project_id=$2 AND deleted_at IS NULL`, [task_id, project_id]);
    if (!taskCheck.length) throw new AppError('Task not found or does not belong to selected project', 400);
  }

  const startTime = started_at || (date ? new Date(date) : new Date());
  const billableVal = billable !== undefined ? billable : (is_billable !== undefined ? is_billable : true);
  const durationSec = Math.round(numHours * 3600);

  const { rows } = await query(
    `INSERT INTO client_schema.time_entries
       (project_id, task_id, user_id, description, hours, duration_seconds, started_at, ended_at, is_billable, billing_rate, is_active_timer)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, FALSE) RETURNING *`,
    [
      project_id, task_id || null, req.userId, description || null, numHours,
      durationSec, startTime, ended_at || null, billableVal, billing_rate || 0
    ]
  );

  // Update task logged hours
  if (task_id) {
    await query(
      `UPDATE client_schema.tasks SET logged_h = COALESCE(logged_h, 0) + $1, updated_at = NOW() WHERE id=$2`,
      [numHours, task_id]
    );
  }

  // Update project billable / non-billable hours
  const field = billableVal ? 'billable_hours' : 'non_billable_hours';
  await query(
    `UPDATE client_schema.client_projects SET ${field} = COALESCE(${field}, 0) + $1, updated_at = NOW() WHERE id=$2`,
    [numHours, project_id]
  );

  return created(res, {
    ...rows[0],
    date: rows[0].started_at,
    billable: rows[0].is_billable,
  });
}));

// Edit time entry
timeRouter.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { description, hours, billable, is_billable, billing_rate } = req.body;

  const { rows: existing } = await query(`SELECT * FROM client_schema.time_entries WHERE id=$1`, [req.params.id]);
  if (!existing.length) throw new AppError('Time entry not found', 404);

  const old = existing[0];
  if (old.user_id !== req.userId && req.user?.role !== 'super_admin') {
    throw new AppError('Forbidden: You can only edit your own time entries', 403);
  }

  const newHours = hours !== undefined ? parseFloat(hours) : parseFloat(old.hours);
  const diffHours = newHours - parseFloat(old.hours);
  const billableVal = billable !== undefined ? billable : (is_billable !== undefined ? is_billable : old.is_billable);

  const { rows } = await query(
    `UPDATE client_schema.time_entries
        SET description  = COALESCE($2, description),
            hours        = $3::numeric,
            duration_seconds = ROUND(($3::numeric) * 3600),
            is_billable  = $4::boolean,
            billing_rate = COALESCE($5::numeric, billing_rate),
            updated_at   = NOW()
      WHERE id=$1 RETURNING *`,
    [req.params.id, description, newHours, billableVal, billing_rate || null]
  );

  // Update task logged hours diff
  if (diffHours !== 0 && old.task_id) {
    await query(`UPDATE client_schema.tasks SET logged_h = GREATEST(0, COALESCE(logged_h, 0) + $1) WHERE id=$2`, [diffHours, old.task_id]);
  }

  // Update project hours diff
  if (diffHours !== 0) {
    const field = billableVal ? 'billable_hours' : 'non_billable_hours';
    await query(`UPDATE client_schema.client_projects SET ${field} = GREATEST(0, COALESCE(${field}, 0) + $1) WHERE id=$2`, [diffHours, old.project_id]);
  }

  return success(res, {
    ...rows[0],
    date: rows[0].started_at,
    billable: rows[0].is_billable,
  });
}));

// Delete time entry
timeRouter.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows: existing } = await query(`SELECT * FROM client_schema.time_entries WHERE id=$1`, [req.params.id]);
  if (!existing.length) throw new AppError('Time entry not found', 404);

  const old = existing[0];
  if (old.user_id !== req.userId && req.user?.role !== 'super_admin') {
    throw new AppError('Forbidden: You can only delete your own time entries', 403);
  }

  const delHours = parseFloat(old.hours || 0);

  await query(`DELETE FROM client_schema.time_entries WHERE id=$1`, [req.params.id]);

  if (delHours > 0 && old.task_id) {
    await query(`UPDATE client_schema.tasks SET logged_h = GREATEST(0, COALESCE(logged_h, 0) - $1) WHERE id=$2`, [delHours, old.task_id]);
  }
  if (delHours > 0) {
    const field = old.is_billable ? 'billable_hours' : 'non_billable_hours';
    await query(`UPDATE client_schema.client_projects SET ${field} = GREATEST(0, COALESCE(${field}, 0) - $1) WHERE id=$2`, [delHours, old.project_id]);
  }

  return noContent(res);
}));

// Time tracking summary metrics
timeRouter.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user?.role === 'super_admin';
  const userId = req.userId;

  // Single user scope for general member, or all for super_admin if requested
  const scopeCondition = isSuperAdmin ? '1=1' : `user_id = '${userId}'`;

  const { rows } = await query(
    `SELECT
       COALESCE(SUM(hours) FILTER (WHERE started_at >= date_trunc('week', CURRENT_DATE)), 0) AS this_week,
       COALESCE(SUM(hours) FILTER (WHERE started_at >= date_trunc('month', CURRENT_DATE)), 0) AS this_month,
       COALESCE(SUM(hours) FILTER (WHERE started_at >= CURRENT_DATE), 0) AS today,
       COALESCE(SUM(hours) FILTER (WHERE is_billable = TRUE), 0) AS billable_hours,
       COALESCE(SUM(hours) FILTER (WHERE is_billable = FALSE), 0) AS non_billable_hours,
       COALESCE(SUM(hours), 0) AS total_hours,
       COUNT(*)::int AS total_entries
     FROM client_schema.time_entries
    WHERE is_active_timer = FALSE AND ${scopeCondition}`
  );

  const stats = rows[0] || {};
  return success(res, {
    this_week: parseFloat(stats.this_week || 0),
    this_month: parseFloat(stats.this_month || 0),
    today: parseFloat(stats.today || 0),
    billable_hours: parseFloat(stats.billable_hours || 0),
    non_billable_hours: parseFloat(stats.non_billable_hours || 0),
    total_hours: parseFloat(stats.total_hours || 0),
    total_entries: parseInt(stats.total_entries || 0, 10),
  });
}));

module.exports = { router, tasksRouter, sprintsRouter, timeRouter };
