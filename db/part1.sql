-- ============================================================
--  ENTERPRISE POSTGRESQL SCHEMA
--  Company Corporate Website & Digital Service Platform
--  Version: 1.0  |  PostgreSQL 15+
--  Domains: auth, cms, crm, portfolio, blog, careers,
--           support, client_portal, billing, analytics,
--           ai, marketing, system
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- composite GIN indexes
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- accent-insensitive search

-- ── Custom Types (ENUM) ───────────────────────────────────────

-- Generic status
CREATE TYPE status_basic AS ENUM ('active','inactive','archived','deleted');
-- Visibility
CREATE TYPE visibility_type AS ENUM ('public','private','draft','scheduled');
-- User roles
CREATE TYPE user_role AS ENUM (
  'super_admin','admin','manager','editor',
  'sales','hr','support','finance',
  'client','candidate','partner'
);
-- Lead/deal stage
CREATE TYPE lead_stage AS ENUM (
  'new','contacted','qualified','meeting_scheduled',
  'proposal_sent','negotiation','won','lost'
);
-- Lead source
CREATE TYPE lead_source AS ENUM (
  'website','referral','linkedin','google_ads',
  'meta_ads','cold_outreach','partner','event','other'
);
-- Project status
CREATE TYPE project_status AS ENUM (
  'discovery','planning','design','development',
  'testing','review','delivered','maintenance','on_hold','cancelled'
);
-- Ticket priority
CREATE TYPE ticket_priority AS ENUM ('low','medium','high','critical');
-- Ticket status
CREATE TYPE ticket_status AS ENUM (
  'open','pending_client','in_progress','resolved','closed','on_hold'
);
-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'draft','sent','viewed','partial','paid','overdue','cancelled','refunded'
);
-- Payment method
CREATE TYPE payment_method AS ENUM (
  'stripe','razorpay','bank_transfer','paypal','crypto','other'
);
-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending','processing','completed','failed','refunded','disputed'
);
-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'trialing','active','past_due','cancelled','paused','unpaid'
);
-- Job type
CREATE TYPE job_type AS ENUM (
  'full_time','part_time','contract','internship','freelance'
);
-- Application stage
CREATE TYPE application_stage AS ENUM (
  'applied','screening','shortlisted','interview_1',
  'interview_2','technical_test','offer','hired','rejected','withdrawn'
);
-- Blog post status
CREATE TYPE post_status AS ENUM ('draft','review','scheduled','published','archived');
-- Notification channel
CREATE TYPE notification_channel AS ENUM ('email','sms','push','in_app','whatsapp','slack');
-- Proposal status
CREATE TYPE proposal_status AS ENUM (
  'draft','sent','viewed','accepted','rejected','expired','revised'
);
-- Contract status
CREATE TYPE contract_status AS ENUM (
  'draft','sent','signed','expired','cancelled','terminated'
);
-- Meeting status
CREATE TYPE meeting_status AS ENUM (
  'scheduled','confirmed','rescheduled','completed','cancelled','no_show'
);
-- AI agent type
CREATE TYPE ai_agent_type AS ENUM (
  'sales','support','seo','content','proposal','lead_scoring',
  'recruitment','project_assistant','chatbot'
);
-- Webhook event direction
CREATE TYPE webhook_direction AS ENUM ('inbound','outbound');
-- File storage provider
CREATE TYPE storage_provider AS ENUM ('s3','r2','local','gcs');
-- Price type for services
CREATE TYPE pricing_type AS ENUM ('fixed','hourly','monthly','custom','free');
-- Office type
CREATE TYPE office_type AS ENUM ('headquarters','branch','remote_hub','coworking');

-- ============================================================
--  SCHEMA NAMESPACES
-- ============================================================
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS cms_schema;
CREATE SCHEMA IF NOT EXISTS crm_schema;
CREATE SCHEMA IF NOT EXISTS portfolio_schema;
CREATE SCHEMA IF NOT EXISTS blog_schema;
CREATE SCHEMA IF NOT EXISTS careers_schema;
CREATE SCHEMA IF NOT EXISTS support_schema;
CREATE SCHEMA IF NOT EXISTS client_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS analytics_schema;
CREATE SCHEMA IF NOT EXISTS marketing_schema;
CREATE SCHEMA IF NOT EXISTS ai_schema;
CREATE SCHEMA IF NOT EXISTS system_schema;

-- ============================================================
--  UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at on any table
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate a URL-safe slug from a text string
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(trim(input)),
        '[^a-zA-Z0-9\s\-]', '', 'g'
      ),
      '[\s\-]+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ensure slug uniqueness for a given table/column (call in application layer)
