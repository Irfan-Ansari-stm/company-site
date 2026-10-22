-- ============================================================
-- MIGRATION: Dynamic RBAC, Sole Super Admin Safeguards,
--            Dashboard Modules & Client Access Control
-- Location: db/migration_rbac_superadmin.sql
-- ============================================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add is_active column to auth_schema.roles if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
     WHERE table_schema = 'auth_schema' AND table_name = 'roles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE auth_schema.roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 3. Add action column to auth_schema.permissions if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
     WHERE table_schema = 'auth_schema' AND table_name = 'permissions' AND column_name = 'action'
  ) THEN
    ALTER TABLE auth_schema.permissions ADD COLUMN action VARCHAR(60);
  END IF;
END $$;

-- Populate action from slug (e.g., 'user.create' -> 'create', 'page.publish' -> 'publish')
UPDATE auth_schema.permissions
   SET action = split_part(slug, '.', 2)
 WHERE action IS NULL AND slug LIKE '%.%';

UPDATE auth_schema.permissions
   SET action = 'manage'
 WHERE action IS NULL;

-- 4. Audit logs default partition (safety for partitioning)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'system_schema' AND c.relname = 'audit_logs_default'
  ) THEN
    CREATE TABLE system_schema.audit_logs_default PARTITION OF system_schema.audit_logs DEFAULT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Partition might already exist or overlap handled
  NULL;
END $$;

