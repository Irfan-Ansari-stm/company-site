-- ============================================================
-- SEED DATA: Super Admin, Content Manager, Client Credentials
-- Location: db/seed_demo_users.sql
-- ============================================================

-- 1. Sole Super Admin (Email: superadmin@company.com / Pass: SuperAdmin123!)
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = 'super_admin';
  SELECT id INTO v_user_id FROM auth_schema.users WHERE email = 'superadmin@company.com';

  IF v_user_id IS NOT NULL THEN
    UPDATE auth_schema.users
       SET password_hash = '$2a$12$op9VX1kKfAWdqtY/Rloheugv5hbCj7wcLEKpRsG.dq5coRMyeLDES',
           first_name = 'Super',
           last_name = 'Admin',
           role = 'super_admin',
           is_active = TRUE,
           is_verified = TRUE,
           failed_login_attempts = 0,
           locked_until = NULL
     WHERE id = v_user_id;
  ELSE
    INSERT INTO auth_schema.users (
      email, password_hash, first_name, last_name, role, is_active, is_verified, public_id
    ) VALUES (
      'superadmin@company.com', '$2a$12$WzqJQiqK.8cQa0Ht7xg2yubMPmtCf6mqeAVp7mhFb1Wv4.ag2hrVq', 'Super', 'Admin', 'super_admin', TRUE, TRUE, substr(md5(random()::text), 1, 16)
    ) RETURNING id INTO v_user_id;
  END IF;

  IF v_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO auth_schema.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- 2. Content Manager (Email: content@company.com / Pass: Content123!)
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = 'editor';
  SELECT id INTO v_user_id FROM auth_schema.users WHERE email = 'content@company.com';

  IF v_user_id IS NOT NULL THEN
    UPDATE auth_schema.users
       SET password_hash = '$2a$12$JeApfmWZ8MI9BCRcm0MK2uTDskAmEAGVGvh0qmrMdqPIVpJvYuGiO',
           first_name = 'Sarah',
           last_name = 'ContentManager',
           role = 'editor',
           is_active = TRUE,
           is_verified = TRUE,
           failed_login_attempts = 0,
           locked_until = NULL
     WHERE id = v_user_id;
  ELSE
    INSERT INTO auth_schema.users (
      email, password_hash, first_name, last_name, role, is_active, is_verified, public_id
    ) VALUES (
      'content@company.com', '$2a$12$k0SkcQwm2oF2EEpnNGaGiOT.GZw3ScSp5b57jdzzdRipJ07jdJAtC', 'Sarah', 'ContentManager', 'editor', TRUE, TRUE, substr(md5(random()::text), 1, 16)
    ) RETURNING id INTO v_user_id;
  END IF;

  IF v_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO auth_schema.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- 3. Client User (Email: client@company.com / Pass: Client123!)
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = 'client';
  SELECT id INTO v_user_id FROM auth_schema.users WHERE email = 'client@company.com';

  IF v_user_id IS NOT NULL THEN
    UPDATE auth_schema.users
       SET password_hash = '$2a$12$L72wBVgS.hWRCQdKxXCSVeHCSUvG17B0mvUkaVaL4EAB0nFm8Lreu',
           first_name = 'Alex',
           last_name = 'Client',
           role = 'client',
           is_active = TRUE,
           is_verified = TRUE,
           failed_login_attempts = 0,
           locked_until = NULL
     WHERE id = v_user_id;
  ELSE
    INSERT INTO auth_schema.users (
      email, password_hash, first_name, last_name, role, is_active, is_verified, public_id
    ) VALUES (
      'client@company.com', '$2a$12$Yli2kj8C61jXsAYDjYZ6BufAEgHTEIDlUttQv7UBc2hylE3vA0qMC', 'Alex', 'Client', 'client', TRUE, TRUE, substr(md5(random()::text), 1, 16)
    ) RETURNING id INTO v_user_id;
  END IF;

  IF v_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO auth_schema.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- Ensure Role Permissions
DO $$
DECLARE
  v_editor_id UUID;
  v_client_id UUID;
BEGIN
  SELECT id INTO v_editor_id FROM auth_schema.roles WHERE slug = 'editor';
  SELECT id INTO v_client_id  FROM auth_schema.roles WHERE slug = 'client';

  IF v_editor_id IS NOT NULL THEN
    INSERT INTO auth_schema.role_permissions (role_id, permission_id)
    SELECT v_editor_id, p.id FROM auth_schema.permissions p
     WHERE p.module IN ('cms', 'blog', 'portfolio', 'services')
        OR p.slug IN ('dashboard.view', 'dashboard.stats.view', 'media.manage')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  IF v_client_id IS NOT NULL THEN
    INSERT INTO auth_schema.role_permissions (role_id, permission_id)
    SELECT v_client_id, p.id FROM auth_schema.permissions p
     WHERE p.slug IN ('dashboard.view', 'dashboard.stats.view', 'client.read', 'ticket.read', 'ticket.reply', 'invoice.read', 'project.read')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;
