-- 20261031_crm_complete_enhancements.sql
-- Complete CRM enhancements: reliable pipeline stages, idempotent lead conversion, and performance indexes

BEGIN;

-- 1. Upgrade crm_schema.pipeline_summary to always return all canonical stages in exact order
CREATE OR REPLACE FUNCTION crm_schema.pipeline_summary(p_assigned_to uuid DEFAULT NULL::uuid)
 RETURNS TABLE(stage lead_stage, count bigint, lead_count bigint, total_value numeric, avg_score numeric, overdue_followups bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH all_stages AS (
    SELECT unnest(enum_range(NULL::lead_stage)) AS stage
  )
  SELECT
    s.stage,
    COUNT(l.id)                                            AS count,
    COUNT(l.id)                                            AS lead_count,
    COALESCE(SUM(COALESCE(l.deal_value, l.expected_value)), 0)::numeric AS total_value,
    COALESCE(ROUND(AVG(l.lead_score), 1), 0)::numeric      AS avg_score,
    COUNT(l.id) FILTER (WHERE l.next_follow_up < NOW() AND l.stage NOT IN ('won', 'lost')) AS overdue_followups
  FROM all_stages s
  LEFT JOIN crm_schema.leads l 
    ON l.stage = s.stage 
   AND l.deleted_at IS NULL 
   AND l.is_archived = FALSE
   AND (p_assigned_to IS NULL OR l.assigned_to = p_assigned_to)
  GROUP BY s.stage
  ORDER BY
    CASE s.stage
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
$function$;

-- 2. Upgrade crm_schema.convert_lead_to_client to be safely idempotent and handle existing users/clients
CREATE OR REPLACE PROCEDURE crm_schema.convert_lead_to_client(
  IN p_lead_id uuid,
  IN p_user_id uuid,
  OUT p_client_id uuid
)
LANGUAGE plpgsql
AS $procedure$
DECLARE
  v_lead       crm_schema.leads%ROWTYPE;
  v_user_id    UUID;
  v_name       VARCHAR(255);
  v_existing_c UUID;
BEGIN
  SELECT * INTO v_lead FROM crm_schema.leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead % not found', p_lead_id;
  END IF;

  v_name := COALESCE(NULLIF(TRIM(v_lead.company), ''), NULLIF(TRIM(v_lead.full_name), ''), 'New Client');

  -- 1. Create or link user account for the lead
  INSERT INTO auth_schema.users
    (email, first_name, last_name, role, is_active, is_verified)
  VALUES
    (v_lead.email, COALESCE(v_lead.first_name, 'Client'), COALESCE(v_lead.last_name, 'Contact'), 'client', TRUE, TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- 2. Check if a client record already exists for this user
  SELECT id INTO v_existing_c FROM client_schema.clients WHERE user_id = v_user_id LIMIT 1;

  IF v_existing_c IS NOT NULL THEN
    p_client_id := v_existing_c;
  ELSE
    -- Check if account exists in CRM accounts
    INSERT INTO crm_schema.accounts (name, website, email, phone, city, country, owner_id, is_client)
    VALUES (v_name, v_lead.website, v_lead.email, v_lead.phone, v_lead.city, v_lead.country, p_user_id, TRUE)
    ON CONFLICT DO NOTHING;

    -- Create new client record
    INSERT INTO client_schema.clients
      (user_id, company_name, name, billing_email, email, phone, website, currency,
       account_manager, status, is_active, onboarded_at, metadata)
    VALUES
      (v_user_id, v_name, v_name, v_lead.email, v_lead.email, v_lead.phone, v_lead.website,
       COALESCE(v_lead.currency, 'USD'), p_user_id, 'active', TRUE, NOW(),
       jsonb_build_object('source_lead_id', p_lead_id, 'converted_by', p_user_id))
    RETURNING id INTO p_client_id;

    -- Create primary contact
    INSERT INTO client_schema.client_contacts
      (client_id, first_name, last_name, email, phone, designation, is_primary)
    VALUES
      (p_client_id, COALESCE(v_lead.first_name, 'Primary'), COALESCE(v_lead.last_name, 'Contact'),
       v_lead.email, v_lead.phone, v_lead.designation, TRUE)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Update lead stage to won and mark conversion details
  UPDATE crm_schema.leads
     SET stage        = 'won',
         won_at       = COALESCE(won_at, NOW()),
         converted_at = COALESCE(converted_at, NOW()),
         deal_value   = COALESCE(deal_value, expected_value, 0),
         updated_at   = NOW()
   WHERE id = p_lead_id;

  -- 4. Copy lead notes into client notes if not already copied
  INSERT INTO client_schema.client_notes (client_id, author_id, content, is_pinned, created_at)
  SELECT p_client_id, author_id, content, is_pinned, created_at
  FROM crm_schema.lead_notes
  WHERE lead_id = p_lead_id
  ON CONFLICT DO NOTHING;

  -- 5. Log CRM activity
  INSERT INTO crm_schema.lead_activities
    (lead_id, actor_id, activity_type, subject, description)
  VALUES
    (p_lead_id, p_user_id, 'stage_change', 'Lead Converted to Client',
     'Lead successfully converted to client: ' || v_name || ' (Client ID: ' || p_client_id::text || ')');
END;
$procedure$;

-- Recreate wrapper function
CREATE OR REPLACE FUNCTION crm_schema.fn_convert_lead_to_client(p_lead_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  CALL crm_schema.convert_lead_to_client(p_lead_id, p_user_id, v_client_id);
  RETURN v_client_id;
END;
$$;

-- 3. Additional performance indexes for CRM queries
CREATE INDEX IF NOT EXISTS idx_leads_open_pipeline ON crm_schema.leads(stage, deleted_at, is_archived) 
  WHERE deleted_at IS NULL AND is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_followups_due ON crm_schema.leads(next_follow_up) 
  WHERE deleted_at IS NULL AND is_archived = FALSE AND stage NOT IN ('won', 'lost');

COMMIT;

