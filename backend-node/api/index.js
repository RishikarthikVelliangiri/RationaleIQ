export default function handler(req, res) {
  console.log('🔧 Request received:', req.method, req.url);
  
  try {
    res.status(200).json({
      app: 'RationaleIQ API',
      status: 'running',
      version: '1.0.0',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}

