// src/routes/projects.js
const router = require('express').Router();
const { query, withTransaction } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { paginate, paginateResponse, safeSort } = require('../middleware/common');
const { generatePublicId, success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  PROJECTS
// ════════════════════════════════════════════════════════════
router.get('/', authenticate, requirePermission('project.read'), paginate, asyncHandler(async (req, res) => {
  const { status, client_id, manager_id, priority, from_date, to_date, search } = req.query;
  const { col, dir } = safeSort(req.query.sort_by, req.query.sort_dir, 'created_at');

  const conditions = ['p.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (status)     { conditions.push(`p.status=$${idx}::project_status`); params.push(status); idx++; }
  if (client_id)  { conditions.push(`p.client_id=$${idx}`);  params.push(client_id);  idx++; }
  if (manager_id) { conditions.push(`p.manager_id=$${idx}`); params.push(manager_id); idx++; }
  if (priority)   { conditions.push(`p.priority=$${idx}::priority_level`); params.push(priority); idx++; }
  if (from_date)  { conditions.push(`p.start_date >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)    { conditions.push(`p.end_date   <= $${idx}`); params.push(to_date);   idx++; }
  if (search)     {
    conditions.push(`(p.name ILIKE $${idx} OR p.code ILIKE $${idx})`);
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

router.get('/dashboard', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM project_schema.v_project_dashboard WHERE manager_id=$1 OR $1 IS NULL`, [req.userId]);
  return success(res, rows);
}));

router.get('/overdue', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.code, p.name, p.end_date, p.status, u.display_name AS manager_name
       FROM project_schema.projects p
       LEFT JOIN auth_schema.users u ON p.manager_id=u.id
      WHERE p.end_date < NOW() AND p.status NOT IN ('completed','cancelled','on_hold') AND p.deleted_at IS NULL
      ORDER BY p.end_date ASC`
  );
  return success(res, rows);
}));

router.get('/:id', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
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
  const [members, milestones, taskSummary, recentActivity] = await Promise.all([
    query(
      `SELECT pm.*, u.display_name, u.avatar_url, u.email
         FROM project_schema.project_members pm
         JOIN auth_schema.users u ON pm.user_id=u.id
        WHERE pm.project_id=$1 AND pm.left_at IS NULL`,
      [proj.id]
    ),
    query(`SELECT * FROM project_schema.milestones WHERE project_id=$1 ORDER BY due_date ASC`, [proj.id]),
    query(
      `SELECT status, COUNT(*) AS count, SUM(estimated_hours) AS estimated_hours
         FROM project_schema.tasks WHERE project_id=$1 AND deleted_at IS NULL GROUP BY status`,
      [proj.id]
    ),
    query(
      `SELECT al.* FROM project_schema.project_activity_log al WHERE al.project_id=$1 ORDER BY al.created_at DESC LIMIT 20`,
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

router.post('/', authenticate, requirePermission('project.create'), asyncHandler(async (req, res) => {
  const {
    client_id, lead_id, proposal_id, name, code, description, type, priority,
    start_date, end_date, estimated_hours, budget, budget_type, currency,
    billing_type, hourly_rate, tags, custom_fields, members
  } = req.body;
  if (!name) throw new AppError('name required');

  const finalCode = code || `PRJ-${Date.now().toString(36).toUpperCase()}`;

  const { rows } = await withTransaction(async (client) => {
    const projRes = await client.query(
      `INSERT INTO project_schema.projects
         (client_id, lead_id, proposal_id, manager_id, name, code, description, type,
          priority, start_date, end_date, estimated_hours, budget, budget_type,
          currency, billing_type, hourly_rate, tags, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb)
       RETURNING *`,
      [client_id || null, lead_id || null, proposal_id || null, req.userId,
       name, finalCode, description, type || 'fixed_price',
       priority || 'medium', start_date, end_date,
       estimated_hours, budget, budget_type || 'fixed', currency || 'USD',
       billing_type || 'fixed', hourly_rate,
       tags || [], JSON.stringify(custom_fields || {})]
    );
    const project = projRes.rows[0];

    // Add manager as member
    await client.query(
      `INSERT INTO project_schema.project_members (project_id, user_id, role, added_by) VALUES ($1,$2,'manager',$2)`,
      [project.id, req.userId]
    );

    // Add additional members
    if (members && members.length) {
      for (const m of members) {
        await client.query(
          `INSERT INTO project_schema.project_members (project_id, user_id, role, added_by)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [project.id, m.user_id, m.role || 'member', req.userId]
        );
      }
    }
    return projRes.rows;
  });

  return created(res, rows[0]);
}));

