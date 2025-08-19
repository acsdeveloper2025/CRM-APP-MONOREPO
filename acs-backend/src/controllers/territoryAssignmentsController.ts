import { Request, Response } from 'express';
import { query } from '@/config/database';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/auth';

// GET /api/territory-assignments/field-agents - List all field agents with their territory assignments
export const getFieldAgentTerritories = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      pincodeId,
      cityId,
      isActive = 'true',
      sortBy = 'userName',
      sortOrder = 'asc'
    } = req.query;

    // Build the WHERE clause
    const conditions: string[] = ['u.role = $1'];
    const params: any[] = ['FIELD'];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR u."employeeId" ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (pincodeId) {
      conditions.push(`upa."pincodeId" = $${paramIndex}`);
      params.push(pincodeId);
      paramIndex++;
    }

    if (cityId) {
      conditions.push(`c.id = $${paramIndex}`);
      params.push(cityId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`upa."isActive" = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN "userPincodeAssignments" upa ON u.id = upa."userId"
      LEFT JOIN pincodes p ON upa."pincodeId" = p.id
      LEFT JOIN cities c ON p."cityId" = c.id
      ${whereClause}
    `;

    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Get field agents with territory assignments using the view
    const sql = `
      SELECT DISTINCT
        u.id as "userId",
        u.name as "userName",
        u.username,
        u."employeeId",
        u."isActive" as "userIsActive",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'pincodeAssignmentId', upa.id,
              'pincodeId', upa."pincodeId",
              'pincodeCode', p.code,
              'cityName', c.name,
              'stateName', c.state,
              'countryName', c.country,
              'assignedAreas', COALESCE(area_agg.areas, '[]'::json),
              'pincodeAssignedAt', upa."assignedAt",
              'isActive', upa."isActive"
            ) ORDER BY p.code
          ) FILTER (WHERE upa."pincodeId" IS NOT NULL),
          '[]'::json
        ) as "territoryAssignments"
      FROM users u
      LEFT JOIN "userPincodeAssignments" upa ON u.id = upa."userId" AND upa."isActive" = true
      LEFT JOIN pincodes p ON upa."pincodeId" = p.id
      LEFT JOIN cities c ON p."cityId" = c.id
      LEFT JOIN (
        SELECT
          uaa."userId",
          uaa."pincodeId",
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'areaAssignmentId', uaa.id,
              'areaId', uaa."areaId",
              'areaName', pa.name,
              'assignedAt', uaa."assignedAt"
            )
          ) as areas
        FROM "userAreaAssignments" uaa
        LEFT JOIN "pincodeAreas" pa ON uaa."areaId" = pa.id
        WHERE uaa."isActive" = true
        GROUP BY uaa."userId", uaa."pincodeId"
      ) area_agg ON upa."userId" = area_agg."userId" AND upa."pincodeId" = area_agg."pincodeId"
      ${whereClause}
      GROUP BY u.id, u.name, u.username, u."employeeId", u."isActive"
      ORDER BY ${sortBy === 'userName' ? 'u.name' : `u."${sortBy}"`} ${String(sortOrder).toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);
    const result = await query(sql, params);

    logger.info(`Retrieved ${result.rows.length} field agents with territories`, {
      userId: (req as any).user?.id,
      page: pageNum,
      limit: limitNum,
      total,
      filters: { search, pincodeId, cityId, isActive }
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error retrieving field agent territories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve field agent territories',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/territory-assignments/field-agents/:userId - Get specific field agent's territory assignments
export const getFieldAgentTerritoryById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists and is a field agent
    const userCheck = await query(
      'SELECT id, name, username, "employeeId", role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'FIELD') {
      return res.status(400).json({
        success: false,
        message: 'User is not a field agent',
        error: { code: 'INVALID_USER_ROLE' },
      });
    }

    // Get territory assignments using the view
    const sql = `
      SELECT 
        "userId",
        "userName",
        "username",
        "employeeId",
        "pincodeAssignmentId",
        "pincodeId",
        "pincodeCode",
        "cityName",
        "stateName",
        "countryName",
        "assignedAreas",
        "pincodeAssignedAt",
        "assignedBy",
        "isActive"
      FROM "fieldAgentTerritories"
      WHERE "userId" = $1
      ORDER BY "pincodeCode"
    `;

    const result = await query(sql, [userId]);

    logger.info(`Retrieved territory assignments for field agent ${userId}`, {
      userId: (req as any).user?.id,
      targetUserId: userId,
      assignmentCount: result.rows.length
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          employeeId: user.employeeId,
          role: user.role
        },
        territoryAssignments: result.rows
      },
    });
  } catch (error) {
    logger.error('Error retrieving field agent territory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve field agent territory',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/territory-assignments/field-agents/:userId/pincodes - Assign pincodes to field agent
export const assignPincodesToFieldAgent = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { pincodeIds } = req.body;

    // Validate input
    if (!Array.isArray(pincodeIds) || pincodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'pincodeIds must be a non-empty array',
        error: { code: 'INVALID_INPUT' },
      });
    }

    // Verify user exists and is a field agent
    const userResult = await query(
      'SELECT id, name, username, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const user = userResult.rows[0];
    if (user.role !== 'FIELD') {
      return res.status(400).json({
        success: false,
        message: 'User is not a field agent',
        error: { code: 'INVALID_USER_ROLE' },
      });
    }

    // Verify all pincodes exist
    const pincodeCheck = await query(
      `SELECT id, code FROM pincodes WHERE id = ANY($1)`,
      [pincodeIds]
    );

    if (pincodeCheck.rows.length !== pincodeIds.length) {
      const foundIds = pincodeCheck.rows.map(row => row.id);
      const missingIds = pincodeIds.filter(id => !foundIds.includes(parseInt(id)));
      return res.status(400).json({
        success: false,
        message: `Pincodes not found: ${missingIds.join(', ')}`,
        error: { code: 'INVALID_PINCODES' },
      });
    }

    // Insert pincode assignments (ignore duplicates)
    const insertPromises = pincodeIds.map(async (pincodeId: number) => {
      try {
        const result = await query(
          `INSERT INTO "userPincodeAssignments" ("userId", "pincodeId", "assignedBy")
           VALUES ($1, $2, $3)
           ON CONFLICT ("userId", "pincodeId", "isActive") 
           WHERE "isActive" = true
           DO NOTHING
           RETURNING id, "pincodeId", "assignedAt"`,
          [userId, pincodeId, (req as any).user?.id]
        );
        return result.rows[0];
      } catch (error) {
        logger.warn(`Failed to assign pincode ${pincodeId} to user ${userId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(insertPromises);
    const newAssignments = results.filter(result => result !== null);

    logger.info(`Assigned ${newAssignments.length} new pincodes to field agent ${userId}`, {
      userId: (req as any).user?.id,
      targetUserId: userId,
      pincodeIds,
      newAssignments: newAssignments.length
    });

    res.status(201).json({
      success: true,
      data: {
        userId,
        assignedPincodes: newAssignments.length,
        totalRequested: pincodeIds.length,
        duplicatesSkipped: pincodeIds.length - newAssignments.length
      },
      message: `Successfully assigned ${newAssignments.length} pincodes to field agent`,
    });
  } catch (error) {
    logger.error('Error assigning pincodes to field agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign pincodes to field agent',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/territory-assignments/field-agents/:userId/areas - Assign areas within pincodes to field agent
export const assignAreasToFieldAgent = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { assignments } = req.body; // Array of { pincodeId, areaIds }

    // Validate input
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'assignments must be a non-empty array of { pincodeId, areaIds }',
        error: { code: 'INVALID_INPUT' },
      });
    }

    // Verify user exists and is a field agent
    const userResult = await query(
      'SELECT id, name, username, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const user = userResult.rows[0];
    if (user.role !== 'FIELD') {
      return res.status(400).json({
        success: false,
        message: 'User is not a field agent',
        error: { code: 'INVALID_USER_ROLE' },
      });
    }

    let totalAssigned = 0;
    let totalRequested = 0;
    const assignmentResults = [];

    for (const assignment of assignments) {
      const { pincodeId, areaIds } = assignment;

      if (!Array.isArray(areaIds) || areaIds.length === 0) {
        continue;
      }

      totalRequested += areaIds.length;

      // Verify pincode assignment exists
      const pincodeAssignmentResult = await query(
        `SELECT id FROM "userPincodeAssignments"
         WHERE "userId" = $1 AND "pincodeId" = $2 AND "isActive" = true`,
        [userId, pincodeId]
      );

      if (pincodeAssignmentResult.rows.length === 0) {
        assignmentResults.push({
          pincodeId,
          error: 'Field agent not assigned to this pincode',
          assigned: 0,
          requested: areaIds.length
        });
        continue;
      }

      const userPincodeAssignmentId = pincodeAssignmentResult.rows[0].id;

      // Verify areas exist and belong to the pincode
      const areaCheck = await query(
        `SELECT a.id, a.name, pa."pincodeId"
         FROM areas a
         JOIN "pincodeAreas" pa ON a.id = pa."areaId"
         WHERE a.id = ANY($1) AND pa."pincodeId" = $2`,
        [areaIds, pincodeId]
      );

      const validAreaIds = areaCheck.rows.map(row => row.id);
      const invalidAreaIds = areaIds.filter(id => !validAreaIds.includes(parseInt(id)));

      if (invalidAreaIds.length > 0) {
        assignmentResults.push({
          pincodeId,
          error: `Invalid areas for pincode: ${invalidAreaIds.join(', ')}`,
          assigned: 0,
          requested: areaIds.length
        });
        continue;
      }

      // Insert area assignments
      const insertPromises = validAreaIds.map(async (areaId: number) => {
        try {
          const result = await query(
            `INSERT INTO "userAreaAssignments"
             ("userId", "pincodeId", "areaId", "userPincodeAssignmentId", "assignedBy")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT ("userId", "pincodeId", "areaId", "isActive")
             WHERE "isActive" = true
             DO NOTHING
             RETURNING id, "areaId"`,
            [userId, pincodeId, areaId, userPincodeAssignmentId, (req as any).user?.id]
          );
          return result.rows[0];
        } catch (error) {
          logger.warn(`Failed to assign area ${areaId} to user ${userId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(insertPromises);
      const newAreaAssignments = results.filter(result => result !== null);
      totalAssigned += newAreaAssignments.length;

      assignmentResults.push({
        pincodeId,
        assigned: newAreaAssignments.length,
        requested: areaIds.length,
        duplicatesSkipped: areaIds.length - newAreaAssignments.length
      });
    }

    logger.info(`Assigned ${totalAssigned} new areas to field agent ${userId}`, {
      userId: (req as any).user?.id,
      targetUserId: userId,
      totalAssigned,
      totalRequested,
      assignmentResults
    });

    res.status(201).json({
      success: true,
      data: {
        userId,
        totalAssigned,
        totalRequested,
        assignmentResults
      },
      message: `Successfully assigned ${totalAssigned} areas to field agent`,
    });
  } catch (error) {
    logger.error('Error assigning areas to field agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign areas to field agent',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/territory-assignments/field-agents/:userId/pincodes/:pincodeId - Remove pincode assignment
export const removePincodeAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, pincodeId } = req.params;

    // Verify assignment exists
    const assignmentCheck = await query(
      `SELECT id FROM "userPincodeAssignments"
       WHERE "userId" = $1 AND "pincodeId" = $2 AND "isActive" = true`,
      [userId, pincodeId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pincode assignment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Deactivate pincode assignment and all related area assignments
    await query('BEGIN');

    try {
      // Deactivate area assignments
      await query(
        `UPDATE "userAreaAssignments"
         SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "userId" = $1 AND "pincodeId" = $2 AND "isActive" = true`,
        [userId, pincodeId]
      );

      // Deactivate pincode assignment
      await query(
        `UPDATE "userPincodeAssignments"
         SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "userId" = $1 AND "pincodeId" = $2 AND "isActive" = true`,
        [userId, pincodeId]
      );

      await query('COMMIT');

      logger.info(`Removed pincode assignment ${pincodeId} from field agent ${userId}`, {
        userId: (req as any).user?.id,
        targetUserId: userId,
        pincodeId
      });

      res.json({
        success: true,
        message: 'Pincode assignment removed successfully',
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error removing pincode assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove pincode assignment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/territory-assignments/field-agents/:userId/areas/:areaId - Remove area assignment
export const removeAreaAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, areaId } = req.params;
    const { pincodeId } = req.query;

    if (!pincodeId) {
      return res.status(400).json({
        success: false,
        message: 'pincodeId query parameter is required',
        error: { code: 'MISSING_PINCODE_ID' },
      });
    }

    // Verify assignment exists
    const assignmentCheck = await query(
      `SELECT id FROM "userAreaAssignments"
       WHERE "userId" = $1 AND "areaId" = $2 AND "pincodeId" = $3 AND "isActive" = true`,
      [userId, areaId, pincodeId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area assignment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Deactivate area assignment
    await query(
      `UPDATE "userAreaAssignments"
       SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "userId" = $1 AND "areaId" = $2 AND "pincodeId" = $3 AND "isActive" = true`,
      [userId, areaId, pincodeId]
    );

    logger.info(`Removed area assignment ${areaId} from field agent ${userId}`, {
      userId: (req as any).user?.id,
      targetUserId: userId,
      areaId,
      pincodeId
    });

    res.json({
      success: true,
      message: 'Area assignment removed successfully',
    });
  } catch (error) {
    logger.error('Error removing area assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove area assignment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
