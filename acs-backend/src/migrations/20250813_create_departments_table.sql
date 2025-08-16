-- Migration: Create departments table for organizational structure
-- Created: 2025-08-13
-- Description: Creates departments table with department heads and organizational hierarchy

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    department_head_id UUID,
    parent_department_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments("isActive");
CREATE INDEX IF NOT EXISTS idx_departments_head ON departments("departmentHeadId");
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments("parentDepartmentId");

-- Add foreign key constraints (will be added after users table is updated)
-- ALTER TABLE departments ADD CONSTRAINT fk_departments_head 
--     FOREIGN KEY (department_head_id) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE departments ADD CONSTRAINT fk_departments_parent 
--     FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Insert default departments
INSERT INTO departments (name, description, "isActive") VALUES
('IT', 'Information Technology department responsible for system administration and technical support', true),
('Operations', 'Operations department handling day-to-day business operations and field activities', true),
('Sales', 'Sales department responsible for client acquisition and relationship management', true),
('Customer Service', 'Customer service department handling client support and issue resolution', true),
('Human Resources', 'Human resources department managing employee relations and organizational development', true),
('Finance', 'Finance department handling accounting, budgeting, and financial operations', true),
('Legal', 'Legal department providing legal counsel and compliance oversight', true),
('Marketing', 'Marketing department responsible for brand promotion and market analysis', true)
ON CONFLICT (name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- Add check constraint to prevent self-referencing parent departments (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_departments_no_self_parent'
        AND conrelid = 'departments'::regclass
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT chk_departments_no_self_parent
            CHECK (id != "parentDepartmentId");
    END IF;
END $$;
