export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(`
🔍 Vercel Diagnostics
====================

Request Info:
- URL: ${req.url}
- Method: ${req.method}
- Headers: ${JSON.stringify(req.headers, null, 2)}

Environment:
- NODE_ENV: ${process.env.NODE_ENV}
- Has MONGODB_URI: ${!!process.env.MONGODB_URI}
- Has GEMINI_API_KEY: ${!!process.env.GEMINI_API_KEY}
- Has JWT_SECRET: ${!!process.env.JWT_SECRET}
- Has ALLOWED_ORIGINS: ${!!process.env.ALLOWED_ORIGINS}

Vercel Info:
- Region: ${process.env.VERCEL_REGION || 'unknown'}
- Deployment: ${process.env.VERCEL_URL || 'unknown'}

Current Time: ${new Date().toISOString()}
  `);
}
