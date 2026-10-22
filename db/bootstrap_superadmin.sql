-- ============================================================
-- BOOTSTRAP SCRIPT: Initial Designated Super Admin Setup
-- Location: db/bootstrap_superadmin.sql
-- ============================================================

-- Ensure the 'super_admin' role exists in auth_schema.roles
INSERT INTO auth_schema.roles (name, slug, description, is_system, is_active)
VALUES ('Super Admin', 'super_admin', 'Full unrestricted platform access (Sole Super Admin)', TRUE, TRUE)
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE;

-- Promote or create initial Super Admin account
-- Defaults to admin@company.com if present; otherwise creates a designated super admin
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_existing_super_count INT;
BEGIN
  SELECT id INTO v_role_id FROM auth_schema.roles WHERE slug = 'super_admin';

  -- Check if a super admin already exists
  SELECT COUNT(*) INTO v_existing_super_count
    FROM auth_schema.users
   WHERE role = 'super_admin' AND is_active = TRUE AND deleted_at IS NULL;

  IF v_existing_super_count = 0 THEN
    -- If admin@company.com exists, promote them to super_admin
    SELECT id INTO v_user_id FROM auth_schema.users WHERE email = 'admin@company.com';

    IF v_user_id IS NOT NULL THEN
      UPDATE auth_schema.users
         SET role = 'super_admin',
             is_active = TRUE,
             is_verified = TRUE
       WHERE id = v_user_id;

      INSERT INTO auth_schema.user_roles (user_id, role_id)
      VALUES (v_user_id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;

      RAISE NOTICE 'Promoted admin@company.com to designated sole Super Admin';
    ELSE
      -- Insert new super_admin account (password: SuperAdmin123! - bcrypt hash)
      INSERT INTO auth_schema.users (
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        is_verified,
        public_id
      ) VALUES (
        'admin@company.com',
        '$2a$12$K.F1o5O1r1P0j/f0kI0t4uCjM9zS9w7nZ0eF9nF4z5a5u5v6w7x8y', -- placeholder hash; update via bootstrap script or login
        'Super',
        'Admin',
        'super_admin',
        TRUE,
        TRUE,
        substr(md5(random()::text), 1, 16)
      ) RETURNING id INTO v_user_id;

      INSERT INTO auth_schema.user_roles (user_id, role_id)
      VALUES (v_user_id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;

      RAISE NOTICE 'Created designated sole Super Admin account: admin@company.com';
    END IF;
  ELSE
    RAISE NOTICE 'An active Super Admin already exists (% accounts)', v_existing_super_count;
  END IF;
END $$;

