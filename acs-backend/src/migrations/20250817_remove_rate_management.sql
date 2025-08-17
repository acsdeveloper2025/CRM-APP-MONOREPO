-- Migration: Remove Rate Management Implementation
-- Description: Completely removes all rate management related tables and data
-- Created: 2025-08-17

-- Drop all rate management tables in correct order (respecting foreign key constraints)

-- Drop junction tables first
DROP TABLE IF EXISTS area_rate_types CASCADE;
DROP TABLE IF EXISTS product_verification_types CASCADE;
DROP TABLE IF EXISTS client_products CASCADE;
DROP TABLE IF EXISTS client_verification_types CASCADE;

-- Drop main rate management tables
DROP TABLE IF EXISTS rate_history CASCADE;
DROP TABLE IF EXISTS rates CASCADE;

-- Drop geographic tables
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS pincodes CASCADE;

-- Drop rate types table
DROP TABLE IF EXISTS rate_types CASCADE;

-- Drop products and verification types tables
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS verification_types CASCADE;

-- Drop any views that might exist
DROP VIEW IF EXISTS rate_management_view CASCADE;
DROP VIEW IF EXISTS comprehensive_rates_view CASCADE;

-- Drop any functions that might exist
DROP FUNCTION IF EXISTS get_available_rate_types_for_area(UUID) CASCADE;
DROP FUNCTION IF EXISTS assign_rate_types_to_area(UUID, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS get_area_rate_type_assignments(UUID) CASCADE;

-- Drop any triggers that might exist
DROP TRIGGER IF EXISTS update_rate_history_trigger ON rates CASCADE;
DROP TRIGGER IF EXISTS update_area_rate_types_timestamp ON area_rate_types CASCADE;

-- Drop any indexes that might exist
DROP INDEX IF EXISTS idx_rates_client_product_verification CASCADE;
DROP INDEX IF EXISTS idx_rates_location CASCADE;
DROP INDEX IF EXISTS idx_rates_effective_dates CASCADE;
DROP INDEX IF EXISTS idx_area_rate_types_area_id CASCADE;
DROP INDEX IF EXISTS idx_area_rate_types_rate_type_id CASCADE;
DROP INDEX IF EXISTS idx_product_verification_types_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_verification_types_verification_type_id CASCADE;
DROP INDEX IF EXISTS idx_client_products_client_id CASCADE;
DROP INDEX IF EXISTS idx_client_products_product_id CASCADE;

-- Verify tables are dropped
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'rates',
    'rate_types',
    'rate_history',
    'pincodes',
    'areas',
    'products',
    'verification_types',
    'area_rate_types',
    'product_verification_types',
    'client_products',
    'client_verification_types'
)
ORDER BY table_name;

-- Show remaining tables to confirm cleanup
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMENT ON SCHEMA public IS 'Rate management tables and related schema have been completely removed';
