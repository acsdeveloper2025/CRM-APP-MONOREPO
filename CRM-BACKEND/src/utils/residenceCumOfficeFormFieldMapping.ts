/**
 * Residence-cum-Office Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile residence-cum-office form data
 * and database columns for residence-cum-office verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile residence-cum-office form fields to database columns
 */
export const RESIDENCE_CUM_OFFICE_FIELD_MAPPING: DatabaseFieldMapping = {
  // Basic form information
  'outcome': null, // Handled separately as verification_outcome
  'remarks': 'remarks',
  'finalStatus': 'final_status',
  'resiCumOfficeStatus': null, // Ignore this field - it's redundant with finalStatus
  
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
  'doorNamePlateStatus': 'door_nameplate_status',
  'nameOnDoorPlate': 'name_on_door_plate',
  'societyNamePlateStatus': 'society_nameplate_status',
  'nameOnSocietyBoard': 'name_on_society_board',
  
  // Landmarks
  'landmark1': 'landmark1',
  'landmark2': 'landmark2',
  'landmark3': 'landmark3',
  'landmark4': 'landmark4',
  
  // Residence-specific fields
  'houseStatus': 'house_status',
  'metPersonName': 'met_person_name',
  'metPersonRelation': 'met_person_relation',
  'totalFamilyMembers': 'total_family_members',
  'totalEarning': 'total_earning',
  'applicantDob': 'applicant_dob',
  'applicantAge': 'applicant_age',
  'stayingPeriod': 'staying_period',
  'stayingStatus': 'staying_status',
  'approxArea': 'approx_area',
  'documentShownStatus': 'document_shown_status',
  'documentType': 'document_type',
  
  // Office-specific fields
  'officeStatus': 'office_status',
  'officeExistence': 'office_existence',
  'officeType': 'office_type',
  'designation': 'designation',
  'applicantDesignation': 'applicant_designation',
  'workingPeriod': 'working_period',
  'workingStatus': 'working_status',
  'applicantWorkingPremises': 'applicant_working_premises',
  'sittingLocation': 'sitting_location',
  'currentCompanyName': 'current_company_name',
  'companyNatureOfBusiness': 'company_nature_of_business',
  'businessPeriod': 'business_period',
  'establishmentPeriod': 'establishment_period',
  'staffStrength': 'staff_strength',
  'staffSeen': 'staff_seen',
  
  // Third Party Confirmation (TPC)
  'tpcMetPerson1': 'tpc_met_person1',
  'nameOfTpc1': 'tpc_name1',
  'tpcName1': 'tpc_name1', // Alternative field name for TPC name 1
  'tpcConfirmation1': 'tpc_confirmation1',
  'tpcMetPerson2': 'tpc_met_person2',
  'nameOfTpc2': 'tpc_name2',
  'tpcName2': 'tpc_name2', // Alternative field name for TPC name 2
  'tpcConfirmation2': 'tpc_confirmation2',
  
  // Shifted specific fields
  'shiftedPeriod': 'shifted_period',
  'oldOfficeShiftedPeriod': 'old_office_shifted_period',
  'currentCompanyPeriod': 'current_company_period',
  'premisesStatus': 'premises_status',
  
  // Entry restricted specific fields
  'nameOfMetPerson': 'name_of_met_person',
  'metPersonType': 'met_person_type',
  'metPersonConfirmation': 'met_person_confirmation',
  'applicantWorkingStatus': 'applicant_working_status',
  'applicantStayingStatus': 'applicant_staying_status',
  
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
  'metPerson': 'met_person_name', // Maps to met person name
  'companyName': 'company_nature_of_business', // Maps to company nature
  'totalEmployees': 'staff_strength', // Maps to staff strength

  // Additional mobile form fields that need mapping or ignoring
  'residenceSetup': null, // Ignore - not a database field
  'businessSetup': null, // Ignore - not a database field
  'relation': 'met_person_relation', // Maps to met person relation
  'businessStatus': 'office_status', // Maps to office status
  'businessLocation': 'sitting_location', // Maps to sitting location
  'businessOperatingAddress': null, // Ignore - redundant with address
  'applicantStayingFloor': 'address_floor', // Maps to address floor
  'businessNature': 'company_nature_of_business', // Maps to business nature
  'verificationMethod': null, // Derived field, ignore

  // Additional form-specific fields from mobile components (avoiding duplicates)
  'metPersonStatus': 'met_person_type', // Maps to met person type
  'addressTraceable': 'address_locatable', // Alternative name for address locatable
  'fullAddress': 'full_address', // Maps to full address
  'customerName': 'customer_name', // Maps to customer name
  'customerPhone': 'customer_phone', // Maps to customer phone
  'customerEmail': 'customer_email', // Maps to customer email

  // Business/Office related fields (avoiding duplicates)
  'businessOperatingHours': null, // Ignore - not in database
  'workingHours': 'working_period', // Maps to working period
  'businessType': 'office_type', // Maps to office type
  'establishmentYear': 'establishment_period', // Maps to establishment period
  'totalStaff': 'staff_strength', // Maps to staff strength
  'staffPresent': 'staff_seen', // Maps to staff seen

  // Residence related fields
  'familyMembers': 'total_family_members', // Maps to family members
  'monthlyIncome': 'total_earning', // Maps to total earning
  'dateOfBirth': 'applicant_dob', // Maps to applicant DOB
  'age': 'applicant_age', // Maps to applicant age
  'residenceType': 'house_status', // Maps to house status
  'ownershipStatus': 'staying_status', // Maps to staying status

  // Document related fields
  'documentShown': 'document_shown_status', // Maps to document shown status
  'documentTypes': 'document_type', // Maps to document type
  'idProofShown': 'document_shown_status', // Alternative for document shown

  // Additional comprehensive field mappings from all form types
  'applicantName': 'customer_name', // Maps to customer name
  'residenceConfirmed': null, // Ignore - derived field
  'officeConfirmed': null, // Ignore - derived field
  'nameOnNamePlate': 'name_on_door_plate', // Maps to name on door plate
  'nameOnSocietyNamePlate': 'name_on_society_board', // Maps to society board name
  'nameOnCompanyNamePlate': 'name_on_company_board', // Maps to company board name
  'shiftedFrom': 'shifted_period', // Maps to shifted period
  'oldOfficeAddress': null, // Ignore - not in database
  'newOfficeAddress': null, // Ignore - not in database
  'reasonForShift': null, // Ignore - not in database
  'verificationOutcome': null, // Handled separately
  'submissionDate': null, // Ignore - auto-generated
  'submissionTime': null, // Ignore - auto-generated
  'geoLocation': null, // Ignore - handled separately
  'photoCount': null, // Ignore - calculated field
  'formType': null, // Ignore - handled separately
  'caseNumber': null, // Ignore - from case data
  'assignedAgent': null, // Ignore - from case data

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
 * Maps mobile residence-cum-office form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapResidenceCumOfficeFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = RESIDENCE_CUM_OFFICE_FIELD_MAPPING[mobileField];

    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }

    // Only process fields that have explicit mappings to prevent database errors
    if (dbColumn) {
      // Use the mapped column name
      const columnName = dbColumn;

      // Process the value based on type
      mappedData[columnName] = processResidenceCumOfficeFieldValue(mobileField, value);
    } else {
      // Log unmapped fields for debugging but don't include them in database insertion
      console.warn(`⚠️ Unmapped residence-cum-office field: ${mobileField} (value: ${value}) - skipping to prevent database errors`);
    }
  }
  
  return mappedData;
}

