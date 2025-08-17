-- Migration: Fix Product-Verification Type Relationships
-- Description: Creates correct relationships between products and verification types, removes incorrect client relationships
-- Created: 2025-08-17

-- Drop the incorrect client-verification types table
DROP TABLE IF EXISTS "clientVerificationTypes" CASCADE;

-- Create the correct product-verification types table
CREATE TABLE IF NOT EXISTS "productVerificationTypes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    "verificationTypeId" UUID NOT NULL REFERENCES "verificationTypes"(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("productId", "verificationTypeId")
);

-- Create product-verification type relationships
-- Each product should have specific verification types associated with it
INSERT INTO "productVerificationTypes" ("productId", "verificationTypeId")
SELECT p.id, vt.id
FROM products p
CROSS JOIN "verificationTypes" vt
ON CONFLICT ("productId", "verificationTypeId") DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_verification_types_product_id ON "productVerificationTypes"("productId");
CREATE INDEX IF NOT EXISTS idx_product_verification_types_verification_type_id ON "productVerificationTypes"("verificationTypeId");

-- Add comments
COMMENT ON TABLE "productVerificationTypes" IS 'Junction table linking products with their available verification types';

-- Verify the relationships were created correctly
SELECT 
    'Product-Verification Type Relationships' as relationship_type,
    COUNT(*) as count
FROM "productVerificationTypes"

UNION ALL

SELECT 
    'Client-Product Relationships' as relationship_type,
    COUNT(*) as count
FROM "clientProducts";

-- Show sample product-verification type relationships
SELECT 
    p.name as product_name,
    vt.name as verification_type_name
FROM products p
JOIN "productVerificationTypes" pvt ON p.id = pvt."productId"
JOIN "verificationTypes" vt ON pvt."verificationTypeId" = vt.id
ORDER BY p.name, vt.name
LIMIT 10;

-- Show sample client-product relationships
SELECT 
    c.name as client_name,
    p.name as product_name
FROM clients c
JOIN "clientProducts" cp ON c.id = cp."clientId"
JOIN products p ON cp."productId" = p.id
ORDER BY c.name, p.name
LIMIT 10;
