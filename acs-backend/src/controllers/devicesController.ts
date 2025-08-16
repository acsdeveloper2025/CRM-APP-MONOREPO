import { Request, Response } from 'express';
import { query } from '@/config/database';
import { createAuditLog } from '../utils/auditLogger';

export class DevicesController {
  /**
   * Get all devices with user information (admin only)
   */
  static async getAllDevices(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, platform, userId } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND d."isApproved" = $${paramIndex}`;
        params.push(status === 'approved');
        paramIndex++;
      }

      if (platform) {
        whereClause += ` AND d.platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }

      if (userId) {
        whereClause += ` AND d."userId" = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      const devicesRes = await query(
        `SELECT 
          d.id,
          d."deviceId",
          d."userId",
          d.platform,
          d.model,
          d."osVersion",
          d."appVersion",
          d."isActive",
          d."isApproved",
          d."authCode",
          d."authCodeExpiresAt",
          d."registeredAt",
          d."lastActiveAt",
          u.name as "userName",
          u.username,
          u.email,
          u."employeeId",
          r.name as "roleName"
         FROM devices d
         LEFT JOIN users u ON d."userId" = u.id
         LEFT JOIN roles r ON u."roleId" = r.id
         ${whereClause}
         ORDER BY d."registeredAt" DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, Number(limit), offset]
      );

      const countRes = await query(
        `SELECT COUNT(*)::int as total
         FROM devices d
         LEFT JOIN users u ON d."userId" = u.id
         ${whereClause}`,
        params
      );

      const total = countRes.rows[0]?.total || 0;
      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          devices: devicesRes.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get pending devices (requiring approval)
   */
  static async getPendingDevices(req: Request, res: Response) {
    try {
      const pendingRes = await query(
        `SELECT 
          d.id,
          d."deviceId",
          d."userId",
          d.platform,
          d.model,
          d."osVersion",
          d."appVersion",
          d."authCode",
          d."authCodeExpiresAt",
          d."registeredAt",
          u.name as "userName",
          u.username,
          u.email,
          u."employeeId",
          r.name as "roleName"
         FROM devices d
         LEFT JOIN users u ON d."userId" = u.id
         LEFT JOIN roles r ON u."roleId" = r.id
         WHERE d."isApproved" = false AND d."isActive" = true
         ORDER BY d."registeredAt" ASC`
      );

      res.json({
        success: true,
        data: {
          devices: pendingRes.rows,
          count: pendingRes.rows.length,
        },
      });
    } catch (error) {
      console.error('Error fetching pending devices:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Approve a device
   */
  static async approveDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const adminUserId = (req as any).user?.userId;

      // Get device details
      const deviceRes = await query(
        `SELECT d.*, u.name as "userName", u.username 
         FROM devices d
         LEFT JOIN users u ON d."userId" = u.id
         WHERE d.id = $1`,
        [deviceId]
      );

      const device = deviceRes.rows[0];
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: {
            code: 'DEVICE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (device.isApproved) {
        return res.status(400).json({
          success: false,
          message: 'Device is already approved',
          error: {
            code: 'DEVICE_ALREADY_APPROVED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Approve the device
      await query(
        `UPDATE devices 
         SET "isApproved" = true, "authCode" = NULL, "authCodeExpiresAt" = NULL, "approvedAt" = CURRENT_TIMESTAMP, "approvedBy" = $1
         WHERE id = $2`,
        [adminUserId, deviceId]
      );

      // Log the approval
      await createAuditLog({
        action: 'DEVICE_APPROVED',
        entityType: 'DEVICE',
        entityId: deviceId,
        userId: adminUserId,
        details: {
          deviceId: device.deviceId,
          userName: device.userName,
          username: device.username,
          platform: device.platform,
          model: device.model,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Device approved successfully',
        data: {
          deviceId: device.deviceId,
          userName: device.userName,
          username: device.username,
        },
      });
    } catch (error) {
      console.error('Error approving device:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Reject/Revoke a device
   */
  static async rejectDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { reason } = req.body;
      const adminUserId = (req as any).user?.userId;

      // Get device details
      const deviceRes = await query(
        `SELECT d.*, u.name as "userName", u.username 
         FROM devices d
         LEFT JOIN users u ON d."userId" = u.id
         WHERE d.id = $1`,
        [deviceId]
      );

      const device = deviceRes.rows[0];
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: {
            code: 'DEVICE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Deactivate the device
      await query(
        `UPDATE devices 
         SET "isActive" = false, "isApproved" = false, "rejectedAt" = CURRENT_TIMESTAMP, "rejectedBy" = $1, "rejectionReason" = $2
         WHERE id = $3`,
        [adminUserId, reason || 'No reason provided', deviceId]
      );

      // Log the rejection
      await createAuditLog({
        action: 'DEVICE_REJECTED',
        entityType: 'DEVICE',
        entityId: deviceId,
        userId: adminUserId,
        details: {
          deviceId: device.deviceId,
          userName: device.userName,
          username: device.username,
          platform: device.platform,
          model: device.model,
          reason: reason || 'No reason provided',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Device rejected successfully',
        data: {
          deviceId: device.deviceId,
          userName: device.userName,
          username: device.username,
          reason: reason || 'No reason provided',
        },
      });
    } catch (error) {
      console.error('Error rejecting device:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
