import { query } from '../config/database';
import { logger } from '../utils/logger';

export interface DeviceAuthEvent {
  userId?: string;
  username?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  eventType: 'DEVICE_REGISTRATION' | 'DEVICE_AUTH_SUCCESS' | 'DEVICE_AUTH_FAILURE' | 'DEVICE_RESET' | 'DEVICE_UPDATE';
  eventDetails: {
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    oldDeviceId?: string;
    newDeviceId?: string;
    adminUserId?: string;
    adminUsername?: string;
  };
  timestamp: Date;
}

class DeviceAuthLogger {
  private static instance: DeviceAuthLogger;

  private constructor() {}

  public static getInstance(): DeviceAuthLogger {
    if (!DeviceAuthLogger.instance) {
      DeviceAuthLogger.instance = new DeviceAuthLogger();
    }
    return DeviceAuthLogger.instance;
  }

  /**
   * Log device authentication events to database and console
   */
  async logDeviceAuthEvent(event: DeviceAuthEvent): Promise<void> {
    try {
      // Log to console with structured format
      const logLevel = event.eventDetails.success ? 'info' : 'warn';
      const logMessage = `Device Auth Event: ${event.eventType} - User: ${event.username || 'Unknown'} - Device: ${event.deviceId || 'None'} - Success: ${event.eventDetails.success}`;
      
      logger[logLevel](logMessage, {
        userId: event.userId,
        username: event.username,
        deviceId: event.deviceId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        eventType: event.eventType,
        eventDetails: event.eventDetails,
        timestamp: event.timestamp
      });

      // Store in database for audit trail
      await this.storeDeviceAuthEvent(event);
    } catch (error) {
      logger.error('Failed to log device auth event:', error);
    }
  }

  /**
   * Store device authentication event in database
   */
  private async storeDeviceAuthEvent(event: DeviceAuthEvent): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO device_auth_logs (
          "userId", username, "deviceId", "ipAddress", "userAgent",
          "eventType", "eventDetails", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await query(insertQuery, [
        event.userId || null,
        event.username || null,
        event.deviceId || null,
        event.ipAddress || null,
        event.userAgent || null,
        event.eventType,
        JSON.stringify(event.eventDetails),
        event.timestamp
      ]);
    } catch (error) {
      // If the table doesn't exist, create it
      if (error.code === '42P01') {
        await this.createDeviceAuthLogsTable();
        // Retry the insert
        await this.storeDeviceAuthEvent(event);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create device_auth_logs table if it doesn't exist
   */
  private async createDeviceAuthLogsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS device_auth_logs (
        id SERIAL PRIMARY KEY,
        "userId" UUID,
        username VARCHAR(255),
        "deviceId" UUID,
        "ipAddress" INET,
        "userAgent" TEXT,
        "eventType" VARCHAR(50) NOT NULL,
        "eventDetails" JSONB NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_device_auth_logs_userId ON device_auth_logs ("userId");
      CREATE INDEX IF NOT EXISTS idx_device_auth_logs_deviceId ON device_auth_logs ("deviceId");
      CREATE INDEX IF NOT EXISTS idx_device_auth_logs_eventType ON device_auth_logs ("eventType");
      CREATE INDEX IF NOT EXISTS idx_device_auth_logs_createdAt ON device_auth_logs ("createdAt");
    `;

    await query(createTableQuery);
    logger.info('Created device_auth_logs table');
  }

  /**
   * Log successful device authentication
   */
  async logDeviceAuthSuccess(
    userId: string,
    username: string,
    deviceId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logDeviceAuthEvent({
      userId,
      username,
      deviceId,
      ipAddress,
      userAgent,
      eventType: 'DEVICE_AUTH_SUCCESS',
      eventDetails: {
        success: true
      },
      timestamp: new Date()
    });
  }

  /**
   * Log failed device authentication
   */
  async logDeviceAuthFailure(
    username: string,
    deviceId: string,
    errorCode: string,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logDeviceAuthEvent({
      username,
      deviceId,
      ipAddress,
      userAgent,
      eventType: 'DEVICE_AUTH_FAILURE',
      eventDetails: {
        success: false,
        errorCode,
        errorMessage
      },
      timestamp: new Date()
    });
  }

  /**
   * Log device registration
   */
  async logDeviceRegistration(
    userId: string,
    username: string,
    deviceId: string,
    adminUserId?: string,
    adminUsername?: string
  ): Promise<void> {
    await this.logDeviceAuthEvent({
      userId,
      username,
      deviceId,
      eventType: 'DEVICE_REGISTRATION',
      eventDetails: {
        success: true,
        adminUserId,
        adminUsername
      },
      timestamp: new Date()
    });
  }

  /**
   * Log device reset
   */
  async logDeviceReset(
    userId: string,
    username: string,
    oldDeviceId: string,
    adminUserId: string,
    adminUsername: string
  ): Promise<void> {
    await this.logDeviceAuthEvent({
      userId,
      username,
      deviceId: oldDeviceId,
      eventType: 'DEVICE_RESET',
      eventDetails: {
        success: true,
        oldDeviceId,
        adminUserId,
        adminUsername
      },
      timestamp: new Date()
    });
  }

  /**
   * Log device update
   */
  async logDeviceUpdate(
    userId: string,
    username: string,
    oldDeviceId: string,
    newDeviceId: string,
    adminUserId: string,
    adminUsername: string
  ): Promise<void> {
    await this.logDeviceAuthEvent({
      userId,
      username,
      deviceId: newDeviceId,
      eventType: 'DEVICE_UPDATE',
      eventDetails: {
        success: true,
        oldDeviceId,
        newDeviceId,
        adminUserId,
        adminUsername
      },
      timestamp: new Date()
    });
  }

  /**
   * Get device authentication logs for a user
   */
  async getDeviceAuthLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const selectQuery = `
        SELECT
          id, "userId", username, "deviceId", "ipAddress", "userAgent",
          "eventType", "eventDetails", "createdAt"
        FROM device_auth_logs
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT $2
      `;

      const result = await query(selectQuery, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get device auth logs:', error);
      return [];
    }
  }

  /**
   * Get device authentication statistics
   */
  async getDeviceAuthStats(days: number = 30): Promise<any> {
    try {
      const statsQuery = `
        SELECT
          "eventType",
          COUNT(*) as count,
          COUNT(CASE WHEN ("eventDetails"->>'success')::boolean = true THEN 1 END) as "successCount",
          COUNT(CASE WHEN ("eventDetails"->>'success')::boolean = false THEN 1 END) as "failureCount"
        FROM device_auth_logs
        WHERE "createdAt" >= NOW() - INTERVAL '${days} days'
        GROUP BY "eventType"
        ORDER BY count DESC
      `;

      const result = await query(statsQuery);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get device auth stats:', error);
      return [];
    }
  }

  /**
   * Clean up old device authentication logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const deleteQuery = `
        DELETE FROM device_auth_logs
        WHERE "createdAt" < NOW() - INTERVAL '${daysToKeep} days'
      `;

      const result = await query(deleteQuery);
      logger.info(`Cleaned up ${result.rowCount} old device auth log entries`);
    } catch (error) {
      logger.error('Failed to cleanup old device auth logs:', error);
    }
  }
}

export default DeviceAuthLogger;
