import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken, requireFieldOrHigher } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { caseRateLimit } from '@/middleware/rateLimiter';
import { validateCaseAccess, validateClientAccess } from '@/middleware/clientAccess';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  updateCaseStatus,
  updateCasePriority,
  assignCase,
  addCaseNote,
  getCaseHistory,
  completeCase,
  approveCase,
  rejectCase,
  requestRework
} from '@/controllers/casesController';

const router = express.Router();

// Apply authentication and rate limiting
router.use(authenticateToken);
router.use(requireFieldOrHigher);
router.use(caseRateLimit);

// Validation schemas
const createCaseValidation = [
  // Optional legacy fields for backward compatibility
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),

  // Required fields
  body('clientId')
    .trim()
    .notEmpty()
    .withMessage('Client ID is required'),
  body('assignedToId')
    .trim()
    .notEmpty()
    .withMessage('Assigned user ID is required'),

  // Optional legacy fields
  body('address')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters'),
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('contactPhone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Contact phone must be valid'),
  body('verificationType')
    .optional()
    .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'OTHER'])
    .withMessage('Verification type must be one of: RESIDENCE, OFFICE, BUSINESS, OTHER'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),

  // New required fields for form integration
  body('applicantType')
    .trim()
    .isIn(['APPLICANT', 'CO-APPLICANT', 'REFERENCE PERSON'])
    .withMessage('Applicant type must be APPLICANT, CO-APPLICANT, or REFERENCE PERSON'),
  body('backendContactNumber')
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Backend contact number must be valid'),
  body('notes')
    .trim()
    .isLength({ min: 1 })
    .withMessage('TRIGGER field is required'),

  // Customer information (at least one name required)
  body('applicantName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Applicant name must be between 1 and 100 characters'),
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters'),
];

const updateCaseValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters'),
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('contactPhone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Contact phone must be valid'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
];

const listCasesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'REWORK_REQUIRED'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
];

const statusUpdateValidation = [
  body('status')
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'REWORK_REQUIRED'])
    .withMessage('Invalid status'),
];

const priorityUpdateValidation = [
  body('priority')
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
];

const assignValidation = [
  body('assignedToId')
    .trim()
    .notEmpty()
    .withMessage('Assigned user ID is required'),
];

const noteValidation = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters'),
];

const completeValidation = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

const approveValidation = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters'),
];

const rejectValidation = [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Rejection reason is required and must be less than 1000 characters'),
];

const reworkValidation = [
  body('feedback')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Rework feedback is required and must be less than 1000 characters'),
];

// Core CRUD routes
router.get('/',
  listCasesValidation,
  validate,
  getCases
);

router.post('/',
  createCaseValidation,
  validate,
  validateClientAccess('body'),
  createCase
);

router.get('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  validateCaseAccess,
  getCaseById
);

router.put('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  updateCaseValidation,
  validate,
  validateCaseAccess,
  updateCase
);

router.delete('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  validateCaseAccess,
  deleteCase
);

// Case workflow routes
router.put('/:id/status',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  statusUpdateValidation,
  validate,
  validateCaseAccess,
  updateCaseStatus
);

router.put('/:id/priority',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  priorityUpdateValidation,
  validate,
  validateCaseAccess,
  updateCasePriority
);

router.put('/:id/assign',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  assignValidation,
  validate,
  validateCaseAccess,
  assignCase
);

router.post('/:id/notes',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  noteValidation,
  validate,
  validateCaseAccess,
  addCaseNote
);

router.get('/:id/history',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  validateCaseAccess,
  getCaseHistory
);

router.post('/:id/complete',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  completeValidation,
  validate,
  validateCaseAccess,
  completeCase
);

router.post('/:id/approve',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  approveValidation,
  validate,
  validateCaseAccess,
  approveCase
);

router.post('/:id/reject',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  rejectValidation,
  validate,
  validateCaseAccess,
  rejectCase
);

router.post('/:id/rework',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  reworkValidation,
  validate,
  validateCaseAccess,
  requestRework
);

export default router;
