import { query } from '../config/database';

export interface SearchFilters {
  // Text search
  searchTerm?: string;
  
  // Customer filters
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerPan?: string;
  
  // Address filters
  city?: string;
  state?: string;
  pincode?: string;
  addressLocatable?: boolean;
  
  // Verification filters
  verificationType?: string[];
  verificationDate?: {
    from?: string;
    to?: string;
  };
  verifierName?: string;
  finalStatus?: string[];
  recommendationStatus?: string[];
  riskCategory?: string[];
  
  // Property filters
  propertyType?: string[];
  propertyValueRange?: {
    min?: number;
    max?: number;
  };
  totalFamilyMembersRange?: {
    min?: number;
    max?: number;
  };
  
  // Business filters
  businessName?: string;
  businessType?: string[];
  gstNumber?: string;
  businessTurnoverRange?: {
    min?: number;
    max?: number;
  };
  
  // Date filters
  createdDate?: {
    from?: string;
    to?: string;
  };
  updatedDate?: {
    from?: string;
    to?: string;
  };
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  includeRawData?: boolean;
}

export interface SearchResult {
  caseId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  verificationType: string;
  verificationDate: string;
  verifierName: string;
  finalStatus: string;
  recommendationStatus?: string;
  riskCategory?: string;
  creditLimit?: number;
  businessName?: string;
  propertyType?: string;
  createdAt: string;
  updatedAt: string;
  rawData?: any;
  relevanceScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations?: {
    verificationTypes: Record<string, number>;
    finalStatuses: Record<string, number>;
    cities: Record<string, number>;
    states: Record<string, number>;
    riskCategories: Record<string, number>;
  };
}

class SearchService {
  /**
   * Advanced search with filters and full-text search
   */
  async searchFormSubmissions(
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includeRawData = false
    } = options;

    const offset = (page - 1) * limit;
    
    // Build dynamic WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Full-text search
    if (filters.searchTerm) {
      whereConditions.push(`(
        customer_name ILIKE $${paramIndex} OR
        customer_phone ILIKE $${paramIndex} OR
        customer_email ILIKE $${paramIndex} OR
        full_address ILIKE $${paramIndex} OR
        business_name ILIKE $${paramIndex} OR
        verifier_name ILIKE $${paramIndex} OR
        customer_pan ILIKE $${paramIndex} OR
        gst_number ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${filters.searchTerm}%`);
      paramIndex++;
    }

    // Customer filters
    if (filters.customerName) {
      whereConditions.push(`customer_name ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.customerName}%`);
      paramIndex++;
    }

    if (filters.customerPhone) {
      whereConditions.push(`customer_phone ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.customerPhone}%`);
      paramIndex++;
    }

    if (filters.customerEmail) {
      whereConditions.push(`customer_email ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.customerEmail}%`);
      paramIndex++;
    }

    if (filters.customerPan) {
      whereConditions.push(`customer_pan ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.customerPan}%`);
      paramIndex++;
    }

