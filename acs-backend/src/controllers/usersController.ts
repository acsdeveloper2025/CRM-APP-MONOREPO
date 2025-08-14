import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '@/config/database';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import type { Role } from '@/types/auth';
import DeviceAuthLogger from '@/services/deviceAuthLogger';

// GET /api/users - List users with pagination and filters
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      department, 
      isActive, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    // Build the WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }

    if (department) {
      conditions.push(`d.name ILIKE $${paramIndex++}`);
      params.push(`%${department}%`);
    }

    if (isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIndex++}`);
      params.push(isActive === 'true');
    }

    if (search) {
      conditions.push(`(
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        u.username ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['name', 'username', 'email', 'role', 'created_at', 'updated_at'];
    const safeSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'name';
    const safeSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (Number(page) - 1) * Number(limit);
    const usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.role_id,
        u.department_id,
        u."employeeId",
        u.designation,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(Number(limit), offset);
    const usersResult = await query(usersQuery, params);

    logger.info(`Retrieved ${usersResult.rows.length} users`, { 
      userId: req.user?.id,
      filters: { role, department, isActive, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/:id - Get user by ID
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const userQuery = `
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.role_id,
        u.department_id,
        u."employeeId",
        u.designation,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        r.description as role_description,
        r.permissions as role_permissions,
        d.name as department_name,
        d.description as department_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `;
    
    const result = await query(userQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users - Create new user
export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      username,
      email,
      password,
      role_id,
      department_id,
      employeeId,
      designation,
      phone,
      device_id,
      isActive = true,
      // Legacy fields for backward compatibility
      role,
      department
    } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, email, and password are required',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    if (!role_id && !role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate device_id for field agents
    if (role === 'FIELD' || role === 'FIELD_AGENT') {
      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required for field agents',
          error: { code: 'VALIDATION_ERROR' },
        });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(device_id)) {
        return res.status(400).json({
          success: false,
          message: 'Device ID must be a valid UUID format',
          error: { code: 'VALIDATION_ERROR' },
        });
      }

      // Check if device_id is already in use
      const existingDeviceQuery = `
        SELECT id, username FROM users
        WHERE device_id = $1
      `;
      const existingDevice = await query(existingDeviceQuery, [device_id]);

      if (existingDevice.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Device ID is already registered to user: ${existingDevice.rows[0].username}`,
          error: { code: 'DEVICE_ALREADY_REGISTERED' },
        });
      }
    } else if (device_id) {
      // Non-field agents should not have device_id
      return res.status(400).json({
        success: false,
        message: 'Device ID can only be set for field agents',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check if username or email already exists
    const existingUserQuery = `
      SELECT id FROM users 
      WHERE username = $1 OR email = $2
    `;
    const existingUser = await query(existingUserQuery, [username, email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
        error: { code: 'DUPLICATE_USER' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const createUserQuery = `
      INSERT INTO users (
        name, username, email, password, "passwordHash", role, role_id, department_id,
        "employeeId", designation, phone, device_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, username, email, role, role_id, department_id,
                "employeeId", designation, phone, device_id, is_active, created_at, updated_at
    `;

    const result = await query(createUserQuery, [
      name,
      username,
      email,
      hashedPassword, // password column
      hashedPassword, // passwordHash column
      role || 'USER', // Default role for backward compatibility
      role_id || null,
      department_id || null,
      employeeId || null,
      designation || null,
      phone || null,
      device_id || null,
      isActive
    ]);

    const newUser = result.rows[0];

    logger.info(`Created new user: ${newUser.id}`, { 
      userId: req.user?.id,
      newUserEmail: email,
      newUserRole: role
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/users/:id - Update user
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const userExistsQuery = `SELECT id FROM users WHERE id = $1`;
    const userExists = await query(userExistsQuery, [id]);

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate username/email if being updated
    if (updateData.username || updateData.email) {
      const duplicateQuery = `
        SELECT id FROM users
        WHERE id != $1 AND (username = $2 OR email = $3)
      `;
      const duplicate = await query(duplicateQuery, [id, updateData.username, updateData.email]);

      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists',
          error: { code: 'DUPLICATE_USER' },
        });
      }
    }

    // Validate device_id if being updated
    if (updateData.device_id !== undefined) {
      // Get current user data to check role
      const currentUserQuery = `SELECT role, device_id FROM users WHERE id = $1`;
      const currentUser = await query(currentUserQuery, [id]);
      const userRole = updateData.role || currentUser.rows[0]?.role;

      if (userRole === 'FIELD' || userRole === 'FIELD_AGENT') {
        if (updateData.device_id) {
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(updateData.device_id)) {
            return res.status(400).json({
              success: false,
              message: 'Device ID must be a valid UUID format',
              error: { code: 'VALIDATION_ERROR' },
            });
          }

          // Check if device_id is already in use by another user
          const existingDeviceQuery = `
            SELECT id, username FROM users
            WHERE device_id = $1 AND id != $2
          `;
          const existingDevice = await query(existingDeviceQuery, [updateData.device_id, id]);

          if (existingDevice.rows.length > 0) {
            return res.status(400).json({
              success: false,
              message: `Device ID is already registered to user: ${existingDevice.rows[0].username}`,
              error: { code: 'DEVICE_ALREADY_REGISTERED' },
            });
          }
        }
      } else if (updateData.device_id) {
        // Non-field agents should not have device_id
        return res.status(400).json({
          success: false,
          message: 'Device ID can only be set for field agents',
          error: { code: 'VALIDATION_ERROR' },
        });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'username', 'email', 'phone', 'role', 'role_id', 'department_id', 'employeeId', 'designation', 'device_id', 'is_active'];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field === 'employeeId' ? '"employeeId"' : field} = $${paramIndex++}`);
        updateParams.push(updateData[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, username, email, role, role_id, department_id,
                "employeeId", designation, phone, device_id, is_active, created_at, updated_at
    `;

    // Get current user data before update for logging
    const currentUserQuery = `SELECT username, device_id FROM users WHERE id = $1`;
    const currentUserResult = await query(currentUserQuery, [id]);
    const currentUser = currentUserResult.rows[0];

    const result = await query(updateQuery, updateParams);
    const updatedUser = result.rows[0];

    // Log device management changes
    if (updateData.device_id !== undefined && currentUser) {
      const deviceAuthLogger = DeviceAuthLogger.getInstance();
      const oldDeviceId = currentUser.device_id;
      const newDeviceId = updateData.device_id;

      if (oldDeviceId && !newDeviceId) {
        // Device reset
        await deviceAuthLogger.logDeviceReset(
          id,
          currentUser.username,
          oldDeviceId,
          req.user?.id || 'unknown',
          req.user?.username || 'unknown'
        );
      } else if (!oldDeviceId && newDeviceId) {
        // Device registration
        await deviceAuthLogger.logDeviceRegistration(
          id,
          currentUser.username,
          newDeviceId,
          req.user?.id || 'unknown',
          req.user?.username || 'unknown'
        );
      } else if (oldDeviceId && newDeviceId && oldDeviceId !== newDeviceId) {
        // Device update
        await deviceAuthLogger.logDeviceUpdate(
          id,
          currentUser.username,
          oldDeviceId,
          newDeviceId,
          req.user?.id || 'unknown',
          req.user?.username || 'unknown'
        );
      }
    }

    logger.info(`Updated user: ${id}`, {
      userId: req.user?.id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/users/:id - Delete user
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExistsQuery = `SELECT id, username FROM users WHERE id = $1`;
    const userExists = await query(userExistsQuery, [id]);

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Prevent deletion of admin user
    if (userExists.rows[0].username === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user',
        error: { code: 'FORBIDDEN_OPERATION' },
      });
    }

    // Delete user
    const deleteQuery = `DELETE FROM users WHERE id = $1`;
    await query(deleteQuery, [id]);

    logger.info(`Deleted user: ${id}`, {
      userId: req.user?.id,
      deletedUsername: userExists.rows[0].username
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users/:id/activate - Activate user
export const activateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updateQuery = `
      UPDATE users
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, username, is_active
    `;

    const result = await query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Activated user: ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User activated successfully',
    });
  } catch (error) {
    logger.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users/:id/deactivate - Deactivate user
export const deactivateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updateQuery = `
      UPDATE users
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, username, is_active
    `;

    const result = await query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Deactivated user: ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User deactivated successfully',
    });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/search - Search users
export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: { code: 'MISSING_QUERY' },
      });
    }

    const searchQuery = `
      SELECT
        u.id,
        u.name,
        u.username,
        u.email,
        u.role,
        d.name as department_name,
        u.designation,
        u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE
        u.name ILIKE $1 OR
        u.email ILIKE $1 OR
        u.username ILIKE $1 OR
        d.name ILIKE $1 OR
        u.designation ILIKE $1
      ORDER BY u.name
      LIMIT 50
    `;

    const result = await query(searchQuery, [`%${q}%`]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/stats - Get user statistics
export const getUserStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get basic user counts
    const userCountsQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
      FROM users
    `;
    const userCounts = await query(userCountsQuery);

    // Get users by role
    const roleStatsQuery = `
      SELECT
        COALESCE(r.name, u.role) as role,
        COUNT(*) as count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY COALESCE(r.name, u.role)
      ORDER BY count DESC
    `;
    const roleStats = await query(roleStatsQuery);

    // Get users by department
    const departmentStatsQuery = `
      SELECT
        COALESCE(d.name, 'No Department') as department,
        COUNT(*) as count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      GROUP BY d.name
      ORDER BY count DESC
    `;
    const departmentStats = await query(departmentStatsQuery);

    const stats = userCounts.rows[0];

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.inactive_users),
        usersByRole: roleStats.rows,
        usersByDepartment: departmentStats.rows,
        recentLogins: 0, // TODO: Implement when login tracking is added
      },
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/departments - Get departments for user management
export const getDepartments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const departmentsQuery = `
      SELECT id, name, description
      FROM departments
      WHERE is_active = true
      ORDER BY name
    `;

    const result = await query(departmentsQuery);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/designations - Get designations for user management
export const getDesignations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designationsQuery = `
      SELECT id, name, description
      FROM designations
      WHERE is_active = true
      ORDER BY name
    `;

    const result = await query(designationsQuery);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching designations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designations',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// Placeholder functions for activities and sessions (to be implemented)
export const getUserActivities = async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    message: 'User activities feature coming soon',
  });
};

export const getUserSessions = async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    message: 'User sessions feature coming soon',
  });
};

export const bulkUserOperation = async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Bulk operations feature coming soon',
    error: { code: 'NOT_IMPLEMENTED' },
  });
};
