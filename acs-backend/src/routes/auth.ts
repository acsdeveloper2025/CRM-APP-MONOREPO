import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, getCurrentUser, preloginInfo } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';


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

];





// Routes
router.post('/prelogin', [body('username').notEmpty().withMessage('Username is required')], validate, preloginInfo);
router.post('/login', validate(loginValidation), login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
