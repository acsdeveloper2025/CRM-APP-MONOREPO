/**
 * Business Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile business form data
 * and database columns for business verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile business form fields to database columns
 */
export const BUSINESS_FIELD_MAPPING: DatabaseFieldMapping = {
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
  'companyNamePlateStatus': 'company_nameplate_status',
  'nameOnBoard': 'name_on_company_board',
  'nameOnCompanyBoard': 'name_on_company_board',
  
  // Landmarks
  'landmark1': 'landmark1',
  'landmark2': 'landmark2',
  
  // Business status and details
  'businessStatus': 'business_status',
  'businessExistance': 'business_existence', // Note: typo in mobile app
  'businessExistence': 'business_existence',
  'businessType': 'business_type',
  'ownershipType': 'ownership_type',
  'addressStatus': 'address_status',
  'companyNatureOfBusiness': 'company_nature_of_business',
  'businessPeriod': 'business_period',
  'establishmentPeriod': 'establishment_period',
  'businessApproxArea': 'business_approx_area',
  'officeApproxArea': 'business_approx_area', // Alternative field name
  'staffStrength': 'staff_strength',
  'staffSeen': 'staff_seen',

  // Additional business fields from mobile forms
  'businessAddress': 'full_address', // Map businessAddress to full_address
  'operatingHours': null, // Map to other_observation or ignore
  'employeeCount': 'staff_strength', // Map employeeCount to staff_strength
  
  // Owner/Person details
  'metPerson': 'met_person_name',
  'metPersonName': 'met_person_name',
  'designation': 'designation',
  'nameOfCompanyOwners': 'name_of_company_owners',
  'ownerName': 'owner_name',
  'businessOwnerName': 'business_owner_name',
  
  // Document verification
  'documentShown': 'document_shown',
  
  // Third Party Confirmation (TPC)
  'tpcMetPerson1': 'tpc_met_person1',
  'nameOfTpc1': 'tpc_name1',
  'tpcConfirmation1': 'tpc_confirmation1',
  'tpcMetPerson2': 'tpc_met_person2',
  'nameOfTpc2': 'tpc_name2',
  'tpcConfirmation2': 'tpc_confirmation2',
  
  // Shifted business specific fields
  'shiftedPeriod': 'shifted_period',
  'oldBusinessShiftedPeriod': 'old_business_shifted_period',
  'currentCompanyName': 'current_company_name',
  'currentCompanyPeriod': 'current_company_period',
  'premisesStatus': 'premises_status',
  
  // Entry restricted specific fields
  'nameOfMetPerson': 'name_of_met_person',
  'metPersonType': 'met_person_type',
  'metPersonConfirmation': 'met_person_confirmation',
  'applicantWorkingStatus': 'applicant_working_status',
  
  // Untraceable specific fields
  'contactPerson': 'contact_person',
  'callRemark': 'call_remark',
  
  // Environment and area details
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'otherObservation': 'other_observation',
  'otherExtraRemark': 'other_extra_remark',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  
  // Legacy/alternative field names
  'businessName': 'company_nature_of_business', // Maps to company nature
  'companyName': 'company_nature_of_business', // Maps to company nature
  'totalEmployees': 'staff_strength', // Maps to staff strength
  'businessNature': 'company_nature_of_business', // Maps to business nature
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
 * Maps mobile business form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapBusinessFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = BUSINESS_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processBusinessFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes business field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processBusinessFieldValue(fieldName: string, value: any): any {
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
    'staffStrength', 'staffSeen', 'businessApproxArea', 'officeApproxArea', 'totalEmployees'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Default: convert to string and trim
  return String(value).trim() || null;
}

/**
 * Gets all database columns that can be populated from business form data
 * 
 * @returns Array of database column names
 */
export function getBusinessAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(BUSINESS_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile business form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getBusinessMappedMobileFields(): string[] {
  return Object.keys(BUSINESS_FIELD_MAPPING)
    .filter(field => BUSINESS_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in business form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateBusinessRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by business form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'businessStatus', 'metPerson',
      'designation', 'businessType', 'nameOfCompanyOwners', 'ownershipType',
      'addressStatus', 'companyNatureOfBusiness', 'businessPeriod', 'staffStrength',
      'locality', 'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'businessStatus', 'metPerson',
      'designation', 'currentCompanyName', 'oldBusinessShiftedPeriod', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'businessStatus', 'businessExistence',
      'metPerson', 'designation', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'ENTRY_RESTRICTED': [
      'addressLocatable', 'addressRating', 'nameOfMetPerson', 'metPersonType',
      'metPersonConfirmation', 'applicantWorkingStatus', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
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
    if (formData.businessStatus === 'Opened' && !formData.staffSeen) {
      warnings.push('staffSeen should be specified when business is opened');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.nameOfTpc1) {
      warnings.push('nameOfTpc1 should be specified when tpcMetPerson1 is Yes');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
