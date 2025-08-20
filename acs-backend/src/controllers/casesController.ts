import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { pool } from '@/config/database';
import { query } from '@/config/database';
import { DeduplicationService } from '@/services/deduplicationService';

// Helper function to get assigned client IDs for BACKEND_USER users
const getAssignedClientIds = async (userId: string, userRole: string): Promise<number[] | null> => {
  // Only apply client filtering for BACKEND_USER users
  if (userRole !== 'BACKEND_USER') {
    return null; // null means no filtering (access to all clients)
  }

  try {
    const result = await query(
      'SELECT "clientId" FROM "userClientAssignments" WHERE "userId" = $1',
      [userId]
    );

    return result.rows.map(row => row.clientId);
  } catch (error) {
    logger.error('Error fetching assigned client IDs:', error);
    throw error;
  }
};

// Mock data for demonstration (replace with actual database operations)
let cases: any[] = [
  {
    id: 'case_1',
    title: 'Residence Verification - John Doe',
    description: 'Verify residential address for loan application',
    status: 'PENDING',
    priority: 1,
    clientId: 1,
    assignedToId: 'user_1',
    createdById: 'user_3',
    address: '123 Main St, City, State 12345',
    contactPerson: 'John Doe',
    contactPhone: '+1234567890',
    verificationType: 'RESIDENCE',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    completedAt: null,
    notes: [],
    attachments: [],
    history: [],
  },
  {
    id: 'case_2',
    title: 'Office Verification - Tech Solutions Inc',
    description: 'Verify office premises for business loan',
    status: 'IN_PROGRESS',
    priority: 2,
    clientId: 2,
    assignedToId: 'user_2',
    createdById: 'user_3',
    address: '456 Business Ave, City, State 67890',
    contactPerson: 'Jane Smith',
    contactPhone: '+1234567891',
    verificationType: 'OFFICE',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    completedAt: null,
    notes: [
      { id: 'note_1', text: 'Initial visit scheduled', createdBy: 'user_2', createdAt: '2024-01-02T10:00:00.000Z' }
    ],
    attachments: [],
    history: [
      { id: 'hist_1', action: 'CASE_CREATED', description: 'Case created', userId: 'user_3', timestamp: '2024-01-02T00:00:00.000Z' },
      { id: 'hist_2', action: 'CASE_ASSIGNED', description: 'Case assigned to field agent', userId: 'user_3', timestamp: '2024-01-02T00:30:00.000Z' },
    ],
  },
  {
    id: 'case_3',
    title: 'Residence Verification - Alice Johnson',
    description: 'Verify residential address for personal loan',
    status: 'COMPLETED',
    priority: 1,
    clientId: 'client_1',
    assignedToId: 'user_1',
    createdById: 'user_3',
    address: '789 Oak St, City, State 54321',
    contactPerson: 'Alice Johnson',
    contactPhone: '+1234567892',
    verificationType: 'RESIDENCE',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
    completedAt: '2024-01-05T00:00:00.000Z',
    notes: [
      { id: 'note_2', text: 'Verification completed successfully', createdBy: 'user_1', createdAt: '2024-01-05T00:00:00.000Z' }
    ],
    attachments: ['attachment_1', 'attachment_2'],
    history: [
      { id: 'hist_3', action: 'CASE_CREATED', description: 'Case created', userId: 'user_3', timestamp: '2024-01-03T00:00:00.000Z' },
      { id: 'hist_4', action: 'CASE_ASSIGNED', description: 'Case assigned to field agent', userId: 'user_3', timestamp: '2024-01-03T00:30:00.000Z' },
      { id: 'hist_5', action: 'CASE_COMPLETED', description: 'Case completed', userId: 'user_1', timestamp: '2024-01-05T00:00:00.000Z' },
    ],
  },
];

