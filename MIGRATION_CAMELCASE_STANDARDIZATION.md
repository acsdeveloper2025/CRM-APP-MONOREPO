# ACS System CamelCase Standardization - Final Migration Document

Date: 2025-08-16
Author: Augment Agent (Augment Code)

## Scope
Complete camelCase standardization across:
- PostgreSQL schema
- Backend APIs (Node.js/Express)
- Mobile app (caseflow-mobile React Native)

## 1. Database Schema Changes

### 1.1 Devices Table Column Transformations
Executed migration: `acs-backend/src/migrations/20250816_standardize_devices_table_columns.sql`

Renames performed (snake/mixed → camelCase):
- approvedat → "approvedAt"
- approvedby → "approvedBy"
- authcode → "authCode"
- authcodeexpiresat → "authCodeExpiresAt"
- isapproved → "isApproved"
- lastactiveat → "lastActiveAt"
- notificationpreferences → "notificationPreferences"
- notificationsenabled → "notificationsEnabled"
- osversion → "osVersion"
- pushtoken → "pushToken"
- registeredat → "registeredAt"
- rejectedat → "rejectedAt"
- rejectedby → "rejectedBy"
- rejectionreason → "rejectionReason"

Duplicate legacy flag handling:
- If legacy `isactive` existed, its values were copied into "isActive" where NULL, then `isactive` was dropped.

### 1.2 Other Tables
- Verified public schema: only legacy view/table `user_details` had snake_case columns; not used by backend. Optional cleanup: drop the view/table if present.
- Junction tables (e.g., pincode_areas) remain snake_case table names by design, but all column names are camelCase in new code and aliases.

## 2. Backend API Changes

- Controllers/services updated to use camelCase exclusively in SQL, aliases, and payloads:
  - rolesController: createdByName, updatedByName, userCount
  - usersController: roleName, roleDescription, rolePermissions, departmentName, departmentDescription; user stats totalUsers/activeUsers/inactiveUsers
  - designationsController: departmentName, createdByName, updatedByName
  - authController: roleName, rolePermissions, departmentName
  - middleware/auth: roleName
  - statesController: cityCount
  - citiesController: pincodeCount
  - areasController: usageCount
  - deviceAuthLogger: successCount, failureCount
  - mobileAuthController: devices table fields updated to new camelCase: osVersion, pushToken, isActive, lastActiveAt, isApproved, authCode, authCodeExpiresAt, registeredAt; joins on users use employeeId; routes mounted at /api/mobile

- Migrations runner updated to load all .sql files dynamically from dist/migrations.

## 3. Mobile App Changes (caseflow-mobile)

- CamelCase enforcement across app:
  - ImageCapture reverse geocoding: displayName handling adjusted
  - Local storage keys renamed to camelCase:
    - deviceId (was device_id)
    - refreshToken (was refresh_token)
    - accessToken (was access_token)
    - tokenExpiresAt (was token_expires_at)
    - tokenType (was token_type)
    - caseflowCases (was caseflow_cases)
    - casePriorities (was case_priorities)
    - syncQueue (was sync_queue)
  - Removed legacy keys like auth_token references
  - API payloads already camelCase; verified ApiClient passes camelCase bodies and expects camelCase responses

## 4. API Payload Changes

- All response objects now contain camelCase properties (e.g., createdByName, departmentName, userCount, roleName, device fields)
- Mobile auth/login expects deviceInfo: { platform, version, model }, and deviceId

## 5. Breaking Changes

- Any client referencing snake_case response fields or local storage keys will break. Ensure clients use camelCase as documented above.
- Legacy `user_details` view/table if used externally should be updated or dropped.

## 6. Rollback Procedures

- Database: restore from backup or manually reverse renames (rename camelCase back to legacy). Since migration is idempotent and recorded, prefer DB snapshot rollback.
- Backend: revert corresponding git commits to restore previous aliases and snake_case support.
- Mobile: revert commits changing keys and re-build.

## 7. Validation

- Backend health endpoint OK
- Migrations show "No pending migrations" after applying devices migration
- Builds: backend (npm run build) and mobile app (npm run build) succeed
- Manual curl of /api/mobile/auth/login returns 401 for invalid creds; route wiring verified (under /api/mobile)

## 8. Next Steps

- Drop `user_details` legacy view/table if confirmed unused
- Update external API docs (OpenAPI) to reflect camelCase fields
- Notify field users to update mobile apps (local storage keys changed)

