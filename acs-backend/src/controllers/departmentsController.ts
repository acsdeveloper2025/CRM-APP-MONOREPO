import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/departments - Get all departments with pagination and filtering
export const getDepartments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      includeInactive = 'false',
      parentId = null
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(d.name ILIKE $${paramCount} OR d.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Active filter
    if (includeInactive !== 'true') {
      paramCount++;
      whereConditions.push(`d.is_active = $${paramCount}`);
      params.push(true);
    }

    // Parent department filter
    if (parentId) {
      paramCount++;
      whereConditions.push(`d.parent_department_id = $${paramCount}`);
      params.push(parentId);
    } else if (parentId === null) {
      whereConditions.push(`d.parent_department_id IS NULL`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get departments with pagination
    const departmentsQuery = `
      SELECT 
        d.*,
        dh.name as department_head_name,
        pd.name as parent_department_name,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id) as user_count,
        (SELECT COUNT(*) FROM departments WHERE parent_department_id = d.id) as subdepartment_count
      FROM departments d
      LEFT JOIN users dh ON d.department_head_id = dh.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.updated_by = u2.id
      ${whereClause}
      ORDER BY d.name
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(Number(limit), offset);
    const departmentsResult = await query(departmentsQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM departments d ${whereClause}`;
    const countResult = await query(countQuery, params.slice(0, paramCount));
    const total = parseInt(countResult.rows[0].total);

    logger.info('Retrieved departments', {
      userId: req.user?.id,
      filters: { search, includeInactive, parentId },
      pagination: { page, limit },
      total
    });

    res.json({
      success: true,
      data: departmentsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error retrieving departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// GET /api/departments/:id - Get department by ID
export const getDepartmentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const departmentQuery = `
      SELECT 
        d.*,
        dh.name as department_head_name,
        pd.name as parent_department_name,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id) as user_count,
        (SELECT COUNT(*) FROM departments WHERE parent_department_id = d.id) as subdepartment_count
      FROM departments d
      LEFT JOIN users dh ON d.department_head_id = dh.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.updated_by = u2.id
      WHERE d.id = $1
    `;

    const result = await query(departmentQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
        error: { code: 'DEPARTMENT_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error retrieving department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// POST /api/departments - Create new department
export const createDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, department_head_id, parent_department_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Check if department name already exists
    const existingDepartment = await query('SELECT id FROM departments WHERE name = $1', [name]);
    if (existingDepartment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists',
        error: { code: 'DUPLICATE_DEPARTMENT_NAME' }
      });
    }

    // Validate department head exists
    if (department_head_id) {
      const headExists = await query('SELECT id FROM users WHERE id = $1', [department_head_id]);
      if (headExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Department head user not found',
          error: { code: 'INVALID_DEPARTMENT_HEAD' }
        });
      }
    }

    // Validate parent department exists
    if (parent_department_id) {
      const parentExists = await query('SELECT id FROM departments WHERE id = $1', [parent_department_id]);
      if (parentExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent department not found',
          error: { code: 'INVALID_PARENT_DEPARTMENT' }
        });
      }
    }

    // Create department
    const createQuery = `
      INSERT INTO departments (name, description, department_head_id, parent_department_id, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(createQuery, [
      name,
      description || null,
      department_head_id || null,
      parent_department_id || null,
      req.user?.id
    ]);

    logger.info('Created new department', {
      userId: req.user?.id,
      departmentId: result.rows[0].id,
      departmentName: name
    });

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Department created successfully'
    });
  } catch (error) {
    logger.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// PUT /api/departments/:id - Update department
export const updateDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, department_head_id, parent_department_id, is_active } = req.body;

    // Check if department exists
    const existingDepartment = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existingDepartment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
        error: { code: 'DEPARTMENT_NOT_FOUND' }
      });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== existingDepartment.rows[0].name) {
      const duplicateDepartment = await query('SELECT id FROM departments WHERE name = $1 AND id != $2', [name, id]);
      if (duplicateDepartment.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Department name already exists',
          error: { code: 'DUPLICATE_DEPARTMENT_NAME' }
        });
      }
    }

    // Validate department head exists
    if (department_head_id) {
      const headExists = await query('SELECT id FROM users WHERE id = $1', [department_head_id]);
      if (headExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Department head user not found',
          error: { code: 'INVALID_DEPARTMENT_HEAD' }
        });
      }
    }

    // Validate parent department exists and prevent circular reference
    if (parent_department_id) {
      if (parent_department_id === id) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be its own parent',
          error: { code: 'CIRCULAR_REFERENCE' }
        });
      }

      const parentExists = await query('SELECT id FROM departments WHERE id = $1', [parent_department_id]);
      if (parentExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent department not found',
          error: { code: 'INVALID_PARENT_DEPARTMENT' }
        });
      }
    }

    // Update department
    const updateQuery = `
      UPDATE departments
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        department_head_id = COALESCE($3, department_head_id),
        parent_department_id = COALESCE($4, parent_department_id),
        is_active = COALESCE($5, is_active),
        updated_by = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const result = await query(updateQuery, [
      name || null,
      description !== undefined ? description : null,
      department_head_id !== undefined ? department_head_id : null,
      parent_department_id !== undefined ? parent_department_id : null,
      is_active !== undefined ? is_active : null,
      req.user?.id,
      id
    ]);

    logger.info('Updated department', {
      userId: req.user?.id,
      departmentId: id,
      departmentName: result.rows[0].name
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Department updated successfully'
    });
  } catch (error) {
    logger.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};

// DELETE /api/departments/:id - Delete department
export const deleteDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const existingDepartment = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existingDepartment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
        error: { code: 'DEPARTMENT_NOT_FOUND' }
      });
    }

    // Check if department is in use by users
    const usageCheck = await query('SELECT COUNT(*) as count FROM users WHERE department_id = $1', [id]);
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department that has assigned users',
        error: { code: 'DEPARTMENT_IN_USE' }
      });
    }

    // Check if department has subdepartments
    const subdepartmentCheck = await query('SELECT COUNT(*) as count FROM departments WHERE parent_department_id = $1', [id]);
    if (parseInt(subdepartmentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department that has subdepartments',
        error: { code: 'DEPARTMENT_HAS_SUBDEPARTMENTS' }
      });
    }

    // Delete department
    await query('DELETE FROM departments WHERE id = $1', [id]);

    logger.info('Deleted department', {
      userId: req.user?.id,
      departmentId: id,
      departmentName: existingDepartment.rows[0].name
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
};
