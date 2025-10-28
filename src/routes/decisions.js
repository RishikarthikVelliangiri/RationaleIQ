import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getDecisions, getDecision, clearAllDecisions, updateDecisionStatus } from '../controllers/decisionController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

router.get('/', getDecisions);
router.get('/:id', getDecision);
router.patch('/:id/status', updateDecisionStatus);
router.delete('/clear-all', clearAllDecisions);

export default router;
