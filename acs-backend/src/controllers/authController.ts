import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
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
      `SELECT id, name, username, email, "passwordHash", role, "employeeId", designation, department, "profilePhotoUrl"
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

    // Log successful login
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, new_values, ip_address, user_agent, created_at)
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
      `INSERT INTO audit_logs (id, user_id, action, entity_type, new_values, ip_address, user_agent, created_at)
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
        u.role_id,
        u.department_id,
        u."employeeId",
        u.designation,
        u.department,
        u."profilePhotoUrl",
        u.is_active,
        u.last_login,
        u.created_at,
        r.name as role_name,
        r.permissions as role_permissions,
        d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
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
        roleId: userData.role_id,
        roleName: userData.role_name,
        permissions: userData.role_permissions,
        departmentId: userData.department_id,
        departmentName: userData.department_name,
        employeeId: userData.employeeId,
        designation: userData.designation,
        department: userData.department, // Legacy field
        profilePhotoUrl: userData.profilePhotoUrl,
        isActive: userData.is_active,
        lastLogin: userData.last_login,
        createdAt: userData.created_at,
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
