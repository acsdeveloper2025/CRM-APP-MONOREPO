import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, fieldAgentUuidLogin, registerDevice, getCurrentUser, preloginInfo } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { deviceAuthRateLimit } from '@/middleware/deviceAuthRateLimit';

const router = Router();

// Removed auth rate limiting for better user experience

// Login validation
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('deviceId')
    .optional()
    .isString()
    .withMessage('Device ID must be a string'),
  body('macAddress')
    .optional()
    .isString()
    .withMessage('MAC address must be a string'),
];

// Device registration validation
const deviceRegistrationValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
    .isString()
    .withMessage('Device ID must be a string'),
  body('platform')
    .isIn(['IOS', 'ANDROID'])
    .withMessage('Platform must be either IOS or ANDROID'),
  body('model')
    .notEmpty()
    .withMessage('Device model is required')
    .isString()
    .withMessage('Device model must be a string'),
  body('osVersion')
    .notEmpty()
    .withMessage('OS version is required')
    .isString()
    .withMessage('OS version must be a string'),
  body('appVersion')
    .notEmpty()
    .withMessage('App version is required')
    .isString()
    .withMessage('App version must be a string'),
];

// Field agent UUID login validation (for CaseFlow mobile app only)
const fieldAgentUuidLoginValidation = [
  body('authUuid')
    .notEmpty()
    .withMessage('Authentication UUID is required')
    .isUUID()
    .withMessage('Authentication UUID must be a valid UUID'),
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required for mobile authentication')
    .isString()
    .withMessage('Device ID must be a string'),
  body('platform')
    .optional()
    .isIn(['IOS', 'ANDROID'])
    .withMessage('Platform must be either IOS or ANDROID'),
  body('appVersion')
    .optional()
    .isString()
    .withMessage('App version must be a string'),
];

// Routes
router.post('/prelogin', [body('username').notEmpty().withMessage('Username is required')], validate, preloginInfo);
router.post('/login', deviceAuthRateLimit, validate(loginValidation), login);
router.post('/field-agent/uuid-login', deviceAuthRateLimit, validate(fieldAgentUuidLoginValidation), fieldAgentUuidLogin);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/device/register', validate(deviceRegistrationValidation), registerDevice);

export default router;
