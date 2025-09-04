/**
 * DSA/DST Connector Form Field Mapping Utilities
 * 
 * This module provides comprehensive field mapping between mobile DSA/DST Connector form data
 * and database columns for DSA/DST Connector verification forms.
 */

export interface DatabaseFieldMapping {
  [mobileField: string]: string | null; // null means field should be ignored
}

/**
 * Complete field mapping from mobile DSA/DST Connector form fields to database columns
 */
export const DSA_CONNECTOR_FIELD_MAPPING: DatabaseFieldMapping = {
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
  
  // DSA/DST Connector specific fields
  'connectorType': 'connector_type',
  'connectorCode': 'connector_code',
  'connectorName': 'connector_name',
  'connectorDesignation': 'connector_designation',
  'connectorExperience': 'connector_experience',
  'connectorStatus': 'connector_status',
  
  // Business/Office details
  'businessName': 'business_name',
  'businessType': 'business_type',
  'businessRegistrationNumber': 'business_registration_number',
  'businessEstablishmentYear': 'business_establishment_year',
  'officeType': 'office_type',
  'officeArea': 'office_area',
  'officeRent': 'office_rent',
  
  // Team and staff details
  'totalStaff': 'total_staff',
  'salesStaff': 'sales_staff',
  'supportStaff': 'support_staff',
  'teamSize': 'team_size',
  'monthlyBusinessVolume': 'monthly_business_volume',
  'averageMonthlySales': 'average_monthly_sales',
  
  // Financial details
  'annualTurnover': 'annual_turnover',
  'monthlyIncome': 'monthly_income',
  'commissionStructure': 'commission_structure',
  'paymentTerms': 'payment_terms',
  'bankAccountDetails': 'bank_account_details',
  
  // Technology and infrastructure
  'computerSystems': 'computer_systems',
  'internetConnection': 'internet_connection',
  'softwareSystems': 'software_systems',
  'posTerminals': 'pos_terminals',
  'printerScanner': 'printer_scanner',
  
  // Compliance and documentation
  'licenseStatus': 'license_status',
  'licenseNumber': 'license_number',
  'licenseExpiryDate': 'license_expiry_date',
  'complianceStatus': 'compliance_status',
  'auditStatus': 'audit_status',
  'trainingStatus': 'training_status',
  
  // Met person details
  'metPersonName': 'met_person_name',
  'metPersonDesignation': 'met_person_designation',
  'metPersonRelation': 'met_person_relation',
  'metPersonContact': 'met_person_contact',
  
  // Business verification
  'businessOperational': 'business_operational',
  'customerFootfall': 'customer_footfall',
  'businessHours': 'business_hours',
  'weekendOperations': 'weekend_operations',
  
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
  'previousBusinessName': 'previous_business_name',
  
  // Entry restricted specific fields
  'entryRestrictionReason': 'entry_restriction_reason',
  'securityPersonName': 'security_person_name',
  'securityConfirmation': 'security_confirmation',
  
  // Untraceable specific fields
  'contactPerson': 'contact_person',
  'callRemark': 'call_remark',
  
  // Market and competition
  'marketPresence': 'market_presence',
  'competitorAnalysis': 'competitor_analysis',
  'marketReputation': 'market_reputation',
  'customerFeedback': 'customer_feedback',
  
  // Area and environment
  'politicalConnection': 'political_connection',
  'dominatedArea': 'dominated_area',
  'feedbackFromNeighbour': 'feedback_from_neighbour',
  'infrastructureStatus': 'infrastructure_status',
  'commercialViability': 'commercial_viability',
  
  // Observations and remarks
  'otherObservation': 'other_observation',
  'businessConcerns': 'business_concerns',
  'operationalChallenges': 'operational_challenges',
  'growthPotential': 'growth_potential',
  'holdReason': 'hold_reason',
  'recommendationStatus': 'recommendation_status',
  'riskAssessment': 'risk_assessment',
  
  // Legacy/alternative field names
  'metPerson': 'met_person_name', // Maps to met person name
  'companyName': 'business_name', // Maps to business name
  'agentName': 'connector_name', // Maps to connector name
  'agentCode': 'connector_code', // Maps to connector code
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
 * Maps mobile DSA/DST Connector form data to database field values
 * 
 * @param formData - Raw form data from mobile app
 * @returns Object with database column names as keys
 */
export function mapDsaConnectorFormDataToDatabase(formData: any): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  // Process each field in the form data
  for (const [mobileField, value] of Object.entries(formData)) {
    const dbColumn = DSA_CONNECTOR_FIELD_MAPPING[mobileField];
    
    // Skip fields that should be ignored
    if (dbColumn === null) {
      continue;
    }
    
    // Use the mapped column name or the original field name if no mapping exists
    const columnName = dbColumn || mobileField;
    
    // Process the value based on type
    mappedData[columnName] = processDsaConnectorFieldValue(mobileField, value);
  }
  
  return mappedData;
}