router.patch('/:id', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { name, description, status, priority, health_status, end_date,
          budget, progress_percent, tags, custom_fields, completed_at } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.projects
        SET name             = COALESCE($2, name),
            description      = COALESCE($3, description),
            status           = COALESCE($4::project_status, status),
            priority         = COALESCE($5::priority_level, priority),
            health_status    = COALESCE($6::health_status, health_status),
            end_date         = COALESCE($7, end_date),
            budget           = COALESCE($8, budget),
            progress_percent = COALESCE($9, progress_percent),
            tags             = COALESCE($10, tags),
            custom_fields    = CASE WHEN $11::jsonb IS NOT NULL THEN $11::jsonb ELSE custom_fields END,
            completed_at     = COALESCE($12, completed_at)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, name, description, status, priority, health_status, end_date,
     budget, progress_percent, tags, custom_fields ? JSON.stringify(custom_fields) : null, completed_at]
  );
  if (!rows.length) throw new AppError('Project not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id', authenticate, requirePermission('project.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE project_schema.projects SET deleted_at=NOW(), status='cancelled' WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// ── Project Members ───────────────────────────────────────────
router.get('/:id/members', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT pm.*, u.display_name, u.avatar_url, u.email, u.role AS user_role
       FROM project_schema.project_members pm
       JOIN auth_schema.users u ON pm.user_id=u.id
      WHERE pm.project_id=$1 AND pm.left_at IS NULL ORDER BY pm.role, u.display_name`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/members', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { user_id, role = 'member', hourly_rate } = req.body;
  if (!user_id) throw new AppError('user_id required');
  const { rows } = await query(
    `INSERT INTO project_schema.project_members (project_id, user_id, role, hourly_rate, added_by)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3, hourly_rate=$4
     RETURNING *`,
    [req.params.id, user_id, role, hourly_rate || null, req.userId]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/members/:userId', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  await query(
    `UPDATE project_schema.project_members SET left_at=NOW() WHERE project_id=$1 AND user_id=$2`,
    [req.params.id, req.params.userId]
  );
  return noContent(res);
}));

// ── Milestones ────────────────────────────────────────────────
router.get('/:id/milestones', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM project_schema.milestones WHERE project_id=$1 ORDER BY due_date ASC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/milestones', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { name, description, due_date, amount, is_billable } = req.body;
  if (!name || !due_date) throw new AppError('name and due_date required');
  const { rows } = await query(
    `INSERT INTO project_schema.milestones (project_id, name, description, due_date, amount, is_billable)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, name, description, due_date, amount || 0, is_billable !== false]
  );
  return created(res, rows[0]);
}));

router.patch('/:id/milestones/:milestoneId', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { name, description, due_date, status, completed_at } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.milestones
        SET name        = COALESCE($3, name),
            description = COALESCE($4, description),
            due_date    = COALESCE($5, due_date),
            status      = COALESCE($6::milestone_status, status),
            completed_at= COALESCE($7, completed_at)
      WHERE id=$1 AND project_id=$2 RETURNING *`,
    [req.params.milestoneId, req.params.id, name, description, due_date, status, completed_at]
  );
  if (!rows.length) throw new AppError('Milestone not found', 404);
  return success(res, rows[0]);
}));

router.delete('/:id/milestones/:milestoneId', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM project_schema.milestones WHERE id=$1 AND project_id=$2`, [req.params.milestoneId, req.params.id]);
  return noContent(res);
}));

// ── Project Files ──────────────────────────────────────────────
router.get('/:id/files', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT pf.*, m.cdn_url, m.file_name, m.file_size, m.mime_type, u.display_name AS uploaded_by_name
       FROM project_schema.project_files pf
       JOIN cms_schema.media m ON pf.media_id=m.id
       LEFT JOIN auth_schema.users u ON pf.uploaded_by=u.id
      WHERE pf.project_id=$1 ORDER BY pf.created_at DESC`,
    [req.params.id]
  );
  return success(res, rows);
}));

router.post('/:id/files', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { media_id, name, description, category } = req.body;
  if (!media_id) throw new AppError('media_id required');
  const { rows } = await query(
    `INSERT INTO project_schema.project_files (project_id, media_id, name, description, category, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, media_id, name, description, category || 'general', req.userId]
  );
  return created(res, rows[0]);
}));

