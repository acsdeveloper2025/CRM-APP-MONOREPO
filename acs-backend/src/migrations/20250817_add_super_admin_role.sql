-- Migration: Add SUPER_ADMIN role
-- Created: 2025-08-17

-- Insert SUPER_ADMIN role if missing
INSERT INTO roles (name, description, permissions, "isSystemRole", "isActive")
SELECT 'SUPER_ADMIN', 'Emergency access with bypass of device/MAC checks', '{}', true, true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');

