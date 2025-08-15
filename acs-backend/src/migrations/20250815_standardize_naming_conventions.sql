-- Migration: Standardize Naming Conventions (snake_case → camelCase)
-- Description: Rename all database columns, constraints, and indexes to use camelCase naming
-- Created: 2025-08-15

-- ============================================================================
-- PHASE 1: CORE TABLES (users, cases, clients, attachments, audit_logs)
-- ============================================================================

-- Users Table
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE users RENAME COLUMN is_active TO "isActive";
ALTER TABLE users RENAME COLUMN last_login TO "lastLogin";
ALTER TABLE users RENAME COLUMN role_id TO "roleId";
ALTER TABLE users RENAME COLUMN department_id TO "departmentId";
ALTER TABLE users RENAME COLUMN device_id TO "deviceId";
ALTER TABLE users RENAME COLUMN designation_id TO "designationId";

-- Cases Table
ALTER TABLE cases RENAME COLUMN case_number TO "caseNumber";
ALTER TABLE cases RENAME COLUMN client_id TO "clientId";
ALTER TABLE cases RENAME COLUMN product_id TO "productId";
ALTER TABLE cases RENAME COLUMN verification_type_id TO "verificationTypeId";
ALTER TABLE cases RENAME COLUMN applicant_name TO "applicantName";
ALTER TABLE cases RENAME COLUMN applicant_phone TO "applicantPhone";
ALTER TABLE cases RENAME COLUMN applicant_email TO "applicantEmail";
ALTER TABLE cases RENAME COLUMN city_id TO "cityId";
ALTER TABLE cases RENAME COLUMN assigned_to TO "assignedTo";
ALTER TABLE cases RENAME COLUMN created_by TO "createdBy";
ALTER TABLE cases RENAME COLUMN created_at TO "createdAt";
ALTER TABLE cases RENAME COLUMN updated_at TO "updatedAt";

-- Clients Table
ALTER TABLE clients RENAME COLUMN is_active TO "isActive";
ALTER TABLE clients RENAME COLUMN created_at TO "createdAt";
ALTER TABLE clients RENAME COLUMN updated_at TO "updatedAt";

-- Attachments Table
ALTER TABLE attachments RENAME COLUMN case_id TO "caseId";
ALTER TABLE attachments RENAME COLUMN original_name TO "originalName";
ALTER TABLE attachments RENAME COLUMN file_path TO "filePath";
ALTER TABLE attachments RENAME COLUMN file_size TO "fileSize";
ALTER TABLE attachments RENAME COLUMN mime_type TO "mimeType";
ALTER TABLE attachments RENAME COLUMN uploaded_by TO "uploadedBy";
ALTER TABLE attachments RENAME COLUMN created_at TO "createdAt";

-- Audit Logs Table
ALTER TABLE audit_logs RENAME COLUMN user_id TO "userId";
ALTER TABLE audit_logs RENAME COLUMN entity_type TO "entityType";
ALTER TABLE audit_logs RENAME COLUMN entity_id TO "entityId";
ALTER TABLE audit_logs RENAME COLUMN old_values TO "oldValues";
ALTER TABLE audit_logs RENAME COLUMN new_values TO "newValues";
ALTER TABLE audit_logs RENAME COLUMN ip_address TO "ipAddress";
ALTER TABLE audit_logs RENAME COLUMN user_agent TO "userAgent";
ALTER TABLE audit_logs RENAME COLUMN created_at TO "createdAt";

-- ============================================================================
-- PHASE 2: REFERENCE TABLES (roles, departments, designations, products, verification_types)
-- ============================================================================

-- Roles Table
ALTER TABLE roles RENAME COLUMN is_system_role TO "isSystemRole";
ALTER TABLE roles RENAME COLUMN is_active TO "isActive";
ALTER TABLE roles RENAME COLUMN created_at TO "createdAt";
ALTER TABLE roles RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE roles RENAME COLUMN created_by TO "createdBy";
ALTER TABLE roles RENAME COLUMN updated_by TO "updatedBy";

-- Departments Table
ALTER TABLE departments RENAME COLUMN department_head_id TO "departmentHeadId";
ALTER TABLE departments RENAME COLUMN parent_department_id TO "parentDepartmentId";
ALTER TABLE departments RENAME COLUMN is_active TO "isActive";
ALTER TABLE departments RENAME COLUMN created_at TO "createdAt";
ALTER TABLE departments RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE departments RENAME COLUMN created_by TO "createdBy";
ALTER TABLE departments RENAME COLUMN updated_by TO "updatedBy";

