import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createDocument,
  uploadDocument,
  getDocuments,
  getDocument,
  processDocument,
  deleteDocument,
  clearAllDocuments
} from '../controllers/documentController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all routes
router.use(authenticate);

router.post('/', createDocument);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/:id/process', processDocument);
router.delete('/clear-all', clearAllDocuments);
router.delete('/:id', deleteDocument);

export default router;
