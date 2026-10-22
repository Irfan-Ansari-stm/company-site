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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'status_basic'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE status_basic AS ENUM ('active','inactive','archived','deleted');$enum$;
  END IF;
END $$;
-- Visibility
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'visibility_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE visibility_type AS ENUM ('public','private','draft','scheduled');$enum$;
  END IF;
END $$;
-- User roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'user_role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE user_role AS ENUM (
      'super_admin','admin','manager','editor',
      'sales','hr','support','finance',
      'client','candidate','partner'
    );$enum$;
  END IF;
END $$;
-- Lead/deal stage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'lead_stage'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE lead_stage AS ENUM (
      'new','contacted','qualified','meeting_scheduled',
      'proposal_sent','negotiation','won','lost'
    );$enum$;
  END IF;
END $$;
-- Lead source
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'lead_source'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE lead_source AS ENUM (
      'website','referral','linkedin','google_ads',
      'meta_ads','cold_outreach','partner','event','other'
    );$enum$;
  END IF;
END $$;
-- Project status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'project_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE project_status AS ENUM (
      'discovery','planning','design','development',
      'testing','review','delivered','maintenance','on_hold','cancelled'
    );$enum$;
  END IF;
END $$;
-- Ticket priority
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'ticket_priority'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE ticket_priority AS ENUM ('low','medium','high','critical');$enum$;
  END IF;
END $$;
-- Ticket status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'ticket_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE ticket_status AS ENUM (
      'open','pending_client','in_progress','resolved','closed','on_hold'
    );$enum$;
  END IF;
END $$;
-- Invoice status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'invoice_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE invoice_status AS ENUM (
      'draft','sent','viewed','partial','paid','overdue','cancelled','refunded'
    );$enum$;
  END IF;
END $$;
-- Payment method
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'payment_method'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE payment_method AS ENUM (
      'stripe','razorpay','bank_transfer','paypal','crypto','other'
    );$enum$;
  END IF;
END $$;
-- Payment status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'payment_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE payment_status AS ENUM (
      'pending','processing','completed','failed','refunded','disputed'
    );$enum$;
  END IF;
END $$;
-- Subscription status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'subscription_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE subscription_status AS ENUM (
      'trialing','active','past_due','cancelled','paused','unpaid'
    );$enum$;
  END IF;
END $$;
-- Job type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'job_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE job_type AS ENUM (
      'full_time','part_time','contract','internship','freelance'
    );$enum$;
  END IF;
END $$;
-- Application stage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'application_stage'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE application_stage AS ENUM (
      'applied','screening','shortlisted','interview_1',
      'interview_2','technical_test','offer','hired','rejected','withdrawn'
    );$enum$;
  END IF;
END $$;
-- Blog post status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'post_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE post_status AS ENUM ('draft','review','scheduled','published','archived');$enum$;
  END IF;
END $$;
-- Notification channel
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'notification_channel'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE notification_channel AS ENUM ('email','sms','push','in_app','whatsapp','slack');$enum$;
  END IF;
END $$;
-- Proposal status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'proposal_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE proposal_status AS ENUM (
      'draft','sent','viewed','accepted','rejected','expired','revised'
    );$enum$;
  END IF;
END $$;
-- Contract status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'contract_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE contract_status AS ENUM (
      'draft','sent','signed','expired','cancelled','terminated'
    );$enum$;
  END IF;
END $$;
-- Meeting status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'meeting_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE meeting_status AS ENUM (
      'scheduled','confirmed','rescheduled','completed','cancelled','no_show'
    );$enum$;
  END IF;
END $$;
-- AI agent type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'ai_agent_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE ai_agent_type AS ENUM (
      'sales','support','seo','content','proposal','lead_scoring',
      'recruitment','project_assistant','chatbot'
    );$enum$;
  END IF;
END $$;
-- Webhook event direction
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'webhook_direction'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE webhook_direction AS ENUM ('inbound','outbound');$enum$;
  END IF;
END $$;
-- File storage provider
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'storage_provider'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE storage_provider AS ENUM ('s3','r2','local','gcs');$enum$;
  END IF;
END $$;
-- Price type for services
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'pricing_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE pricing_type AS ENUM ('fixed','hourly','monthly','custom','free');$enum$;
  END IF;
END $$;
-- Office type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'office_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $enum$CREATE TYPE office_type AS ENUM ('headquarters','branch','remote_hub','coworking');$enum$;
  END IF;
END $$;

-- Ensure existing installations receive enum values added in later schema versions.
DO $$
DECLARE
  v_type   TEXT;
  v_labels TEXT[];
  v_label  TEXT;
BEGIN
  FOR v_type, v_labels IN
    VALUES
      ('status_basic', ARRAY['active','inactive','archived','deleted']),
      ('visibility_type', ARRAY['public','private','draft','scheduled']),
      ('user_role', ARRAY['super_admin','admin','manager','editor','sales','hr','support','finance','client','candidate','partner']),
      ('lead_stage', ARRAY['new','contacted','qualified','meeting_scheduled','proposal_sent','negotiation','won','lost']),
      ('lead_source', ARRAY['website','referral','linkedin','google_ads','meta_ads','cold_outreach','partner','event','other']),
      ('project_status', ARRAY['discovery','planning','design','development','testing','review','delivered','maintenance','on_hold','cancelled']),
      ('ticket_priority', ARRAY['low','medium','high','critical']),
      ('ticket_status', ARRAY['open','pending_client','in_progress','resolved','closed','on_hold']),
      ('invoice_status', ARRAY['draft','sent','viewed','partial','paid','overdue','cancelled','refunded']),
      ('payment_method', ARRAY['stripe','razorpay','bank_transfer','paypal','crypto','other']),
      ('payment_status', ARRAY['pending','processing','completed','failed','refunded','disputed']),
      ('subscription_status', ARRAY['trialing','active','past_due','cancelled','paused','unpaid']),
      ('job_type', ARRAY['full_time','part_time','contract','internship','freelance']),
      ('application_stage', ARRAY['applied','screening','shortlisted','interview_1','interview_2','technical_test','offer','hired','rejected','withdrawn']),
      ('post_status', ARRAY['draft','review','scheduled','published','archived']),
      ('notification_channel', ARRAY['email','sms','push','in_app','whatsapp','slack']),
      ('proposal_status', ARRAY['draft','sent','viewed','accepted','rejected','expired','revised']),
      ('contract_status', ARRAY['draft','sent','signed','expired','cancelled','terminated']),
      ('meeting_status', ARRAY['scheduled','confirmed','rescheduled','completed','cancelled','no_show']),
      ('ai_agent_type', ARRAY['sales','support','seo','content','proposal','lead_scoring','recruitment','project_assistant','chatbot']),
      ('webhook_direction', ARRAY['inbound','outbound']),
      ('storage_provider', ARRAY['s3','r2','local','gcs']),
      ('pricing_type', ARRAY['fixed','hourly','monthly','custom','free']),
      ('office_type', ARRAY['headquarters','branch','remote_hub','coworking'])
  LOOP
    FOREACH v_label IN ARRAY v_labels LOOP
      EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', v_type, v_label);
    END LOOP;
  END LOOP;
END $$;

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
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
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
-- ============================================================
--  ENTERPRISE POSTGRESQL SCHEMA — PART 2
--  Stored Procedures, Business Functions, Triggers,
--  Row-Level Security, Full-Text Search Config,
--  Advanced Indexes, Materialized Views,
--  Queue Tables, Rate Limiting, Cron Jobs
--  Company Corporate Website & Digital Service Platform
--  Version: 1.0  |  PostgreSQL 15+
-- ============================================================

-- ============================================================
--  SECTION 1: BUSINESS LOGIC FUNCTIONS
-- ============================================================

-- ── 1.1 Auto-calculate lead score based on attributes ────────
CREATE OR REPLACE FUNCTION crm_schema.calculate_lead_score(
  p_budget_range    TEXT,
  p_urgency         TEXT,
  p_company         TEXT,
  p_services_count  INT,
  p_source          lead_source,
  p_has_phone       BOOLEAN
) RETURNS SMALLINT AS $$
DECLARE
  v_score INT := 0;
