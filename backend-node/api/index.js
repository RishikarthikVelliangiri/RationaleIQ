import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { extractApiKey } from '../src/middleware/apiKeyMiddleware.js';

// Import routes
import authRouter from '../src/routes/auth.js';
import documentsRouter from '../src/routes/documents.js';
import decisionsRouter from '../src/routes/decisions.js';
import searchRouter from '../src/routes/search.js';
import dashboardRouter from '../src/routes/dashboard.js';
import aiRouter from '../src/routes/ai.js';
import projectsRouter from '../src/routes/projects.js';

// Initialize Express app
const app = express();

console.log('🔧 Initializing RationaleIQ API...');

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Extract API key from headers
app.use(extractApiKey);

// Connect to MongoDB
let isConnected = false;
const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Health check
app.get('/', (req, res) => {
  res.json({
    app: 'RationaleIQ API',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// API Routes (no /api prefix since we're already at /api)
app.use('/auth', authRouter);
app.use('/documents', documentsRouter);
app.use('/decisions', decisionsRouter);
app.use('/search', searchRouter);
app.use('/dashboard', dashboardRouter);
app.use('/ai', aiRouter);
app.use('/projects', projectsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Export handler for Vercel
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

