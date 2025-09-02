import { query } from '../config/database';

export interface NormalizedFormData {
  // Common fields across all verification types
  customerInfo: {
    name: string;
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    dateOfBirth?: string;
    age?: number;
    gender?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    monthlyIncome?: number;
    phoneNumber?: string;
    alternatePhoneNumber?: string;
    email?: string;
    panNumber?: string;
    aadharNumber?: string;
  };
  
  addressInfo: {
    fullAddress: string;
    houseNumber?: string;
    streetName?: string;
    locality?: string;
    landmark?: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
    addressType?: 'PERMANENT' | 'CURRENT' | 'OFFICE' | 'BUSINESS';
    addressLocatable: boolean;
    addressRating?: number;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
  };
  
  verificationDetails: {
    verificationType: string;
    verificationDate: string;
    verificationTime: string;
    verifierName: string;
    verifierEmployeeId?: string;
    metPersonName?: string;
    relationshipWithApplicant?: string;
    personMetDetails?: string;
    verificationMethod: 'PHYSICAL_VISIT' | 'TELEPHONIC' | 'DIGITAL';
    documentsVerified: string[];
    documentsCollected: string[];
  };
  
  propertyDetails?: {
    propertyType?: 'OWNED' | 'RENTED' | 'FAMILY_OWNED' | 'COMPANY_PROVIDED';
    propertyStatus?: 'UNDER_CONSTRUCTION' | 'READY' | 'OCCUPIED';
    constructionQuality?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    propertyValue?: number;
    monthlyRent?: number;
    ownershipDuration?: number;
    totalFamilyMembers?: number;
    workingMembers?: number;
    dependents?: number;
  };
  
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    businessNature?: string;
    establishmentYear?: number;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessRegistrationNumber?: string;
    gstNumber?: string;
    businessTurnover?: number;
    numberOfEmployees?: number;
    businessOwnership?: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED';
  };
  
  verificationOutcome: {
    finalStatus: 'POSITIVE' | 'NEGATIVE' | 'REFER_TO_CREDIT';
    recommendationStatus?: 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'CONDITIONAL';
    riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
    creditLimit?: number;
    remarks?: string;
    reasonForNegative?: string;
    additionalComments?: string;
  };
  
  metadata: {
    formVersion: string;
    submissionTimestamp: string;
    deviceInfo?: any;
    networkInfo?: any;
    geoLocation?: any;
    photos: Array<{
      attachmentId: string;
      category: string;
      geoLocation?: any;
    }>;
  };
}

export interface ValidationRule {
  field: string;
  type: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'ENUM' | 'CUSTOM';
  rule: string | RegExp | ((value: any) => boolean);
  message: string;
  verificationType?: string[];
}