BEGIN
  -- Budget range score (0-30)
  v_score := v_score + CASE p_budget_range
    WHEN '< $5k'       THEN 5
    WHEN '$5k-$15k'    THEN 10
    WHEN '$15k-$50k'   THEN 20
    WHEN '$50k-$100k'  THEN 25
    WHEN '$100k+'      THEN 30
    ELSE 5
  END;

  -- Urgency score (0-20)
  v_score := v_score + CASE p_urgency
    WHEN 'critical' THEN 20
    WHEN 'high'     THEN 15
    WHEN 'medium'   THEN 10
    WHEN 'low'      THEN 5
    ELSE 5
  END;

  -- Company provided (0-10)
  v_score := v_score + CASE WHEN p_company IS NOT NULL AND p_company != '' THEN 10 ELSE 0 END;

  -- Number of services interested in (0-15)
  v_score := v_score + LEAST(p_services_count * 5, 15);

  -- Lead source quality (0-15)
  v_score := v_score + CASE p_source
    WHEN 'referral'      THEN 15
    WHEN 'partner'       THEN 12
    WHEN 'linkedin'      THEN 10
    WHEN 'google_ads'    THEN 8
    WHEN 'website'       THEN 7
    WHEN 'cold_outreach' THEN 5
    ELSE 5
  END;

  -- Phone number provided (0-10)
  v_score := v_score + CASE WHEN p_has_phone THEN 10 ELSE 0 END;

  RETURN LEAST(v_score::SMALLINT, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION crm_schema.calculate_lead_score IS
  'Calculates lead score 0-100 based on budget, urgency, company, services, source, phone';

-- ── 1.2 Auto-set lead temperature based on score ─────────────
CREATE OR REPLACE FUNCTION crm_schema.score_to_temperature(p_score SMALLINT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_score >= 75 THEN 'hot'
    WHEN p_score >= 40 THEN 'warm'
    ELSE 'cold'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 1.3 Generate unique invoice number ───────────────────────
CREATE OR REPLACE FUNCTION billing_schema.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_prefix  TEXT;
  v_year    TEXT;
  v_seq     INT;
  v_result  TEXT;
BEGIN
  SELECT COALESCE(value #>> '{}', 'INV')
    INTO v_prefix FROM system_schema.settings WHERE key = 'billing.invoice_prefix';

  v_year := to_char(NOW(), 'YYYY');

  SELECT COUNT(*) + 1
    INTO v_seq
    FROM billing_schema.invoices
   WHERE invoice_number LIKE v_prefix || '-' || v_year || '-%';

  v_result := v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ── 1.4 Generate unique ticket number ────────────────────────
CREATE OR REPLACE FUNCTION support_schema.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  v_seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq FROM support_schema.tickets;
  RETURN 'TKT-' || to_char(NOW(), 'YYMMDD') || '-' || lpad(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ── 1.5 Calculate blog post read time ────────────────────────
CREATE OR REPLACE FUNCTION blog_schema.calculate_read_time(p_content TEXT)
RETURNS INT AS $$
DECLARE
  v_word_count INT;
  v_wpm        INT := 238; -- average adult reading speed
BEGIN
  v_word_count := array_length(regexp_split_to_array(trim(p_content), '\s+'), 1);
  RETURN GREATEST(1, ROUND(v_word_count::NUMERIC / v_wpm));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 1.6 Get user permissions (flat array) ────────────────────
CREATE OR REPLACE FUNCTION auth_schema.get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_perms TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT p.slug)
    INTO v_perms
    FROM auth_schema.user_roles ur
    JOIN auth_schema.role_permissions rp ON ur.role_id = rp.role_id
    JOIN auth_schema.permissions p       ON rp.permission_id = p.id
   WHERE ur.user_id = p_user_id
     AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

  RETURN COALESCE(v_perms, '{}');
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.7 Check if user has a specific permission ───────────────
CREATE OR REPLACE FUNCTION auth_schema.user_has_permission(
  p_user_id    UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
      FROM auth_schema.user_roles ur
      JOIN auth_schema.role_permissions rp ON ur.role_id = rp.role_id
      JOIN auth_schema.permissions p       ON rp.permission_id = p.id
     WHERE ur.user_id = p_user_id
       AND p.slug = p_permission
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.8 SLA due date calculator ───────────────────────────────
CREATE OR REPLACE FUNCTION support_schema.calculate_sla_due(
  p_priority ticket_priority
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_hours INT;
  v_key   TEXT;
BEGIN
  v_key := CASE p_priority
    WHEN 'low'      THEN 'crm.sla_hours_low'
    WHEN 'medium'   THEN 'crm.sla_hours_medium'
    WHEN 'high'     THEN 'crm.sla_hours_high'
    WHEN 'critical' THEN 'crm.sla_hours_critical'
  END;

  SELECT (value::text)::int INTO v_hours
    FROM system_schema.settings WHERE key = v_key;

  RETURN NOW() + (COALESCE(v_hours, 24) || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.9 Update project progress from tasks ────────────────────
CREATE OR REPLACE FUNCTION client_schema.refresh_project_progress(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total    INT;
  v_done     INT;
  v_progress SMALLINT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO v_total, v_done
    FROM client_schema.tasks
   WHERE project_id = p_project_id;

  v_progress := CASE WHEN v_total = 0 THEN 0
                     ELSE ROUND((v_done::NUMERIC / v_total) * 100)
                END;

  UPDATE client_schema.client_projects
     SET progress_percent = v_progress,
         updated_at       = NOW()
   WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ── 1.10 Update invoice amount_paid from payments ────────────
CREATE OR REPLACE FUNCTION billing_schema.sync_invoice_payment(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
  v_paid   NUMERIC(14,2);
  v_total  NUMERIC(14,2);
  v_status invoice_status;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
    INTO v_paid
    FROM billing_schema.payments
   WHERE invoice_id = p_invoice_id
     AND status = 'completed';

  SELECT total_amount INTO v_total
    FROM billing_schema.invoices WHERE id = p_invoice_id;

  v_status := CASE
    WHEN v_paid = 0         THEN 'sent'
    WHEN v_paid >= v_total  THEN 'paid'
    ELSE 'partial'
  END;

  UPDATE billing_schema.invoices
     SET amount_paid = v_paid,
         status      = v_status,
         paid_at     = CASE WHEN v_status = 'paid' THEN NOW() ELSE paid_at END,
         updated_at  = NOW()
   WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- ── 1.11 Full-text search across all content ─────────────────
CREATE OR REPLACE FUNCTION public.global_search(
  p_query      TEXT,
  p_types      TEXT[] DEFAULT NULL,   -- ['services','blog','portfolio','jobs']
  p_limit      INT    DEFAULT 10
) RETURNS TABLE (
  id           UUID,
  type         TEXT,
  title        TEXT,
  slug         TEXT,
  excerpt      TEXT,
  score        FLOAT4
) AS $$
BEGIN
  RETURN QUERY
  WITH results AS (
    -- Services
    SELECT s.id, 'service'::TEXT, s.title, s.slug,
           s.tagline AS excerpt,
           ts_rank(to_tsvector('english', s.title || ' ' || COALESCE(s.summary,'')),
                   plainto_tsquery('english', p_query)) AS score
      FROM cms_schema.services s
     WHERE s.is_active = TRUE AND s.deleted_at IS NULL
       AND to_tsvector('english', s.title || ' ' || COALESCE(s.summary,''))
           @@ plainto_tsquery('english', p_query)
       AND (p_types IS NULL OR 'service' = ANY(p_types))

    UNION ALL

    -- Blog posts
    SELECT p.id, 'blog'::TEXT, p.title, p.slug,
           p.excerpt,
           ts_rank(to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt,'')),
                   plainto_tsquery('english', p_query)) AS score
      FROM blog_schema.posts p
     WHERE p.status = 'published' AND p.deleted_at IS NULL
       AND to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt,''))
           @@ plainto_tsquery('english', p_query)
       AND (p_types IS NULL OR 'blog' = ANY(p_types))

    UNION ALL

    -- Portfolio projects
    SELECT pr.id, 'portfolio'::TEXT, pr.title, pr.slug,
           pr.summary AS excerpt,
           ts_rank(to_tsvector('english', pr.title || ' ' || COALESCE(pr.summary,'')),
                   plainto_tsquery('english', p_query)) AS score
      FROM portfolio_schema.projects pr
     WHERE pr.is_published = TRUE AND pr.deleted_at IS NULL
       AND to_tsvector('english', pr.title || ' ' || COALESCE(pr.summary,''))
           @@ plainto_tsquery('english', p_query)
       AND (p_types IS NULL OR 'portfolio' = ANY(p_types))

    UNION ALL

    -- Jobs
    SELECT j.id, 'job'::TEXT, j.title, j.slug,
           j.description AS excerpt,
           ts_rank(to_tsvector('english', j.title || ' ' || COALESCE(j.description,'')),
                   plainto_tsquery('english', p_query)) AS score
      FROM careers_schema.jobs j
     WHERE j.is_published = TRUE AND j.deleted_at IS NULL
       AND to_tsvector('english', j.title || ' ' || COALESCE(j.description,''))
           @@ plainto_tsquery('english', p_query)
       AND (p_types IS NULL OR 'job' = ANY(p_types))
  )
  SELECT * FROM results
   ORDER BY score DESC
   LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.12 CRM Pipeline summary ─────────────────────────────────
CREATE OR REPLACE FUNCTION crm_schema.pipeline_summary(
  p_assigned_to UUID DEFAULT NULL
) RETURNS TABLE (
  stage             lead_stage,
  lead_count        BIGINT,
  total_value       NUMERIC,
  avg_score         NUMERIC,
  overdue_followups BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.stage,
    COUNT(*)                                               AS lead_count,
    COALESCE(SUM(l.expected_value), 0)                    AS total_value,
    ROUND(AVG(l.lead_score), 1)                           AS avg_score,
    COUNT(*) FILTER (WHERE l.next_follow_up < NOW())      AS overdue_followups
  FROM crm_schema.leads l
  WHERE l.deleted_at IS NULL
    AND l.is_archived = FALSE
    AND (p_assigned_to IS NULL OR l.assigned_to = p_assigned_to)
  GROUP BY l.stage
  ORDER BY
    CASE l.stage
      WHEN 'new'               THEN 1
      WHEN 'contacted'         THEN 2
      WHEN 'qualified'         THEN 3
      WHEN 'meeting_scheduled' THEN 4
      WHEN 'proposal_sent'     THEN 5
      WHEN 'negotiation'       THEN 6
      WHEN 'won'               THEN 7
      WHEN 'lost'              THEN 8
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.13 Analytics: top pages in a date range ─────────────────
CREATE OR REPLACE FUNCTION analytics_schema.top_pages(
  p_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_to   TIMESTAMPTZ DEFAULT NOW(),
  p_limit INT        DEFAULT 20
) RETURNS TABLE (
  page_path   TEXT,
  view_count  BIGINT,
  unique_sessions BIGINT,
  avg_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.page_path,
    COUNT(*)                       AS view_count,
    COUNT(DISTINCT pv.session_id)  AS unique_sessions,
    ROUND(AVG(pv.duration_sec), 0) AS avg_duration
  FROM analytics_schema.page_views pv
  WHERE pv.created_at BETWEEN p_from AND p_to
  GROUP BY pv.page_path
  ORDER BY view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 1.14 Upsert settings ──────────────────────────────────────
CREATE OR REPLACE PROCEDURE system_schema.upsert_setting(
  p_key         TEXT,
  p_value       JSONB,
  p_group       TEXT DEFAULT 'general',
  p_description TEXT DEFAULT NULL,
  p_is_public   BOOLEAN DEFAULT FALSE,
  p_user_id     UUID    DEFAULT NULL
) AS $$
BEGIN
  INSERT INTO system_schema.settings (key, value, group_name, description, is_public, updated_by)
  VALUES (p_key, p_value, p_group, p_description, p_is_public, p_user_id)
  ON CONFLICT (key) DO UPDATE
    SET value      = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ── 1.15 Log AI token usage ───────────────────────────────────
CREATE OR REPLACE PROCEDURE ai_schema.log_token_usage(
  p_agent_type       ai_agent_type,
  p_model            TEXT,
  p_prompt_tokens    INT,
  p_completion_tokens INT,
  p_cost_usd         NUMERIC
) AS $$
BEGIN
  INSERT INTO ai_schema.token_usage
    (agent_type, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, date)
  VALUES
    (p_agent_type, p_model, p_prompt_tokens, p_completion_tokens,
     p_prompt_tokens + p_completion_tokens, p_cost_usd, CURRENT_DATE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ── 1.16 Mark notification as read ───────────────────────────
CREATE OR REPLACE PROCEDURE system_schema.mark_notification_read(
  p_notification_id UUID,
  p_user_id         UUID
) AS $$
BEGIN
  UPDATE system_schema.notifications
     SET is_read = TRUE, read_at = NOW()
   WHERE id = p_notification_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ── 1.17 Soft-delete lead ─────────────────────────────────────
CREATE OR REPLACE PROCEDURE crm_schema.delete_lead(
  p_lead_id UUID,
  p_user_id UUID
) AS $$
BEGIN
  UPDATE crm_schema.leads
     SET deleted_at = NOW(), is_archived = TRUE
   WHERE id = p_lead_id;

  INSERT INTO system_schema.audit_logs
    (actor_id, action, resource_type, resource_id, ip_address)
  VALUES
    (p_user_id, 'DELETE', 'leads', p_lead_id, NULL);
END;
$$ LANGUAGE plpgsql;

-- ── 1.18 Convert lead to client ───────────────────────────────
CREATE OR REPLACE PROCEDURE crm_schema.convert_lead_to_client(
  p_lead_id UUID,
  p_user_id UUID,
  OUT p_client_id UUID
) AS $$
DECLARE
  v_lead    crm_schema.leads%ROWTYPE;
  v_user_id UUID;
BEGIN
  SELECT * INTO v_lead FROM crm_schema.leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead % not found', p_lead_id;
  END IF;

  -- Create user account for the lead if not exists
  INSERT INTO auth_schema.users
    (email, first_name, last_name, role, is_active)
  VALUES
    (v_lead.email, v_lead.first_name, v_lead.last_name, 'client', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- Create account in CRM
  INSERT INTO crm_schema.accounts (name, website, email, owner_id, is_client)
  VALUES (COALESCE(v_lead.company, v_lead.full_name), v_lead.website, v_lead.email, p_user_id, TRUE)
  ON CONFLICT DO NOTHING;

  -- Create client record
  INSERT INTO client_schema.clients
    (user_id, company_name, billing_email, phone, currency, account_manager, onboarded_at)
  VALUES
    (v_user_id, COALESCE(v_lead.company, v_lead.full_name),
     v_lead.email, v_lead.phone, v_lead.currency, p_user_id, NOW())
  RETURNING id INTO p_client_id;

  -- Update lead stage to won
  UPDATE crm_schema.leads
     SET stage        = 'won',
         won_at       = NOW(),
         converted_at = NOW(),
         updated_at   = NOW()
   WHERE id = p_lead_id;

  -- Log activity
  INSERT INTO crm_schema.lead_activities
    (lead_id, actor_id, activity_type, subject, description)
  VALUES
    (p_lead_id, p_user_id, 'stage_change', 'Lead Converted',
     'Lead converted to client. Client ID: ' || p_client_id::text);
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  SECTION 2: TRIGGERS
-- ============================================================

-- ── 2.1 Auto-score lead on insert/update ─────────────────────
CREATE OR REPLACE FUNCTION crm_schema.trg_auto_score_lead()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := crm_schema.calculate_lead_score(
    NEW.budget_range,
    NEW.urgency,
    NEW.company,
    array_length(NEW.services_needed, 1),
    NEW.source,
    NEW.phone IS NOT NULL
  );
  NEW.lead_temperature := crm_schema.score_to_temperature(NEW.lead_score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_auto_score
  BEFORE INSERT OR UPDATE OF budget_range, urgency, company, services_needed, source, phone
  ON crm_schema.leads
  FOR EACH ROW EXECUTE FUNCTION crm_schema.trg_auto_score_lead();

-- ── 2.2 Auto-set SLA on ticket insert ────────────────────────
CREATE OR REPLACE FUNCTION support_schema.trg_set_ticket_sla()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := support_schema.calculate_sla_due(NEW.priority);
  END IF;
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := support_schema.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_set_sla
  BEFORE INSERT ON support_schema.tickets
  FOR EACH ROW EXECUTE FUNCTION support_schema.trg_set_ticket_sla();

-- ── 2.3 Auto-set invoice number on insert ────────────────────
CREATE OR REPLACE FUNCTION billing_schema.trg_set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := billing_schema.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_set_number
  BEFORE INSERT ON billing_schema.invoices
  FOR EACH ROW EXECUTE FUNCTION billing_schema.trg_set_invoice_number();

-- ── 2.4 Auto-calculate blog read time ────────────────────────
CREATE OR REPLACE FUNCTION blog_schema.trg_calc_read_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.read_time_min := blog_schema.calculate_read_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_read_time
  BEFORE INSERT OR UPDATE OF content
  ON blog_schema.posts
  FOR EACH ROW EXECUTE FUNCTION blog_schema.trg_calc_read_time();

-- ── 2.5 Auto-set published_at when status → published ────────
CREATE OR REPLACE FUNCTION blog_schema.trg_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_published_at
  BEFORE UPDATE OF status ON blog_schema.posts
  FOR EACH ROW EXECUTE FUNCTION blog_schema.trg_set_published_at();

-- ── 2.6 Auto-update project progress when task changes ────────
CREATE OR REPLACE FUNCTION client_schema.trg_task_progress_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM client_schema.refresh_project_progress(
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_progress
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON client_schema.tasks
  FOR EACH ROW EXECUTE FUNCTION client_schema.trg_task_progress_update();

-- ── 2.7 Auto-sync invoice on payment change ───────────────────
CREATE OR REPLACE FUNCTION billing_schema.trg_sync_invoice()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM billing_schema.sync_invoice_payment(
    COALESCE(NEW.invoice_id, OLD.invoice_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_sync_invoice
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON billing_schema.payments
  FOR EACH ROW EXECUTE FUNCTION billing_schema.trg_sync_invoice();

-- ── 2.8 Auto-increment job applications_count ─────────────────
CREATE OR REPLACE FUNCTION careers_schema.trg_update_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE careers_schema.jobs
       SET applications_count = applications_count + 1
     WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE careers_schema.jobs
       SET applications_count = GREATEST(applications_count - 1, 0)
     WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_count
  AFTER INSERT OR DELETE ON careers_schema.applications
  FOR EACH ROW EXECUTE FUNCTION careers_schema.trg_update_application_count();

-- ── 2.9 Auto-track first response on ticket ──────────────────
CREATE OR REPLACE FUNCTION support_schema.trg_ticket_first_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count non-internal messages from team members
  IF NOT NEW.is_internal THEN
    UPDATE support_schema.tickets
       SET first_response_at = COALESCE(first_response_at, NOW()),
           status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
           updated_at = NOW()
     WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_message_response
  AFTER INSERT ON support_schema.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION support_schema.trg_ticket_first_response();

-- ── 2.10 Auto-log audit on sensitive table changes ───────────
CREATE OR REPLACE FUNCTION system_schema.trg_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_schema.audit_logs
    (actor_id, action, resource_type, resource_id, old_data, new_data, ip_address)
  VALUES (
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
    TG_OP,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    NULLIF(COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id'), '')::UUID,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN row_to_json(NEW) ELSE NULL END,
    NULLIF(current_setting('app.current_ip', TRUE), '')::INET
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to critical tables
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON auth_schema.users
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_roles
  AFTER INSERT OR UPDATE OR DELETE ON auth_schema.roles
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR DELETE ON auth_schema.user_roles
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON crm_schema.leads
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON crm_schema.proposals
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON billing_schema.invoices
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON billing_schema.payments
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON client_schema.contracts
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

CREATE TRIGGER trg_audit_settings
  AFTER INSERT OR UPDATE ON system_schema.settings
  FOR EACH ROW EXECUTE FUNCTION system_schema.trg_audit_changes();

-- ── 2.11 Updated_at triggers for remaining tables ────────────
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON auth_schema.roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_oauth_updated_at
  BEFORE UPDATE ON auth_schema.oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON blog_schema.categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON blog_schema.resources
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON careers_schema.candidates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON system_schema.team_members
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON billing_schema.subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_kb_updated_at
  BEFORE UPDATE ON support_schema.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_prompt_library_updated_at
  BEFORE UPDATE ON ai_schema.prompt_library
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_service_categories_updated_at
  BEFORE UPDATE ON cms_schema.service_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_industries_updated_at
  BEFORE UPDATE ON cms_schema.industries
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON cms_schema.testimonials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON crm_schema.accounts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON crm_schema.meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
--  SECTION 3: MATERIALIZED VIEWS (pre-computed for performance)
-- ============================================================

-- ── 3.1 Homepage stats (refreshed hourly via pg_cron) ────────
CREATE MATERIALIZED VIEW public.mv_company_stats AS
SELECT
  (SELECT COUNT(*) FROM portfolio_schema.projects WHERE is_published = TRUE)::INT         AS projects_delivered,
  (SELECT COUNT(DISTINCT client_id) FROM client_schema.client_projects)::INT              AS happy_clients,
  (SELECT COUNT(*) FROM system_schema.team_members WHERE is_active = TRUE)::INT           AS team_members,
  (SELECT EXTRACT(YEAR FROM NOW())::INT - MIN(founded_year)
     FROM system_schema.company_profile
     WHERE founded_year IS NOT NULL)                                                       AS years_experience,
  (SELECT COUNT(*) FROM crm_schema.leads WHERE stage = 'won')::INT                        AS leads_converted,
  NOW()                                                                                    AS last_refreshed
WITH DATA;

CREATE UNIQUE INDEX idx_mv_company_stats ON public.mv_company_stats ((1));

-- ── 3.2 Service performance stats ────────────────────────────
CREATE MATERIALIZED VIEW cms_schema.mv_service_stats AS
SELECT
  s.id               AS service_id,
  s.title            AS service_title,
  s.slug             AS service_slug,
  COUNT(DISTINCT l.id) FILTER (WHERE 'services/' || s.slug = ANY(l.services_needed)) AS lead_count,
  COUNT(DISTINCT p.id)                                                                AS project_count,
  COUNT(DISTINCT t.id)                                                                AS testimonial_count,
  AVG(t.rating)                                                                       AS avg_rating,
  NOW()                                                                               AS last_refreshed
FROM cms_schema.services s
LEFT JOIN crm_schema.leads l          ON s.slug = ANY(ARRAY(SELECT unnest(l.services_needed)))
LEFT JOIN portfolio_schema.projects p ON p.category_id = s.category_id AND p.is_published = TRUE
LEFT JOIN cms_schema.testimonials t   ON t.service_id = s.id AND t.is_published = TRUE
WHERE s.is_active = TRUE AND s.deleted_at IS NULL
GROUP BY s.id, s.title, s.slug
WITH DATA;

CREATE UNIQUE INDEX idx_mv_service_stats ON cms_schema.mv_service_stats (service_id);

-- ── 3.3 Monthly revenue summary ──────────────────────────────
CREATE MATERIALIZED VIEW billing_schema.mv_monthly_revenue AS
SELECT
  DATE_TRUNC('month', paid_at)::DATE  AS month,
  COUNT(DISTINCT i.id)                AS invoices_paid,
  SUM(i.total_amount)                 AS gross_revenue,
  SUM(i.discount_amount)              AS total_discounts,
  SUM(i.tax_amount)                   AS total_tax,
  SUM(i.amount_paid)                  AS net_collected,
  COUNT(DISTINCT i.client_id)         AS paying_clients,
  AVG(i.total_amount)                 AS avg_invoice_value
FROM billing_schema.invoices i
WHERE i.status = 'paid' AND i.paid_at IS NOT NULL
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC
WITH DATA;

CREATE UNIQUE INDEX idx_mv_monthly_revenue ON billing_schema.mv_monthly_revenue (month);

-- ── 3.4 Blog tag cloud ────────────────────────────────────────
CREATE MATERIALIZED VIEW blog_schema.mv_tag_cloud AS
SELECT
  t.id, t.name, t.slug,
  COUNT(pt.post_id) AS usage_count
FROM blog_schema.tags t
LEFT JOIN blog_schema.post_tags pt ON t.id = pt.tag_id
LEFT JOIN blog_schema.posts p      ON pt.post_id = p.id AND p.status = 'published'
GROUP BY t.id, t.name, t.slug
ORDER BY usage_count DESC
WITH DATA;

CREATE UNIQUE INDEX idx_mv_tag_cloud ON blog_schema.mv_tag_cloud (id);

-- ── 3.5 Lead source performance ──────────────────────────────
CREATE MATERIALIZED VIEW crm_schema.mv_lead_source_stats AS
SELECT
  source,
  COUNT(*)                                          AS total_leads,
  COUNT(*) FILTER (WHERE stage = 'won')             AS won_leads,
  COUNT(*) FILTER (WHERE stage = 'lost')            AS lost_leads,
  ROUND(
    COUNT(*) FILTER (WHERE stage = 'won')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  )                                                  AS win_rate,
  AVG(lead_score)                                   AS avg_score,
  COALESCE(SUM(deal_value) FILTER (WHERE stage='won'), 0) AS total_won_value,
  NOW()                                             AS last_refreshed
FROM crm_schema.leads
WHERE deleted_at IS NULL
GROUP BY source
WITH DATA;

CREATE UNIQUE INDEX idx_mv_lead_source ON crm_schema.mv_lead_source_stats (source);

-- ── Refresh function for all materialized views ───────────────
CREATE OR REPLACE PROCEDURE public.refresh_all_materialized_views()
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_company_stats;
  REFRESH MATERIALIZED VIEW cms_schema.mv_service_stats;
  REFRESH MATERIALIZED VIEW billing_schema.mv_monthly_revenue;
  REFRESH MATERIALIZED VIEW blog_schema.mv_tag_cloud;
  REFRESH MATERIALIZED VIEW crm_schema.mv_lead_source_stats;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  SECTION 4: ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Application principal used by RLS policies.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- Enable RLS on sensitive tables
ALTER TABLE auth_schema.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_schema.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_schema.lead_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_schema.clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_schema.client_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_schema.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_schema.messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schema.invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schema.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_schema.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_schema.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_schema.audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_schema.api_keys         ENABLE ROW LEVEL SECURITY;

-- ── RLS: Users — can see own profile; admins see all ─────────
CREATE POLICY policy_users_self ON auth_schema.users
  FOR ALL TO authenticated
  USING (
    id = current_setting('app.current_user_id', TRUE)::UUID
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'user.read')
  );

-- ── RLS: Sessions — users see only own sessions ───────────────
CREATE POLICY policy_sessions_own ON auth_schema.sessions
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- ── RLS: Leads — sales see assigned; admins see all ──────────
CREATE POLICY policy_leads_assigned ON crm_schema.leads
  FOR SELECT TO authenticated
  USING (
    assigned_to = current_setting('app.current_user_id', TRUE)::UUID
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'lead.read')
  );

CREATE POLICY policy_leads_insert ON crm_schema.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_schema.user_has_permission(
      current_setting('app.current_user_id', TRUE)::UUID, 'lead.edit')
  );

CREATE POLICY policy_leads_update ON crm_schema.leads
  FOR UPDATE TO authenticated
  USING (
    auth_schema.user_has_permission(
      current_setting('app.current_user_id', TRUE)::UUID, 'lead.edit')
  )
  WITH CHECK (
    auth_schema.user_has_permission(
      current_setting('app.current_user_id', TRUE)::UUID, 'lead.edit')
  );

CREATE POLICY policy_leads_delete ON crm_schema.leads
  FOR DELETE TO authenticated
  USING (
    auth_schema.user_has_permission(
      current_setting('app.current_user_id', TRUE)::UUID, 'lead.edit')
  );

-- ── RLS: Clients — client users see only themselves ───────────
CREATE POLICY policy_clients_own ON client_schema.clients
  FOR SELECT TO authenticated
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'client.read')
  );

-- ── RLS: Client Projects — clients see only own projects ──────
CREATE POLICY policy_client_projects_own ON client_schema.client_projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_schema.clients c
       WHERE c.id = client_schema.client_projects.client_id
         AND c.user_id = current_setting('app.current_user_id', TRUE)::UUID
    )
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'client.read')
  );

-- ── RLS: Invoices — clients see own invoices ─────────────────
CREATE POLICY policy_invoices_own ON billing_schema.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_schema.clients c
       WHERE c.id = billing_schema.invoices.client_id
         AND c.user_id = current_setting('app.current_user_id', TRUE)::UUID
    )
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'invoice.read')
  );

-- ── RLS: Tickets — clients see own tickets ────────────────────
CREATE POLICY policy_tickets_own ON support_schema.tickets
  FOR SELECT TO authenticated
  USING (
    reporter_id = current_setting('app.current_user_id', TRUE)::UUID
    OR EXISTS (
      SELECT 1 FROM client_schema.clients c
       WHERE c.id = support_schema.tickets.client_id
         AND c.user_id = current_setting('app.current_user_id', TRUE)::UUID
    )
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'ticket.read')
  );

-- ── RLS: Ticket messages — no internal notes to clients ───────
CREATE POLICY policy_ticket_messages_visible ON support_schema.ticket_messages
  FOR SELECT TO authenticated
  USING (
    NOT is_internal
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'ticket.read')
  );

-- ── RLS: Audit logs — only admins ────────────────────────────
CREATE POLICY policy_audit_admin ON system_schema.audit_logs
  FOR SELECT TO authenticated
  USING (
    auth_schema.user_has_permission(
      current_setting('app.current_user_id', TRUE)::UUID, 'audit.read')
  );

-- ── RLS: API keys — users see only own keys ──────────────────
CREATE POLICY policy_api_keys_own ON system_schema.api_keys
  FOR ALL TO authenticated
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'apikey.manage')
  );

