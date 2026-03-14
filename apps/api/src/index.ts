import express, { Express, Request, Response } from 'express';

const app: Express = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Education Platform API - Production Ready',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Test endpoint working' });
});

// API v1 check
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API v1 available' });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Export for Vercel serverless
module.exports = app;
