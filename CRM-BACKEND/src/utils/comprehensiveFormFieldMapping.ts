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
  
  // Personal & Family Details
  { id: 'metPersonRelation', name: 'metPersonRelation', label: 'Met Person Relation', type: 'select', isRequired: false, section: 'Personal Details', order: 1, formTypes: ['POSITIVE'] },
  { id: 'metPersonStatus', name: 'metPersonStatus', label: 'Met Person Status', type: 'select', isRequired: false, section: 'Personal Details', order: 2, formTypes: ['POSITIVE', 'NSP', 'SHIFTED', 'ENTRY_RESTRICTED'] },
  { id: 'totalFamilyMembers', name: 'totalFamilyMembers', label: 'Total Family Members', type: 'number', isRequired: false, section: 'Personal Details', order: 3, formTypes: ['POSITIVE'] },
  { id: 'workingStatus', name: 'workingStatus', label: 'Working Status', type: 'select', isRequired: false, section: 'Personal Details', order: 4, formTypes: ['POSITIVE'] },
  { id: 'stayingPeriod', name: 'stayingPeriod', label: 'Staying Period', type: 'text', isRequired: false, section: 'Personal Details', order: 5, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'stayingStatus', name: 'stayingStatus', label: 'Staying Status', type: 'select', isRequired: false, section: 'Personal Details', order: 6, formTypes: ['POSITIVE'] },
  
  // Document Verification (POSITIVE specific)
  { id: 'documentShownStatus', name: 'documentShownStatus', label: 'Document Shown Status', type: 'select', isRequired: false, section: 'Document Verification', order: 1, formTypes: ['POSITIVE'] },
  { id: 'documentType', name: 'documentType', label: 'Document Type', type: 'select', isRequired: false, section: 'Document Verification', order: 2, formTypes: ['POSITIVE'] },
  
  // House & Property Details
  { id: 'houseStatus', name: 'houseStatus', label: 'House Status', type: 'select', isRequired: false, section: 'Property Details', order: 1, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'roomStatus', name: 'roomStatus', label: 'Room Status', type: 'select', isRequired: false, section: 'Property Details', order: 2, formTypes: ['NSP', 'SHIFTED'] },
  { id: 'doorColor', name: 'doorColor', label: 'Door Color', type: 'text', isRequired: false, section: 'Property Details', order: 3, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'doorNamePlateStatus', name: 'doorNamePlateStatus', label: 'Door Name Plate Status', type: 'select', isRequired: false, section: 'Property Details', order: 4, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'nameOnDoorPlate', name: 'nameOnDoorPlate', label: 'Name on Door Plate', type: 'text', isRequired: false, section: 'Property Details', order: 5, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'societyNamePlateStatus', name: 'societyNamePlateStatus', label: 'Society Name Plate Status', type: 'select', isRequired: false, section: 'Property Details', order: 6, formTypes: ['POSITIVE', 'NSP'] },
  { id: 'nameOnSocietyBoard', name: 'nameOnSocietyBoard', label: 'Name on Society Board', type: 'text', isRequired: false, section: 'Property Details', order: 7, formTypes: ['POSITIVE', 'NSP'] },
  
  // Shifting Details (SHIFTED specific)
  { id: 'shiftedPeriod', name: 'shiftedPeriod', label: 'Shifted Period', type: 'text', isRequired: false, section: 'Shifting Details', order: 1, formTypes: ['SHIFTED'] },
  { id: 'currentLocation', name: 'currentLocation', label: 'Current Location', type: 'text', isRequired: false, section: 'Shifting Details', order: 2, formTypes: ['SHIFTED'] },
  { id: 'premisesStatus', name: 'premisesStatus', label: 'Premises Status', type: 'select', isRequired: false, section: 'Shifting Details', order: 3, formTypes: ['SHIFTED'] },
  { id: 'roomStatus', name: 'roomStatus', label: 'Room Status', type: 'select', isRequired: false, section: 'Shifting Details', order: 4, formTypes: ['SHIFTED'] },
  
  // NSP Details (NSP specific)
  { id: 'stayingPersonName', name: 'stayingPersonName', label: 'Staying Person Name', type: 'text', isRequired: false, section: 'NSP Details', order: 1, formTypes: ['NSP'] },
  { id: 'shiftedPeriod', name: 'shiftedPeriod', label: 'Shifted Period', type: 'text', isRequired: false, section: 'NSP Details', order: 2, formTypes: ['NSP'] },
  
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
  { id: 'applicantDesignation', name: 'applicantDesignation', label: 'Applicant Designation', type: 'text', isRequired: false, section: 'Basic Information', order: 5 },

  // Office Details Section
  { id: 'officeStatus', name: 'officeStatus', label: 'Office Status', type: 'select', isRequired: false, section: 'Office Details', order: 1 },
  { id: 'officeType', name: 'officeType', label: 'Office Type', type: 'select', isRequired: false, section: 'Office Details', order: 2 },
  { id: 'companyNatureOfBusiness', name: 'companyNatureOfBusiness', label: 'Company Nature of Business', type: 'text', isRequired: false, section: 'Office Details', order: 3 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'Office Details', order: 4 },
  { id: 'establishmentPeriod', name: 'establishmentPeriod', label: 'Establishment Period', type: 'text', isRequired: false, section: 'Office Details', order: 5 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'Office Details', order: 6 },
  { id: 'staffSeen', name: 'staffSeen', label: 'Staff Seen', type: 'number', isRequired: false, section: 'Office Details', order: 7 },
  { id: 'workingPeriod', name: 'workingPeriod', label: 'Working Period', type: 'text', isRequired: false, section: 'Office Details', order: 8 },
  { id: 'workingStatus', name: 'workingStatus', label: 'Working Status', type: 'select', isRequired: false, section: 'Office Details', order: 9 },
  { id: 'officeApproxArea', name: 'officeApproxArea', label: 'Office Approximate Area', type: 'number', isRequired: false, section: 'Office Details', order: 10 },

  // Document Verification Section
  { id: 'documentShown', name: 'documentShown', label: 'Document Shown', type: 'text', isRequired: false, section: 'Document Verification', order: 1 },
  { id: 'documentType', name: 'documentType', label: 'Document Type', type: 'text', isRequired: false, section: 'Document Verification', order: 2 },

  // Address & Location Section
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: true, section: 'Location Details', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: true, section: 'Location Details', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality Type', type: 'select', isRequired: false, section: 'Location Details', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'select', isRequired: false, section: 'Location Details', order: 4 },
  { id: 'addressFloor', name: 'addressFloor', label: 'Address Floor', type: 'text', isRequired: false, section: 'Location Details', order: 5 },
  { id: 'companyNamePlateStatus', name: 'companyNamePlateStatus', label: 'Company Name Plate Status', type: 'select', isRequired: false, section: 'Location Details', order: 6 },
  { id: 'nameOnCompanyBoard', name: 'nameOnCompanyBoard', label: 'Name on Company Board', type: 'text', isRequired: false, section: 'Location Details', order: 7 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Location Details', order: 8 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Location Details', order: 9 },
  { id: 'landmark3', name: 'landmark3', label: 'Landmark 3', type: 'text', isRequired: false, section: 'Location Details', order: 10 },
  { id: 'landmark4', name: 'landmark4', label: 'Landmark 4', type: 'text', isRequired: false, section: 'Location Details', order: 11 },

  // TPC Details Section
  { id: 'tpcMetPerson1', name: 'tpcMetPerson1', label: 'TPC Met Person 1', type: 'select', isRequired: false, section: 'TPC Details', order: 1 },
  { id: 'tpcName1', name: 'tpcName1', label: 'TPC Name 1', type: 'text', isRequired: false, section: 'TPC Details', order: 2 },
  { id: 'tpcConfirmation1', name: 'tpcConfirmation1', label: 'TPC Confirmation 1', type: 'select', isRequired: false, section: 'TPC Details', order: 3 },
  { id: 'tpcMetPerson2', name: 'tpcMetPerson2', label: 'TPC Met Person 2', type: 'select', isRequired: false, section: 'TPC Details', order: 4 },
  { id: 'tpcName2', name: 'tpcName2', label: 'TPC Name 2', type: 'text', isRequired: false, section: 'TPC Details', order: 5 },
  { id: 'tpcConfirmation2', name: 'tpcConfirmation2', label: 'TPC Confirmation 2', type: 'select', isRequired: false, section: 'TPC Details', order: 6 },

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