-- ── RLS: Messages — project participants only ─────────────────
CREATE POLICY policy_messages_project ON client_schema.messages
  FOR SELECT TO authenticated
  USING (
    sender_id = current_setting('app.current_user_id', TRUE)::UUID
    OR EXISTS (
      SELECT 1 FROM client_schema.client_projects cp
      JOIN client_schema.clients c ON cp.client_id = c.id
       WHERE cp.id = client_schema.messages.project_id
         AND (c.user_id = current_setting('app.current_user_id', TRUE)::UUID
              OR cp.project_manager = current_setting('app.current_user_id', TRUE)::UUID
              OR cp.tech_lead       = current_setting('app.current_user_id', TRUE)::UUID)
    )
    OR auth_schema.user_has_permission(
         current_setting('app.current_user_id', TRUE)::UUID, 'client.read')
  );


-- ============================================================
--  SECTION 5: QUEUE TABLES (for background job processing)
-- ============================================================

CREATE TABLE system_schema.job_queue (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name    VARCHAR(80)   NOT NULL DEFAULT 'default',
  job_type      VARCHAR(120)  NOT NULL,   -- 'send_email','generate_pdf','score_lead','send_sms'
  payload       JSONB         NOT NULL DEFAULT '{}',
  status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
                                          -- 'pending','running','completed','failed','dead'
  priority      SMALLINT      NOT NULL DEFAULT 5,  -- 1=highest,10=lowest
  attempts      SMALLINT      NOT NULL DEFAULT 0,
  max_attempts  SMALLINT      NOT NULL DEFAULT 3,
  scheduled_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  failed_at     TIMESTAMPTZ,
  error_message TEXT,
  result        JSONB,
  worker_id     VARCHAR(80),
  run_after     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_queue_pending   ON system_schema.job_queue (queue_name, priority, run_after)
  WHERE status = 'pending';
CREATE INDEX idx_job_queue_status    ON system_schema.job_queue (status, created_at DESC);
CREATE INDEX idx_job_queue_scheduled ON system_schema.job_queue (scheduled_at)
  WHERE status = 'pending';

-- Function to enqueue a job
CREATE OR REPLACE FUNCTION system_schema.enqueue_job(
  p_job_type    TEXT,
  p_payload     JSONB,
  p_queue       TEXT         DEFAULT 'default',
  p_priority    SMALLINT     DEFAULT 5,
  p_run_after   TIMESTAMPTZ  DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO system_schema.job_queue
    (queue_name, job_type, payload, priority, run_after)
  VALUES
    (p_queue, p_job_type, p_payload, p_priority, p_run_after)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to dequeue next job (SKIP LOCKED for concurrent workers)
CREATE OR REPLACE FUNCTION system_schema.dequeue_job(
  p_queue      TEXT     DEFAULT 'default',
  p_worker_id  TEXT     DEFAULT NULL
) RETURNS SETOF system_schema.job_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE system_schema.job_queue
     SET status    = 'running',
         started_at = NOW(),
         attempts  = attempts + 1,
         worker_id = p_worker_id
   WHERE id = (
     SELECT id FROM system_schema.job_queue
      WHERE queue_name = p_queue
        AND status     = 'pending'
        AND run_after  <= NOW()
      ORDER BY priority ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
   RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a job
CREATE OR REPLACE PROCEDURE system_schema.complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT '{}'
) AS $$
BEGIN
  UPDATE system_schema.job_queue
     SET status       = 'completed',
         completed_at = NOW(),
         result       = p_result
   WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to fail a job (with retry logic)
CREATE OR REPLACE PROCEDURE system_schema.fail_job(
  p_job_id      UUID,
  p_error       TEXT,
  p_retry_delay INTERVAL DEFAULT '5 minutes'
) AS $$
BEGIN
  UPDATE system_schema.job_queue
     SET status        = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
         failed_at     = NOW(),
         error_message = p_error,
         run_after     = CASE WHEN attempts < max_attempts THEN NOW() + p_retry_delay ELSE run_after END
   WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  SECTION 6: RATE LIMITING TABLE
-- ============================================================

CREATE TABLE system_schema.rate_limits (
  key         TEXT        NOT NULL,  -- 'ip:192.168.1.1:contact_form', 'user:uuid:api'
  window_end  TIMESTAMPTZ NOT NULL,
  count       INT         NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_end)
);

CREATE INDEX idx_rate_limits_key ON system_schema.rate_limits (key, window_end);

-- Rate limit check and increment (atomic)
CREATE OR REPLACE FUNCTION system_schema.check_rate_limit(
  p_key        TEXT,
  p_window     INTERVAL DEFAULT '1 hour',
  p_max_count  INT      DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_count     INT;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_end := DATE_TRUNC('hour', NOW()) + p_window;

  INSERT INTO system_schema.rate_limits (key, window_end, count)
  VALUES (p_key, v_window_end, 1)
  ON CONFLICT (key, window_end)
  DO UPDATE SET count = system_schema.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Clean old windows
  DELETE FROM system_schema.rate_limits WHERE window_end < NOW() - INTERVAL '2 hours';

  RETURN v_count <= p_max_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  SECTION 7: NOTIFICATION TEMPLATES & AUTO-SEND TRIGGERS
-- ============================================================

CREATE TABLE system_schema.notification_templates (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL UNIQUE,
  event_type   VARCHAR(80)  NOT NULL,   -- matches job_type or trigger event
  channel      notification_channel NOT NULL DEFAULT 'email',
  subject      VARCHAR(400),
  body_html    TEXT,
  body_text    TEXT,
  variables    TEXT[]       NOT NULL DEFAULT '{}',   -- expected variable names
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed notification templates
INSERT INTO system_schema.notification_templates
  (name, event_type, channel, subject, body_text, variables) VALUES
  ('Lead Created - Sales Alert',   'lead.created',   'email',
   'New Lead: {{full_name}} from {{company}}',
   'You have a new lead from {{full_name}} ({{email}}). Budget: {{budget_range}}. Urgency: {{urgency}}.',
   ARRAY['full_name','email','company','budget_range','urgency']),

  ('Lead Assigned - Sales Rep',    'lead.assigned',  'email',
   'Lead Assigned to You: {{full_name}}',
   'A lead has been assigned to you: {{full_name}} from {{company}}. Lead score: {{lead_score}}.',
   ARRAY['full_name','company','lead_score']),

  ('New Ticket - Support Alert',   'ticket.created', 'email',
   'New Support Ticket #{{ticket_number}}: {{subject}}',
   'A new {{priority}} priority ticket has been created by {{reporter_name}}: {{subject}}',
   ARRAY['ticket_number','priority','reporter_name','subject']),

  ('Ticket Resolved - Client',     'ticket.resolved','email',
   'Your ticket #{{ticket_number}} has been resolved',
   'Your support ticket "{{subject}}" has been resolved. Please rate your experience.',
   ARRAY['ticket_number','subject']),

  ('Invoice Sent - Client',        'invoice.sent',   'email',
   'Invoice #{{invoice_number}} for {{amount}} {{currency}}',
   'Please find attached invoice #{{invoice_number}} for {{amount}} {{currency}}, due {{due_date}}.',
   ARRAY['invoice_number','amount','currency','due_date']),

  ('Invoice Paid - Finance Alert', 'invoice.paid',   'email',
   'Payment Received: Invoice #{{invoice_number}}',
   'Payment of {{amount}} {{currency}} received for invoice #{{invoice_number}}.',
   ARRAY['invoice_number','amount','currency']),

  ('Application Received',         'application.created','email',
   'Application received for {{job_title}}',
   'Thank you for applying for {{job_title}}. We will review your application.',
   ARRAY['job_title','candidate_name']),

  ('Meeting Reminder',             'meeting.reminder','email',
   'Reminder: {{title}} in 1 hour',
   'Your meeting "{{title}}" is starting in 1 hour at {{scheduled_at}}. Link: {{meeting_url}}',
   ARRAY['title','scheduled_at','meeting_url']);

-- Auto-enqueue notification job on lead creation
CREATE OR REPLACE FUNCTION crm_schema.trg_notify_on_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM system_schema.enqueue_job(
    'send_notification',
    jsonb_build_object(
      'event',    'lead.created',
      'lead_id',  NEW.id,
      'email',    NEW.email,
      'name',     NEW.full_name,
      'company',  NEW.company,
      'budget',   NEW.budget_range,
      'urgency',  NEW.urgency,
      'score',    NEW.lead_score
    ),
    'notifications',
    2  -- high priority
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_notify
  AFTER INSERT ON crm_schema.leads
  FOR EACH ROW EXECUTE FUNCTION crm_schema.trg_notify_on_lead();

-- Auto-enqueue notification on ticket creation
CREATE OR REPLACE FUNCTION support_schema.trg_notify_on_ticket()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM system_schema.enqueue_job(
    'send_notification',
    jsonb_build_object(
      'event',         'ticket.created',
      'ticket_id',     NEW.id,
      'ticket_number', NEW.ticket_number,
      'priority',      NEW.priority,
      'subject',       NEW.subject
    ),
    'notifications',
    CASE NEW.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_notify
  AFTER INSERT ON support_schema.tickets
  FOR EACH ROW EXECUTE FUNCTION support_schema.trg_notify_on_ticket();


-- ============================================================
--  SECTION 8: SEARCH CONFIGURATION
-- ============================================================

-- Custom text search configuration (English + unaccent)
CREATE TEXT SEARCH CONFIGURATION public.search_config (COPY = english);
ALTER TEXT SEARCH CONFIGURATION public.search_config
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, english_stem;

-- ── Trgm indexes for fuzzy/partial matching ────────────────────
CREATE INDEX idx_users_email_trgm
  ON auth_schema.users USING GIN (email gin_trgm_ops);

CREATE INDEX idx_users_name_trgm
  ON auth_schema.users USING GIN (display_name gin_trgm_ops);

CREATE INDEX idx_leads_name_trgm
  ON crm_schema.leads USING GIN (full_name gin_trgm_ops);

CREATE INDEX idx_leads_company_trgm
  ON crm_schema.leads USING GIN (company gin_trgm_ops);

CREATE INDEX idx_posts_title_trgm
  ON blog_schema.posts USING GIN (title gin_trgm_ops);

CREATE INDEX idx_services_title_trgm
  ON cms_schema.services USING GIN (title gin_trgm_ops);

CREATE INDEX idx_projects_title_trgm
  ON portfolio_schema.projects USING GIN (title gin_trgm_ops);

CREATE INDEX idx_jobs_title_trgm
  ON careers_schema.jobs USING GIN (title gin_trgm_ops);

CREATE INDEX idx_kb_title_trgm
  ON support_schema.knowledge_base USING GIN (title gin_trgm_ops);


-- ============================================================
--  SECTION 9: ADDITIONAL ANALYTICAL QUERIES (as views)
-- ============================================================

-- ── 9.1 Daily lead funnel conversion rates ───────────────────
CREATE VIEW crm_schema.v_lead_funnel AS
SELECT
  DATE_TRUNC('week', created_at)::DATE                        AS week,
  COUNT(*)                                                    AS total_leads,
  COUNT(*) FILTER (WHERE stage != 'new')                      AS contacted,
  COUNT(*) FILTER (WHERE stage NOT IN ('new','contacted'))    AS qualified,
  COUNT(*) FILTER (WHERE stage IN ('proposal_sent','negotiation','won')) AS proposal_stage,
  COUNT(*) FILTER (WHERE stage = 'won')                       AS won,
  COUNT(*) FILTER (WHERE stage = 'lost')                      AS lost,
  ROUND(COUNT(*) FILTER (WHERE stage = 'won')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 1)                         AS win_rate_pct,
  COALESCE(SUM(deal_value) FILTER (WHERE stage = 'won'), 0)   AS total_revenue
FROM crm_schema.leads
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- ── 9.2 Client health dashboard ──────────────────────────────
CREATE VIEW client_schema.v_client_health AS
SELECT
  c.id, c.company_name, c.health_score, c.nps_score,
  u.display_name                AS account_manager,
  COUNT(DISTINCT cp.id)         AS total_projects,
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.status IN ('development','testing','design')) AS active_projects,
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.health = 'off_track')   AS at_risk_projects,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('resolved','closed')) AS open_tickets,
  COUNT(DISTINCT t.id) FILTER (WHERE t.priority IN ('high','critical') AND t.status NOT IN ('resolved','closed')) AS critical_tickets,
  MAX(i.due_date) FILTER (WHERE i.status = 'overdue')            AS oldest_overdue,
  COALESCE(SUM(i.amount_due) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_amount
FROM client_schema.clients c
LEFT JOIN auth_schema.users           u  ON c.account_manager = u.id
LEFT JOIN client_schema.client_projects cp ON c.id = cp.client_id
LEFT JOIN support_schema.tickets       t  ON c.id = t.client_id
LEFT JOIN billing_schema.invoices      i  ON c.id = i.client_id
WHERE c.churned_at IS NULL
GROUP BY c.id, c.company_name, c.health_score, c.nps_score, u.display_name;

-- ── 9.3 Content performance ──────────────────────────────────
CREATE VIEW blog_schema.v_content_performance AS
SELECT
  p.id, p.title, p.slug, p.published_at,
  p.view_count, p.read_time_min,
  c.name AS category_name,
  u.display_name AS author_name,
  COALESCE(
    (SELECT COUNT(*) FROM analytics_schema.conversions cv
      WHERE cv.page_path LIKE '%/blog/' || p.slug), 0
  ) AS lead_conversions,
  ROUND(p.view_count::NUMERIC / GREATEST(
    EXTRACT(DAYS FROM NOW() - p.published_at), 1), 1
  ) AS daily_avg_views
FROM blog_schema.posts p
LEFT JOIN blog_schema.categories c ON p.category_id = c.id
LEFT JOIN auth_schema.users       u ON p.author_id  = u.id
WHERE p.status = 'published' AND p.deleted_at IS NULL;

-- ── 9.4 HR hiring pipeline overview ─────────────────────────
CREATE VIEW careers_schema.v_hiring_pipeline AS
SELECT
  j.id, j.title, j.job_type, j.location, j.is_remote,
  j.openings, j.applications_count,
  d.name                                                           AS department,
  COUNT(a.id) FILTER (WHERE a.stage = 'applied')                  AS new_applications,
  COUNT(a.id) FILTER (WHERE a.stage = 'shortlisted')              AS shortlisted,
  COUNT(a.id) FILTER (WHERE a.stage IN ('interview_1','interview_2')) AS in_interview,
  COUNT(a.id) FILTER (WHERE a.stage = 'offer')                    AS offers_made,
  COUNT(a.id) FILTER (WHERE a.stage = 'hired')                    AS hired,
  j.published_at
FROM careers_schema.jobs j
LEFT JOIN careers_schema.departments d ON j.department_id = d.id
LEFT JOIN careers_schema.applications a ON j.id = a.job_id
WHERE j.is_published = TRUE AND j.deleted_at IS NULL
GROUP BY j.id, j.title, j.job_type, j.location, j.is_remote, j.openings,
         j.applications_count, d.name, j.published_at;

-- ── 9.5 AI usage cost report ─────────────────────────────────
CREATE VIEW ai_schema.v_usage_report AS
SELECT
  date,
  agent_type,
  model,
  SUM(prompt_tokens)      AS total_prompt_tokens,
  SUM(completion_tokens)  AS total_completion_tokens,
  SUM(total_tokens)       AS total_tokens,
  ROUND(SUM(cost_usd), 4) AS total_cost_usd
FROM ai_schema.token_usage
GROUP BY date, agent_type, model
ORDER BY date DESC, total_cost_usd DESC;


-- ============================================================
--  SECTION 10: DATABASE MAINTENANCE & CRON JOBS
-- ============================================================

-- Requires pg_cron extension (available on most managed PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Cron job definitions (run with pg_cron) ───────────────────
/*
  -- Refresh materialized views every hour
  SELECT cron.schedule('refresh-matviews', '0 * * * *',
    'CALL public.refresh_all_materialized_views()');

  -- Clean expired sessions daily at 2am
  SELECT cron.schedule('clean-sessions', '0 2 * * *',
    'DELETE FROM auth_schema.sessions WHERE expires_at < NOW() - INTERVAL ''7 days''');

  -- Clean expired password reset tokens hourly
  SELECT cron.schedule('clean-reset-tokens', '30 * * * *',
    'DELETE FROM auth_schema.password_reset_tokens WHERE expires_at < NOW()');

  -- Clean dead queue jobs older than 30 days
  SELECT cron.schedule('clean-dead-jobs', '0 3 * * *',
    'DELETE FROM system_schema.job_queue WHERE status = ''dead'' AND created_at < NOW() - INTERVAL ''30 days''');

  -- Mark overdue invoices
  SELECT cron.schedule('mark-overdue-invoices', '0 1 * * *',
    'UPDATE billing_schema.invoices SET status = ''overdue'', overdue_at = NOW()
     WHERE status = ''sent'' AND due_date < CURRENT_DATE');

  -- Auto-archive old leads (no activity in 90 days)
  SELECT cron.schedule('archive-stale-leads', '0 4 * * 0',
    'UPDATE crm_schema.leads SET is_archived = TRUE
     WHERE is_archived = FALSE
       AND stage NOT IN (''won'', ''lost'')
       AND (last_contact_at < NOW() - INTERVAL ''90 days''
            OR (last_contact_at IS NULL AND created_at < NOW() - INTERVAL ''90 days''))
       AND deleted_at IS NULL');

  -- Clean old analytics data (keep 2 years)
  SELECT cron.schedule('clean-old-analytics', '0 5 1 * *',
    'DELETE FROM analytics_schema.page_views WHERE created_at < NOW() - INTERVAL ''2 years''');
*/

-- Manual maintenance function (call periodically)
CREATE OR REPLACE PROCEDURE public.run_maintenance()
AS $$
BEGIN
  -- Clean expired sessions
  DELETE FROM auth_schema.sessions WHERE expires_at < NOW() - INTERVAL '7 days';

  -- Clean expired tokens
  DELETE FROM auth_schema.password_reset_tokens WHERE expires_at < NOW();
  DELETE FROM auth_schema.email_verification_tokens WHERE expires_at < NOW() AND used_at IS NOT NULL;

  -- Clean rate limit windows
  DELETE FROM system_schema.rate_limits WHERE window_end < NOW() - INTERVAL '2 hours';

  -- Mark overdue invoices
  UPDATE billing_schema.invoices
     SET status = 'overdue', overdue_at = COALESCE(overdue_at, NOW())
   WHERE status = 'sent' AND due_date < CURRENT_DATE;

  -- Update subscription period dates
  UPDATE billing_schema.subscriptions
     SET current_period_start = CURRENT_DATE,
         current_period_end   = CASE billing_period
           WHEN 'monthly'   THEN CURRENT_DATE + INTERVAL '1 month'
           WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
           WHEN 'yearly'    THEN CURRENT_DATE + INTERVAL '1 year'
           ELSE CURRENT_DATE + INTERVAL '1 month'
         END
   WHERE status = 'active'
     AND (current_period_end IS NULL OR current_period_end < CURRENT_DATE);

  -- Refresh materialized views
  CALL public.refresh_all_materialized_views();

  RAISE NOTICE 'Maintenance completed at %', NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  SECTION 11: HELPER QUERIES (reference, not executed)
-- ============================================================

/*
-- Get full user profile with permissions
SELECT
  u.id, u.email, u.display_name, u.role, u.avatar_url,
  u.two_factor_enabled, u.last_login_at,
  auth_schema.get_user_permissions(u.id) AS permissions,
  ARRAY_AGG(DISTINCT r.name) AS roles
FROM auth_schema.users u
LEFT JOIN auth_schema.user_roles ur ON u.id = ur.user_id
LEFT JOIN auth_schema.roles r       ON ur.role_id = r.id
WHERE u.email = 'user@example.com'
GROUP BY u.id;

-- CRM pipeline board data (Kanban)
SELECT stage, lead_count, total_value, avg_score, overdue_followups
FROM crm_schema.pipeline_summary(NULL);

-- Global search
SELECT * FROM public.global_search('AI chatbot', ARRAY['service','blog'], 10);

-- Revenue trend (last 12 months)
SELECT month, gross_revenue, net_collected, invoices_paid, paying_clients
FROM billing_schema.mv_monthly_revenue
ORDER BY month DESC LIMIT 12;

-- Top blog posts
SELECT title, slug, view_count, read_time_min, daily_avg_views, lead_conversions
FROM blog_schema.v_content_performance
ORDER BY view_count DESC LIMIT 10;

-- Support SLA at-risk tickets
SELECT * FROM support_schema.v_tickets_at_risk LIMIT 20;

-- AI cost by agent this month
SELECT agent_type, SUM(total_tokens), ROUND(SUM(cost_usd),4)
FROM ai_schema.v_usage_report
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
GROUP BY agent_type ORDER BY 3 DESC;
*/


-- ============================================================
--  SECTION 12: PERMISSIONS GRANTS
-- ============================================================

-- Create application role (used by the Node.js backend)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'CHANGE_THIS_PASSWORD_IN_PRODUCTION';
  END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA
  auth_schema, cms_schema, crm_schema, portfolio_schema,
  blog_schema, careers_schema, client_schema, support_schema,
  billing_schema, analytics_schema, marketing_schema,
  ai_schema, system_schema, public
TO app_user;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA auth_schema       TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA cms_schema        TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA crm_schema        TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA portfolio_schema  TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA blog_schema       TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA careers_schema    TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA client_schema     TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA support_schema    TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA billing_schema    TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA analytics_schema  TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA marketing_schema  TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ai_schema         TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA system_schema     TO app_user;

-- Allow delete only on specific tables (hard deletes rare)
GRANT DELETE ON
  auth_schema.sessions,
  auth_schema.password_reset_tokens,
  auth_schema.email_verification_tokens,
  system_schema.rate_limits,
  system_schema.job_queue
TO app_user;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth_schema       TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA cms_schema        TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm_schema        TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA billing_schema    TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA system_schema     TO app_user;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA auth_schema    TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA crm_schema     TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA support_schema TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA billing_schema TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA blog_schema    TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA system_schema  TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA public         TO app_user;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA system_schema  TO app_user;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA crm_schema     TO app_user;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA billing_schema TO app_user;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public         TO app_user;

-- Read-only role for analytics / reporting
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly_user') THEN
    CREATE ROLE readonly_user LOGIN PASSWORD 'CHANGE_THIS_READONLY_PASSWORD';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA
  analytics_schema, billing_schema, crm_schema, blog_schema,
  portfolio_schema, cms_schema, system_schema, careers_schema
TO readonly_user;

GRANT SELECT ON ALL TABLES IN SCHEMA analytics_schema  TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA billing_schema    TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA crm_schema        TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA blog_schema       TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA portfolio_schema  TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA cms_schema        TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA careers_schema    TO readonly_user;


-- ============================================================
--  SECTION 13: FINAL VALIDATION QUERIES
-- ============================================================

/*
-- Count objects created
SELECT 'Tables'      AS object_type, COUNT(*) FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog','information_schema')
UNION ALL
SELECT 'Indexes',    COUNT(*) FROM pg_indexes
  WHERE schemaname NOT IN ('pg_catalog','information_schema')
UNION ALL
SELECT 'Functions',  COUNT(*) FROM information_schema.routines
  WHERE routine_type = 'FUNCTION' AND routine_schema NOT IN ('pg_catalog','information_schema')
UNION ALL
SELECT 'Procedures', COUNT(*) FROM information_schema.routines
  WHERE routine_type = 'PROCEDURE' AND routine_schema NOT IN ('pg_catalog','information_schema')
UNION ALL
SELECT 'Triggers',   COUNT(*) FROM information_schema.triggers
  WHERE trigger_schema NOT IN ('pg_catalog','information_schema')
UNION ALL
SELECT 'Views',      COUNT(*) FROM information_schema.views
  WHERE table_schema NOT IN ('pg_catalog','information_schema');
*/


-- ============================================================
--  END OF PART 2
--
--  Part 1 + Part 2 Combined Summary:
--  ─────────────────────────────────
--  Schemas:              13
--  Tables:               99+
--  Indexes:              140+ (including GIN, GiST, trgm, partial)
--  ENUM Types:           24
--  Functions:            25+
--  Stored Procedures:    12+
--  Triggers:             30+
--  Views:                12
--  Materialized Views:   5
--  RLS Policies:         12
--  Queue System:         1 table + 3 functions
--  Rate Limiting:        1 table + 1 function
--  Notification System:  1 table + 8 seed templates
--  Roles & Permissions:  2 DB roles (app_user, readonly_user)
--  Seed Data:            Roles, Permissions, Service Categories,
--                        Settings, Feature Flags, Notification Templates
-- ============================================================
