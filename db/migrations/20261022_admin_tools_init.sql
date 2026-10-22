-- db/migrations/20261022_admin_tools_init.sql
-- Administrative Tools, RBAC, Media Library, and AI Schema Extensions

-- 1. CMS Media Folders
CREATE TABLE IF NOT EXISTS cms_schema.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES cms_schema.media_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure media table compatibility with media API and UI
ALTER TABLE cms_schema.media
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES cms_schema.media_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS file_path TEXT;

UPDATE cms_schema.media
   SET file_size = COALESCE(file_size, size_bytes)
 WHERE file_size IS NULL;

UPDATE cms_schema.media
   SET media_type = CASE
         WHEN mime_type LIKE 'image/%' THEN 'image'
         WHEN mime_type LIKE 'video/%' THEN 'video'
         WHEN mime_type LIKE 'audio/%' THEN 'audio'
         WHEN mime_type = 'application/pdf' THEN 'document'
         ELSE 'other'
       END
 WHERE media_type IS NULL OR media_type = 'other';

-- 2. AI Conversations extensions
ALTER TABLE ai_schema.conversations
  ALTER COLUMN session_id DROP NOT NULL,
  ALTER COLUMN session_id SET DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. System audit logs indexing and action length
ALTER TABLE system_schema.audit_logs
  ALTER COLUMN action TYPE VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON system_schema.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON system_schema.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON system_schema.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON system_schema.audit_logs (resource_type, resource_id);

-- 4. Default client portal dashboard modules
INSERT INTO auth_schema.dashboard_modules (key, name, description, icon, is_client_available, is_client_enabled, sort_order, widgets, actions)
VALUES
  ('overview', 'Dashboard Overview', 'High-level business overview and KPIs', 'LayoutDashboard', TRUE, TRUE, 1,
   '[{"key":"stat_cards","name":"Summary Metrics","enabled":true},{"key":"revenue_chart","name":"Revenue Trends","enabled":true}]'::jsonb,
   '["view","export"]'::jsonb),
  ('projects', 'Projects & Work', 'Project status, milestones, and deliverable tracking', 'FolderKanban', TRUE, TRUE, 2,
   '[{"key":"project_list","name":"Active Projects","enabled":true},{"key":"milestone_tracker","name":"Milestones","enabled":true}]'::jsonb,
   '["view","comment","download_deliverables"]'::jsonb),
  ('finance', 'Invoices & Billing', 'View client invoices, billing history, and payment receipts', 'DollarSign', TRUE, TRUE, 3,
   '[{"key":"invoices_table","name":"Invoices","enabled":true},{"key":"outstanding_balance","name":"Outstanding Balance","enabled":true}]'::jsonb,
   '["view","pay","download_pdf"]'::jsonb),
  ('support', 'Support Desk', 'Submit and track support and maintenance tickets', 'HeadphonesIcon', TRUE, TRUE, 4,
   '[{"key":"ticket_list","name":"Ticket History","enabled":true},{"key":"create_ticket","name":"Submit Ticket","enabled":true}]'::jsonb,
   '["view","create","reply"]'::jsonb),
  ('crm', 'Client Portal & CRM', 'Manage client account profile, contacts, and preferences', 'Briefcase', TRUE, FALSE, 5,
   '[{"key":"contacts","name":"Key Contacts","enabled":true}]'::jsonb,
   '["view"]'::jsonb),
  ('ai', 'AI Assistant', 'Enterprise AI assistant for search, summarization, and task guidance', 'Bot', TRUE, FALSE, 6,
   '[{"key":"chat_interface","name":"AI Chatbot","enabled":true}]'::jsonb,
   '["query"]'::jsonb)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_client_available = EXCLUDED.is_client_available,
    sort_order = EXCLUDED.sort_order;
