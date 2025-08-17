# Rate Management Database Schema

## Overview
The rate management system consists of 4 main tables that work together to provide a comprehensive rate management solution for verification services.

## Tables

### 1. rateTypes
**Purpose**: Stores different types of rates (Local, Local1, Local2, OGL, OGL1, OGL2, Outstation)

```sql
CREATE TABLE "rateTypes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Current Data**:
- Local: Local area verification rates
- Local1: Local area verification rates - Type 1
- Local2: Local area verification rates - Type 2
- OGL: Out of Gujarat/Local verification rates
- OGL1: Out of Gujarat/Local verification rates - Type 1
- OGL2: Out of Gujarat/Local verification rates - Type 2
- Outstation: Outstation verification rates

### 2. rateTypeAssignments
**Purpose**: Assigns rate types to specific Client → Product → Verification Type combinations

```sql
CREATE TABLE "rateTypeAssignments" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    "verificationTypeId" UUID NOT NULL REFERENCES "verificationTypes"(id) ON DELETE CASCADE,
    "rateTypeId" UUID NOT NULL REFERENCES "rateTypes"(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("clientId", "productId", "verificationTypeId", "rateTypeId")
);
```

**Indexes**:
- Primary key on id
- Unique constraint on combination of clientId, productId, verificationTypeId, rateTypeId
- Individual indexes on clientId, productId, verificationTypeId, rateTypeId
- Composite index on (clientId, productId, verificationTypeId)

### 3. rates
**Purpose**: Stores actual rate amounts for assigned rate types

```sql
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    "verificationTypeId" UUID NOT NULL REFERENCES "verificationTypes"(id) ON DELETE CASCADE,
    "rateTypeId" UUID NOT NULL REFERENCES "rateTypes"(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    "isActive" BOOLEAN DEFAULT true,
    "effectiveFrom" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP WITH TIME ZONE,
    "createdBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("clientId", "productId", "verificationTypeId", "rateTypeId", "effectiveFrom")
);
```

**Constraints**:
- Amount must be non-negative
- Unique constraint on combination including effectiveFrom for rate history

**Indexes**:
- Primary key on id
- Individual indexes on clientId, productId, verificationTypeId, rateTypeId
- Composite index on (clientId, productId, verificationTypeId, rateTypeId)
- Indexes on effectiveFrom and effectiveTo for time-based queries

### 4. rateHistory
**Purpose**: Audit trail for rate changes

```sql
CREATE TABLE "rateHistory" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "rateId" UUID NOT NULL REFERENCES rates(id) ON DELETE CASCADE,
    "oldAmount" DECIMAL(10,2),
    "newAmount" DECIMAL(10,2) NOT NULL,
    "changeReason" TEXT,
    "changedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "changedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- Primary key on id
- Index on rateId for efficient lookups
- Index on changedAt for time-based queries

## Views

### 1. rateManagementView
**Purpose**: Comprehensive view for rate reporting and management

```sql
CREATE VIEW "rateManagementView" AS
SELECT 
    r.id as "rateId",
    c.id as "clientId",
    c.name as "clientName",
    c.code as "clientCode",
    p.id as "productId",
    p.name as "productName",
    p.code as "productCode",
    vt.id as "verificationTypeId",
    vt.name as "verificationTypeName",
    vt.code as "verificationTypeCode",
    rt.id as "rateTypeId",
    rt.name as "rateTypeName",
    r.amount,
    r.currency,
    r."isActive",
    r."effectiveFrom",
    r."effectiveTo",
    u.name as "createdByName",
    r."createdAt",
    r."updatedAt"
FROM rates r
JOIN clients c ON r."clientId" = c.id
JOIN products p ON r."productId" = p.id
JOIN "verificationTypes" vt ON r."verificationTypeId" = vt.id
JOIN "rateTypes" rt ON r."rateTypeId" = rt.id
LEFT JOIN users u ON r."createdBy" = u.id
ORDER BY c.name, p.name, vt.name, rt.name;
```

### 2. rateTypeAssignmentView
**Purpose**: View for rate type assignments with related entity details

```sql
CREATE VIEW "rateTypeAssignmentView" AS
SELECT 
    rta.id as "assignmentId",
    c.id as "clientId",
    c.name as "clientName",
    c.code as "clientCode",
    p.id as "productId",
    p.name as "productName",
    p.code as "productCode",
    vt.id as "verificationTypeId",
    vt.name as "verificationTypeName",
    vt.code as "verificationTypeCode",
    rt.id as "rateTypeId",
    rt.name as "rateTypeName",
    rta."isActive",
    rta."createdAt",
    rta."updatedAt"
FROM "rateTypeAssignments" rta
JOIN clients c ON rta."clientId" = c.id
JOIN products p ON rta."productId" = p.id
JOIN "verificationTypes" vt ON rta."verificationTypeId" = vt.id
JOIN "rateTypes" rt ON rta."rateTypeId" = rt.id
ORDER BY c.name, p.name, vt.name, rt.name;
```

## Triggers

### Rate History Trigger
Automatically creates audit entries when rates are updated:

```sql
CREATE OR REPLACE FUNCTION create_rate_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.amount != NEW.amount THEN
        INSERT INTO "rateHistory" ("rateId", "oldAmount", "newAmount", "changedBy")
        VALUES (NEW.id, OLD.amount, NEW.amount, NEW."createdBy");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_history_trigger
    AFTER UPDATE ON rates
    FOR EACH ROW
    EXECUTE FUNCTION create_rate_history();
```

## Workflow

1. **Tab 1**: Create rate types in `rateTypes` table
2. **Tab 2**: Assign rate types to client-product-verification combinations in `rateTypeAssignments`
3. **Tab 3**: Set actual rate amounts in `rates` table
4. **Tab 4**: View and manage all rates using `rateManagementView`

## Data Integrity

- All foreign key constraints ensure referential integrity
- Cascade deletes maintain consistency when parent records are removed
- Unique constraints prevent duplicate assignments and rates
- Check constraints ensure data validity (e.g., non-negative amounts)
- Audit trail maintains complete history of rate changes

## Performance Optimizations

- Strategic indexes on frequently queried columns
- Composite indexes for complex queries
- Views pre-join related data for efficient reporting
- Proper data types and constraints for optimal storage