-- Soft-delete helper
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.status     = 'deleted';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log insert helper (called from triggers)
CREATE OR REPLACE FUNCTION record_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_schema.audit_logs (
    actor_id, action, resource_type, resource_id,
    old_data, new_data, ip_address
  ) VALUES (
    current_setting('app.current_user_id', true)::uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.current_ip', true)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  MACRO: apply updated_at trigger to any table
-- ============================================================
-- Usage: SELECT apply_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION apply_updated_at_trigger(tbl TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER trg_%s_updated_at
     BEFORE UPDATE ON %s
     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
    replace(tbl, '.', '_'), tbl
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  ██████  AUTH SCHEMA
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE auth_schema.users (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id             VARCHAR(16)   UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 16),
  email                 VARCHAR(320)  UNIQUE NOT NULL,
  username              VARCHAR(60)   UNIQUE,
  password_hash         TEXT,                         -- NULL if OAuth-only
  first_name            VARCHAR(100)  NOT NULL,
  last_name             VARCHAR(100)  NOT NULL,
  display_name          VARCHAR(200)  GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone                 VARCHAR(30),
  avatar_url            TEXT,
  bio                   TEXT,
  timezone              VARCHAR(60)   NOT NULL DEFAULT 'UTC',
  locale                VARCHAR(10)   NOT NULL DEFAULT 'en',
  role                  user_role     NOT NULL DEFAULT 'client',
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  is_verified           BOOLEAN       NOT NULL DEFAULT FALSE,
  email_verified_at     TIMESTAMPTZ,
  phone_verified_at     TIMESTAMPTZ,
  two_factor_enabled    BOOLEAN       NOT NULL DEFAULT FALSE,
  two_factor_secret     TEXT,                         -- encrypted TOTP secret
  two_factor_backup     TEXT[],                       -- hashed backup codes
  last_login_at         TIMESTAMPTZ,
  last_login_ip         INET,
  failed_login_attempts INT           NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  password_changed_at   TIMESTAMPTZ,
  must_change_password  BOOLEAN       NOT NULL DEFAULT FALSE,
  preferences           JSONB         NOT NULL DEFAULT '{}',
  metadata              JSONB         NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_users_email       ON auth_schema.users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username    ON auth_schema.users (username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_role        ON auth_schema.users (role);
CREATE INDEX idx_users_is_active   ON auth_schema.users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at  ON auth_schema.users (created_at DESC);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON auth_schema.users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE auth_schema.users IS 'Platform users — all roles share this table';
COMMENT ON COLUMN auth_schema.users.password_hash IS 'bcrypt hash; NULL for OAuth-only accounts';
COMMENT ON COLUMN auth_schema.users.two_factor_secret IS 'AES-256 encrypted TOTP secret';

-- ── Roles ────────────────────────────────────────────────────
CREATE TABLE auth_schema.roles (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(80)   UNIQUE NOT NULL,
  slug        VARCHAR(80)   UNIQUE NOT NULL,
  description TEXT,
  is_system   BOOLEAN       NOT NULL DEFAULT FALSE, -- system roles cannot be deleted
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Permissions ───────────────────────────────────────────────
CREATE TABLE auth_schema.permissions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) UNIQUE NOT NULL,  -- e.g. "lead.create"
  slug        VARCHAR(120) UNIQUE NOT NULL,
  module      VARCHAR(60)  NOT NULL,          -- e.g. "crm"
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_module ON auth_schema.permissions (module);

-- ── Role ↔ Permission (M:M) ───────────────────────────────────
CREATE TABLE auth_schema.role_permissions (
  role_id       UUID NOT NULL REFERENCES auth_schema.roles(id)       ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES auth_schema.permissions(id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by    UUID REFERENCES auth_schema.users(id),
  PRIMARY KEY (role_id, permission_id)
);

-- ── User ↔ Role (M:M) ─────────────────────────────────────────
CREATE TABLE auth_schema.user_roles (
  user_id    UUID NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES auth_schema.roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth_schema.users(id),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);

-- ── OAuth Accounts ────────────────────────────────────────────
CREATE TABLE auth_schema.oauth_accounts (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  provider          VARCHAR(40) NOT NULL,  -- 'google','github','linkedin','microsoft'
  provider_user_id  TEXT        NOT NULL,
  access_token      TEXT,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  profile_data      JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON auth_schema.oauth_accounts (user_id);

-- ── Sessions ──────────────────────────────────────────────────
CREATE TABLE auth_schema.sessions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  token_hash    TEXT        NOT NULL UNIQUE,    -- SHA-256 of refresh token
  device_name   VARCHAR(200),
  device_type   VARCHAR(60),
  browser       VARCHAR(100),
  os            VARCHAR(100),
  ip_address    INET,
  location      VARCHAR(200),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user       ON auth_schema.sessions (user_id) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_token_hash ON auth_schema.sessions (token_hash);
CREATE INDEX idx_sessions_expires    ON auth_schema.sessions (expires_at);

-- ── Password Reset Tokens ─────────────────────────────────────
CREATE TABLE auth_schema.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Email Verification Tokens ─────────────────────────────────
CREATE TABLE auth_schema.email_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  email      VARCHAR(320) NOT NULL,
  token_hash TEXT        NOT NULL UNIQUE,
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  CMS SCHEMA
-- ============================================================

-- ── SEO Meta (reusable across all content types) ──────────────
CREATE TABLE cms_schema.seo_meta (
  id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_title        VARCHAR(120),
  meta_description  VARCHAR(320),
  og_title          VARCHAR(120),
  og_description    VARCHAR(320),
  og_image_url      TEXT,
  og_type           VARCHAR(40)  DEFAULT 'website',
  twitter_card      VARCHAR(40)  DEFAULT 'summary_large_image',
  canonical_url     TEXT,
  robots            VARCHAR(80)  DEFAULT 'index,follow',
  schema_json       JSONB,                              -- JSON-LD structured data
  focus_keyword     VARCHAR(120),
  seo_score         SMALLINT CHECK (seo_score BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_seo_meta_updated_at
  BEFORE UPDATE ON cms_schema.seo_meta
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Media Library ─────────────────────────────────────────────
CREATE TABLE cms_schema.media (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name        VARCHAR(255)  NOT NULL,
  original_name    VARCHAR(255)  NOT NULL,
  mime_type        VARCHAR(120)  NOT NULL,
  extension        VARCHAR(20)   NOT NULL,
  size_bytes       BIGINT        NOT NULL,
  width            INT,
  height           INT,
  duration_sec     NUMERIC(10,2),              -- for video/audio
  alt_text         VARCHAR(320),
  caption          TEXT,
  storage_provider storage_provider NOT NULL DEFAULT 's3',
  storage_key      TEXT          NOT NULL,     -- S3/R2 object key
  cdn_url          TEXT          NOT NULL,
  blur_data_url    TEXT,                       -- base64 placeholder for next/image
  folder_path      VARCHAR(500)  DEFAULT '/',
  tags             TEXT[]        NOT NULL DEFAULT '{}',
  is_public        BOOLEAN       NOT NULL DEFAULT TRUE,
  uploaded_by      UUID          REFERENCES auth_schema.users(id),
  metadata         JSONB         NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_media_folder       ON cms_schema.media (folder_path) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_mime         ON cms_schema.media (mime_type);
CREATE INDEX idx_media_tags         ON cms_schema.media USING GIN (tags);
CREATE INDEX idx_media_uploaded_by  ON cms_schema.media (uploaded_by);
CREATE INDEX idx_media_created_at   ON cms_schema.media (created_at DESC);

CREATE TRIGGER trg_media_updated_at
  BEFORE UPDATE ON cms_schema.media
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Pages ─────────────────────────────────────────────────────
CREATE TABLE cms_schema.pages (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(320)  NOT NULL,
  slug             VARCHAR(320)  NOT NULL UNIQUE,
  excerpt          TEXT,
  template         VARCHAR(80)   NOT NULL DEFAULT 'default',
  visibility       visibility_type NOT NULL DEFAULT 'draft',
  password         TEXT,                               -- password-protected pages
  seo_id           UUID          REFERENCES cms_schema.seo_meta(id),
  featured_image   UUID          REFERENCES cms_schema.media(id),
  parent_id        UUID          REFERENCES cms_schema.pages(id),
  sort_order       INT           NOT NULL DEFAULT 0,
  is_homepage      BOOLEAN       NOT NULL DEFAULT FALSE,
  allow_comments   BOOLEAN       NOT NULL DEFAULT FALSE,
  published_at     TIMESTAMPTZ,
  scheduled_at     TIMESTAMPTZ,
  revision_count   INT           NOT NULL DEFAULT 0,
  locale           VARCHAR(10)   NOT NULL DEFAULT 'en',
  translations     JSONB         NOT NULL DEFAULT '{}', -- { "ar": { "title": "..." } }
  metadata         JSONB         NOT NULL DEFAULT '{}',
  created_by       UUID          REFERENCES auth_schema.users(id),
  updated_by       UUID          REFERENCES auth_schema.users(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_pages_slug        ON cms_schema.pages (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_visibility  ON cms_schema.pages (visibility);
CREATE INDEX idx_pages_parent      ON cms_schema.pages (parent_id);
CREATE INDEX idx_pages_published   ON cms_schema.pages (published_at DESC) WHERE visibility = 'public';

CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON cms_schema.pages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Page Sections (Block Content) ────────────────────────────
CREATE TABLE cms_schema.page_sections (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     UUID          NOT NULL REFERENCES cms_schema.pages(id) ON DELETE CASCADE,
  block_type  VARCHAR(60)   NOT NULL,   -- 'hero','features','faq','cta','stats', etc.
  block_props JSONB         NOT NULL DEFAULT '{}',
  sort_order  INT           NOT NULL DEFAULT 0,
  is_visible  BOOLEAN       NOT NULL DEFAULT TRUE,
  animation   VARCHAR(40),              -- 'fade-up','slide','scale','none'
  css_class   VARCHAR(200),
  locale      VARCHAR(10)   NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_sections_page  ON cms_schema.page_sections (page_id, sort_order);
CREATE INDEX idx_page_sections_type  ON cms_schema.page_sections (block_type);

CREATE TRIGGER trg_page_sections_updated_at
  BEFORE UPDATE ON cms_schema.page_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Page Revisions ────────────────────────────────────────────
CREATE TABLE cms_schema.page_revisions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id      UUID        NOT NULL REFERENCES cms_schema.pages(id) ON DELETE CASCADE,
  revision_num INT         NOT NULL,
  title        VARCHAR(320) NOT NULL,
  sections     JSONB       NOT NULL DEFAULT '[]',
  seo_data     JSONB,
  saved_by     UUID        REFERENCES auth_schema.users(id),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_id, revision_num)
);

CREATE INDEX idx_revisions_page ON cms_schema.page_revisions (page_id, revision_num DESC);

-- ── Navigation Menus ──────────────────────────────────────────
CREATE TABLE cms_schema.menus (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  location   VARCHAR(60)  NOT NULL,  -- 'header','footer','mobile','sidebar'
  items      JSONB        NOT NULL DEFAULT '[]',  -- nested item tree
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_menus_updated_at
  BEFORE UPDATE ON cms_schema.menus
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Redirects ─────────────────────────────────────────────────
CREATE TABLE cms_schema.redirects (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_path  TEXT        NOT NULL UNIQUE,
  target_path  TEXT        NOT NULL,
  status_code  SMALLINT    NOT NULL DEFAULT 301 CHECK (status_code IN (301,302,307,308)),
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  hit_count    BIGINT      NOT NULL DEFAULT 0,
  created_by   UUID        REFERENCES auth_schema.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redirects_source ON cms_schema.redirects (source_path) WHERE is_active = TRUE;

-- ── Forms ────────────────────────────────────────────────────
CREATE TABLE cms_schema.forms (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  description  TEXT,
  fields       JSONB        NOT NULL DEFAULT '[]',  -- field definitions
  settings     JSONB        NOT NULL DEFAULT '{}',  -- submit action, redirect, etc.
  notification_emails TEXT[],
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by   UUID         REFERENCES auth_schema.users(id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE cms_schema.form_submissions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id     UUID        NOT NULL REFERENCES cms_schema.forms(id),
  data        JSONB       NOT NULL DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  referrer    TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_form    ON cms_schema.form_submissions (form_id);
CREATE INDEX idx_form_submissions_created ON cms_schema.form_submissions (created_at DESC);

-- ── Testimonials ──────────────────────────────────────────────
CREATE TABLE cms_schema.testimonials (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name      VARCHAR(200)  NOT NULL,
  author_title     VARCHAR(200),
  author_company   VARCHAR(200),
  author_avatar    UUID          REFERENCES cms_schema.media(id),
  content          TEXT          NOT NULL,
  rating           SMALLINT      CHECK (rating BETWEEN 1 AND 5),
  source           VARCHAR(60),   -- 'google','clutch','linkedin','direct'
  source_url       TEXT,
  service_id       UUID,          -- FK added later after services table
  project_id       UUID,          -- FK added later
  is_featured      BOOLEAN        NOT NULL DEFAULT FALSE,
  is_published     BOOLEAN        NOT NULL DEFAULT FALSE,
  display_order    INT            NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_testimonials_featured ON cms_schema.testimonials (is_featured) WHERE is_published = TRUE;

-- ── Popups / Banners ──────────────────────────────────────────
CREATE TABLE cms_schema.popups (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL,
  type         VARCHAR(40)  NOT NULL DEFAULT 'modal',  -- 'modal','banner','slide_in','exit_intent'
  content      JSONB        NOT NULL DEFAULT '{}',
  trigger_type VARCHAR(40)  DEFAULT 'time_delay',       -- 'exit_intent','scroll','time_delay','click'
  trigger_val  JSONB        NOT NULL DEFAULT '{}',
  target_pages TEXT[],      -- NULL = all pages
  audience     JSONB        NOT NULL DEFAULT '{}',      -- visitor/returning/geo filters
  start_at     TIMESTAMPTZ,
  end_at       TIMESTAMPTZ,
  is_active    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  SERVICES SCHEMA (part of CMS)
-- ============================================================

CREATE TABLE cms_schema.service_categories (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  description  TEXT,
  icon         VARCHAR(80),
  color        VARCHAR(20),
  sort_order   INT          NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  parent_id    UUID         REFERENCES cms_schema.service_categories(id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE cms_schema.services (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID          REFERENCES cms_schema.service_categories(id),
  title            VARCHAR(200)  NOT NULL,
  slug             VARCHAR(200)  NOT NULL UNIQUE,
  tagline          VARCHAR(300),
  summary          TEXT,
  description      TEXT,         -- rich text / markdown
  icon             VARCHAR(80),
  cover_image      UUID          REFERENCES cms_schema.media(id),
  pricing_type     pricing_type  NOT NULL DEFAULT 'custom',
  starting_price   NUMERIC(12,2),
  currency         VARCHAR(3)    NOT NULL DEFAULT 'USD',
  duration_min     INT,          -- minimum days
  duration_max     INT,          -- maximum days
  is_featured      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order       INT           NOT NULL DEFAULT 0,
  seo_id           UUID          REFERENCES cms_schema.seo_meta(id),
  faq_items        JSONB         NOT NULL DEFAULT '[]',
  process_steps    JSONB         NOT NULL DEFAULT '[]',
  tech_stack       TEXT[]        NOT NULL DEFAULT '{}',
  delivery_items   JSONB         NOT NULL DEFAULT '[]',  -- what client gets
  locale           VARCHAR(10)   NOT NULL DEFAULT 'en',
  translations     JSONB         NOT NULL DEFAULT '{}',
  created_by       UUID          REFERENCES auth_schema.users(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_services_slug      ON cms_schema.services (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_category  ON cms_schema.services (category_id);
CREATE INDEX idx_services_featured  ON cms_schema.services (is_featured) WHERE is_active = TRUE;
CREATE INDEX idx_services_search    ON cms_schema.services USING GIN (to_tsvector('english', title || ' ' || COALESCE(summary, '')));

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON cms_schema.services
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE cms_schema.service_features (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id  UUID         NOT NULL REFERENCES cms_schema.services(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  icon        VARCHAR(80),
  sort_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE cms_schema.service_packages (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id      UUID          NOT NULL REFERENCES cms_schema.services(id) ON DELETE CASCADE,
  name            VARCHAR(120)  NOT NULL,   -- 'Starter','Professional','Enterprise'
  slug            VARCHAR(120)  NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2),
  currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
  billing_period  VARCHAR(20),              -- 'one_time','monthly','quarterly','yearly'
  features        JSONB         NOT NULL DEFAULT '[]',
  is_popular      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order      INT           NOT NULL DEFAULT 0,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  UNIQUE (service_id, slug)
);

-- ── Industries ────────────────────────────────────────────────
CREATE TABLE cms_schema.industries (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(80),
  cover_image UUID         REFERENCES cms_schema.media(id),
  seo_id      UUID         REFERENCES cms_schema.seo_meta(id),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Solutions ─────────────────────────────────────────────────
CREATE TABLE cms_schema.solutions (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  use_cases   JSONB        NOT NULL DEFAULT '[]',
  features    JSONB        NOT NULL DEFAULT '[]',
  cover_image UUID         REFERENCES cms_schema.media(id),
  seo_id      UUID         REFERENCES cms_schema.seo_meta(id),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  PORTFOLIO SCHEMA
-- ============================================================

CREATE TABLE portfolio_schema.projects (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300)  NOT NULL,
  slug            VARCHAR(300)  NOT NULL UNIQUE,
  client_name     VARCHAR(200),
  client_logo     UUID          REFERENCES cms_schema.media(id),
  client_url      TEXT,
  is_client_public BOOLEAN      NOT NULL DEFAULT TRUE,  -- can we show client name?
  category_id     UUID          REFERENCES cms_schema.service_categories(id),
  industry_id     UUID          REFERENCES cms_schema.industries(id),
  solution_id     UUID          REFERENCES cms_schema.solutions(id),
  summary         TEXT,
  challenge       TEXT,
  solution        TEXT,
  result          TEXT,
  cover_image     UUID          REFERENCES cms_schema.media(id),
  budget_range    VARCHAR(60),  -- '< $10k', '$10k-$50k', etc.
  duration_weeks  INT,
  start_date      DATE,
  end_date        DATE,
  tech_stack      TEXT[]        NOT NULL DEFAULT '{}',
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  is_featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  display_order   INT           NOT NULL DEFAULT 0,
  seo_id          UUID          REFERENCES cms_schema.seo_meta(id),
  region          VARCHAR(60),
  project_url     TEXT,
  github_url      TEXT,
  testimonial_id  UUID          REFERENCES cms_schema.testimonials(id),
  locale          VARCHAR(10)   NOT NULL DEFAULT 'en',
  translations    JSONB         NOT NULL DEFAULT '{}',
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_by      UUID          REFERENCES auth_schema.users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_projects_slug      ON portfolio_schema.projects (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_category  ON portfolio_schema.projects (category_id);
CREATE INDEX idx_projects_industry  ON portfolio_schema.projects (industry_id);
CREATE INDEX idx_projects_featured  ON portfolio_schema.projects (is_featured) WHERE is_published = TRUE;
CREATE INDEX idx_projects_tech      ON portfolio_schema.projects USING GIN (tech_stack);
CREATE INDEX idx_projects_tags      ON portfolio_schema.projects USING GIN (tags);
CREATE INDEX idx_projects_search    ON portfolio_schema.projects USING GIN (to_tsvector('english', title || ' ' || COALESCE(summary, '')));

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON portfolio_schema.projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE portfolio_schema.project_gallery (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID         NOT NULL REFERENCES portfolio_schema.projects(id) ON DELETE CASCADE,
  media_id    UUID         NOT NULL REFERENCES cms_schema.media(id),
  caption     VARCHAR(500),
  alt_text    VARCHAR(320),
  sort_order  INT          NOT NULL DEFAULT 0,
  is_cover    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_project ON portfolio_schema.project_gallery (project_id, sort_order);

CREATE TABLE portfolio_schema.project_metrics (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID          NOT NULL REFERENCES portfolio_schema.projects(id) ON DELETE CASCADE,
  metric_name VARCHAR(200)  NOT NULL,    -- e.g. 'Conversion Rate'
  value       VARCHAR(100)  NOT NULL,    -- e.g. '300%'
  prefix      VARCHAR(20),              -- e.g. '+'
  suffix      VARCHAR(20),              -- e.g. 'x'
  description TEXT,
  icon        VARCHAR(80),
  sort_order  INT           NOT NULL DEFAULT 0
);


-- ============================================================
--  ██████  BLOG SCHEMA
-- ============================================================

CREATE TABLE blog_schema.categories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  color       VARCHAR(20),
  icon        VARCHAR(80),
  parent_id   UUID         REFERENCES blog_schema.categories(id),
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE blog_schema.tags (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(80)  NOT NULL,
  slug       VARCHAR(80)  NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE blog_schema.posts (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(320) NOT NULL,
  slug            VARCHAR(320) NOT NULL UNIQUE,
  excerpt         TEXT,
  content         TEXT         NOT NULL,  -- rich text / MDX
  content_json    JSONB,                  -- TipTap JSON format
  author_id       UUID         REFERENCES auth_schema.users(id),
  category_id     UUID         REFERENCES blog_schema.categories(id),
  cover_image     UUID         REFERENCES cms_schema.media(id),
  status          post_status  NOT NULL DEFAULT 'draft',
  is_featured     BOOLEAN      NOT NULL DEFAULT FALSE,
  allow_comments  BOOLEAN      NOT NULL DEFAULT TRUE,
  read_time_min   INT,                    -- calculated on save
  view_count      BIGINT       NOT NULL DEFAULT 0,
  like_count      INT          NOT NULL DEFAULT 0,
  seo_id          UUID         REFERENCES cms_schema.seo_meta(id),
  locale          VARCHAR(10)  NOT NULL DEFAULT 'en',
  translations    JSONB        NOT NULL DEFAULT '{}',
  published_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_posts_slug        ON blog_schema.posts (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status      ON blog_schema.posts (status);
CREATE INDEX idx_posts_author      ON blog_schema.posts (author_id);
CREATE INDEX idx_posts_category    ON blog_schema.posts (category_id);
CREATE INDEX idx_posts_featured    ON blog_schema.posts (is_featured) WHERE status = 'published';
CREATE INDEX idx_posts_published   ON blog_schema.posts (published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_search      ON blog_schema.posts USING GIN (to_tsvector('english', title || ' ' || COALESCE(excerpt, '')));

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON blog_schema.posts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Post ↔ Tag (M:M)
CREATE TABLE blog_schema.post_tags (
  post_id    UUID NOT NULL REFERENCES blog_schema.posts(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES blog_schema.tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Related Posts
CREATE TABLE blog_schema.post_relations (
  post_id         UUID NOT NULL REFERENCES blog_schema.posts(id) ON DELETE CASCADE,
  related_post_id UUID NOT NULL REFERENCES blog_schema.posts(id) ON DELETE CASCADE,
  sort_order      INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, related_post_id),
  CHECK (post_id != related_post_id)
);

-- Guides / Ebooks / Resources
CREATE TABLE blog_schema.resources (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(40)  NOT NULL,  -- 'guide','ebook','whitepaper','webinar','template'
  title           VARCHAR(300) NOT NULL,
  slug            VARCHAR(300) NOT NULL UNIQUE,
  description     TEXT,
  cover_image     UUID         REFERENCES cms_schema.media(id),
  file_id         UUID         REFERENCES cms_schema.media(id),  -- downloadable file
  webinar_url     TEXT,
  requires_email  BOOLEAN      NOT NULL DEFAULT TRUE,   -- gated content
  is_published    BOOLEAN      NOT NULL DEFAULT FALSE,
  download_count  INT          NOT NULL DEFAULT 0,
  seo_id          UUID         REFERENCES cms_schema.seo_meta(id),
  category_id     UUID         REFERENCES blog_schema.categories(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  CRM / LEADS SCHEMA
-- ============================================================

CREATE TABLE crm_schema.leads (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id        VARCHAR(16)   UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 16),
  source           lead_source   NOT NULL DEFAULT 'website',
  source_campaign  VARCHAR(200),
  source_medium    VARCHAR(100),
  landing_page     TEXT,
  referrer         TEXT,
  -- Contact info
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  full_name        VARCHAR(200)  GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email            VARCHAR(320)  NOT NULL,
  phone            VARCHAR(30),
  company          VARCHAR(200),
  company_size     VARCHAR(40),   -- '1-10','11-50','51-200','201-500','500+'
  designation      VARCHAR(200),
  website          TEXT,
  linkedin_url     TEXT,
  country          VARCHAR(80),
  city             VARCHAR(80),
  timezone         VARCHAR(60),
  -- Project details
  project_type     VARCHAR(100),
  services_needed  TEXT[]        NOT NULL DEFAULT '{}',
  budget_range     VARCHAR(60),
  timeline         VARCHAR(60),
  requirements     TEXT,
  urgency          VARCHAR(20)   DEFAULT 'medium',  -- 'low','medium','high','critical'
  -- CRM fields
  stage            lead_stage    NOT NULL DEFAULT 'new',
  lead_score       SMALLINT      NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  lead_temperature VARCHAR(10)   DEFAULT 'cold',  -- 'cold','warm','hot'
  probability      SMALLINT      DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_value   NUMERIC(12,2),
  currency         VARCHAR(3)    NOT NULL DEFAULT 'USD',
  assigned_to      UUID          REFERENCES auth_schema.users(id),
  assigned_at      TIMESTAMPTZ,
  converted_at     TIMESTAMPTZ,
  lost_reason      TEXT,
  lost_at          TIMESTAMPTZ,
  won_at           TIMESTAMPTZ,
  deal_value       NUMERIC(12,2),
  -- Tracking
  last_contact_at  TIMESTAMPTZ,
  next_follow_up   TIMESTAMPTZ,
  follow_up_count  INT           NOT NULL DEFAULT 0,
  tags             TEXT[]        NOT NULL DEFAULT '{}',
  is_archived      BOOLEAN       NOT NULL DEFAULT FALSE,
  metadata         JSONB         NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_leads_email       ON crm_schema.leads (email);
CREATE INDEX idx_leads_stage       ON crm_schema.leads (stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_assigned    ON crm_schema.leads (assigned_to);
CREATE INDEX idx_leads_score       ON crm_schema.leads (lead_score DESC);
CREATE INDEX idx_leads_follow_up   ON crm_schema.leads (next_follow_up) WHERE is_archived = FALSE;
CREATE INDEX idx_leads_created     ON crm_schema.leads (created_at DESC);
CREATE INDEX idx_leads_tags        ON crm_schema.leads USING GIN (tags);
CREATE INDEX idx_leads_services    ON crm_schema.leads USING GIN (services_needed);
CREATE INDEX idx_leads_search      ON crm_schema.leads USING GIN (
  to_tsvector('english', full_name || ' ' || email || ' ' || COALESCE(company, ''))
);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON crm_schema.leads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Lead Notes
CREATE TABLE crm_schema.lead_notes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id    UUID        NOT NULL REFERENCES crm_schema.leads(id) ON DELETE CASCADE,
  author_id  UUID        REFERENCES auth_schema.users(id),
  content    TEXT        NOT NULL,
  is_pinned  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_notes_lead ON crm_schema.lead_notes (lead_id, created_at DESC);

-- Lead Activities (timeline)
CREATE TABLE crm_schema.lead_activities (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID         NOT NULL REFERENCES crm_schema.leads(id) ON DELETE CASCADE,
  actor_id      UUID         REFERENCES auth_schema.users(id),
  activity_type VARCHAR(60)  NOT NULL,  -- 'email_sent','call','meeting','stage_change','note','proposal'
  subject       VARCHAR(300),
  description   TEXT,
  outcome       VARCHAR(100),
  duration_min  INT,
  occurred_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  metadata      JSONB        NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_activities_lead    ON crm_schema.lead_activities (lead_id, occurred_at DESC);
CREATE INDEX idx_activities_actor   ON crm_schema.lead_activities (actor_id);
CREATE INDEX idx_activities_type    ON crm_schema.lead_activities (activity_type);

-- Meetings / Consultations
CREATE TABLE crm_schema.meetings (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id        UUID          REFERENCES crm_schema.leads(id),
  client_id      UUID,                          -- FK to client_schema added later
  host_id        UUID          REFERENCES auth_schema.users(id),
  title          VARCHAR(300)  NOT NULL,
  agenda         TEXT,
  meeting_type   VARCHAR(40)   DEFAULT 'video_call',  -- 'video_call','phone','in_person'
  status         meeting_status NOT NULL DEFAULT 'scheduled',
  scheduled_at   TIMESTAMPTZ   NOT NULL,
  duration_min   INT           NOT NULL DEFAULT 30,
  timezone       VARCHAR(60)   NOT NULL DEFAULT 'UTC',
  meeting_url    TEXT,
  meeting_id_ext VARCHAR(200), -- Zoom/Google Meet meeting ID
  location       TEXT,
  notes          TEXT,
  recording_url  TEXT,
  outcome        TEXT,
  completed_at   TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ,
  cancel_reason  TEXT,
  reminder_sent  BOOLEAN       NOT NULL DEFAULT FALSE,
  metadata       JSONB         NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_lead        ON crm_schema.meetings (lead_id);
CREATE INDEX idx_meetings_host        ON crm_schema.meetings (host_id);
CREATE INDEX idx_meetings_scheduled   ON crm_schema.meetings (scheduled_at);
CREATE INDEX idx_meetings_status      ON crm_schema.meetings (status);

-- Meeting Attendees
CREATE TABLE crm_schema.meeting_attendees (
  meeting_id  UUID NOT NULL REFERENCES crm_schema.meetings(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth_schema.users(id),
  email       VARCHAR(320) NOT NULL,
  name        VARCHAR(200),
  rsvp_status VARCHAR(20) DEFAULT 'pending',  -- 'pending','accepted','declined'
  PRIMARY KEY (meeting_id, email)
);

-- Proposals
CREATE TABLE crm_schema.proposals (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id          UUID          REFERENCES crm_schema.leads(id),
  client_id        UUID,                         -- FK added later
  created_by       UUID          REFERENCES auth_schema.users(id),
  title            VARCHAR(300)  NOT NULL,
  version          INT           NOT NULL DEFAULT 1,
  status           proposal_status NOT NULL DEFAULT 'draft',
  summary          TEXT,
  scope            TEXT,
  deliverables     JSONB         NOT NULL DEFAULT '[]',
  timeline         JSONB         NOT NULL DEFAULT '{}',
  milestones       JSONB         NOT NULL DEFAULT '[]',
  total_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency         VARCHAR(3)    NOT NULL DEFAULT 'USD',
  tax_percent      NUMERIC(5,2)  DEFAULT 0,
  discount_percent NUMERIC(5,2)  DEFAULT 0,
  line_items       JSONB         NOT NULL DEFAULT '[]',
  terms            TEXT,
  validity_days    INT           NOT NULL DEFAULT 30,
  sent_at          TIMESTAMPTZ,
  viewed_at        TIMESTAMPTZ,
  accepted_at      TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ,
  expired_at       TIMESTAMPTZ,
  reject_reason    TEXT,
  signature_data   JSONB,                        -- e-signature record
  pdf_url          TEXT,
  notes            TEXT,
  metadata         JSONB         NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_lead    ON crm_schema.proposals (lead_id);
CREATE INDEX idx_proposals_status  ON crm_schema.proposals (status);
CREATE INDEX idx_proposals_created ON crm_schema.proposals (created_at DESC);

CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON crm_schema.proposals
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Accounts (companies in CRM)
CREATE TABLE crm_schema.accounts (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(200)  NOT NULL,
  slug         VARCHAR(200)  UNIQUE,
  website      TEXT,
  industry     VARCHAR(120),
  company_size VARCHAR(40),
  country      VARCHAR(80),
  city         VARCHAR(80),
  address      TEXT,
  phone        VARCHAR(30),
  email        VARCHAR(320),
  linkedin_url TEXT,
  logo_url     TEXT,
  annual_revenue NUMERIC(15,2),
  description  TEXT,
  tags         TEXT[]        NOT NULL DEFAULT '{}',
  owner_id     UUID          REFERENCES auth_schema.users(id),
  is_client    BOOLEAN       NOT NULL DEFAULT FALSE,
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_name    ON crm_schema.accounts (name);
CREATE INDEX idx_accounts_owner   ON crm_schema.accounts (owner_id);

-- Contacts (individuals in CRM accounts)
CREATE TABLE crm_schema.contacts (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id   UUID          REFERENCES crm_schema.accounts(id),
  first_name   VARCHAR(100)  NOT NULL,
  last_name    VARCHAR(100)  NOT NULL,
  email        VARCHAR(320)  UNIQUE,
  phone        VARCHAR(30),
  designation  VARCHAR(200),
  linkedin_url TEXT,
  is_primary   BOOLEAN       NOT NULL DEFAULT FALSE,
  owner_id     UUID          REFERENCES auth_schema.users(id),
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Pipeline (custom stages per team)
CREATE TABLE crm_schema.pipelines (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE crm_schema.pipeline_stages (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id  UUID         NOT NULL REFERENCES crm_schema.pipelines(id) ON DELETE CASCADE,
  name         VARCHAR(80)  NOT NULL,
  slug         VARCHAR(80)  NOT NULL,
  color        VARCHAR(20),
  probability  SMALLINT     DEFAULT 0,
  sort_order   INT          NOT NULL DEFAULT 0,
  is_won       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_lost      BOOLEAN      NOT NULL DEFAULT FALSE
);


-- ============================================================
--  ██████  CAREERS / ATS SCHEMA
-- ============================================================

CREATE TABLE careers_schema.departments (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  head_id    UUID         REFERENCES auth_schema.users(id),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE careers_schema.jobs (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id    UUID          REFERENCES careers_schema.departments(id),
  title            VARCHAR(200)  NOT NULL,
  slug             VARCHAR(200)  NOT NULL UNIQUE,
  description      TEXT          NOT NULL,
  responsibilities TEXT,
  requirements     TEXT,
  nice_to_have     TEXT,
  benefits         TEXT,
  job_type         job_type      NOT NULL DEFAULT 'full_time',
  location         VARCHAR(200),
  is_remote        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_hybrid        BOOLEAN       NOT NULL DEFAULT FALSE,
  salary_min       NUMERIC(12,2),
  salary_max       NUMERIC(12,2),
  currency         VARCHAR(3)    NOT NULL DEFAULT 'USD',
  experience_years INT,
  skills_required  TEXT[]        NOT NULL DEFAULT '{}',
  openings         INT           NOT NULL DEFAULT 1,
  applications_count INT         NOT NULL DEFAULT 0,
  is_published     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_urgent        BOOLEAN       NOT NULL DEFAULT FALSE,
  apply_by         DATE,
  published_at     TIMESTAMPTZ,
  closed_at        TIMESTAMPTZ,
  seo_id           UUID          REFERENCES cms_schema.seo_meta(id),
  created_by       UUID          REFERENCES auth_schema.users(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_jobs_slug       ON careers_schema.jobs (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_published  ON careers_schema.jobs (is_published, published_at DESC);
CREATE INDEX idx_jobs_department ON careers_schema.jobs (department_id);

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON careers_schema.jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE careers_schema.candidates (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          REFERENCES auth_schema.users(id),
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(320)  UNIQUE NOT NULL,
  phone         VARCHAR(30),
  linkedin_url  TEXT,
  portfolio_url TEXT,
  github_url    TEXT,
  location      VARCHAR(200),
  current_title VARCHAR(200),
  years_exp     INT,
  skills        TEXT[]        NOT NULL DEFAULT '{}',
  resume_url    TEXT,
  avatar_url    TEXT,
  source        VARCHAR(60),  -- 'website','linkedin','referral','headhunt'
  notes         TEXT,
  is_blacklisted BOOLEAN      NOT NULL DEFAULT FALSE,
  blacklist_reason TEXT,
  metadata      JSONB         NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_candidates_email  ON careers_schema.candidates (email);
CREATE INDEX idx_candidates_skills ON careers_schema.candidates USING GIN (skills);

CREATE TABLE careers_schema.applications (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id           UUID              NOT NULL REFERENCES careers_schema.jobs(id),
  candidate_id     UUID              NOT NULL REFERENCES careers_schema.candidates(id),
  stage            application_stage NOT NULL DEFAULT 'applied',
  cover_letter     TEXT,
  resume_url       TEXT,
  portfolio_url    TEXT,
  expected_salary  NUMERIC(12,2),
  currency         VARCHAR(3)        DEFAULT 'USD',
  available_from   DATE,
  rating           SMALLINT          CHECK (rating BETWEEN 1 AND 5),
  rejection_reason TEXT,
  offer_details    JSONB,
  assigned_to      UUID              REFERENCES auth_schema.users(id),
  applied_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_applications_job       ON careers_schema.applications (job_id);
CREATE INDEX idx_applications_candidate ON careers_schema.applications (candidate_id);
CREATE INDEX idx_applications_stage     ON careers_schema.applications (stage);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON careers_schema.applications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE careers_schema.interviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID        NOT NULL REFERENCES careers_schema.applications(id) ON DELETE CASCADE,
  interviewer_id  UUID        REFERENCES auth_schema.users(id),
  round           SMALLINT    NOT NULL DEFAULT 1,
  interview_type  VARCHAR(40) DEFAULT 'video_call',  -- 'phone','video_call','in_person','technical'
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INT         NOT NULL DEFAULT 60,
  meeting_url     TEXT,
  status          meeting_status NOT NULL DEFAULT 'scheduled',
  feedback        TEXT,
  rating          SMALLINT    CHECK (rating BETWEEN 1 AND 5),
  scorecard       JSONB       NOT NULL DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  CLIENT PORTAL SCHEMA
-- ============================================================

CREATE TABLE client_schema.clients (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          UNIQUE REFERENCES auth_schema.users(id),
  account_id      UUID          REFERENCES crm_schema.accounts(id),
  company_name    VARCHAR(200)  NOT NULL,
  billing_email   VARCHAR(320),
  billing_address JSONB,
  phone           VARCHAR(30),
  website         TEXT,
  tax_id          VARCHAR(80),
  timezone        VARCHAR(60)   NOT NULL DEFAULT 'UTC',
  currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
  health_score    SMALLINT      DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  nps_score       SMALLINT      CHECK (nps_score BETWEEN 0 AND 10),
  account_manager UUID          REFERENCES auth_schema.users(id),
  onboarded_at    TIMESTAMPTZ,
  churned_at      TIMESTAMPTZ,
  churn_reason    TEXT,
  notes           TEXT,
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user     ON client_schema.clients (user_id);
CREATE INDEX idx_clients_account  ON client_schema.clients (account_id);
CREATE INDEX idx_clients_manager  ON client_schema.clients (account_manager);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON client_schema.clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE client_schema.client_projects (
  id                UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID            NOT NULL REFERENCES client_schema.clients(id),
  portfolio_id      UUID            REFERENCES portfolio_schema.projects(id),
  title             VARCHAR(300)    NOT NULL,
  description       TEXT,
  status            project_status  NOT NULL DEFAULT 'discovery',
  priority          VARCHAR(20)     NOT NULL DEFAULT 'medium',
  start_date        DATE,
  end_date          DATE,
  actual_end_date   DATE,
  budget            NUMERIC(14,2),
  spent             NUMERIC(14,2)   DEFAULT 0,
  currency          VARCHAR(3)      NOT NULL DEFAULT 'USD',
  progress_percent  SMALLINT        DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  health            VARCHAR(20)     DEFAULT 'on_track',  -- 'on_track','at_risk','off_track'
  is_client_visible BOOLEAN         NOT NULL DEFAULT TRUE,
  project_manager   UUID            REFERENCES auth_schema.users(id),
  tech_lead         UUID            REFERENCES auth_schema.users(id),
  tech_stack        TEXT[]          NOT NULL DEFAULT '{}',
  repository_url    TEXT,
  staging_url       TEXT,
  production_url    TEXT,
  metadata          JSONB           NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_projects_client ON client_schema.client_projects (client_id);
CREATE INDEX idx_client_projects_status ON client_schema.client_projects (status);

CREATE TRIGGER trg_client_projects_updated_at
  BEFORE UPDATE ON client_schema.client_projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Project Milestones
CREATE TABLE client_schema.milestones (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID         NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  sort_order   INT          NOT NULL DEFAULT 0,
  is_billable  BOOLEAN      NOT NULL DEFAULT FALSE,
  amount       NUMERIC(12,2),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Project Tasks
CREATE TABLE client_schema.tasks (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID         NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  milestone_id  UUID         REFERENCES client_schema.milestones(id),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  status        VARCHAR(40)  NOT NULL DEFAULT 'todo',  -- 'todo','in_progress','review','done'
  priority      VARCHAR(20)  NOT NULL DEFAULT 'medium',
  assigned_to   UUID         REFERENCES auth_schema.users(id),
  reporter_id   UUID         REFERENCES auth_schema.users(id),
  due_date      DATE,
  estimated_h   NUMERIC(6,2),
  logged_h      NUMERIC(6,2) DEFAULT 0,
  tags          TEXT[]       NOT NULL DEFAULT '{}',
  sort_order    INT          NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project    ON client_schema.tasks (project_id);
CREATE INDEX idx_tasks_assigned   ON client_schema.tasks (assigned_to);
CREATE INDEX idx_tasks_status     ON client_schema.tasks (status);

-- Project Files
CREATE TABLE client_schema.project_files (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID         NOT NULL REFERENCES client_schema.client_projects(id) ON DELETE CASCADE,
  media_id    UUID         NOT NULL REFERENCES cms_schema.media(id),
  label       VARCHAR(300),
  folder      VARCHAR(500) DEFAULT '/',
  uploaded_by UUID         REFERENCES auth_schema.users(id),
  is_client_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_files_project ON client_schema.project_files (project_id);

-- Contracts
CREATE TABLE client_schema.contracts (
  id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID             NOT NULL REFERENCES client_schema.clients(id),
  project_id      UUID             REFERENCES client_schema.client_projects(id),
  title           VARCHAR(300)     NOT NULL,
  status          contract_status  NOT NULL DEFAULT 'draft',
  content         TEXT,
  pdf_url         TEXT,
  total_value     NUMERIC(14,2),
  currency        VARCHAR(3)       NOT NULL DEFAULT 'USD',
  start_date      DATE,
  end_date        DATE,
  client_signed_at    TIMESTAMPTZ,
  company_signed_at   TIMESTAMPTZ,
  client_signature    JSONB,
  company_signature   JSONB,
  sent_at         TIMESTAMPTZ,
  expired_at      TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID             REFERENCES auth_schema.users(id),
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Messages (client ↔ team)
CREATE TABLE client_schema.messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID        REFERENCES client_schema.client_projects(id),
  sender_id    UUID        NOT NULL REFERENCES auth_schema.users(id),
  content      TEXT        NOT NULL,
  attachments  JSONB       NOT NULL DEFAULT '[]',
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  parent_id    UUID        REFERENCES client_schema.messages(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_project ON client_schema.messages (project_id, created_at DESC);
CREATE INDEX idx_messages_sender  ON client_schema.messages (sender_id);
CREATE INDEX idx_messages_unread  ON client_schema.messages (is_read) WHERE is_read = FALSE;


-- ============================================================
--  ██████  SUPPORT SCHEMA
-- ============================================================

CREATE TABLE support_schema.ticket_categories (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  icon       VARCHAR(80),
  color      VARCHAR(20),
  sort_order INT          NOT NULL DEFAULT 0
);

CREATE TABLE support_schema.tickets (
  id             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  VARCHAR(20)     UNIQUE NOT NULL DEFAULT 'TKT-' || to_char(NOW(), 'YYMMDD') || '-' || lpad(floor(random()*9999)::text, 4, '0'),
  client_id      UUID            REFERENCES client_schema.clients(id),
  reporter_id    UUID            REFERENCES auth_schema.users(id),
  category_id    UUID            REFERENCES support_schema.ticket_categories(id),
  subject        VARCHAR(500)    NOT NULL,
  description    TEXT            NOT NULL,
  priority       ticket_priority NOT NULL DEFAULT 'medium',
  status         ticket_status   NOT NULL DEFAULT 'open',
  assigned_to    UUID            REFERENCES auth_schema.users(id),
  project_id     UUID            REFERENCES client_schema.client_projects(id),
  sla_due_at     TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  satisfaction   SMALLINT        CHECK (satisfaction BETWEEN 1 AND 5),
  tags           TEXT[]          NOT NULL DEFAULT '{}',
  is_escalated   BOOLEAN         NOT NULL DEFAULT FALSE,
  escalated_at   TIMESTAMPTZ,
  attachments    JSONB           NOT NULL DEFAULT '[]',
  metadata       JSONB           NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_client    ON support_schema.tickets (client_id);
CREATE INDEX idx_tickets_status    ON support_schema.tickets (status);
CREATE INDEX idx_tickets_priority  ON support_schema.tickets (priority);
CREATE INDEX idx_tickets_assigned  ON support_schema.tickets (assigned_to);
CREATE INDEX idx_tickets_sla       ON support_schema.tickets (sla_due_at) WHERE status NOT IN ('resolved','closed');
CREATE INDEX idx_tickets_created   ON support_schema.tickets (created_at DESC);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON support_schema.tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE support_schema.ticket_messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id    UUID        NOT NULL REFERENCES support_schema.tickets(id) ON DELETE CASCADE,
  author_id    UUID        REFERENCES auth_schema.users(id),
  content      TEXT        NOT NULL,
  is_internal  BOOLEAN     NOT NULL DEFAULT FALSE,  -- internal note (not shown to client)
  attachments  JSONB       NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON support_schema.ticket_messages (ticket_id, created_at ASC);

CREATE TABLE support_schema.knowledge_base (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(300) NOT NULL,
  slug         VARCHAR(300) NOT NULL UNIQUE,
  content      TEXT         NOT NULL,
  category_id  UUID         REFERENCES support_schema.ticket_categories(id),
  author_id    UUID         REFERENCES auth_schema.users(id),
  is_published BOOLEAN      NOT NULL DEFAULT FALSE,
  is_public    BOOLEAN      NOT NULL DEFAULT TRUE,
  view_count   BIGINT       NOT NULL DEFAULT 0,
  helpful_yes  INT          NOT NULL DEFAULT 0,
  helpful_no   INT          NOT NULL DEFAULT 0,
  tags         TEXT[]       NOT NULL DEFAULT '{}',
  seo_id       UUID         REFERENCES cms_schema.seo_meta(id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_slug    ON support_schema.knowledge_base (slug) WHERE is_published = TRUE;
CREATE INDEX idx_kb_search  ON support_schema.knowledge_base USING GIN (to_tsvector('english', title || ' ' || content));


-- ============================================================
--  ██████  BILLING SCHEMA
-- ============================================================

CREATE TABLE billing_schema.tax_rates (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120)  NOT NULL,
  rate        NUMERIC(6,4)  NOT NULL,     -- e.g. 0.18 for 18%
  country     VARCHAR(2),                 -- ISO country code
  state       VARCHAR(80),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE billing_schema.invoices (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number   VARCHAR(40)    UNIQUE NOT NULL,
  client_id        UUID           NOT NULL REFERENCES client_schema.clients(id),
  project_id       UUID           REFERENCES client_schema.client_projects(id),
  proposal_id      UUID           REFERENCES crm_schema.proposals(id),
  milestone_id     UUID           REFERENCES client_schema.milestones(id),
  status           invoice_status NOT NULL DEFAULT 'draft',
  issue_date       DATE           NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE           NOT NULL,
  line_items       JSONB          NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(14,2)  NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(14,2)  NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(14,2)  NOT NULL DEFAULT 0,
  total_amount     NUMERIC(14,2)  NOT NULL DEFAULT 0,
  amount_paid      NUMERIC(14,2)  NOT NULL DEFAULT 0,
  amount_due       NUMERIC(14,2)  GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  currency         VARCHAR(3)     NOT NULL DEFAULT 'USD',
  tax_rate_id      UUID           REFERENCES billing_schema.tax_rates(id),
  notes            TEXT,
  terms            TEXT,
  footer           TEXT,
  pdf_url          TEXT,
  sent_at          TIMESTAMPTZ,
  viewed_at        TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  overdue_at       TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_by       UUID           REFERENCES auth_schema.users(id),
  metadata         JSONB          NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_client   ON billing_schema.invoices (client_id);
CREATE INDEX idx_invoices_status   ON billing_schema.invoices (status);
CREATE INDEX idx_invoices_due_date ON billing_schema.invoices (due_date) WHERE status NOT IN ('paid','cancelled');
CREATE INDEX idx_invoices_number   ON billing_schema.invoices (invoice_number);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON billing_schema.invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE billing_schema.payments (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id       UUID           NOT NULL REFERENCES billing_schema.invoices(id),
  client_id        UUID           NOT NULL REFERENCES client_schema.clients(id),
  amount           NUMERIC(14,2)  NOT NULL,
  currency         VARCHAR(3)     NOT NULL DEFAULT 'USD',
  method           payment_method NOT NULL,
  status           payment_status NOT NULL DEFAULT 'pending',
  gateway_provider VARCHAR(40),   -- 'stripe','razorpay','paypal'
  gateway_txn_id   TEXT,
  gateway_ref      TEXT,
  gateway_response JSONB          NOT NULL DEFAULT '{}',
  failure_reason   TEXT,
  refund_amount    NUMERIC(14,2)  DEFAULT 0,
  refunded_at      TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  notes            TEXT,
  metadata         JSONB          NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON billing_schema.payments (invoice_id);
CREATE INDEX idx_payments_client  ON billing_schema.payments (client_id);
CREATE INDEX idx_payments_status  ON billing_schema.payments (status);
CREATE INDEX idx_payments_gateway ON billing_schema.payments (gateway_txn_id);

CREATE TABLE billing_schema.subscriptions (
  id               UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID                 NOT NULL REFERENCES client_schema.clients(id),
  project_id       UUID                 REFERENCES client_schema.client_projects(id),
  name             VARCHAR(200)         NOT NULL,  -- e.g. 'Monthly Retainer'
  description      TEXT,
  status           subscription_status  NOT NULL DEFAULT 'active',
  amount           NUMERIC(12,2)        NOT NULL,
  currency         VARCHAR(3)           NOT NULL DEFAULT 'USD',
  billing_period   VARCHAR(20)          NOT NULL DEFAULT 'monthly',
  billing_day      SMALLINT             DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  start_date       DATE                 NOT NULL,
  end_date         DATE,
  trial_end_date   DATE,
  current_period_start DATE,
  current_period_end   DATE,
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  gateway_sub_id   TEXT,
  auto_invoice     BOOLEAN              NOT NULL DEFAULT TRUE,
  metadata         JSONB                NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE billing_schema.coupons (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           VARCHAR(60)   UNIQUE NOT NULL,
  description    TEXT,
  discount_type  VARCHAR(20)   NOT NULL DEFAULT 'percent',  -- 'percent','fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses       INT,
  used_count     INT           NOT NULL DEFAULT 0,
  min_amount     NUMERIC(12,2),
  valid_from     TIMESTAMPTZ,
  valid_until    TIMESTAMPTZ,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  MARKETING SCHEMA
-- ============================================================

CREATE TABLE marketing_schema.subscribers (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(320)  UNIQUE NOT NULL,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  source          VARCHAR(80),  -- 'blog','popup','footer','landing_page'
  is_confirmed    BOOLEAN       NOT NULL DEFAULT FALSE,
  confirm_token   TEXT,
  confirmed_at    TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounce_reason   TEXT,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscribers_email      ON marketing_schema.subscribers (email);
CREATE INDEX idx_subscribers_confirmed  ON marketing_schema.subscribers (is_confirmed) WHERE unsubscribed_at IS NULL;
CREATE INDEX idx_subscribers_tags       ON marketing_schema.subscribers USING GIN (tags);

CREATE TABLE marketing_schema.email_campaigns (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  subject         VARCHAR(400) NOT NULL,
  preview_text    VARCHAR(200),
  content_html    TEXT,
  content_json    JSONB,
  from_name       VARCHAR(120),
  from_email      VARCHAR(320),
  reply_to        VARCHAR(320),
  segment_tags    TEXT[]       NOT NULL DEFAULT '{}',
  status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  recipient_count INT          NOT NULL DEFAULT 0,
  open_count      INT          NOT NULL DEFAULT 0,
  click_count     INT          NOT NULL DEFAULT 0,
  bounce_count    INT          NOT NULL DEFAULT 0,
  unsubscribe_count INT        NOT NULL DEFAULT 0,
  created_by      UUID         REFERENCES auth_schema.users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE marketing_schema.utm_links (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_code    VARCHAR(20)  UNIQUE NOT NULL,
  destination   TEXT         NOT NULL,
  utm_source    VARCHAR(100),
  utm_medium    VARCHAR(100),
  utm_campaign  VARCHAR(200),
  utm_term      VARCHAR(200),
  utm_content   VARCHAR(200),
  click_count   BIGINT       NOT NULL DEFAULT 0,
  created_by    UUID         REFERENCES auth_schema.users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
--  ██████  ANALYTICS SCHEMA
-- ============================================================

CREATE TABLE analytics_schema.page_views (
  id           UUID         DEFAULT uuid_generate_v4(),
  session_id   VARCHAR(80)  NOT NULL,
  user_id      UUID         REFERENCES auth_schema.users(id),
  page_path    TEXT         NOT NULL,
  page_title   VARCHAR(500),
  referrer     TEXT,
  utm_source   VARCHAR(100),
  utm_medium   VARCHAR(100),
  utm_campaign VARCHAR(200),
  device_type  VARCHAR(20),
  browser      VARCHAR(80),
  os           VARCHAR(80),
  country      VARCHAR(80),
  city         VARCHAR(80),
  ip_address   INET,
  duration_sec INT,
  scroll_depth SMALLINT,  -- 0-100 percentage
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE analytics_schema.page_views_2025_01 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE analytics_schema.page_views_2025_02 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE analytics_schema.page_views_2025_q2 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE analytics_schema.page_views_2025_q3 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE analytics_schema.page_views_2025_q4 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE analytics_schema.page_views_2026_q1 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE analytics_schema.page_views_2026_q2 PARTITION OF analytics_schema.page_views
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_pageviews_path    ON analytics_schema.page_views (page_path, created_at DESC);
CREATE INDEX idx_pageviews_session ON analytics_schema.page_views (session_id);
CREATE INDEX idx_pageviews_created ON analytics_schema.page_views (created_at DESC);

CREATE TABLE analytics_schema.events (
  id           UUID         DEFAULT uuid_generate_v4(),
  session_id   VARCHAR(80)  NOT NULL,
  user_id      UUID         REFERENCES auth_schema.users(id),
  event_name   VARCHAR(120) NOT NULL,
  event_props  JSONB        NOT NULL DEFAULT '{}',
  page_path    TEXT,
  device_type  VARCHAR(20),
  country      VARCHAR(80),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE analytics_schema.events_2025 PARTITION OF analytics_schema.events
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE analytics_schema.events_2026 PARTITION OF analytics_schema.events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_events_name    ON analytics_schema.events (event_name, created_at DESC);
CREATE INDEX idx_events_session ON analytics_schema.events (session_id);
CREATE INDEX idx_events_props   ON analytics_schema.events USING GIN (event_props);

CREATE TABLE analytics_schema.conversions (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      VARCHAR(80),
  user_id         UUID         REFERENCES auth_schema.users(id),
  lead_id         UUID         REFERENCES crm_schema.leads(id),
  conversion_type VARCHAR(60)  NOT NULL,  -- 'lead_form','consultation','estimate'
  source          VARCHAR(80),
  medium          VARCHAR(80),
  campaign        VARCHAR(200),
  page_path       TEXT,
  value           NUMERIC(12,2),
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversions_type    ON analytics_schema.conversions (conversion_type, created_at DESC);
CREATE INDEX idx_conversions_lead    ON analytics_schema.conversions (lead_id);


-- ============================================================
--  ██████  AI SCHEMA
-- ============================================================

CREATE TABLE ai_schema.conversations (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   VARCHAR(80)  NOT NULL,
  user_id      UUID         REFERENCES auth_schema.users(id),
  agent_type   ai_agent_type NOT NULL DEFAULT 'chatbot',
  title        VARCHAR(300),
  is_resolved  BOOLEAN      NOT NULL DEFAULT FALSE,
  lead_id      UUID         REFERENCES crm_schema.leads(id),
  metadata     JSONB        NOT NULL DEFAULT '{}',
  started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_session ON ai_schema.conversations (session_id);
CREATE INDEX idx_conversations_user    ON ai_schema.conversations (user_id);

CREATE TABLE ai_schema.messages (
  id              UUID         DEFAULT uuid_generate_v4(),
  conversation_id UUID         NOT NULL REFERENCES ai_schema.conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20)  NOT NULL,  -- 'user','assistant','system'
  content         TEXT         NOT NULL,
  tokens_used     INT,
  model           VARCHAR(80),
  latency_ms      INT,
  is_flagged      BOOLEAN      NOT NULL DEFAULT FALSE,
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE ai_schema.messages_2025 PARTITION OF ai_schema.messages
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE ai_schema.messages_2026 PARTITION OF ai_schema.messages
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_ai_messages_conv ON ai_schema.messages (conversation_id, created_at ASC);

CREATE TABLE ai_schema.prompt_library (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  agent_type   ai_agent_type,
  system_prompt TEXT        NOT NULL,
  user_template TEXT,
  variables    JSONB        NOT NULL DEFAULT '[]',
  model        VARCHAR(80)  NOT NULL DEFAULT 'gpt-4o',
  temperature  NUMERIC(3,2) DEFAULT 0.7,
  max_tokens   INT          DEFAULT 1000,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by   UUID         REFERENCES auth_schema.users(id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_schema.token_usage (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type   ai_agent_type NOT NULL,
  model        VARCHAR(80)   NOT NULL,
  prompt_tokens    INT       NOT NULL DEFAULT 0,
  completion_tokens INT      NOT NULL DEFAULT 0,
  total_tokens INT           NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(10,6) NOT NULL DEFAULT 0,
  date         DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_usage_date  ON ai_schema.token_usage (date DESC);
CREATE INDEX idx_token_usage_agent ON ai_schema.token_usage (agent_type);


-- ============================================================
--  ██████  SYSTEM SCHEMA
-- ============================================================

-- Audit Logs
CREATE TABLE system_schema.audit_logs (
  id            UUID         DEFAULT uuid_generate_v4(),
  actor_id      UUID         REFERENCES auth_schema.users(id),
  actor_ip      INET,
  action        VARCHAR(20)  NOT NULL,  -- 'INSERT','UPDATE','DELETE','LOGIN','EXPORT'
  resource_type VARCHAR(120) NOT NULL,  -- table name or resource
  resource_id   UUID,
  old_data      JSONB,
  new_data      JSONB,
  diff          JSONB,                  -- computed diff between old and new
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE system_schema.audit_logs_2025 PARTITION OF system_schema.audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE system_schema.audit_logs_2026 PARTITION OF system_schema.audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_audit_actor    ON system_schema.audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON system_schema.audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_action   ON system_schema.audit_logs (action);
CREATE INDEX idx_audit_created  ON system_schema.audit_logs (created_at DESC);

-- Notifications
CREATE TABLE system_schema.notifications (
  id           UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID                 NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  channel      notification_channel NOT NULL DEFAULT 'in_app',
  type         VARCHAR(80)          NOT NULL,  -- 'lead_assigned','invoice_paid','ticket_created'
  title        VARCHAR(300)         NOT NULL,
  body         TEXT,
  action_url   TEXT,
  icon         VARCHAR(80),
  is_read      BOOLEAN              NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  failed_at    TIMESTAMPTZ,
  fail_reason  TEXT,
  metadata     JSONB                NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON system_schema.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread  ON system_schema.notifications (user_id, is_read) WHERE is_read = FALSE;

-- Settings / Config
CREATE TABLE system_schema.settings (
  key         VARCHAR(200) PRIMARY KEY,
  value       JSONB        NOT NULL,
  group_name  VARCHAR(80)  NOT NULL DEFAULT 'general',
  description TEXT,
  is_public   BOOLEAN      NOT NULL DEFAULT FALSE,  -- can be exposed to frontend
  updated_by  UUID         REFERENCES auth_schema.users(id),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_group  ON system_schema.settings (group_name);
CREATE INDEX idx_settings_public ON system_schema.settings (is_public) WHERE is_public = TRUE;

-- Feature Flags
CREATE TABLE system_schema.feature_flags (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL UNIQUE,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  description  TEXT,
  is_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  enabled_for  JSONB        NOT NULL DEFAULT '{}',  -- { roles: [], users: [], percent: 0 }
  updated_by   UUID         REFERENCES auth_schema.users(id),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- API Keys
CREATE TABLE system_schema.api_keys (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  key_hash    TEXT         NOT NULL UNIQUE,  -- SHA-256 of actual key
  key_prefix  VARCHAR(12)  NOT NULL,         -- shown in UI: 'sk_live_abc1...'
  user_id     UUID         REFERENCES auth_schema.users(id),
  scopes      TEXT[]       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  ip_whitelist INET[],
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash   ON system_schema.api_keys (key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_user   ON system_schema.api_keys (user_id);

-- Webhooks
CREATE TABLE system_schema.webhooks (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(200) NOT NULL,
  direction    webhook_direction NOT NULL DEFAULT 'outbound',
  url          TEXT,
  secret       TEXT,                        -- HMAC secret for signature
  events       TEXT[]       NOT NULL DEFAULT '{}',  -- ['lead.created','invoice.paid']
  headers      JSONB        NOT NULL DEFAULT '{}',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  retry_count  SMALLINT     NOT NULL DEFAULT 3,
  timeout_sec  SMALLINT     NOT NULL DEFAULT 30,
  created_by   UUID         REFERENCES auth_schema.users(id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE system_schema.webhook_deliveries (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id   UUID        NOT NULL REFERENCES system_schema.webhooks(id) ON DELETE CASCADE,
  event        VARCHAR(80) NOT NULL,
  payload      JSONB       NOT NULL DEFAULT '{}',
  response_code SMALLINT,
  response_body TEXT,
  attempt      SMALLINT    NOT NULL DEFAULT 1,
  duration_ms  INT,
  success      BOOLEAN,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_hook    ON system_schema.webhook_deliveries (webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_success ON system_schema.webhook_deliveries (success);

-- Company Profile
CREATE TABLE system_schema.company_profile (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name     VARCHAR(200) NOT NULL,
  legal_name       VARCHAR(200),
  registration_no  VARCHAR(80),
  gst_number       VARCHAR(80),
  pan_number       VARCHAR(80),
  tagline          VARCHAR(300),
  description      TEXT,
  founded_year     SMALLINT,
  team_size        INT,
  logo_id          UUID         REFERENCES cms_schema.media(id),
  favicon_id       UUID         REFERENCES cms_schema.media(id),
  primary_color    VARCHAR(20)  DEFAULT '#8B5CF6',
  emails           JSONB        NOT NULL DEFAULT '{}',  -- { general, support, sales }
  phones           JSONB        NOT NULL DEFAULT '{}',
  social_links     JSONB        NOT NULL DEFAULT '{}',  -- { linkedin, twitter, github }
  address          JSONB        NOT NULL DEFAULT '{}',
  website_url      TEXT,
  support_email    VARCHAR(320),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE system_schema.offices (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  type        office_type  NOT NULL DEFAULT 'branch',
  address     TEXT         NOT NULL,
  city        VARCHAR(80),
  state       VARCHAR(80),
  country     VARCHAR(80)  NOT NULL,
  postal_code VARCHAR(20),
  phone       VARCHAR(30),
  email       VARCHAR(320),
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  timezone    VARCHAR(60)  NOT NULL DEFAULT 'UTC',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Team Members
CREATE TABLE system_schema.team_members (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         UNIQUE REFERENCES auth_schema.users(id),
  name         VARCHAR(200) NOT NULL,
  designation  VARCHAR(200) NOT NULL,
  department   VARCHAR(120),
  bio          TEXT,
  avatar_id    UUID         REFERENCES cms_schema.media(id),
  expertise    TEXT[]       NOT NULL DEFAULT '{}',
  social_links JSONB        NOT NULL DEFAULT '{}',
  is_leadership BOOLEAN     NOT NULL DEFAULT FALSE,
  is_featured  BOOLEAN      NOT NULL DEFAULT FALSE,
  display_order INT         NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  joined_date  DATE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_featured  ON system_schema.team_members (is_featured, display_order);
CREATE INDEX idx_team_members_leadership ON system_schema.team_members (is_leadership);


-- ============================================================
--  DEFERRED FOREIGN KEY CONSTRAINTS (circular refs resolved)
-- ============================================================
ALTER TABLE cms_schema.testimonials
  ADD CONSTRAINT fk_testimonial_service FOREIGN KEY (service_id) REFERENCES cms_schema.services(id),
  ADD CONSTRAINT fk_testimonial_project FOREIGN KEY (project_id) REFERENCES portfolio_schema.projects(id);

ALTER TABLE crm_schema.proposals
  ADD CONSTRAINT fk_proposal_client FOREIGN KEY (client_id) REFERENCES client_schema.clients(id);

ALTER TABLE crm_schema.meetings
  ADD CONSTRAINT fk_meeting_client FOREIGN KEY (client_id) REFERENCES client_schema.clients(id);


-- ============================================================
--  VIEWS — useful pre-built queries
-- ============================================================

-- Active leads with assigned user name
CREATE VIEW crm_schema.v_leads_overview AS
SELECT
  l.id, l.public_id, l.full_name, l.email, l.company,
  l.stage, l.lead_score, l.lead_temperature, l.budget_range,
  l.expected_value, l.currency, l.created_at, l.next_follow_up,
  l.source, l.services_needed,
  u.display_name AS assigned_to_name,
  u.avatar_url   AS assigned_to_avatar
FROM crm_schema.leads l
LEFT JOIN auth_schema.users u ON l.assigned_to = u.id
WHERE l.deleted_at IS NULL AND l.is_archived = FALSE;

-- Published blog posts with author and category
CREATE VIEW blog_schema.v_posts_published AS
SELECT
  p.id, p.title, p.slug, p.excerpt, p.read_time_min,
  p.view_count, p.published_at, p.cover_image,
  c.name AS category_name, c.slug AS category_slug,
  u.display_name AS author_name, u.avatar_url AS author_avatar
FROM blog_schema.posts p
LEFT JOIN blog_schema.categories c ON p.category_id = c.id
LEFT JOIN auth_schema.users       u ON p.author_id = u.id
WHERE p.status = 'published' AND p.deleted_at IS NULL
ORDER BY p.published_at DESC;

-- Published portfolio projects
CREATE VIEW portfolio_schema.v_projects_published AS
SELECT
  p.id, p.title, p.slug, p.summary, p.client_name,
  p.cover_image, p.budget_range, p.duration_weeks,
  p.tech_stack, p.tags, p.display_order,
  sc.name AS category_name, sc.slug AS category_slug,
  i.name  AS industry_name
FROM portfolio_schema.projects p
LEFT JOIN cms_schema.service_categories sc ON p.category_id = sc.id
LEFT JOIN cms_schema.industries          i  ON p.industry_id = i.id
WHERE p.is_published = TRUE AND p.deleted_at IS NULL
ORDER BY p.display_order ASC, p.end_date DESC;

-- Open support tickets needing attention (SLA risk)
CREATE VIEW support_schema.v_tickets_at_risk AS
SELECT
  t.id, t.ticket_number, t.subject, t.priority, t.status,
  t.sla_due_at, t.created_at,
  EXTRACT(EPOCH FROM (t.sla_due_at - NOW()))/3600 AS hours_until_breach,
  c.company_name AS client_name,
  u.display_name AS assigned_to_name
FROM support_schema.tickets t
LEFT JOIN client_schema.clients   c ON t.client_id = c.id
LEFT JOIN auth_schema.users       u ON t.assigned_to = u.id
WHERE t.status NOT IN ('resolved','closed')
  AND t.sla_due_at IS NOT NULL
  AND t.sla_due_at < NOW() + INTERVAL '4 hours'
ORDER BY t.sla_due_at ASC;

-- Revenue summary per client
CREATE VIEW billing_schema.v_client_revenue AS
SELECT
  c.id AS client_id, c.company_name,
  COUNT(i.id)                     AS total_invoices,
  SUM(i.total_amount)             AS total_billed,
  SUM(i.amount_paid)              AS total_paid,
  SUM(i.amount_due)               AS total_outstanding,
  MAX(i.paid_at)                  AS last_payment_at,
  COUNT(s.id)                     AS active_subscriptions,
  SUM(s.amount)                   AS monthly_recurring
FROM client_schema.clients c
LEFT JOIN billing_schema.invoices i
  ON c.id = i.client_id AND i.status NOT IN ('draft','cancelled')
LEFT JOIN billing_schema.subscriptions s
  ON c.id = s.client_id AND s.status = 'active'
GROUP BY c.id, c.company_name;

-- Active services catalog
CREATE VIEW cms_schema.v_services_catalog AS
SELECT
  s.id, s.title, s.slug, s.tagline, s.summary,
  s.icon, s.pricing_type, s.starting_price, s.currency,
  s.duration_min, s.duration_max, s.is_featured,
  sc.name AS category_name, sc.slug AS category_slug,
  sc.icon AS category_icon,
  COUNT(sp.id) AS package_count
FROM cms_schema.services s
LEFT JOIN cms_schema.service_categories sc ON s.category_id = sc.id
LEFT JOIN cms_schema.service_packages   sp ON s.id = sp.service_id AND sp.is_active = TRUE
WHERE s.is_active = TRUE AND s.deleted_at IS NULL
GROUP BY s.id, sc.name, sc.slug, sc.icon
ORDER BY s.sort_order;

-- Admin dashboard KPI view
CREATE VIEW analytics_schema.v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM crm_schema.leads WHERE created_at >= date_trunc('month', NOW()) AND deleted_at IS NULL)               AS leads_this_month,
  (SELECT COUNT(*) FROM crm_schema.leads WHERE stage = 'won' AND won_at >= date_trunc('month', NOW()))                        AS deals_won_this_month,
  (SELECT COALESCE(SUM(deal_value),0) FROM crm_schema.leads WHERE stage = 'won' AND won_at >= date_trunc('month', NOW()))     AS revenue_won_this_month,
  (SELECT COUNT(*) FROM support_schema.tickets WHERE status = 'open')                                                         AS open_tickets,
  (SELECT COUNT(*) FROM client_schema.client_projects WHERE status IN ('development','testing','design'))                     AS active_projects,
  (SELECT COALESCE(SUM(total_amount),0) FROM billing_schema.invoices WHERE status = 'paid' AND paid_at >= date_trunc('month', NOW())) AS invoiced_this_month,
  (SELECT COALESCE(SUM(total_amount),0) FROM billing_schema.invoices WHERE status = 'overdue')                                AS overdue_amount,
  (SELECT COUNT(*) FROM careers_schema.applications WHERE applied_at >= date_trunc('month', NOW()))                           AS new_applications_this_month;


-- ============================================================
--  SEED DATA — Roles & Permissions
-- ============================================================

INSERT INTO auth_schema.roles (name, slug, description, is_system) VALUES
  ('Super Admin',  'super_admin',  'Full unrestricted access to all platform modules', TRUE),
  ('Admin',        'admin',        'Platform admin — CMS, CRM, analytics, settings',  TRUE),
  ('Manager',      'manager',      'Team manager — CRM, projects, limited settings',   TRUE),
  ('Editor',       'editor',       'Content editor — CMS, blog, portfolio, media',     TRUE),
  ('Sales',        'sales',        'Sales team — CRM, leads, proposals, meetings',     TRUE),
  ('HR',           'hr',           'HR team — careers, candidates, interviews',         TRUE),
  ('Support',      'support',      'Support team — tickets, KB, client portal view',   TRUE),
  ('Finance',      'finance',      'Finance team — invoices, payments, reports',        TRUE),
  ('Client',       'client',       'Client portal user — read-own-data only',          TRUE),
  ('Candidate',    'candidate',    'Job applicant — careers portal access',            TRUE),
  ('Partner',      'partner',      'Agency/reseller partner',                          TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO auth_schema.permissions (name, slug, module) VALUES
  -- Users
  ('Create User',       'user.create',       'users'),
  ('Read Users',        'user.read',         'users'),
  ('Edit User',         'user.edit',         'users'),
  ('Delete User',       'user.delete',       'users'),
  ('Manage Roles',      'role.manage',       'users'),
  -- CMS
  ('Publish Page',      'page.publish',      'cms'),
  ('Edit Page',         'page.edit',         'cms'),
  ('Delete Page',       'page.delete',       'cms'),
  ('Manage Media',      'media.manage',      'cms'),
  ('Manage Menus',      'menu.manage',       'cms'),
  ('Manage SEO',        'seo.manage',        'cms'),
  ('Manage Redirects',  'redirect.manage',   'cms'),
  -- Services
  ('Manage Services',   'service.manage',    'cms'),
  -- CRM
  ('View Leads',        'lead.read',         'crm'),
  ('Create Lead',       'lead.create',       'crm'),
  ('Edit Lead',         'lead.edit',         'crm'),
  ('Delete Lead',       'lead.delete',       'crm'),
  ('Assign Lead',       'lead.assign',       'crm'),
  ('Export Leads',      'lead.export',       'crm'),
  ('View Pipeline',     'pipeline.read',     'crm'),
  ('Manage Proposals',  'proposal.manage',   'crm'),
  ('Manage Meetings',   'meeting.manage',    'crm'),
  -- Portfolio
  ('Manage Portfolio',  'portfolio.manage',  'portfolio'),
  ('Publish Portfolio', 'portfolio.publish', 'portfolio'),
  -- Blog
  ('Write Post',        'post.write',        'blog'),
  ('Publish Post',      'post.publish',      'blog'),
  ('Delete Post',       'post.delete',       'blog'),
  -- Careers
  ('Manage Jobs',       'job.manage',        'careers'),
  ('View Applications', 'application.read',  'careers'),
  ('Process Applications','application.process','careers'),
  -- Support
  ('View Tickets',      'ticket.read',       'support'),
  ('Reply Tickets',     'ticket.reply',      'support'),
  ('Assign Tickets',    'ticket.assign',     'support'),
  ('Close Tickets',     'ticket.close',      'support'),
  ('Manage KB',         'kb.manage',         'support'),
  -- Clients
  ('View Clients',      'client.read',       'clients'),
  ('Manage Clients',    'client.manage',     'clients'),
  -- Billing
  ('View Invoices',     'invoice.read',      'billing'),
  ('Create Invoice',    'invoice.create',    'billing'),
  ('Send Invoice',      'invoice.send',      'billing'),
  ('Manage Payments',   'payment.manage',    'billing'),
  ('View Reports',      'report.read',       'billing'),
  -- Analytics
  ('View Analytics',    'analytics.read',    'analytics'),
  -- AI
  ('Manage AI',         'ai.manage',         'ai'),
  -- System
  ('Manage Settings',   'settings.manage',   'system'),
  ('View Audit Logs',   'audit.read',        'system'),
  ('Manage Integrations','integration.manage','system'),
  ('Manage API Keys',   'apikey.manage',     'system')
ON CONFLICT (slug) DO NOTHING;

-- Seed default service categories
INSERT INTO cms_schema.service_categories (name, slug, description, icon, sort_order) VALUES
  ('Web Development',        'web-development',       'Custom web apps and websites',             'Globe',         1),
  ('AI Solutions',           'ai-solutions',          'AI integration and automation',            'Brain',         2),
  ('SaaS Development',       'saas-development',      'End-to-end SaaS product development',     'Cloud',         3),
  ('Mobile Apps',            'mobile-apps',           'iOS and Android app development',          'Smartphone',    4),
  ('Plugin Development',     'plugin-development',    'CMS plugins and browser extensions',      'Puzzle',        5),
  ('DevOps & Cloud',         'devops-cloud',          'CI/CD, cloud infra, Docker, Kubernetes',  'Server',        6),
  ('UI/UX Design',           'ui-ux-design',          'User interface and experience design',     'Palette',       7),
  ('API Integration',        'api-integration',       'Third-party API connections',              'Webhook',       8),
  ('Consulting',             'consulting',            'Technical and digital strategy consulting','MessageCircle', 9),
  ('Maintenance & Support',  'maintenance-support',   'Ongoing support and maintenance plans',    'Wrench',       10)
ON CONFLICT (slug) DO NOTHING;

-- Seed default settings
INSERT INTO system_schema.settings (key, value, group_name, description, is_public) VALUES
  ('site.name',            '"Company Name"',           'branding',  'Website / company display name',      TRUE),
  ('site.tagline',         '"Premium Software Solutions"', 'branding', 'Site tagline shown in SEO',        TRUE),
  ('site.url',             '"https://company.com"',    'branding',  'Production website URL',              TRUE),
  ('site.logo_url',        '"null"',                   'branding',  'Logo CDN URL',                        TRUE),
  ('email.from_name',      '"Company Name"',           'email',     'Default from name for emails',        FALSE),
  ('email.from_address',   '"hello@company.com"',      'email',     'Default from address',                FALSE),
  ('email.support',        '"support@company.com"',    'email',     'Support email',                       TRUE),
  ('crm.lead_auto_assign', 'true',                     'crm',       'Auto-assign new leads to sales team', FALSE),
  ('crm.sla_hours_low',    '48',                       'crm',       'SLA hours for low priority tickets',  FALSE),
  ('crm.sla_hours_medium', '24',                       'crm',       'SLA hours for medium priority',       FALSE),
  ('crm.sla_hours_high',   '8',                        'crm',       'SLA hours for high priority tickets', FALSE),
  ('crm.sla_hours_critical','2',                       'crm',       'SLA hours for critical tickets',      FALSE),
  ('billing.default_currency', '"USD"',               'billing',   'Default invoice currency',             FALSE),
  ('billing.invoice_prefix',   '"INV"',               'billing',   'Invoice number prefix',                FALSE),
  ('billing.payment_terms',    '30',                  'billing',   'Default net payment terms (days)',     FALSE),
  ('ai.chatbot_enabled',  'true',                     'ai',        'Enable AI chatbot on website',         FALSE),
  ('ai.chatbot_model',    '"gpt-4o-mini"',            'ai',        'AI model for website chatbot',         FALSE),
  ('analytics.ga4_id',    '"null"',                   'analytics', 'Google Analytics 4 measurement ID',   FALSE)
ON CONFLICT (key) DO NOTHING;

-- Seed feature flags
INSERT INTO system_schema.feature_flags (name, slug, description, is_enabled) VALUES
  ('AI Chatbot',           'ai_chatbot',           'Live AI chat widget on public website',   TRUE),
  ('Client Portal',        'client_portal',        'Enable client portal login',              TRUE),
  ('Portfolio Filter',     'portfolio_filter',     'Dynamic portfolio filtering',             TRUE),
  ('Estimate Calculator',  'estimate_calculator',  'Interactive project estimate tool',       TRUE),
  ('Blog Comments',        'blog_comments',        'Blog post comment sections',              FALSE),
  ('Multilingual',         'multilingual',         'Multi-language support (i18n)',           FALSE),
  ('WhatsApp Chat',        'whatsapp_chat',        'WhatsApp Business chat widget',           FALSE),
  ('Referral Program',     'referral_program',     'Client referral tracking system',         FALSE)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
--  USEFUL INDEXES (additional)
-- ============================================================

-- Full-text search across leads
CREATE INDEX idx_leads_fts ON crm_schema.leads
  USING GIN (to_tsvector('english',
    COALESCE(full_name,'') || ' ' ||
    COALESCE(email,'') || ' ' ||
    COALESCE(company,'') || ' ' ||
    COALESCE(requirements,'')
  ));

-- Full-text search on services
CREATE INDEX idx_services_fts ON cms_schema.services
  USING GIN (to_tsvector('english',
    title || ' ' ||
    COALESCE(tagline,'') || ' ' ||
    COALESCE(summary,'') || ' ' ||
    COALESCE(description,'')
  ));

-- Partial index: only featured published projects
CREATE INDEX idx_projects_featured_published ON portfolio_schema.projects (display_order)
  WHERE is_published = TRUE AND is_featured = TRUE AND deleted_at IS NULL;

-- Composite index for CRM pipeline board
CREATE INDEX idx_leads_pipeline ON crm_schema.leads (assigned_to, stage, lead_score DESC)
  WHERE deleted_at IS NULL AND is_archived = FALSE;

-- Composite index for invoice due management
CREATE INDEX idx_invoices_collection ON billing_schema.invoices (client_id, status, due_date)
  WHERE status IN ('sent','overdue');


-- ============================================================
--  COMMENTS (documentation)
-- ============================================================

COMMENT ON SCHEMA auth_schema       IS 'Authentication — users, roles, permissions, sessions, OAuth';
COMMENT ON SCHEMA cms_schema        IS 'CMS — pages, blocks, media, services, industries, solutions, menus';
COMMENT ON SCHEMA portfolio_schema  IS 'Portfolio — projects, gallery, metrics';
COMMENT ON SCHEMA blog_schema       IS 'Blog — posts, categories, tags, resources';
COMMENT ON SCHEMA crm_schema        IS 'CRM — leads, activities, proposals, meetings, accounts';
COMMENT ON SCHEMA careers_schema    IS 'ATS / Careers — jobs, candidates, applications, interviews';
COMMENT ON SCHEMA client_schema     IS 'Client portal — clients, projects, milestones, tasks, contracts, messages';
COMMENT ON SCHEMA support_schema    IS 'Support — tickets, messages, knowledge base';
COMMENT ON SCHEMA billing_schema    IS 'Billing — invoices, payments, subscriptions, coupons, tax';
COMMENT ON SCHEMA marketing_schema  IS 'Marketing — subscribers, campaigns, UTM links';
COMMENT ON SCHEMA analytics_schema  IS 'Analytics — page views, events, conversions (partitioned)';
COMMENT ON SCHEMA ai_schema         IS 'AI — conversations, messages, prompts, token usage (partitioned)';
COMMENT ON SCHEMA system_schema     IS 'System — audit logs, notifications, settings, feature flags, webhooks';

-- ============================================================
--  END OF SCHEMA
--  Tables:      80+
--  Indexes:     90+
--  Views:       7
--  Enums:       23
--  Schemas:     13
--  Triggers:    15
--  Functions:   5
-- ============================================================
