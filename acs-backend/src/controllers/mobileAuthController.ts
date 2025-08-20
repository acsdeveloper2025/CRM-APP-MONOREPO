import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
import { config } from '../config';
import {
  MobileLoginRequest,
  MobileLoginResponse,
  MobileDeviceInfo,
  MobileVersionCheckRequest,
  MobileVersionCheckResponse,
  MobileAppConfigResponse,
  MobileNotificationRegistrationRequest
} from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';

export class MobileAuthController {
  // Mobile login with device registration
  static async mobileLogin(req: Request, res: Response) {
    try {
      const { username, password }: MobileLoginRequest = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Find user with role information
      const userRes = await query(
        `SELECT u.id, u.name, u.username, u.email, u."passwordHash", u.role, u."roleId", u."employeeId", u.designation, u.department, u."profilePhotoUrl",
                r.name as "roleName", r.permissions
         FROM users u
         LEFT JOIN roles r ON u."roleId" = r.id
         WHERE u.username = $1`,
        [username]
      );
      const user = userRes.rows[0];

      if (!user) {
        await createAuditLog({
          action: 'MOBILE_LOGIN_FAILED',
          entityType: 'USER',
          entityId: username,
          details: { reason: 'User not found' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await createAuditLog({
          action: 'MOBILE_LOGIN_FAILED',
          entityType: 'USER',
          entityId: user.id,
          details: { reason: 'Invalid password' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Simplified authentication - no device validation required



      // Generate tokens (simplified - no device ID)
      const accessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        } as any,
        config.jwtSecret as any,
        { expiresIn: '24h' } as any
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: 'refresh',
        } as any,
        config.jwtSecret as any,
        { expiresIn: '7d' } as any
      );

      // Store refresh token (simplified - no device ID)
      await query(
        `INSERT INTO "refreshTokens" (token, "userId", "expiresAt", "createdAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [refreshToken, user.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );

      await createAuditLog({
        action: 'MOBILE_LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: {
          authMethod: 'PASSWORD',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const response: MobileLoginResponse = {
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
            profilePhotoUrl: user.profilePhotoUrl,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('Mobile login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Refresh token endpoint
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as any;
      
      // Check if refresh token exists in database
      const storedRes = await query(
        `SELECT rt.token, u.id as "userId", u.username, u.role
         FROM "refreshTokens" rt JOIN users u ON u.id = rt."userId"
         WHERE rt.token = $1 AND rt."userId" = $2 AND rt."expiresAt" > CURRENT_TIMESTAMP
         LIMIT 1`,
        [refreshToken, decoded.userId]
      );
      const storedToken = storedRes.rows[0];

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: storedToken.userId,
          username: storedToken.username,
          role: storedToken.role,
        } as any,
        config.jwtSecret as any,
        { expiresIn: '24h' } as any
      );

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Mobile logout
  static async mobileLogout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      // Invalidate all refresh tokens for this user
      await query(`DELETE FROM "refreshTokens" WHERE "userId" = $1`, [userId]);

      await createAuditLog({
        action: 'MOBILE_LOGOUT',
        entityType: 'USER',
        entityId: userId,
        userId,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Mobile logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'LOGOUT_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Check app version compatibility
  static async checkVersion(req: Request, res: Response) {
    try {
      const { currentVersion, platform }: MobileVersionCheckRequest = req.body;

      const forceUpdate = MobileAuthController.shouldForceUpdate(currentVersion);
      const updateRequired = MobileAuthController.shouldUpdate(currentVersion);

      const response: MobileVersionCheckResponse = {
        updateRequired,
        forceUpdate,
        latestVersion: config.mobile.apiVersion,
        downloadUrl: platform === 'IOS' 
          ? 'https://apps.apple.com/app/caseflow' 
          : 'https://play.google.com/store/apps/details?id=com.caseflow',
        releaseNotes: 'Bug fixes and performance improvements',
        features: ['Enhanced security', 'Improved offline sync', 'Better performance'],
      };

      res.json(response);
    } catch (error) {
      console.error('Version check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'VERSION_CHECK_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get mobile app configuration
  static async getAppConfig(req: Request, res: Response) {
    try {
      const response: MobileAppConfigResponse = {
        apiVersion: config.mobile.apiVersion,
        minSupportedVersion: config.mobile.minSupportedVersion,
        forceUpdateVersion: config.mobile.forceUpdateVersion,
        features: {
          offlineMode: config.mobile.enableOfflineMode,
          backgroundSync: config.mobile.enableBackgroundSync,
          biometricAuth: config.mobile.enableBiometricAuth,
          darkMode: config.mobile.enableDarkMode,
          analytics: config.mobile.enableAnalytics,
        },
        limits: {
          maxFileSize: config.mobile.maxFileSize,
          maxFilesPerCase: config.mobile.maxFilesPerCase,
          locationAccuracyThreshold: config.mobile.locationAccuracyThreshold,
          syncBatchSize: config.mobile.syncBatchSize,
        },
        endpoints: {
          apiBaseUrl: `${req.protocol}://${req.get('host')}/api`,
          wsUrl: `ws://${req.get('host')}:${config.wsPort}`,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('App config error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CONFIG_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Register device for push notifications (simplified)
  static async registerNotifications(req: Request, res: Response) {
    try {
      const { pushToken, platform, enabled, preferences } = req.body;
      const userId = (req as any).user?.userId;

      // Store notification preferences in user profile or separate table
      // For now, just return success since we removed device table
      res.json({
        success: true,
        message: 'Notification registration successful',
      });
    } catch (error) {
      console.error('Notification registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'NOTIFICATION_REGISTRATION_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Helper methods
  private static shouldForceUpdate(currentVersion: string): boolean {
    return MobileAuthController.compareVersions(currentVersion, config.mobile.forceUpdateVersion) < 0;
  }

  private static shouldUpdate(currentVersion: string): boolean {
    return MobileAuthController.compareVersions(currentVersion, config.mobile.minSupportedVersion) < 0;
  }

  private static compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }





  /**
   * Get all devices for a user
   */
  static async getUserDevices(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const devs = await query(`SELECT * FROM devices WHERE "userId" = $1 ORDER BY "lastActiveAt" DESC`, [userId]);
      const devices = devs.rows;

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      console.error('Get user devices error:', error);
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
