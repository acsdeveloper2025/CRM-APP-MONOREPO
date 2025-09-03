import { Request, Response } from 'express';
import {
  MobileCaseListRequest,
  MobileCaseResponse,
  MobileAutoSaveRequest,
  MobileAutoSaveResponse
} from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';
import { query } from '@/config/database';

export class MobileCaseController {
  // Get cases for mobile app with optimized response
  static async getMobileCases(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      const {
        page = 1,
        limit = 20,
        status,
        search,
        assignedTo,
        priority,
        dateFrom,
        dateTo,
        lastSyncTimestamp,
      }: MobileCaseListRequest = req.query as any;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Math.min(Number(limit), config.mobile.syncBatchSize);

      // Build where clause
      const where: any = {};

      // Role-based filtering
      if (userRole === 'FIELD_AGENT') {
        where.assignedTo = userId;
      } else if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = Number(priority);
      }

      if (search) {
        where.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Sync-specific filtering
      if (lastSyncTimestamp) {
        where.updatedAt = {
          gt: new Date(lastSyncTimestamp),
        };
      }

      // Build dynamic SQL for where
      const vals: any[] = [];
      const wh: string[] = [];
      if (where.assignedTo) { vals.push(where.assignedTo); wh.push(`c."assignedTo" = $${vals.length}`); }
      if (where.status) { vals.push(where.status); wh.push(`c.status = $${vals.length}`); }
      if (where.priority) { vals.push(where.priority); wh.push(`c.priority = $${vals.length}`); }
      if (where.updatedAt?.gt) { vals.push(where.updatedAt.gt); wh.push(`c."updatedAt" > $${vals.length}`); }
      if (search) {
        vals.push(`%${search}%`); wh.push(`(c."customerName" ILIKE $${vals.length} OR c."customerPhone" ILIKE $${vals.length} OR c.title ILIKE $${vals.length} OR c.description ILIKE $${vals.length})`);
      }
      if (dateFrom) { vals.push(new Date(dateFrom)); wh.push(`c."createdAt" >= $${vals.length}`); }
      if (dateTo) { vals.push(new Date(dateTo)); wh.push(`c."createdAt" <= $${vals.length}`); }
      const whereSql = wh.length ? `WHERE ${wh.join(' AND ')}` : '';

      const listSql = `
        SELECT c.*,
               cl.id as "clientId", cl.name as "clientName", cl.code as "clientCode",
               p.id as "productId", p.name as "productName", p.code as "productCode",
               vt.id as "verificationTypeId", vt.name as "verificationTypeName", vt.code as "verificationTypeCode",
               cu.name as "createdByUserName",
               au.name as "assignedToUserName",
               COALESCE(att_count.attachment_count, 0) as "attachmentCount"
        FROM cases c
        LEFT JOIN clients cl ON cl.id = c."clientId"
        LEFT JOIN products p ON p.id = c."productId"
        LEFT JOIN "verificationTypes" vt ON vt.id = c."verificationTypeId"
        LEFT JOIN users cu ON cu.id = c."createdBy"
        LEFT JOIN users au ON au.id = c."assignedTo"
        LEFT JOIN (
          SELECT "caseId", COUNT(*) as attachment_count
          FROM attachments
          GROUP BY "caseId"
        ) att_count ON att_count."caseId" = c."caseId"
        ${whereSql}
        ORDER BY c.priority DESC, c."createdAt" DESC
        LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
      const casesRes = await query(listSql, [...vals, take, skip]);

      const countRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM cases c ${whereSql}`, vals);
      const totalCount = Number(countRes.rows[0]?.count || 0);
      const cases = casesRes.rows as any[];

