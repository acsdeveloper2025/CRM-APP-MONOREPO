import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { pool } from '@/config/database';

// Mock data removed - using database operations only

// GET /api/dashboard - Get dashboard overview
export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'month', clientId, userId } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get cases from database with filters
    let casesQuery = 'SELECT * FROM cases WHERE "createdAt" >= $1';
    const queryParams: any[] = [startDate];
    let paramIndex = 2;

    if (clientId) {
      casesQuery += ` AND "clientId" = $${paramIndex}`;
      queryParams.push(parseInt(clientId as string));
      paramIndex++;
    }

    if (userId) {
      casesQuery += ` AND "assignedTo" = $${paramIndex}`;
      queryParams.push(parseInt(userId as string));
      paramIndex++;
    }

    const casesResult = await pool.query(casesQuery, queryParams);
    const filteredCases = casesResult.rows;

    // Calculate case statistics
    const totalCases = filteredCases.length;
    const pendingCases = filteredCases.filter(c => c.status === 'PENDING').length;
    const inProgressCases = filteredCases.filter(c => c.status === 'IN_PROGRESS').length;
    const completedCases = filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const rejectedCases = filteredCases.filter(c => c.status === 'REJECTED').length;

    // Get additional statistics from database
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM clients WHERE "isActive" = true) as "totalClients",
        (SELECT COUNT(*) FROM users WHERE "isActive" = true) as "activeUsers",
        (SELECT COUNT(*) FROM users) as "totalUsers"
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    const dashboardData = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalCases,
        pendingCases,
        inProgressCases,
        completedCases,
        rejectedCases,
        completionRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
        totalClients: parseInt(stats.totalClients) || 0,
        activeUsers: parseInt(stats.activeUsers) || 0,
        totalUsers: parseInt(stats.totalUsers) || 0,
      },
    };

    logger.info('Dashboard data retrieved', {
      userId: req.user?.id,
      period,
      totalCases,
    });

    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/charts - Get chart data for dashboard
