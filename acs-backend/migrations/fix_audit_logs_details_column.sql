-- Migration: Fix Audit Logs Details Column
-- Description: Add missing details column to auditLogs table
-- Date: 2025-08-20
-- Author: System Migration

-- Start transaction
BEGIN;

-- Add details column to auditLogs table if it doesn't exist
ALTER TABLE "auditLogs" ADD COLUMN IF NOT EXISTS details jsonb;

-- Commit transaction
COMMIT;

-- Verification query (run this after migration to verify)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'auditLogs' AND column_name = 'details';