router.delete('/:id/files/:fileId', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  await query(`DELETE FROM project_schema.project_files WHERE id=$1 AND project_id=$2`, [req.params.fileId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  TASKS
// ════════════════════════════════════════════════════════════
const tasksRouter = require('express').Router();

tasksRouter.get('/', authenticate, requirePermission('task.read'), paginate, asyncHandler(async (req, res) => {
  const { project_id, assignee_id, status, priority, parent_id, sprint_id, search, due_before } = req.query;
  const conditions = ['t.deleted_at IS NULL'];
  const params     = [];
  let   idx        = 1;

  if (project_id)  { conditions.push(`t.project_id=$${idx}`);    params.push(project_id);  idx++; }
  if (assignee_id) { conditions.push(`t.assignee_id=$${idx}`);   params.push(assignee_id); idx++; }
  if (status)      { conditions.push(`t.status=$${idx}::task_status`); params.push(status); idx++; }
  if (priority)    { conditions.push(`t.priority=$${idx}::priority_level`); params.push(priority); idx++; }
  if (sprint_id)   { conditions.push(`t.sprint_id=$${idx}`);     params.push(sprint_id);  idx++; }
  if (parent_id === 'null') conditions.push(`t.parent_id IS NULL`);
  else if (parent_id) { conditions.push(`t.parent_id=$${idx}`);  params.push(parent_id);  idx++; }
  if (due_before)  { conditions.push(`t.due_date <= $${idx}`);   params.push(due_before); idx++; }
  if (search) {
    conditions.push(`to_tsvector('english', t.title) @@ plainto_tsquery('english',$${idx})`);
    params.push(search); idx++;
  }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT t.id, t.task_number, t.title, t.status, t.priority, t.type,
              t.due_date, t.estimated_hours, t.actual_hours, t.story_points,
              t.tags, t.created_at,
              u.display_name AS assignee_name, u.avatar_url AS assignee_avatar,
              p.name AS project_name, p.code AS project_code,
              COUNT(sub.id) FILTER (WHERE sub.deleted_at IS NULL) AS subtask_count
         FROM project_schema.tasks t
         LEFT JOIN auth_schema.users        u ON t.assignee_id=u.id
         LEFT JOIN project_schema.projects  p ON t.project_id=p.id
         LEFT JOIN project_schema.tasks   sub ON sub.parent_id=t.id
        WHERE ${where}
        GROUP BY t.id, u.display_name, u.avatar_url, p.name, p.code
        ORDER BY t.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*) FROM project_schema.tasks t WHERE ${where}`, params),
  ]);
  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

tasksRouter.get('/my', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.task_number, t.title, t.status, t.priority, t.due_date,
            p.name AS project_name, p.code AS project_code
       FROM project_schema.tasks t
       JOIN project_schema.projects p ON t.project_id=p.id
      WHERE t.assignee_id=$1 AND t.status NOT IN ('done','cancelled') AND t.deleted_at IS NULL
      ORDER BY t.priority DESC, t.due_date ASC NULLS LAST
      LIMIT 50`,
    [req.userId]
  );
  return success(res, rows);
}));

tasksRouter.get('/:id', authenticate, requirePermission('task.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.*,
            u.display_name AS assignee_name, u.avatar_url AS assignee_avatar,
            r.display_name AS reporter_name,
            p.name AS project_name, p.code AS project_code
       FROM project_schema.tasks t
       LEFT JOIN auth_schema.users       u ON t.assignee_id=u.id
       LEFT JOIN auth_schema.users       r ON t.reporter_id=r.id
       LEFT JOIN project_schema.projects p ON t.project_id=p.id
      WHERE t.id=$1 AND t.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Task not found', 404);

  const task = rows[0];
  const [subtasks, comments, attachments, timeEntries] = await Promise.all([
    query(`SELECT t.id, t.task_number, t.title, t.status, u.display_name AS assignee_name
             FROM project_schema.tasks t LEFT JOIN auth_schema.users u ON t.assignee_id=u.id
            WHERE t.parent_id=$1 AND t.deleted_at IS NULL ORDER BY t.created_at`, [task.id]),
    query(`SELECT c.*, u.display_name AS author_name, u.avatar_url AS author_avatar
             FROM project_schema.task_comments c
             JOIN auth_schema.users u ON c.author_id=u.id
            WHERE c.task_id=$1 AND c.deleted_at IS NULL ORDER BY c.created_at ASC`, [task.id]),
    query(`SELECT ta.*, m.cdn_url, m.file_name, m.file_size
             FROM project_schema.task_attachments ta
             JOIN cms_schema.media m ON ta.media_id=m.id
            WHERE ta.task_id=$1`, [task.id]),
    query(`SELECT te.*, u.display_name AS user_name FROM project_schema.time_entries te
             JOIN auth_schema.users u ON te.user_id=u.id
            WHERE te.task_id=$1 ORDER BY te.started_at DESC LIMIT 10`, [task.id]),
  ]);

  return success(res, { ...task, subtasks: subtasks.rows, comments: comments.rows, attachments: attachments.rows, time_entries: timeEntries.rows });
}));

