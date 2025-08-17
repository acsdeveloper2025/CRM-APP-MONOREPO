import { query } from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import { createAuditLog } from '@/utils/auditLogger';

/**
 * Utility functions for field agent UUID-based authentication
 * This module handles UUID authentication specifically for FIELD_AGENT role users
 * accessing the CaseFlow mobile application.
 */

export interface FieldAgentAuthInfo {
  id: string;
  username: string;
  name: string;
  authUuid: string;
  isActive: boolean;
}

/**
 * Generate a new authUuid for a field agent
 * Only works for users with FIELD_AGENT role
 */
export const generateFieldAgentAuthUuid = async (
  userId: string,
  adminUserId?: string
): Promise<string> => {
  try {
    // Verify the user is a field agent
    const userRes = await query(
      `SELECT u.id, u.username, u.role, r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.roleName !== 'FIELD_AGENT') {
      throw createError('UUID authentication is only available for field agents', 403, 'INVALID_ROLE');
    }

    // Generate new UUID and update the user
    const newAuthUuid = await query(
      `UPDATE users 
       SET "authUuid" = gen_random_uuid(), "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1 AND "roleId" = (SELECT id FROM roles WHERE name = 'FIELD_AGENT')
       RETURNING "authUuid"`,
      [userId]
    );

    if (newAuthUuid.rows.length === 0) {
      throw createError('Failed to generate auth UUID', 500, 'UUID_GENERATION_FAILED');
    }

    const authUuid = newAuthUuid.rows[0].authUuid;

    // Audit the UUID generation
    await createAuditLog({
      action: 'FIELD_AGENT_UUID_GENERATED',
      entityType: 'USER',
      entityId: userId,
      userId: adminUserId,
      details: { 
        username: user.username,
        generatedBy: adminUserId ? 'ADMIN' : 'SYSTEM'
      },
    });

    return authUuid;
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke authUuid for a field agent (set to null)
 * This effectively disables UUID authentication for the user
 */
export const revokeFieldAgentAuthUuid = async (
  userId: string,
  adminUserId?: string
): Promise<void> => {
  try {
    // Verify the user is a field agent
    const userRes = await query(
      `SELECT u.id, u.username, u.role, r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.roleName !== 'FIELD_AGENT') {
      throw createError('UUID authentication is only available for field agents', 403, 'INVALID_ROLE');
    }

    // Revoke the UUID
    await query(
      `UPDATE users 
       SET "authUuid" = NULL, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1 AND "roleId" = (SELECT id FROM roles WHERE name = 'FIELD_AGENT')`,
      [userId]
    );

    // Audit the UUID revocation
    await createAuditLog({
      action: 'FIELD_AGENT_UUID_REVOKED',
      entityType: 'USER',
      entityId: userId,
      userId: adminUserId,
      details: { 
        username: user.username,
        revokedBy: adminUserId ? 'ADMIN' : 'SYSTEM'
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all field agents with their auth UUID status
 */
export const getFieldAgentsAuthStatus = async (): Promise<FieldAgentAuthInfo[]> => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.name, u."authUuid", 
              CASE WHEN u."authUuid" IS NOT NULL THEN true ELSE false END as "isActive"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE r.name = 'FIELD_AGENT'
       ORDER BY u.name`,
      []
    );

    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      authUuid: row.authUuid || '',
      isActive: row.isActive,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Validate if an authUuid belongs to an active field agent
 */
export const validateFieldAgentAuthUuid = async (authUuid: string): Promise<boolean> => {
  try {
    const result = await query(
      `SELECT u.id
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u."authUuid" = $1 AND r.name = 'FIELD_AGENT'`,
      [authUuid]
    );

    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
};
