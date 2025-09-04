/**
 * Form Type Detection Utilities
 * 
 * This module provides utilities for detecting form types and verification outcomes
 * based on form data submitted from mobile applications.
 */

export interface FormTypeResult {
  formType: string;
  verificationOutcome: string;
}

/**
 * Verification outcome mappings for residence forms
 */
export const RESIDENCE_OUTCOME_MAPPING: Record<string, FormTypeResult> = {
  // Standard verification outcomes
  'VERIFIED': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
  'POSITIVE': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
  'Positive & Door Locked': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
  
  'SHIFTED': { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' },
  'Shifted & Door Lock': { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' },
  'Shifted & Door Locked': { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' },
  
  'NSP': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  'NSP & Door Lock': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  'NSP & NSP Door Locked': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  
  'ERT': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
  'ENTRY_RESTRICTED': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
  'Entry Restricted': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
  
  'UNTRACEABLE': { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' },
  'Untraceable': { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' },
  
  // Legacy mappings
  'NOT_VERIFIED': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  'NEGATIVE': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  'FRAUD': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  'REFER': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
  'HOLD': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
  'PARTIAL': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
};

/**
 * Detects residence form type and verification outcome based on form data
 * 
 * @param formData - The form data submitted from mobile app
 * @returns Object containing formType and verificationOutcome
 */
export function detectResidenceFormType(formData: any): FormTypeResult {
  // Check if formData contains verification outcome information
  const outcome = formData.outcome || formData.finalStatus || formData.verificationOutcome;
  
  console.log(`🔍 Analyzing residence form data for type detection:`, {
    outcome,
    hasCallRemark: !!formData.callRemark,
    hasShiftedPeriod: !!formData.shiftedPeriod,
    hasNameOfMetPerson: !!formData.nameOfMetPerson,
    hasStayingPersonName: !!formData.stayingPersonName,
    hasLandmark3: !!formData.landmark3,
    hasLandmark4: !!formData.landmark4,
    hasRoomStatus: !!formData.roomStatus,
    hasPremisesStatus: !!formData.premisesStatus,
    hasMetPersonType: !!formData.metPersonType,
    hasApplicantStayingStatus: !!formData.applicantStayingStatus,
    hasHouseStatus: !!formData.houseStatus,
    hasMetPersonStatus: !!formData.metPersonStatus
  });
  
  // Try to find mapping based on outcome
  if (outcome && RESIDENCE_OUTCOME_MAPPING[outcome]) {
    console.log(`✅ Found outcome mapping: ${outcome} -> ${RESIDENCE_OUTCOME_MAPPING[outcome].formType}`);
    return RESIDENCE_OUTCOME_MAPPING[outcome];
  }

  // Check for specific form indicators in formData
  // UNTRACEABLE form indicators
  if (formData.callRemark || formData.landmark3 || formData.landmark4) {
    console.log(`✅ Detected UNTRACEABLE form based on field indicators`);
    return { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' };
  }

  // SHIFTED form indicators
  if (formData.shiftedPeriod || formData.roomStatus || formData.premisesStatus) {
    console.log(`✅ Detected SHIFTED form based on field indicators`);
    return { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' };
  }

  // ENTRY_RESTRICTED form indicators
  if (formData.nameOfMetPerson || formData.metPersonType || formData.applicantStayingStatus) {
    console.log(`✅ Detected ENTRY_RESTRICTED form based on field indicators`);
    return { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' };
  }

  // NSP form indicators
  if (formData.stayingPersonName || (formData.houseStatus && formData.metPersonStatus)) {
    console.log(`✅ Detected NSP form based on field indicators`);
    return { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' };
  }

  // Default to POSITIVE if no specific indicators found
  console.log(`⚠️ No specific indicators found, defaulting to POSITIVE form`);
  return { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' };
}

/**
 * Detects office form type and verification outcome based on form data
 * 
 * @param formData - The form data submitted from mobile app
 * @returns Object containing formType and verificationOutcome
 */
export function detectOfficeFormType(formData: any): FormTypeResult {
  const outcome = formData.outcome || formData.finalStatus || formData.verificationOutcome;
  
  // Office forms use similar outcome mappings but with OFFICE prefix
  const officeOutcomeMapping: Record<string, FormTypeResult> = {
    'VERIFIED': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
    'POSITIVE': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
    'SHIFTED': { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' },
    'NSP': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
    'ERT': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
    'UNTRACEABLE': { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' },
    'NOT_VERIFIED': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
    'NEGATIVE': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  };

  if (outcome && officeOutcomeMapping[outcome]) {
    return officeOutcomeMapping[outcome];
  }

  // Default to POSITIVE for office forms
  return { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' };
}

/**
 * Detects business form type and verification outcome based on form data
 * 
 * @param formData - The form data submitted from mobile app
 * @returns Object containing formType and verificationOutcome
 */
export function detectBusinessFormType(formData: any): FormTypeResult {
  const outcome = formData.outcome || formData.finalStatus || formData.verificationOutcome;
  
  // Business forms use similar outcome mappings
  const businessOutcomeMapping: Record<string, FormTypeResult> = {
    'VERIFIED': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
    'POSITIVE': { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' },
    'SHIFTED': { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' },
    'NSP': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
    'ERT': { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' },
    'UNTRACEABLE': { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' },
    'NOT_VERIFIED': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
    'NEGATIVE': { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' },
  };

  if (outcome && businessOutcomeMapping[outcome]) {
    return businessOutcomeMapping[outcome];
  }

  // Default to POSITIVE for business forms
  return { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' };
}

/**
 * Generic form type detector that routes to specific detectors based on verification type
 * 
 * @param verificationType - The type of verification (RESIDENCE, OFFICE, BUSINESS, etc.)
 * @param formData - The form data submitted from mobile app
 * @returns Object containing formType and verificationOutcome
 */
export function detectFormType(verificationType: string, formData: any): FormTypeResult {
  const normalizedType = verificationType.toUpperCase();
  
  switch (normalizedType) {
    case 'RESIDENCE':
      return detectResidenceFormType(formData);
    case 'OFFICE':
      return detectOfficeFormType(formData);
    case 'BUSINESS':
      return detectBusinessFormType(formData);
    default:
      console.warn(`⚠️ Unknown verification type: ${verificationType}, defaulting to POSITIVE`);
      return { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' };
  }
}

/**
 * Validates if a form type is valid for a given verification type
 * 
 * @param verificationType - The verification type
 * @param formType - The form type to validate
 * @returns True if valid, false otherwise
 */
export function isValidFormType(verificationType: string, formType: string): boolean {
  const validFormTypes = ['POSITIVE', 'SHIFTED', 'NSP', 'ENTRY_RESTRICTED', 'UNTRACEABLE'];
  return validFormTypes.includes(formType.toUpperCase());
}

/**
 * Gets all possible form types for a verification type
 * 
 * @param verificationType - The verification type
 * @returns Array of valid form types
 */
export function getValidFormTypes(verificationType: string): string[] {
  return ['POSITIVE', 'SHIFTED', 'NSP', 'ENTRY_RESTRICTED', 'UNTRACEABLE'];
}
