import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import * as projectController from '../controllers/projectController.js'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticate)

router.get('/', projectController.getAllProjects)
router.get('/:id', projectController.getProjectById)
router.post('/', projectController.createProject)
router.put('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)
router.post('/:id/analyze', projectController.analyzeProject)

export default router
