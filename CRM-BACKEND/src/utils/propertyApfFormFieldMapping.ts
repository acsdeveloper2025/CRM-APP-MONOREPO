/**
 * Property APF Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile Property APF form data
 * and database columns for Property APF verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile Property APF form fields to database columns
 */
export const PROPERTY_APF_FIELD_MAPPING: DatabaseFieldMapping = {
  // Basic form information
  'outcome': null, // Handled separately as verification_outcome
  'remarks': 'remarks',
  'finalStatus': 'final_status',
  
  // Address and location fields
  'addressLocatable': 'address_locatable',
  'addressRating': 'address_rating',
  'locality': 'locality',
  'addressStructure': 'address_structure',
  'addressFloor': 'address_floor',
  'addressStructureColor': 'address_structure_color',
  'doorColor': 'door_color',
  
  // Landmarks
  'landmark1': 'landmark1',
  'landmark2': 'landmark2',
  'landmark3': 'landmark3',
  'landmark4': 'landmark4',
  
  // Property-specific fields
  'propertyType': 'property_type',
  'propertyStatus': 'property_status',
  'propertyOwnership': 'property_ownership',
  'propertyAge': 'property_age',
  'propertyCondition': 'property_condition',
  'propertyArea': 'property_area',
  'propertyValue': 'property_value',
  'marketValue': 'market_value',
  
  // APF-specific fields
  'apfStatus': 'apf_status',
  'apfNumber': 'apf_number',
  'apfIssueDate': 'apf_issue_date',
  'apfExpiryDate': 'apf_expiry_date',
  'apfIssuingAuthority': 'apf_issuing_authority',
  'apfValidityStatus': 'apf_validity_status',
  'apfAmount': 'apf_amount',
  'apfUtilizedAmount': 'apf_utilized_amount',
  'apfBalanceAmount': 'apf_balance_amount',
  
  // Project details
  'projectName': 'project_name',
  'projectStatus': 'project_status',
  'projectApprovalStatus': 'project_approval_status',
  'projectCompletionPercentage': 'project_completion_percentage',
  'totalUnits': 'total_units',
  'completedUnits': 'completed_units',
  'soldUnits': 'sold_units',
  'availableUnits': 'available_units',
  'possessionStatus': 'possession_status',
  
  // Builder/Developer information
  'builderName': 'builder_name',
  'builderContact': 'builder_contact',
  'developerName': 'developer_name',
  'developerContact': 'developer_contact',
  'builderRegistrationNumber': 'builder_registration_number',
  'reraRegistrationNumber': 'rera_registration_number',
  
  // Financial details
  'loanAmount': 'loan_amount',
  'loanPurpose': 'loan_purpose',
  'loanStatus': 'loan_status',
  'bankName': 'bank_name',
  'loanAccountNumber': 'loan_account_number',
  'emiAmount': 'emi_amount',
  
  // Met person details
  'metPersonName': 'met_person_name',
  'metPersonDesignation': 'met_person_designation',
  'metPersonRelation': 'met_person_relation',
  'metPersonContact': 'met_person_contact',
  
  // Document verification
  'documentShownStatus': 'document_shown_status',
  'documentType': 'document_type',
  'documentVerificationStatus': 'document_verification_status',
  
  // Third Party Confirmation (TPC)
  'tpcMetPerson1': 'tpc_met_person1',
  'nameOfTpc1': 'tpc_name1',
  'tpcConfirmation1': 'tpc_confirmation1',
  'tpcMetPerson2': 'tpc_met_person2',
  'nameOfTpc2': 'tpc_name2',
  'tpcConfirmation2': 'tpc_confirmation2',
  
  // Shifted specific fields
  'shiftedPeriod': 'shifted_period',
  'currentLocation': 'current_location',
  'premisesStatus': 'premises_status',
  
  // Entry restricted specific fields
  'entryRestrictionReason': 'entry_restriction_reason',
  'securityPersonName': 'security_person_name',
  'securityConfirmation': 'security_confirmation',
  
  // Untraceable specific fields
  'contactPerson': 'contact_person',
  'callRemark': 'call_remark',
  
  // Legal and compliance
  'legalClearance': 'legal_clearance',
  'titleClearance': 'title_clearance',
  'encumbranceStatus': 'encumbrance_status',
  'litigationStatus': 'litigation_status',
  
  // Area and infrastructure
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'infrastructureStatus': 'infrastructure_status',
  'roadConnectivity': 'road_connectivity',
  
  // Observations and remarks
  'otherObservation': 'other_observation',
  'propertyConcerns': 'property_concerns',
  'financialConcerns': 'financial_concerns',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  
  // Legacy/alternative field names
  'metPerson': 'met_person_name', // Maps to met person name
  'companyName': 'builder_name', // Maps to builder name
  'projectDetails': 'project_name', // Maps to project name
  'propertyDetails': 'property_type', // Maps to property type
  'verificationMethod': null, // Derived field, ignore
  
  // Fields to ignore (UI state, images, etc.)
  'images': null,
  'selfieImages': null,
  'id': null,
  'caseId': null,
  'timestamp': null,
  'isValid': null,
  'errors': null,
};