/**
 * Processes DSA/DST Connector field values to ensure they're in the correct format for database storage
 * 
 * @param fieldName - The mobile field name
 * @param value - The field value
 * @returns Processed value suitable for database storage
 */
function processDsaConnectorFieldValue(fieldName: string, value: any): any {
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
    'connectorExperience', 'businessEstablishmentYear', 'totalStaff', 'salesStaff', 
    'supportStaff', 'teamSize', 'computerSystems', 'posTerminals'
  ];
  
  if (numericFields.includes(fieldName)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle decimal fields
  const decimalFields = [
    'officeArea', 'officeRent', 'monthlyBusinessVolume', 'averageMonthlySales',
    'annualTurnover', 'monthlyIncome'
  ];
  
  if (decimalFields.includes(fieldName)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle date fields
  const dateFields = ['licenseExpiryDate'];
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
 * Gets all database columns that can be populated from DSA/DST Connector form data
 * 
 * @returns Array of database column names
 */
export function getDsaConnectorAvailableDbColumns(): string[] {
  const columns = new Set<string>();
  
  for (const dbColumn of Object.values(DSA_CONNECTOR_FIELD_MAPPING)) {
    if (dbColumn !== null) {
      columns.add(dbColumn);
    }
  }
  
  return Array.from(columns).sort();
}

/**
 * Gets all mobile DSA/DST Connector form fields that are mapped to database columns
 * 
 * @returns Array of mobile field names
 */
export function getDsaConnectorMappedMobileFields(): string[] {
  return Object.keys(DSA_CONNECTOR_FIELD_MAPPING)
    .filter(field => DSA_CONNECTOR_FIELD_MAPPING[field] !== null)
    .sort();
}

/**
 * Validates that all required fields are present in DSA/DST Connector form data
 * 
 * @param formData - Form data to validate
 * @param formType - Type of form (POSITIVE, SHIFTED, NSP, etc.)
 * @returns Object with validation result and missing fields
 */
export function validateDsaConnectorRequiredFields(formData: any, formType: string): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Define required fields by DSA/DST Connector form type
  const requiredFieldsByType: Record<string, string[]> = {
    'POSITIVE': [
      'addressLocatable', 'addressRating', 'connectorType', 'connectorName',
      'connectorCode', 'businessName', 'businessType', 'metPersonName',
      'metPersonDesignation', 'businessOperational', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'SHIFTED': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonDesignation',
      'shiftedPeriod', 'currentLocation', 'previousBusinessName', 'locality', 'addressStructure',
      'politicalConnection', 'dominatedArea', 'feedbackFromNeighbour',
      'otherObservation', 'finalStatus'
    ],
    'NSP': [
      'addressLocatable', 'addressRating', 'metPersonName', 'metPersonDesignation',
      'connectorName', 'businessName', 'locality', 'addressStructure',
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
    if (formData.connectorType === 'DSA' && !formData.connectorCode) {
      warnings.push('connectorCode should be specified for DSA connector type');
    }
    if (formData.businessType === 'Company' && !formData.businessRegistrationNumber) {
      warnings.push('businessRegistrationNumber should be specified for Company business type');
    }
    if (formData.tpcMetPerson1 === 'Yes' && !formData.nameOfTpc1) {
      warnings.push('nameOfTpc1 should be specified when tpcMetPerson1 is Yes');
    }
    if (formData.totalStaff && !formData.salesStaff) {
      warnings.push('salesStaff should be specified when totalStaff is provided');
    }
    if (formData.licenseStatus === 'Valid' && !formData.licenseNumber) {
      warnings.push('licenseNumber should be specified when license status is Valid');
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}
