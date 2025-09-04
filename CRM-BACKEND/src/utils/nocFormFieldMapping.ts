/**
 * NOC Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile NOC form data
 * and database columns for NOC verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile NOC form fields to database columns
 */
export const NOC_FIELD_MAPPING: DatabaseFieldMapping = {
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
  
  // NOC-specific fields
  'nocStatus': 'noc_status',
  'nocType': 'noc_type',
  'nocNumber': 'noc_number',
  'nocIssueDate': 'noc_issue_date',
  'nocExpiryDate': 'noc_expiry_date',
  'nocIssuingAuthority': 'noc_issuing_authority',
  'nocValidityStatus': 'noc_validity_status',
  
  // Property/Project details
  'propertyType': 'property_type',
  'projectName': 'project_name',
  'projectStatus': 'project_status',
  'constructionStatus': 'construction_status',
  'projectApprovalStatus': 'project_approval_status',
  'totalUnits': 'total_units',
  'completedUnits': 'completed_units',
  'soldUnits': 'sold_units',
  'possessionStatus': 'possession_status',
  
  // Builder/Developer information
  'builderName': 'builder_name',
  'builderContact': 'builder_contact',
  'developerName': 'developer_name',
  'developerContact': 'developer_contact',
  'builderRegistrationNumber': 'builder_registration_number',
  
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
  
  // Environment and compliance
  'environmentalClearance': 'environmental_clearance',
  'fireSafetyClearance': 'fire_safety_clearance',
  'pollutionClearance': 'pollution_clearance',
  'waterConnectionStatus': 'water_connection_status',
  'electricityConnectionStatus': 'electricity_connection_status',
  
  // Area and infrastructure
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'infrastructureStatus': 'infrastructure_status',
  'roadConnectivity': 'road_connectivity',
  
  // Observations and remarks
  'otherObservation': 'other_observation',
  'complianceIssues': 'compliance_issues',
  'regulatoryConcerns': 'regulatory_concerns',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  
  // Legacy/alternative field names
  'metPerson': 'met_person_name', // Maps to met person name
  'companyName': 'builder_name', // Maps to builder name
  'projectDetails': 'project_name', // Maps to project name
  'clearanceStatus': 'environmental_clearance', // Maps to environmental clearance
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
 * Maps mobile NOC form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapNocFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = NOC_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processNocFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes NOC field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processNocFieldValue(fieldName: string, value: any): any {
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
    'totalUnits', 'completedUnits', 'soldUnits'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle date fields
  const dateFields = ['nocIssueDate', 'nocExpiryDate'];
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
 * Gets all database columns that can be populated from NOC form data
 * 
 * @returns Array of database column names
 */
export function getNocAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(NOC_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile NOC form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getNocMappedMobileFields(): string[] {
  return Object.keys(NOC_FIELD_MAPPING)
    .filter(field => NOC_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in NOC form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateNocRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by NOC form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'nocStatus', 'nocType',
      'metPersonName', 'metPersonDesignation', 'projectName', 'builderName',
      'propertyType', 'projectStatus', 'constructionStatus', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
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
      'projectName', 'builderName', 'locality', 'addressStructure',
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
    if (formData.nocStatus === 'Available' && !formData.nocNumber) {
      warnings.push('nocNumber should be specified when NOC is available');
    }
    if (formData.nocStatus === 'Available' && !formData.nocValidityStatus) {
      warnings.push('nocValidityStatus should be specified when NOC is available');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.nameOfTpc1) {
      warnings.push('nameOfTpc1 should be specified when tpcMetPerson1 is Yes');
    }
    if (formData.totalUnits && !formData.completedUnits) {
      warnings.push('completedUnits should be specified when totalUnits is provided');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
