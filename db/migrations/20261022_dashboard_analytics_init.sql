-- db/migrations/20261022_dashboard_analytics_init.sql
-- Migration: Add missing analytics partitions, indexes, permissions, and compatibility views

-- 1. Analytics Page Views Partitions
-- Ensure partitions exist for 2026 Q3, Q4, and 2027 Q1, plus a DEFAULT partition
DO $$
BEGIN
  -- Add visitor_id column to analytics_schema.page_views if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'analytics_schema' AND table_name = 'page_views' AND column_name = 'visitor_id'
  ) THEN
    ALTER TABLE analytics_schema.page_views ADD COLUMN visitor_id VARCHAR(80);
  END IF;

  -- Create partition for 2026 Q3 (July - October 2026)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'analytics_schema' AND c.relname = 'page_views_2026_q3'
  ) THEN
    CREATE TABLE analytics_schema.page_views_2026_q3 PARTITION OF analytics_schema.page_views
      FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
  END IF;

  -- Create partition for 2026 Q4 (October 2026 - January 2027)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'analytics_schema' AND c.relname = 'page_views_2026_q4'
  ) THEN
    CREATE TABLE analytics_schema.page_views_2026_q4 PARTITION OF analytics_schema.page_views
      FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
  END IF;

  -- Create partition for 2027 Q1 (January 2027 - April 2027)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'analytics_schema' AND c.relname = 'page_views_2027_q1'
  ) THEN
    CREATE TABLE analytics_schema.page_views_2027_q1 PARTITION OF analytics_schema.page_views
      FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');
  END IF;

  -- Create DEFAULT partition for any dates outside defined ranges
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'analytics_schema' AND c.relname = 'page_views_default'
  ) THEN
    CREATE TABLE analytics_schema.page_views_default PARTITION OF analytics_schema.page_views DEFAULT;
  END IF;
END $$;

-- Indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON analytics_schema.page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON analytics_schema.page_views (visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON analytics_schema.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON analytics_schema.page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON analytics_schema.page_views (country);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON analytics_schema.page_views (device_type);

-- 2. Ensure Permissions exist for projects and tasks
DO $$
DECLARE
  v_perm_id UUID;
  v_role_id UUID;
BEGIN
  -- Insert project.read if missing
  IF NOT EXISTS (SELECT 1 FROM auth_schema.permissions WHERE slug = 'project.read') THEN
    INSERT INTO auth_schema.permissions (name, slug, module, description)
    VALUES ('View Projects', 'project.read', 'projects', 'View client and company projects');
  END IF;

  -- Insert project.create if missing
  IF NOT EXISTS (SELECT 1 FROM auth_schema.permissions WHERE slug = 'project.create') THEN
    INSERT INTO auth_schema.permissions (name, slug, module, description)
    VALUES ('Create Projects', 'project.create', 'projects', 'Create new client and company projects');
  END IF;

  -- Insert project.manage if missing
  IF NOT EXISTS (SELECT 1 FROM auth_schema.permissions WHERE slug = 'project.manage') THEN
    INSERT INTO auth_schema.permissions (name, slug, module, description)
    VALUES ('Manage Projects', 'project.manage', 'projects', 'Update, manage, and delete projects');
  END IF;

  -- Insert billing.read if missing
  IF NOT EXISTS (SELECT 1 FROM auth_schema.permissions WHERE slug = 'billing.read') THEN
    INSERT INTO auth_schema.permissions (name, slug, module, description)
    VALUES ('View Billing Reports', 'billing.read', 'billing', 'View high-level financial reports');
  END IF;

  -- Grant project.read, task.read to client role
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = 'client';
  IF v_role_id IS NOT NULL THEN
    -- project.read
    SELECT id INTO v_perm_id FROM auth_schema.permissions WHERE slug = 'project.read';
    IF v_perm_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM auth_schema.role_permissions WHERE role_id = v_role_id AND permission_id = v_perm_id
    ) THEN
      INSERT INTO auth_schema.role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id);
    END IF;

    -- task.read
    SELECT id INTO v_perm_id FROM auth_schema.permissions WHERE slug = 'task.read';
    IF v_perm_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM auth_schema.role_permissions WHERE role_id = v_role_id AND permission_id = v_perm_id
    ) THEN
      INSERT INTO auth_schema.role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id);
    END IF;
  END IF;
END $$;

-- 3. Compatibility Schemas & Views
-- Ensures legacy or cross-schema queries to finance_schema and project_schema function seamlessly
CREATE SCHEMA IF NOT EXISTS finance_schema;
CREATE SCHEMA IF NOT EXISTS project_schema;

-- finance_schema.invoices view pointing to billing_schema.invoices
DROP VIEW IF EXISTS finance_schema.v_invoice_summary CASCADE;
DROP VIEW IF EXISTS finance_schema.invoices CASCADE;
CREATE OR REPLACE VIEW finance_schema.invoices AS
  SELECT
    id, invoice_number, client_id, project_id, proposal_id, milestone_id,
    status, issue_date, due_date, line_items, subtotal, discount_amount,
    tax_amount, total_amount, amount_paid, amount_due, currency, tax_rate_id,
    notes, terms, footer, pdf_url, sent_at, viewed_at, paid_at, overdue_at,
    reminder_sent_at, created_by, metadata, created_at, updated_at,
    NULL::timestamptz AS deleted_at
  FROM billing_schema.invoices;