-- Designations Table
ALTER TABLE designations RENAME COLUMN department_id TO "departmentId";
ALTER TABLE designations RENAME COLUMN is_active TO "isActive";
ALTER TABLE designations RENAME COLUMN created_at TO "createdAt";
ALTER TABLE designations RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE designations RENAME COLUMN created_by TO "createdBy";
ALTER TABLE designations RENAME COLUMN updated_by TO "updatedBy";

-- Products Table
ALTER TABLE products RENAME COLUMN is_active TO "isActive";
ALTER TABLE products RENAME COLUMN created_at TO "createdAt";
ALTER TABLE products RENAME COLUMN updated_at TO "updatedAt";

-- Verification Types Table
ALTER TABLE verification_types RENAME COLUMN is_active TO "isActive";
ALTER TABLE verification_types RENAME COLUMN created_at TO "createdAt";
ALTER TABLE verification_types RENAME COLUMN updated_at TO "updatedAt";

-- ============================================================================
-- PHASE 3: LOCATION TABLES (countries, states, cities, pincodes, areas)
-- ============================================================================

-- Countries Table
ALTER TABLE countries RENAME COLUMN created_at TO "createdAt";
ALTER TABLE countries RENAME COLUMN updated_at TO "updatedAt";

-- States Table
ALTER TABLE states RENAME COLUMN country_id TO "countryId";
ALTER TABLE states RENAME COLUMN created_at TO "createdAt";
ALTER TABLE states RENAME COLUMN updated_at TO "updatedAt";

-- Cities Table
ALTER TABLE cities RENAME COLUMN state_id TO "stateId";
ALTER TABLE cities RENAME COLUMN country_id TO "countryId";
ALTER TABLE cities RENAME COLUMN created_at TO "createdAt";
ALTER TABLE cities RENAME COLUMN updated_at TO "updatedAt";

-- Pincodes Table
ALTER TABLE pincodes RENAME COLUMN city_id TO "cityId";
ALTER TABLE pincodes RENAME COLUMN created_at TO "createdAt";
ALTER TABLE pincodes RENAME COLUMN updated_at TO "updatedAt";

-- Areas Table
ALTER TABLE areas RENAME COLUMN created_at TO "createdAt";
ALTER TABLE areas RENAME COLUMN updated_at TO "updatedAt";

-- ============================================================================
-- PHASE 4: UTILITY TABLES (devices, refresh_tokens, etc.)
-- ============================================================================

-- Devices Table
ALTER TABLE devices RENAME COLUMN user_id TO "userId";
ALTER TABLE devices RENAME COLUMN device_id TO "deviceId";
ALTER TABLE devices RENAME COLUMN device_name TO "deviceName";
ALTER TABLE devices RENAME COLUMN app_version TO "appVersion";
ALTER TABLE devices RENAME COLUMN is_active TO "isActive";
ALTER TABLE devices RENAME COLUMN last_used TO "lastUsed";
ALTER TABLE devices RENAME COLUMN created_at TO "createdAt";

-- Refresh Tokens Table
ALTER TABLE refresh_tokens RENAME COLUMN user_id TO "userId";
ALTER TABLE refresh_tokens RENAME COLUMN expires_at TO "expiresAt";
ALTER TABLE refresh_tokens RENAME COLUMN created_at TO "createdAt";
ALTER TABLE refresh_tokens RENAME COLUMN device_id TO "deviceId";

-- Auto Saves Table
ALTER TABLE auto_saves RENAME COLUMN case_id TO "caseId";
ALTER TABLE auto_saves RENAME COLUMN user_id TO "userId";
ALTER TABLE auto_saves RENAME COLUMN form_data TO "formData";
ALTER TABLE auto_saves RENAME COLUMN created_at TO "createdAt";

-- Background Sync Queue Table
ALTER TABLE background_sync_queue RENAME COLUMN user_id TO "userId";
ALTER TABLE background_sync_queue RENAME COLUMN entity_type TO "entityType";
ALTER TABLE background_sync_queue RENAME COLUMN entity_data TO "entityData";
ALTER TABLE background_sync_queue RENAME COLUMN retry_count TO "retryCount";
ALTER TABLE background_sync_queue RENAME COLUMN error_message TO "errorMessage";
ALTER TABLE background_sync_queue RENAME COLUMN created_at TO "createdAt";
ALTER TABLE background_sync_queue RENAME COLUMN processed_at TO "processedAt";

-- Locations Table
ALTER TABLE locations RENAME COLUMN case_id TO "caseId";
ALTER TABLE locations RENAME COLUMN recorded_by TO "recordedBy";
ALTER TABLE locations RENAME COLUMN recorded_at TO "recordedAt";

-- Migrations Table
ALTER TABLE migrations RENAME COLUMN executed_at TO "executedAt";

