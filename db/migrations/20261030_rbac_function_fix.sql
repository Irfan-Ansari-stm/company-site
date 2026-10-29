-- db/migrations/20261030_rbac_function_fix.sql
-- Ensure auth_schema.user_has_permission respects role is_active = TRUE

CREATE OR REPLACE FUNCTION auth_schema.user_has_permission(
  p_user_id    UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin has universal bypass
  IF EXISTS (
    SELECT 1 FROM auth_schema.users
     WHERE id = p_user_id AND role = 'super_admin' AND is_active = TRUE AND deleted_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM auth_schema.user_roles ur
      JOIN auth_schema.roles r             ON ur.role_id = r.id
      JOIN auth_schema.role_permissions rp ON ur.role_id = rp.role_id
      JOIN auth_schema.permissions p       ON rp.permission_id = p.id
     WHERE ur.user_id = p_user_id
       AND r.is_active = TRUE
       AND p.slug = p_permission
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE;

