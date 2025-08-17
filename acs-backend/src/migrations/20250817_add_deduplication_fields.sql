-- Migration: Add Deduplication Fields to Cases Table
-- Description: Adds PAN, Aadhaar, bank account fields and creates deduplication audit table
-- Created: 2025-08-17

-- Add deduplication fields to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS "panNumber" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "aadhaarNumber" VARCHAR(12),
ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "bankIfscCode" VARCHAR(11),
ADD COLUMN IF NOT EXISTS "deduplicationChecked" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "deduplicationDecision" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "deduplicationRationale" TEXT;

-- Create indexes for deduplication fields for fast searching
CREATE INDEX IF NOT EXISTS "idx_cases_pan_number" ON cases ("panNumber") WHERE "panNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_cases_aadhaar_number" ON cases ("aadhaarNumber") WHERE "aadhaarNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_cases_bank_account" ON cases ("bankAccountNumber") WHERE "bankAccountNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_cases_applicant_phone" ON cases ("applicantPhone") WHERE "applicantPhone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_cases_applicant_email" ON cases ("applicantEmail") WHERE "applicantEmail" IS NOT NULL;

-- Create GIN index for fuzzy name matching
CREATE INDEX IF NOT EXISTS "idx_cases_applicant_name_gin" ON cases USING gin(to_tsvector('english', "applicantName"));

-- Create deduplication audit table
CREATE TABLE IF NOT EXISTS case_deduplication_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "caseId" UUID NOT NULL,
    "searchCriteria" JSONB NOT NULL,
    "duplicatesFound" JSONB,
    "userDecision" VARCHAR(20) NOT NULL,
    "rationale" TEXT,
    "performedBy" UUID NOT NULL,
    "performedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("caseId") REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY ("performedBy") REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_dedup_audit_decision CHECK ("userDecision" IN ('CREATE_NEW', 'USE_EXISTING', 'MERGE_CASES'))
);

-- Create indexes for audit table
CREATE INDEX IF NOT EXISTS "idx_dedup_audit_case_id" ON case_deduplication_audit ("caseId");
CREATE INDEX IF NOT EXISTS "idx_dedup_audit_performed_by" ON case_deduplication_audit ("performedBy");
CREATE INDEX IF NOT EXISTS "idx_dedup_audit_performed_at" ON case_deduplication_audit ("performedAt");

-- Add constraints for deduplication decision
ALTER TABLE cases 
ADD CONSTRAINT chk_cases_dedup_decision 
CHECK ("deduplicationDecision" IN ('CREATE_NEW', 'USE_EXISTING', 'MERGE_CASES', 'NO_DUPLICATES'));

-- Add comments for documentation
COMMENT ON COLUMN cases."panNumber" IS 'PAN card number for deduplication matching';
COMMENT ON COLUMN cases."aadhaarNumber" IS 'Aadhaar card number for deduplication matching';
COMMENT ON COLUMN cases."bankAccountNumber" IS 'Bank account number for deduplication matching';
COMMENT ON COLUMN cases."bankIfscCode" IS 'Bank IFSC code for additional verification';
COMMENT ON COLUMN cases."deduplicationChecked" IS 'Whether deduplication check was performed';
COMMENT ON COLUMN cases."deduplicationDecision" IS 'User decision after deduplication check';
COMMENT ON COLUMN cases."deduplicationRationale" IS 'Reason for deduplication decision';

COMMENT ON TABLE case_deduplication_audit IS 'Audit trail for case deduplication decisions';
COMMENT ON COLUMN case_deduplication_audit."searchCriteria" IS 'JSON object containing search parameters used';
COMMENT ON COLUMN case_deduplication_audit."duplicatesFound" IS 'JSON array of potential duplicate cases found';
COMMENT ON COLUMN case_deduplication_audit."userDecision" IS 'Final decision made by user';
COMMENT ON COLUMN case_deduplication_audit."rationale" IS 'User-provided reason for decision';
