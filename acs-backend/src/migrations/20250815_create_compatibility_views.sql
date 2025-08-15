-- Migration: Create Backward Compatibility Views
-- Description: Create views that map old snake_case names to new camelCase names for transition period
-- Created: 2025-08-15

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS FOR CORE TABLES
-- ============================================================================

-- Users Legacy View
CREATE VIEW users_legacy AS
SELECT 
    id,
    name,
    username,
    email,
    role,
    "employeeId",
    designation,
    phone,
    "roleId" as role_id,
    "departmentId" as department_id,
    "deviceId" as device_id,
    "designationId" as designation_id,
    "isActive" as is_active,
    "lastLogin" as last_login,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM users;

-- Cases Legacy View
CREATE VIEW cases_legacy AS
SELECT 
    id,
    title,
    description,
    status,
    priority,
    "caseNumber" as case_number,
    "clientId" as client_id,
    "productId" as product_id,
    "verificationTypeId" as verification_type_id,
    "applicantName" as applicant_name,
    "applicantPhone" as applicant_phone,
    "applicantEmail" as applicant_email,
    "cityId" as city_id,
    "assignedTo" as assigned_to,
    "createdBy" as created_by,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM cases;

-- Clients Legacy View
CREATE VIEW clients_legacy AS
SELECT 
    id,
    name,
    code,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM clients;

-- Attachments Legacy View
CREATE VIEW attachments_legacy AS
SELECT 
    id,
    name,
    type,
    url,
    "caseId" as case_id,
    "originalName" as original_name,
    "filePath" as file_path,
    "fileSize" as file_size,
    "mimeType" as mime_type,
    "uploadedBy" as uploaded_by,
    "createdAt" as created_at
FROM attachments;

-- Audit Logs Legacy View
CREATE VIEW audit_logs_legacy AS
SELECT 
    id,
    action,
    "userId" as user_id,
    "entityType" as entity_type,
    "entityId" as entity_id,
    "oldValues" as old_values,
    "newValues" as new_values,
    "ipAddress" as ip_address,
    "userAgent" as user_agent,
    "createdAt" as created_at
FROM audit_logs;

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS FOR REFERENCE TABLES
-- ============================================================================

-- Roles Legacy View
CREATE VIEW roles_legacy AS
SELECT 
    id,
    name,
    description,
    permissions,
    "isSystemRole" as is_system_role,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at,
    "createdBy" as created_by,
    "updatedBy" as updated_by
FROM roles;

-- Departments Legacy View
CREATE VIEW departments_legacy AS
SELECT 
    id,
    name,
    description,
    "departmentHeadId" as department_head_id,
    "parentDepartmentId" as parent_department_id,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at,
    "createdBy" as created_by,
    "updatedBy" as updated_by
FROM departments;

-- Designations Legacy View
CREATE VIEW designations_legacy AS
SELECT 
    id,
    name,
    description,
    "departmentId" as department_id,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at,
    "createdBy" as created_by,
    "updatedBy" as updated_by
FROM designations;

-- Products Legacy View
CREATE VIEW products_legacy AS
SELECT 
    id,
    name,
    code,
    description,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM products;

-- Verification Types Legacy View
CREATE VIEW verification_types_legacy AS
SELECT 
    id,
    name,
    code,
    description,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM verification_types;

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS FOR LOCATION TABLES
-- ============================================================================

-- Countries Legacy View
CREATE VIEW countries_legacy AS
SELECT 
    id,
    name,
    code,
    continent,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM countries;

-- States Legacy View
CREATE VIEW states_legacy AS
SELECT 
    id,
    name,
    code,
    "countryId" as country_id,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM states;

-- Cities Legacy View
CREATE VIEW cities_legacy AS
SELECT 
    id,
    name,
    "stateId" as state_id,
    "countryId" as country_id,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM cities;

-- Pincodes Legacy View
CREATE VIEW pincodes_legacy AS
SELECT 
    id,
    code,
    "cityId" as city_id,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM pincodes;

-- Areas Legacy View
CREATE VIEW areas_legacy AS
SELECT 
    id,
    name,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM areas;

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS FOR UTILITY TABLES
-- ============================================================================

-- Devices Legacy View
CREATE VIEW devices_legacy AS
SELECT 
    id,
    "userId" as user_id,
    "deviceId" as device_id,
    "deviceName" as device_name,
    platform,
    "appVersion" as app_version,
    "isActive" as is_active,
    "lastUsed" as last_used,
    "createdAt" as created_at
FROM devices;

-- Refresh Tokens Legacy View
CREATE VIEW refresh_tokens_legacy AS
SELECT 
    id,
    token,
    "userId" as user_id,
    "expiresAt" as expires_at,
    "createdAt" as created_at,
    "deviceId" as device_id
FROM refresh_tokens;

-- Auto Saves Legacy View
CREATE VIEW auto_saves_legacy AS
SELECT 
    id,
    "caseId" as case_id,
    "userId" as user_id,
    "formData" as form_data,
    "createdAt" as created_at