// Property APF form field definitions (based on actual database fields)
const PROPERTY_APF_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'text', isRequired: false, section: 'Basic Information', order: 2 },
  { id: 'metPerson', name: 'metPerson', label: 'Met Person', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'relationship', name: 'relationship', label: 'Relationship', type: 'text', isRequired: false, section: 'Basic Information', order: 4 },
  { id: 'remarks', name: 'remarks', label: 'Remarks', type: 'textarea', isRequired: false, section: 'Basic Information', order: 5 },

  // Address Information
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'addressStructureColor', name: 'addressStructureColor', label: 'Address Structure Color', type: 'text', isRequired: false, section: 'Address Information', order: 5 },
  { id: 'doorColor', name: 'doorColor', label: 'Door Color', type: 'text', isRequired: false, section: 'Address Information', order: 6 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 7 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 8 },

  // Property Details
  { id: 'propertyOwnerName', name: 'propertyOwnerName', label: 'Property Owner Name', type: 'text', isRequired: false, section: 'Property Details', order: 1 },
  { id: 'buildingStatus', name: 'buildingStatus', label: 'Building Status', type: 'text', isRequired: false, section: 'Property Details', order: 2 },
  { id: 'approxArea', name: 'approxArea', label: 'Approximate Area', type: 'number', isRequired: false, section: 'Property Details', order: 3 },
  { id: 'totalFlats', name: 'totalFlats', label: 'Total Flats', type: 'text', isRequired: false, section: 'Property Details', order: 4 },
  { id: 'flatStatus', name: 'flatStatus', label: 'Flat Status', type: 'text', isRequired: false, section: 'Property Details', order: 5 },

  // Project Information
  { id: 'projectName', name: 'projectName', label: 'Project Name', type: 'text', isRequired: false, section: 'Project Information', order: 1 },
  { id: 'projectCompletionPercent', name: 'projectCompletionPercent', label: 'Project Completion %', type: 'text', isRequired: false, section: 'Project Information', order: 2 },

  // Staff Information
  { id: 'staffSeen', name: 'staffSeen', label: 'Staff Seen', type: 'text', isRequired: false, section: 'Staff Information', order: 1 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'text', isRequired: false, section: 'Staff Information', order: 2 },

  // Name Plates & Boards
  { id: 'nameOnBoard', name: 'nameOnBoard', label: 'Name on Board', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 1 },
  { id: 'nameOnDoorPlate', name: 'nameOnDoorPlate', label: 'Name on Door Plate', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 2 },
  { id: 'nameOnSocietyBoard', name: 'nameOnSocietyBoard', label: 'Name on Society Board', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 3 },
  { id: 'doorNamePlateStatus', name: 'doorNamePlateStatus', label: 'Door Name Plate Status', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 4 },
  { id: 'societyNamePlateStatus', name: 'societyNamePlateStatus', label: 'Society Name Plate Status', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 5 },

  // Third Party Confirmation
  { id: 'nameOfTpc1', name: 'nameOfTpc1', label: 'Name of TPC 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 1 },
  { id: 'tpcMetPerson1', name: 'tpcMetPerson1', label: 'TPC Met Person 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 2 },
  { id: 'tpcConfirmation1', name: 'tpcConfirmation1', label: 'TPC Confirmation 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 3 },
  { id: 'nameOfTpc2', name: 'nameOfTpc2', label: 'Name of TPC 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 4 },
  { id: 'tpcMetPerson2', name: 'tpcMetPerson2', label: 'TPC Met Person 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 5 },
  { id: 'tpcConfirmation2', name: 'tpcConfirmation2', label: 'TPC Confirmation 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 6 },

  // Additional Information
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'text', isRequired: false, section: 'Additional Information', order: 1 },
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'text', isRequired: false, section: 'Additional Information', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback from Neighbour', type: 'text', isRequired: false, section: 'Additional Information', order: 3 },
  { id: 'activityStopReason', name: 'activityStopReason', label: 'Activity Stop Reason', type: 'text', isRequired: false, section: 'Additional Information', order: 4 },
  { id: 'addressExistAt', name: 'addressExistAt', label: 'Address Exist At', type: 'text', isRequired: false, section: 'Additional Information', order: 5 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observation', type: 'textarea', isRequired: false, section: 'Additional Information', order: 6 },
  { id: 'holdReason', name: 'holdReason', label: 'Hold Reason', type: 'text', isRequired: false, section: 'Additional Information', order: 7 },
  { id: 'builderContact', name: 'builderContact', label: 'Builder Contact', type: 'text', isRequired: false, section: 'Builder Information', order: 2 },
  { id: 'developerName', name: 'developerName', label: 'Developer Name', type: 'text', isRequired: false, section: 'Builder Information', order: 3 },
  { id: 'developerContact', name: 'developerContact', label: 'Developer Contact', type: 'text', isRequired: false, section: 'Builder Information', order: 4 },
  { id: 'builderRegistrationNumber', name: 'builderRegistrationNumber', label: 'Builder Registration Number', type: 'text', isRequired: false, section: 'Builder Information', order: 5 },
  { id: 'reraRegistrationNumber', name: 'reraRegistrationNumber', label: 'RERA Registration Number', type: 'text', isRequired: false, section: 'Builder Information', order: 6 },

  // Area Assessment
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'select', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'select', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback from Neighbour', type: 'select', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Area Assessment', order: 5 },
];

// Property Individual form field definitions (based on actual database fields)
const PROPERTY_INDIVIDUAL_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'text', isRequired: false, section: 'Basic Information', order: 2 },
  { id: 'metPerson', name: 'metPerson', label: 'Met Person', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'relationship', name: 'relationship', label: 'Relationship', type: 'text', isRequired: false, section: 'Basic Information', order: 4 },
  { id: 'remarks', name: 'remarks', label: 'Remarks', type: 'textarea', isRequired: false, section: 'Basic Information', order: 5 },

  // Address Information
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'addressStructureColor', name: 'addressStructureColor', label: 'Address Structure Color', type: 'text', isRequired: false, section: 'Address Information', order: 5 },
  { id: 'doorColor', name: 'doorColor', label: 'Door Color', type: 'text', isRequired: false, section: 'Address Information', order: 6 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 7 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 8 },

  // Property Details
  { id: 'propertyOwnerName', name: 'propertyOwnerName', label: 'Property Owner Name', type: 'text', isRequired: false, section: 'Property Details', order: 1 },
  { id: 'buildingStatus', name: 'buildingStatus', label: 'Building Status', type: 'text', isRequired: false, section: 'Property Details', order: 2 },
  { id: 'flatStatus', name: 'flatStatus', label: 'Flat Status', type: 'text', isRequired: false, section: 'Property Details', order: 3 },

  // Name Plates & Boards
  { id: 'nameOnDoorPlate', name: 'nameOnDoorPlate', label: 'Name on Door Plate', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 1 },
  { id: 'nameOnSocietyBoard', name: 'nameOnSocietyBoard', label: 'Name on Society Board', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 2 },
  { id: 'doorNamePlateStatus', name: 'doorNamePlateStatus', label: 'Door Name Plate Status', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 3 },
  { id: 'societyNamePlateStatus', name: 'societyNamePlateStatus', label: 'Society Name Plate Status', type: 'text', isRequired: false, section: 'Name Plates & Boards', order: 4 },

  // Third Party Confirmation
  { id: 'nameOfTpc1', name: 'nameOfTpc1', label: 'Name of TPC 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 1 },
  { id: 'tpcMetPerson1', name: 'tpcMetPerson1', label: 'TPC Met Person 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 2 },
  { id: 'tpcConfirmation1', name: 'tpcConfirmation1', label: 'TPC Confirmation 1', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 3 },
  { id: 'nameOfTpc2', name: 'nameOfTpc2', label: 'Name of TPC 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 4 },
  { id: 'tpcMetPerson2', name: 'tpcMetPerson2', label: 'TPC Met Person 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 5 },
  { id: 'tpcConfirmation2', name: 'tpcConfirmation2', label: 'TPC Confirmation 2', type: 'text', isRequired: false, section: 'Third Party Confirmation', order: 6 },

  // Area Assessment
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'text', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'text', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback from Neighbour', type: 'text', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observation', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'holdReason', name: 'holdReason', label: 'Hold Reason', type: 'text', isRequired: false, section: 'Area Assessment', order: 5 },
];

// NOC form field definitions
const NOC_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },

  // NOC Information
  { id: 'nocType', name: 'nocType', label: 'NOC Type', type: 'text', isRequired: false, section: 'NOC Information', order: 1 },
  { id: 'nocStatus', name: 'nocStatus', label: 'NOC Status', type: 'text', isRequired: false, section: 'NOC Information', order: 2 },
  { id: 'nocNumber', name: 'nocNumber', label: 'NOC Number', type: 'text', isRequired: false, section: 'NOC Information', order: 3 },
  { id: 'nocValidityStatus', name: 'nocValidityStatus', label: 'NOC Validity Status', type: 'text', isRequired: false, section: 'NOC Information', order: 4 },

  // Authority Information
  { id: 'authorityName', name: 'authorityName', label: 'Authority Name', type: 'text', isRequired: false, section: 'Authority Information', order: 1 },
  { id: 'authorityContact', name: 'authorityContact', label: 'Authority Contact', type: 'text', isRequired: false, section: 'Authority Information', order: 2 },
  { id: 'officerName', name: 'officerName', label: 'Officer Name', type: 'text', isRequired: false, section: 'Authority Information', order: 3 },
  { id: 'officerDesignation', name: 'officerDesignation', label: 'Officer Designation', type: 'text', isRequired: false, section: 'Authority Information', order: 4 },

  // Address Information
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 5 },

  // Final Assessment
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Final Assessment', order: 1 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Final Assessment', order: 2 },
];

