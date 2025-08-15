# Naming Convention Audit Report
## Comprehensive Analysis of snake_case Usage Across ACS Applications

### Executive Summary
This audit identifies all instances of snake_case naming across the three applications (acs-web, acs-backend, caseflow-mobile) and provides a detailed migration plan to standardize on camelCase naming conventions.

### Audit Findings

## 1. Database Schema (PostgreSQL)

### Tables with snake_case columns (136 instances):
- **Timestamp columns**: `created_at`, `updated_at` (present in almost all tables)
- **Foreign key columns**: `user_id`, `case_id`, `client_id`, `product_id`, `verification_type_id`, `department_id`, `designation_id`, `role_id`, `device_id`, `state_id`, `country_id`, `city_id`, `pincode_id`, `area_id`
- **Status columns**: `is_active`, `is_system_role`
- **Specific columns**: `original_name`, `file_path`, `file_size`, `mime_type`, `uploaded_by`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `form_data`, `retry_count`, `error_message`, `processed_at`, `case_number`, `applicant_name`, `applicant_phone`, `applicant_email`, `assigned_to`, `created_by`, `department_head_id`, `parent_department_id`, `updated_by`, `device_name`, `app_version`, `last_used`, `recorded_by`, `recorded_at`, `executed_at`, `company_name`, `verification_date`, `verification_time`, `person_met`, `office_confirmed`, `residence_confirmed`, `display_order`, `expires_at`, `last_login`

### Constraints with snake_case (211 instances):
- Primary keys: `*_pkey`
- Foreign keys: `*_fkey` 
- Unique constraints: `*_key`
- Check constraints: `chk_*`

### Indexes with snake_case (99 instances):
- Index names: `idx_*`
- Unique constraints: `uk_*`

### Views with snake_case:
- `user_details`

## 2. Backend API (acs-backend)

### TypeScript Interfaces and Types:
- **User types**: Mixed usage of camelCase and snake_case
- **API responses**: Database fields returned as snake_case
- **Query parameters**: Some using snake_case for database compatibility

### Controllers:
- **SQL queries**: Extensive use of snake_case column names
- **Response mapping**: Some controllers map snake_case to camelCase, others don't
- **Validation**: Mixed naming conventions

### Key Files with snake_case:
- `src/controllers/usersController.ts`: Heavy snake_case usage in SQL queries
- `src/controllers/rolesController.ts`: Database column references
- `src/controllers/statesController.ts`: Mixed mapping approaches
- `src/controllers/mobileLocationController.ts`: Snake_case in queries
- `src/controllers/mobileSyncController.ts`: Database field references

## 3. Frontend Web (acs-web)

### TypeScript Interfaces:
- **User types**: Dual field support (camelCase + snake_case)
- **API types**: Comments indicating "API uses snake_case"
- **Component usage**: Mixed usage depending on data source

### Key Files with snake_case:
- `src/types/user.ts`: Dual field definitions for API compatibility
- `src/components/users/*.tsx`: Mixed usage in date formatting and display

## 4. Mobile App (caseflow-mobile)

### Findings:
- **Minimal snake_case usage**: The mobile app appears to use primarily camelCase
- **Clean implementation**: Types and interfaces follow camelCase conventions
- **API integration**: Likely handles snake_case conversion at service layer

## Migration Strategy

### Phase 1: Database Schema Migration (High Priority)
1. **Create migration scripts** to rename all snake_case columns to camelCase
2. **Update constraints and indexes** to use camelCase naming
3. **Create backward compatibility views** during transition period
4. **Update stored procedures and functions**

### Phase 2: Backend API Updates (High Priority)
1. **Update all SQL queries** to use new camelCase column names
2. **Modify response mapping** to ensure consistent camelCase output
3. **Update validation schemas** to use camelCase field names
4. **Maintain backward compatibility** with dual field support

### Phase 3: Frontend Updates (Medium Priority)
1. **Remove dual field definitions** from TypeScript interfaces
2. **Update components** to use only camelCase field names
3. **Update API service calls** to expect camelCase responses