/**
 * Processes residence-cum-office field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processResidenceCumOfficeFieldValue(fieldName: string, value: any): any {
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
    'staffStrength', 'staffSeen', 'totalEmployees'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle date fields
  const dateFields = ['applicantDob'];
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
 * Gets all database columns that can be populated from residence-cum-office form data
 * 
 * @returns Array of database column names
 */
export function getResidenceCumOfficeAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(RESIDENCE_CUM_OFFICE_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile residence-cum-office form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getResidenceCumOfficeMappedMobileFields(): string[] {
  return Object.keys(RESIDENCE_CUM_OFFICE_FIELD_MAPPING)
    .filter(field => RESIDENCE_CUM_OFFICE_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in residence-cum-office form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateResidenceCumOfficeRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by residence-cum-office form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'houseStatus', 'officeStatus',
      'metPersonName', 'metPersonRelation', 'designation', 'applicantDesignation',
      'totalFamilyMembers', 'workingPeriod', 'workingStatus', 'officeType',
      'companyNatureOfBusiness', 'businessPeriod', 'staffStrength', 'locality',
      'addressStructure', 'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'houseStatus', 'officeStatus',
      'metPersonName', 'designation', 'currentCompanyName', 'oldOfficeShiftedPeriod',
      'locality', 'addressStructure', 'politicalConnection', 'dominatedArea',
      'feedbackFromNeighbour', 'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'houseStatus', 'officeStatus', 'officeExistence',
      'metPersonName', 'designation', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'ENTRY_RESTRICTED': [
      'addressLocatable', 'addressRating', 'nameOfMetPerson', 'metPersonType',
      'metPersonConfirmation', 'applicantWorkingStatus', 'applicantStayingStatus',
      'locality', 'addressStructure', 'politicalConnection', 'dominatedArea',
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
    if (formData.houseStatus === 'Opened' && !formData.totalFamilyMembers) {
      warnings.push('totalFamilyMembers should be specified when house is opened');
    }
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
