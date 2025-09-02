import { query } from '../config/database';

export interface StandardizedAddress {
  // Standardized fields
  fullAddress: string;
  houseNumber?: string;
  buildingName?: string;
  streetName?: string;
  locality?: string;
  subLocality?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  country: string;
  
  // Address metadata
  addressType: 'RESIDENTIAL' | 'COMMERCIAL' | 'OFFICE' | 'INDUSTRIAL' | 'MIXED';
  addressCategory: 'PERMANENT' | 'CURRENT' | 'OFFICE' | 'BUSINESS' | 'TEMPORARY';
  addressQuality: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  isLocatable: boolean;
  accessibilityRating: number; // 1-5 scale
  
  // Geographic data
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: 'GPS' | 'GEOCODED' | 'MANUAL';
  };
  
  // Verification metadata
  verificationMethod: 'PHYSICAL_VISIT' | 'TELEPHONIC' | 'DIGITAL' | 'DOCUMENT_BASED';
  verificationDate: string;
  verifierComments?: string;
  
  // Standardization metadata
  originalAddress: string;
  standardizationScore: number; // 0-100
  standardizationMethod: 'AUTOMATIC' | 'MANUAL' | 'HYBRID';
  standardizationDate: string;
}

export interface AddressFieldMapping {
  verificationType: string;
  fieldMappings: {
    [standardField: string]: string[]; // Standard field -> possible raw field names
  };
  requiredFields: string[];
  optionalFields: string[];
}

class AddressStandardizationService {
  private fieldMappings: AddressFieldMapping[] = [
    {
      verificationType: 'residence',
      fieldMappings: {
        fullAddress: ['address', 'fullAddress', 'residenceAddress', 'homeAddress', 'currentAddress'],
        houseNumber: ['houseNumber', 'house_number', 'doorNumber', 'flatNumber', 'unitNumber'],
        buildingName: ['buildingName', 'building_name', 'apartmentName', 'societyName'],
        streetName: ['streetName', 'street', 'roadName', 'road'],
        locality: ['locality', 'area', 'sector', 'colony', 'neighborhood'],
        subLocality: ['subLocality', 'sub_locality', 'subArea', 'zone'],
        landmark: ['landmark', 'nearbyLandmark', 'reference', 'nearBy'],
        city: ['city', 'cityName', 'town', 'municipality'],
        district: ['district', 'districtName', 'tehsil'],
        state: ['state', 'stateName', 'province'],
        pincode: ['pincode', 'zipCode', 'postalCode', 'pin'],
        country: ['country', 'countryName']
      },
      requiredFields: ['fullAddress', 'city', 'state', 'pincode'],
      optionalFields: ['houseNumber', 'buildingName', 'streetName', 'locality', 'landmark', 'district']
    },
    {
      verificationType: 'office',
      fieldMappings: {
        fullAddress: ['address', 'officeAddress', 'workAddress', 'businessAddress', 'companyAddress'],
        houseNumber: ['officeNumber', 'suiteNumber', 'unitNumber', 'floorNumber'],
        buildingName: ['buildingName', 'officeBuildingName', 'towerName', 'complexName'],
        streetName: ['streetName', 'street', 'roadName'],
        locality: ['locality', 'businessDistrict', 'commercialArea', 'sector'],
        subLocality: ['subLocality', 'zone', 'block'],
        landmark: ['landmark', 'nearbyLandmark', 'reference'],
        city: ['city', 'cityName', 'officeCity'],
        district: ['district', 'districtName'],
        state: ['state', 'stateName', 'officeState'],
        pincode: ['pincode', 'zipCode', 'postalCode', 'officePincode'],
        country: ['country', 'countryName']
      },
      requiredFields: ['fullAddress', 'city', 'state', 'pincode'],
      optionalFields: ['houseNumber', 'buildingName', 'streetName', 'locality', 'landmark', 'district']
    },
    {
      verificationType: 'business',
      fieldMappings: {
        fullAddress: ['address', 'businessAddress', 'shopAddress', 'storeAddress', 'establishmentAddress'],
        houseNumber: ['shopNumber', 'storeNumber', 'unitNumber', 'plotNumber'],
        buildingName: ['buildingName', 'complexName', 'mallName', 'marketName'],
        streetName: ['streetName', 'street', 'roadName', 'marketStreet'],
        locality: ['locality', 'marketArea', 'businessArea', 'commercialZone'],
        subLocality: ['subLocality', 'sector', 'block'],
        landmark: ['landmark', 'nearbyLandmark', 'reference', 'marketLandmark'],
        city: ['city', 'cityName', 'businessCity'],
        district: ['district', 'districtName'],
        state: ['state', 'stateName', 'businessState'],
        pincode: ['pincode', 'zipCode', 'postalCode', 'businessPincode'],
        country: ['country', 'countryName']
      },
      requiredFields: ['fullAddress', 'city', 'state', 'pincode'],
      optionalFields: ['houseNumber', 'buildingName', 'streetName', 'locality', 'landmark', 'district']
    },
    {
      verificationType: 'property-individual',
      fieldMappings: {
        fullAddress: ['address', 'propertyAddress', 'siteAddress', 'plotAddress'],
        houseNumber: ['plotNumber', 'surveyNumber', 'propertyNumber', 'siteNumber'],
        buildingName: ['projectName', 'schemeName', 'developmentName'],
        streetName: ['streetName', 'street', 'roadName'],
        locality: ['locality', 'area', 'layout', 'phase'],
        subLocality: ['subLocality', 'sector', 'block', 'extension'],
        landmark: ['landmark', 'nearbyLandmark', 'reference'],
        city: ['city', 'cityName', 'propertyCity'],
        district: ['district', 'districtName'],
        state: ['state', 'stateName', 'propertyState'],
        pincode: ['pincode', 'zipCode', 'postalCode', 'propertyPincode'],
        country: ['country', 'countryName']
      },
      requiredFields: ['fullAddress', 'city', 'state', 'pincode'],
      optionalFields: ['houseNumber', 'buildingName', 'streetName', 'locality', 'landmark', 'district']
    }
  ];

