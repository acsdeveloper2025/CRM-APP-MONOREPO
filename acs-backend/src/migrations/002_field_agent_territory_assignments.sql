-- Migration: Field Agent Territory Assignments
-- Description: Creates tables for multi-pincode and area assignment system for field agents
-- Created: 2025-08-18
-- Purpose: Enable geographical territory assignments with hierarchical pincode-area relationships

-- Create updated_at trigger function if it doesn't exist (reuse from previous migration)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create userPincodeAssignments table for field agent pincode assignments
CREATE TABLE IF NOT EXISTS "userPincodeAssignments" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "pincodeId" INTEGER NOT NULL,
    "assignedBy" UUID NOT NULL,
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_user_pincode_assignments_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_pincode_assignments_pincode" 
        FOREIGN KEY ("pincodeId") REFERENCES pincodes(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_pincode_assignments_assigned_by" 
        FOREIGN KEY ("assignedBy") REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Unique constraint to prevent duplicate active assignments
    CONSTRAINT "uk_user_pincode_assignments_user_pincode_active" 
        UNIQUE ("userId", "pincodeId", "isActive") DEFERRABLE INITIALLY DEFERRED
);

-- Create userAreaAssignments table for field agent area assignments within pincodes
CREATE TABLE IF NOT EXISTS "userAreaAssignments" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "pincodeId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "userPincodeAssignmentId" INTEGER NOT NULL,
    "assignedBy" UUID NOT NULL,
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_user_area_assignments_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_area_assignments_pincode" 
        FOREIGN KEY ("pincodeId") REFERENCES pincodes(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_area_assignments_area" 
        FOREIGN KEY ("areaId") REFERENCES areas(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_area_assignments_user_pincode" 
        FOREIGN KEY ("userPincodeAssignmentId") REFERENCES "userPincodeAssignments"(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_area_assignments_assigned_by" 
        FOREIGN KEY ("assignedBy") REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Note: We'll validate pincode-area relationship in application logic instead of FK constraint
    -- since pincodeAreas table doesn't have a composite unique constraint
    
    -- Unique constraint to prevent duplicate active assignments
    CONSTRAINT "uk_user_area_assignments_user_pincode_area_active" 
        UNIQUE ("userId", "pincodeId", "areaId", "isActive") DEFERRABLE INITIALLY DEFERRED
);

-- Create territoryAssignmentAudit table for tracking assignment changes
CREATE TABLE IF NOT EXISTS "territoryAssignmentAudit" (
    id BIGSERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "assignmentType" VARCHAR(20) NOT NULL CHECK ("assignmentType" IN ('PINCODE', 'AREA')),
    "assignmentId" INTEGER NOT NULL,
    "action" VARCHAR(20) NOT NULL CHECK ("action" IN ('ASSIGNED', 'UNASSIGNED', 'MODIFIED')),
    "previousData" JSONB,
    "newData" JSONB NOT NULL,
    "performedBy" UUID NOT NULL,
    "performedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    
    -- Foreign key constraints
    CONSTRAINT "fk_territory_assignment_audit_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_territory_assignment_audit_performed_by" 
        FOREIGN KEY ("performedBy") REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for userPincodeAssignments performance
CREATE INDEX IF NOT EXISTS "idx_user_pincode_assignments_user_id" 
    ON "userPincodeAssignments"("userId");

CREATE INDEX IF NOT EXISTS "idx_user_pincode_assignments_pincode_id" 
    ON "userPincodeAssignments"("pincodeId");

CREATE INDEX IF NOT EXISTS "idx_user_pincode_assignments_active" 
    ON "userPincodeAssignments"("isActive") WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS "idx_user_pincode_assignments_user_active" 
    ON "userPincodeAssignments"("userId", "isActive") WHERE "isActive" = true;

-- Create indexes for userAreaAssignments performance
CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_user_id" 
    ON "userAreaAssignments"("userId");

CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_pincode_id" 
    ON "userAreaAssignments"("pincodeId");

CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_area_id" 
    ON "userAreaAssignments"("areaId");

CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_user_pincode_assignment_id" 
    ON "userAreaAssignments"("userPincodeAssignmentId");

CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_active" 
    ON "userAreaAssignments"("isActive") WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_user_active" 
    ON "userAreaAssignments"("userId", "isActive") WHERE "isActive" = true;

-- Create composite indexes for efficient territory lookups
CREATE INDEX IF NOT EXISTS "idx_user_area_assignments_user_pincode_active" 
    ON "userAreaAssignments"("userId", "pincodeId", "isActive") WHERE "isActive" = true;

-- Create indexes for territoryAssignmentAudit performance
CREATE INDEX IF NOT EXISTS "idx_territory_assignment_audit_user_id" 
    ON "territoryAssignmentAudit"("userId");

CREATE INDEX IF NOT EXISTS "idx_territory_assignment_audit_assignment_type" 
    ON "territoryAssignmentAudit"("assignmentType");

CREATE INDEX IF NOT EXISTS "idx_territory_assignment_audit_performed_at" 
    ON "territoryAssignmentAudit"("performedAt");

-- Create GIN indexes for JSONB columns for efficient searching
CREATE INDEX IF NOT EXISTS "idx_territory_assignment_audit_previous_data" 
    ON "territoryAssignmentAudit" USING GIN ("previousData");

CREATE INDEX IF NOT EXISTS "idx_territory_assignment_audit_new_data" 
    ON "territoryAssignmentAudit" USING GIN ("newData");

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS "update_user_pincode_assignments_updated_at" ON "userPincodeAssignments";
CREATE TRIGGER "update_user_pincode_assignments_updated_at"
    BEFORE UPDATE ON "userPincodeAssignments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS "update_user_area_assignments_updated_at" ON "userAreaAssignments";
CREATE TRIGGER "update_user_area_assignments_updated_at"
    BEFORE UPDATE ON "userAreaAssignments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE "userPincodeAssignments" IS 'Junction table for assigning field agents to specific pincodes for territorial coverage';
COMMENT ON COLUMN "userPincodeAssignments"."userId" IS 'Reference to the field agent user being assigned to pincodes';
COMMENT ON COLUMN "userPincodeAssignments"."pincodeId" IS 'Reference to the pincode the field agent is assigned to';
COMMENT ON COLUMN "userPincodeAssignments"."assignedBy" IS 'User who performed the assignment (ADMIN/SUPER_ADMIN)';
COMMENT ON COLUMN "userPincodeAssignments"."isActive" IS 'Whether this assignment is currently active';

COMMENT ON TABLE "userAreaAssignments" IS 'Junction table for assigning field agents to specific areas within pincodes';
COMMENT ON COLUMN "userAreaAssignments"."userId" IS 'Reference to the field agent user being assigned to areas';
COMMENT ON COLUMN "userAreaAssignments"."pincodeId" IS 'Reference to the pincode containing the area';
COMMENT ON COLUMN "userAreaAssignments"."areaId" IS 'Reference to the specific area within the pincode';
COMMENT ON COLUMN "userAreaAssignments"."userPincodeAssignmentId" IS 'Reference to the parent pincode assignment';
COMMENT ON COLUMN "userAreaAssignments"."isActive" IS 'Whether this area assignment is currently active';

COMMENT ON TABLE "territoryAssignmentAudit" IS 'Audit trail for all territory assignment changes and decisions';
COMMENT ON COLUMN "territoryAssignmentAudit"."assignmentType" IS 'Type of assignment: PINCODE or AREA';
COMMENT ON COLUMN "territoryAssignmentAudit"."assignmentId" IS 'ID of the assignment record (userPincodeAssignments.id or userAreaAssignments.id)';
COMMENT ON COLUMN "territoryAssignmentAudit"."action" IS 'Action performed: ASSIGNED, UNASSIGNED, or MODIFIED';
COMMENT ON COLUMN "territoryAssignmentAudit"."previousData" IS 'JSON object containing the previous assignment data';
COMMENT ON COLUMN "territoryAssignmentAudit"."newData" IS 'JSON object containing the new assignment data';
COMMENT ON COLUMN "territoryAssignmentAudit"."reason" IS 'Optional reason for the assignment change';

-- Create function to automatically audit territory assignment changes
CREATE OR REPLACE FUNCTION audit_territory_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new assignments)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "territoryAssignmentAudit" (
            "userId", "assignmentType", "assignmentId", "action", 
            "previousData", "newData", "performedBy", "reason"
        ) VALUES (
            NEW."userId",
            CASE WHEN TG_TABLE_NAME = 'userPincodeAssignments' THEN 'PINCODE' ELSE 'AREA' END,
            NEW.id,
            'ASSIGNED',
            NULL,
            row_to_json(NEW),
            NEW."assignedBy",
            'Territory assignment created'
        );
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (assignment modifications)
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO "territoryAssignmentAudit" (
            "userId", "assignmentType", "assignmentId", "action", 
            "previousData", "newData", "performedBy", "reason"
        ) VALUES (
            NEW."userId",
            CASE WHEN TG_TABLE_NAME = 'userPincodeAssignments' THEN 'PINCODE' ELSE 'AREA' END,
            NEW.id,
            CASE WHEN OLD."isActive" = true AND NEW."isActive" = false THEN 'UNASSIGNED' ELSE 'MODIFIED' END,
            row_to_json(OLD),
            row_to_json(NEW),
            COALESCE(NEW."assignedBy", OLD."assignedBy"),
            CASE WHEN OLD."isActive" = true AND NEW."isActive" = false THEN 'Territory assignment deactivated' ELSE 'Territory assignment modified' END
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic auditing
DROP TRIGGER IF EXISTS "audit_user_pincode_assignments" ON "userPincodeAssignments";
CREATE TRIGGER "audit_user_pincode_assignments"
    AFTER INSERT OR UPDATE ON "userPincodeAssignments"
    FOR EACH ROW EXECUTE FUNCTION audit_territory_assignment_changes();

DROP TRIGGER IF EXISTS "audit_user_area_assignments" ON "userAreaAssignments";
CREATE TRIGGER "audit_user_area_assignments"
    AFTER INSERT OR UPDATE ON "userAreaAssignments"
    FOR EACH ROW EXECUTE FUNCTION audit_territory_assignment_changes();

-- Create view for easy territory assignment queries
CREATE OR REPLACE VIEW "fieldAgentTerritories" AS
SELECT 
    u.id as "userId",
    u.name as "userName",
    u.username,
    u."employeeId",
    upa.id as "pincodeAssignmentId",
    p.id as "pincodeId",
    p.code as "pincodeCode",
    c.name as "cityName",
    s.name as "stateName",
    co.name as "countryName",
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'areaAssignmentId', uaa.id,
                'areaId', a.id,
                'areaName', a.name,
                'assignedAt', uaa."assignedAt"
            ) ORDER BY a.name
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
    ) as "assignedAreas",
    upa."assignedAt" as "pincodeAssignedAt",
    upa."assignedBy" as "assignedBy",
    upa."isActive" as "isActive"
FROM users u
JOIN "userPincodeAssignments" upa ON u.id = upa."userId"
JOIN pincodes p ON upa."pincodeId" = p.id
JOIN cities c ON p."cityId" = c.id
JOIN states s ON c."stateId" = s.id
JOIN countries co ON c."countryId" = co.id
LEFT JOIN "userAreaAssignments" uaa ON upa.id = uaa."userPincodeAssignmentId" AND uaa."isActive" = true
LEFT JOIN areas a ON uaa."areaId" = a.id
WHERE upa."isActive" = true
GROUP BY u.id, u.name, u.username, u."employeeId", upa.id, p.id, p.code, c.name, s.name, co.name, upa."assignedAt", upa."assignedBy", upa."isActive";

COMMENT ON VIEW "fieldAgentTerritories" IS 'Comprehensive view of field agent territory assignments with pincode and area details';
