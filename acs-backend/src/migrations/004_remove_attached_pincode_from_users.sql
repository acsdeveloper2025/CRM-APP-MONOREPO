-- Migration: Remove attachedPincode field from users table
-- Description: Remove the attachedPincode column as we're using territory assignments instead

-- Drop the index first
DROP INDEX IF EXISTS idx_users_attached_pincode;

-- Remove attachedPincode column from users table
ALTER TABLE users DROP COLUMN IF EXISTS "attachedPincode";