export const getChartData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get case status distribution from database
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM cases
      GROUP BY status
    `;
    const statusResult = await pool.query(statusQuery);
    const statusDistribution = statusResult.rows.reduce((acc: any, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Get case priority distribution from database
    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM cases
      GROUP BY priority
    `;
    const priorityResult = await pool.query(priorityQuery);
    const priorityDistribution = priorityResult.rows.reduce((acc: any, row) => {
      acc[row.priority] = parseInt(row.count);
      return acc;
    }, {});

    // Get user performance from database
    const userPerformanceQuery = `
      SELECT
        u.name,
        u.id,
        COUNT(c."caseId") as "totalCases",
        COUNT(CASE WHEN c.status = 'COMPLETED' THEN 1 END) as "completedCases",
        COUNT(CASE WHEN c.status = 'APPROVED' THEN 1 END) as "approvedCases"
      FROM users u
      LEFT JOIN cases c ON u.id = c."assignedTo"
      WHERE u."isActive" = true
      GROUP BY u.id, u.name
      ORDER BY "totalCases" DESC
      LIMIT 10
    `;
    const userPerformanceResult = await pool.query(userPerformanceQuery);
    const userPerformance = userPerformanceResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      totalCases: parseInt(user.totalCases) || 0,
      completedCases: parseInt(user.completedCases) || 0,
      approvedCases: parseInt(user.approvedCases) || 0,
      completionRate: user.totalCases > 0 ?
        Math.round(((parseInt(user.completedCases) + parseInt(user.approvedCases)) / parseInt(user.totalCases)) * 100) : 0,
    }));

    // Get client distribution from database
    const clientQuery = `
      SELECT
        cl.name,
        cl.id,
        COUNT(c."caseId") as "caseCount"
      FROM clients cl
      LEFT JOIN cases c ON cl.id = c."clientId"
      WHERE cl."isActive" = true
      GROUP BY cl.id, cl.name
      ORDER BY "caseCount" DESC
      LIMIT 10
    `;
    const clientResult = await pool.query(clientQuery);
    const clientDistribution = clientResult.rows.map(client => ({
      id: client.id,
      name: client.name,
      caseCount: parseInt(client.caseCount) || 0,
    }));

    logger.info('Chart data retrieved', {
      userId: req.user?.id,
      statusTypes: Object.keys(statusDistribution).length,
      userCount: userPerformance.length,
    });

    res.json({
      success: true,
      data: {
        statusDistribution,
        priorityDistribution,
        userPerformance,
        clientDistribution,
      },
      message: 'Chart data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chart data',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/recent-activities - Get recent activities
export const getRecentActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get recent cases as activities from database
    const recentCasesQuery = `
      SELECT
        c."caseId" as id,
        'CASE_UPDATED' as type,
        CONCAT('Case ', c."caseId", ' - ', c."customerName") as description,
        c."assignedTo" as "userId",
        c."updatedAt" as timestamp,
        u.name as "userName"
      FROM cases c
      LEFT JOIN users u ON c."assignedTo" = u.id
      ORDER BY c."updatedAt" DESC
      LIMIT 10
    `;

    const result = await pool.query(recentCasesQuery);
    const activities = result.rows.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      userId: activity.userId,
      timestamp: activity.timestamp,
      user: activity.userName ? { name: activity.userName } : null,
    }));

    logger.info('Recent activities retrieved', {
      userId: req.user?.id,
      activityCount: activities.length,
    });

    res.json({
      success: true,
      data: activities,
      message: 'Recent activities retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activities',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/performance - Get performance metrics
export const getPerformanceMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get overall performance metrics from database
    const metricsQuery = `
      SELECT
        COUNT(*) as "totalCases",
        COUNT(CASE WHEN status = 'COMPLETED' OR status = 'APPROVED' THEN 1 END) as "completedCases",
        AVG(CASE
          WHEN "completedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 86400
        END) as "avgTurnaroundDays"
      FROM cases
    `;

    const result = await pool.query(metricsQuery);
    const metrics = result.rows[0];

    const totalCases = parseInt(metrics.totalCases) || 0;
    const completedCases = parseInt(metrics.completedCases) || 0;
    const avgTurnaroundDays = parseFloat(metrics.avgTurnaroundDays) || 0;

    // Get user-specific metrics
    const userMetricsQuery = `
      SELECT
        u.name,
        u.id,
        COUNT(c."caseId") as "assignedCases",
        COUNT(CASE WHEN c.status = 'COMPLETED' OR c.status = 'APPROVED' THEN 1 END) as "completedCases",
        AVG(CASE
          WHEN c."completedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (c."completedAt" - c."createdAt")) / 86400
        END) as "avgTurnaroundDays"
      FROM users u
      LEFT JOIN cases c ON u.id = c."assignedTo"
      WHERE u."isActive" = true
      GROUP BY u.id, u.name
      HAVING COUNT(c."caseId") > 0
      ORDER BY "completedCases" DESC
      LIMIT 10
    `;

    const userResult = await pool.query(userMetricsQuery);
    const userMetrics = userResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      assignedCases: parseInt(user.assignedCases) || 0,
      completedCases: parseInt(user.completedCases) || 0,
      completionRate: user.assignedCases > 0 ?
        Math.round((parseInt(user.completedCases) / parseInt(user.assignedCases)) * 100) : 0,
      avgTurnaroundDays: parseFloat(user.avgTurnaroundDays) || 0,
    }));

    logger.info('Performance metrics retrieved', {
      userId: req.user?.id,
      totalCases,
      completionRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
    });

    res.json({
      success: true,
      data: {
        overall: {
          totalCases,
          completedCases,
          completionRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
          avgTurnaroundDays: Math.round(avgTurnaroundDays * 100) / 100,
        },
        userMetrics,
      },
      message: 'Performance metrics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};