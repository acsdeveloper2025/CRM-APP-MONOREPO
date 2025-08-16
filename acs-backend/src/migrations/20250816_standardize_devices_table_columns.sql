-- Migration: Standardize Devices Table Columns (snake_case/mixed → camelCase)
-- Description: Rename legacy columns on devices to proper camelCase and remove duplicate legacy flags.
-- Created: 2025-08-16

-- ============================================================================
-- DEVICES TABLE COLUMN RENAMES AND CLEANUP
-- ============================================================================

-- Backfill isActive from legacy isactive when needed, then drop legacy column
DO $$
BEGIN
  -- If legacy column exists, and isActive exists, copy values where isActive is NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'isactive'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'isActive'
    ) THEN
      EXECUTE 'UPDATE devices SET "isActive" = COALESCE("isActive", isactive)';
    END IF;
  END IF;
END $$;

-- Rename legacy columns to camelCase if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='approvedat') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN approvedat TO "approvedAt"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='approvedby') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN approvedby TO "approvedBy"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='authcode') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN authcode TO "authCode"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='authcodeexpiresat') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN authcodeexpiresat TO "authCodeExpiresAt"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='isapproved') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN isapproved TO "isApproved"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='lastactiveat') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN lastactiveat TO "lastActiveAt"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='notificationpreferences') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN notificationpreferences TO "notificationPreferences"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='notificationsenabled') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN notificationsenabled TO "notificationsEnabled"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='osversion') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN osversion TO "osVersion"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='pushtoken') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN pushtoken TO "pushToken"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='registeredat') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN registeredat TO "registeredAt"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='rejectedat') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN rejectedat TO "rejectedAt"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='rejectedby') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN rejectedby TO "rejectedBy"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='rejectionreason') THEN
    EXECUTE 'ALTER TABLE devices RENAME COLUMN rejectionreason TO "rejectionReason"';
  END IF;
END $$;

-- Drop the legacy duplicate isactive column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='devices' AND column_name='isactive'
  ) THEN
    EXECUTE 'ALTER TABLE devices DROP COLUMN isactive';
  END IF;
END $$;

-- Record migration
INSERT INTO migrations (filename, "executedAt")
VALUES ('20250816_standardize_devices_table_columns.sql', CURRENT_TIMESTAMP);

