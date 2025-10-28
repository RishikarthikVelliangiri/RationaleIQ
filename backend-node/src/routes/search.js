import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { searchDecisions, semanticSearch, hybridSearch, generateEmbeddings } from '../controllers/searchController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

router.get('/', searchDecisions); // Legacy endpoint
router.post('/semantic', semanticSearch); // New semantic search
router.post('/hybrid', hybridSearch); // Hybrid search (semantic + keyword)
router.post('/generate-embeddings', generateEmbeddings); // Generate embeddings

export default router;
