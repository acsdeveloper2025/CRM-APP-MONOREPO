-- Migration: Add designation_id to users table
-- Created: 2025-08-14
-- Description: Adds designation_id foreign key column to users table for proper designation management

-- Add designation_id column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'designationId') THEN
        ALTER TABLE users ADD COLUMN "designationId" UUID;

        -- Add comment to explain the field purpose
        COMMENT ON COLUMN users."designationId" IS 'Foreign key reference to designations table';

        -- Create index for designationId for performance
        CREATE INDEX IF NOT EXISTS idx_users_designation_id ON users("designationId");

        -- Add foreign key constraint to designations table (drop existing first)
        ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_designation_id;
        ALTER TABLE users ADD CONSTRAINT fk_users_designation_id
            FOREIGN KEY ("designationId") REFERENCES designations(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added designationId column to users table';
    ELSE
        RAISE NOTICE 'designationId column already exists in users table';
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
    u."isActive",
    u."lastLogin",
    u."deviceId",
    u."designationId",
    u."createdAt",
    u."updatedAt",
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
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN departments d ON u."departmentId" = d.id
LEFT JOIN users dh ON d."departmentHeadId" = dh.id
LEFT JOIN designations des ON u."designationId" = des.id;

-- Grant necessary permissions
GRANT SELECT ON user_details TO PUBLIC;
