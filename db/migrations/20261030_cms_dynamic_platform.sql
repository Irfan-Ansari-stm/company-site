-- db/migrations/20261030_cms_dynamic_platform.sql
-- Schema extensions for fully dynamic, API-driven CMS platform

-- 1. FAQs Table
CREATE TABLE IF NOT EXISTS cms_schema.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_faqs_category ON cms_schema.faqs (category);
CREATE INDEX IF NOT EXISTS idx_cms_faqs_published ON cms_schema.faqs (is_published, sort_order ASC);

-- 2. Delivery Process Table
CREATE TABLE IF NOT EXISTS cms_schema.delivery_process (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  description TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]'::jsonb,
  client_involvement TEXT,
  tools_methods JSONB DEFAULT '[]'::jsonb,
  badge VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_process_order ON cms_schema.delivery_process (sort_order ASC, step_number ASC);

-- 3. Engagement Models Table
CREATE TABLE IF NOT EXISTS cms_schema.engagement_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  tagline VARCHAR(255),
  description TEXT NOT NULL,
  suitable_for JSONB DEFAULT '[]'::jsonb,
  key_features JSONB DEFAULT '[]'::jsonb,
  client_responsibilities JSONB DEFAULT '[]'::jsonb,
  our_responsibilities JSONB DEFAULT '[]'::jsonb,
  badge VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_models_order ON cms_schema.engagement_models (sort_order ASC);

-- 4. Solutions Schema Extensions
ALTER TABLE cms_schema.solutions
  ADD COLUMN IF NOT EXISTS eyebrow VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(255),
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cta_href VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Services Schema Extensions
ALTER TABLE cms_schema.services
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 6. Portfolio Schema Extensions
ALTER TABLE portfolio_schema.projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 7. Optimize page sections & pages query performance
CREATE INDEX IF NOT EXISTS idx_cms_page_sections_page_order ON cms_schema.page_sections (page_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug_visibility ON cms_schema.pages (slug, visibility);

