import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/roles - Get all roles with pagination and filtering
export const getRoles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      includeInactive = 'false',
      systemRolesOnly = 'false'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Active filter
    if (includeInactive !== 'true') {
      paramCount++;
      whereConditions.push(`r.is_active = $${paramCount}`);
      params.push(true);
    }

    // System roles filter
    if (systemRolesOnly === 'true') {
      paramCount++;
      whereConditions.push(`r.is_system_role = $${paramCount}`);
      params.push(true);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get roles with pagination
    const rolesQuery = `
      SELECT 
        r.*,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
      FROM roles r
      LEFT JOIN users u1 ON r.created_by = u1.id
      LEFT JOIN users u2 ON r.updated_by = u2.id
      ${whereClause}
      ORDER BY r.name
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(Number(limit), offset);
    const rolesResult = await query(rolesQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM roles r ${whereClause}`;
    const countResult = await query(countQuery, params.slice(0, paramCount));
    const total = parseInt(countResult.rows[0].total);

    logger.info('Retrieved roles', {
      userId: req.user?.id,
      filters: { search, includeInactive, systemRolesOnly },
      pagination: { page, limit },
      total
    });

    res.json({
      success: true,
      data: rolesResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error retrieving roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// GET /api/roles/:id - Get role by ID
export const getRoleById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const roleQuery = `
      SELECT 
        r.*,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
      FROM roles r
      LEFT JOIN users u1 ON r.created_by = u1.id
      LEFT JOIN users u2 ON r.updated_by = u2.id
      WHERE r.id = $1
    `;

    const result = await query(roleQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        error: { code: 'ROLE_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error retrieving role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// POST /api/roles - Create new role
export const createRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Name and permissions are required',
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Check if role name already exists
    const existingRole = await query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existingRole.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists',
        error: { code: 'DUPLICATE_ROLE_NAME' }
      });
    }

    // Create role
    const createQuery = `
      INSERT INTO roles (name, description, permissions, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(createQuery, [
      name,
      description || null,
      JSON.stringify(permissions),
      req.user?.id
    ]);

    logger.info('Created new role', {
      userId: req.user?.id,
      roleId: result.rows[0].id,
      roleName: name
    });

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Role created successfully'
    });
  } catch (error) {
    logger.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// PUT /api/roles/:id - Update role
export const updateRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, is_active } = req.body;

    // Check if role exists
    const existingRole = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existingRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        error: { code: 'ROLE_NOT_FOUND' }
      });
    }

    // Check if it's a system role and prevent certain modifications
    if (existingRole.rows[0].is_system_role && name !== existingRole.rows[0].name) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system role name',
        error: { code: 'SYSTEM_ROLE_PROTECTED' }
      });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== existingRole.rows[0].name) {
      const duplicateRole = await query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, id]);
      if (duplicateRole.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists',
          error: { code: 'DUPLICATE_ROLE_NAME' }
        });
      }
    }

    // Update role
    const updateQuery = `
      UPDATE roles
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        permissions = COALESCE($3, permissions),
        is_active = COALESCE($4, is_active),
        updated_by = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await query(updateQuery, [
      name || null,
      description !== undefined ? description : null,
      permissions ? JSON.stringify(permissions) : null,
      is_active !== undefined ? is_active : null,
      req.user?.id,
      id
    ]);

    logger.info('Updated role', {
      userId: req.user?.id,
      roleId: id,
      roleName: result.rows[0].name
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Role updated successfully'
    });
  } catch (error) {
    logger.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// DELETE /api/roles/:id - Delete role
export const deleteRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const existingRole = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existingRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        error: { code: 'ROLE_NOT_FOUND' }
      });
    }

    // Prevent deletion of system roles
    if (existingRole.rows[0].is_system_role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role',
        error: { code: 'SYSTEM_ROLE_PROTECTED' }
      });
    }

    // Check if role is in use
    const usageCheck = await query('SELECT COUNT(*) as count FROM users WHERE role_id = $1', [id]);
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users',
        error: { code: 'ROLE_IN_USE' }
      });
    }

    // Delete role
    await query('DELETE FROM roles WHERE id = $1', [id]);

    logger.info('Deleted role', {
      userId: req.user?.id,
      roleId: id,
      roleName: existingRole.rows[0].name
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};