-- Notification Tokens Table
ALTER TABLE notification_tokens RENAME COLUMN user_id TO "userId";
ALTER TABLE notification_tokens RENAME COLUMN is_active TO "isActive";
ALTER TABLE notification_tokens RENAME COLUMN created_at TO "createdAt";

-- Office Verification Reports Table
ALTER TABLE office_verification_reports RENAME COLUMN case_id TO "caseId";
ALTER TABLE office_verification_reports RENAME COLUMN company_name TO "companyName";
ALTER TABLE office_verification_reports RENAME COLUMN verification_date TO "verificationDate";
ALTER TABLE office_verification_reports RENAME COLUMN verification_time TO "verificationTime";
ALTER TABLE office_verification_reports RENAME COLUMN person_met TO "personMet";
ALTER TABLE office_verification_reports RENAME COLUMN office_confirmed TO "officeConfirmed";
ALTER TABLE office_verification_reports RENAME COLUMN created_by TO "createdBy";
ALTER TABLE office_verification_reports RENAME COLUMN created_at TO "createdAt";

-- Residence Verification Reports Table
ALTER TABLE residence_verification_reports RENAME COLUMN case_id TO "caseId";
ALTER TABLE residence_verification_reports RENAME COLUMN applicant_name TO "applicantName";
ALTER TABLE residence_verification_reports RENAME COLUMN verification_date TO "verificationDate";
ALTER TABLE residence_verification_reports RENAME COLUMN verification_time TO "verificationTime";
ALTER TABLE residence_verification_reports RENAME COLUMN person_met TO "personMet";
ALTER TABLE residence_verification_reports RENAME COLUMN residence_confirmed TO "residenceConfirmed";
ALTER TABLE residence_verification_reports RENAME COLUMN created_by TO "createdBy";
ALTER TABLE residence_verification_reports RENAME COLUMN created_at TO "createdAt";

-- ============================================================================
-- PHASE 5: JUNCTION TABLES
-- ============================================================================

-- Client Products Table
ALTER TABLE client_products RENAME COLUMN client_id TO "clientId";
ALTER TABLE client_products RENAME COLUMN product_id TO "productId";
ALTER TABLE client_products RENAME COLUMN created_at TO "createdAt";

-- Client Verification Types Table
ALTER TABLE client_verification_types RENAME COLUMN client_id TO "clientId";
ALTER TABLE client_verification_types RENAME COLUMN verification_type_id TO "verificationTypeId";
ALTER TABLE client_verification_types RENAME COLUMN created_at TO "createdAt";

-- Product Verification Types Table
ALTER TABLE product_verification_types RENAME COLUMN product_id TO "productId";
ALTER TABLE product_verification_types RENAME COLUMN verification_type_id TO "verificationTypeId";
ALTER TABLE product_verification_types RENAME COLUMN created_at TO "createdAt";

-- Pincode Areas Table
ALTER TABLE pincode_areas RENAME COLUMN pincode_id TO "pincodeId";
ALTER TABLE pincode_areas RENAME COLUMN area_id TO "areaId";
ALTER TABLE pincode_areas RENAME COLUMN display_order TO "displayOrder";
ALTER TABLE pincode_areas RENAME COLUMN created_at TO "createdAt";
ALTER TABLE pincode_areas RENAME COLUMN updated_at TO "updatedAt";

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

-- ============================================================================
-- UPDATE CHECK CONSTRAINTS TO USE NEW COLUMN NAMES
-- ============================================================================

-- Update users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
  CHECK (role IN ('ADMIN', 'MANAGER', 'FIELD', 'VIEWER', 'BACKEND', 'USER'));

-- ============================================================================
-- UPDATE VIEWS TO USE NEW COLUMN NAMES
-- ============================================================================

-- Drop and recreate user_details view with camelCase columns
DROP VIEW IF EXISTS user_details;
CREATE VIEW user_details AS
SELECT
    u.id,
    u.name,
    u.username,
    u.email,
    u.role,
    u."roleId",
    r.name as role_name,
    u."departmentId",
    d.name as department_name,
    u."designationId",
    des.name as designation_name,
    u."employeeId",
    u.designation,
    u.phone,
    u."deviceId",
    u."isActive",
    u."lastLogin",
    u."createdAt",
    u."updatedAt"
FROM users u
LEFT JOIN roles r ON r.id = u."roleId"
LEFT JOIN departments d ON d.id = u."departmentId"
LEFT JOIN designations des ON des.id = u."designationId";

-- Grant permissions on the updated view
GRANT SELECT ON user_details TO acs_user;

-- Log migration completion
INSERT INTO migrations (filename, "executedAt")
VALUES ('20250815_standardize_naming_conventions.sql', CURRENT_TIMESTAMP);