/**
 * Maps mobile Property APF form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapPropertyApfFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = PROPERTY_APF_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processPropertyApfFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes Property APF field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processPropertyApfFieldValue(fieldName: string, value: any): any {
  // Handle null/undefined values
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle boolean fields
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle enum values - convert to string
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // If it's an enum object, return its string representation
    return String(value);
  }
  
  // Handle numeric fields
  const numericFields = [
    'propertyAge', 'projectCompletionPercentage', 'totalUnits', 'completedUnits', 
    'soldUnits', 'availableUnits'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle decimal fields
  const decimalFields = [
    'propertyArea', 'propertyValue', 'marketValue', 'apfAmount', 'apfUtilizedAmount',
    'apfBalanceAmount', 'loanAmount', 'emiAmount'
  ];
  
  if (decimalFields.includes(fieldName)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle date fields
  const dateFields = ['apfIssueDate', 'apfExpiryDate'];
  if (dateFields.includes(fieldName)) {
    if (value && typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    return null;
  }
  
  // Default: convert to string and trim
  return String(value).trim() || null;
}

/**
 * Gets all database columns that can be populated from Property APF form data
 * 
 * @returns Array of database column names
 */
export function getPropertyApfAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(PROPERTY_APF_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile Property APF form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getPropertyApfMappedMobileFields(): string[] {
  return Object.keys(PROPERTY_APF_FIELD_MAPPING)
    .filter(field => PROPERTY_APF_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in Property APF form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validatePropertyApfRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by Property APF form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'propertyType', 'propertyStatus',
      'metPersonName', 'metPersonDesignation', 'projectName', 'builderName',
      'apfStatus', 'propertyValue', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonDesignation',
      'shiftedPeriod', 'currentLocation', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonDesignation',
      'projectName', 'builderName', 'propertyType', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'ENTRY_RESTRICTED': [
      'addressLocatable', 'addressRating', 'entryRestrictionReason',
      'securityPersonName', 'securityConfirmation', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'UNTRACEABLE': [
      'contactPerson', 'callRemark', 'locality', 'landmark1', 'landmark2',
      'dominatedArea', 'otherObservation', 'finalStatus'
    ]
  };
  
  const requiredFields = requiredFieldsByType[formType] || [];
  
  // Check for missing required fields
  for (const field of requiredFields) {
    if (!formData[field] || formData[field] === null || formData[field] === '') {
      missingFields.push(field);
    }
  }
  
  // Check for conditional fields
  if (formType === 'POSITIVE') {
    if (formData.apfStatus === 'Available' && !formData.apfNumber) {
      warnings.push('apfNumber should be specified when APF is available');
    }
    if (formData.apfStatus === 'Available' && !formData.apfValidityStatus) {
      warnings.push('apfValidityStatus should be specified when APF is available');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.nameOfTpc1) {
      warnings.push('nameOfTpc1 should be specified when tpcMetPerson1 is Yes');
    }
    if (formData.totalUnits && !formData.completedUnits) {
      warnings.push('completedUnits should be specified when totalUnits is provided');
    }
    if (formData.loanAmount && !formData.bankName) {
      warnings.push('bankName should be specified when loanAmount is provided');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
