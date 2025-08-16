import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import DeviceAuthLogger from '@/services/deviceAuthLogger';
import { recordDeviceAuthFailure, recordDeviceAuthSuccess } from '@/middleware/deviceAuthRateLimit';
import {
  LoginRequest,
  LoginResponse,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  JwtPayload,
  RefreshTokenPayload,
  Role
} from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, deviceId }: LoginRequest = req.body;

    // Find user by username
    const userRes = await query(
      `SELECT id, name, username, email, "passwordHash", role, "employeeId", designation, department, "profilePhotoUrl", "deviceId"
       FROM users WHERE username = $1`,
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      logger.warn('Login failed: User not found', { username });
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn('Login failed: Invalid password', { username });
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Device authentication for field agents
    const deviceAuthLogger = DeviceAuthLogger.getInstance();
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (user.role === 'FIELD' || user.role === 'FIELD_AGENT') {
      if (!deviceId) {
        logger.warn('Login failed: Device ID required for field agent', { username, role: user.role });

        // Log device authentication failure
        await deviceAuthLogger.logDeviceAuthFailure(
          username,
          'none',
          'DEVICE_ID_REQUIRED',
          'Device ID is required for field agents',
          clientIp,
          userAgent
        );

        // Record rate limit failure
        recordDeviceAuthFailure(req, username);

        throw createError('Device ID is required for field agents', 400, 'DEVICE_ID_REQUIRED');
      }

      if (!user.deviceId) {
        logger.warn('Login failed: No device registered for field agent', { username, role: user.role });

        // Log device authentication failure
        await deviceAuthLogger.logDeviceAuthFailure(
          username,
          deviceId,
          'NO_DEVICE_REGISTERED',
          'No device registered for this field agent',
          clientIp,
          userAgent
        );

        // Record rate limit failure
        recordDeviceAuthFailure(req, username);

        throw createError('No device registered for this field agent. Please contact administrator.', 403, 'NO_DEVICE_REGISTERED');
      }

      if (user.deviceId !== deviceId) {
        logger.warn('Login failed: Device ID mismatch', {
          username,
          role: user.role,
          registeredDeviceId: user.deviceId,
          providedDeviceId: deviceId
        });

        // Log device authentication failure
        await deviceAuthLogger.logDeviceAuthFailure(
          username,
          deviceId,
          'DEVICE_NOT_AUTHORIZED',
          'Device not authorized - device ID mismatch',
          clientIp,
          userAgent
        );

        // Record rate limit failure
        recordDeviceAuthFailure(req, username);

        throw createError('Device not authorized. Please use your registered device or contact administrator.', 403, 'DEVICE_NOT_AUTHORIZED');
      }

      logger.info('Field agent device authentication successful', {
        username,
        role: user.role,
        deviceId
      });

      // Log successful device authentication
      await deviceAuthLogger.logDeviceAuthSuccess(
        user.id,
        username,
        deviceId,
        clientIp,
        userAgent
      );

      // Record successful authentication for rate limiting
      recordDeviceAuthSuccess(req, username);
    }

    // Generate tokens
    const accessTokenPayload: any = {
      userId: user.id,
      username: user.username,
      role: user.role,
      ...(deviceId && { deviceId }),
    };

    const refreshTokenPayload: any = {
      userId: user.id,
      ...(deviceId && { deviceId }),
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwtSecret as any, {
      expiresIn: '24h',
    } as any);

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwtRefreshSecret as any, {
      expiresIn: '7d',
    } as any);

    // Update user's lastLogin timestamp
    await query(
      `UPDATE users SET "lastLogin" = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // Log successful login
    await query(
      `INSERT INTO audit_logs (id, "userId", action, "entityType", "newValues", "ipAddress", "userAgent", "createdAt")
       VALUES (gen_random_uuid(), $1, 'LOGIN', 'USER', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [user.id, JSON.stringify({ deviceId }), req.ip, req.get('User-Agent')]
    );

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          designation: user.designation,
          department: user.department,
          ...(user.profilePhotoUrl && { profilePhotoUrl: user.profilePhotoUrl }),
        } as any,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    };

    logger.info(`User ${user.username} logged in successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Log logout
    await query(
      `INSERT INTO audit_logs (id, "userId", action, "entityType", "newValues", "ipAddress", "userAgent", "createdAt")
       VALUES (gen_random_uuid(), $1, 'LOGOUT', 'USER', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [req.user.id, JSON.stringify({ deviceId: req.user.deviceId }), req.ip, req.get('User-Agent')]
    );

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    logger.info(`User ${req.user.username} logged out successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, platform, model, osVersion, appVersion }: DeviceRegistrationRequest = req.body;

    // Upsert device
    await query(
      `INSERT INTO devices (id, "deviceId", platform, model, "osVersion", "appVersion", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT ("deviceId") DO UPDATE SET platform = EXCLUDED.platform, model = EXCLUDED.model, "osVersion" = EXCLUDED."osVersion", "appVersion" = EXCLUDED."appVersion", "updatedAt" = CURRENT_TIMESTAMP`,
      [deviceId, platform, model, osVersion, appVersion]
    );

    const response: DeviceRegistrationResponse = {
      success: true,
      message: 'Device registration successful',
      data: {
        deviceId,
        registeredAt: new Date().toISOString(),
      },
    };

    logger.info(`Device ${deviceId} registered/updated successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};

// Get current user information
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: { code: 'UNAUTHORIZED' }
      });
      return;
    }

    // Get user details with role and department information
    const userQuery = `
      SELECT
        u.id,
        u.name,
        u.username,
        u.email,
        u.role,
        u."roleId",
        u."departmentId",
        u."employeeId",
        u.designation,
        u.department,
        u."profilePhotoUrl",
        u."deviceId",
        u."isActive",
        u."lastLogin",
        u."createdAt",
        r.name as "roleName",
        r.permissions as "rolePermissions",
        d.name as "departmentName"
      FROM users u
      LEFT JOIN roles r ON u."roleId" = r.id
      LEFT JOIN departments d ON u."departmentId" = d.id
      WHERE u.id = $1
    `;

    const result = await query(userQuery, [req.user.id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND' }
      });
      return;
    }

    const userData = result.rows[0];

    const response: ApiResponse<any> = {
      success: true,
      message: 'User information retrieved successfully',
      data: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        roleId: userData.roleId,
        roleName: userData.roleName,
        permissions: userData.rolePermissions,
        departmentId: userData.departmentId,
        departmentName: userData.departmentName,
        employeeId: userData.employeeId,
        designation: userData.designation,
        department: userData.department, // Legacy field
        profilePhotoUrl: userData.profilePhotoUrl,
        deviceId: userData.deviceId,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};
