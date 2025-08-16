-- Migration: Update users table for role and department management
-- Created: 2025-08-13
-- Description: Updates users table to use proper foreign keys for roles and departments

-- First, let's check if we need to add the roleId and departmentId columns
-- Add roleId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'roleId') THEN
        ALTER TABLE users ADD COLUMN "roleId" UUID;
    END IF;
END $$;

-- Add departmentId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'departmentId') THEN
        ALTER TABLE users ADD COLUMN "departmentId" UUID;
    END IF;
END $$;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users("roleId");
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users("departmentId");

-- Update existing users to have proper role references
-- First, let's map existing role strings to role IDs
UPDATE users SET "roleId" = (
    SELECT id FROM roles WHERE name = users.role
) WHERE "roleId" IS NULL AND role IS NOT NULL;

-- Update existing users to have department references
-- Map existing department strings to department IDs
UPDATE users SET "departmentId" = (
    SELECT id FROM departments WHERE name = users.department
) WHERE "departmentId" IS NULL AND department IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE users ADD CONSTRAINT fk_users_role
    FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE SET NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_department;
ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL;

-- Now add the foreign key constraint for department heads
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_head;
ALTER TABLE departments ADD CONSTRAINT fk_departments_head
    FOREIGN KEY ("departmentHeadId") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_parent;
ALTER TABLE departments ADD CONSTRAINT fk_departments_parent
    FOREIGN KEY ("parentDepartmentId") REFERENCES departments(id) ON DELETE SET NULL;

-- Add constraints for createdBy and updatedBy in roles and departments
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_created_by;
ALTER TABLE roles ADD CONSTRAINT fk_roles_created_by
    FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_updated_by;
ALTER TABLE roles ADD CONSTRAINT fk_roles_updated_by
    FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_created_by;
ALTER TABLE departments ADD CONSTRAINT fk_departments_created_by
    FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_updated_by;
ALTER TABLE departments ADD CONSTRAINT fk_departments_updated_by
    FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL;

-- Create a view for user details with role and department information
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u.phone,
    u."isActive",
    u."lastLogin",
    u."createdAt",
    u."updatedAt",
    r.id as role_id,
    r.name as role_name,
    r.description as role_description,
    r.permissions as role_permissions,
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    dh.name as department_head_name
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN departments d ON u."departmentId" = d.id
LEFT JOIN users dh ON d."departmentHeadId" = dh.id;
