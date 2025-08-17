-- Migration: Complete Case Deduplication System
-- Description: Creates all necessary tables and functions for case deduplication functionality
-- Created: 2025-08-17
-- Purpose: Enable comprehensive case deduplication with audit trail and compliance tracking

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create caseDeduplicationAudit table for tracking deduplication decisions
CREATE TABLE IF NOT EXISTS "caseDeduplicationAudit" (
    id BIGSERIAL PRIMARY KEY,
    "caseId" UUID NOT NULL,
    "searchCriteria" JSONB NOT NULL,
    "duplicatesFound" JSONB NOT NULL,
    "userDecision" VARCHAR(20) NOT NULL CHECK ("userDecision" IN ('CREATE_NEW', 'USE_EXISTING', 'MERGE_CASES')),
    "rationale" TEXT NOT NULL,
    "performedBy" UUID NOT NULL,
    "performedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_case_deduplication_audit_case" 
        FOREIGN KEY ("caseId") REFERENCES cases(id) ON DELETE CASCADE,
    CONSTRAINT "fk_case_deduplication_audit_user" 
        FOREIGN KEY ("performedBy") REFERENCES users(id) ON DELETE RESTRICT
);

-- Create userClientAssignments table for client-specific access control
CREATE TABLE IF NOT EXISTS "userClientAssignments" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_user_client_assignments_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_client_assignments_client" 
        FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT "uk_user_client_assignments_user_client" 
        UNIQUE ("userId", "clientId")
);

-- Create indexes for caseDeduplicationAudit performance
CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_case_id" 
    ON "caseDeduplicationAudit"("caseId");

CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_performed_by" 
    ON "caseDeduplicationAudit"("performedBy");

CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_user_decision" 
    ON "caseDeduplicationAudit"("userDecision");

-- Index for performedAt column (using actual column name)
CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_performed_at" 
    ON "caseDeduplicationAudit"("performedAt");

-- Create GIN indexes for JSONB columns for efficient searching
CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_search_criteria" 
    ON "caseDeduplicationAudit" USING GIN ("searchCriteria");

CREATE INDEX IF NOT EXISTS "idx_case_deduplication_audit_duplicates_found" 
    ON "caseDeduplicationAudit" USING GIN ("duplicatesFound");

-- Create indexes for userClientAssignments performance
CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_user_id" 
    ON "userClientAssignments"("userId");

CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_client_id" 
    ON "userClientAssignments"("clientId");

-- Create composite index for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_user_client" 
    ON "userClientAssignments"("userId", "clientId");

-- Create triggers for updated_at columns (drop if exists first)
DROP TRIGGER IF EXISTS "update_case_deduplication_audit_updated_at" ON "caseDeduplicationAudit";
CREATE TRIGGER "update_case_deduplication_audit_updated_at"
    BEFORE UPDATE ON "caseDeduplicationAudit"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS "update_user_client_assignments_updated_at" ON "userClientAssignments";
CREATE TRIGGER "update_user_client_assignments_updated_at"
    BEFORE UPDATE ON "userClientAssignments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable pg_trgm extension for fuzzy string matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add similarity indexes for fuzzy name matching on cases table
CREATE INDEX IF NOT EXISTS "idx_cases_applicant_name_trgm" 
    ON cases USING GIN ("applicantName" gin_trgm_ops);

-- Add indexes for exact field matching on cases table
CREATE INDEX IF NOT EXISTS "idx_cases_pan_number" 
    ON cases("panNumber") WHERE "panNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_cases_aadhaar_number" 
    ON cases("aadhaarNumber") WHERE "aadhaarNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_cases_applicant_phone" 
    ON cases("applicantPhone") WHERE "applicantPhone" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_cases_applicant_email" 
    ON cases("applicantEmail") WHERE "applicantEmail" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_cases_bank_account_number" 
    ON cases("bankAccountNumber") WHERE "bankAccountNumber" IS NOT NULL;

-- Add composite index for deduplication searches
CREATE INDEX IF NOT EXISTS "idx_cases_deduplication_fields" 
    ON cases("panNumber", "aadhaarNumber", "applicantPhone", "applicantEmail", "bankAccountNumber");

-- Add comments for documentation
COMMENT ON TABLE "caseDeduplicationAudit" IS 'Audit trail for case deduplication decisions and duplicate detection results';
COMMENT ON COLUMN "caseDeduplicationAudit"."caseId" IS 'Reference to the case being created or evaluated';
COMMENT ON COLUMN "caseDeduplicationAudit"."searchCriteria" IS 'JSON object containing the search criteria used for duplicate detection';
COMMENT ON COLUMN "caseDeduplicationAudit"."duplicatesFound" IS 'JSON array of duplicate cases found during the search';
COMMENT ON COLUMN "caseDeduplicationAudit"."userDecision" IS 'Decision made by the user: CREATE_NEW, USE_EXISTING, or MERGE_CASES';
COMMENT ON COLUMN "caseDeduplicationAudit"."rationale" IS 'User-provided rationale for their deduplication decision';
COMMENT ON COLUMN "caseDeduplicationAudit"."performedBy" IS 'User who performed the deduplication check and made the decision';

COMMENT ON TABLE "userClientAssignments" IS 'Junction table for assigning BACKEND users to specific clients for access control';
COMMENT ON COLUMN "userClientAssignments"."userId" IS 'Reference to the user being assigned to clients';
COMMENT ON COLUMN "userClientAssignments"."clientId" IS 'Reference to the client the user has access to';
