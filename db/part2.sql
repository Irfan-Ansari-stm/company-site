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
  SELECT COALESCE((value->>'billing.invoice_prefix')::text, 'INV')
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
    COALESCE((NEW).id, (OLD).id),
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
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_company_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY cms_schema.mv_service_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY billing_schema.mv_monthly_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY blog_schema.mv_tag_cloud;
  REFRESH MATERIALIZED VIEW CONCURRENTLY crm_schema.mv_lead_source_stats;
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