tasksRouter.post('/', authenticate, requirePermission('task.create'), asyncHandler(async (req, res) => {
  const { project_id, parent_id, sprint_id, milestone_id, assignee_id,
          title, description, type, status, priority, due_date, estimated_hours,
          story_points, tags, custom_fields } = req.body;
  if (!project_id || !title) throw new AppError('project_id and title required');

  // Generate task number
  const { rows: numRows } = await query(
    `SELECT COALESCE(MAX(CAST(SPLIT_PART(task_number,'-',2) AS INT)),0)+1 AS next
       FROM project_schema.tasks WHERE project_id=$1`,
    [project_id]
  );
  const { rows: projRows } = await query(`SELECT code FROM project_schema.projects WHERE id=$1`, [project_id]);
  const taskNumber = `${projRows[0]?.code || 'TSK'}-${numRows[0].next}`;

  const { rows } = await query(
    `INSERT INTO project_schema.tasks
       (project_id, parent_id, sprint_id, milestone_id, reporter_id, assignee_id,
        task_number, title, description, type, status, priority, due_date,
        estimated_hours, story_points, tags, custom_fields)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::task_status,$12::priority_level,$13,$14,$15,$16,$17::jsonb)
     RETURNING *`,
    [project_id, parent_id || null, sprint_id || null, milestone_id || null,
     req.userId, assignee_id || null, taskNumber, title, description,
     type || 'task', status || 'todo', priority || 'medium', due_date,
     estimated_hours, story_points, tags || [], JSON.stringify(custom_fields || {})]
  );
  return created(res, rows[0]);
}));

tasksRouter.patch('/:id', authenticate, requirePermission('task.edit'), asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignee_id, due_date,
          estimated_hours, story_points, tags, completed_at, sprint_id } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.tasks
        SET title          = COALESCE($2, title),
            description    = COALESCE($3, description),
            status         = COALESCE($4::task_status, status),
            priority       = COALESCE($5::priority_level, priority),
            assignee_id    = COALESCE($6, assignee_id),
            due_date       = COALESCE($7, due_date),
            estimated_hours= COALESCE($8, estimated_hours),
            story_points   = COALESCE($9, story_points),
            tags           = COALESCE($10, tags),
            completed_at   = CASE WHEN $4='done' AND status != 'done' THEN NOW() ELSE COALESCE($11, completed_at) END,
            sprint_id      = COALESCE($12, sprint_id)
      WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
    [req.params.id, title, description, status, priority, assignee_id,
     due_date, estimated_hours, story_points, tags, completed_at, sprint_id]
  );
  if (!rows.length) throw new AppError('Task not found', 404);
  return success(res, rows[0]);
}));

tasksRouter.delete('/:id', authenticate, requirePermission('task.delete'), asyncHandler(async (req, res) => {
  await query(`UPDATE project_schema.tasks SET deleted_at=NOW() WHERE id=$1`, [req.params.id]);
  return noContent(res);
}));

// Task Comments
tasksRouter.post('/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { content, parent_id } = req.body;
  if (!content) throw new AppError('content required');
  const { rows } = await query(
    `INSERT INTO project_schema.task_comments (task_id, author_id, content, parent_id)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.userId, content, parent_id || null]
  );
  return created(res, rows[0]);
}));

tasksRouter.patch('/:id/comments/:commentId', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.task_comments SET content=$3, is_edited=TRUE
      WHERE id=$1 AND task_id=$2 AND author_id=$4 RETURNING *`,
    [req.params.commentId, req.params.id, content, req.userId]
  );
  if (!rows.length) throw new AppError('Comment not found or not yours', 404);
  return success(res, rows[0]);
}));