// Builder form field definitions
const BUILDER_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },

  // Builder Information
  { id: 'builderName', name: 'builderName', label: 'Builder Name', type: 'text', isRequired: false, section: 'Builder Information', order: 1 },
  { id: 'builderStatus', name: 'builderStatus', label: 'Builder Status', type: 'text', isRequired: false, section: 'Builder Information', order: 2 },
  { id: 'builderType', name: 'builderType', label: 'Builder Type', type: 'text', isRequired: false, section: 'Builder Information', order: 3 },
  { id: 'builderRegistrationNumber', name: 'builderRegistrationNumber', label: 'Builder Registration Number', type: 'text', isRequired: false, section: 'Builder Information', order: 4 },
  { id: 'reraRegistrationNumber', name: 'reraRegistrationNumber', label: 'RERA Registration Number', type: 'text', isRequired: false, section: 'Builder Information', order: 5 },
  { id: 'establishmentYear', name: 'establishmentYear', label: 'Establishment Year', type: 'number', isRequired: false, section: 'Builder Information', order: 6 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'Builder Information', order: 7 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'Builder Information', order: 8 },
  { id: 'projectsCompleted', name: 'projectsCompleted', label: 'Projects Completed', type: 'number', isRequired: false, section: 'Builder Information', order: 9 },
  { id: 'projectsOngoing', name: 'projectsOngoing', label: 'Projects Ongoing', type: 'number', isRequired: false, section: 'Builder Information', order: 10 },

  // Office Information
  { id: 'officeType', name: 'officeType', label: 'Office Type', type: 'text', isRequired: false, section: 'Office Information', order: 1 },
  { id: 'officeStatus', name: 'officeStatus', label: 'Office Status', type: 'text', isRequired: false, section: 'Office Information', order: 2 },
  { id: 'companyNamePlateStatus', name: 'companyNamePlateStatus', label: 'Company Name Plate Status', type: 'text', isRequired: false, section: 'Office Information', order: 3 },
  { id: 'nameOnCompanyBoard', name: 'nameOnCompanyBoard', label: 'Name on Company Board', type: 'text', isRequired: false, section: 'Office Information', order: 4 },

  // Address Information
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 5 },

  // Final Assessment
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Final Assessment', order: 1 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Final Assessment', order: 2 },
];