// GET /api/cases - List cases with pagination and filters
export const getCases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      assignedTo,
      clientId,
      priority,
      dateFrom,
      dateTo
    } = req.query;

    // Get user info for client filtering
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Apply client filtering for BACKEND_USER users (SUPER_ADMIN bypasses all restrictions)
    if (userRole === 'BACKEND_USER') {
      const assignedClientIds = await getAssignedClientIds(userId!, userRole);

      if (assignedClientIds && assignedClientIds.length === 0) {
        // BACKEND_USER user has no client assignments, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0,
          },
          message: 'No cases found - user has no assigned clients',
        });
      }

      // Filter cases by assigned client IDs
      if (assignedClientIds) {
        whereConditions.push(`c."clientId" = ANY($${paramIndex}::int[])`);
        queryParams.push(assignedClientIds);
        paramIndex++;
      }
    }

    // Apply other filters
    if (status) {
      whereConditions.push(`c.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    if (assignedTo) {
      whereConditions.push(`c."assignedTo" = $${paramIndex}`);
      queryParams.push(assignedTo);
      paramIndex++;
    }
    if (clientId) {
      whereConditions.push(`c."clientId" = $${paramIndex}`);
      queryParams.push(Number(clientId));
      paramIndex++;
    }
    if (priority) {
      whereConditions.push(`c.priority = $${paramIndex}`);
      queryParams.push(Number(priority));
      paramIndex++;
    }
    if (search) {
      whereConditions.push(`(
        c."caseNumber" ILIKE $${paramIndex} OR
        c."applicantName" ILIKE $${paramIndex} OR
        c."applicantPhone" ILIKE $${paramIndex} OR
        c."applicantEmail" ILIKE $${paramIndex} OR
        c.address ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    if (dateFrom) {
      whereConditions.push(`c."createdAt" >= $${paramIndex}`);
      queryParams.push(new Date(dateFrom as string));
      paramIndex++;
    }
    if (dateTo) {
      whereConditions.push(`c."createdAt" <= $${paramIndex}`);
      queryParams.push(new Date(dateTo as string));
      paramIndex++;
    }

    // Build the WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cases c
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);
    const totalPages = Math.ceil(total / Number(limit));

    // Get cases with pagination
    const casesQuery = `
      SELECT
        c.*,
        cl.name as "clientName",
        cl.code as "clientCode",
        u.name as "assignedToName"
      FROM cases c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users u ON c."assignedTo" = u.id
      ${whereClause}
      ORDER BY c."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(Number(limit), offset);

    const casesResult = await query(casesQuery, queryParams);

    logger.info(`Retrieved ${casesResult.rows.length} cases`, {
      userId: req.user?.id,
      userRole,
      filters: { status, assignedTo, clientId, priority, search },
      pagination: { page, limit },
      total
    });

    res.json({
      success: true,
      data: casesResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
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
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Build WHERE conditions for client filtering
    const whereConditions: string[] = ['c.id = $1'];
    const queryParams: any[] = [id];
    let paramIndex = 2;

    // Apply client filtering for BACKEND_USER users (SUPER_ADMIN bypasses all restrictions)
    if (userRole === 'BACKEND_USER') {
      const assignedClientIds = await getAssignedClientIds(userId!, userRole);

      if (assignedClientIds && assignedClientIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - user has no assigned clients',
          error: { code: 'ACCESS_DENIED' },
        });
      }

      if (assignedClientIds) {
        whereConditions.push(`c."clientId" = ANY($${paramIndex}::int[])`);
        queryParams.push(assignedClientIds);
        paramIndex++;
      }
    }

    // Query the case with client filtering
    const caseQuery = `
      SELECT
        c.*,
        cl.name as "clientName",
        cl.code as "clientCode",
        u.name as "assignedToName"
      FROM cases c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users u ON c."assignedTo" = u.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const caseResult = await query(caseQuery, queryParams);

    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied',
        error: { code: 'NOT_FOUND' },
      });
    }

    const caseData = caseResult.rows[0];

    logger.info(`Retrieved case ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: caseData,
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

// POST /api/cases - Create new case with deduplication check
export const createCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      // Basic case fields
      title,
      description,
      clientId,
      assignedToId,
      address,
      contactPerson,
      contactPhone,
      verificationType,
      priority = 2,
      deadline,
      // New form fields
      applicantType,
      createdByBackendUser,
      backendContactNumber,
      notes, // TRIGGER field
      productId,
      verificationTypeId,
      // Customer information
      customerName,
      customerCallingCode,
      customerPhone,
      customerEmail,
      // Address fields
      addressStreet,
      addressCity,
      addressState,
      addressPincode,
      // New deduplication fields
      applicantName,
      applicantPhone,
      applicantEmail,
      panNumber,
      aadhaarNumber,
      bankAccountNumber,
      bankIfscCode,
      // Deduplication decision fields
      deduplicationDecision,
      deduplicationRationale,
      skipDeduplication = false
    } = req.body;

    // Validate required fields
    const finalApplicantName = applicantName || customerName;
    if (!finalApplicantName || !clientId || !assignedToId || !applicantType || !backendContactNumber || !notes) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: applicantName/customerName, clientId, assignedToId, applicantType, backendContactNumber, notes',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Validate client access for BACKEND_USER users (SUPER_ADMIN bypasses all restrictions)
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole === 'BACKEND_USER') {
      const assignedClientIds = await getAssignedClientIds(userId!, userRole);

      if (assignedClientIds && !assignedClientIds.includes(Number(clientId))) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - cannot create case for unassigned client',
          error: { code: 'CLIENT_ACCESS_DENIED' },
        });
      }
    }

    // Generate case number
    const caseNumber = `CASE_${Date.now()}`;

    // Prepare case data for database insertion
    const caseData = {
      caseNumber,
      clientId,
      productId: productId || null,
      verificationTypeId: verificationTypeId || null,
      applicantName: finalApplicantName,
      applicantPhone: applicantPhone || customerPhone || contactPhone,
      applicantEmail: applicantEmail || customerEmail,
      address: address || addressStreet,
      pincode: addressPincode || req.body.pincode || null,
      status: 'PENDING',
      priority: priority === 2 ? 'MEDIUM' : priority === 1 ? 'LOW' : priority === 3 ? 'HIGH' : 'URGENT',
      assignedTo: assignedToId,
      createdBy: req.user?.id,
      panNumber: panNumber?.toUpperCase() || null,
      aadhaarNumber,
      bankAccountNumber,
      bankIfscCode,
      // New required fields
      applicantType,
      backendContactNumber,
      notes, // TRIGGER field
      deduplicationChecked: !skipDeduplication,
      deduplicationDecision: deduplicationDecision || (skipDeduplication ? 'NO_DUPLICATES' : null),
      deduplicationRationale
    };

    // Insert case into database
    const insertQuery = `
      INSERT INTO cases (
        "caseNumber", "clientId", "productId", "verificationTypeId",
        "applicantName", "applicantPhone", "applicantEmail",
        "address", "pincode", "status", "priority",
        "assignedTo", "createdBy", "panNumber", "aadhaarNumber",
        "bankAccountNumber", "bankIfscCode", "applicantType",
        "backendContactNumber", "notes", "deduplicationChecked",
        "deduplicationDecision", "deduplicationRationale"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23
      ) RETURNING *, "caseId"
    `;

    const result = await pool.query(insertQuery, [
      caseData.caseNumber,
      caseData.clientId,
      caseData.productId,
      caseData.verificationTypeId,
      caseData.applicantName,
      caseData.applicantPhone,
      caseData.applicantEmail,
      caseData.address,
      caseData.pincode,
      caseData.status,
      caseData.priority,
      caseData.assignedTo,
      caseData.createdBy,
      caseData.panNumber,
      caseData.aadhaarNumber,
      caseData.bankAccountNumber,
      caseData.bankIfscCode,
      caseData.applicantType,
      caseData.backendContactNumber,
      caseData.notes,
      caseData.deduplicationChecked,
      caseData.deduplicationDecision,
      caseData.deduplicationRationale
    ]);

    const newCase = result.rows[0];

    logger.info(`Created new case: ${newCase.id} (Case ID: ${newCase.caseId})`, {
      userId: req.user?.id,
      caseNumber: newCase.caseNumber,
      caseId: newCase.caseId,
      applicantName: newCase.applicantName,
      clientId,
      assignedToId,
      deduplicationChecked: newCase.deduplicationChecked
    });

    res.status(201).json({
      success: true,
      data: newCase,
      message: `Case created successfully with Case ID: ${newCase.caseId}`,
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

// PUT /api/cases/:id - Update case
export const updateCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case
    const updatedCase = {
      ...cases[caseIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Add history entry
    updatedCase.history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_UPDATED',
      description: `Case updated: ${Object.keys(updateData).join(', ')}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    cases[caseIndex] = updatedCase;

    logger.info(`Updated case: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedCase,
      message: 'Case updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/cases/:id - Delete case
export const deleteCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedCase = cases[caseIndex];
    cases.splice(caseIndex, 1);

    logger.info(`Deleted case: ${id}`, { 
      userId: req.user?.id,
      caseTitle: deletedCase.title
    });

    res.json({
      success: true,
      message: 'Case deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/status - Update case status
export const updateCaseStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldStatus = cases[caseIndex].status;
    cases[caseIndex].status = status;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // If status is completed, set completion date
    if (status === 'COMPLETED' || status === 'APPROVED') {
      cases[caseIndex].completedAt = new Date().toISOString();
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'STATUS_UPDATED',
      description: `Status changed from ${oldStatus} to ${status}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Updated case status: ${id}`, {
      userId: req.user?.id,
      oldStatus,
      newStatus: status
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/priority - Update case priority
export const updateCasePriority = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldPriority = cases[caseIndex].priority;
    cases[caseIndex].priority = priority;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'PRIORITY_UPDATED',
      description: `Priority changed from ${oldPriority} to ${priority}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Updated case priority: ${id}`, {
      userId: req.user?.id,
      oldPriority,
      newPriority: priority
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case priority updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case priority',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/assign - Assign case
export const assignCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldAssignee = cases[caseIndex].assignedToId;
    cases[caseIndex].assignedToId = assignedToId;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_ASSIGNED',
      description: `Case reassigned from ${oldAssignee || 'unassigned'} to ${assignedToId}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Assigned case: ${id}`, {
      userId: req.user?.id,
      oldAssignee,
      newAssignee: assignedToId
    });

    res.json({
      success: true,
      data: cases[caseIndex],
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

// POST /api/cases/:id/notes - Add case note
export const addCaseNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const newNote = {
      id: `note_${Date.now()}`,
      text: note,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };

    cases[caseIndex].notes.push(newNote);
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'NOTE_ADDED',
      description: 'Note added to case',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Added note to case: ${id}`, {
      userId: req.user?.id,
      noteLength: note.length
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Note added successfully',
    });
  } catch (error) {
    logger.error('Error adding case note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add case note',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cases/:id/history - Get case history
export const getCaseHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = cases.find(c => c.id === id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    res.json({
      success: true,
      data: caseData.history,
    });
  } catch (error) {
    logger.error('Error getting case history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get case history',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/complete - Complete case
export const completeCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, attachments } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status and completion date
    cases[caseIndex].status = 'COMPLETED';
    cases[caseIndex].completedAt = new Date().toISOString();
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add completion notes if provided
    if (notes) {
      const completionNote = {
        id: `note_${Date.now()}`,
        text: notes,
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };
      cases[caseIndex].notes.push(completionNote);
    }

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      cases[caseIndex].attachments.push(...attachments);
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_COMPLETED',
      description: 'Case marked as completed',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Completed case: ${id}`, {
      userId: req.user?.id,
      hasNotes: !!notes,
      attachmentCount: attachments?.length || 0
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case completed successfully',
    });
  } catch (error) {
    logger.error('Error completing case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/approve - Approve case
export const approveCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'APPROVED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add feedback as note if provided
    if (feedback) {
      const feedbackNote = {
        id: `note_${Date.now()}`,
        text: `Approval feedback: ${feedback}`,
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };
      cases[caseIndex].notes.push(feedbackNote);
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_APPROVED',
      description: 'Case approved',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Approved case: ${id}`, {
      userId: req.user?.id,
      hasFeedback: !!feedback
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case approved successfully',
    });
  } catch (error) {
    logger.error('Error approving case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/reject - Reject case
export const rejectCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'REJECTED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add rejection reason as note
    const rejectionNote = {
      id: `note_${Date.now()}`,
      text: `Rejection reason: ${reason}`,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    cases[caseIndex].notes.push(rejectionNote);

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_REJECTED',
      description: 'Case rejected',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Rejected case: ${id}`, {
      userId: req.user?.id,
      reason
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/rework - Request rework
export const requestRework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'REWORK_REQUIRED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add rework feedback as note
    const reworkNote = {
      id: `note_${Date.now()}`,
      text: `Rework required: ${feedback}`,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    cases[caseIndex].notes.push(reworkNote);

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'REWORK_REQUESTED',
      description: 'Rework requested',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Requested rework for case: ${id}`, {
      userId: req.user?.id,
      feedback
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Rework requested successfully',
    });
  } catch (error) {
    logger.error('Error requesting rework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request rework',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
