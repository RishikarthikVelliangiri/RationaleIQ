import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;
