import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { pool } from '@/config/database';

// GET /api/reports/cases - Cases report
export const getCasesReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      clientId, 
      assignedToId, 
      status, 
      priority, 
      format = 'JSON' 
    } = req.query;

    // Build WHERE conditions for database query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dateFrom) {
      conditions.push(`c."createdAt" >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }
    if (dateTo) {
      conditions.push(`c."createdAt" <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }
    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (clientId) {
      conditions.push(`c."clientId" = $${paramIndex}`);
      params.push(parseInt(clientId as string));
      paramIndex++;
    }
    if (assignedToId) {
      conditions.push(`c."assignedTo" = $${paramIndex}`);
      params.push(assignedToId);
      paramIndex++;
    }
    if (priority) {
      conditions.push(`c.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get cases from database with related data
    const casesQuery = `
      SELECT 
        c.*,
        cl.name as "clientName",
        cl.code as "clientCode",
        u.name as "assignedToName",
        creator.name as "createdByName"
      FROM cases c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users u ON c."assignedTo" = u.id
      LEFT JOIN users creator ON c."createdByBackendUser" = creator.id
      ${whereClause}
      ORDER BY c."createdAt" DESC
    `;

    const casesResult = await pool.query(casesQuery, params);
    const filteredCases = casesResult.rows;

    // Calculate summary statistics
    const totalCases = filteredCases.length;
    const completedCases = filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const pendingCases = filteredCases.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
    
    // Calculate average turnaround time for completed cases
    const completedCasesWithDates = filteredCases.filter(c => c.updatedAt && (c.status === 'COMPLETED' || c.status === 'APPROVED'));
    const avgTurnaroundTime = completedCasesWithDates.length > 0 
      ? completedCasesWithDates.reduce((acc, c) => {
          const days = (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return acc + days;
        }, 0) / completedCasesWithDates.length
      : 0;

    const report = {
      summary: {
        totalCases,
        completedCases,
        pendingCases,
        completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0,
        avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      },
      data: filteredCases,
      filters: { 
        dateFrom: dateFrom as string, 
        dateTo: dateTo as string, 
        clientId: clientId as string, 
        assignedToId: assignedToId as string, 
        status: status as string, 
        priority: priority as string 
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Cases report generated', {
      userId: req.user?.id,
      totalCases,
      filters: { dateFrom, dateTo, clientId, status }
    });

    res.json({
      success: true,
      data: report,
      message: 'Cases report generated successfully',
    });
  } catch (error) {
    logger.error('Error generating cases report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cases report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/users - User performance report
export const getUserPerformanceReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      department, 
      role,
      isActive, 
      format = 'JSON' 
    } = req.query;

    // Build WHERE conditions for users query
    const userConditions: string[] = [];
    const userParams: any[] = [];
    let userParamIndex = 1;

    if (department) {
      userConditions.push(`u.department = $${userParamIndex}`);
      userParams.push(department);
      userParamIndex++;
    }
    if (role) {
      userConditions.push(`u.role = $${userParamIndex}`);
      userParams.push(role);
      userParamIndex++;
    }
    if (isActive !== undefined) {
      userConditions.push(`u."isActive" = $${userParamIndex}`);
      userParams.push(isActive === 'true');
      userParamIndex++;
    }

    const userWhereClause = userConditions.length > 0 ? `WHERE ${userConditions.join(' AND ')}` : '';

    // Get users from database
    const usersQuery = `
      SELECT u.*, COUNT(c."caseId") as "totalCases"
      FROM users u
      LEFT JOIN cases c ON u.id = c."assignedTo"
      ${userWhereClause}
      GROUP BY u.id
      ORDER BY u.name
    `;

    const usersResult = await pool.query(usersQuery, userParams);

    const report = {
      summary: {
        totalUsers: usersResult.rows.length,
        activeUsers: usersResult.rows.filter(u => u.isActive).length,
      },
      data: usersResult.rows,
      filters: { 
        dateFrom: dateFrom as string, 
        dateTo: dateTo as string, 
        department: department as string, 
        role: role as string,
        isActive: isActive as string 
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    res.json({
      success: true,
      data: report,
      message: 'User performance report generated successfully',
    });
  } catch (error) {
    logger.error('Error generating user performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate user performance report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/clients - Client report
export const getClientReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      isActive, 
      format = 'JSON' 
    } = req.query;

    // Build WHERE conditions for clients query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      conditions.push(`cl."isActive" = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get clients from database with case counts
    const clientsQuery = `
      SELECT cl.*, COUNT(c."caseId") as "totalCases"
      FROM clients cl
      LEFT JOIN cases c ON cl.id = c."clientId"
      ${whereClause}
      GROUP BY cl.id
      ORDER BY cl.name
    `;

    const clientsResult = await pool.query(clientsQuery, params);

    const report = {
      summary: {
        totalClients: clientsResult.rows.length,
        activeClients: clientsResult.rows.filter(c => c.isActive).length,
      },
      data: clientsResult.rows,
      filters: { 
        isActive: isActive as string 
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    res.json({
      success: true,
      data: report,
      message: 'Client report generated successfully',
    });
  } catch (error) {
    logger.error('Error generating client report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate client report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/dashboard - Dashboard summary
export const getDashboardReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get basic counts from database
    const summaryQuery = `
      SELECT 
        (SELECT COUNT(*) FROM cases) as "totalCases",
        (SELECT COUNT(*) FROM cases WHERE status = 'PENDING') as "pendingCases",
        (SELECT COUNT(*) FROM cases WHERE status = 'IN_PROGRESS') as "inProgressCases",
        (SELECT COUNT(*) FROM cases WHERE status = 'COMPLETED') as "completedCases",
        (SELECT COUNT(*) FROM users WHERE "isActive" = true) as "activeUsers",
        (SELECT COUNT(*) FROM clients WHERE "isActive" = true) as "activeClients"
    `;

    const summaryResult = await pool.query(summaryQuery);
    const summary = summaryResult.rows[0];

    res.json({
      success: true,
      data: {
        summary,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.id,
      },
      message: 'Dashboard report generated successfully',
    });
  } catch (error) {
    logger.error('Error generating dashboard report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