// DSA Connector form field definitions
const DSA_CONNECTOR_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },

  // DSA Information
  { id: 'dsaName', name: 'dsaName', label: 'DSA Name', type: 'text', isRequired: false, section: 'DSA Information', order: 1 },
  { id: 'dsaStatus', name: 'dsaStatus', label: 'DSA Status', type: 'text', isRequired: false, section: 'DSA Information', order: 2 },
  { id: 'dsaType', name: 'dsaType', label: 'DSA Type', type: 'text', isRequired: false, section: 'DSA Information', order: 3 },
  { id: 'dsaCode', name: 'dsaCode', label: 'DSA Code', type: 'text', isRequired: false, section: 'DSA Information', order: 4 },
  { id: 'dsaRegistrationNumber', name: 'dsaRegistrationNumber', label: 'DSA Registration Number', type: 'text', isRequired: false, section: 'DSA Information', order: 5 },
  { id: 'establishmentYear', name: 'establishmentYear', label: 'Establishment Year', type: 'number', isRequired: false, section: 'DSA Information', order: 6 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'DSA Information', order: 7 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'DSA Information', order: 8 },

  // Office Information
  { id: 'officeType', name: 'officeType', label: 'Office Type', type: 'text', isRequired: false, section: 'Office Information', order: 1 },
  { id: 'officeStatus', name: 'officeStatus', label: 'Office Status', type: 'text', isRequired: false, section: 'Office Information', order: 2 },
  { id: 'companyNamePlateStatus', name: 'companyNamePlateStatus', label: 'Company Name Plate Status', type: 'text', isRequired: false, section: 'Office Information', order: 3 },
  { id: 'nameOnCompanyBoard', name: 'nameOnCompanyBoard', label: 'Name on Company Board', type: 'text', isRequired: false, section: 'Office Information', order: 4 },

  // Address Information
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 5 },

  // Final Assessment
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Final Assessment', order: 1 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Final Assessment', order: 2 },
];