  /**
   * Standardize address from raw form data
   */
  async standardizeAddress(
    rawFormData: any,
    verificationType: string,
    geoLocation?: any,
    verificationMethod: string = 'PHYSICAL_VISIT'
  ): Promise<StandardizedAddress> {
    const mapping = this.getFieldMapping(verificationType);
    const standardized: Partial<StandardizedAddress> = {};

    // Extract and standardize each field
    for (const [standardField, possibleFields] of Object.entries(mapping.fieldMappings)) {
      const value = this.extractFieldValue(rawFormData, possibleFields);
      if (value) {
        (standardized as any)[standardField] = this.cleanAndStandardizeValue(value, standardField);
      }
    }

    // Set defaults and derived values
    standardized.country = standardized.country || 'India';
    standardized.addressType = this.determineAddressType(verificationType, rawFormData);
    standardized.addressCategory = this.determineAddressCategory(verificationType);
    standardized.addressQuality = this.assessAddressQuality(standardized, rawFormData);
    standardized.isLocatable = this.assessLocatability(rawFormData, geoLocation);
    standardized.accessibilityRating = this.assessAccessibility(rawFormData);

    // Add geographic data
    if (geoLocation) {
      standardized.coordinates = {
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        accuracy: geoLocation.accuracy,
        source: 'GPS'
      };
    }

    // Add verification metadata
    standardized.verificationMethod = verificationMethod as any;
    standardized.verificationDate = new Date().toISOString();
    standardized.verifierComments = rawFormData.verifierComments || rawFormData.remarks;

    // Add standardization metadata
    standardized.originalAddress = this.extractOriginalAddress(rawFormData);
    standardized.standardizationScore = this.calculateStandardizationScore(standardized, mapping);
    standardized.standardizationMethod = 'AUTOMATIC';
    standardized.standardizationDate = new Date().toISOString();

    // Validate required fields
    this.validateRequiredFields(standardized, mapping);

    return standardized as StandardizedAddress;
  }

  /**
   * Get field mapping for verification type
   */
  private getFieldMapping(verificationType: string): AddressFieldMapping {
    const mapping = this.fieldMappings.find(m => m.verificationType === verificationType);
    if (!mapping) {
      // Return default mapping for residence
      return this.fieldMappings[0];
    }
    return mapping;
  }

