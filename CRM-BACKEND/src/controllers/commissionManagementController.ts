import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import type {
  CommissionRateType,
  CreateCommissionRateTypeData,
  UpdateCommissionRateTypeData,
  FieldUserCommissionAssignment,
  CreateFieldUserCommissionAssignmentData,
  CommissionCalculation,
  CommissionQuery,
  CreateCommissionCalculationData,
  CommissionCalculationInput,
  CommissionCalculationResult
} from '../types/commission';

// =====================================================
// COMMISSION RATE TYPES MANAGEMENT
// =====================================================

export const getCommissionRateTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive, search } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (isActive !== undefined) {
      conditions.push(`crt.is_active = $${paramIndex}`);
      queryParams.push(isActive === 'true');
      paramIndex++;
    }

    if (search) {
      conditions.push(`(rt.name ILIKE $${paramIndex} OR rt.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const result = await query(
      `SELECT 
        crt.id,
        crt.rate_type_id as "rateTypeId",
        crt.commission_amount as "commissionAmount",
        crt.currency,
        crt.is_active as "isActive",
        crt.created_by as "createdBy",
        crt.created_at as "createdAt",
        crt.updated_at as "updatedAt",
        rt.name as "rateTypeName"
       FROM commission_rate_types crt
       LEFT JOIN "rateTypes" rt ON crt.rate_type_id = rt.id
       ${whereClause}
       ORDER BY crt.created_at DESC`,
      queryParams
    );

    const commissionRateTypes: CommissionRateType[] = result.rows;

    logger.info(`Retrieved ${commissionRateTypes.length} commission rate types`, {
      userId: req.user?.id,
      isActive,
      search
    });

    res.json({
      success: true,
      data: commissionRateTypes,
      message: `Found ${commissionRateTypes.length} commission rate types`
    });
  } catch (error) {
    logger.error('Error retrieving commission rate types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve commission rate types',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

export const createCommissionRateType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rateTypeId, commissionAmount, currency = 'INR', isActive = true }: CreateCommissionRateTypeData = req.body;

    // Validate that commission amount is provided
    if (!commissionAmount || commissionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission amount must be provided and greater than 0',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check if rate type exists
    const rateTypeCheck = await query('SELECT id FROM "rateTypes" WHERE id = $1', [rateTypeId]);
    if (rateTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rate type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if commission rate type already exists for this rate type
    const existingCheck = await query('SELECT id FROM commission_rate_types WHERE rate_type_id = $1', [rateTypeId]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission rate type already exists for this rate type',
        error: { code: 'DUPLICATE_ENTRY' },
      });
    }

    // Create commission rate type
    const result = await query(
      `INSERT INTO commission_rate_types (rate_type_id, commission_amount, currency, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rate_type_id as "rateTypeId", commission_amount as "commissionAmount", 
                 currency, is_active as "isActive",
                 created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
      [rateTypeId, commissionAmount, currency, isActive, req.user?.id]
    );

    const newCommissionRateType = result.rows[0];

    logger.info(`Created commission rate type: ${newCommissionRateType.id}`, {
      userId: req.user?.id,
      rateTypeId,
      commissionAmount
    });

    res.status(201).json({
      success: true,
      data: newCommissionRateType,
      message: 'Commission rate type created successfully'
    });
  } catch (error) {
    logger.error('Error creating commission rate type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commission rate type',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

export const updateCommissionRateType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { commissionAmount, currency, isActive }: UpdateCommissionRateTypeData = req.body;

    // Check if commission rate type exists
    const existingCheck = await query('SELECT id FROM commission_rate_types WHERE id = $1', [Number(id)]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commission rate type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (commissionAmount !== undefined) {
      if (commissionAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Commission amount must be greater than 0',
          error: { code: 'VALIDATION_ERROR' },
        });
      }
      updateFields.push(`commission_amount = $${paramIndex}`);
      updateValues.push(commissionAmount);
      paramIndex++;
    }

    if (currency !== undefined) {
      updateFields.push(`currency = $${paramIndex}`);
      updateValues.push(currency);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(Number(id));

    const result = await query(
      `UPDATE commission_rate_types 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, rate_type_id as "rateTypeId", commission_amount as "commissionAmount", 
                 currency, is_active as "isActive",
                 created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
      updateValues
    );

    const updatedCommissionRateType = result.rows[0];

    logger.info(`Updated commission rate type: ${id}`, {
      userId: req.user?.id,
      commissionAmount,
      currency,
      isActive
    });

    res.json({
      success: true,
      data: updatedCommissionRateType,
      message: 'Commission rate type updated successfully'
    });
  } catch (error) {
    logger.error('Error updating commission rate type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission rate type',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

export const deleteCommissionRateType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if commission rate type exists
    const existingCheck = await query('SELECT id FROM commission_rate_types WHERE id = $1', [Number(id)]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commission rate type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if there are any active assignments using this commission rate type
    const assignmentCheck = await query(
      'SELECT id FROM field_user_commission_assignments WHERE rate_type_id = (SELECT rate_type_id FROM commission_rate_types WHERE id = $1) AND is_active = true',
      [Number(id)]
    );

    if (assignmentCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete commission rate type with active assignments',
        error: { code: 'CONSTRAINT_VIOLATION' },
      });
    }

    await query('DELETE FROM commission_rate_types WHERE id = $1', [Number(id)]);

    logger.info(`Deleted commission rate type: ${id}`, {
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Commission rate type deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting commission rate type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete commission rate type',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// =====================================================
// FIELD USER COMMISSION ASSIGNMENTS
// =====================================================

export const getFieldUserCommissionAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, rateTypeId, clientId, isActive, page = 1, limit = 20 } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} fuca.user_id = $${paramCount}`;
      queryParams.push(userId);
    }

    if (rateTypeId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} fuca.rate_type_id = $${paramCount}`;
      queryParams.push(Number(rateTypeId));
    }

    if (clientId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} fuca.client_id = $${paramCount}`;
      queryParams.push(Number(clientId));
    }

    if (isActive !== undefined) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} fuca.is_active = $${paramCount}`;
      queryParams.push(isActive === 'true');
    }

    const offset = (Number(page) - 1) * Number(limit);
    paramCount++;
    queryParams.push(Number(limit));
    paramCount++;
    queryParams.push(offset);

    const assignmentsQuery = `
      SELECT
        fuca.*,
        u.name as user_name,
        u.email as user_email,
        rt.name as rate_type_name,
        c.name as client_name
      FROM field_user_commission_assignments fuca
      LEFT JOIN users u ON fuca.user_id = u.id
      LEFT JOIN "rateTypes" rt ON fuca.rate_type_id = rt.id
      LEFT JOIN clients c ON fuca.client_id = c.id
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY fuca.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const assignments = await query(assignmentsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM field_user_commission_assignments fuca
      ${whereClause ? `WHERE ${whereClause}` : ''}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const totalResult = await query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].total);

    logger.info('Retrieved field user commission assignments', {
      userId: req.user?.id,
      page: Number(page),
      limit: Number(limit),
      total,
      filters: { userId, rateTypeId, clientId, isActive }
    });

    res.json({
      success: true,
      data: assignments.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error retrieving field user commission assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve field user commission assignments',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

export const createFieldUserCommissionAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userId,
      rateTypeId,
      commissionAmount,
      currency = 'INR',
      clientId,
      effectiveFrom,
      effectiveTo
    }: CreateFieldUserCommissionAssignmentData = req.body;

    // Validate required fields
    if (!userId || !rateTypeId || !commissionAmount) {
      return res.status(400).json({
        success: false,
        message: 'User ID, rate type ID, and commission amount are required',
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Check if user exists and is a field user
    const userCheck = await query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' }
      });
    }

    if (userCheck.rows[0].role !== 'FIELD_AGENT') {
      return res.status(400).json({
        success: false,
        message: 'User must be a field agent to assign commission rates',
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Check if rate type exists
    const rateTypeCheck = await query('SELECT id FROM "rateTypes" WHERE id = $1', [rateTypeId]);
    if (rateTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rate type not found',
        error: { code: 'NOT_FOUND' }
      });
    }



    // Check for existing active assignment for same user, rate type, and client
    const existingCheck = await query(
      `SELECT id FROM field_user_commission_assignments
       WHERE user_id = $1 AND rate_type_id = $2 AND client_id = $3 AND is_active = true`,
      [userId, rateTypeId, clientId || null]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Active commission assignment already exists for this user, rate type, and client combination',
        error: { code: 'DUPLICATE_ASSIGNMENT' }
      });
    }

    // Create field user commission assignment
    const insertQuery = `
      INSERT INTO field_user_commission_assignments
      (user_id, rate_type_id, commission_amount, currency, client_id, effective_from, effective_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const newAssignment = await query(insertQuery, [
      userId,
      rateTypeId,
      commissionAmount,
      currency,
      clientId || null,
      effectiveFrom || new Date(),
      effectiveTo || null,
      req.user?.id
    ]);

    logger.info('Created field user commission assignment', {
      userId: req.user?.id,
      assignmentId: newAssignment.rows[0].id,
      targetUserId: userId,
      rateTypeId,
      commissionAmount
    });

    res.status(201).json({
      success: true,
      data: newAssignment.rows[0],
      message: 'Field user commission assignment created successfully'
    });
  } catch (error) {
    logger.error('Error creating field user commission assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create field user commission assignment',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// =====================================================
// COMMISSION CALCULATIONS
// =====================================================

export const getCommissionCalculations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userId,
      clientId,
      rateTypeId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.user_id = $${paramCount}`;
      queryParams.push(userId);
    }

    if (clientId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.client_id = $${paramCount}`;
      queryParams.push(Number(clientId));
    }

    if (rateTypeId) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.rate_type_id = $${paramCount}`;
      queryParams.push(Number(rateTypeId));
    }

    if (status) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (startDate) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += `${whereClause ? ' AND' : ''} cc.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    const offset = (Number(page) - 1) * Number(limit);
    paramCount++;
    queryParams.push(Number(limit));
    paramCount++;
    queryParams.push(offset);

    const calculationsQuery = `
      SELECT
        cc.*,
        u.name as user_name,
        u.email as user_email,
        c.name as client_name,
        rt.name as rate_type_name,
        cases.customer_name,
        cases.address
      FROM commission_calculations cc
      LEFT JOIN users u ON cc.user_id = u.id
      LEFT JOIN clients c ON cc.client_id = c.id
      LEFT JOIN "rateTypes" rt ON cc.rate_type_id = rt.id
      LEFT JOIN cases ON cc.case_id = cases.id
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY cc.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const calculations = await query(calculationsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM commission_calculations cc
      ${whereClause ? `WHERE ${whereClause}` : ''}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const totalResult = await query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].total);

    // Get summary statistics
    const summaryQuery = `
      SELECT
        COUNT(*) as total_calculations,
        SUM(calculated_commission) as total_commission,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count
      FROM commission_calculations cc
      ${whereClause ? `WHERE ${whereClause}` : ''}
    `;
    const summaryResult = await query(summaryQuery, countParams);

    logger.info('Retrieved commission calculations', {
      userId: req.user?.id,
      page: Number(page),
      limit: Number(limit),
      total,
      filters: { userId, clientId, rateTypeId, status, startDate, endDate }
    });

    res.json({
      success: true,
      data: calculations.rows,
      summary: summaryResult.rows[0],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error retrieving commission calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve commission calculations',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

export const calculateCommissionForCompletedCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required',
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Get case details
    const caseQuery = `
      SELECT
        c.*,
        rt.name as rate_type_name,
        rt.amount as rate_amount
      FROM cases c
      LEFT JOIN "rateTypes" rt ON c.rate_type_id = rt.id
      WHERE c.id = $1
    `;
    const caseResult = await query(caseQuery, [caseId]);

    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' }
      });
    }

    const caseData = caseResult.rows[0];

    // Check if case is completed
    if (caseData.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Commission can only be calculated for completed cases',
        error: { code: 'INVALID_STATUS' }
      });
    }

    // Check if commission already calculated
    const existingCalculation = await query(
      'SELECT id FROM commission_calculations WHERE case_id = $1',
      [caseId]
    );

    if (existingCalculation.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission already calculated for this case',
        error: { code: 'ALREADY_CALCULATED' }
      });
    }

    // Get field user commission assignment
    const assignmentQuery = `
      SELECT fuca.*
      FROM field_user_commission_assignments fuca
      WHERE fuca.user_id = $1
        AND fuca.rate_type_id = $2
        AND fuca.client_id = $3
        AND fuca.is_active = true
        AND (fuca.effective_from <= NOW() AND (fuca.effective_to IS NULL OR fuca.effective_to >= NOW()))
    `;

    const assignmentResult = await query(assignmentQuery, [
      caseData.assigned_to,
      caseData.rate_type_id,
      caseData.client_id
    ]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active commission assignment found for this field user, rate type, and client',
        error: { code: 'NO_ASSIGNMENT' }
      });
    }

    const assignment = assignmentResult.rows[0];
    const baseAmount = caseData.rate_amount || 0;
    const commissionAmount = assignment.commission_amount || 0;
    const calculatedCommission = commissionAmount; // Fixed amount

    // Create commission calculation record
    const insertQuery = `
      INSERT INTO commission_calculations
      (case_id, case_number, user_id, client_id, rate_type_id, base_amount, commission_amount, calculated_commission, calculation_method, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const newCalculation = await query(insertQuery, [
      caseId,
      caseData.case_number,
      caseData.assigned_to,
      caseData.client_id,
      caseData.rate_type_id,
      baseAmount,
      commissionAmount,
      calculatedCommission,
      'FIXED_AMOUNT',
      'PENDING',
      req.user?.id
    ]);

    logger.info('Created commission calculation for completed case', {
      userId: req.user?.id,
      caseId,
      caseNumber: caseData.case_number,
      fieldUserId: caseData.assigned_to,
      calculatedCommission
    });

    res.status(201).json({
      success: true,
      data: newCalculation.rows[0],
      message: 'Commission calculated successfully for completed case'
    });
  } catch (error) {
    logger.error('Error calculating commission for completed case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission for completed case',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// =====================================================
// AUTO-CALCULATION HELPER FUNCTION
// =====================================================

// Auto-calculate commission when case is completed (called internally)
export const autoCalculateCommissionForCase = async (caseId: string): Promise<boolean> => {
  try {
    console.log(`🧮 Auto-calculating commission for completed case: ${caseId}`);

    // Get case details
    const caseQuery = `
      SELECT
        c.id,
        c."caseId" as case_number,
        c."assignedTo" as user_id,
        c."clientId" as client_id,
        c."completedAt" as case_completed_at,
        c.status,
        c.rate_type_id,
        rt.name as rate_type_name,
        r.amount as base_amount,
        r.currency
      FROM cases c
      LEFT JOIN "rateTypes" rt ON c.rate_type_id = rt.id
      LEFT JOIN rates r ON r."clientId" = c."clientId"
        AND r."productId" = c."productId"
        AND r."verificationTypeId" = c."verificationTypeId"
        AND r."rateTypeId" = c.rate_type_id
      WHERE c.id = $1 AND c.status = 'COMPLETED'
    `;

    const caseResult = await query(caseQuery, [caseId]);

    if (caseResult.rows.length === 0) {
      console.log(`⚠️ Case not found or not completed: ${caseId}`);
      return false;
    }

    const caseData = caseResult.rows[0];

    if (!caseData.rate_type_id) {
      console.log(`⚠️ No rate type assigned for case: ${caseId}`);
      return false;
    }

    if (!caseData.user_id) {
      console.log(`⚠️ No user assigned to case: ${caseId}`);
      return false;
    }

    // Get field user commission assignment
    const assignmentQuery = `
      SELECT
        commission_amount,
        currency,
        is_active
      FROM field_user_commission_assignments
      WHERE user_id = $1
        AND rate_type_id = $2
        AND is_active = true
        AND (client_id IS NULL OR client_id = $3)
        AND effective_from <= CURRENT_TIMESTAMP
        AND (effective_to IS NULL OR effective_to >= CURRENT_TIMESTAMP)
      ORDER BY client_id DESC NULLS LAST
      LIMIT 1
    `;

    const assignmentResult = await query(assignmentQuery, [
      caseData.user_id,
      caseData.rate_type_id,
      caseData.client_id
    ]);

    if (assignmentResult.rows.length === 0) {
      console.log(`⚠️ No commission assignment found for user ${caseData.user_id} and rate type ${caseData.rate_type_id}`);
      return false;
    }

    const assignment = assignmentResult.rows[0];

    // Check if commission already calculated
    const existingQuery = `
      SELECT id FROM commission_calculations
      WHERE case_id = $1 AND user_id = $2
    `;

    const existingResult = await query(existingQuery, [caseId, caseData.user_id]);

    if (existingResult.rows.length > 0) {
      console.log(`ℹ️ Commission already calculated for case: ${caseId}`);
      return true;
    }

    // Calculate commission
    const commissionAmount = parseFloat(assignment.commission_amount);
    const baseAmount = parseFloat(caseData.base_amount) || 0;

    // Insert commission calculation
    const insertQuery = `
      INSERT INTO commission_calculations (
        id,
        case_id,
        case_number,
        user_id,
        client_id,
        rate_type_id,
        base_amount,
        commission_amount,
        currency,
        calculation_method,
        status,
        case_completed_at,
        calculated_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, commission_amount, currency
    `;

    const insertResult = await query(insertQuery, [
      caseId,
      caseData.case_number,
      caseData.user_id,
      caseData.client_id,
      caseData.rate_type_id,
      baseAmount,
      commissionAmount,
      assignment.currency,
      'FIXED_AMOUNT',
      'CALCULATED',
      caseData.case_completed_at
    ]);

    const calculation = insertResult.rows[0];
    console.log(`✅ Commission calculated successfully for case ${caseId}: ${calculation.currency} ${calculation.commission_amount}`);

    return true;

  } catch (error) {
    console.error(`❌ Error auto-calculating commission for case ${caseId}:`, error);
    return false;
  }
};
