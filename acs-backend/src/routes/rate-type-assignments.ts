import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { handleValidationErrors } from '@/middleware/validation';
import {
  getRateTypeAssignments,
  getAssignmentsByCombination,
  bulkAssignRateTypes,
  createRateTypeAssignment,
  deleteRateTypeAssignment
} from '@/controllers/rateTypeAssignmentsController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const listAssignmentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('clientId')
    .optional()
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  query('productId')
    .optional()
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  query('verificationTypeId')
    .optional()
    .isUUID()
    .withMessage('Verification Type ID must be a valid UUID'),
  query('rateTypeId')
    .optional()
    .isUUID()
    .withMessage('Rate Type ID must be a valid UUID'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const combinationValidation = [
  query('clientId')
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  query('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  query('verificationTypeId')
    .isUUID()
    .withMessage('Verification Type ID must be a valid UUID'),
];

const bulkAssignValidation = [
  body('clientId')
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  body('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('verificationTypeId')
    .isUUID()
    .withMessage('Verification Type ID must be a valid UUID'),
  body('rateTypeIds')
    .isArray()
    .withMessage('Rate Type IDs must be an array'),
  body('rateTypeIds.*')
    .isUUID()
    .withMessage('Each Rate Type ID must be a valid UUID'),
];

const createAssignmentValidation = [
  body('clientId')
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  body('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('verificationTypeId')
    .isUUID()
    .withMessage('Verification Type ID must be a valid UUID'),
  body('rateTypeId')
    .isUUID()
    .withMessage('Rate Type ID must be a valid UUID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Routes
router.get('/',
  listAssignmentsValidation,
  handleValidationErrors,
  getRateTypeAssignments
);

router.get('/by-combination',
  combinationValidation,
  handleValidationErrors,
  getAssignmentsByCombination
);

router.post('/bulk-assign',
  bulkAssignValidation,
  handleValidationErrors,
  bulkAssignRateTypes
);

router.post('/',
  createAssignmentValidation,
  handleValidationErrors,
  createRateTypeAssignment
);

router.delete('/:id',
  [param('id').isUUID().withMessage('Assignment ID must be a valid UUID')],
  handleValidationErrors,
  deleteRateTypeAssignment
);

export default router;
