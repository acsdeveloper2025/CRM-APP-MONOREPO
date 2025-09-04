/**
 * Comprehensive Form Field Mapping for All Verification Types
 * 
 * This module provides complete form field definitions and mapping for all verification types
 * to ensure comprehensive display of form data in the frontend.
 */

import { FormSection, FormField } from '../types/mobile';

// Form field definitions organized by verification type and form type
export interface FormFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea';
  isRequired: boolean;
  section: string;
  order: number;
  formTypes?: string[]; // Which form types this field applies to
}

// Comprehensive field definitions for RESIDENCE verification
export const RESIDENCE_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information Section
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'callRemark', name: 'callRemark', label: 'Call Remark', type: 'select', isRequired: false, section: 'Basic Information', order: 4 },
  
  // Address & Location Section
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: true, section: 'Location Details', order: 1, formTypes: ['POSITIVE', 'SHIFTED', 'NSP', 'ENTRY_RESTRICTED'] },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: true, section: 'Location Details', order: 2, formTypes: ['POSITIVE', 'SHIFTED', 'NSP', 'ENTRY_RESTRICTED'] },
  { id: 'locality', name: 'locality', label: 'Locality Type', type: 'select', isRequired: false, section: 'Location Details', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'select', isRequired: false, section: 'Location Details', order: 4 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Location Details', order: 5 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Location Details', order: 6 },
  { id: 'landmark3', name: 'landmark3', label: 'Landmark 3', type: 'text', isRequired: false, section: 'Location Details', order: 7 },
  { id: 'landmark4', name: 'landmark4', label: 'Landmark 4', type: 'text', isRequired: false, section: 'Location Details', order: 8 },
  
  // Personal & Family Details (POSITIVE specific)
  { id: 'metPersonRelation', name: 'metPersonRelation', label: 'Met Person Relation', type: 'select', isRequired: false, section: 'Personal Details', order: 1, formTypes: ['POSITIVE'] },
  { id: 'metPersonStatus', name: 'metPersonStatus', label: 'Met Person Status', type: 'select', isRequired: false, section: 'Personal Details', order: 2 },
  { id: 'totalFamilyMembers', name: 'totalFamilyMembers', label: 'Total Family Members', type: 'number', isRequired: false, section: 'Personal Details', order: 3, formTypes: ['POSITIVE'] },
  { id: 'workingStatus', name: 'workingStatus', label: 'Working Status', type: 'select', isRequired: false, section: 'Personal Details', order: 4, formTypes: ['POSITIVE'] },
  { id: 'stayingPeriod', name: 'stayingPeriod', label: 'Staying Period', type: 'text', isRequired: false, section: 'Personal Details', order: 5, formTypes: ['POSITIVE'] },
  { id: 'stayingStatus', name: 'stayingStatus', label: 'Staying Status', type: 'select', isRequired: false, section: 'Personal Details', order: 6, formTypes: ['POSITIVE'] },
  
  // Document Verification (POSITIVE specific)
  { id: 'documentShownStatus', name: 'documentShownStatus', label: 'Document Shown Status', type: 'select', isRequired: false, section: 'Document Verification', order: 1, formTypes: ['POSITIVE'] },
  { id: 'documentType', name: 'documentType', label: 'Document Type', type: 'select', isRequired: false, section: 'Document Verification', order: 2, formTypes: ['POSITIVE'] },
  
  // House & Property Details
  { id: 'houseStatus', name: 'houseStatus', label: 'House Status', type: 'select', isRequired: false, section: 'Property Details', order: 1, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'doorColor', name: 'doorColor', label: 'Door Color', type: 'text', isRequired: false, section: 'Property Details', order: 2, formTypes: ['POSITIVE'] },
  { id: 'doorNamePlateStatus', name: 'doorNamePlateStatus', label: 'Door Name Plate Status', type: 'select', isRequired: false, section: 'Property Details', order: 3, formTypes: ['POSITIVE'] },
  { id: 'nameOnDoorPlate', name: 'nameOnDoorPlate', label: 'Name on Door Plate', type: 'text', isRequired: false, section: 'Property Details', order: 4, formTypes: ['POSITIVE'] },
  
  // Shifting Details (SHIFTED specific)
  { id: 'shiftedPeriod', name: 'shiftedPeriod', label: 'Shifted Period', type: 'text', isRequired: false, section: 'Shifting Details', order: 1, formTypes: ['SHIFTED'] },
  { id: 'currentLocation', name: 'currentLocation', label: 'Current Location', type: 'text', isRequired: false, section: 'Shifting Details', order: 2, formTypes: ['SHIFTED'] },
  { id: 'premisesStatus', name: 'premisesStatus', label: 'Premises Status', type: 'select', isRequired: false, section: 'Shifting Details', order: 3, formTypes: ['SHIFTED'] },
  { id: 'roomStatus', name: 'roomStatus', label: 'Room Status', type: 'select', isRequired: false, section: 'Shifting Details', order: 4, formTypes: ['SHIFTED'] },
  
  // NSP Details (NSP specific)
  { id: 'stayingPersonName', name: 'stayingPersonName', label: 'Staying Person Name', type: 'text', isRequired: false, section: 'NSP Details', order: 1, formTypes: ['NSP'] },
  { id: 'temporaryStay', name: 'temporaryStay', label: 'Temporary Stay', type: 'boolean', isRequired: false, section: 'NSP Details', order: 2, formTypes: ['NSP'] },
  
  // Entry Restriction Details (ENTRY_RESTRICTED specific)
  { id: 'entryRestrictionReason', name: 'entryRestrictionReason', label: 'Entry Restriction Reason', type: 'text', isRequired: false, section: 'Entry Restriction Details', order: 1, formTypes: ['ENTRY_RESTRICTED'] },
  { id: 'securityPersonName', name: 'securityPersonName', label: 'Security Person Name', type: 'text', isRequired: false, section: 'Entry Restriction Details', order: 2, formTypes: ['ENTRY_RESTRICTED'] },
  { id: 'accessDenied', name: 'accessDenied', label: 'Access Denied', type: 'boolean', isRequired: false, section: 'Entry Restriction Details', order: 3, formTypes: ['ENTRY_RESTRICTED'] },
  { id: 'nameOfMetPerson', name: 'nameOfMetPerson', label: 'Name of Met Person', type: 'text', isRequired: false, section: 'Entry Restriction Details', order: 4, formTypes: ['ENTRY_RESTRICTED'] },
  { id: 'metPersonType', name: 'metPersonType', label: 'Met Person Type', type: 'select', isRequired: false, section: 'Entry Restriction Details', order: 5, formTypes: ['ENTRY_RESTRICTED'] },
  { id: 'applicantStayingStatus', name: 'applicantStayingStatus', label: 'Applicant Staying Status', type: 'select', isRequired: false, section: 'Entry Restriction Details', order: 6, formTypes: ['ENTRY_RESTRICTED'] },
  
  // Contact & Inquiry Details (UNTRACEABLE specific)
  { id: 'contactPerson', name: 'contactPerson', label: 'Contact Person', type: 'text', isRequired: false, section: 'Contact Details', order: 1, formTypes: ['UNTRACEABLE'] },
  { id: 'alternateContact', name: 'alternateContact', label: 'Alternate Contact', type: 'text', isRequired: false, section: 'Contact Details', order: 2, formTypes: ['UNTRACEABLE'] },
  
  // Area Assessment Section (Common to all)
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'select', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'select', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback From Neighbour', type: 'select', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Area Assessment', order: 5 },
];

