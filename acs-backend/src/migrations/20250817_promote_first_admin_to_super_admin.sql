-- Migration: Promote first existing ADMIN user to SUPER_ADMIN if none exists
-- Created: 2025-08-17

-- Preconditions: roles table has SUPER_ADMIN (added by 20250817_add_super_admin_role.sql)
-- Behavior: If there is no user with role 'SUPER_ADMIN', promote the oldest ADMIN to SUPER_ADMIN

DO $$
DECLARE
  super_admin_role_id UUID;
  candidate_user_id UUID;
BEGIN
  -- Find SUPER_ADMIN role id
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;

  IF super_admin_role_id IS NULL THEN
    RAISE NOTICE 'SUPER_ADMIN role not found; skipping promotion';
    RETURN;
  END IF;

  -- Skip if a SUPER_ADMIN user already exists
  IF EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN') THEN
    RAISE NOTICE 'SUPER_ADMIN already exists; skipping promotion';
    RETURN;
  END IF;

  -- Pick oldest ADMIN user by createdAt
  SELECT id INTO candidate_user_id FROM users WHERE role = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1;

  IF candidate_user_id IS NULL THEN
    RAISE NOTICE 'No ADMIN user found to promote';
    RETURN;
  END IF;

  -- Promote to SUPER_ADMIN (update both role string and roleId)
  UPDATE users
  SET role = 'SUPER_ADMIN', "roleId" = super_admin_role_id
  WHERE id = candidate_user_id;

  RAISE NOTICE 'Promoted ADMIN user % to SUPER_ADMIN', candidate_user_id;
END$$;