tasksRouter.delete('/:id/comments/:commentId', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE project_schema.task_comments SET deleted_at=NOW() WHERE id=$1 AND author_id=$2`,
    [req.params.commentId, req.userId]
  );
  return noContent(res);
}));

// Task Attachments
tasksRouter.post('/:id/attachments', authenticate, asyncHandler(async (req, res) => {
  const { media_id } = req.body;
  if (!media_id) throw new AppError('media_id required');
  const { rows } = await query(
    `INSERT INTO project_schema.task_attachments (task_id, media_id, uploaded_by) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, media_id, req.userId]
  );
  return created(res, rows[0]);
}));

tasksRouter.delete('/:id/attachments/:attachId', authenticate, asyncHandler(async (req, res) => {
  await query(`DELETE FROM project_schema.task_attachments WHERE id=$1 AND task_id=$2`, [req.params.attachId, req.params.id]);
  return noContent(res);
}));

// ════════════════════════════════════════════════════════════
//  SPRINTS
// ════════════════════════════════════════════════════════════
const sprintsRouter = require('express').Router();

sprintsRouter.get('/', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { project_id, status } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;
  if (project_id) { conditions.push(`s.project_id=$${idx}`); params.push(project_id); idx++; }
  if (status)     { conditions.push(`s.status=$${idx}::sprint_status`); params.push(status); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT s.*, COUNT(t.id) AS task_count,
            COUNT(t.id) FILTER (WHERE t.status='done') AS completed_count
       FROM project_schema.sprints s
       LEFT JOIN project_schema.tasks t ON t.sprint_id=s.id AND t.deleted_at IS NULL
       ${where}
      GROUP BY s.id ORDER BY s.start_date DESC`,
    params
  );
  return success(res, rows);
}));

sprintsRouter.get('/:id', authenticate, requirePermission('project.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT * FROM project_schema.sprints WHERE id=$1`, [req.params.id]);
  if (!rows.length) throw new AppError('Sprint not found', 404);
  const tasks = await query(
    `SELECT t.id, t.task_number, t.title, t.status, t.priority, t.story_points,
            u.display_name AS assignee_name FROM project_schema.tasks t
       LEFT JOIN auth_schema.users u ON t.assignee_id=u.id
      WHERE t.sprint_id=$1 AND t.deleted_at IS NULL ORDER BY t.priority DESC`,
    [req.params.id]
  );
  return success(res, { ...rows[0], tasks: tasks.rows });
}));