  /**
   * Extract field value from raw data using multiple possible field names
   */
  private extractFieldValue(rawData: any, possibleFields: string[]): string | undefined {
    for (const field of possibleFields) {
      if (rawData[field] && rawData[field].toString().trim()) {
        return rawData[field].toString().trim();
      }
    }
    return undefined;
  }

  /**
   * Clean and standardize individual field values
   */
  private cleanAndStandardizeValue(value: string, fieldType: string): string {
    let cleaned = value.trim();

    switch (fieldType) {
      case 'pincode':
        // Remove any non-digits and ensure 6 digits
        cleaned = cleaned.replace(/\D/g, '');
        if (cleaned.length === 6) {
          return cleaned;
        }
        break;

      case 'city':
      case 'state':
      case 'district':
        // Capitalize first letter of each word
        cleaned = cleaned.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        break;

      case 'fullAddress':
        // Clean up address formatting
        cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces to single
        cleaned = cleaned.replace(/,+/g, ','); // Multiple commas to single
        cleaned = cleaned.replace(/,\s*,/g, ','); // Remove empty comma segments
        break;

      case 'houseNumber':
        // Standardize house number format
        cleaned = cleaned.toUpperCase().replace(/\s+/g, '');
        break;
    }

    return cleaned;
  }

  /**
   * Determine address type based on verification type and form data
   */
  private determineAddressType(
    verificationType: string,
    rawData: any
  ): 'RESIDENTIAL' | 'COMMERCIAL' | 'OFFICE' | 'INDUSTRIAL' | 'MIXED' {
    switch (verificationType) {
      case 'residence':
      case 'property-individual':
        return 'RESIDENTIAL';
      case 'office':
        return 'OFFICE';
      case 'business':
        return rawData.businessType === 'INDUSTRIAL' ? 'INDUSTRIAL' : 'COMMERCIAL';
      case 'residence-cum-office':
        return 'MIXED';
      default:
        return 'RESIDENTIAL';
    }
  }

  /**
   * Determine address category based on verification type
   */
  private determineAddressCategory(
    verificationType: string
  ): 'PERMANENT' | 'CURRENT' | 'OFFICE' | 'BUSINESS' | 'TEMPORARY' {
    switch (verificationType) {
      case 'residence':
        return 'CURRENT';
      case 'office':
        return 'OFFICE';
      case 'business':
        return 'BUSINESS';
      case 'property-individual':
      case 'property-apf':
        return 'PERMANENT';
      default:
        return 'CURRENT';
    }
  }

  /**
   * Assess address quality based on completeness and accuracy
   */
  private assessAddressQuality(
    standardized: Partial<StandardizedAddress>,
    rawData: any
  ): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
    let score = 0;
    const maxScore = 10;

    // Check completeness
    if (standardized.fullAddress) score += 2;
    if (standardized.houseNumber) score += 1;
    if (standardized.streetName) score += 1;
    if (standardized.locality) score += 1;
    if (standardized.landmark) score += 1;
    if (standardized.city) score += 2;
    if (standardized.state) score += 1;
    if (standardized.pincode) score += 1;

    // Check GPS accuracy
    if (standardized.coordinates?.accuracy && standardized.coordinates.accuracy <= 10) {
      score += 2;
    } else if (standardized.coordinates?.accuracy && standardized.coordinates.accuracy <= 50) {
      score += 1;
    }

