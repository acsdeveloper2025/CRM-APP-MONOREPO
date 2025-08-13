-- Migration: Create pincode_areas table for multiple area assignments
-- Description: Reintroduce pincode_areas table with improved design for multiple area support
-- Created: 2025-08-13

-- Create pincode_areas table for many-to-many relationship
CREATE TABLE IF NOT EXISTS pincode_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode_id UUID NOT NULL,
    area_id UUID NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_pincode_areas_pincode_id 
        FOREIGN KEY (pincode_id) 
        REFERENCES pincodes(id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_pincode_areas_area_id 
        FOREIGN KEY (area_id) 
        REFERENCES areas(id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate area assignments
    CONSTRAINT uk_pincode_areas_pincode_area 
        UNIQUE (pincode_id, area_id),
    
    -- Check constraint for display order
    CONSTRAINT chk_pincode_areas_display_order 
        CHECK (display_order >= 1 AND display_order <= 50)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pincode_areas_pincode_id 
    ON pincode_areas(pincode_id);

CREATE INDEX IF NOT EXISTS idx_pincode_areas_area_id 
    ON pincode_areas(area_id);

CREATE INDEX IF NOT EXISTS idx_pincode_areas_pincode_order 
    ON pincode_areas(pincode_id, display_order);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_pincode_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_pincode_areas_updated_at
    BEFORE UPDATE ON pincode_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_pincode_areas_updated_at();

-- Migrate existing single area data from pincodes table to pincode_areas table
INSERT INTO pincode_areas (pincode_id, area_id, display_order)
SELECT 
    p.id as pincode_id,
    a.id as area_id,
    1 as display_order
FROM pincodes p
JOIN areas a ON p.area = a.name
WHERE p.area IS NOT NULL AND TRIM(p.area) != ''
ON CONFLICT (pincode_id, area_id) DO NOTHING;

-- Add comment to document the table purpose
COMMENT ON TABLE pincode_areas IS 'Junction table for many-to-many relationship between pincodes and areas';
COMMENT ON COLUMN pincode_areas.pincode_id IS 'Foreign key reference to pincodes table';
COMMENT ON COLUMN pincode_areas.area_id IS 'Foreign key reference to areas table';
COMMENT ON COLUMN pincode_areas.display_order IS 'Order for displaying areas (1-50)';
