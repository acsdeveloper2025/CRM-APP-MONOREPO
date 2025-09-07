/**
 * Office Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile office form data
 * and database columns for office verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile office form fields to database columns
 * Covers all office verification form types: POSITIVE, SHIFTED, NSP, ENTRY_RESTRICTED, UNTRACEABLE
 */
export const OFFICE_FIELD_MAPPING: DatabaseFieldMapping = {
  // Basic form information
  'outcome': null, // Handled separately as verification_outcome
  'remarks': 'remarks',
  'finalStatus': 'final_status',

  // Address and location fields (Common to all forms)
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

  // Landmarks (Common to all forms, untraceable may have more)
  'landmark1': 'landmark1',
  'landmark2': 'landmark2',
  'landmark3': 'landmark3', // Used in untraceable forms
  'landmark4': 'landmark4', // Used in untraceable forms

  // Office status and details (Form specific)
  'officeStatus': 'office_status',           // Used in POSITIVE, SHIFTED, NSP forms
  'officeExistence': 'office_existence',     // Used in NSP forms
  'officeType': 'office_type',               // Used in POSITIVE forms
  'companyNatureOfBusiness': 'company_nature_of_business', // Used in POSITIVE forms
  'businessPeriod': 'business_period',       // Used in POSITIVE forms
  'establishmentPeriod': 'establishment_period', // Used in POSITIVE forms
  'officeApproxArea': 'office_approx_area',  // Used in POSITIVE forms
  'staffStrength': 'staff_strength',         // Used in POSITIVE forms
  'staffSeen': 'staff_seen',                 // Used in POSITIVE forms

  // Person details (Form specific)
  'metPerson': 'met_person_name',            // Used in POSITIVE, SHIFTED, NSP forms
  'metPersonName': 'met_person_name',        // Alternative field name
  'designation': 'designation',
  'applicantDesignation': 'applicant_designation',
  'workingPeriod': 'working_period',
  'workingStatus': 'working_status',
  'applicantWorkingPremises': 'applicant_working_premises',
  'sittingLocation': 'sitting_location',
  'currentCompanyName': 'current_company_name',
  
  // Document verification
  'documentShown': 'document_shown',
  
  // Third Party Confirmation (TPC)
  'tpcMetPerson1': 'tpc_met_person1',
  'nameOfTpc1': 'tpc_name1',
  'tpcConfirmation1': 'tpc_confirmation1',
  'tpcMetPerson2': 'tpc_met_person2',
  'nameOfTpc2': 'tpc_name2',
  'tpcConfirmation2': 'tpc_confirmation2',
  
  // Shifted office specific fields
  'shiftedPeriod': 'shifted_period',
  'oldOfficeShiftedPeriod': 'old_office_shifted_period',
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
  
  // Legacy/alternative field names
  'companyName': 'company_nature_of_business', // Maps to company nature
  'employeeId': 'met_person_name', // Maps to met person
  'workingHours': 'working_period', // Maps to working period
  'hrVerification': null, // Derived field, ignore
  'salaryConfirmed': null, // Derived field, ignore
  'department': 'applicant_designation', // Maps to applicant designation
  'joiningDate': 'establishment_period', // Maps to establishment period
  'monthlySalary': 'working_status', // Maps to working status
  'hrContactName': 'tpc_name1', // Maps to TPC1
  'hrContactPhone': 'tpc_name2', // Maps to TPC2
  'officeAddress': 'address_structure', // Maps to address structure
  'totalEmployees': 'staff_strength', // Maps to staff strength
  'businessNature': 'company_nature_of_business', // Maps to business nature
  'verificationMethod': null, // Derived field, ignore
  'documentsSeen': 'document_shown', // Maps to document shown
  'verificationNotes': 'other_observation', // Maps to other observation
  'recommendationStatus': 'final_status', // Maps to final status (required field)

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
 * Maps mobile office form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapOfficeFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = OFFICE_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processOfficeFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes office field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processOfficeFieldValue(fieldName: string, value: any): any {
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
  
  // Handle final_status field - convert case to match database constraint
  if (fieldName === 'recommendationStatus') {
    const statusValue = String(value).trim().toUpperCase();
    // Convert to proper case format expected by database constraint
    switch (statusValue) {
      case 'POSITIVE': return 'Positive';
      case 'NEGATIVE': return 'Negative';
      case 'REFER': return 'Refer';
      case 'FRAUD': return 'Fraud';
      case 'HOLD': return 'Hold';
      default:
        console.warn(`⚠️ Unknown recommendationStatus value: ${value}, defaulting to 'Refer'`);
        return 'Refer'; // Safe default
    }
  }

  // Handle numeric fields
  const numericFields = [
    'staffStrength', 'staffSeen', 'officeApproxArea', 'totalEmployees'
  ];

  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  // Default: convert to string and trim
  return String(value).trim() || null;
}

/**
 * Gets all database columns that can be populated from office form data
 * 
 * @returns Array of database column names
 */
export function getOfficeAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(OFFICE_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile office form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getOfficeMappedMobileFields(): string[] {
  return Object.keys(OFFICE_FIELD_MAPPING)
    .filter(field => OFFICE_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in office form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateOfficeRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by office form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'officeStatus', 'metPerson',
      'designation', 'workingPeriod', 'applicantDesignation', 'workingStatus',
      'officeType', 'companyNatureOfBusiness', 'staffStrength', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'officeStatus', 'metPerson',
      'designation', 'currentCompanyName', 'oldOfficeShiftedPeriod', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'officeStatus', 'officeExistence',
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
    if (formData.officeStatus === 'Opened' && !formData.staffSeen) {
      warnings.push('staffSeen should be specified when office is opened');
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
