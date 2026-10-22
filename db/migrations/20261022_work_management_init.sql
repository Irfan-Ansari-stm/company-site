-- Migration: 20261022_work_management_init.sql
-- Work Management Module: Projects, Tasks, Time Tracking, Sprints, Members, and Activities

-- 1. Enum updates for project_status if needed
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'in_progress';

-- 2. Ensure columns on client_schema.client_projects
ALTER TABLE client_schema.client_projects
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'fixed_price',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billable_hours NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS non_billable_hours NUMERIC(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_client_projects_deleted ON client_schema.client_projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON client_schema.client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_schema.client_projects(status);

-- 3. Ensure columns on client_schema.tasks
ALTER TABLE client_schema.tasks
  ADD COLUMN IF NOT EXISTS task_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS story_points NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES client_schema.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sprint_id UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON client_schema.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON client_schema.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON client_schema.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON client_schema.tasks(deleted_at);

-- 4. Time tracking base table
CREATE TABLE IF NOT EXISTS client_schema.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES client_schema.tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  description TEXT,
  hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_billable BOOLEAN DEFAULT TRUE,
  billing_rate NUMERIC(10,2) DEFAULT 0,
  is_active_timer BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index enforcing at most ONE active timer per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_timer_user ON client_schema.time_entries(user_id) WHERE is_active_timer = TRUE;
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON client_schema.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON client_schema.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON client_schema.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_started_at ON client_schema.time_entries(started_at);

-- 5. Project Members table
CREATE TABLE IF NOT EXISTS client_schema.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  hourly_rate NUMERIC(10,2),
  added_by UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_proj ON client_schema.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON client_schema.project_members(user_id);

-- 6. Sprints table
CREATE TABLE IF NOT EXISTS client_schema.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  goal TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  velocity NUMERIC(6,2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth_schema.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sprints_project ON client_schema.sprints(project_id);

-- 7. Task Comments table
CREATE TABLE IF NOT EXISTS client_schema.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES client_schema.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES client_schema.task_comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON client_schema.task_comments(task_id);

-- 8. Task Attachments table
CREATE TABLE IF NOT EXISTS client_schema.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES client_schema.tasks(id) ON DELETE CASCADE,
  media_id UUID NOT NULL,
  uploaded_by UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON client_schema.task_attachments(task_id);

-- 9. Project Activity Log table
CREATE TABLE IF NOT EXISTS client_schema.project_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_activity_proj ON client_schema.project_activity_log(project_id);

-- 10. Re-create / Update Views in project_schema to map cleanly
DROP VIEW IF EXISTS project_schema.v_project_dashboard CASCADE;
DROP VIEW IF EXISTS project_schema.tasks CASCADE;
DROP VIEW IF EXISTS project_schema.projects CASCADE;

CREATE OR REPLACE VIEW project_schema.projects AS
  SELECT
    id,
    COALESCE(code, 'PRJ-' || UPPER(SUBSTRING(id::text, 1, 6))) AS code,
    title AS name,
    client_id,
    portfolio_id,
    description,
    type,
    status::text AS status,
    priority::text AS priority,
    start_date,
    end_date,
    actual_end_date,
    budget,
    spent AS budget_used,
    currency,
    progress_percent,
    health AS health_status,
    is_client_visible,
    project_manager AS manager_id,
    tech_lead,
    tech_stack,
    repository_url,
    staging_url,
    production_url,
    metadata,
    created_at,
    updated_at,
    billable_hours,
    non_billable_hours,
    deleted_at
  FROM client_schema.client_projects;

CREATE OR REPLACE VIEW project_schema.tasks AS
  SELECT
    id,
    COALESCE(task_number, 'TSK-' || UPPER(SUBSTRING(id::text, 1, 6))) AS task_number,
    project_id,
    milestone_id,
    parent_id,
    sprint_id,
    title,
    description,
    type,
    status,
    priority,
    assigned_to AS assignee_id,
    reporter_id,
    due_date,
    estimated_h AS estimated_hours,
    logged_h AS actual_hours,
    logged_h AS logged_hours,
    story_points,
    tags,
    sort_order,
    completed_at,
    created_at,
    updated_at,
    deleted_at
  FROM client_schema.tasks;

CREATE OR REPLACE VIEW project_schema.v_project_dashboard AS
  SELECT
    cp.id,
    COALESCE(cp.code, 'PRJ-' || UPPER(SUBSTRING(cp.id::text, 1, 6))) AS code,
    cp.title AS name,
    cp.status::text AS status,
    cp.priority::text AS priority,
    cp.progress_percent,
    cp.budget,
    cp.spent AS budget_used,
    cp.project_manager AS manager_id,
    cl.company_name AS client_name,
    cp.created_at,
    cp.end_date,
    cp.deleted_at
  FROM client_schema.client_projects cp
  LEFT JOIN client_schema.clients cl ON cp.client_id = cl.id;

CREATE OR REPLACE VIEW project_schema.time_entries AS
  SELECT * FROM client_schema.time_entries;

CREATE OR REPLACE VIEW project_schema.project_members AS
  SELECT * FROM client_schema.project_members;

CREATE OR REPLACE VIEW project_schema.sprints AS
  SELECT * FROM client_schema.sprints;

CREATE OR REPLACE VIEW project_schema.task_comments AS
  SELECT * FROM client_schema.task_comments;

CREATE OR REPLACE VIEW project_schema.task_attachments AS
  SELECT * FROM client_schema.task_attachments;

CREATE OR REPLACE VIEW project_schema.project_activity_log AS
  SELECT * FROM client_schema.project_activity_log;

CREATE OR REPLACE VIEW project_schema.milestones AS
  SELECT * FROM client_schema.milestones;

CREATE OR REPLACE VIEW project_schema.project_files AS
  SELECT * FROM client_schema.project_files;

-- 11. Add missing permissions to auth_schema
INSERT INTO auth_schema.permissions (id, name, slug, description, module, action)
VALUES
  (gen_random_uuid(), 'Edit Projects', 'project.edit', 'Edit project details', 'projects', 'edit'),
  (gen_random_uuid(), 'Delete Projects', 'project.delete', 'Delete or archive projects', 'projects', 'delete'),
  (gen_random_uuid(), 'Create Tasks', 'task.create', 'Create tasks in projects', 'tasks', 'create'),
  (gen_random_uuid(), 'Edit Tasks', 'task.edit', 'Edit tasks', 'tasks', 'edit'),
  (gen_random_uuid(), 'Delete Tasks', 'task.delete', 'Delete tasks', 'tasks', 'delete'),
  (gen_random_uuid(), 'View Time Entries', 'time.read', 'View logged time entries', 'time', 'read'),
  (gen_random_uuid(), 'Manage Time Entries', 'time.manage', 'Create, edit, delete time entries', 'time', 'manage')
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions to admin role
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth_schema.roles WHERE slug = 'admin' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO auth_schema.role_permissions (role_id, permission_id)
    SELECT v_admin_id, p.id FROM auth_schema.permissions p
    WHERE p.slug IN (
      'project.read', 'project.create', 'project.edit', 'project.delete', 'project.manage',
      'task.read', 'task.create', 'task.edit', 'task.delete', 'task.manage',
      'time.read', 'time.manage'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
