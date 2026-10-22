-- 20261022_crm_clients_init.sql
-- Migration for Sales & CRM + Clients module integration

BEGIN;

-- 1. Extend client_schema.clients with missing columns for directory & lifecycle
ALTER TABLE client_schema.clients
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill name & email from company_name & billing_email
UPDATE client_schema.clients
   SET name = COALESCE(name, company_name),
       email = COALESCE(email, billing_email),
       status = CASE
         WHEN churned_at IS NOT NULL THEN 'churned'
         WHEN is_active IS FALSE THEN 'inactive'
         ELSE 'active'
       END
 WHERE name IS NULL OR email IS NULL;

-- 2. Ensure client_schema.client_contacts exists
CREATE TABLE IF NOT EXISTS client_schema.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_schema.clients(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  designation VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_schema.client_contacts(client_id);

-- 3. Ensure client_schema.client_notes exists
CREATE TABLE IF NOT EXISTS client_schema.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_schema.clients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_schema.client_notes(client_id);

-- 4. Ensure client_schema.client_portal_grants table exists for custom permissions
CREATE TABLE IF NOT EXISTS client_schema.client_portal_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_schema.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_schema.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}'::jsonb,
  granted_by UUID REFERENCES auth_schema.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT client_portal_grants_client_user_key UNIQUE (client_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_client_portal_grants_client_id ON client_schema.client_portal_grants(client_id);

-- 5. Stored Procedure & Function for Lead Conversion
CREATE OR REPLACE PROCEDURE crm_schema.convert_lead_to_client(
  IN p_lead_id uuid,
  IN p_user_id uuid,
  OUT p_client_id uuid
)
LANGUAGE plpgsql
AS $procedure$
DECLARE
  v_lead    crm_schema.leads%ROWTYPE;
  v_user_id UUID;
  v_name    VARCHAR(255);
BEGIN
  SELECT * INTO v_lead FROM crm_schema.leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead % not found', p_lead_id;
  END IF;

  v_name := COALESCE(NULLIF(TRIM(v_lead.company), ''), NULLIF(TRIM(v_lead.full_name), ''), 'New Client');

  -- Create or link user account for the lead
  INSERT INTO auth_schema.users
    (email, first_name, last_name, role, is_active, is_verified)
  VALUES
    (v_lead.email, COALESCE(v_lead.first_name, 'Client'), COALESCE(v_lead.last_name, 'Contact'), 'client', TRUE, TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- Create account in CRM accounts if not exists
  INSERT INTO crm_schema.accounts (name, website, email, phone, city, country, owner_id, is_client)
  VALUES (v_name, v_lead.website, v_lead.email, v_lead.phone, v_lead.city, v_lead.country, p_user_id, TRUE)
  ON CONFLICT DO NOTHING;

  -- Create client record
  INSERT INTO client_schema.clients
    (user_id, company_name, name, billing_email, email, phone, website, currency,
     account_manager, status, is_active, onboarded_at, metadata)
  VALUES
    (v_user_id, v_name, v_name, v_lead.email, v_lead.email, v_lead.phone, v_lead.website,
     COALESCE(v_lead.currency, 'USD'), p_user_id, 'active', TRUE, NOW(),
     jsonb_build_object('source_lead_id', p_lead_id, 'converted_by', p_user_id))
  RETURNING id INTO p_client_id;

  -- Create primary contact from lead details
  INSERT INTO client_schema.client_contacts
    (client_id, first_name, last_name, email, phone, designation, is_primary)
  VALUES
    (p_client_id, COALESCE(v_lead.first_name, 'Primary'), COALESCE(v_lead.last_name, 'Contact'),
     v_lead.email, v_lead.phone, v_lead.designation, TRUE);

  -- Update lead stage to won
  UPDATE crm_schema.leads
     SET stage        = 'won',
         won_at       = NOW(),
         converted_at = NOW(),
         deal_value   = COALESCE(deal_value, expected_value, 0),
         updated_at   = NOW()
   WHERE id = p_lead_id;

  -- Copy lead notes into client notes
  INSERT INTO client_schema.client_notes (client_id, author_id, content, is_pinned, created_at)
  SELECT p_client_id, author_id, content, is_pinned, created_at
  FROM crm_schema.lead_notes
  WHERE lead_id = p_lead_id;

  -- Log CRM activity
  INSERT INTO crm_schema.lead_activities
    (lead_id, actor_id, activity_type, subject, description)
  VALUES
    (p_lead_id, p_user_id, 'stage_change', 'Lead Converted to Client',
     'Lead successfully converted to client: ' || v_name || ' (Client ID: ' || p_client_id::text || ')');
END;
$procedure$;

-- Convenient function wrapper for convert_lead_to_client
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

-- 6. Update pipeline_summary function to return both count and lead_count
DROP FUNCTION IF EXISTS crm_schema.pipeline_summary(uuid);
CREATE OR REPLACE FUNCTION crm_schema.pipeline_summary(p_assigned_to uuid DEFAULT NULL::uuid)
 RETURNS TABLE(stage lead_stage, count bigint, lead_count bigint, total_value numeric, avg_score numeric, overdue_followups bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    l.stage,
    COUNT(*)                                               AS count,
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
$function$;

COMMIT;