// Comprehensive field definitions for OFFICE verification
export const OFFICE_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information Section
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'designation', name: 'designation', label: 'Designation', type: 'text', isRequired: false, section: 'Basic Information', order: 4 },
  
  // Office Details Section
  { id: 'officeStatus', name: 'officeStatus', label: 'Office Status', type: 'select', isRequired: false, section: 'Office Details', order: 1 },
  { id: 'officeType', name: 'officeType', label: 'Office Type', type: 'select', isRequired: false, section: 'Office Details', order: 2 },
  { id: 'companyNatureOfBusiness', name: 'companyNatureOfBusiness', label: 'Company Nature of Business', type: 'text', isRequired: false, section: 'Office Details', order: 3 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'Office Details', order: 4 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'Office Details', order: 5 },
  { id: 'workingPeriod', name: 'workingPeriod', label: 'Working Period', type: 'text', isRequired: false, section: 'Office Details', order: 6 },
  
  // Address & Location Section
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: true, section: 'Location Details', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: true, section: 'Location Details', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality Type', type: 'select', isRequired: false, section: 'Location Details', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'select', isRequired: false, section: 'Location Details', order: 4 },
  { id: 'companyNamePlateStatus', name: 'companyNamePlateStatus', label: 'Company Name Plate Status', type: 'select', isRequired: false, section: 'Location Details', order: 5 },
  { id: 'nameOnCompanyBoard', name: 'nameOnCompanyBoard', label: 'Name on Company Board', type: 'text', isRequired: false, section: 'Location Details', order: 6 },
  
  // Area Assessment Section
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'select', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'select', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback From Neighbour', type: 'select', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Area Assessment', order: 5 },
];

