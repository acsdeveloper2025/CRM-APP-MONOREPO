-- Migration: Update users table for role and department management
-- Created: 2025-08-13
-- Description: Updates users table to use proper foreign keys for roles and departments

-- First, let's check if we need to add the role_id and department_id columns
-- Add role_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role_id') THEN
        ALTER TABLE users ADD COLUMN role_id UUID;
    END IF;
END $$;

-- Add department_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'department_id') THEN
        ALTER TABLE users ADD COLUMN department_id UUID;
    END IF;
END $$;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Update existing users to have proper role references
-- First, let's map existing role strings to role IDs
UPDATE users SET role_id = (
    SELECT id FROM roles WHERE name = users.role
) WHERE role_id IS NULL AND role IS NOT NULL;

-- Update existing users to have department references
-- Map existing department strings to department IDs
UPDATE users SET department_id = (
    SELECT id FROM departments WHERE name = users.department
) WHERE department_id IS NULL AND department IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE users ADD CONSTRAINT fk_users_role 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_department;
ALTER TABLE users ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Now add the foreign key constraint for department heads
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_head;
ALTER TABLE departments ADD CONSTRAINT fk_departments_head 
    FOREIGN KEY (department_head_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_parent;
ALTER TABLE departments ADD CONSTRAINT fk_departments_parent 
    FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add constraints for created_by and updated_by in roles and departments
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_created_by;
ALTER TABLE roles ADD CONSTRAINT fk_roles_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_updated_by;
ALTER TABLE roles ADD CONSTRAINT fk_roles_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_created_by;
ALTER TABLE departments ADD CONSTRAINT fk_departments_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_updated_by;
ALTER TABLE departments ADD CONSTRAINT fk_departments_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create a view for user details with role and department information
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u.phone,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    r.id as role_id,
    r.name as role_name,
    r.description as role_description,
    r.permissions as role_permissions,
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    dh.name as department_head_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users dh ON d.department_head_id = dh.id;
