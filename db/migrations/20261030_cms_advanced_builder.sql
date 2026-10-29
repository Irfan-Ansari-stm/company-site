-- db/migrations/20261030_cms_advanced_builder.sql
-- Advanced Visual Page Builder, Tailwind/HTML Editor & Theme System Schema Extensions

-- 1. Expand css_class to TEXT to allow rich Tailwind utility combinations
ALTER TABLE cms_schema.page_sections ALTER COLUMN css_class TYPE TEXT;

-- 2. Ensure page_revisions index on page_id and revision_num
CREATE INDEX IF NOT EXISTS idx_revisions_page_num ON cms_schema.page_revisions (page_id, revision_num DESC);

-- 3. Insert default theme tokens into system_schema.settings if not already present
INSERT INTO system_schema.settings (key, value, description, is_public)
VALUES (
  'theme.tokens',
  '{
    "primaryColor": "#0284c7",
    "primaryHover": "#0369a1",
    "accentColor": "#6366f1",
    "backgroundColor": "#f8fafc",
    "foregroundColor": "#0f172a",
    "cardBackground": "#ffffff",
    "containerMaxWidth": "80rem",
    "borderRadius": "0.75rem",
    "fontFamily": "Inter, system-ui, sans-serif"
  }'::jsonb,
  'Global Design System & Semantic Theme Tokens',
  TRUE
)
ON CONFLICT (key) DO NOTHING;