-- 5. Dashboard Modules & Client Access Table
CREATE TABLE IF NOT EXISTS auth_schema.dashboard_modules (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key                 VARCHAR(80) UNIQUE NOT NULL,
  name                VARCHAR(100) NOT NULL,
  description         TEXT,
  icon                VARCHAR(60) NOT NULL DEFAULT 'LayoutDashboard',
  is_client_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_client_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  widgets             JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions             JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Dashboard Modules
INSERT INTO auth_schema.dashboard_modules (key, name, description, icon, is_client_available, is_client_enabled, widgets, actions, sort_order)
VALUES
  ('overview', 'Dashboard Overview', 'Overview KPIs, activity charts and portal home', 'LayoutDashboard', TRUE, TRUE, 
   '[{"key": "kpi_summary", "name": "KPI Summary Cards", "enabled": true}, {"key": "recent_activity", "name": "Recent Activity Feed", "enabled": true}, {"key": "project_progress", "name": "Project Progress Widget", "enabled": true}, {"key": "quick_actions", "name": "Quick Action Buttons", "enabled": true}]'::jsonb,
   '["view"]'::jsonb, 1),
  ('projects', 'Projects & Work', 'Active client deliverables, milestones and tasks', 'FolderKanban', TRUE, TRUE,
   '[{"key": "project_list", "name": "My Projects Table", "enabled": true}, {"key": "task_board", "name": "Tasks & Milestones", "enabled": true}, {"key": "timeline_view", "name": "Timeline & Sprints", "enabled": false}]'::jsonb,
   '["view", "download"]'::jsonb, 2),
  ('finance', 'Invoices & Billing', 'Billing history, invoices and payment processing', 'DollarSign', TRUE, TRUE,
   '[{"key": "invoice_summary", "name": "Invoices Summary", "enabled": true}, {"key": "invoice_table", "name": "Invoice List", "enabled": true}, {"key": "payment_portal", "name": "Pay Now Gateway", "enabled": true}]'::jsonb,
   '["view", "download", "pay"]'::jsonb, 3),
  ('support', 'Support & Tickets', 'Support tickets, communications and help desk', 'HeadphonesIcon', TRUE, TRUE,
   '[{"key": "ticket_stats", "name": "Ticket Status Cards", "enabled": true}, {"key": "ticket_list", "name": "Ticket List & Thread", "enabled": true}, {"key": "kb_articles", "name": "Knowledgebase Articles", "enabled": true}]'::jsonb,
   '["view", "create", "reply", "close"]'::jsonb, 4),
  ('services', 'Services & Catalog', 'Browse and request digital services and packages', 'Briefcase', TRUE, TRUE,
   '[{"key": "service_catalog", "name": "Service Catalog Grid", "enabled": true}, {"key": "package_pricing", "name": "Service Pricing", "enabled": true}]'::jsonb,
   '["view", "request"]'::jsonb, 5),
  ('crm', 'CRM & Leads', 'Customer pipeline, leads, meetings, and proposals', 'PieChart', FALSE, FALSE,
   '[{"key": "lead_pipeline", "name": "Pipeline Funnel", "enabled": false}, {"key": "lead_table", "name": "Leads Table", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "export"]'::jsonb, 6),
  ('analytics', 'Analytics & Reports', 'Website traffic, financial metrics and performance', 'BarChart3', FALSE, FALSE,
   '[{"key": "traffic_chart", "name": "Traffic Charts", "enabled": false}, {"key": "revenue_analytics", "name": "Revenue Analytics", "enabled": false}]'::jsonb,
   '["view", "export"]'::jsonb, 7),
  ('cms', 'Content Management', 'Manage web pages, banners, redirects and navigation', 'Globe', FALSE, FALSE,
   '[{"key": "pages_list", "name": "CMS Pages Table", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "publish"]'::jsonb, 8),
  ('blog', 'Blog & Articles', 'Manage company blog posts and articles', 'FileText', FALSE, FALSE,
   '[{"key": "posts_table", "name": "Posts Table", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "publish"]'::jsonb, 9),
  ('portfolio', 'Portfolio & Case Studies', 'Company portfolio showcases and client case studies', 'Image', FALSE, FALSE,
   '[{"key": "portfolio_grid", "name": "Portfolio Grid", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "publish"]'::jsonb, 10),
  ('hr', 'HR & Recruitment', 'Job openings, candidates, and hiring applications', 'UserCheck', FALSE, FALSE,
   '[{"key": "job_postings", "name": "Job Postings", "enabled": false}, {"key": "applicant_tracker", "name": "Applicant Tracker", "enabled": false}]'::jsonb,
   '["view", "manage", "review"]'::jsonb, 11),
  ('marketing', 'Marketing & Campaigns', 'Email marketing, newsletters, and ad campaigns', 'Megaphone', FALSE, FALSE,
   '[{"key": "campaign_stats", "name": "Campaign Metrics", "enabled": false}]'::jsonb,
   '["view", "create", "send"]'::jsonb, 12),
  ('ai', 'AI Assistant & Tools', 'AI generation, copywriting, and automated agents', 'Bot', TRUE, FALSE,
   '[{"key": "ai_chat", "name": "AI Assistant Chat", "enabled": true}]'::jsonb,
   '["use"]'::jsonb, 13),
  ('media', 'Media Library', 'Assets, images, documents, and cloud storage files', 'Image', FALSE, FALSE,
   '[{"key": "media_browser", "name": "Asset Explorer", "enabled": false}]'::jsonb,
   '["view", "upload", "delete"]'::jsonb, 14),
  ('users', 'User Management', 'User directory, account activations, and role assignment', 'Users', FALSE, FALSE,
   '[{"key": "users_table", "name": "User List Table", "enabled": false}, {"key": "invitations", "name": "Invitations", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "assign_role"]'::jsonb, 15),
  ('roles', 'Roles & Permissions', 'RBAC role creation, module access, and permission matrix', 'Shield', FALSE, FALSE,
   '[{"key": "roles_list", "name": "Roles Table", "enabled": false}, {"key": "permissions_matrix", "name": "Permissions Matrix", "enabled": false}]'::jsonb,
   '["view", "create", "update", "delete", "assign_permissions"]'::jsonb, 16),
  ('system', 'System Settings & Audit', 'Platform configuration, API keys, and audit log explorer', 'Settings', FALSE, FALSE,
   '[{"key": "system_status", "name": "System Health", "enabled": false}, {"key": "audit_logs", "name": "Audit Log Explorer", "enabled": false}]'::jsonb,
   '["view", "manage"]'::jsonb, 17)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_client_available = EXCLUDED.is_client_available,
  sort_order = EXCLUDED.sort_order;

-- 6. Add Essential Missing RBAC Permissions
INSERT INTO auth_schema.permissions (name, slug, module, action, description)
VALUES
  ('View Dashboard',         'dashboard.view',         'dashboard', 'view',   'Access the dashboard overview'),
  ('View Dashboard Stats',   'dashboard.stats.view',   'dashboard', 'view',   'View statistical KPI cards'),
  ('View Roles',             'role.view',              'roles',     'view',   'View all roles and definitions'),
  ('Manage Roles',           'role.manage',            'roles',     'manage', 'Create, update, delete custom roles'),
  ('Assign Permissions',     'role.permissions.manage','roles',     'manage', 'Configure permissions for roles'),
  ('Manage Client Access',   'client.access.manage',   'system',    'manage', 'Configure client dashboard module visibility'),
  ('View Tasks',             'task.read',              'projects',  'read',   'View project tasks'),
  ('Manage Tasks',           'task.manage',            'projects',  'manage', 'Create, edit and manage project tasks')
ON CONFLICT (slug) DO UPDATE SET
  action = EXCLUDED.action,
  description = COALESCE(EXCLUDED.description, auth_schema.permissions.description);

-- 7. Sync user_roles with users.role function & trigger
CREATE OR REPLACE FUNCTION auth_schema.sync_user_primary_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Look up role_id from auth_schema.roles by slug
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = NEW.role::text;
  
  IF v_role_id IS NOT NULL THEN
    -- Ensure entry in user_roles
    INSERT INTO auth_schema.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Clean up any obsolete primary roles if user role was changed
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
      DELETE FROM auth_schema.user_roles
       WHERE user_id = NEW.id
         AND role_id IN (SELECT id FROM auth_schema.roles WHERE slug = OLD.role::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_primary_role ON auth_schema.users;
CREATE TRIGGER trg_sync_user_primary_role
  AFTER INSERT OR UPDATE OF role ON auth_schema.users
  FOR EACH ROW EXECUTE FUNCTION auth_schema.sync_user_primary_role();

-- 8. Backfill existing users into user_roles
INSERT INTO auth_schema.user_roles (user_id, role_id)
SELECT u.id, r.id
  FROM auth_schema.users u
  JOIN auth_schema.roles r ON u.role::text = r.slug
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 9. Updated user_has_permission & get_user_permissions with role is_active check
CREATE OR REPLACE FUNCTION auth_schema.user_has_permission(
  p_user_id    UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin has universal bypass
  IF EXISTS (
    SELECT 1 FROM auth_schema.users
     WHERE id = p_user_id AND role = 'super_admin' AND is_active = TRUE AND deleted_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM auth_schema.user_roles ur
      JOIN auth_schema.roles r             ON ur.role_id = r.id
      JOIN auth_schema.role_permissions rp ON ur.role_id = rp.role_id
      JOIN auth_schema.permissions p       ON rp.permission_id = p.id
     WHERE ur.user_id = p_user_id
       AND r.is_active = TRUE
       AND p.slug = p_permission
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_schema.get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_perms TEXT[];
  v_is_super BOOLEAN;
BEGIN
  -- Check if super_admin
  SELECT (role = 'super_admin') INTO v_is_super
    FROM auth_schema.users
   WHERE id = p_user_id AND is_active = TRUE AND deleted_at IS NULL;

  IF v_is_super = TRUE THEN
    SELECT ARRAY_AGG(slug) INTO v_perms FROM auth_schema.permissions;
    RETURN COALESCE(v_perms, '{}');
  END IF;

  SELECT ARRAY_AGG(DISTINCT p.slug)
    INTO v_perms
    FROM auth_schema.user_roles ur
    JOIN auth_schema.roles r             ON ur.role_id = r.id
    JOIN auth_schema.role_permissions rp ON ur.role_id = rp.role_id
    JOIN auth_schema.permissions p       ON rp.permission_id = p.id
   WHERE ur.user_id = p_user_id
     AND r.is_active = TRUE
     AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

  RETURN COALESCE(v_perms, '{}');
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Sole Super Admin Protection Trigger
CREATE OR REPLACE FUNCTION auth_schema.check_sole_super_admin_protection()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND (NEW.deleted_at IS NOT NULL OR NEW.is_active = FALSE OR NEW.role <> 'super_admin')) THEN
    IF OLD.role = 'super_admin' THEN
      SELECT COUNT(*) INTO v_count
        FROM auth_schema.users
       WHERE role = 'super_admin' AND is_active = TRUE AND deleted_at IS NULL;
      
      IF v_count <= 1 THEN
        RAISE EXCEPTION 'Security Policy Violation: Cannot delete, deactivate, or demote the sole Super Admin account.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sole_super_admin_protection ON auth_schema.users;
CREATE TRIGGER trg_sole_super_admin_protection
  BEFORE UPDATE OR DELETE ON auth_schema.users
  FOR EACH ROW EXECUTE FUNCTION auth_schema.check_sole_super_admin_protection();

-- 11. Protected System Roles Trigger
CREATE OR REPLACE FUNCTION auth_schema.check_protected_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.slug IN ('super_admin', 'client') THEN
      RAISE EXCEPTION 'Security Policy Violation: Cannot delete essential system role %', OLD.slug;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.slug IN ('super_admin', 'client') AND NEW.is_active = FALSE THEN
      RAISE EXCEPTION 'Security Policy Violation: Cannot deactivate essential system role %', OLD.slug;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protected_roles ON auth_schema.roles;
CREATE TRIGGER trg_protected_roles
  BEFORE UPDATE OR DELETE ON auth_schema.roles
  FOR EACH ROW EXECUTE FUNCTION auth_schema.check_protected_roles();

-- 12. Seed default permissions for system roles (Client, Admin, Manager, etc.)
-- Client: dashboard.view, dashboard.stats.view, ticket.read, ticket.reply, invoice.read, client.read
DO $$ 
DECLARE
  v_client_role_id UUID;
  v_admin_role_id  UUID;
BEGIN
  SELECT id INTO v_client_role_id FROM auth_schema.roles WHERE slug = 'client';
  SELECT id INTO v_admin_role_id  FROM auth_schema.roles WHERE slug = 'admin';

  IF v_client_role_id IS NOT NULL THEN
    INSERT INTO auth_schema.role_permissions (role_id, permission_id)
    SELECT v_client_role_id, p.id
      FROM auth_schema.permissions p
     WHERE p.slug IN (
       'dashboard.view',
       'dashboard.stats.view',
       'ticket.read',
       'ticket.reply',
       'invoice.read',
       'client.read'
     )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  IF v_admin_role_id IS NOT NULL THEN
    -- Admin role gets all standard operational permissions except super_admin sole bypass
    INSERT INTO auth_schema.role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, p.id
      FROM auth_schema.permissions p
     WHERE p.slug NOT IN ('client.access.manage')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;

