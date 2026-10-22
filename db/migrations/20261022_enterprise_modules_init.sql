-- db/migrations/20261022_enterprise_modules_init.sql
-- Enterprise Modules: Finance, Support, HR, Blog, CMS, Portfolio, Services, Marketing

-- ════════════════════════════════════════════════════════════
--  1. FINANCE MODULE
-- ════════════════════════════════════════════════════════════

ALTER TABLE billing_schema.invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE blog_schema.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE blog_schema.resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Recreate finance_schema.invoices & summary view with deleted_at support
DROP VIEW IF EXISTS finance_schema.v_invoice_summary CASCADE;
DROP VIEW IF EXISTS finance_schema.invoices CASCADE;

CREATE OR REPLACE VIEW finance_schema.invoices AS
  SELECT
    id, invoice_number, client_id, project_id, proposal_id, milestone_id,
    status, issue_date, due_date, line_items, subtotal, discount_amount,
    tax_amount, total_amount, amount_paid, amount_due, currency, tax_rate_id,
    notes, terms, footer, pdf_url, sent_at, viewed_at, paid_at, overdue_at,
    reminder_sent_at, created_by, metadata, created_at, updated_at, deleted_at
  FROM billing_schema.invoices;

CREATE OR REPLACE VIEW finance_schema.v_invoice_summary AS
  SELECT
    COUNT(*)::bigint AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid')::bigint AS paid_count,
    COUNT(*) FILTER (WHERE status = 'sent')::bigint AS pending_count,
    COUNT(*) FILTER (WHERE status = 'overdue')::bigint AS overdue_count,
    COALESCE(SUM(total_amount), 0)::numeric AS total_value,
    COALESCE(SUM(amount_paid), 0)::numeric AS total_collected
  FROM billing_schema.invoices
  WHERE deleted_at IS NULL;

-- Payments view in finance_schema
DROP VIEW IF EXISTS finance_schema.payments CASCADE;
CREATE OR REPLACE VIEW finance_schema.payments AS
  SELECT
    id, invoice_id, client_id, amount, currency, method, status,
    gateway_provider, gateway_txn_id, gateway_ref, gateway_response,
    failure_reason, refund_amount, refunded_at,
    paid_at AS payment_date, notes, metadata, created_at
  FROM billing_schema.payments;