-- finance_schema.v_invoice_summary view
CREATE OR REPLACE VIEW finance_schema.v_invoice_summary AS
  SELECT
    COUNT(*)::bigint AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid')::bigint AS paid_count,
    COUNT(*) FILTER (WHERE status = 'sent')::bigint AS pending_count,
    COUNT(*) FILTER (WHERE status = 'overdue')::bigint AS overdue_count,
    COALESCE(SUM(total_amount), 0)::numeric AS total_value,
    COALESCE(SUM(amount_paid), 0)::numeric AS total_collected
  FROM billing_schema.invoices;

-- project_schema.projects view pointing to client_schema.client_projects
DROP VIEW IF EXISTS project_schema.v_project_dashboard CASCADE;
DROP VIEW IF EXISTS project_schema.tasks CASCADE;
DROP VIEW IF EXISTS project_schema.projects CASCADE;
CREATE OR REPLACE VIEW project_schema.projects AS
  SELECT
    id,
    id::text AS code,
    title AS name,
    client_id,
    portfolio_id,
    description,
    status,
    priority,
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
    0::numeric AS billable_hours,
    0::numeric AS non_billable_hours,
    NULL::timestamptz AS deleted_at
  FROM client_schema.client_projects;

-- project_schema.v_project_dashboard view
CREATE OR REPLACE VIEW project_schema.v_project_dashboard AS
  SELECT
    cp.id,
    cp.id::text AS code,
    cp.title AS name,
    cp.status,
    cp.priority,
    cp.progress_percent,
    cp.budget,
    cp.spent AS budget_used,
    cp.project_manager AS manager_id,
    cl.company_name AS client_name,
    cp.created_at,
    cp.end_date
  FROM client_schema.client_projects cp
  LEFT JOIN client_schema.clients cl ON cp.client_id = cl.id;

-- project_schema.tasks view pointing to client_schema.tasks
CREATE OR REPLACE VIEW project_schema.tasks AS
  SELECT
    id,
    id::text AS task_number,
    project_id,
    milestone_id,
    title,
    description,
    status,
    priority,
    assigned_to AS assignee_id,
    reporter_id,
    due_date,
    estimated_h AS estimated_hours,
    logged_h AS logged_hours,
    tags,
    sort_order,
    completed_at,
    created_at,
    updated_at,
    NULL::timestamptz AS deleted_at
  FROM client_schema.tasks;

-- support_schema.v_ticket_stats view
CREATE OR REPLACE VIEW support_schema.v_ticket_stats AS
  SELECT
    COUNT(*)::bigint AS total_tickets,
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress', 'pending_client', 'on_hold'))::bigint AS open_count,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::bigint AS resolved_count,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed') AND resolved_at >= CURRENT_DATE)::bigint AS resolved_today,
    COUNT(*) FILTER (WHERE priority = 'critical')::bigint AS critical_count
  FROM support_schema.tickets;

-- support_schema.ticket_replies view pointing to support_schema.ticket_messages
DROP VIEW IF EXISTS support_schema.ticket_replies CASCADE;
CREATE OR REPLACE VIEW support_schema.ticket_replies AS
  SELECT
    id,
    ticket_id,
    author_id,
    content,
    is_internal,
    attachments,
    created_at,
    NULL::timestamptz AS deleted_at
  FROM support_schema.ticket_messages;

-- client_schema.client_portal_access view
CREATE OR REPLACE VIEW client_schema.client_portal_access AS
  SELECT
    c.id AS client_id,
    c.user_id,
    c.company_name
  FROM client_schema.clients c
  WHERE c.user_id IS NOT NULL;

-- analytics_schema.v_traffic_sources view
CREATE OR REPLACE VIEW analytics_schema.v_traffic_sources AS
  SELECT
    DATE(created_at) AS date,
    COALESCE(NULLIF(utm_source, ''), NULLIF(referrer, ''), 'direct') AS source,
    COUNT(*) AS visits,
    COUNT(DISTINCT session_id) AS sessions,
    COUNT(DISTINCT COALESCE(visitor_id, session_id)) AS unique_visitors
  FROM analytics_schema.page_views
  GROUP BY DATE(created_at), COALESCE(NULLIF(utm_source, ''), NULLIF(referrer, ''), 'direct');

-- Overload enqueue_job to accept integer priority
CREATE OR REPLACE FUNCTION system_schema.enqueue_job(
  p_job_type text,
  p_payload jsonb,
  p_queue text DEFAULT 'default'::text,
  p_priority integer DEFAULT 5,
  p_run_after timestamp with time zone DEFAULT now()
)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO system_schema.job_queue
    (queue_name, job_type, payload, priority, run_after)
  VALUES
    (p_queue, p_job_type, p_payload, p_priority::smallint, p_run_after)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

-- analytics_schema.v_conversion_funnel view
CREATE OR REPLACE VIEW analytics_schema.v_conversion_funnel AS
  SELECT
    (SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) FROM analytics_schema.page_views)::bigint AS visitors,
    (SELECT COUNT(*) FROM crm_schema.leads WHERE deleted_at IS NULL)::bigint AS leads,
    (SELECT COUNT(*) FROM crm_schema.proposals)::bigint AS proposals,
    (SELECT COUNT(*) FROM client_schema.clients)::bigint AS clients;
