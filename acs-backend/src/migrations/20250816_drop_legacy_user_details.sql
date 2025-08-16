-- Migration: Drop legacy user_details relation (view or table)
-- Description: Removes snake_case legacy compatibility relation not used by current backend
-- Created: 2025-08-16

DO $$
BEGIN
  -- Drop view if exists
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_details'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.user_details CASCADE';
  END IF;
  
  -- Drop table if exists (in case it was a table)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_details'
  ) THEN
    EXECUTE 'DROP TABLE IF EXISTS public.user_details CASCADE';
  END IF;
END $$;

INSERT INTO migrations (id, filename)
VALUES ('20250816_drop_legacy_user_details.sql', '20250816_drop_legacy_user_details.sql')
ON CONFLICT (id) DO NOTHING;

