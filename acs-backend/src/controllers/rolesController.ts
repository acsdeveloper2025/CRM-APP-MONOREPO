import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/roles - Get all roles with pagination and filtering
export const getRoles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search = '', limit = 20, page = 1 } = req.query;
    
    let rolesQuery: string;
    let countQuery: string;
    let params: any[] = [];
    
    if (search && search.toString().trim()) {
      // Search query
      rolesQuery = `
        SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count
        FROM roles r
        WHERE r.is_active = true AND (r.name ILIKE $1 OR COALESCE(r.description, '') ILIKE $1)
        ORDER BY r.name
        LIMIT $2 OFFSET $3
      `;
      countQuery = `
        SELECT COUNT(*) as total 
        FROM roles r 
        WHERE r.is_active = true AND (r.name ILIKE $1 OR COALESCE(r.description, '') ILIKE $1)
      `;
      params = [`%${search}%`, Number(limit), (Number(page) - 1) * Number(limit)];
    } else {
      // No search query
      rolesQuery = `
        SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count
        FROM roles r
        WHERE r.is_active = true
        ORDER BY r.name
        LIMIT $1 OFFSET $2
      `;
      countQuery = `
        SELECT COUNT(*) as total 
        FROM roles r 
        WHERE r.is_active = true
      `;
      params = [Number(limit), (Number(page) - 1) * Number(limit)];
    }
    
    const rolesResult = await query(rolesQuery, params);
    const countParams = search && search.toString().trim() ? [`%${search}%`] : [];
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: rolesResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error retrieving roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// GET /api/roles/:id - Get a specific role
export const getRole = async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error retrieving role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// POST /api/roles - Create a new role
export const createRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, permissions, is_system_role = false } = req.body;

    // Validate required fields
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Name and permissions are required',
        error: { code: 'MISSING_REQUIRED_FIELDS' }
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
      INSERT INTO roles (name, description, permissions, is_system_role, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(createQuery, [
      name,
      description || null,
      JSON.stringify(permissions),
      is_system_role,
      req.user?.id
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Role created successfully'
    });

  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// PUT /api/roles/:id - Update a role
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

    // Check if new name conflicts with existing role (if name is being changed)
    if (name && name !== existingRole.rows[0].name) {
      const nameConflict = await query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, id]);
      if (nameConflict.rows.length > 0) {
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

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Role updated successfully'
    });

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// DELETE /api/roles/:id - Delete a role
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

    // Check if role is a system role
    if (existingRole.rows[0].is_system_role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role',
        error: { code: 'SYSTEM_ROLE_DELETE_FORBIDDEN' }
      });
    }

    // Check if role has assigned users
    const usersWithRole = await query('SELECT COUNT(*) as count FROM users WHERE role_id = $1', [id]);
    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role with assigned users',
        error: { code: 'ROLE_HAS_USERS' }
      });
    }

    // Delete role
    await query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};
