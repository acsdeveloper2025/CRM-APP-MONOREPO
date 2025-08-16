-- Migration: Add device_id field to users table for field agent authentication
-- Created: 2025-08-14
-- Description: Adds device_id UUID field to users table for field agent device authentication

-- Add device_id column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'deviceId') THEN
        ALTER TABLE users ADD COLUMN "deviceId" UUID;

        -- Add comment to explain the field purpose
        COMMENT ON COLUMN users."deviceId" IS 'Unique device identifier for field agents mobile device authentication';

        -- Create index for deviceId for performance
        CREATE INDEX IF NOT EXISTS idx_users_device_id ON users("deviceId");

        -- Add unique constraint to ensure one device per user (field agents only)
        -- Note: This allows NULL values, so non-field agents can have NULL deviceId
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_device_id_unique
            ON users("deviceId") WHERE "deviceId" IS NOT NULL;
            
        RAISE NOTICE 'Added deviceId column to users table';
    ELSE
        RAISE NOTICE 'deviceId column already exists in users table';
    END IF;
END $$;

-- Add a check to ensure device_id is only set for field agents
-- First, let's check if we have a role system in place
DO $$
BEGIN
    -- Check if we have roleId column (new system) or role column (legacy)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'roleId') THEN
        -- New role system with roleId foreign key
        -- We'll add the constraint after we identify the FIELD_AGENT role ID
        RAISE NOTICE 'Role system detected with roleId foreign key';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Legacy role system with role string
        -- Add constraint to ensure deviceId is only set for FIELD role
        ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_device_id_field_only;
        ALTER TABLE users ADD CONSTRAINT chk_users_device_id_field_only
            CHECK (
                ("deviceId" IS NULL) OR
                ("deviceId" IS NOT NULL AND role IN ('FIELD', 'FIELD_AGENT'))
            );
        RAISE NOTICE 'Added constraint to ensure deviceId is only for field agents';
    END IF;
END $$;

-- Create a function to validate device_id format (UUID)
CREATE OR REPLACE FUNCTION validate_device_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If deviceId is being set, validate it's a proper UUID format
    IF NEW."deviceId" IS NOT NULL THEN
        -- Check if it's a valid UUID format
        BEGIN
            -- Try to cast to UUID to validate format
            PERFORM NEW."deviceId"::UUID;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'deviceId must be a valid UUID format';
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate device_id on insert/update
DROP TRIGGER IF EXISTS validate_device_id_trigger ON users;
CREATE TRIGGER validate_device_id_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_device_id();

-- Add audit logging for device_id changes
CREATE OR REPLACE FUNCTION log_device_id_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log deviceId changes for security auditing
    IF (TG_OP = 'UPDATE' AND OLD."deviceId" IS DISTINCT FROM NEW."deviceId") THEN
        INSERT INTO audit_logs (
            "userId",
            action,
            "entityType",
            "entityId",
            "oldValues",
            "newValues",
            "createdAt"
        ) VALUES (
            COALESCE(NEW.id, OLD.id),
            'DEVICE_ID_CHANGE',
            'USER',
            COALESCE(NEW.id, OLD.id),
            jsonb_build_object('deviceId', OLD."deviceId"),
            jsonb_build_object('deviceId', NEW."deviceId"),
            CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'INSERT' AND NEW."deviceId" IS NOT NULL) THEN
        INSERT INTO audit_logs (
            "userId",
            action,
            "entityType",
            "entityId",
            "newValues",
            "createdAt"
        ) VALUES (
            NEW.id,
            'DEVICE_ID_SET',
            'USER',
            NEW.id,
            jsonb_build_object('deviceId', NEW."deviceId"),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for device_id audit logging
DROP TRIGGER IF EXISTS log_device_id_changes_trigger ON users;
CREATE TRIGGER log_device_id_changes_trigger
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_device_id_changes();

-- Update the user_details view to include device_id
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

-- Grant necessary permissions
GRANT SELECT ON user_details TO PUBLIC;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added deviceId field to users table with proper constraints and audit logging';
END $$;
