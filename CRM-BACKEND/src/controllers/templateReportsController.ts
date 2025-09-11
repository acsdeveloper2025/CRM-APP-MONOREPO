import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { templateReportService } from '../services/TemplateReportService';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Template-based Reports Controller
 * Handles generation and management of template-based verification reports
 */

/**
 * Generate template-based report for a form submission
 */
export async function generateTemplateReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { caseId, submissionId } = req.params;
    const userId = req.user?.id;

    logger.info('Generating template report for form submission', {
      caseId,
      submissionId,
      userId
    });

    // Get case details
    const caseQuery = `
      SELECT id, "customerName", "verificationData", "verificationType", "verificationOutcome", status, address
      FROM cases 
      WHERE "caseId" = $1
    `;
    const caseResult = await pool.query(caseQuery, [parseInt(caseId)]);
    
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseData = caseResult.rows[0];
    const verificationType = caseData.verificationType;
    const outcome = caseData.verificationOutcome;

    // Extract form data from verification data
    const formData = caseData.verificationData?.formData || caseData.verificationData?.verification || {};

    // Prepare data for template generation
    const reportData = {
      verificationType,
      outcome,
      formData,
      caseDetails: {
        caseId: caseData.id,
        customerName: caseData.customerName,
        address: caseData.address
      }
    };

    // Generate template-based report
    const result = await templateReportService.generateTemplateReport(reportData);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save report to database
    const saveQuery = `
      INSERT INTO template_reports (
        case_id, submission_id, verification_type, outcome,
        report_content, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at
    `;

    const saveResult = await pool.query(saveQuery, [
      caseData.id,
      submissionId,
      verificationType,
      outcome,
      result.report,
      JSON.stringify(result.metadata)
    ]);

    const reportId = saveResult.rows[0].id;

    logger.info('Template report generated and saved successfully', {
      caseId,
      submissionId,
      reportId,
      userId
    });

    res.json({
      success: true,
      reportId,
      report: result.report,
      metadata: result.metadata
    });

  } catch (error) {
    logger.error('Error generating template report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get existing template report for a form submission
 */
export async function getTemplateReport(req: Request, res: Response) {
  try {
    const { caseId, submissionId } = req.params;

    logger.info('Retrieving template report', {
      caseId,
      submissionId
    });

    // Get case UUID
    const caseQuery = `SELECT id FROM cases WHERE "caseId" = $1`;
    const caseResult = await pool.query(caseQuery, [parseInt(caseId)]);
    
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseUuid = caseResult.rows[0].id;

    // Get template report
    const reportQuery = `
      SELECT id, report_content, metadata, created_at, created_by
      FROM template_reports 
      WHERE case_id = $1 AND submission_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const reportResult = await pool.query(reportQuery, [caseUuid, submissionId]);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template report not found' });
    }

    const report = reportResult.rows[0];

    res.json({
      success: true,
      report: {
        id: report.id,
        content: report.report_content,
        metadata: report.metadata,
        createdAt: report.created_at,
        createdBy: report.created_by
      }
    });

  } catch (error) {
    logger.error('Error retrieving template report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all template reports for a case
 */
export async function getCaseTemplateReports(req: Request, res: Response) {
  try {
    const { caseId } = req.params;

    logger.info('Retrieving all template reports for case', { caseId });

    // Get case UUID
    const caseQuery = `SELECT id FROM cases WHERE "caseId" = $1`;
    const caseResult = await pool.query(caseQuery, [parseInt(caseId)]);
    
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseUuid = caseResult.rows[0].id;

    // Get all template reports for the case
    const reportsQuery = `
      SELECT id, submission_id, verification_type, outcome, 
             report_content, metadata, created_at, created_by
      FROM template_reports 
      WHERE case_id = $1
      ORDER BY created_at DESC
    `;

    const reportsResult = await pool.query(reportsQuery, [caseUuid]);

    const reports = reportsResult.rows.map(report => ({
      id: report.id,
      submissionId: report.submission_id,
      verificationType: report.verification_type,
      outcome: report.outcome,
      content: report.report_content,
      metadata: report.metadata,
      createdAt: report.created_at,
      createdBy: report.created_by
    }));

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    logger.error('Error retrieving case template reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete a template report
 */
export async function deleteTemplateReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { reportId } = req.params;
    const userId = req.user?.id;

    logger.info('Deleting template report', { reportId, userId });

    const deleteQuery = `
      DELETE FROM template_reports 
      WHERE id = $1 AND created_by = $2
      RETURNING id
    `;

    const result = await pool.query(deleteQuery, [reportId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template report not found or unauthorized' });
    }

    logger.info('Template report deleted successfully', { reportId, userId });

    res.json({ success: true, message: 'Template report deleted successfully' });

  } catch (error) {
    logger.error('Error deleting template report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