// Residence-cum-Office form field definitions (combines residence and office fields)
const RESIDENCE_CUM_OFFICE_FORM_FIELDS: FormFieldDefinition[] = [
  // Basic Information
  { id: 'customerName', name: 'customerName', label: 'Customer Name', type: 'text', isRequired: true, section: 'Basic Information', order: 1 },
  { id: 'outcome', name: 'outcome', label: 'Verification Outcome', type: 'select', isRequired: true, section: 'Basic Information', order: 2 },
  { id: 'metPersonName', name: 'metPersonName', label: 'Met Person Name', type: 'text', isRequired: false, section: 'Basic Information', order: 3 },
  { id: 'metPersonRelation', name: 'metPersonRelation', label: 'Met Person Relation', type: 'text', isRequired: false, section: 'Basic Information', order: 4 },

  // Residence Information
  { id: 'houseStatus', name: 'houseStatus', label: 'House Status', type: 'text', isRequired: false, section: 'Residence Information', order: 1 },
  { id: 'totalFamilyMembers', name: 'totalFamilyMembers', label: 'Total Family Members', type: 'number', isRequired: false, section: 'Residence Information', order: 2 },
  { id: 'workingStatus', name: 'workingStatus', label: 'Working Status', type: 'text', isRequired: false, section: 'Residence Information', order: 3 },
  { id: 'stayingPeriod', name: 'stayingPeriod', label: 'Staying Period', type: 'text', isRequired: false, section: 'Residence Information', order: 4 },
  { id: 'stayingStatus', name: 'stayingStatus', label: 'Staying Status', type: 'text', isRequired: false, section: 'Residence Information', order: 5 },
  { id: 'doorNamePlateStatus', name: 'doorNamePlateStatus', label: 'Door Name Plate Status', type: 'text', isRequired: false, section: 'Residence Information', order: 6 },
  { id: 'nameOnDoorPlate', name: 'nameOnDoorPlate', label: 'Name on Door Plate', type: 'text', isRequired: false, section: 'Residence Information', order: 7 },

  // Office Information
  { id: 'designation', name: 'designation', label: 'Designation', type: 'text', isRequired: false, section: 'Office Information', order: 1 },
  { id: 'officeStatus', name: 'officeStatus', label: 'Office Status', type: 'text', isRequired: false, section: 'Office Information', order: 2 },
  { id: 'officeType', name: 'officeType', label: 'Office Type', type: 'text', isRequired: false, section: 'Office Information', order: 3 },
  { id: 'companyNatureOfBusiness', name: 'companyNatureOfBusiness', label: 'Company Nature of Business', type: 'text', isRequired: false, section: 'Office Information', order: 4 },
  { id: 'businessPeriod', name: 'businessPeriod', label: 'Business Period', type: 'text', isRequired: false, section: 'Office Information', order: 5 },
  { id: 'staffStrength', name: 'staffStrength', label: 'Staff Strength', type: 'number', isRequired: false, section: 'Office Information', order: 6 },
  { id: 'workingPeriod', name: 'workingPeriod', label: 'Working Period', type: 'text', isRequired: false, section: 'Office Information', order: 7 },
  { id: 'companyNamePlateStatus', name: 'companyNamePlateStatus', label: 'Company Name Plate Status', type: 'text', isRequired: false, section: 'Office Information', order: 8 },
  { id: 'nameOnCompanyBoard', name: 'nameOnCompanyBoard', label: 'Name on Company Board', type: 'text', isRequired: false, section: 'Office Information', order: 9 },
  { id: 'societyNamePlateStatus', name: 'societyNamePlateStatus', label: 'Society Name Plate Status', type: 'text', isRequired: false, section: 'Office Information', order: 10 },
  { id: 'nameOnSocietyBoard', name: 'nameOnSocietyBoard', label: 'Name on Society Board', type: 'text', isRequired: false, section: 'Office Information', order: 11 },

  // Address Information
  { id: 'addressLocatable', name: 'addressLocatable', label: 'Address Locatable', type: 'select', isRequired: false, section: 'Address Information', order: 1 },
  { id: 'addressRating', name: 'addressRating', label: 'Address Rating', type: 'select', isRequired: false, section: 'Address Information', order: 2 },
  { id: 'locality', name: 'locality', label: 'Locality', type: 'text', isRequired: false, section: 'Address Information', order: 3 },
  { id: 'addressStructure', name: 'addressStructure', label: 'Address Structure', type: 'text', isRequired: false, section: 'Address Information', order: 4 },
  { id: 'doorColor', name: 'doorColor', label: 'Door Color', type: 'text', isRequired: false, section: 'Address Information', order: 5 },
  { id: 'landmark1', name: 'landmark1', label: 'Landmark 1', type: 'text', isRequired: false, section: 'Address Information', order: 6 },
  { id: 'landmark2', name: 'landmark2', label: 'Landmark 2', type: 'text', isRequired: false, section: 'Address Information', order: 7 },
  { id: 'landmark3', name: 'landmark3', label: 'Landmark 3', type: 'text', isRequired: false, section: 'Address Information', order: 8 },
  { id: 'landmark4', name: 'landmark4', label: 'Landmark 4', type: 'text', isRequired: false, section: 'Address Information', order: 9 },

  // Area Assessment
  { id: 'politicalConnection', name: 'politicalConnection', label: 'Political Connection', type: 'select', isRequired: false, section: 'Area Assessment', order: 1 },
  { id: 'dominatedArea', name: 'dominatedArea', label: 'Dominated Area', type: 'select', isRequired: false, section: 'Area Assessment', order: 2 },
  { id: 'feedbackFromNeighbour', name: 'feedbackFromNeighbour', label: 'Feedback from Neighbour', type: 'select', isRequired: false, section: 'Area Assessment', order: 3 },
  { id: 'otherObservation', name: 'otherObservation', label: 'Other Observations', type: 'textarea', isRequired: false, section: 'Area Assessment', order: 4 },
  { id: 'finalStatus', name: 'finalStatus', label: 'Final Status', type: 'select', isRequired: true, section: 'Area Assessment', order: 5 },
];

