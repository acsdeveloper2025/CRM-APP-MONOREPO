-- Migration: User Product Assignments and Enhanced Access Control
-- Description: Create userProductAssignments table and add missing fields to userClientAssignments
-- Date: 2025-08-20
-- Author: System Migration

-- Start transaction
BEGIN;

-- 1. Add missing fields to userClientAssignments table
ALTER TABLE "userClientAssignments" 
ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "assignedBy" UUID;

-- Add foreign key constraint for assignedBy (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_client_assignments_assigned_by'
        AND table_name = 'userClientAssignments'
    ) THEN
        ALTER TABLE "userClientAssignments"
        ADD CONSTRAINT "fk_user_client_assignments_assigned_by"
        FOREIGN KEY ("assignedBy") REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create userProductAssignments table for product-specific access control
CREATE TABLE IF NOT EXISTS "userProductAssignments" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "productId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_user_product_assignments_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_product_assignments_product" 
        FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_product_assignments_assigned_by" 
        FOREIGN KEY ("assignedBy") REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT "uk_user_product_assignments_user_product" 
        UNIQUE ("userId", "productId")
);

-- 3. Create indexes for userProductAssignments performance
CREATE INDEX IF NOT EXISTS "idx_user_product_assignments_user_id" 
    ON "userProductAssignments"("userId");

CREATE INDEX IF NOT EXISTS "idx_user_product_assignments_product_id" 
    ON "userProductAssignments"("productId");

CREATE INDEX IF NOT EXISTS "idx_user_product_assignments_user_product" 
    ON "userProductAssignments"("userId", "productId");

-- 4. Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to userProductAssignments if it doesn't exist
DROP TRIGGER IF EXISTS update_user_product_assignments_updated_at ON "userProductAssignments";
CREATE TRIGGER update_user_product_assignments_updated_at
    BEFORE UPDATE ON "userProductAssignments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Add comments for documentation
COMMENT ON TABLE "userProductAssignments" IS 'Junction table for assigning BACKEND users to specific products for access control';
COMMENT ON COLUMN "userProductAssignments"."userId" IS 'Reference to the user being assigned to products';
COMMENT ON COLUMN "userProductAssignments"."productId" IS 'Reference to the product the user has access to';
COMMENT ON COLUMN "userProductAssignments"."assignedAt" IS 'Timestamp when the assignment was made';
COMMENT ON COLUMN "userProductAssignments"."assignedBy" IS 'User who made the assignment';

COMMENT ON COLUMN "userClientAssignments"."assignedAt" IS 'Timestamp when the assignment was made';
COMMENT ON COLUMN "userClientAssignments"."assignedBy" IS 'User who made the assignment';

-- Commit transaction
COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT * FROM "userProductAssignments" LIMIT 5;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'userProductAssignments';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'userClientAssignments' AND column_name IN ('assignedAt', 'assignedBy');
