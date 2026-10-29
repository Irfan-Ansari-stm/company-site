-- db/migrations/20261030_perf_indexes.sql
-- High performance composite indexes for high-throughput public website queries

CREATE INDEX IF NOT EXISTS idx_cms_pages_visibility_slug
  ON cms_schema.pages (slug, visibility)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cms_page_sections_page_order
  ON cms_schema.page_sections (page_id, sort_order ASC)
  WHERE is_visible = TRUE;

CREATE INDEX IF NOT EXISTS idx_cms_menus_lookup
  ON cms_schema.menus (location)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_cms_services_active
  ON cms_schema.services (sort_order ASC)
  WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON blog_schema.posts (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_system_settings_public
  ON system_schema.settings (is_public, group_name);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_resolved
  ON support_schema.tickets (status, resolved_at);