    const percentage = (score / (maxScore + 2)) * 100; // +2 for GPS bonus

    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 75) return 'GOOD';
    if (percentage >= 60) return 'AVERAGE';
    return 'POOR';
  }

  /**
   * Assess if address is locatable
   */
  private assessLocatability(rawData: any, geoLocation?: any): boolean {
    // Check explicit locatable flag
    if (rawData.addressLocatable === false || rawData.addressLocatable === 'false' || rawData.addressLocatable === 'No') {
      return false;
    }

    // Check GPS accuracy
    if (geoLocation?.accuracy && geoLocation.accuracy > 100) {
      return false;
    }

    // Check address rating
    if (rawData.addressRating && parseInt(rawData.addressRating) < 3) {
      return false;
    }

    return true;
  }

  /**
   * Assess accessibility rating
   */
  private assessAccessibility(rawData: any): number {
    // Default rating
    let rating = 3;

    // Adjust based on various factors
    if (rawData.addressRating) {
      const addressRating = parseInt(rawData.addressRating);
      if (addressRating >= 4) rating = 5;
      else if (addressRating >= 3) rating = 4;
      else if (addressRating >= 2) rating = 3;
      else rating = 2;
    }

    if (rawData.accessibilityIssues || rawData.difficultToLocate) {
      rating = Math.max(1, rating - 1);
    }

    if (rawData.easyAccess || rawData.mainRoad) {
      rating = Math.min(5, rating + 1);
    }

    return rating;
  }

  /**
   * Extract original address from raw data
   */
  private extractOriginalAddress(rawData: any): string {
    const possibleFields = [
      'address', 'fullAddress', 'originalAddress', 'rawAddress',
      'residenceAddress', 'officeAddress', 'businessAddress', 'propertyAddress'
    ];

    for (const field of possibleFields) {
      if (rawData[field]) {
        return rawData[field].toString().trim();
      }
    }

    return 'Address not provided';
  }

  /**
   * Calculate standardization score
   */
  private calculateStandardizationScore(
    standardized: Partial<StandardizedAddress>,
    mapping: AddressFieldMapping
  ): number {
    let score = 0;
    const totalFields = mapping.requiredFields.length + mapping.optionalFields.length;

    // Check required fields
    for (const field of mapping.requiredFields) {
      if ((standardized as any)[field]) {
        score += 10; // Higher weight for required fields
      }
    }

    // Check optional fields
    for (const field of mapping.optionalFields) {
      if ((standardized as any)[field]) {
        score += 5; // Lower weight for optional fields
      }
    }

    // Bonus for GPS coordinates
    if (standardized.coordinates) {
      score += 10;
    }

    const maxScore = (mapping.requiredFields.length * 10) + (mapping.optionalFields.length * 5) + 10;
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(
    standardized: Partial<StandardizedAddress>,
    mapping: AddressFieldMapping
  ): void {
    const missingFields: string[] = [];

    for (const field of mapping.requiredFields) {
      if (!(standardized as any)[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Store standardized address
   */
  async storeStandardizedAddress(
    caseId: string,
    standardizedAddress: StandardizedAddress
  ): Promise<void> {
    const now = new Date().toISOString();

    await query(`
      INSERT INTO standardized_addresses (
        case_id, full_address, house_number, building_name, street_name,
        locality, sub_locality, landmark, city, district, state, pincode, country,
        address_type, address_category, address_quality, is_locatable, accessibility_rating,
        coordinates, verification_method, verification_date, verifier_comments,
        original_address, standardization_score, standardization_method,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      ON CONFLICT (case_id) DO UPDATE SET
        full_address = EXCLUDED.full_address,
        house_number = EXCLUDED.house_number,
        building_name = EXCLUDED.building_name,
        street_name = EXCLUDED.street_name,
        locality = EXCLUDED.locality,
        sub_locality = EXCLUDED.sub_locality,
        landmark = EXCLUDED.landmark,
        city = EXCLUDED.city,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        country = EXCLUDED.country,
        address_type = EXCLUDED.address_type,
        address_category = EXCLUDED.address_category,
        address_quality = EXCLUDED.address_quality,
        is_locatable = EXCLUDED.is_locatable,
        accessibility_rating = EXCLUDED.accessibility_rating,
        coordinates = EXCLUDED.coordinates,
        verification_method = EXCLUDED.verification_method,
        verification_date = EXCLUDED.verification_date,
        verifier_comments = EXCLUDED.verifier_comments,
        original_address = EXCLUDED.original_address,
        standardization_score = EXCLUDED.standardization_score,
        standardization_method = EXCLUDED.standardization_method,
        updated_at = EXCLUDED.updated_at
    `, [
      caseId,
      standardizedAddress.fullAddress,
      standardizedAddress.houseNumber,
      standardizedAddress.buildingName,
      standardizedAddress.streetName,
      standardizedAddress.locality,
      standardizedAddress.subLocality,
      standardizedAddress.landmark,
      standardizedAddress.city,
      standardizedAddress.district,
      standardizedAddress.state,
      standardizedAddress.pincode,
      standardizedAddress.country,
      standardizedAddress.addressType,
      standardizedAddress.addressCategory,
      standardizedAddress.addressQuality,
      standardizedAddress.isLocatable,
      standardizedAddress.accessibilityRating,
      JSON.stringify(standardizedAddress.coordinates),
      standardizedAddress.verificationMethod,
      standardizedAddress.verificationDate,
      standardizedAddress.verifierComments,
      standardizedAddress.originalAddress,
      standardizedAddress.standardizationScore,
      standardizedAddress.standardizationMethod,
      now,
      now
    ]);
  }

  /**
   * Get standardized address by case ID
   */
  async getStandardizedAddress(caseId: string): Promise<StandardizedAddress | null> {
    const result = await query(
      'SELECT * FROM standardized_addresses WHERE case_id = $1',
      [caseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      fullAddress: row.full_address,
      houseNumber: row.house_number,
      buildingName: row.building_name,
      streetName: row.street_name,
      locality: row.locality,
      subLocality: row.sub_locality,
      landmark: row.landmark,
      city: row.city,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      country: row.country,
      addressType: row.address_type,
      addressCategory: row.address_category,
      addressQuality: row.address_quality,
      isLocatable: row.is_locatable,
      accessibilityRating: row.accessibility_rating,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : undefined,
      verificationMethod: row.verification_method,
      verificationDate: row.verification_date,
      verifierComments: row.verifier_comments,
      originalAddress: row.original_address,
      standardizationScore: row.standardization_score,
      standardizationMethod: row.standardization_method,
      standardizationDate: row.created_at
    };
  }

  /**
   * Search addresses by various criteria
   */
  async searchAddresses(filters: {
    city?: string;
    state?: string;
    pincode?: string;
    addressType?: string;
    addressQuality?: string;
    isLocatable?: boolean;
    limit?: number;
  }): Promise<StandardizedAddress[]> {
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.city) {
      whereConditions.push(`city ILIKE $${paramIndex++}`);
      queryParams.push(`%${filters.city}%`);
    }

    if (filters.state) {
      whereConditions.push(`state ILIKE $${paramIndex++}`);
      queryParams.push(`%${filters.state}%`);
    }

    if (filters.pincode) {
      whereConditions.push(`pincode = $${paramIndex++}`);
      queryParams.push(filters.pincode);
    }

    if (filters.addressType) {
      whereConditions.push(`address_type = $${paramIndex++}`);
      queryParams.push(filters.addressType);
    }

    if (filters.addressQuality) {
      whereConditions.push(`address_quality = $${paramIndex++}`);
      queryParams.push(filters.addressQuality);
    }

    if (filters.isLocatable !== undefined) {
      whereConditions.push(`is_locatable = $${paramIndex++}`);
      queryParams.push(filters.isLocatable);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limitClause = filters.limit ? `LIMIT ${filters.limit}` : 'LIMIT 100';

    const result = await query(`
      SELECT * FROM standardized_addresses
      ${whereClause}
      ORDER BY created_at DESC
      ${limitClause}
    `, queryParams);

    return result.rows.map(row => ({
      fullAddress: row.full_address,
      houseNumber: row.house_number,
      buildingName: row.building_name,
      streetName: row.street_name,
      locality: row.locality,
      subLocality: row.sub_locality,
      landmark: row.landmark,
      city: row.city,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      country: row.country,
      addressType: row.address_type,
      addressCategory: row.address_category,
      addressQuality: row.address_quality,
      isLocatable: row.is_locatable,
      accessibilityRating: row.accessibility_rating,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : undefined,
      verificationMethod: row.verification_method,
      verificationDate: row.verification_date,
      verifierComments: row.verifier_comments,
      originalAddress: row.original_address,
      standardizationScore: row.standardization_score,
      standardizationMethod: row.standardization_method,
      standardizationDate: row.created_at
    }));
  }
}

export default new AddressStandardizationService();
