-- Migration: Add device_id field to users table for field agent authentication
-- Created: 2025-08-14
-- Description: Adds device_id UUID field to users table for field agent device authentication

-- Add device_id column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'device_id') THEN
        ALTER TABLE users ADD COLUMN device_id UUID;
        
        -- Add comment to explain the field purpose
        COMMENT ON COLUMN users.device_id IS 'Unique device identifier for field agents mobile device authentication';
        
        -- Create index for device_id for performance
        CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
        
        -- Add unique constraint to ensure one device per user (field agents only)
        -- Note: This allows NULL values, so non-field agents can have NULL device_id
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_device_id_unique 
            ON users(device_id) WHERE device_id IS NOT NULL;
            
        RAISE NOTICE 'Added device_id column to users table';
    ELSE
        RAISE NOTICE 'device_id column already exists in users table';
    END IF;
END $$;

-- Add a check to ensure device_id is only set for field agents
-- First, let's check if we have a role system in place
DO $$
BEGIN
    -- Check if we have role_id column (new system) or role column (legacy)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'role_id') THEN
        -- New role system with role_id foreign key
        -- We'll add the constraint after we identify the FIELD_AGENT role ID
        RAISE NOTICE 'Role system detected with role_id foreign key';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Legacy role system with role string
        -- Add constraint to ensure device_id is only set for FIELD role
        ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_device_id_field_only;
        ALTER TABLE users ADD CONSTRAINT chk_users_device_id_field_only 
            CHECK (
                (device_id IS NULL) OR 
                (device_id IS NOT NULL AND role IN ('FIELD', 'FIELD_AGENT'))
            );
        RAISE NOTICE 'Added constraint to ensure device_id is only for field agents';
    END IF;
END $$;

-- Create a function to validate device_id format (UUID)
CREATE OR REPLACE FUNCTION validate_device_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If device_id is being set, validate it's a proper UUID format
    IF NEW.device_id IS NOT NULL THEN
        -- Check if it's a valid UUID format
        BEGIN
            -- Try to cast to UUID to validate format
            PERFORM NEW.device_id::UUID;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'device_id must be a valid UUID format';
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
    -- Log device_id changes for security auditing
    IF (TG_OP = 'UPDATE' AND OLD.device_id IS DISTINCT FROM NEW.device_id) THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            created_at
        ) VALUES (
            COALESCE(NEW.id, OLD.id),
            'DEVICE_ID_CHANGE',
            'USER',
            COALESCE(NEW.id, OLD.id),
            jsonb_build_object('device_id', OLD.device_id),
            jsonb_build_object('device_id', NEW.device_id),
            CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'INSERT' AND NEW.device_id IS NOT NULL) THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            new_values,
            created_at
        ) VALUES (
            NEW.id,
            'DEVICE_ID_SET',
            'USER',
            NEW.id,
            jsonb_build_object('device_id', NEW.device_id),
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
    u.is_active,
    u.last_login,
    u.device_id,
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

-- Grant necessary permissions
GRANT SELECT ON user_details TO PUBLIC;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added device_id field to users table with proper constraints and audit logging';
END $$;
