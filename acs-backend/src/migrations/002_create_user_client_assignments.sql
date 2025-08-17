-- Migration: Create User Client Assignments Table
-- Description: Creates user_client_assignments junction table for BACKEND user access control
-- Created: 2025-08-17
-- Purpose: Restrict BACKEND users to only access cases from their assigned clients

-- Create user_client_assignments table
CREATE TABLE IF NOT EXISTS "userClientAssignments" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_user_client_assignments_user" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "fk_user_client_assignments_client" 
        FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT "uk_user_client_assignments_user_client" 
        UNIQUE ("userId", "clientId")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_user_id" 
    ON "userClientAssignments"("userId");

CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_client_id" 
    ON "userClientAssignments"("clientId");

-- Create composite index for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_user_client_assignments_user_client" 
    ON "userClientAssignments"("userId", "clientId");

-- Create trigger for updated_at
CREATE TRIGGER "update_user_client_assignments_updated_at"
    BEFORE UPDATE ON "userClientAssignments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
