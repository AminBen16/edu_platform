// production API - Complete Education Platform
import express, { Express, Request, Response } from 'express';

const app: Express = express();

// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Education Platform API - Production Ready',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Test endpoint working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Export for Vercel serverless
module.exports = app;
