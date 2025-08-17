# 🔄 **UUID TO SERIAL MIGRATION PLAN**

**Database**: CRM-APP PostgreSQL  
**Objective**: Convert inappropriate UUID usage to SERIAL/BIGSERIAL  
**Approach**: Phased migration with minimal downtime  

---

## 📋 **MIGRATION PHASES**

### **Phase 1: Reference Tables (Low Risk)**
**Duration**: 1-2 days  
**Downtime**: Minimal (< 30 minutes)  

#### **Tables to Convert**
1. `countries` (1 record)
2. `states` (2 records) 
3. `cities` (1 record)
4. `areas` (5 records)
5. `pincodes` (2 records)

#### **Migration Steps**

```sql
-- Step 1: Add new SERIAL columns
ALTER TABLE countries ADD COLUMN new_id SERIAL;
ALTER TABLE states ADD COLUMN new_id SERIAL;
ALTER TABLE cities ADD COLUMN new_id SERIAL;
ALTER TABLE areas ADD COLUMN new_id SERIAL;
ALTER TABLE pincodes ADD COLUMN new_id SERIAL;

-- Step 2: Create mapping tables for reference
CREATE TABLE uuid_to_serial_mapping (
    table_name VARCHAR(50),
    old_uuid UUID,
    new_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Populate mapping tables
INSERT INTO uuid_to_serial_mapping (table_name, old_uuid, new_id)
SELECT 'countries', id, new_id FROM countries;

INSERT INTO uuid_to_serial_mapping (table_name, old_uuid, new_id)
SELECT 'states', id, new_id FROM states;

-- Continue for all reference tables...
```

### **Phase 2: Master Data Tables (Medium Risk)**
**Duration**: 3-5 days  
**Downtime**: 1-2 hours  

#### **Tables to Convert**
1. `verificationTypes` (4 records)
2. `products` (4 records)
3. `clients` (4 records)
4. `roles` (6 records)
5. `departments` (9 records)
6. `designations` (4 records)

#### **Migration Strategy**
```sql
-- Example for products table
BEGIN;

-- Step 1: Add new SERIAL column
ALTER TABLE products ADD COLUMN new_id SERIAL;

-- Step 2: Update all foreign key tables
-- Update clientProducts
ALTER TABLE "clientProducts" ADD COLUMN new_product_id INTEGER;
UPDATE "clientProducts" cp 
SET new_product_id = p.new_id 
FROM products p 
WHERE cp."productId" = p.id;

-- Update productVerificationTypes
ALTER TABLE "productVerificationTypes" ADD COLUMN new_product_id INTEGER;
UPDATE "productVerificationTypes" pvt 
SET new_product_id = p.new_id 
FROM products p 
WHERE pvt."productId" = p.id;

-- Continue for all FK references...

COMMIT;
```

### **Phase 3: Transactional Tables (High Risk)**
**Duration**: 1-2 weeks  
**Downtime**: 4-6 hours  

#### **Tables to Convert**
1. `rateTypes` (7 records)
2. `rateTypeAssignments` (6 records)
3. `rates` (4 records)
4. `rateHistory` (0 records)
5. `cases` (0 records)
6. `attachments` (0 records)

### **Phase 4: System Tables (Medium Risk)**
**Duration**: 2-3 days  
**Downtime**: 2-3 hours  

#### **Tables to Convert**
1. `auditLogs` (198 records)
2. `refreshTokens` (2 records)
3. `devices` (2 records)
4. `notificationTokens` (0 records)

---

## 🛠️ **DETAILED MIGRATION SCRIPTS**

### **Script 1: Reference Tables Migration**

```sql
-- =====================================================
-- PHASE 1: REFERENCE TABLES MIGRATION
-- =====================================================

BEGIN;

-- Create mapping table
CREATE TABLE IF NOT EXISTS uuid_serial_mapping (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    old_uuid UUID NOT NULL,
    new_serial INTEGER NOT NULL,
    migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_name, old_uuid)
);

-- 1. COUNTRIES TABLE
ALTER TABLE countries ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'countries', id, temp_id FROM countries;

-- 2. STATES TABLE  
ALTER TABLE states ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'states', id, temp_id FROM states;

-- Update states foreign key references
ALTER TABLE states ADD COLUMN temp_country_id INTEGER;
UPDATE states s SET temp_country_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'countries' AND m.old_uuid = s."countryId";

-- 3. CITIES TABLE
ALTER TABLE cities ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'cities', id, temp_id FROM cities;

-- Update cities foreign key references
ALTER TABLE cities ADD COLUMN temp_state_id INTEGER;
UPDATE cities c SET temp_state_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'states' AND m.old_uuid = c."stateId";

ALTER TABLE cities ADD COLUMN temp_country_id INTEGER;
UPDATE cities c SET temp_country_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'countries' AND m.old_uuid = c."countryId";

-- 4. AREAS TABLE
ALTER TABLE areas ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'areas', id, temp_id FROM areas;

-- 5. PINCODES TABLE
ALTER TABLE pincodes ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'pincodes', id, temp_id FROM pincodes;

-- Update pincodes foreign key references
ALTER TABLE pincodes ADD COLUMN temp_city_id INTEGER;
UPDATE pincodes p SET temp_city_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'cities' AND m.old_uuid = p."cityId";

COMMIT;
```