-- Expenses table
CREATE TABLE IF NOT EXISTS finance_schema.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  submitted_by UUID REFERENCES auth_schema.users(id),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_billable BOOLEAN DEFAULT FALSE,
  vendor VARCHAR(255),
  receipt_media_id UUID,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'approved',
  approved_by UUID REFERENCES auth_schema.users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS finance_schema.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  interval VARCHAR(20) DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  trial_days INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS finance_schema.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_schema.clients(id),
  plan_id UUID REFERENCES finance_schema.subscription_plans(id),
  user_id UUID REFERENCES auth_schema.users(id),
  amount NUMERIC(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  interval VARCHAR(20) DEFAULT 'monthly',
  current_period_start DATE DEFAULT CURRENT_DATE,
  current_period_end DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  trial_end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  pause_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS finance_schema.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_schema.clients(id),
  created_by UUID REFERENCES auth_schema.users(id),
  title VARCHAR(255),
  notes TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'draft',
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
--  2. SUPPORT MODULE
-- ════════════════════════════════════════════════════════════

ALTER TABLE support_schema.tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS reporter_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cc_emails TEXT[],
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS sla_paused BOOLEAN DEFAULT FALSE;

ALTER TABLE support_schema.ticket_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

DROP VIEW IF EXISTS support_schema.ticket_replies CASCADE;
CREATE OR REPLACE VIEW support_schema.ticket_replies AS
  SELECT
    id,
    ticket_id,
    author_id,
    content,
    is_internal,
    attachments,
    deleted_at,
    is_edited,
    created_at
  FROM support_schema.ticket_messages;

CREATE TABLE IF NOT EXISTS support_schema.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_schema.tickets(id) ON DELETE CASCADE,
  media_id UUID,
  file_name VARCHAR(255),
  file_url TEXT,
  file_size INT,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_schema.ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_schema.tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
--  3. HR & RECRUITMENT MODULE
-- ════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS hr_schema;

DROP VIEW IF EXISTS hr_schema.departments CASCADE;
CREATE OR REPLACE VIEW hr_schema.departments AS
  SELECT * FROM careers_schema.departments;

DROP VIEW IF EXISTS hr_schema.job_openings CASCADE;
CREATE OR REPLACE VIEW hr_schema.job_openings AS
  SELECT
    id, department_id, title, slug, description, responsibilities,
    requirements, nice_to_have, benefits, job_type AS employment_type,
    location, is_remote, is_hybrid,
    CASE WHEN is_remote THEN 'remote' WHEN is_hybrid THEN 'hybrid' ELSE 'on_site' END AS location_type,
    salary_min, salary_max, currency, experience_years AS experience_min,
    experience_years AS experience_max, openings AS positions,
    applications_count AS applicant_count, is_published AS is_active,
    is_urgent AS is_featured, apply_by AS closes_at,
    published_at, closed_at, seo_id, created_by, created_at, updated_at, deleted_at,
    0::bigint AS view_count
  FROM careers_schema.jobs;

CREATE TABLE IF NOT EXISTS careers_schema.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES careers_schema.applications(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP VIEW IF EXISTS hr_schema.applications CASCADE;
CREATE OR REPLACE VIEW hr_schema.applications AS
  SELECT
    a.id, a.job_id, a.candidate_id, a.stage::text AS stage,
    a.cover_letter, a.resume_url, a.portfolio_url,
    a.expected_salary, a.currency, a.available_from,
    a.rating, a.rejection_reason, a.offer_details,
    a.assigned_to, a.applied_at, a.updated_at,
    NULL::timestamptz AS hired_at,
    c.first_name, c.last_name, c.email, c.phone,
    c.current_title AS current_company,
    c.years_exp AS experience_years,
    c.linkedin_url, c.source,
    NULL::uuid AS resume_media_id
  FROM careers_schema.applications a
  LEFT JOIN careers_schema.candidates c ON a.candidate_id = c.id;

DROP VIEW IF EXISTS hr_schema.interviews CASCADE;
CREATE OR REPLACE VIEW hr_schema.interviews AS
  SELECT * FROM careers_schema.interviews;

DROP VIEW IF EXISTS hr_schema.team_members CASCADE;
CREATE OR REPLACE VIEW hr_schema.team_members AS
  SELECT
    id, user_id, department AS department_id, designation, bio,
    expertise, '{}'::text[] AS certifications, social_links,
    is_featured, display_order AS sort_order, is_active,
    created_at, updated_at
  FROM system_schema.team_members;

-- ════════════════════════════════════════════════════════════
--  4. MARKETING MODULE
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS marketing_schema.mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_double_optin BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_schema.list_subscribers (
  list_id UUID NOT NULL REFERENCES marketing_schema.mailing_lists(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES marketing_schema.subscribers(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, subscriber_id)
);

ALTER TABLE marketing_schema.subscribers
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS open_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS marketing_schema.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'regular',
  subject VARCHAR(255) NOT NULL,
  preview_text TEXT,
  from_name VARCHAR(100),
  from_email VARCHAR(255),
  reply_to VARCHAR(255),
  template_id UUID,
  html_content TEXT,
  text_content TEXT,
  list_ids UUID[],
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  bounce_count INT DEFAULT 0,
  unsubscribe_count INT DEFAULT 0,
  created_by UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_schema.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_schema.campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES marketing_schema.subscribers(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

DROP VIEW IF EXISTS marketing_schema.v_campaign_stats CASCADE;
CREATE OR REPLACE VIEW marketing_schema.v_campaign_stats AS
  SELECT
    c.id AS campaign_id,
    c.recipient_count,
    c.open_count,
    c.click_count,
    c.bounce_count,
    c.unsubscribe_count,
    CASE WHEN c.recipient_count > 0 THEN ROUND((c.open_count::numeric / c.recipient_count * 100), 2) ELSE 0 END AS open_rate,
    CASE WHEN c.recipient_count > 0 THEN ROUND((c.click_count::numeric / c.recipient_count * 100), 2) ELSE 0 END AS click_rate
  FROM marketing_schema.campaigns c;

DROP VIEW IF EXISTS marketing_schema.coupons CASCADE;
CREATE OR REPLACE VIEW marketing_schema.coupons AS
  SELECT
    id,
    code,
    description,
    discount_type,
    discount_value,
    min_amount AS min_order_amount,
    NULL::numeric AS max_discount_amount,
    max_uses,
    used_count AS uses_count,
    valid_until AS expires_at,
    '{}'::jsonb AS applicable_to,
    NULL::uuid AS created_by,
    is_active,
    created_at
  FROM billing_schema.coupons;
