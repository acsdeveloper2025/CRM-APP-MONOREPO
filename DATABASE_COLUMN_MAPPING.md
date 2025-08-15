# Database Column Mapping: snake_case → camelCase

## Universal Column Mappings (Applied to Multiple Tables)

### Timestamp Columns
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `executed_at` → `executedAt`
- `recorded_at` → `recordedAt`
- `processed_at` → `processedAt`
- `last_used` → `lastUsed`
- `last_login` → `lastLogin`
- `expires_at` → `expiresAt`

### Foreign Key Columns
- `user_id` → `userId`
- `case_id` → `caseId`
- `client_id` → `clientId`
- `product_id` → `productId`
- `verification_type_id` → `verificationTypeId`
- `department_id` → `departmentId`
- `designation_id` → `designationId`
- `role_id` → `roleId`
- `device_id` → `deviceId`
- `state_id` → `stateId`
- `country_id` → `countryId`
- `city_id` → `cityId`
- `pincode_id` → `pincodeId`
- `area_id` → `areaId`

### Status/Boolean Columns
- `is_active` → `isActive`
- `is_system_role` → `isSystemRole`

### User/Audit Columns
- `created_by` → `createdBy`
- `updated_by` → `updatedBy`
- `uploaded_by` → `uploadedBy`
- `assigned_to` → `assignedTo`
- `recorded_by` → `recordedBy`

## Table-Specific Column Mappings

### attachments
- `original_name` → `originalName`
- `file_path` → `filePath`
- `file_size` → `fileSize`
- `mime_type` → `mimeType`

### audit_logs
- `entity_type` → `entityType`
- `entity_id` → `entityId`
- `old_values` → `oldValues`
- `new_values` → `newValues`
- `ip_address` → `ipAddress`
- `user_agent` → `userAgent`

### auto_saves
- `form_data` → `formData`

### background_sync_queue
- `entity_type` → `entityType`
- `entity_data` → `entityData`
- `retry_count` → `retryCount`
- `error_message` → `errorMessage`

### cases
- `case_number` → `caseNumber`
- `applicant_name` → `applicantName`
- `applicant_phone` → `applicantPhone`
- `applicant_email` → `applicantEmail`

### departments
- `department_head_id` → `departmentHeadId`
- `parent_department_id` → `parentDepartmentId`

### devices
- `device_name` → `deviceName`
- `app_version` → `appVersion`

### office_verification_reports
- `company_name` → `companyName`
- `verification_date` → `verificationDate`
- `verification_time` → `verificationTime`
- `person_met` → `personMet`
- `office_confirmed` → `officeConfirmed`

### pincode_areas
- `display_order` → `displayOrder`

### residence_verification_reports
- `applicant_name` → `applicantName`
- `verification_date` → `verificationDate`
- `verification_time` → `verificationTime`
- `person_met` → `personMet`
- `residence_confirmed` → `residenceConfirmed`

## Constraint Naming Mappings

### Primary Key Constraints
- `{table}_pkey` → `pk_{table}`

### Foreign Key Constraints
- `{table}_{column}_fkey` → `fk_{table}_{camelCaseColumn}`

### Unique Constraints
- `{table}_{column}_key` → `uk_{table}_{camelCaseColumn}`

### Check Constraints
- `chk_{table}_{description}` → `chk_{table}_{camelCaseDescription}`

## Index Naming Mappings

### Standard Indexes
- `idx_{table}_{column}` → `idx_{table}_{camelCaseColumn}`

### Unique Indexes
- `uk_{table}_{description}` → `uk_{table}_{camelCaseDescription}`

## View Mappings

### Views to Update
- `user_details` → `userDetails`

## Migration Script Structure

```sql
-- Example migration for users table
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE users RENAME COLUMN is_active TO "isActive";
ALTER TABLE users RENAME COLUMN last_login TO "lastLogin";
ALTER TABLE users RENAME COLUMN role_id TO "roleId";
ALTER TABLE users RENAME COLUMN department_id TO "departmentId";
ALTER TABLE users RENAME COLUMN device_id TO "deviceId";
ALTER TABLE users RENAME COLUMN designation_id TO "designationId";

-- Update constraints
ALTER TABLE users RENAME CONSTRAINT users_pkey TO pk_users;
ALTER TABLE users RENAME CONSTRAINT fk_users_role TO fk_users_roleId;
-- ... etc
```

## Backward Compatibility Views

```sql
-- Create view for backward compatibility
CREATE VIEW users_legacy AS
SELECT 
    id,
    name,
    username,
    email,
    role,
    "roleId" as role_id,
    "departmentId" as department_id,
    "deviceId" as device_id,
    "designationId" as designation_id,
    "isActive" as is_active,
    "lastLogin" as last_login,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM users;
```

## Implementation Priority

### High Priority (Core Tables)
1. users
2. cases  
3. clients
4. attachments
5. audit_logs

### Medium Priority (Reference Tables)
1. roles
2. departments
3. designations
4. products
5. verification_types

### Low Priority (Location/Utility Tables)
1. countries
2. states
3. cities
4. pincodes
5. areas
6. devices
7. refresh_tokens

## Validation Checklist

- [ ] All snake_case columns identified
- [ ] camelCase mappings defined
- [ ] Constraint renaming planned
- [ ] Index renaming planned
- [ ] Backward compatibility views designed
- [ ] Migration scripts prepared
- [ ] Rollback scripts prepared
- [ ] Testing strategy defined