    // Address filters
    if (filters.city) {
      whereConditions.push(`city ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (filters.state) {
      whereConditions.push(`state ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.state}%`);
      paramIndex++;
    }

    if (filters.pincode) {
      whereConditions.push(`pincode = $${paramIndex}`);
      queryParams.push(filters.pincode);
      paramIndex++;
    }

    if (filters.addressLocatable !== undefined) {
      whereConditions.push(`address_locatable = $${paramIndex}`);
      queryParams.push(filters.addressLocatable);
      paramIndex++;
    }

    // Verification filters
    if (filters.verificationType && filters.verificationType.length > 0) {
      whereConditions.push(`verification_type = ANY($${paramIndex})`);
      queryParams.push(filters.verificationType);
      paramIndex++;
    }

    if (filters.verificationDate?.from) {
      whereConditions.push(`verification_date >= $${paramIndex}`);
      queryParams.push(filters.verificationDate.from);
      paramIndex++;
    }

    if (filters.verificationDate?.to) {
      whereConditions.push(`verification_date <= $${paramIndex}`);
      queryParams.push(filters.verificationDate.to);
      paramIndex++;
    }

    if (filters.verifierName) {
      whereConditions.push(`verifier_name ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.verifierName}%`);
      paramIndex++;
    }

    if (filters.finalStatus && filters.finalStatus.length > 0) {
      whereConditions.push(`final_status = ANY($${paramIndex})`);
      queryParams.push(filters.finalStatus);
      paramIndex++;
    }

    if (filters.recommendationStatus && filters.recommendationStatus.length > 0) {
      whereConditions.push(`recommendation_status = ANY($${paramIndex})`);
      queryParams.push(filters.recommendationStatus);
      paramIndex++;
    }

    if (filters.riskCategory && filters.riskCategory.length > 0) {
      whereConditions.push(`risk_category = ANY($${paramIndex})`);
      queryParams.push(filters.riskCategory);
      paramIndex++;
    }

    // Property filters
    if (filters.propertyType && filters.propertyType.length > 0) {
      whereConditions.push(`property_type = ANY($${paramIndex})`);
      queryParams.push(filters.propertyType);
      paramIndex++;
    }

    if (filters.propertyValueRange?.min !== undefined) {
      whereConditions.push(`property_value >= $${paramIndex}`);
      queryParams.push(filters.propertyValueRange.min);
      paramIndex++;
    }

    if (filters.propertyValueRange?.max !== undefined) {
      whereConditions.push(`property_value <= $${paramIndex}`);
      queryParams.push(filters.propertyValueRange.max);
      paramIndex++;
    }

    if (filters.totalFamilyMembersRange?.min !== undefined) {
      whereConditions.push(`total_family_members >= $${paramIndex}`);
      queryParams.push(filters.totalFamilyMembersRange.min);
      paramIndex++;
    }

    if (filters.totalFamilyMembersRange?.max !== undefined) {
      whereConditions.push(`total_family_members <= $${paramIndex}`);
      queryParams.push(filters.totalFamilyMembersRange.max);
      paramIndex++;
    }

    // Business filters
    if (filters.businessName) {
      whereConditions.push(`business_name ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.businessName}%`);
      paramIndex++;
    }

    if (filters.businessType && filters.businessType.length > 0) {
      whereConditions.push(`business_type = ANY($${paramIndex})`);
      queryParams.push(filters.businessType);
      paramIndex++;
    }

    if (filters.gstNumber) {
      whereConditions.push(`gst_number ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.gstNumber}%`);
      paramIndex++;
    }

    if (filters.businessTurnoverRange?.min !== undefined) {
      whereConditions.push(`business_turnover >= $${paramIndex}`);
      queryParams.push(filters.businessTurnoverRange.min);
      paramIndex++;
    }

    if (filters.businessTurnoverRange?.max !== undefined) {
      whereConditions.push(`business_turnover <= $${paramIndex}`);
      queryParams.push(filters.businessTurnoverRange.max);
      paramIndex++;
    }

    // Date filters
    if (filters.createdDate?.from) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(filters.createdDate.from);
      paramIndex++;
    }

    if (filters.createdDate?.to) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(filters.createdDate.to);
      paramIndex++;
    }

    if (filters.updatedDate?.from) {
      whereConditions.push(`updated_at >= $${paramIndex}`);
      queryParams.push(filters.updatedDate.from);
      paramIndex++;
    }

    if (filters.updatedDate?.to) {
      whereConditions.push(`updated_at <= $${paramIndex}`);
      queryParams.push(filters.updatedDate.to);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = [
      'customer_name', 'verification_date', 'verifier_name', 'final_status',
      'city', 'state', 'created_at', 'updated_at', 'property_value', 'business_turnover'
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderClause = `ORDER BY ${sortField} ${sortOrder}`;

    // Select fields
    const selectFields = [
      'case_id', 'customer_name', 'customer_phone', 'customer_email',
      'full_address', 'city', 'state', 'pincode', 'verification_type',
      'verification_date', 'verifier_name', 'final_status', 'recommendation_status',
      'risk_category', 'credit_limit', 'business_name', 'property_type',
      'created_at', 'updated_at'
    ];

    if (includeRawData) {
      selectFields.push('raw_data');
    }

    // Main query
    const mainQuery = `
      SELECT ${selectFields.join(', ')}
      FROM normalized_form_data
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM normalized_form_data
      ${whereClause}
    `;

    // Execute queries
    const [resultsResponse, countResponse] = await Promise.all([
      query(mainQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const results: SearchResult[] = resultsResponse.rows.map(row => ({
      caseId: row.case_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      fullAddress: row.full_address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      verificationType: row.verification_type,
      verificationDate: row.verification_date,
      verifierName: row.verifier_name,
      finalStatus: row.final_status,
      recommendationStatus: row.recommendation_status,
      riskCategory: row.risk_category,
      creditLimit: row.credit_limit,
      businessName: row.business_name,
      propertyType: row.property_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      rawData: includeRawData ? row.raw_data : undefined
    }));

    const totalCount = parseInt(countResponse.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    // Get aggregations
    const aggregations = await this.getSearchAggregations(whereClause, queryParams.slice(0, -2));

    return {
      results,
      totalCount,
      page,
      limit,
      totalPages,
      aggregations
    };
  }

  /**
   * Get search aggregations for faceted search
   */
  private async getSearchAggregations(
    whereClause: string,
    queryParams: any[]
  ): Promise<SearchResponse['aggregations']> {
    const aggregationQueries = [
      `SELECT verification_type, COUNT(*) as count FROM normalized_form_data ${whereClause} GROUP BY verification_type`,
      `SELECT final_status, COUNT(*) as count FROM normalized_form_data ${whereClause} GROUP BY final_status`,
      `SELECT city, COUNT(*) as count FROM normalized_form_data ${whereClause} GROUP BY city ORDER BY count DESC LIMIT 10`,
      `SELECT state, COUNT(*) as count FROM normalized_form_data ${whereClause} GROUP BY state ORDER BY count DESC LIMIT 10`,
      `SELECT risk_category, COUNT(*) as count FROM normalized_form_data ${whereClause} GROUP BY risk_category`
    ];

    const [
      verificationTypesResult,
      finalStatusesResult,
      citiesResult,
      statesResult,
      riskCategoriesResult
    ] = await Promise.all(
      aggregationQueries.map(q => query(q, queryParams))
    );

    return {
      verificationTypes: this.arrayToObject(verificationTypesResult.rows),
      finalStatuses: this.arrayToObject(finalStatusesResult.rows),
      cities: this.arrayToObject(citiesResult.rows),
      states: this.arrayToObject(statesResult.rows),
      riskCategories: this.arrayToObject(riskCategoriesResult.rows)
    };
  }

  /**
   * Convert array of {key, count} to object
   */
  private arrayToObject(rows: any[]): Record<string, number> {
    return rows.reduce((acc, row) => {
      const key = row.verification_type || row.final_status || row.city || row.state || row.risk_category;
      if (key) {
        acc[key] = parseInt(row.count);
      }
      return acc;
    }, {});
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(
    field: 'customer_name' | 'city' | 'state' | 'business_name' | 'verifier_name',
    term: string,
    limit: number = 10
  ): Promise<string[]> {
    const result = await query(`
      SELECT DISTINCT ${field}
      FROM normalized_form_data
      WHERE ${field} ILIKE $1
      ORDER BY ${field}
      LIMIT $2
    `, [`%${term}%`, limit]);

    return result.rows.map(row => row[field]).filter(Boolean);
  }

  /**
   * Get similar cases based on customer or address
   */
  async findSimilarCases(
    caseId: string,
    similarityType: 'customer' | 'address' | 'business' = 'customer',
    limit: number = 5
  ): Promise<SearchResult[]> {
    // Get the reference case
    const referenceCase = await query(
      'SELECT * FROM normalized_form_data WHERE case_id = $1',
      [caseId]
    );

    if (referenceCase.rows.length === 0) {
      return [];
    }

    const ref = referenceCase.rows[0];
    let similarityQuery = '';
    let queryParams: any[] = [];

    switch (similarityType) {
      case 'customer':
        similarityQuery = `
          SELECT *, 
            CASE 
              WHEN customer_phone = $2 THEN 100
              WHEN customer_email = $3 THEN 90
              WHEN customer_pan = $4 THEN 95
              WHEN customer_name ILIKE $5 THEN 80
              ELSE 0
            END as similarity_score
          FROM normalized_form_data
          WHERE case_id != $1
          AND (
            customer_phone = $2 OR
            customer_email = $3 OR
            customer_pan = $4 OR
            customer_name ILIKE $5
          )
          ORDER BY similarity_score DESC
          LIMIT $6
        `;
        queryParams = [caseId, ref.customer_phone, ref.customer_email, ref.customer_pan, `%${ref.customer_name}%`, limit];
        break;

      case 'address':
        similarityQuery = `
          SELECT *,
            CASE 
              WHEN pincode = $2 AND city ILIKE $3 THEN 90
              WHEN pincode = $2 THEN 70
              WHEN city ILIKE $3 AND state ILIKE $4 THEN 60
              WHEN state ILIKE $4 THEN 40
              ELSE 0
            END as similarity_score
          FROM normalized_form_data
          WHERE case_id != $1
          AND (
            pincode = $2 OR
            (city ILIKE $3 AND state ILIKE $4)
          )
          ORDER BY similarity_score DESC
          LIMIT $5
        `;
        queryParams = [caseId, ref.pincode, `%${ref.city}%`, `%${ref.state}%`, limit];
        break;

      case 'business':
        similarityQuery = `
          SELECT *,
            CASE 
              WHEN gst_number = $2 THEN 100
              WHEN business_name ILIKE $3 THEN 80
              WHEN business_type = $4 THEN 60
              ELSE 0
            END as similarity_score
          FROM normalized_form_data
          WHERE case_id != $1
          AND business_name IS NOT NULL
          AND (
            gst_number = $2 OR
            business_name ILIKE $3 OR
            business_type = $4
          )
          ORDER BY similarity_score DESC
          LIMIT $5
        `;
        queryParams = [caseId, ref.gst_number, `%${ref.business_name}%`, ref.business_type, limit];
        break;
    }

    const result = await query(similarityQuery, queryParams);

    return result.rows.map(row => ({
      caseId: row.case_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      fullAddress: row.full_address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      verificationType: row.verification_type,
      verificationDate: row.verification_date,
      verifierName: row.verifier_name,
      finalStatus: row.final_status,
      recommendationStatus: row.recommendation_status,
      riskCategory: row.risk_category,
      creditLimit: row.credit_limit,
      businessName: row.business_name,
      propertyType: row.property_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      relevanceScore: row.similarity_score
    }));
  }
}

export default new SearchService();
