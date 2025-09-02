import { query } from '../config/database';
import { NormalizedFormData } from './dataTransformationService';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  verificationType: string[];
  ruleType: 'VALIDATION' | 'SCORING' | 'DECISION' | 'WARNING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  condition: string; // JSON Logic or custom condition
  action: string; // Action to take when rule is triggered
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleValidationResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  priority: string;
  passed: boolean;
  message: string;
  suggestedAction?: string;
  score?: number;
  metadata?: any;
}

export interface ValidationSummary {
  isValid: boolean;
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: 'APPROVE' | 'REJECT' | 'REVIEW' | 'CONDITIONAL_APPROVE';
  validationResults: RuleValidationResult[];
  warnings: string[];
  errors: string[];
}

class BusinessRulesService {
  private defaultRules: Omit<BusinessRule, 'createdAt' | 'updatedAt'>[] = [
    // Address Validation Rules
    {
      id: 'ADDR_001',
      name: 'Address Locatable Check',
      description: 'Address must be easily locatable for positive verification',
      verificationType: ['residence', 'office', 'business', 'property-individual'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'addressInfo.addressLocatable === true',
      action: 'REQUIRE_ADDRESS_LOCATABLE',
      isActive: true
    },
    {
      id: 'ADDR_002',
      name: 'Pincode Format Validation',
      description: 'Pincode must be valid 6-digit Indian postal code',
      verificationType: ['residence', 'office', 'business', 'property-individual', 'property-apf'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: '/^[1-9][0-9]{5}$/.test(addressInfo.pincode)',
      action: 'VALIDATE_PINCODE_FORMAT',
      isActive: true
    },
    {
      id: 'ADDR_003',
      name: 'GPS Coordinates Accuracy',
      description: 'GPS coordinates should have accuracy better than 50 meters',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'WARNING',
      priority: 'MEDIUM',
      condition: 'addressInfo.gpsCoordinates?.accuracy <= 50',
      action: 'WARN_GPS_ACCURACY',
      isActive: true
    },

    // Customer Information Rules
    {
      id: 'CUST_001',
      name: 'Phone Number Validation',
      description: 'Phone number must be valid Indian mobile number',
      verificationType: ['residence', 'office', 'business', 'property-individual', 'property-apf'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: '/^[6-9]\\d{9}$/.test(customerInfo.phoneNumber)',
      action: 'VALIDATE_PHONE_FORMAT',
      isActive: true
    },
    {
      id: 'CUST_002',
      name: 'Age Verification',
      description: 'Customer age must be between 18 and 100 years',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'customerInfo.age >= 18 && customerInfo.age <= 100',
      action: 'VALIDATE_AGE_RANGE',
      isActive: true
    },
    {
      id: 'CUST_003',
      name: 'PAN Number Format',
      description: 'PAN number must follow valid format if provided',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'VALIDATION',
      priority: 'MEDIUM',
      condition: '!customerInfo.panNumber || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(customerInfo.panNumber)',
      action: 'VALIDATE_PAN_FORMAT',
      isActive: true
    },

    // Verification Process Rules
    {
      id: 'VERIF_001',
      name: 'Person Met Requirement',
      description: 'Verifier must have met someone at the address for positive verification',
      verificationType: ['residence', 'office'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'verificationOutcome.finalStatus !== "POSITIVE" || verificationDetails.metPersonName',
      action: 'REQUIRE_PERSON_MET',
      isActive: true
    },
    {
      id: 'VERIF_002',
      name: 'Verification Date Validity',
      description: 'Verification date cannot be in the future',
      verificationType: ['residence', 'office', 'business', 'property-individual', 'property-apf'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'new Date(verificationDetails.verificationDate) <= new Date()',
      action: 'VALIDATE_VERIFICATION_DATE',
      isActive: true
    },
    {
      id: 'VERIF_003',
      name: 'Negative Verification Reason',
      description: 'Negative verifications must have a reason specified',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'verificationOutcome.finalStatus !== "NEGATIVE" || verificationOutcome.reasonForNegative',
      action: 'REQUIRE_NEGATIVE_REASON',
      isActive: true
    },

    // Business-Specific Rules
    {
      id: 'BUS_001',
      name: 'GST Number Validation',
      description: 'GST number must be valid format for business verifications',
      verificationType: ['business', 'office'],
      ruleType: 'VALIDATION',
      priority: 'MEDIUM',
      condition: '!businessDetails?.gstNumber || /^\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[A-Z\\d]{1}[Z]{1}[A-Z\\d]{1}$/.test(businessDetails.gstNumber)',
      action: 'VALIDATE_GST_FORMAT',
      isActive: true
    },
    {
      id: 'BUS_002',
      name: 'Business Turnover Reasonableness',
      description: 'Business turnover should be reasonable for the business type',
      verificationType: ['business'],
      ruleType: 'WARNING',
      priority: 'MEDIUM',
      condition: '!businessDetails?.businessTurnover || businessDetails.businessTurnover <= 10000000000', // 10 Crores
      action: 'WARN_HIGH_TURNOVER',
      isActive: true
    },

    // Property-Specific Rules
    {
      id: 'PROP_001',
      name: 'Property Value Reasonableness',
      description: 'Property value should be reasonable for the location',
      verificationType: ['residence', 'property-individual'],
      ruleType: 'WARNING',
      priority: 'LOW',
      condition: '!propertyDetails?.propertyValue || propertyDetails.propertyValue <= 100000000', // 10 Crores
      action: 'WARN_HIGH_PROPERTY_VALUE',
      isActive: true
    },
    {
      id: 'PROP_002',
      name: 'Family Members Count',
      description: 'Total family members should be reasonable',
      verificationType: ['residence'],
      ruleType: 'WARNING',
      priority: 'LOW',
      condition: '!propertyDetails?.totalFamilyMembers || (propertyDetails.totalFamilyMembers >= 1 && propertyDetails.totalFamilyMembers <= 20)',
      action: 'WARN_FAMILY_SIZE',
      isActive: true
    },

    // Credit Decision Rules
    {
      id: 'CREDIT_001',
      name: 'Credit Limit for Negative Cases',
      description: 'Credit limit should not be set for negative verifications',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'VALIDATION',
      priority: 'HIGH',
      condition: 'verificationOutcome.finalStatus !== "NEGATIVE" || !verificationOutcome.creditLimit',
      action: 'REJECT_CREDIT_FOR_NEGATIVE',
      isActive: true
    },
    {
      id: 'CREDIT_002',
      name: 'Risk Category Alignment',
      description: 'Risk category should align with final status',
      verificationType: ['residence', 'office', 'business'],
      ruleType: 'WARNING',
      priority: 'MEDIUM',
      condition: '(verificationOutcome.finalStatus === "POSITIVE" && verificationOutcome.riskCategory !== "HIGH") || verificationOutcome.finalStatus !== "POSITIVE"',
      action: 'WARN_RISK_MISALIGNMENT',
      isActive: true
    }
  ];

  /**
   * Initialize default business rules in database
   */
  async initializeDefaultRules(): Promise<void> {
    const now = new Date().toISOString();

    for (const rule of this.defaultRules) {
      await query(`
        INSERT INTO business_rules (
          id, name, description, verification_type, rule_type, priority,
          condition_logic, action, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          verification_type = EXCLUDED.verification_type,
          rule_type = EXCLUDED.rule_type,
          priority = EXCLUDED.priority,
          condition_logic = EXCLUDED.condition_logic,
          action = EXCLUDED.action,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `, [
        rule.id, rule.name, rule.description, JSON.stringify(rule.verificationType),
        rule.ruleType, rule.priority, rule.condition, rule.action, rule.isActive, now, now
      ]);
    }
  }

  /**
   * Validate form data against all applicable business rules
   */
  async validateFormData(
    normalizedData: NormalizedFormData,
    verificationType: string
  ): Promise<ValidationSummary> {
    // Get applicable rules
    const rules = await this.getApplicableRules(verificationType);
    
    const validationResults: RuleValidationResult[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let totalScore = 100; // Start with perfect score

    for (const rule of rules) {
      const result = await this.evaluateRule(rule, normalizedData);
      validationResults.push(result);

      if (!result.passed) {
        if (rule.ruleType === 'VALIDATION') {
          errors.push(result.message);
          totalScore -= this.getScorePenalty(rule.priority);
        } else if (rule.ruleType === 'WARNING') {
          warnings.push(result.message);
          totalScore -= this.getScorePenalty(rule.priority) / 2; // Half penalty for warnings
        }
      }

      if (result.score !== undefined) {
        totalScore += result.score;
      }
    }

    // Ensure score is within bounds
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine risk level and recommended action
    const riskLevel = this.calculateRiskLevel(totalScore, errors.length, warnings.length);
    const recommendedAction = this.getRecommendedAction(totalScore, errors.length, riskLevel);

    return {
      isValid: errors.length === 0,
      overallScore: Math.round(totalScore),
      riskLevel,
      recommendedAction,
      validationResults,
      warnings,
      errors
    };
  }

  /**
   * Get applicable rules for verification type
   */
  private async getApplicableRules(verificationType: string): Promise<BusinessRule[]> {
    const result = await query(`
      SELECT * FROM business_rules
      WHERE is_active = true
      AND (verification_type @> $1 OR verification_type @> '["all"]')
      ORDER BY priority DESC, rule_type
    `, [JSON.stringify([verificationType])]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      verificationType: JSON.parse(row.verification_type),
      ruleType: row.rule_type,
      priority: row.priority,
      condition: row.condition_logic,
      action: row.action,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Evaluate a single rule against form data
   */
  private async evaluateRule(
    rule: BusinessRule,
    data: NormalizedFormData
  ): Promise<RuleValidationResult> {
    try {
      // Create a safe evaluation context
      const context = {
        customerInfo: data.customerInfo,
        addressInfo: data.addressInfo,
        verificationDetails: data.verificationDetails,
        verificationOutcome: data.verificationOutcome,
        propertyDetails: data.propertyDetails,
        businessDetails: data.businessDetails,
        metadata: data.metadata
      };

      // Evaluate the condition
      const passed = this.evaluateCondition(rule.condition, context);

      let message = '';
      let suggestedAction = '';

      if (!passed) {
        message = this.getFailureMessage(rule);
        suggestedAction = this.getSuggestedAction(rule);
      } else {
        message = `${rule.name}: Passed`;
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        priority: rule.priority,
        passed,
        message,
        suggestedAction: suggestedAction || undefined
      };

    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        priority: rule.priority,
        passed: false,
        message: `Rule evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAction: 'Review rule configuration'
      };
    }
  }

  /**
   * Safely evaluate condition string
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression evaluator
      // This is a simplified version for demonstration
      
      // Replace context variables in condition
      let evaluableCondition = condition;
      
      // Handle simple property access
      evaluableCondition = evaluableCondition.replace(
        /(\w+)\.(\w+)\.?(\w+)?/g,
        (match, obj, prop, subProp) => {
          const value = subProp ? context[obj]?.[prop]?.[subProp] : context[obj]?.[prop];
          if (typeof value === 'string') {
            return `"${value}"`;
          }
          return value !== undefined ? String(value) : 'undefined';
        }
      );

      // Handle regex patterns
      evaluableCondition = evaluableCondition.replace(
        /\/(.+?)\/\.test\(([^)]+)\)/g,
        (match, pattern, variable) => {
          const regex = new RegExp(pattern);
          const value = eval(variable);
          return String(regex.test(value));
        }
      );

      // Evaluate the condition
      return eval(evaluableCondition) === true;

    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Get failure message for rule
   */
  private getFailureMessage(rule: BusinessRule): string {
    const messages: Record<string, string> = {
      'ADDR_001': 'Address is not easily locatable. This may affect verification outcome.',
      'ADDR_002': 'Invalid pincode format. Please provide a valid 6-digit Indian postal code.',
      'ADDR_003': 'GPS coordinates accuracy is poor (>50m). Consider retaking location.',
      'CUST_001': 'Invalid phone number format. Please provide a valid Indian mobile number.',
      'CUST_002': 'Customer age is outside acceptable range (18-100 years).',
      'CUST_003': 'Invalid PAN number format. Please check the PAN number.',
      'VERIF_001': 'Person met details are required for positive verification.',
      'VERIF_002': 'Verification date cannot be in the future.',
      'VERIF_003': 'Reason for negative verification must be provided.',
      'BUS_001': 'Invalid GST number format.',
      'BUS_002': 'Business turnover seems unusually high. Please verify.',
      'PROP_001': 'Property value seems unusually high for the location.',
      'PROP_002': 'Family size seems unusual. Please verify.',
      'CREDIT_001': 'Credit limit cannot be set for negative verifications.',
      'CREDIT_002': 'Risk category does not align with final status.'
    };

    return messages[rule.id] || `${rule.name}: Validation failed`;
  }

  /**
   * Get suggested action for rule failure
   */
  private getSuggestedAction(rule: BusinessRule): string {
    const actions: Record<string, string> = {
      'ADDR_001': 'Verify address details and update if necessary',
      'ADDR_002': 'Correct the pincode format',
      'ADDR_003': 'Retake GPS coordinates with better accuracy',
      'CUST_001': 'Update phone number with correct format',
      'CUST_002': 'Verify and correct customer age',
      'CUST_003': 'Verify and correct PAN number',
      'VERIF_001': 'Add details of person met during verification',
      'VERIF_002': 'Correct the verification date',
      'VERIF_003': 'Add reason for negative verification',
      'BUS_001': 'Verify and correct GST number',
      'BUS_002': 'Double-check business turnover figures',
      'PROP_001': 'Verify property value with local market rates',
      'PROP_002': 'Confirm family size details',
      'CREDIT_001': 'Remove credit limit or change verification status',
      'CREDIT_002': 'Align risk category with verification outcome'
    };

    return actions[rule.id] || 'Review and correct the data';
  }

  /**
   * Calculate score penalty based on rule priority
   */
  private getScorePenalty(priority: string): number {
    switch (priority) {
      case 'HIGH': return 20;
      case 'MEDIUM': return 10;
      case 'LOW': return 5;
      default: return 5;
    }
  }

  /**
   * Calculate risk level based on score and violations
   */
  private calculateRiskLevel(
    score: number,
    errorCount: number,
    warningCount: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (errorCount > 0 || score < 60) {
      return 'HIGH';
    } else if (warningCount > 2 || score < 80) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Get recommended action based on validation results
   */
  private getRecommendedAction(
    score: number,
    errorCount: number,
    riskLevel: string
  ): 'APPROVE' | 'REJECT' | 'REVIEW' | 'CONDITIONAL_APPROVE' {
    if (errorCount > 0) {
      return 'REJECT';
    } else if (riskLevel === 'HIGH') {
      return 'REVIEW';
    } else if (riskLevel === 'MEDIUM') {
      return 'CONDITIONAL_APPROVE';
    } else {
      return 'APPROVE';
    }
  }

  /**
   * Add custom business rule
   */
  async addCustomRule(rule: Omit<BusinessRule, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();

    await query(`
      INSERT INTO business_rules (
        id, name, description, verification_type, rule_type, priority,
        condition_logic, action, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      rule.id, rule.name, rule.description, JSON.stringify(rule.verificationType),
      rule.ruleType, rule.priority, rule.condition, rule.action, rule.isActive, now, now
    ]);
  }

  /**
   * Update business rule
   */
  async updateRule(ruleId: string, updates: Partial<BusinessRule>): Promise<void> {
    const now = new Date().toISOString();
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.description) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (updates.verificationType) {
      updateFields.push(`verification_type = $${paramIndex++}`);
      values.push(JSON.stringify(updates.verificationType));
    }

    if (updates.condition) {
      updateFields.push(`condition_logic = $${paramIndex++}`);
      values.push(updates.condition);
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(now);

    values.push(ruleId);

    if (updateFields.length > 1) { // More than just updated_at
      await query(`
        UPDATE business_rules 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, values);
    }
  }

  /**
   * Get all business rules
   */
  async getAllRules(): Promise<BusinessRule[]> {
    const result = await query('SELECT * FROM business_rules ORDER BY priority DESC, name');
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      verificationType: JSON.parse(row.verification_type),
      ruleType: row.rule_type,
      priority: row.priority,
      condition: row.condition_logic,
      action: row.action,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}

export default new BusinessRulesService();
