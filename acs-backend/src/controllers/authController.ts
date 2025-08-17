import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { createAuditLog } from '@/utils/auditLogger';
import {
  LoginRequest,
  LoginResponse,
  FieldAgentUuidLoginRequest,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  JwtPayload,
  RefreshTokenPayload,
  Role
} from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, deviceId, macAddress }: LoginRequest = req.body;

    // Find user by username (with roleId to check SUPER_ADMIN from roles table)
    const userRes = await query(
      `SELECT u.id, u.name, u.username, u.email, u."passwordHash", u.role, u."roleId", u."employeeId", u.designation, u.department, u."profilePhotoUrl",
              r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u.username = $1`,
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      await createAuditLog({
        action: 'WEB_LOGIN_FAILED',
        entityType: 'USER',
        entityId: username,
        details: { reason: 'USER_NOT_FOUND' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || undefined,
      });
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await createAuditLog({
        action: 'WEB_LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: { reason: 'INVALID_PASSWORD' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || undefined,
      });
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.roleName === 'SUPER_ADMIN';

    // Role-specific checks (skip for SUPER_ADMIN)
    if (!isSuperAdmin) {
      if (user.role === 'FIELD' || user.roleName === 'FIELD_AGENT' || user.roleName === 'FIELD') {
        // FIELD agent: require deviceId and ensure registered & approved
        if (!deviceId) {
          await createAuditLog({
            action: 'WEB_LOGIN_FAILED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            details: { reason: 'MISSING_DEVICE_ID' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || undefined,
          });
          throw createError('Device ID is required for field agents', 400, 'MISSING_DEVICE_ID');
        }
        const devRes = await query(
          `SELECT id, "isApproved" FROM devices WHERE "userId" = $1 AND "deviceId" = $2 LIMIT 1`,
          [user.id, deviceId]
        );
        const device = devRes.rows[0];
        if (!device || !device.isApproved) {
          await createAuditLog({
            action: 'WEB_LOGIN_FAILED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            details: { reason: !device ? 'DEVICE_NOT_REGISTERED' : 'DEVICE_NOT_APPROVED', deviceId },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || undefined,
          });
          throw createError(
            !device
              ? 'Device is not registered. Please register your device and request approval.'
              : 'Device is pending approval. Please contact your administrator.',
            403,
            !device ? 'DEVICE_NOT_REGISTERED' : 'DEVICE_NOT_APPROVED'
          );
        }
      } else {
        // Non-field web login: require MAC address whitelisting
        const normalizeMac = (m: string) => m.toLowerCase().replace(/[^a-f0-9]/g, '');
        if (!macAddress) {
          await createAuditLog({
            action: 'WEB_LOGIN_FAILED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            details: { reason: 'MISSING_MAC' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || undefined,
          });
          throw createError('MAC address is required for web login', 400, 'MISSING_MAC');
        }
        const norm = normalizeMac(macAddress);
        const macRes = await query(
          `SELECT id FROM "macAddresses" WHERE "userId" = $1 AND REPLACE(LOWER("macAddress"), ':', '') = $2 AND "isApproved" = true LIMIT 1`,
          [user.id, norm]
        );
        if (macRes.rows.length === 0) {
          await createAuditLog({
            action: 'WEB_LOGIN_FAILED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            details: { reason: 'MAC_NOT_WHITELISTED', macAddress },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || undefined,
          });
          throw createError('This MAC address is not registered for your account. Please contact an administrator.', 403, 'MAC_NOT_WHITELISTED');
        }
      }
    }

    // Generate tokens
    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      authMethod: 'PASSWORD', // Mark as password authentication
      ...(deviceId && { deviceId }),
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      authMethod: 'PASSWORD', // Mark as password authentication
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

    // Audit success
    await createAuditLog({
      action: 'WEB_LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: { role: user.role, deviceId: deviceId || null, macAddress: macAddress || null },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || undefined,
    });

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

    res.json(response);
  } catch (error) {
    throw error;
  }
};

