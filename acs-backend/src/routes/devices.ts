import { Router } from 'express';
import { DevicesController } from '../controllers/devicesController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Role } from '../types/auth';

const router = Router();

// Apply authentication to all device routes
router.use(authenticateToken);

// Admin-only routes for device management
router.get('/', requireRole([Role.ADMIN]), DevicesController.getAllDevices);
router.get('/pending', requireRole([Role.ADMIN]), DevicesController.getPendingDevices);
router.post('/:deviceId/approve', requireRole([Role.ADMIN]), DevicesController.approveDevice);
router.post('/:deviceId/reject', requireRole([Role.ADMIN]), DevicesController.rejectDevice);

export default router;
