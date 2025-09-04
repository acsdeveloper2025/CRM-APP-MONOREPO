/**
 * Property Individual Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile Property Individual form data
 * and database columns for Property Individual verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile Property Individual form fields to database columns
 */
export const PROPERTY_INDIVIDUAL_FIELD_MAPPING: DatabaseFieldMapping = {
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
  'constructionType': 'construction_type',
  
  // Individual owner details
  'ownerName': 'owner_name',
  'ownerRelation': 'owner_relation',
  'ownerAge': 'owner_age',
  'ownerOccupation': 'owner_occupation',
  'ownerIncome': 'owner_income',
  'yearsOfResidence': 'years_of_residence',
  'familyMembers': 'family_members',
  'earningMembers': 'earning_members',
  
  // Property documents
  'propertyDocuments': 'property_documents',
  'documentVerificationStatus': 'document_verification_status',
  'titleClearStatus': 'title_clear_status',
  'mutationStatus': 'mutation_status',
  'taxPaymentStatus': 'tax_payment_status',
  
  // Met person details
  'metPersonName': 'met_person_name',
  'metPersonDesignation': 'met_person_designation',
  'metPersonRelation': 'met_person_relation',
  'metPersonContact': 'met_person_contact',
  
  // Neighbors and locality
  'neighbor1Name': 'neighbor1_name',
  'neighbor1Confirmation': 'neighbor1_confirmation',
  'neighbor2Name': 'neighbor2_name',
  'neighbor2Confirmation': 'neighbor2_confirmation',
  'localityReputation': 'locality_reputation',
  
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
  'previousOwnerName': 'previous_owner_name',
  
  // Entry restricted specific fields
  'entryRestrictionReason': 'entry_restriction_reason',
  'securityPersonName': 'security_person_name',
  'securityConfirmation': 'security_confirmation',
  
  // Untraceable specific fields
  'contactPerson': 'contact_person',
  'callRemark': 'call_remark',
  
  // Legal and financial
  'legalIssues': 'legal_issues',
  'loanAgainstProperty': 'loan_against_property',
  'bankName': 'bank_name',
  'loanAmount': 'loan_amount',
  'emiAmount': 'emi_amount',
  
  // Utilities and infrastructure
  'electricityConnection': 'electricity_connection',
  'waterConnection': 'water_connection',
  'gasConnection': 'gas_connection',
  'internetConnection': 'internet_connection',
  'roadConnectivity': 'road_connectivity',
  'publicTransport': 'public_transport',
  
  // Area and environment
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'infrastructureStatus': 'infrastructure_status',
  'safetySecurity': 'safety_security',
  
  // Observations and remarks
  'otherObservation': 'other_observation',
  'propertyConcerns': 'property_concerns',
  'verificationChallenges': 'verification_challenges',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  
  // Legacy/alternative field names
  'metPerson': 'met_person_name', // Maps to met person name
  'propertyOwner': 'owner_name', // Maps to owner name
  'propertyDetails': 'property_type', // Maps to property type
  'neighborFeedback': 'feedback_from_neighbour', // Maps to neighbor feedback
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
 * Maps mobile Property Individual form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapPropertyIndividualFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = PROPERTY_INDIVIDUAL_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processPropertyIndividualFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes Property Individual field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processPropertyIndividualFieldValue(fieldName: string, value: any): any {
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
    'propertyAge', 'ownerAge', 'yearsOfResidence', 'familyMembers', 'earningMembers'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle decimal fields
  const decimalFields = [
    'propertyArea', 'propertyValue', 'marketValue', 'ownerIncome', 'loanAmount', 'emiAmount'
  ];
  
  if (decimalFields.includes(fieldName)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // Default: convert to string and trim
  return String(value).trim() || null;
}

/**
 * Gets all database columns that can be populated from Property Individual form data
 * 
 * @returns Array of database column names
 */
export function getPropertyIndividualAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(PROPERTY_INDIVIDUAL_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile Property Individual form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getPropertyIndividualMappedMobileFields(): string[] {
  return Object.keys(PROPERTY_INDIVIDUAL_FIELD_MAPPING)
    .filter(field => PROPERTY_INDIVIDUAL_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in Property Individual form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validatePropertyIndividualRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by Property Individual form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'propertyType', 'propertyStatus',
      'propertyOwnership', 'ownerName', 'ownerRelation', 'metPersonName',
      'metPersonRelation', 'familyMembers', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonRelation',
      'shiftedPeriod', 'currentLocation', 'previousOwnerName', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonRelation',
      'ownerName', 'propertyType', 'locality', 'addressStructure',
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
    if (formData.propertyOwnership === 'Self Owned' && !formData.propertyDocuments) {
      warnings.push('propertyDocuments should be specified for self-owned property');
    }
    if (formData.loanAgainstProperty === 'Yes' && !formData.bankName) {
      warnings.push('bankName should be specified when loan against property exists');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.nameOfTpc1) {
      warnings.push('nameOfTpc1 should be specified when tpcMetPerson1 is Yes');
    }
    if (formData.familyMembers && !formData.earningMembers) {
      warnings.push('earningMembers should be specified when familyMembers is provided');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
