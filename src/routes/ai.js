import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { explainDecision } from '../controllers/aiController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/explain', explainDecision);

export default router;
