/**
 * Residence Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile form data
 * and database columns for residence verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile form fields to database columns
 */
export const RESIDENCE_FIELD_MAPPING: DatabaseFieldMapping = {
  // Basic case information
  'outcome': null, // Handled separately as verification_outcome
  'remarks': 'remarks',
  'finalStatus': 'final_status',
  
  // Address and location fields
  'addressLocatable': 'address_locatable',
  'addressRating': 'address_rating',
  'locality': 'locality',
  'addressStructure': 'address_structure',
  'applicantStayingFloor': 'address_floor',
  'addressFloor': 'address_floor', // Alternative field name
  'addressStructureColor': 'address_structure_color',
  'doorColor': 'door_color',
  'doorNamePlateStatus': 'door_nameplate_status',
  'nameOnDoorPlate': 'name_on_door_plate',
  'societyNamePlateStatus': 'society_nameplate_status',
  'nameOnSocietyBoard': 'name_on_society_board',
  'companyNamePlateStatus': 'company_nameplate_status',
  'nameOnCompanyBoard': 'name_on_company_board',
  
  // Landmarks
  'landmark1': 'landmark1',
  'landmark2': 'landmark2',
  'landmark3': 'landmark3',
  'landmark4': 'landmark4',
  
  // House and room status
  'houseStatus': 'house_status',
  'roomStatus': 'room_status',
  
  // Person details
  'metPersonName': 'met_person_name',
  'metPersonRelation': 'met_person_relation',
  'metPersonStatus': 'met_person_status',
  'stayingPersonName': 'staying_person_name',
  'totalFamilyMembers': 'total_family_members',
  'totalEarning': 'total_earning',
  'applicantDob': 'applicant_dob',
  'applicantAge': 'applicant_age',
  'workingStatus': 'working_status',
  'companyName': 'company_name',
  'stayingPeriod': 'staying_period',
  'stayingStatus': 'staying_status',
  'approxArea': 'approx_area',
  
  // Document verification
  'documentShownStatus': 'document_shown_status',
  'documentType': 'document_type',
  
  // Third Party Confirmation (TPC)
  'tpcMetPerson1': 'tpc_met_person1',
  'tpcName1': 'tpc_name1',
  'tpcConfirmation1': 'tpc_confirmation1',
  'tpcMetPerson2': 'tpc_met_person2',
  'tpcName2': 'tpc_name2',
  'tpcConfirmation2': 'tpc_confirmation2',
  
  // Shifted residence specific fields
  'shiftedPeriod': 'shifted_period',
  'premisesStatus': 'premises_status',
  
  // Entry restricted specific fields
  'nameOfMetPerson': 'name_of_met_person',
  'metPerson': 'met_person_type', // Alternative field name
  'metPersonType': 'met_person_type',
  'metPersonConfirmation': 'met_person_confirmation',
  'applicantStayingStatus': 'applicant_staying_status',
  
  // Untraceable specific fields
  'callRemark': 'call_remark',
  
  // Environment and area details
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'otherObservation': 'other_observation',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  
  // Legacy/alternative field names
  'applicantName': 'met_person_name', // Maps to met_person_name
  'addressConfirmed': null, // Derived field, ignore
  'residenceType': 'house_status', // Maps to house_status
  'familyMembers': 'total_family_members', // Maps to total_family_members
  'neighborVerification': null, // Derived field, ignore
  
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
 * Maps mobile form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = RESIDENCE_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processFieldValue(fieldName: string, value: any): any {
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
    'totalFamilyMembers', 'totalEarning', 'applicantAge', 'approxArea', 
    'applicantStayingFloor', 'addressFloor', 'familyMembers'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle date fields
  const dateFields = ['applicantDob'];
  if (dateFields.includes(fieldName)) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
    return null;
  }
  
  // Default: convert to string and trim
  return String(value).trim() || null;
}

/**
 * Gets all database columns that can be populated from form data
 * 
 * @returns Array of database column names
 */
export function getAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(RESIDENCE_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getMappedMobileFields(): string[] {
  return Object.keys(RESIDENCE_FIELD_MAPPING)
    .filter(field => RESIDENCE_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'houseStatus', 'metPersonName',
      'metPersonRelation', 'totalFamilyMembers', 'workingStatus', 'stayingPeriod',
      'stayingStatus', 'documentShownStatus', 'tpcMetPerson1', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'roomStatus', 'metPersonName',
      'metPersonStatus', 'shiftedPeriod', 'tpcMetPerson1', 'premisesStatus',
      'locality', 'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'houseStatus', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'ENTRY_RESTRICTED': [
      'addressLocatable', 'addressRating', 'nameOfMetPerson', 'metPersonType',
      'metPersonConfirmation', 'applicantStayingStatus', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'UNTRACEABLE': [
      'callRemark', 'locality', 'landmark1', 'landmark2', 'dominatedArea',
      'otherObservation', 'finalStatus'
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
    if (formData.documentShownStatus === 'Yes' && !formData.documentType) {
      warnings.push('documentType should be specified when documentShownStatus is Yes');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.tpcName1) {
      warnings.push('tpcName1 should be specified when tpcMetPerson1 is Yes');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