// Comprehensive field definitions for BUSINESS verification
export const BUSINESS_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information Section
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'businessName', name: 'businessName', label: 'Business Name', type: 'text', isRequired: false, section: 'Basic Information', order: 4 },
  
  // Business Details Section
  { id: 'businessStatus', name: 'businessStatus', label: 'Business Status', type: 'select', isRequired: false, section: 'Business Details', order: 1 },
  { id: 'businessType', name: 'businessType', label: 'Business Type', type: 'select', isRequired: false, section: 'Business Details', order: 2 },
  { id: 'businessNatureOfBusiness', name: 'businessNatureOfBusiness', label: 'Nature of Business', type: 'text', isRequired: false, section: 'Business Details', order: 3 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'Business Details', order: 4 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'Business Details', order: 5 },
  { id: 'businessExistence', name: 'businessExistence', label: 'Business Existence', type: 'select', isRequired: false, section: 'Business Details', order: 6 },
  { id: 'applicantExistence', name: 'applicantExistence', label: 'Applicant Existence', type: 'select', isRequired: false, section: 'Business Details', order: 7 },
  
  // Address & Location Section
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: true, section: 'Location Details', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: true, section: 'Location Details', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality Type', type: 'select', isRequired: false, section: 'Location Details', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'select', isRequired: false, section: 'Location Details', order: 4 },
  { id: 'premisesStatus', name: 'premisesStatus', label: 'Premises Status', type: 'select', isRequired: false, section: 'Location Details', order: 5 },
  
  // Area Assessment Section
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'select', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'select', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback From Neighbour', type: 'select', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Area Assessment', order: 5 },
];

// Field definitions mapping by verification type
export const VERIFICATION_TYPE_FIELDS: Record<string, FormFieldDefinition[]> = {
  'RESIDENCE': RESIDENCE_FORM_FIELDS,
  'OFFICE': OFFICE_FORM_FIELDS,
  'BUSINESS': BUSINESS_FORM_FIELDS,
  // Add more verification types as needed
};

/**
 * Get form field definitions for a specific verification type and form type
 */
export function getFormFieldDefinitions(verificationType: string, formType?: string): FormFieldDefinition[] {
  const fields = VERIFICATION_TYPE_FIELDS[verificationType.toUpperCase()] || [];
  
  if (!formType) {
    return fields;
  }
  
  // Filter fields based on form type
  return fields.filter(field => 
    !field.formTypes || field.formTypes.includes(formType.toUpperCase())
  );
}

/**
 * Get sections for a specific verification type and form type
 */
export function getFormSections(verificationType: string, formType?: string): string[] {
  const fields = getFormFieldDefinitions(verificationType, formType);
  const sections = new Set<string>();
  
  fields.forEach(field => sections.add(field.section));
  
  return Array.from(sections);
}

/**
 * Get fields for a specific section
 */
export function getFieldsForSection(verificationType: string, section: string, formType?: string): FormFieldDefinition[] {
  const fields = getFormFieldDefinitions(verificationType, formType);

  return fields
    .filter(field => field.section === section)
    .sort((a, b) => a.order - b.order);
}

/**
 * Create comprehensive form sections from form data
 */
export function createComprehensiveFormSections(
  formData: any,
  verificationType: string,
  formType: string
): FormSection[] {
  const sections: FormSection[] = [];
  const sectionNames = getFormSections(verificationType, formType);

  sectionNames.forEach((sectionName, index) => {
    const sectionFields = getFieldsForSection(verificationType, sectionName, formType);
    const populatedFields: FormField[] = [];

    sectionFields.forEach(fieldDef => {
      const value = formData[fieldDef.name] || formData[fieldDef.id];

      // Always include the field, even if empty (show "Not provided")
      populatedFields.push({
        id: fieldDef.id,
        name: fieldDef.name,
        label: fieldDef.label,
        type: fieldDef.type,
        value: value || null,
        displayValue: value || 'Not provided',
        isRequired: fieldDef.isRequired,
        validation: {
          isValid: true,
          errors: []
        }
      });
    });

    if (populatedFields.length > 0) {
      sections.push({
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        title: sectionName,
        description: `${sectionName} fields for ${formType} verification`,
        fields: populatedFields,
        order: index + 1,
        isRequired: sectionName === 'Basic Information',
        defaultExpanded: index < 2 // Expand first 2 sections by default
      });
    }
  });

  return sections;
}

/**
 * Get human-readable labels for form types
 */
export function getFormTypeLabel(formType: string): string {
  const labels: Record<string, string> = {
    'POSITIVE': 'Positive & Door Locked',
    'SHIFTED': 'Shifted & Door Lock',
    'NSP': 'NSP & Door Lock',
    'ENTRY_RESTRICTED': 'Entry Restricted (ERT)',
    'UNTRACEABLE': 'Untraceable'
  };

  return labels[formType.toUpperCase()] || formType;
}

/**
 * Get verification type specific table names
 */
export function getVerificationTableName(verificationType: string): string {
  const tableNames: Record<string, string> = {
    'RESIDENCE': 'residenceVerificationReports',
    'OFFICE': 'officeVerificationReports',
    'BUSINESS': 'businessVerificationReports',
    'BUILDER': 'builderVerificationReports',
    'RESIDENCE_CUM_OFFICE': 'residenceCumOfficeVerificationReports',
    'PROPERTY_APF': 'propertyApfVerificationReports',
    'NOC': 'nocVerificationReports',
    'PROPERTY_INDIVIDUAL': 'propertyIndividualVerificationReports',
    'DSA_CONNECTOR': 'dsaConnectorVerificationReports'
  };

  return tableNames[verificationType.toUpperCase()] || 'residenceVerificationReports';
}
