-- Migration: Create mac_addresses table for MAC whitelist
-- Created: 2025-08-17
-- Description: Stores per-user whitelisted MAC addresses for web login enforcement

-- Create table
CREATE TABLE IF NOT EXISTS mac_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "macAddress" VARCHAR(64) NOT NULL,
  label VARCHAR(100),
  "isApproved" BOOLEAN NOT NULL DEFAULT true,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "approvedBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure uniqueness per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_mac_addresses_user_mac
  ON mac_addresses ("userId", "macAddress");

-- Index for quick lookups by macAddress
CREATE INDEX IF NOT EXISTS idx_mac_addresses_mac
  ON mac_addresses ("macAddress");

-- Trigger to update updatedAt on row updates
CREATE OR REPLACE FUNCTION update_mac_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_mac_addresses_updated_at ON mac_addresses;
CREATE TRIGGER trg_update_mac_addresses_updated_at
  BEFORE UPDATE ON mac_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_mac_addresses_updated_at();

