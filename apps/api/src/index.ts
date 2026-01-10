// Production API - Complete Education Platform
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as Sentry from '@sentry/node';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import schoolRoutes from './routes/schools';
import lessonRoutes from './routes/lessons';
import quizRoutes from './routes/quizzes';
import classRoutes from './routes/classes';
import assignmentRoutes from './routes/assignments';
import messageRoutes from './routes/messages';
import liveSessionRoutes from './routes/live-sessions';
import analyticsRoutes from './routes/analytics';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
});

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(Sentry.Handlers.requestHandler());
app.use(cors({
  origin: [
    'http://localhost:55719', // Flutter web development
    'http://localhost:3000',   // Local development
    'https://*.vercel.app',    // All Vercel deployments
    'http://localhost:8080',   // Additional local ports
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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

// API Routes with proper versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/live-sessions', liveSessionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join class rooms
  socket.on('join-class', (classId) => {
    socket.join(classId);
    socket.emit('joined-class', { classId, userId: socket.id });
  });
  
  // Real-time chat
  socket.on('send-message', (data) => {
    io.to(data.classId).emit('new-message', {
      ...data,
      timestamp: new Date().toISOString(),
      senderId: socket.id
    });
  });
  
  // Live class WebRTC signaling
  socket.on('join-live-session', (roomCode) => {
    socket.join(roomCode);
    socket.emit('joined-session', { roomCode, userId: socket.id });
  });
  
  socket.on('webrtc-signal', (data) => {
    socket.to(data.roomCode).emit('webrtc-signal', {
      ...data,
      senderId: socket.id
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use(Sentry.Handlers.errorHandler());

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      '/api/v1/auth',
      '/api/v1/users', 
      '/api/v1/schools',
      '/api/v1/lessons',
      '/api/v1/quizzes',
      '/api/v1/classes',
      '/api/v1/assignments',
      '/api/v1/messages',
      '/api/v1/live-sessions',
      '/api/v1/analytics'
    ]
  });
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Education Platform API running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
    console.log(`🔗 WebSocket server ready for real-time features`);
  });
}

// Export for Vercel serverless
export default app;