-- Migration: Create roles table for role-based access control
-- Created: 2025-08-13
-- Description: Creates roles table with permissions and system roles

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles("isActive");
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles("isSystemRole");
CREATE INDEX IF NOT EXISTS idx_roles_permissions ON roles USING GIN(permissions);

-- Insert default system roles
INSERT INTO roles (name, description, permissions, "isSystemRole", "isActive") VALUES
(
    'ADMIN',
    'System Administrator with full access to all features',
    '{
        "users": {"create": true, "read": true, "update": true, "delete": true},
        "roles": {"create": true, "read": true, "update": true, "delete": true},
        "departments": {"create": true, "read": true, "update": true, "delete": true},
        "locations": {"create": true, "read": true, "update": true, "delete": true},
        "clients": {"create": true, "read": true, "update": true, "delete": true},
        "cases": {"create": true, "read": true, "update": true, "delete": true},
        "reports": {"create": true, "read": true, "update": true, "delete": true},
        "settings": {"create": true, "read": true, "update": true, "delete": true}
    }',
    true,
    true
),
(
    'MANAGER',
    'Manager with team oversight and reporting capabilities',
    '{
        "users": {"create": true, "read": true, "update": true, "delete": false},
        "roles": {"create": false, "read": true, "update": false, "delete": false},
        "departments": {"create": false, "read": true, "update": false, "delete": false},
        "locations": {"create": true, "read": true, "update": true, "delete": false},
        "clients": {"create": true, "read": true, "update": true, "delete": false},
        "cases": {"create": true, "read": true, "update": true, "delete": false},
        "reports": {"create": true, "read": true, "update": true, "delete": false},
        "settings": {"create": false, "read": true, "update": false, "delete": false}
    }',
    true,
    true
),
(
    'FIELD_AGENT',
    'Field agent with case management and client interaction capabilities',
    '{
        "users": {"create": false, "read": true, "update": false, "delete": false},
        "roles": {"create": false, "read": false, "update": false, "delete": false},
        "departments": {"create": false, "read": true, "update": false, "delete": false},
        "locations": {"create": false, "read": true, "update": false, "delete": false},
        "clients": {"create": true, "read": true, "update": true, "delete": false},
        "cases": {"create": true, "read": true, "update": true, "delete": false},
        "reports": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"create": false, "read": false, "update": false, "delete": false}
    }',
    true,
    true
),
(
    'VIEWER',
    'Read-only access to reports and data',
    '{
        "users": {"create": false, "read": true, "update": false, "delete": false},
        "roles": {"create": false, "read": false, "update": false, "delete": false},
        "departments": {"create": false, "read": true, "update": false, "delete": false},
        "locations": {"create": false, "read": true, "update": false, "delete": false},
        "clients": {"create": false, "read": true, "update": false, "delete": false},
        "cases": {"create": false, "read": true, "update": false, "delete": false},
        "reports": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"create": false, "read": false, "update": false, "delete": false}
    }',
    true,
    true
)
ON CONFLICT (name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();
