-- Migration: Restore Core Business Tables
-- Description: Restores core business tables that were accidentally removed (products, verification_types, pincodes, areas)
-- These are needed for case management, not just rate management
-- Created: 2025-08-17

-- Restore products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore verification_types table
CREATE TABLE IF NOT EXISTS verification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore pincodes table
CREATE TABLE IF NOT EXISTS pincodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    "cityId" UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore areas table
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore client_products table (for case management)
CREATE TABLE IF NOT EXISTS client_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("clientId", "productId")
);

-- Restore client_verification_types table (for case management)
CREATE TABLE IF NOT EXISTS client_verification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "verificationTypeId" UUID NOT NULL REFERENCES verification_types(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("clientId", "verificationTypeId")
);

-- Insert sample data for products
INSERT INTO products (id, name, code, description) VALUES
('9c18ff88-0525-4cd4-b509-6219162455c1', 'Personal Loan', 'PL', 'Personal loan verification services'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Home Loan', 'HL', 'Home loan verification services'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Credit Card', 'CC', 'Credit card verification services'),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Business Loan', 'BL', 'Business loan verification services')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for verification types
INSERT INTO verification_types (id, name, code, description) VALUES
('d4e5f6g7-h8i9-0123-defg-456789012345', 'Residence Verification', 'RV', 'Verification of residential address'),
('e5f6g7h8-i9j0-1234-efgh-567890123456', 'Office Verification', 'OV', 'Verification of office address'),
('f6g7h8i9-j0k1-2345-fghi-678901234567', 'Reference Check', 'RC', 'Reference verification'),
('g7h8i9j0-k1l2-3456-ghij-789012345678', 'Employment Verification', 'EV', 'Employment verification')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for pincodes (using existing city IDs)
INSERT INTO pincodes (id, code, "cityId") 
SELECT 
    gen_random_uuid(),
    pincode_code,
    city_id
FROM (VALUES
    ('400001', (SELECT id FROM cities WHERE name = 'Mumbai' LIMIT 1)),
    ('400002', (SELECT id FROM cities WHERE name = 'Mumbai' LIMIT 1)),
    ('110001', (SELECT id FROM cities WHERE name = 'Delhi' LIMIT 1)),
    ('110002', (SELECT id FROM cities WHERE name = 'Delhi' LIMIT 1)),
    ('560001', (SELECT id FROM cities WHERE name = 'Bangalore' LIMIT 1))
) AS pincode_data(pincode_code, city_id)
WHERE city_id IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- Insert sample data for areas
INSERT INTO areas (id, name) VALUES
('h8i9j0k1-l2m3-4567-hijk-890123456789', 'Andheri East'),
('i9j0k1l2-m3n4-5678-ijkl-901234567890', 'Andheri West'),
('j0k1l2m3-n4o5-6789-jklm-012345678901', 'Bandra'),
('k1l2m3n4-o5p6-7890-klmn-123456789012', 'Connaught Place'),
('l2m3n4o5-p6q7-8901-lmno-234567890123', 'Koramangala')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pincodes_city_id ON pincodes("cityId");
CREATE INDEX IF NOT EXISTS idx_client_products_client_id ON client_products("clientId");
CREATE INDEX IF NOT EXISTS idx_client_products_product_id ON client_products("productId");
CREATE INDEX IF NOT EXISTS idx_client_verification_types_client_id ON client_verification_types("clientId");
CREATE INDEX IF NOT EXISTS idx_client_verification_types_verification_type_id ON client_verification_types("verificationTypeId");

-- Add comments
COMMENT ON TABLE products IS 'Core business products offered by the organization';
COMMENT ON TABLE verification_types IS 'Types of verification services available';
COMMENT ON TABLE pincodes IS 'Postal codes linked to cities';
COMMENT ON TABLE areas IS 'Geographic areas within cities';
COMMENT ON TABLE client_products IS 'Products available to each client';
COMMENT ON TABLE client_verification_types IS 'Verification types available to each client';

-- Verify tables are created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'verification_types', 'pincodes', 'areas', 'client_products', 'client_verification_types')
ORDER BY table_name;