// UUID-based authentication for FIELD_AGENT mobile users only
export const fieldAgentUuidLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { authUuid, deviceId, platform, appVersion }: FieldAgentUuidLoginRequest = req.body;

    // Validate required fields
    if (!authUuid || !deviceId) {
      throw createError('authUuid and deviceId are required for field agent authentication', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Find field agent by authUuid - ONLY for FIELD_AGENT role
    const userRes = await query(
      `SELECT u.id, u.name, u.username, u.email, u.role, u."roleId", u."employeeId", u.designation, u.department, u."profilePhotoUrl", u."authUuid",
              r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u."authUuid" = $1 AND r.name = 'FIELD_AGENT'`,
      [authUuid]
    );
    const user = userRes.rows[0];

    if (!user) {
      await createAuditLog({
        action: 'MOBILE_LOGIN_FAILED',
        entityType: 'USER',
        entityId: authUuid,
        details: { reason: 'INVALID_AUTH_UUID', deviceId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || undefined,
      });
      throw createError('Invalid authentication UUID', 401, 'INVALID_AUTH_UUID');
    }

    // Verify this is indeed a FIELD_AGENT
    if (user.roleName !== 'FIELD_AGENT') {
      await createAuditLog({
        action: 'MOBILE_LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        details: { reason: 'UNAUTHORIZED_ROLE', role: user.roleName, deviceId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || undefined,
      });
      throw createError('UUID authentication not allowed for this user role', 403, 'UNAUTHORIZED_ROLE');
    }

    // Register/update device information
    if (platform && appVersion) {
      await query(
        `INSERT INTO devices ("deviceId", "userId", platform, model, "osVersion", "appVersion", "isActive", "isApproved", "registeredAt", "createdAt")
         VALUES ($1, $2, $3, 'Mobile Device', 'Unknown', $4, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("deviceId") DO UPDATE SET
           platform = EXCLUDED.platform,
           "appVersion" = EXCLUDED."appVersion",
           "lastActiveAt" = CURRENT_TIMESTAMP,
           "updatedAt" = CURRENT_TIMESTAMP`,
        [deviceId, user.id, platform, appVersion]
      );
    }

    // Generate JWT tokens
    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      deviceId,
      authMethod: 'UUID', // Mark this as UUID authentication
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      deviceId,
      authMethod: 'UUID',
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

    // Audit success
    await createAuditLog({
      action: 'MOBILE_LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      details: { authMethod: 'UUID', deviceId, platform, appVersion },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || undefined,
    });

    const response: LoginResponse = {
      success: true,
      message: 'Field agent authentication successful',
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
          deviceId,
          ...(user.profilePhotoUrl && { profilePhotoUrl: user.profilePhotoUrl }),
        } as any,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    };

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
      `INSERT INTO "auditLogs" ("userId", action, "entityType", "newValues", "ipAddress", "userAgent", "createdAt")
       VALUES ($1, 'LOGOUT', 'USER', $2, $3, $4, CURRENT_TIMESTAMP)`,
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
      `INSERT INTO devices ("deviceId", platform, model, "osVersion", "appVersion", "createdAt")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
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

// Pre-login info to enable dynamic login form (public)
export const preloginInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body as { username?: string };
    if (!username) {
      res.status(400).json({ success: false, message: 'Username is required', error: { code: 'MISSING_USERNAME' } });
      return;
    }

    const userRes = await query(
      `SELECT u.id, u.role, u."roleId", r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u.username = $1
       LIMIT 1`,
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      // Unknown user: return neutral flags (frontend can show both fields)
      res.json({ success: true, message: 'OK', data: { unknown: true, requiresDeviceId: false, requiresMacAddress: false } });
      return;
    }

    const isSuper = user.role === 'SUPER_ADMIN' || user.roleName === 'SUPER_ADMIN';
    const isField = user.role === 'FIELD' || user.roleName === 'FIELD' || user.roleName === 'FIELD_AGENT';

    res.json({
      success: true,
      message: 'OK',
      data: {
        role: user.role,
        roleName: user.roleName,
        requiresDeviceId: !isSuper && isField,
        requiresMacAddress: !isSuper && !isField,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal error', error: { code: 'INTERNAL_ERROR' } });
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