      // Transform cases for mobile response with all required assignment fields
      const mobileCases: MobileCaseResponse[] = cases.map(caseItem => ({
        id: caseItem.id,
        caseId: caseItem.caseId, // User-friendly auto-incrementing case ID
        title: caseItem.title,
        description: caseItem.description,
        customerName: caseItem.customerName || caseItem.applicantName, // Customer Name
        customerCallingCode: caseItem.customerCallingCode, // Customer Calling Code
        customerPhone: caseItem.customerPhone,
        customerEmail: caseItem.customerEmail,
        addressStreet: caseItem.addressStreet,
        addressCity: caseItem.addressCity,
        addressState: caseItem.addressState,
        addressPincode: caseItem.addressPincode,
        latitude: caseItem.latitude,
        longitude: caseItem.longitude,
        status: caseItem.status.toUpperCase().replace(/\s+/g, '_'),
        priority: caseItem.priority, // Priority
        assignedAt: new Date(caseItem.createdAt).toISOString(),
        updatedAt: new Date(caseItem.updatedAt).toISOString(),
        completedAt: caseItem.completedAt ? new Date(caseItem.completedAt).toISOString() : undefined,
        notes: caseItem.trigger, // TRIGGER field
        verificationType: caseItem.verificationType,
        verificationOutcome: caseItem.verificationOutcome,
        applicantType: caseItem.applicantType, // Applicant Type
        backendContactNumber: caseItem.backendContactNumber, // Backend Contact Number
        createdByBackendUser: caseItem.createdByUserName, // Created By Backend User
        assignedToFieldUser: caseItem.assignedToUserName, // Assign to Field User
        client: {
          id: caseItem.clientId || '',
          name: caseItem.clientName || '', // Client
          code: caseItem.clientCode || '',
        },
        product: caseItem.productId ? {
          id: caseItem.productId,
          name: caseItem.productName || '', // Product
          code: caseItem.productCode || '',
        } : undefined,
        verificationTypeDetails: caseItem.verificationTypeId ? {
          id: caseItem.verificationTypeId,
          name: caseItem.verificationTypeName || '', // Verification Type
          code: caseItem.verificationTypeCode || '',
        } : undefined,
        attachments: [],
        attachmentCount: Number(caseItem.attachmentCount) || 0,
        formData: (caseItem as any).verificationData || null,
        syncStatus: 'SYNCED',
      }));