### Phase 4: Mobile App Updates (Low Priority)
1. **Verify API integration** uses camelCase consistently
2. **Update any remaining snake_case references**

## Risk Assessment

### High Risk:
- **Database migration**: Potential data loss or corruption
- **API breaking changes**: Could break existing integrations
- **Downtime requirements**: Database schema changes may require maintenance window

### Medium Risk:
- **Frontend compatibility**: Temporary display issues during transition
- **Testing coverage**: Ensuring all functionality works post-migration

### Low Risk:
- **Mobile app changes**: Minimal impact due to clean current implementation

## Rollback Strategy

1. **Database rollback scripts**: Prepared to revert column name changes
2. **Code version control**: Tagged releases for easy rollback
3. **Gradual deployment**: Phase-by-phase implementation with validation
4. **Monitoring**: Real-time monitoring during migration phases

## Timeline Estimate

- **Phase 1 (Database)**: 2-3 days
- **Phase 2 (Backend)**: 3-4 days  
- **Phase 3 (Frontend)**: 2-3 days
- **Phase 4 (Mobile)**: 1 day
- **Testing & Validation**: 2-3 days
- **Total**: 10-14 days

## Deliverables Created

### 1. Audit Documentation
- **NAMING_CONVENTION_AUDIT_REPORT.md**: Comprehensive audit findings and migration strategy
- **DATABASE_COLUMN_MAPPING.md**: Detailed mapping of all snake_case to camelCase transformations

### 2. Migration Scripts
- **20250815_standardize_naming_conventions.sql**: Main migration script to rename all columns
- **20250815_rollback_naming_conventions.sql**: Rollback script to revert changes if needed
- **20250815_create_compatibility_views.sql**: Backward compatibility views for transition period

### 3. Implementation Plan
- Detailed task breakdown with 10 phases
- Risk assessment and mitigation strategies
- Timeline estimates and resource requirements

## Key Findings Summary

### Database Schema Issues (High Priority)
- **136 snake_case columns** across 28 tables requiring renaming
- **211 constraints** with snake_case naming patterns
- **99 indexes** using snake_case conventions
- **1 view** requiring updates

### Backend API Issues (High Priority)
- Mixed usage of camelCase and snake_case in SQL queries
- Inconsistent response mapping between database and API
- Some controllers properly map snake_case to camelCase, others don't

### Frontend Issues (Medium Priority)
- Dual field definitions in TypeScript interfaces for API compatibility
- Mixed usage in components depending on data source
- Comments indicating "API uses snake_case" showing awareness of inconsistency

### Mobile App Issues (Low Priority)
- Minimal snake_case usage detected
- Clean camelCase implementation in most areas
- Likely handles conversion at service layer

## Recommendations

### Immediate Actions (Week 1)
1. **Execute database migration** in staging environment
2. **Test all API endpoints** to ensure functionality
3. **Update backend SQL queries** to use camelCase columns
4. **Implement response mapping standardization**

### Short-term Actions (Week 2-3)
1. **Update frontend TypeScript interfaces** to remove dual fields
2. **Update all frontend components** to use camelCase consistently
3. **Verify mobile app compatibility** with new API responses
4. **Comprehensive testing** of all user workflows

### Long-term Actions (Week 4+)
1. **Remove backward compatibility views** after transition period
2. **Update documentation** to reflect new naming conventions
3. **Establish coding standards** to prevent future inconsistencies
4. **Implement linting rules** to enforce camelCase usage

## Success Criteria

- [ ] All database columns use camelCase naming
- [ ] All API responses consistently use camelCase
- [ ] All frontend interfaces use camelCase
- [ ] All functionality works correctly after migration
- [ ] No performance degradation
- [ ] Backward compatibility maintained during transition
- [ ] Documentation updated to reflect changes

## Next Steps

1. **Review and approve** this migration plan
2. **Set up staging environment** for testing
3. **Execute Phase 1 (Database Migration)** using provided scripts
4. **Begin Phase 2 (Backend Updates)** with SQL query modifications
5. **Implement comprehensive testing** at each phase
6. **Deploy to production** with rollback plan ready
