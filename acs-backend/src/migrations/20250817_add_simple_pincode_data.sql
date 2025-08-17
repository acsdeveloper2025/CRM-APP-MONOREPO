-- Migration: Add Simple Pincode and Area Data for Rate Management Testing
-- Description: Adds sample pincodes and areas using existing city data
-- Created: 2025-08-17

-- Insert sample pincodes using existing Mumbai city
INSERT INTO pincodes (id, code, area, "cityId") VALUES 
('550e8400-e29b-41d4-a716-446655440020', '400001', 'Fort', 'b3069f63-9f94-4b1f-b0b0-d4d5c9e764a0'),
('550e8400-e29b-41d4-a716-446655440021', '400002', 'Kalbadevi', 'b3069f63-9f94-4b1f-b0b0-d4d5c9e764a0'),
('550e8400-e29b-41d4-a716-446655440022', '400051', 'Bandra West', 'b3069f63-9f94-4b1f-b0b0-d4d5c9e764a0'),
('550e8400-e29b-41d4-a716-446655440023', '400052', 'Bandra East', 'b3069f63-9f94-4b1f-b0b0-d4d5c9e764a0'),
('550e8400-e29b-41d4-a716-446655440024', '400070', 'Andheri West', 'b3069f63-9f94-4b1f-b0b0-d4d5c9e764a0')
ON CONFLICT (code, "cityId") DO NOTHING;

-- Insert sample areas (these should already exist from previous migration)
INSERT INTO areas (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440030', 'Commercial District'),
('550e8400-e29b-41d4-a716-446655440031', 'Residential Area'),
('550e8400-e29b-41d4-a716-446655440032', 'Industrial Zone'),
('550e8400-e29b-41d4-a716-446655440033', 'IT Park'),
('550e8400-e29b-41d4-a716-446655440034', 'Shopping Complex'),
('550e8400-e29b-41d4-a716-446655440035', 'Business District')
ON CONFLICT (name) DO NOTHING;

-- Link pincodes with areas
INSERT INTO pincode_areas (id, "pincodeId", "areaId", "displayOrder") VALUES 
-- Mumbai Fort (400001)
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030', 1),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440035', 2),

-- Mumbai Kalbadevi (400002)
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440030', 1),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440034', 2),

-- Mumbai Bandra West (400051)
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440031', 1),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440034', 2),

-- Mumbai Bandra East (400052)
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440031', 1),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440033', 2),

-- Mumbai Andheri West (400070)
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440031', 1),
('550e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440032', 2)

ON CONFLICT ("pincodeId", "areaId") DO NOTHING;