      const totalPages = Math.ceil(totalCount / take);
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        message: 'Cases retrieved successfully',
        data: {
          cases: mobileCases,
          pagination: {
            page: Number(page),
            limit: take,
            total: totalCount,
            totalPages,
            hasMore,
          },
          syncTimestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Get mobile cases error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CASES_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get single case for mobile
  static async getMobileCase(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD_AGENT') {
        where.assignedTo = userId;
      }

      const vals2: any[] = [caseId];
      let caseSql = `
        SELECT c.*,
               cl.id as "clientId", cl.name as "clientName", cl.code as "clientCode",
               p.id as "productId", p.name as "productName", p.code as "productCode",
               vt.id as "verificationTypeId", vt.name as "verificationTypeName", vt.code as "verificationTypeCode",
               cu.name as "createdByUserName",
               au.name as "assignedToUserName"
        FROM cases c
        LEFT JOIN clients cl ON cl.id = c."clientId"
        LEFT JOIN products p ON p.id = c."productId"
        LEFT JOIN "verificationTypes" vt ON vt.id = c."verificationTypeId"
        LEFT JOIN users cu ON cu.id = c."createdBy"
        LEFT JOIN users au ON au.id = c."assignedTo"
        WHERE c.id = $1`;
      if (userRole === 'FIELD_AGENT') { caseSql += ` AND c."assignedTo" = $2`; vals2.push(userId); }
      const caseRes = await query(caseSql, vals2);
      const caseItem = caseRes.rows[0];

      if (!caseItem) {
        return res.status(404).json({ success: false, message: 'Case not found', error: { code: 'CASE_NOT_FOUND', timestamp: new Date().toISOString() } });
      }

      const attRes2 = await query(`
        SELECT
          id,
          filename,
          "originalName",
          "mimeType",
          "fileSize" as size,
          "filePath",
          "uploadedBy",
          "createdAt" as "uploadedAt",
          "caseId"
        FROM attachments
        WHERE "caseId" = $1
        ORDER BY "createdAt" DESC
      `, [caseId]);
      const locRes = await query(`SELECT id, latitude, longitude, accuracy, timestamp, source FROM locations WHERE "caseId" = $1 ORDER BY timestamp DESC LIMIT 10`, [caseId]);

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Case not found',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const mobileCase: MobileCaseResponse = {
        id: caseItem.id,
        caseId: caseItem.caseId, // User-friendly auto-incrementing case ID
        title: caseItem.title,
        description: caseItem.description,
        customerName: caseItem.customerName || caseItem.applicantName, // Customer Name
        customerCallingCode: caseItem.customerCallingCode, // Customer Calling Code
        customerPhone: caseItem.customerPhone,
        customerEmail: caseItem.customerEmail,
        addressStreet: caseItem.addressStreet,
        addressCity: caseItem.addressCity,
        addressState: caseItem.addressState,
        addressPincode: caseItem.addressPincode,
        latitude: caseItem.latitude,
        longitude: caseItem.longitude,
        status: caseItem.status.toUpperCase().replace(/\s+/g, '_'),
        priority: caseItem.priority, // Priority
        assignedAt: new Date(caseItem.createdAt).toISOString(),
        updatedAt: new Date(caseItem.updatedAt).toISOString(),
        completedAt: caseItem.completedAt ? new Date(caseItem.completedAt).toISOString() : undefined,
        notes: caseItem.trigger, // TRIGGER field
        verificationType: caseItem.verificationType,
        verificationOutcome: caseItem.verificationOutcome,
        applicantType: caseItem.applicantType, // Applicant Type
        backendContactNumber: caseItem.backendContactNumber, // Backend Contact Number
        createdByBackendUser: caseItem.createdByUserName, // Created By Backend User
        assignedToFieldUser: caseItem.assignedToUserName, // Assign to Field User
        client: {
          id: caseItem.clientId || '',
          name: caseItem.clientName || '', // Client
          code: caseItem.clientCode || '',
        },
        product: caseItem.productId ? {
          id: caseItem.productId,
          name: caseItem.productName || '', // Product
          code: caseItem.productCode || '',
        } : undefined,
        verificationTypeDetails: caseItem.verificationTypeId ? {
          id: caseItem.verificationTypeId,
          name: caseItem.verificationTypeName || '', // Verification Type
          code: caseItem.verificationTypeCode || '',
        } : undefined,
        attachments: attRes2.rows.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/attachments/${att.id}/serve`,
          downloadUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/attachments/${att.id}/download`,
          uploadedAt: new Date(att.uploadedAt).toISOString(),
          uploadedBy: att.uploadedBy,
          type: att.mimeType.startsWith('image/') ? 'image' : 'document',
          isImage: att.mimeType.startsWith('image/'),
          caseId: att.caseId,
        })),
        formData: (caseItem as any).verificationData || null,
        syncStatus: 'SYNCED',
      };

      res.json({
        success: true,
        message: 'Case retrieved successfully',
        data: mobileCase,
      });
    } catch (error) {
      console.error('Get mobile case error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CASE_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Update case status from mobile
  static async updateCaseStatus(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { status, notes = null } = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD_AGENT') {
        where.assignedTo = userId;
      }

      const vals3: any[] = [caseId];
      let exSql = `SELECT id, status, trigger, "completedAt" FROM cases WHERE id = $1`;
      if (userRole === 'FIELD_AGENT') { exSql += ` AND "assignedTo" = $2`; vals3.push(userId); }
      const exRes = await query(exSql, vals3);
      const existingCase = exRes.rows[0];
      if (!existingCase) {
        return res.status(404).json({ success: false, message: 'Case not found or access denied', error: { code: 'CASE_NOT_FOUND', timestamp: new Date().toISOString() } });
      }
      const compAt = status === 'COMPLETED' ? new Date() : existingCase.completedat;
      await query(`UPDATE cases SET status = $1, trigger = COALESCE($2, trigger), "completedAt" = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $4`, [status, notes, compAt, caseId]);
      const updRes = await query(`SELECT id, status, "updatedAt", "completedAt" FROM cases WHERE id = $1`, [caseId]);
      const updatedCase = updRes.rows[0];

      await createAuditLog({
        action: 'CASE_STATUS_UPDATED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          oldStatus: existingCase.status,
          newStatus: status,
          notes,
          source: 'MOBILE_APP',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Case status updated successfully',
        data: {
          id: updatedCase.id,
          status: updatedCase.status,
          updatedAt: updatedCase.updatedAt.toISOString(),
          completedAt: updatedCase.completedAt?.toISOString(),
        },
      });
    } catch (error) {
      console.error('Update case status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'STATUS_UPDATE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Update case priority from mobile
  static async updateCasePriority(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { priority } = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (userRole === 'FIELD_AGENT') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update priority',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const vals6: any[] = [caseId];
      let exSql4 = `SELECT id FROM cases WHERE id = $1`;
      if (userRole === 'FIELD_AGENT') { exSql4 += ` AND "assignedTo" = $2`; vals6.push(userId); }
      const exRes4 = await query(exSql4, vals6);
      const existingCase = exRes4.rows[0];
      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      await query(`UPDATE cases SET priority = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`, [Number(priority), caseId]);
      const updRes2 = await query(`SELECT id, priority, "updatedAt" FROM cases WHERE id = $1`, [caseId]);
      const updatedCase = updRes2.rows[0];

      await createAuditLog({
        action: 'CASE_PRIORITY_UPDATED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          oldPriority: existingCase.priority,
          newPriority: priority,
          source: 'MOBILE_APP',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Case priority updated successfully',
        data: {
          id: updatedCase.id,
          priority: updatedCase.priority,
          updatedAt: updatedCase.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Update case priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'PRIORITY_UPDATE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Auto-save form data
  static async autoSaveForm(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { formType, formData, timestamp }: MobileAutoSaveRequest = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD_AGENT') {
        where.assignedTo = userId;
      }

      const vals5: any[] = [caseId];
      let exSql3 = `SELECT id FROM cases WHERE id = $1`;
      if (userRole === 'FIELD_AGENT') { exSql3 += ` AND "assignedTo" = $2`; vals5.push(userId); }
      const exRes3 = await query(exSql3, vals5);
      const existingCase = exRes3.rows[0];
      if (!existingCase) {
        return res.status(404).json({ success: false, message: 'Case not found or access denied', error: { code: 'CASE_NOT_FOUND', timestamp: new Date().toISOString() } });
      }

      // Save or update auto-save data
      const exAuto = await query(`SELECT id FROM "autoSaves" WHERE "caseId" = $1 AND "formType" = $2`, [caseId, formType]);
      let autoSaveData: any;
      if (exAuto.rowCount && exAuto.rowCount > 0) {
        const upd = await query(`UPDATE "autoSaves" SET "formData" = $1, timestamp = $2 WHERE id = $3 RETURNING *`, [JSON.stringify(formData), new Date(timestamp), exAuto.rows[0].id]);
        autoSaveData = upd.rows[0];
      } else {
        const ins = await query(`INSERT INTO "autoSaves" (id, "caseId", "formType", "formData", timestamp) VALUES (gen_random_uuid()::text, $1, $2, $3, $4) RETURNING *`, [caseId, formType, JSON.stringify(formData), new Date(timestamp)]);
        autoSaveData = ins.rows[0];
      }

      const response: MobileAutoSaveResponse = {
        success: true,
        message: 'Form auto-saved successfully',
        data: {
          savedAt: autoSaveData.timestamp.toISOString(),
          version: 1, // Default version since we removed the field
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Auto-save form error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'AUTO_SAVE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get auto-saved form data
  static async getAutoSavedForm(req: Request, res: Response) {
    try {
      const { caseId, formType } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD_AGENT') {
        where.assignedTo = userId;
      }

      const vals7: any[] = [caseId];
      let exSql5 = `SELECT id FROM cases WHERE id = $1`;
      if (userRole === 'FIELD_AGENT') { exSql5 += ` AND "assignedTo" = $2`; vals7.push(userId); }
      const exRes5 = await query(exSql5, vals7);
      const existingCase = exRes5.rows[0];

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const autoRes = await query(`SELECT * FROM "autoSaves" WHERE "caseId" = $1 AND "formType" = $2 LIMIT 1`, [caseId, formType.toUpperCase()]);
      const autoSaveData = autoRes.rows[0];
      if (!autoSaveData) {
        return res.status(404).json({ success: false, message: 'No auto-saved data found', error: { code: 'AUTO_SAVE_NOT_FOUND', timestamp: new Date().toISOString() } });
      }

      res.json({
        success: true,
        message: 'Auto-saved form data retrieved successfully',
        data: {
          formData: JSON.parse(autoSaveData.formData),
          savedAt: autoSaveData.timestamp.toISOString(),
          version: 1, // Default version since we removed the field
        },
      });
    } catch (error) {
      console.error('Get auto-saved form error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'AUTO_SAVE_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