FROM auto_saves;

-- Background Sync Queue Legacy View
CREATE VIEW background_sync_queue_legacy AS
SELECT 
    id,
    "userId" as user_id,
    "entityType" as entity_type,
    "entityData" as entity_data,
    status,
    "retryCount" as retry_count,
    "errorMessage" as error_message,
    "createdAt" as created_at,
    "processedAt" as processed_at
FROM background_sync_queue;

-- Locations Legacy View
CREATE VIEW locations_legacy AS
SELECT 
    id,
    latitude,
    longitude,
    accuracy,
    timestamp,
    source,
    "caseId" as case_id,
    "recordedBy" as recorded_by,
    "recordedAt" as recorded_at
FROM locations;

-- Notification Tokens Legacy View
CREATE VIEW notification_tokens_legacy AS
SELECT 
    id,
    token,
    "userId" as user_id,
    platform,
    "isActive" as is_active,
    "createdAt" as created_at
FROM notification_tokens;

-- Office Verification Reports Legacy View
CREATE VIEW office_verification_reports_legacy AS
SELECT 
    id,
    "caseId" as case_id,
    "companyName" as company_name,
    address,
    "verificationDate" as verification_date,
    "verificationTime" as verification_time,
    "personMet" as person_met,
    designation,
    "officeConfirmed" as office_confirmed,
    remarks,
    "createdBy" as created_by,
    "createdAt" as created_at
FROM office_verification_reports;

-- Residence Verification Reports Legacy View
CREATE VIEW residence_verification_reports_legacy AS
SELECT 
    id,
    "caseId" as case_id,
    "applicantName" as applicant_name,
    address,
    "verificationDate" as verification_date,
    "verificationTime" as verification_time,
    "personMet" as person_met,
    relationship,
    "residenceConfirmed" as residence_confirmed,
    remarks,
    "createdBy" as created_by,
    "createdAt" as created_at
FROM residence_verification_reports;

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEWS FOR JUNCTION TABLES
-- ============================================================================

-- Client Products Legacy View
CREATE VIEW client_products_legacy AS
SELECT 
    id,
    "clientId" as client_id,
    "productId" as product_id,
    "createdAt" as created_at
FROM client_products;

-- Client Verification Types Legacy View
CREATE VIEW client_verification_types_legacy AS
SELECT 
    id,
    "clientId" as client_id,
    "verificationTypeId" as verification_type_id,
    "createdAt" as created_at
FROM client_verification_types;

-- Product Verification Types Legacy View
CREATE VIEW product_verification_types_legacy AS
SELECT 
    id,
    "productId" as product_id,
    "verificationTypeId" as verification_type_id,
    "createdAt" as created_at
FROM product_verification_types;

-- Pincode Areas Legacy View
CREATE VIEW pincode_areas_legacy AS
SELECT 
    id,
    "pincodeId" as pincode_id,
    "areaId" as area_id,
    "displayOrder" as display_order,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM pincode_areas;

-- ============================================================================
-- GRANT PERMISSIONS ON ALL LEGACY VIEWS
-- ============================================================================

GRANT SELECT ON users_legacy TO acs_user;
GRANT SELECT ON cases_legacy TO acs_user;
GRANT SELECT ON clients_legacy TO acs_user;
GRANT SELECT ON attachments_legacy TO acs_user;
GRANT SELECT ON audit_logs_legacy TO acs_user;
GRANT SELECT ON roles_legacy TO acs_user;
GRANT SELECT ON departments_legacy TO acs_user;
GRANT SELECT ON designations_legacy TO acs_user;
GRANT SELECT ON products_legacy TO acs_user;
GRANT SELECT ON verification_types_legacy TO acs_user;
GRANT SELECT ON countries_legacy TO acs_user;
GRANT SELECT ON states_legacy TO acs_user;
GRANT SELECT ON cities_legacy TO acs_user;
GRANT SELECT ON pincodes_legacy TO acs_user;
GRANT SELECT ON areas_legacy TO acs_user;
GRANT SELECT ON devices_legacy TO acs_user;
GRANT SELECT ON refresh_tokens_legacy TO acs_user;
GRANT SELECT ON auto_saves_legacy TO acs_user;
GRANT SELECT ON background_sync_queue_legacy TO acs_user;
GRANT SELECT ON locations_legacy TO acs_user;
GRANT SELECT ON notification_tokens_legacy TO acs_user;
GRANT SELECT ON office_verification_reports_legacy TO acs_user;
GRANT SELECT ON residence_verification_reports_legacy TO acs_user;
GRANT SELECT ON client_products_legacy TO acs_user;
GRANT SELECT ON client_verification_types_legacy TO acs_user;
GRANT SELECT ON product_verification_types_legacy TO acs_user;
GRANT SELECT ON pincode_areas_legacy TO acs_user;

-- Log migration completion
INSERT INTO migrations (filename, "executedAt") 
VALUES ('20250815_create_compatibility_views.sql', CURRENT_TIMESTAMP);