class DataTransformationService {
  private validationRules: ValidationRule[] = [
    // Customer Info Validations
    { field: 'customerInfo.name', type: 'REQUIRED', rule: '', message: 'Customer name is required' },
    { field: 'customerInfo.phoneNumber', type: 'FORMAT', rule: /^[6-9]\d{9}$/, message: 'Invalid phone number format' },
    { field: 'customerInfo.email', type: 'FORMAT', rule: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    { field: 'customerInfo.panNumber', type: 'FORMAT', rule: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN number format' },
    { field: 'customerInfo.aadharNumber', type: 'FORMAT', rule: /^\d{12}$/, message: 'Invalid Aadhar number format' },
    { field: 'customerInfo.age', type: 'RANGE', rule: '18-100', message: 'Age must be between 18 and 100' },
    
    // Address Info Validations
    { field: 'addressInfo.fullAddress', type: 'REQUIRED', rule: '', message: 'Full address is required' },
    { field: 'addressInfo.city', type: 'REQUIRED', rule: '', message: 'City is required' },
    { field: 'addressInfo.state', type: 'REQUIRED', rule: '', message: 'State is required' },
    { field: 'addressInfo.pincode', type: 'FORMAT', rule: /^\d{6}$/, message: 'Invalid pincode format' },
    { field: 'addressInfo.addressLocatable', type: 'REQUIRED', rule: '', message: 'Address locatable status is required' },
    
    // Verification Details Validations
    { field: 'verificationDetails.verificationType', type: 'ENUM', rule: ['residence', 'office', 'business', 'builder', 'residence-cum-office', 'dsa-connector', 'property-individual', 'property-apf', 'noc'], message: 'Invalid verification type' },
    { field: 'verificationDetails.verificationDate', type: 'REQUIRED', rule: '', message: 'Verification date is required' },
    { field: 'verificationDetails.verifierName', type: 'REQUIRED', rule: '', message: 'Verifier name is required' },
    { field: 'verificationDetails.verificationMethod', type: 'ENUM', rule: ['PHYSICAL_VISIT', 'TELEPHONIC', 'DIGITAL'], message: 'Invalid verification method' },
    
    // Verification Outcome Validations
    { field: 'verificationOutcome.finalStatus', type: 'ENUM', rule: ['POSITIVE', 'NEGATIVE', 'REFER_TO_CREDIT'], message: 'Invalid final status' },
    { field: 'verificationOutcome.recommendationStatus', type: 'ENUM', rule: ['RECOMMENDED', 'NOT_RECOMMENDED', 'CONDITIONAL'], message: 'Invalid recommendation status' },
    { field: 'verificationOutcome.riskCategory', type: 'ENUM', rule: ['LOW', 'MEDIUM', 'HIGH'], message: 'Invalid risk category' },
    
    // Business-specific validations
    { field: 'businessDetails.gstNumber', type: 'FORMAT', rule: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, message: 'Invalid GST number format', verificationType: ['business', 'office'] },
    { field: 'businessDetails.businessTurnover', type: 'RANGE', rule: '0-999999999', message: 'Invalid business turnover', verificationType: ['business'] },
  ];

  /**
   * Transform raw form data to normalized structure
   */
  async transformFormData(
    rawFormData: any,
    verificationType: string,
    attachmentIds: string[],
    photos: any[],
    geoLocation: any,
    metadata: any
  ): Promise<NormalizedFormData> {
    const normalized: NormalizedFormData = {
      customerInfo: this.extractCustomerInfo(rawFormData),
      addressInfo: this.extractAddressInfo(rawFormData, verificationType, geoLocation),
      verificationDetails: this.extractVerificationDetails(rawFormData, verificationType, metadata),
      verificationOutcome: this.extractVerificationOutcome(rawFormData),
      metadata: {
        formVersion: '2.0',
        submissionTimestamp: new Date().toISOString(),
        deviceInfo: metadata.deviceInfo,
        networkInfo: metadata.networkInfo,
        geoLocation,
        photos: photos.map(photo => ({
          attachmentId: photo.attachmentId,
          category: 'VERIFICATION_PHOTO',
          geoLocation: photo.geoLocation
        }))
      }
    };

    // Add type-specific details
    if (['residence', 'property-individual', 'property-apf'].includes(verificationType)) {
      normalized.propertyDetails = this.extractPropertyDetails(rawFormData);
    }

    if (['business', 'office', 'builder'].includes(verificationType)) {
      normalized.businessDetails = this.extractBusinessDetails(rawFormData);
    }

    return normalized;
  }

  /**
   * Validate normalized form data against business rules
   */
  async validateFormData(
    normalizedData: NormalizedFormData,
    verificationType: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const rule of this.validationRules) {
      // Skip rule if it's specific to other verification types
      if (rule.verificationType && !rule.verificationType.includes(verificationType)) {
        continue;
      }

      const fieldValue = this.getNestedValue(normalizedData, rule.field);
      const isValid = this.validateField(fieldValue, rule);

      if (!isValid) {
        errors.push(`${rule.field}: ${rule.message}`);
      }
    }

    // Custom business logic validations
    const businessErrors = await this.validateBusinessLogic(normalizedData, verificationType);
    errors.push(...businessErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Store normalized data in searchable format
   */
  async storeNormalizedData(
    caseId: string,
    normalizedData: NormalizedFormData
  ): Promise<void> {
    const now = new Date().toISOString();

    // Store in normalized_form_data table for better querying
    await query(`
      INSERT INTO normalized_form_data (
        case_id, customer_name, customer_phone, customer_email, customer_pan,
        full_address, city, state, pincode, address_locatable, address_rating,
        verification_type, verification_date, verifier_name, met_person_name,
        final_status, recommendation_status, risk_category, credit_limit,
        property_type, property_value, monthly_rent, total_family_members,
        business_name, business_type, business_turnover, gst_number,
        raw_data, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      )
      ON CONFLICT (case_id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone,
        customer_email = EXCLUDED.customer_email,
        customer_pan = EXCLUDED.customer_pan,
        full_address = EXCLUDED.full_address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        address_locatable = EXCLUDED.address_locatable,
        address_rating = EXCLUDED.address_rating,
        verification_type = EXCLUDED.verification_type,
        verification_date = EXCLUDED.verification_date,
        verifier_name = EXCLUDED.verifier_name,
        met_person_name = EXCLUDED.met_person_name,
        final_status = EXCLUDED.final_status,
        recommendation_status = EXCLUDED.recommendation_status,
        risk_category = EXCLUDED.risk_category,
        credit_limit = EXCLUDED.credit_limit,
        property_type = EXCLUDED.property_type,
        property_value = EXCLUDED.property_value,
        monthly_rent = EXCLUDED.monthly_rent,
        total_family_members = EXCLUDED.total_family_members,
        business_name = EXCLUDED.business_name,
        business_type = EXCLUDED.business_type,
        business_turnover = EXCLUDED.business_turnover,
        gst_number = EXCLUDED.gst_number,
        raw_data = EXCLUDED.raw_data,
        updated_at = EXCLUDED.updated_at
    `, [
      caseId,
      normalizedData.customerInfo.name,
      normalizedData.customerInfo.phoneNumber,
      normalizedData.customerInfo.email,
      normalizedData.customerInfo.panNumber,
      normalizedData.addressInfo.fullAddress,
      normalizedData.addressInfo.city,
      normalizedData.addressInfo.state,
      normalizedData.addressInfo.pincode,
      normalizedData.addressInfo.addressLocatable,
      normalizedData.addressInfo.addressRating,
      normalizedData.verificationDetails.verificationType,
      normalizedData.verificationDetails.verificationDate,
      normalizedData.verificationDetails.verifierName,
      normalizedData.verificationDetails.metPersonName,
      normalizedData.verificationOutcome.finalStatus,
      normalizedData.verificationOutcome.recommendationStatus,
      normalizedData.verificationOutcome.riskCategory,
      normalizedData.verificationOutcome.creditLimit,
      normalizedData.propertyDetails?.propertyType,
      normalizedData.propertyDetails?.propertyValue,
      normalizedData.propertyDetails?.monthlyRent,
      normalizedData.propertyDetails?.totalFamilyMembers,
      normalizedData.businessDetails?.businessName,
      normalizedData.businessDetails?.businessType,
      normalizedData.businessDetails?.businessTurnover,
      normalizedData.businessDetails?.gstNumber,
      JSON.stringify(normalizedData),
      now,
      now
    ]);
  }

  /**
   * Extract customer information with consistent field mapping
   */
  private extractCustomerInfo(rawData: any): NormalizedFormData['customerInfo'] {
    return {
      name: rawData.applicantName || rawData.customerName || rawData.name || '',
      fatherName: rawData.fatherName || rawData.father_name,
      motherName: rawData.motherName || rawData.mother_name,
      spouseName: rawData.spouseName || rawData.spouse_name,
      dateOfBirth: rawData.dateOfBirth || rawData.dob,
      age: rawData.age ? parseInt(rawData.age) : undefined,
      gender: rawData.gender,
      maritalStatus: rawData.maritalStatus || rawData.marital_status,
      education: rawData.education || rawData.qualification,
      occupation: rawData.occupation || rawData.profession,
      monthlyIncome: rawData.monthlyIncome ? parseFloat(rawData.monthlyIncome) : undefined,
      phoneNumber: rawData.phoneNumber || rawData.phone || rawData.mobile,
      alternatePhoneNumber: rawData.alternatePhoneNumber || rawData.alternate_phone,
      email: rawData.email || rawData.emailId,
      panNumber: rawData.panNumber || rawData.pan,
      aadharNumber: rawData.aadharNumber || rawData.aadhar
    };
  }

  /**
   * Extract address information with consistent mapping across verification types
   */
  private extractAddressInfo(rawData: any, verificationType: string, geoLocation: any): NormalizedFormData['addressInfo'] {
    // Standardized address field mapping
    const addressMappings = {
      fullAddress: rawData.address || rawData.fullAddress || rawData.visitAddress || rawData.propertyAddress || rawData.businessAddress || '',
      houseNumber: rawData.houseNumber || rawData.house_number || rawData.doorNumber,
      streetName: rawData.streetName || rawData.street || rawData.roadName,
      locality: rawData.locality || rawData.area || rawData.sector,
      landmark: rawData.landmark || rawData.nearbyLandmark,
      city: rawData.city || rawData.cityName || '',
      district: rawData.district || rawData.districtName,
      state: rawData.state || rawData.stateName || '',
      pincode: rawData.pincode || rawData.zipCode || rawData.postalCode || '',
      addressType: this.getAddressType(verificationType),
      addressLocatable: rawData.addressLocatable === true || rawData.addressLocatable === 'true' || rawData.addressLocatable === 'Yes',
      addressRating: rawData.addressRating ? parseInt(rawData.addressRating) : undefined
    };

    if (geoLocation) {
      addressMappings.gpsCoordinates = {
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        accuracy: geoLocation.accuracy
      };
    }

    return addressMappings;
  }

  /**
   * Get address type based on verification type
   */
  private getAddressType(verificationType: string): 'PERMANENT' | 'CURRENT' | 'OFFICE' | 'BUSINESS' {
    switch (verificationType) {
      case 'residence':
      case 'property-individual':
      case 'property-apf':
        return 'CURRENT';
      case 'office':
      case 'dsa-connector':
        return 'OFFICE';
      case 'business':
      case 'builder':
        return 'BUSINESS';
      default:
        return 'CURRENT';
    }
  }

  /**
   * Extract verification details
   */
  private extractVerificationDetails(rawData: any, verificationType: string, metadata: any): NormalizedFormData['verificationDetails'] {
    return {
      verificationType,
      verificationDate: rawData.verificationDate || new Date().toISOString().split('T')[0],
      verificationTime: rawData.verificationTime || new Date().toTimeString().split(' ')[0],
      verifierName: rawData.verifierName || metadata.verifierName || '',
      verifierEmployeeId: rawData.verifierEmployeeId || metadata.verifierEmployeeId,
      metPersonName: rawData.metPersonName || rawData.personMet || rawData.contactPersonName,
      relationshipWithApplicant: rawData.relationshipWithApplicant || rawData.relationship,
      personMetDetails: rawData.personMetDetails || rawData.personDetails,
      verificationMethod: 'PHYSICAL_VISIT', // Default for mobile submissions
      documentsVerified: this.extractDocumentsList(rawData.documentsVerified),
      documentsCollected: this.extractDocumentsList(rawData.documentsCollected)
    };
  }

  /**
   * Extract verification outcome
   */
  private extractVerificationOutcome(rawData: any): NormalizedFormData['verificationOutcome'] {
    return {
      finalStatus: rawData.finalStatus || rawData.status || 'POSITIVE',
      recommendationStatus: rawData.recommendationStatus || rawData.recommendation,
      riskCategory: rawData.riskCategory || rawData.risk || 'LOW',
      creditLimit: rawData.creditLimit ? parseFloat(rawData.creditLimit) : undefined,
      remarks: rawData.remarks || rawData.comments,
      reasonForNegative: rawData.reasonForNegative || rawData.negativeReason,
      additionalComments: rawData.additionalComments || rawData.notes
    };
  }

  /**
   * Extract property details for residence/property verifications
   */
  private extractPropertyDetails(rawData: any): NormalizedFormData['propertyDetails'] {
    return {
      propertyType: rawData.propertyType || rawData.houseStatus,
      propertyStatus: rawData.propertyStatus || rawData.constructionStatus,
      constructionQuality: rawData.constructionQuality || rawData.buildingQuality,
      propertyValue: rawData.propertyValue ? parseFloat(rawData.propertyValue) : undefined,
      monthlyRent: rawData.monthlyRent ? parseFloat(rawData.monthlyRent) : undefined,
      ownershipDuration: rawData.ownershipDuration ? parseInt(rawData.ownershipDuration) : undefined,
      totalFamilyMembers: rawData.totalFamilyMembers ? parseInt(rawData.totalFamilyMembers) : undefined,
      workingMembers: rawData.workingMembers ? parseInt(rawData.workingMembers) : undefined,
      dependents: rawData.dependents ? parseInt(rawData.dependents) : undefined
    };
  }

  /**
   * Extract business details for business/office verifications
   */
  private extractBusinessDetails(rawData: any): NormalizedFormData['businessDetails'] {
    return {
      businessName: rawData.businessName || rawData.companyName || rawData.organizationName,
      businessType: rawData.businessType || rawData.industryType,
      businessNature: rawData.businessNature || rawData.businessActivity,
      establishmentYear: rawData.establishmentYear ? parseInt(rawData.establishmentYear) : undefined,
      businessAddress: rawData.businessAddress || rawData.officeAddress,
      businessPhone: rawData.businessPhone || rawData.officePhone,
      businessEmail: rawData.businessEmail || rawData.officeEmail,
      businessRegistrationNumber: rawData.businessRegistrationNumber || rawData.registrationNumber,
      gstNumber: rawData.gstNumber || rawData.gst,
      businessTurnover: rawData.businessTurnover ? parseFloat(rawData.businessTurnover) : undefined,
      numberOfEmployees: rawData.numberOfEmployees ? parseInt(rawData.numberOfEmployees) : undefined,
      businessOwnership: rawData.businessOwnership || rawData.ownershipType
    };
  }

  /**
   * Validate individual field against rule
   */
  private validateField(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'REQUIRED':
        return value !== null && value !== undefined && value !== '';
      
      case 'FORMAT':
        if (!value) return true; // Optional field
        return (rule.rule as RegExp).test(value.toString());
      
      case 'RANGE':
        if (!value) return true; // Optional field
        const [min, max] = (rule.rule as string).split('-').map(Number);
        const numValue = Number(value);
        return numValue >= min && numValue <= max;
      
      case 'ENUM':
        if (!value) return true; // Optional field
        return (rule.rule as string[]).includes(value);
      
      case 'CUSTOM':
        return (rule.rule as Function)(value);
      
      default:
        return true;
    }
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract documents list from various formats
   */
  private extractDocumentsList(docs: any): string[] {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;
    if (typeof docs === 'string') return docs.split(',').map(d => d.trim());
    return [];
  }

  /**
   * Custom business logic validations
   */
  private async validateBusinessLogic(
    data: NormalizedFormData,
    verificationType: string
  ): Promise<string[]> {
    const errors: string[] = [];

    // Address locatable validation
    if (!data.addressInfo.addressLocatable && data.verificationOutcome.finalStatus === 'POSITIVE') {
      errors.push('Cannot mark verification as POSITIVE if address is not locatable');
    }

    // Credit limit validation
    if (data.verificationOutcome.creditLimit && data.verificationOutcome.finalStatus === 'NEGATIVE') {
      errors.push('Cannot set credit limit for NEGATIVE verification');
    }

    // Business-specific validations
    if (['business', 'office'].includes(verificationType)) {
      if (!data.businessDetails?.businessName) {
        errors.push('Business name is required for business/office verification');
      }
    }

    // Property-specific validations
    if (['residence', 'property-individual'].includes(verificationType)) {
      if (!data.propertyDetails?.propertyType) {
        errors.push('Property type is required for residence/property verification');
      }
    }

    return errors;
  }
}

export default new DataTransformationService();