sprintsRouter.post('/', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { project_id, name, goal, start_date, end_date } = req.body;
  if (!project_id || !name || !start_date || !end_date) throw new AppError('project_id, name, start_date, end_date required');
  const { rows } = await query(
    `INSERT INTO project_schema.sprints (project_id, name, goal, start_date, end_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [project_id, name, goal, start_date, end_date, req.userId]
  );
  return created(res, rows[0]);
}));

sprintsRouter.patch('/:id', authenticate, requirePermission('project.edit'), asyncHandler(async (req, res) => {
  const { name, goal, status, start_date, end_date, velocity } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.sprints
        SET name       = COALESCE($2, name),
            goal       = COALESCE($3, goal),
            status     = COALESCE($4::sprint_status, status),
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
//  TIME ENTRIES
// ════════════════════════════════════════════════════════════
const timeRouter = require('express').Router();

timeRouter.get('/', authenticate, requirePermission('time.read'), paginate, asyncHandler(async (req, res) => {
  const { project_id, task_id, user_id, from_date, to_date, is_billable } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (project_id)  { conditions.push(`te.project_id=$${idx}`); params.push(project_id); idx++; }
  if (task_id)     { conditions.push(`te.task_id=$${idx}`);    params.push(task_id);    idx++; }
  if (user_id)     { conditions.push(`te.user_id=$${idx}`);    params.push(user_id);    idx++; }
  if (is_billable !== undefined) { conditions.push(`te.is_billable=$${idx}`); params.push(is_billable === 'true'); idx++; }
  if (from_date)   { conditions.push(`te.started_at >= $${idx}`); params.push(from_date); idx++; }
  if (to_date)     { conditions.push(`te.started_at <= $${idx}`); params.push(to_date);   idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT te.*, u.display_name AS user_name, t.title AS task_title, t.task_number,
              p.name AS project_name, p.code AS project_code
         FROM project_schema.time_entries te
         JOIN auth_schema.users u ON te.user_id=u.id
         LEFT JOIN project_schema.tasks    t ON te.task_id=t.id
         LEFT JOIN project_schema.projects p ON te.project_id=p.id
         ${where}
        ORDER BY te.started_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(`SELECT COUNT(*), SUM(te.hours) AS total_hours FROM project_schema.time_entries te ${where}`, params),
  ]);

  return res.json({
    ...paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination),
    total_hours: parseFloat(countRes.rows[0].total_hours || 0),
  });
}));

timeRouter.get('/my', authenticate, asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const { rows } = await query(
    `SELECT te.*, t.title AS task_title, p.name AS project_name
       FROM project_schema.time_entries te
       LEFT JOIN project_schema.tasks    t ON te.task_id=t.id
       LEFT JOIN project_schema.projects p ON te.project_id=p.id
      WHERE te.user_id=$1
        AND ($2::date IS NULL OR te.started_at >= $2)
        AND ($3::date IS NULL OR te.started_at <= $3)
      ORDER BY te.started_at DESC LIMIT 100`,
    [req.userId, from_date || null, to_date || null]
  );
  return success(res, rows);
}));

timeRouter.post('/', authenticate, asyncHandler(async (req, res) => {
  const { project_id, task_id, description, hours, started_at, ended_at, is_billable, billing_rate } = req.body;
  if (!project_id || !hours) throw new AppError('project_id and hours required');

  const { rows } = await query(
    `INSERT INTO project_schema.time_entries
       (project_id, task_id, user_id, description, hours, started_at, ended_at, is_billable, billing_rate)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [project_id, task_id || null, req.userId, description, hours,
     started_at || new Date(), ended_at || null, is_billable !== false, billing_rate || 0]
  );

  // Update task actual_hours
  if (task_id) {
    await query(
      `UPDATE project_schema.tasks SET actual_hours=actual_hours+$1 WHERE id=$2`,
      [hours, task_id]
    );
  }
  // Update project non_billable / billable hours
  const field = is_billable !== false ? 'billable_hours' : 'non_billable_hours';
  await query(`UPDATE project_schema.projects SET ${field}=${field}+$1 WHERE id=$2`, [hours, project_id]);

  return created(res, rows[0]);
}));

timeRouter.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { description, hours, is_billable, billing_rate } = req.body;
  const { rows } = await query(
    `UPDATE project_schema.time_entries
        SET description  = COALESCE($2, description),
            hours        = COALESCE($3, hours),
            is_billable  = COALESCE($4, is_billable),
            billing_rate = COALESCE($5, billing_rate)
      WHERE id=$1 AND user_id=$6 RETURNING *`,
    [req.params.id, description, hours, is_billable, billing_rate, req.userId]
  );
  if (!rows.length) throw new AppError('Time entry not found or not yours', 404);
  return success(res, rows[0]);
}));

timeRouter.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM project_schema.time_entries WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  if (!rowCount) throw new AppError('Time entry not found or not yours', 404);
  return noContent(res);
}));

// Summary
timeRouter.get('/summary', authenticate, requirePermission('time.read'), asyncHandler(async (req, res) => {
  const { project_id, from_date, to_date } = req.query;
  const { rows } = await query(
    `SELECT u.display_name AS user_name,
            SUM(te.hours) AS total_hours,
            SUM(te.hours) FILTER (WHERE te.is_billable) AS billable_hours,
            SUM(te.hours) FILTER (WHERE NOT te.is_billable) AS non_billable_hours
       FROM project_schema.time_entries te
       JOIN auth_schema.users u ON te.user_id=u.id
      WHERE ($1::uuid IS NULL OR te.project_id=$1)
        AND ($2::date IS NULL OR te.started_at >= $2)
        AND ($3::date IS NULL OR te.started_at <= $3)
      GROUP BY te.user_id, u.display_name ORDER BY total_hours DESC`,
    [project_id || null, from_date || null, to_date || null]
  );
  return success(res, rows);
}));

module.exports = { router, tasksRouter, sprintsRouter, timeRouter };