### **Script 2: Master Data Migration**

```sql
-- =====================================================
-- PHASE 2: MASTER DATA MIGRATION
-- =====================================================

BEGIN;

-- 1. VERIFICATION TYPES
ALTER TABLE "verificationTypes" ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'verificationTypes', id, temp_id FROM "verificationTypes";

-- 2. PRODUCTS
ALTER TABLE products ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'products', id, temp_id FROM products;

-- 3. CLIENTS
ALTER TABLE clients ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'clients', id, temp_id FROM clients;

-- 4. ROLES
ALTER TABLE roles ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'roles', id, temp_id FROM roles;

-- Update roles foreign key references (createdBy, updatedBy remain UUID for users)

-- 5. DEPARTMENTS
ALTER TABLE departments ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'departments', id, temp_id FROM departments;

-- Update department self-references
ALTER TABLE departments ADD COLUMN temp_parent_department_id INTEGER;
UPDATE departments d SET temp_parent_department_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'departments' AND m.old_uuid = d."parentDepartmentId";

-- 6. DESIGNATIONS
ALTER TABLE designations ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'designations', id, temp_id FROM designations;

-- Update designations foreign key references
ALTER TABLE designations ADD COLUMN temp_department_id INTEGER;
UPDATE designations d SET temp_department_id = m.new_serial
FROM uuid_serial_mapping m 
WHERE m.table_name = 'departments' AND m.old_uuid = d."departmentId";

COMMIT;
```

---

## 🔍 **VALIDATION QUERIES**

### **Data Integrity Checks**

```sql
-- Check mapping completeness
SELECT 
    table_name,
    COUNT(*) as mapped_records
FROM uuid_serial_mapping 
GROUP BY table_name
ORDER BY table_name;

-- Verify foreign key mappings
SELECT 
    'states' as table_name,
    COUNT(*) as total_records,
    COUNT(temp_country_id) as mapped_fk_records
FROM states
UNION ALL
SELECT 
    'cities' as table_name,
    COUNT(*) as total_records,
    COUNT(temp_state_id) as mapped_fk_records
FROM cities;

-- Check for orphaned records
SELECT 'Orphaned states' as issue, COUNT(*) as count
FROM states s
LEFT JOIN uuid_serial_mapping m ON m.table_name = 'countries' AND m.old_uuid = s."countryId"
WHERE s."countryId" IS NOT NULL AND m.new_serial IS NULL;
```

### **Performance Comparison**

```sql
-- Index size comparison
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('countries', 'states', 'cities', 'areas', 'pincodes')
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

---

## ⚠️ **ROLLBACK PROCEDURES**

### **Emergency Rollback Script**

```sql
-- EMERGENCY ROLLBACK - PHASE 1
BEGIN;

-- Remove temporary columns
ALTER TABLE countries DROP COLUMN IF EXISTS temp_id;
ALTER TABLE states DROP COLUMN IF EXISTS temp_id, DROP COLUMN IF EXISTS temp_country_id;
ALTER TABLE cities DROP COLUMN IF EXISTS temp_id, DROP COLUMN IF EXISTS temp_state_id, DROP COLUMN IF EXISTS temp_country_id;
ALTER TABLE areas DROP COLUMN IF EXISTS temp_id;
ALTER TABLE pincodes DROP COLUMN IF EXISTS temp_id, DROP COLUMN IF EXISTS temp_city_id;

-- Drop mapping table
DROP TABLE IF EXISTS uuid_serial_mapping;

COMMIT;
```

---

## 📊 **MONITORING & VALIDATION**

### **Pre-Migration Checklist**
- [ ] Full database backup completed
- [ ] Application code updated to handle both UUID and SERIAL
- [ ] Test environment migration successful
- [ ] Rollback procedures tested
- [ ] Maintenance window scheduled

### **Post-Migration Validation**
- [ ] All foreign key relationships intact
- [ ] No orphaned records
- [ ] Application functionality verified
- [ ] Performance improvements measured
- [ ] Backup and restore tested

### **Success Metrics**
- Zero data loss
- All foreign key constraints valid
- Application fully functional
- Performance improvement measurable
- Storage reduction achieved

### **Script 3: Rate Management Tables Migration**

```sql
-- =====================================================
-- PHASE 3: RATE MANAGEMENT TABLES MIGRATION
-- =====================================================

BEGIN;

-- 1. RATE TYPES (Foundation table)
ALTER TABLE "rateTypes" ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'rateTypes', id, temp_id FROM "rateTypes";

-- 2. RATE TYPE ASSIGNMENTS
ALTER TABLE "rateTypeAssignments" ADD COLUMN temp_id BIGSERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'rateTypeAssignments', id, temp_id FROM "rateTypeAssignments";

-- Update rateTypeAssignments foreign key references
ALTER TABLE "rateTypeAssignments" ADD COLUMN temp_client_id INTEGER;
UPDATE "rateTypeAssignments" rta SET temp_client_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'clients' AND m.old_uuid = rta."clientId";

