-- Migration: Add designation_id to users table
-- Created: 2025-08-14
-- Description: Adds designation_id foreign key column to users table for proper designation management

-- Add designation_id column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'designation_id') THEN
        ALTER TABLE users ADD COLUMN designation_id UUID;
        
        -- Add comment to explain the field purpose
        COMMENT ON COLUMN users.designation_id IS 'Foreign key reference to designations table';
        
        -- Create index for designation_id for performance
        CREATE INDEX IF NOT EXISTS idx_users_designation_id ON users(designation_id);
        
        -- Add foreign key constraint to designations table
        ALTER TABLE users ADD CONSTRAINT fk_users_designation_id 
            FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added designation_id column to users table';
    ELSE
        RAISE NOTICE 'designation_id column already exists in users table';
    END IF;
END $$;

-- Update the user_details view to include designation_id
DROP VIEW IF EXISTS user_details;
CREATE OR REPLACE VIEW user_details AS
SELECT
    u.id,
    u.name,
    u.username,
    u.email,
    u.phone,
    u.is_active,
    u.last_login,
    u.device_id,
    u.designation_id,
    u.created_at,
    u.updated_at,
    r.id as role_id,
    r.name as role_name,
    r.description as role_description,
    r.permissions as role_permissions,
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    dh.name as department_head_name,
    des.id as designation_id_ref,
    des.name as designation_name,
    des.description as designation_description
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users dh ON d.department_head_id = dh.id
LEFT JOIN designations des ON u.designation_id = des.id;

-- Grant necessary permissions
GRANT SELECT ON user_details TO PUBLIC;
