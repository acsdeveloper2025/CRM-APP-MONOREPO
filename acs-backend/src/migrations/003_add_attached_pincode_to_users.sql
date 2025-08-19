-- Migration: Add attachedPincode field to users table
-- Description: Add a simple pincode field to users table for field agent assignments

-- Add attachedPincode column to users table
ALTER TABLE users ADD COLUMN "attachedPincode" VARCHAR(10);

-- Add comment for documentation
COMMENT ON COLUMN users."attachedPincode" IS 'Pincode assignment for field agents';

-- Create index for faster lookups
CREATE INDEX idx_users_attached_pincode ON users("attachedPincode") WHERE "attachedPincode" IS NOT NULL;
