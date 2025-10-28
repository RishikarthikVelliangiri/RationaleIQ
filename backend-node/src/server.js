import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { extractApiKey } from './middleware/apiKeyMiddleware.js';

// Import routes
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import decisionsRouter from './routes/decisions.js';
import searchRouter from './routes/search.js';
import dashboardRouter from './routes/dashboard.js';
import aiRouter from './routes/ai.js';
import projectsRouter from './routes/projects.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Extract API key from headers (for user-provided keys)
app.use(extractApiKey);

// Connect to MongoDB
connectDB();

// Health check
app.get('/', (req, res) => {
  res.json({
    app: 'RationaleIQ',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/search', searchRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);
app.use('/api/projects', projectsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 RationaleIQ API running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/`);
  });
}

// Export for Vercel serverless
export default app;
