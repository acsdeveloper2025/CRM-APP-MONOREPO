-- Migration: Remove Device Functionality
-- Description: Remove all device-related functionality from the CRM system
-- Date: 2025-01-20
-- Author: System Migration

-- Start transaction
BEGIN;

-- 1. Remove device-related fields from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS "deviceId",
DROP COLUMN IF EXISTS "authUuid";

-- 2. Drop devices table if it exists
DROP TABLE IF EXISTS devices CASCADE;

-- 3. Drop device-related tables if they exist
DROP TABLE IF EXISTS "macAddresses" CASCADE;

-- 4. Update refresh tokens table to remove deviceId column
ALTER TABLE "refreshTokens" 
DROP COLUMN IF EXISTS "deviceId";

-- 5. Clean up any device-related audit logs (optional - keep for historical purposes)
-- UPDATE "auditLogs" 
-- SET details = jsonb_strip_nulls(details - 'deviceId')
-- WHERE details ? 'deviceId';

-- 6. Remove any device-related constraints or indexes
DROP INDEX IF EXISTS idx_devices_user_id;
DROP INDEX IF EXISTS idx_devices_device_id;
DROP INDEX IF EXISTS idx_devices_is_active;
DROP INDEX IF EXISTS idx_devices_is_approved;
DROP INDEX IF EXISTS idx_mac_addresses_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_device_id;

-- Commit transaction
COMMIT;

-- Verification queries (run these after migration to verify cleanup)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('deviceId', 'authUuid');
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('devices', 'macAddresses');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'refreshTokens' AND column_name = 'deviceId';