// Field definitions mapping by verification type
export const VERIFICATION_TYPE_FIELDS: Record<string, FormFieldDefinition[]> = {
  'RESIDENCE': RESIDENCE_FORM_FIELDS,
  'OFFICE': OFFICE_FORM_FIELDS,
  'BUSINESS': BUSINESS_FORM_FIELDS,
  'PROPERTY_APF': PROPERTY_APF_FORM_FIELDS,
  'PROPERTY_INDIVIDUAL': PROPERTY_INDIVIDUAL_FORM_FIELDS,
  'NOC': NOC_FORM_FIELDS,
  'BUILDER': BUILDER_FORM_FIELDS,
  'DSA_CONNECTOR': DSA_CONNECTOR_FORM_FIELDS,
  'CONNECTOR': DSA_CONNECTOR_FORM_FIELDS, // Alias for DSA_CONNECTOR
  'RESIDENCE_CUM_OFFICE': RESIDENCE_CUM_OFFICE_FORM_FIELDS,
  'Residence-cum-office': RESIDENCE_CUM_OFFICE_FORM_FIELDS, // Alias for RESIDENCE_CUM_OFFICE
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
  console.log(`Creating comprehensive sections for ${verificationType} - ${formType}`);
  console.log('Form data keys:', Object.keys(formData));
  console.log('Form data sample:', JSON.stringify(formData, null, 2).substring(0, 500));

  const sections: FormSection[] = [];
  const sectionNames = getFormSections(verificationType, formType);
  console.log(`Found ${sectionNames.length} sections:`, sectionNames);

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
