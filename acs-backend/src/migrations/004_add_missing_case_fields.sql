-- Migration: Add missing fields to cases table for complete case creation form support
-- Description: Add applicantType, backendContactNumber, notes (TRIGGER), and user-friendly caseId

-- Add missing columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "applicantType" VARCHAR(20);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "backendContactNumber" VARCHAR(20);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "notes" TEXT; -- TRIGGER field

-- Add user-friendly auto-incrementing case ID
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "caseId" SERIAL;

-- Add check constraint for applicantType (skip if already exists)
-- ALTER TABLE cases ADD CONSTRAINT "chk_cases_applicant_type"
--     CHECK ("applicantType" IN ('APPLICANT', 'CO-APPLICANT', 'REFERENCE PERSON'));

-- Add comments for documentation
COMMENT ON COLUMN cases."applicantType" IS 'Type of applicant: APPLICANT, CO-APPLICANT, or REFERENCE PERSON';
COMMENT ON COLUMN cases."backendContactNumber" IS 'Contact number of the backend user who created the case';
COMMENT ON COLUMN cases."notes" IS 'TRIGGER field - additional information or special instructions';
COMMENT ON COLUMN cases."caseId" IS 'User-friendly auto-incrementing case ID for display purposes';

-- Create index for caseId for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_cases_case_id" ON cases("caseId");

-- Update existing cases to have default values for new fields
UPDATE cases SET 
    "applicantType" = 'APPLICANT',
    "backendContactNumber" = '',
    "notes" = ''
WHERE "applicantType" IS NULL OR "backendContactNumber" IS NULL OR "notes" IS NULL;

-- Make required fields NOT NULL after setting defaults
ALTER TABLE cases ALTER COLUMN "applicantType" SET NOT NULL;
ALTER TABLE cases ALTER COLUMN "backendContactNumber" SET NOT NULL;
ALTER TABLE cases ALTER COLUMN "notes" SET NOT NULL;