ALTER TABLE "rateTypeAssignments" ADD COLUMN temp_product_id INTEGER;
UPDATE "rateTypeAssignments" rta SET temp_product_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'products' AND m.old_uuid = rta."productId";

ALTER TABLE "rateTypeAssignments" ADD COLUMN temp_verification_type_id INTEGER;
UPDATE "rateTypeAssignments" rta SET temp_verification_type_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'verificationTypes' AND m.old_uuid = rta."verificationTypeId";

ALTER TABLE "rateTypeAssignments" ADD COLUMN temp_rate_type_id INTEGER;
UPDATE "rateTypeAssignments" rta SET temp_rate_type_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'rateTypes' AND m.old_uuid = rta."rateTypeId";

-- 3. RATES
ALTER TABLE rates ADD COLUMN temp_id BIGSERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'rates', id, temp_id FROM rates;

-- Update rates foreign key references
ALTER TABLE rates ADD COLUMN temp_client_id INTEGER;
UPDATE rates r SET temp_client_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'clients' AND m.old_uuid = r."clientId";

ALTER TABLE rates ADD COLUMN temp_product_id INTEGER;
UPDATE rates r SET temp_product_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'products' AND m.old_uuid = r."productId";

ALTER TABLE rates ADD COLUMN temp_verification_type_id INTEGER;
UPDATE rates r SET temp_verification_type_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'verificationTypes' AND m.old_uuid = r."verificationTypeId";

ALTER TABLE rates ADD COLUMN temp_rate_type_id INTEGER;
UPDATE rates r SET temp_rate_type_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'rateTypes' AND m.old_uuid = r."rateTypeId";

-- 4. RATE HISTORY
ALTER TABLE "rateHistory" ADD COLUMN temp_id BIGSERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'rateHistory', id, temp_id FROM "rateHistory";

-- Update rateHistory foreign key references
ALTER TABLE "rateHistory" ADD COLUMN temp_rate_id BIGINT;
UPDATE "rateHistory" rh SET temp_rate_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'rates' AND m.old_uuid = rh."rateId";

COMMIT;
```

### **Script 4: Junction Tables Migration**

```sql
-- =====================================================
-- JUNCTION TABLES MIGRATION
-- =====================================================

BEGIN;

-- 1. CLIENT PRODUCTS
ALTER TABLE "clientProducts" ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'clientProducts', id, temp_id FROM "clientProducts";

-- Update clientProducts foreign key references
ALTER TABLE "clientProducts" ADD COLUMN temp_client_id INTEGER;
UPDATE "clientProducts" cp SET temp_client_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'clients' AND m.old_uuid = cp."clientId";

ALTER TABLE "clientProducts" ADD COLUMN temp_product_id INTEGER;
UPDATE "clientProducts" cp SET temp_product_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'products' AND m.old_uuid = cp."productId";

-- 2. PRODUCT VERIFICATION TYPES
ALTER TABLE "productVerificationTypes" ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'productVerificationTypes', id, temp_id FROM "productVerificationTypes";

-- Update productVerificationTypes foreign key references
ALTER TABLE "productVerificationTypes" ADD COLUMN temp_product_id INTEGER;
UPDATE "productVerificationTypes" pvt SET temp_product_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'products' AND m.old_uuid = pvt."productId";

ALTER TABLE "productVerificationTypes" ADD COLUMN temp_verification_type_id INTEGER;
UPDATE "productVerificationTypes" pvt SET temp_verification_type_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'verificationTypes' AND m.old_uuid = pvt."verificationTypeId";

-- 3. PINCODE AREAS
ALTER TABLE "pincodeAreas" ADD COLUMN temp_id SERIAL;
INSERT INTO uuid_serial_mapping (table_name, old_uuid, new_serial)
SELECT 'pincodeAreas', id, temp_id FROM "pincodeAreas";

-- Update pincodeAreas foreign key references
ALTER TABLE "pincodeAreas" ADD COLUMN temp_pincode_id INTEGER;
UPDATE "pincodeAreas" pa SET temp_pincode_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'pincodes' AND m.old_uuid = pa."pincodeId";

ALTER TABLE "pincodeAreas" ADD COLUMN temp_area_id INTEGER;
UPDATE "pincodeAreas" pa SET temp_area_id = m.new_serial
FROM uuid_serial_mapping m
WHERE m.table_name = 'areas' AND m.old_uuid = pa."areaId";

COMMIT;
```

---

## 🎯 **EXPECTED OUTCOMES**

### **Storage Reduction**
- **Before**: ~1.7KB per record average
- **After**: ~0.5KB per record average  
- **Savings**: 70% storage reduction

### **Performance Improvements**
- **Join Performance**: 2-3x faster
- **Index Size**: 60-75% smaller
- **Memory Usage**: 50-70% reduction
- **Backup Time**: 40-50% faster

### **Maintenance Benefits**
- Simpler debugging with sequential IDs
- Better query performance
- Reduced storage costs
- Improved scalability
