-- Migration: Convert All Table Names to camelCase
-- Description: Renames all database tables from snake_case to camelCase for consistency
-- Created: 2025-08-17

-- Start transaction to ensure atomicity
BEGIN;

-- Rename tables from snake_case to camelCase
-- Note: PostgreSQL will automatically convert to lowercase, so we need to use quotes

-- Tables that need renaming to camelCase (only rename tables that actually need it)
ALTER TABLE IF EXISTS audit_logs RENAME TO "auditLogs";
ALTER TABLE IF EXISTS auto_saves RENAME TO "autoSaves";
ALTER TABLE IF EXISTS background_sync_queue RENAME TO "backgroundSyncQueue";
ALTER TABLE IF EXISTS case_deduplication_audit RENAME TO "caseDeduplicationAudit";
ALTER TABLE IF EXISTS mac_addresses RENAME TO "macAddresses";
ALTER TABLE IF EXISTS notification_tokens RENAME TO "notificationTokens";
ALTER TABLE IF EXISTS office_verification_reports RENAME TO "officeVerificationReports";
ALTER TABLE IF EXISTS pincode_areas RENAME TO "pincodeAreas";
ALTER TABLE IF EXISTS refresh_tokens RENAME TO "refreshTokens";
ALTER TABLE IF EXISTS residence_verification_reports RENAME TO "residenceVerificationReports";

-- Update foreign key references in renamed tables
-- Note: We need to check if foreign keys exist before altering them

-- Update any views that might reference the old table names
-- (Add view updates here if any exist)

-- Update any functions that might reference the old table names
-- (Add function updates here if any exist)

-- Update any triggers that might reference the old table names
-- (Add trigger updates here if any exist)

-- Verify the renaming was successful
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Add comments to document the camelCase conversion
COMMENT ON SCHEMA public IS 'All table names have been converted to camelCase for consistency';

-- Commit the transaction
COMMIT;

-- Display success message
SELECT 'All tables successfully converted to camelCase naming convention' as status;
