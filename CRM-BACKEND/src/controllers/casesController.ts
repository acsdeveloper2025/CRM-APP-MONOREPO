import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Mock data removed - using database operations only

// Supported file types for case attachments (PDF, Images, Word only)
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const ALLOWED_EXTENSIONS = Object.values(ALLOWED_FILE_TYPES);
const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_FILE_TYPES);

// Configure multer for case creation with attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create temporary directory for case creation
    const tempDir = path.join(process.cwd(), 'uploads', 'temp', `case_creation_${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `attachment_${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(extension) && ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Only PDF, images (JPG, PNG, GIF), and Word documents (DOC, DOCX) are supported.`));
  }
};

const uploadForCaseCreation = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files per case creation
  }
});

// GET /api/cases - List cases with filtering, sorting, and pagination
export const getCases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      status,
      search,
      assignedTo,
      clientId,
      priority,
      dateFrom,
      dateTo
    } = req.query;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Status filter
    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Search filter (customer name, case ID, address)
    if (search) {
      conditions.push(`(
        c."customerName" ILIKE $${paramIndex} OR
        c."caseId"::text ILIKE $${paramIndex} OR
        c.address ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Assigned to filter
    if (assignedTo) {
      conditions.push(`c."assignedTo" = $${paramIndex}`);
      params.push(assignedTo);
      paramIndex++;
    }

    // Client filter
    if (clientId) {
      conditions.push(`c."clientId" = $${paramIndex}`);
      params.push(parseInt(clientId as string));
      paramIndex++;
    }

    // Priority filter
    if (priority) {
      conditions.push(`c.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    // Date range filter
    if (dateFrom) {
      conditions.push(`c."createdAt" >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`c."createdAt" <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSortColumns = ['createdAt', 'updatedAt', 'customerName', 'priority', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy as string) ? sortBy : 'updatedAt';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Calculate offset
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cases c
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Enhanced query with all 13 required fields for mobile app
    const casesQuery = `
      SELECT
        c.*,
        -- Client information (Field 3: Client)
        cl.name as "clientName",
        cl.code as "clientCode",
        -- Assigned user information (Field 9: Assign to Field User)
        assigned_user.name as "assignedToName",
        assigned_user.email as "assignedToEmail",
        -- Product information (Field 4: Product)
        p.name as "productName",
        p.code as "productCode",
        -- Verification type information (Field 5: Verification Type)
        vt.name as "verificationTypeName",
        vt.code as "verificationTypeCode",
        -- Created by backend user information (Field 7: Created By Backend User)
        created_user.name as "createdByBackendUserName",
        created_user.email as "createdByBackendUserEmail"
      FROM cases c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users assigned_user ON c."assignedTo" = assigned_user.id
      LEFT JOIN users created_user ON c."createdByBackendUser" = created_user.id
      LEFT JOIN products p ON c."productId" = p.id
      LEFT JOIN "verificationTypes" vt ON c."verificationTypeId" = vt.id
      ${whereClause}
      ORDER BY c."${safeSortBy}" ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit as string), offset);
    const casesResult = await pool.query(casesQuery, params);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: casesResult.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages,
      },
      message: 'Cases retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cases',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cases/:id - Get case by ID
export const getCaseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Enhanced query with all 13 required fields for mobile app
    const caseQuery = `
      SELECT
        c.*,
        -- Client information (Field 3: Client)
        cl.name as "clientName",
        cl.code as "clientCode",
        -- Assigned user information (Field 9: Assign to Field User)
        assigned_user.name as "assignedToName",
        assigned_user.email as "assignedToEmail",
        -- Product information (Field 4: Product)
        p.name as "productName",
        p.code as "productCode",
        -- Verification type information (Field 5: Verification Type)
        vt.name as "verificationTypeName",
        vt.code as "verificationTypeCode",
        -- Created by backend user information (Field 7: Created By Backend User)
        created_user.name as "createdByBackendUserName",
        created_user.email as "createdByBackendUserEmail"
      FROM cases c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users assigned_user ON c."assignedTo" = assigned_user.id
      LEFT JOIN users created_user ON c."createdByBackendUser" = created_user.id
      LEFT JOIN products p ON c."productId" = p.id
      LEFT JOIN "verificationTypes" vt ON c."verificationTypeId" = vt.id
      WHERE c."caseId" = $1
    `;

    const result = await pool.query(caseQuery, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info('Case retrieved', {
      userId: req.user?.id,
      caseId: id,
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Case retrieved successfully',
    });
  } catch (error) {
    logger.error('Error retrieving case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases - Create new case
export const createCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerCallingCode,
      clientId,
      productId,
      verificationTypeId,
      address,
      pincode,
      priority = 'MEDIUM',
      trigger,
      applicantType = 'APPLICANT'
    } = req.body;

    const insertQuery = `
      INSERT INTO cases (
        "customerName", "customerPhone", "customerCallingCode",
        "clientId", "productId", "verificationTypeId",
        address, pincode, priority, trigger, "applicantType",
        status, "createdByBackendUser", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      customerName,
      customerPhone,
      customerCallingCode,
      clientId,
      productId,
      verificationTypeId,
      address,
      pincode,
      priority,
      trigger,
      applicantType,
      'PENDING',
      req.user?.id
    ];

    const result = await pool.query(insertQuery, values);

    logger.info('Case created', {
      userId: req.user?.id,
      caseId: result.rows[0].caseId,
    });

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Case created successfully',
    });
  } catch (error) {
    logger.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/assign - Assign case to user
export const assignCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    // Update case assignment
    const updateQuery = `
      UPDATE cases
      SET "assignedTo" = $1, status = 'ASSIGNED', "updatedAt" = NOW()
      WHERE "caseId" = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [assignedToId, parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info('Case assigned', {
      userId: req.user?.id,
      caseId: id,
      assignedTo: assignedToId,
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Case assigned successfully',
    });
  } catch (error) {
    logger.error('Error assigning case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/with-attachments - Create case with attachments in single request
export const createCaseWithAttachments = async (req: AuthenticatedRequest, res: Response) => {
  // Use multer middleware to handle file uploads
  uploadForCaseCreation.array('attachments', 10)(req, res, async (err) => {
    if (err) {
      logger.error('File upload error during case creation:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed during case creation',
        error: { code: 'UPLOAD_ERROR' },
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        customerName,
        customerPhone,
        customerCallingCode,
        clientId,
        productId,
        verificationTypeId,
        address,
        pincode,
        priority = 'MEDIUM',
        trigger,
        applicantType = 'APPLICANT'
      } = req.body;

      // Validate required fields
      if (!customerName || !customerPhone || !clientId || !productId || !verificationTypeId || !address) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: { code: 'VALIDATION_ERROR' },
        });
      }

      // Validate client access (inline since middleware can't access form data)
      const userRole = req.user?.role;
      const userId = req.user?.id;

      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        // Check if user has access to this client
        const clientAccessQuery = `
          SELECT 1 FROM user_client_access
          WHERE "userId" = $1 AND "clientId" = $2
        `;
        const accessResult = await client.query(clientAccessQuery, [userId, clientId]);

        if (accessResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to create cases for this client',
            error: { code: 'ACCESS_DENIED' },
          });
        }
      }

      // Step 1: Create the case
      const insertCaseQuery = `
        INSERT INTO cases (
          "customerName", "customerPhone", "customerCallingCode",
          "clientId", "productId", "verificationTypeId",
          address, pincode, priority, trigger, "applicantType",
          status, "createdByBackendUser", "backendContactNumber", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *
      `;

      const caseValues = [
        customerName,
        customerPhone,
        customerCallingCode,
        clientId,
        productId,
        verificationTypeId,
        address,
        pincode,
        priority,
        trigger,
        applicantType,
        'PENDING',
        req.user?.id,
        customerPhone // Use customer phone as backend contact number for now
      ];

      const caseResult = await client.query(insertCaseQuery, caseValues);
      const newCase = caseResult.rows[0];
      const caseId = newCase.caseId;

      // Step 2: Process uploaded files if any
      const files = req.files as Express.Multer.File[];
      const uploadedAttachments: any[] = [];

      if (files && files.length > 0) {
        // Create permanent directory for this case
        const permanentDir = path.join(process.cwd(), 'uploads', 'attachments', `case_${caseId}`);
        if (!fs.existsSync(permanentDir)) {
          fs.mkdirSync(permanentDir, { recursive: true });
        }

        for (const file of files) {
          try {
            // Move file from temp to permanent location
            const tempPath = file.path;
            const permanentPath = path.join(permanentDir, file.filename);
            fs.renameSync(tempPath, permanentPath);

            // Insert attachment record into database
            const insertAttachmentQuery = `
              INSERT INTO attachments (
                filename, "originalName", "filePath", "fileSize",
                "mimeType", "uploadedBy", "caseId", "createdAt"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
              RETURNING *
            `;

            const attachmentValues = [
              file.filename,
              file.originalname,
              `/uploads/attachments/case_${caseId}/${file.filename}`,
              file.size,
              file.mimetype,
              req.user?.id,
              caseId
            ];

            const attachmentResult = await client.query(insertAttachmentQuery, attachmentValues);
            uploadedAttachments.push(attachmentResult.rows[0]);

            logger.info('Attachment uploaded and saved', {
              caseId,
              filename: file.filename,
              originalName: file.originalname,
              size: file.size,
              userId: req.user?.id,
            });

          } catch (fileError) {
            logger.error('Error processing individual file:', fileError);
            // Continue with other files, don't fail the entire operation
          }
        }

        // Clean up temp directory
        try {
          const tempDir = path.dirname(files[0].path);
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          logger.warn('Failed to clean up temp directory:', cleanupError);
        }
      }

      await client.query('COMMIT');

      logger.info('Case created with attachments', {
        userId: req.user?.id,
        caseId: caseId,
        attachmentCount: uploadedAttachments.length,
      });

      res.status(201).json({
        success: true,
        data: {
          case: newCase,
          attachments: uploadedAttachments,
          attachmentCount: uploadedAttachments.length,
        },
        message: `Case created successfully with ${uploadedAttachments.length} attachment(s)`,
      });

    } catch (error) {
      await client.query('ROLLBACK');

      // Clean up any uploaded files on error
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        try {
          const tempDir = path.dirname(files[0].path);
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          logger.warn('Failed to clean up files after error:', cleanupError);
        }
      }

      logger.error('Error creating case with attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create case with attachments',
        error: { code: 'INTERNAL_ERROR' },
      });
    } finally {
      client.release();
    }
  });
};