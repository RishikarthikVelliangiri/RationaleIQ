import express from 'express';
import cors from 'cors';

// Initialize Express app
const app = express();

console.log('🔧 API Starting...');

// Middleware
app.use(cors({
  origin: '*', // Allow all for now to test
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Middleware configured');

// Health check at root of this function (which is /api)
app.get('/', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({
    app: 'RationaleIQ API',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  console.log('✅ /health endpoint hit');
  res.json({ status: 'ok', message: 'API is healthy' });
});

app.get('/test', (req, res) => {
  console.log('✅ /test endpoint hit');
  res.json({ 
    message: 'Test endpoint working',
    env: {
      hasMongoURI: !!process.env.MONGODB_URI,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasJWTSecret: !!process.env.JWT_SECRET
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

console.log('✅ Routes configured');

export default app;
