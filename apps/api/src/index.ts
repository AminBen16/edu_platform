// Production API - Complete Education Platform
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
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
import analyticsRoutes from './routes/analyticsRoutes';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/upload';
import downloadRoutes from './routes/download';
import contentRoutes from './routes/content';
import notificationRoutes from './routes/notifications';
import schoolSettingsRoutes from './routes/school-settings';
import reportsRoutes from './routes/reports';
import attendanceRoutes from './routes/attendance';
import scheduleRoutes from './routes/schedule';
import ticketRoutes from './routes/tickets';
import announcementRoutes from './routes/announcements';
import subjectRoutes from './routes/subjects';

// Uganda Curriculum Routes
import levelRoutes from './routes/levels';
import topicRoutes from './routes/topics';
import competencyRoutes from './routes/competencies';
import assessmentRoutes from './routes/assessments';
import termRoutes from './routes/terms';
import reportCardRoutes from './routes/reportCards';
import competencyProgressRoutes from './routes/competencyProgress';

// WebRTC Signaling Route
import webrtcRoutes from './routes/webrtc';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
});

const app: Express = express();

// Middleware
app.use(Sentry.Handlers.requestHandler());
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : process.env.NODE_ENV === 'production' 
      ? false  // In production, only allow same-origin
      : '*',   // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
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

// Test endpoint for debugging
app.get('/test', (req: Request, res: Response) => {
  console.log('Test endpoint hit:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    url: req.url
  });
  
  res.status(200).json({ 
    message: 'Test endpoint working',
    received: {
      body: req.body,
      contentType: req.headers['content-type']
    }
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
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/school-settings', schoolSettingsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/subjects', subjectRoutes);

// Uganda Curriculum Routes
app.use('/api/v1/levels', levelRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/competencies', competencyRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/terms', termRoutes);
app.use('/api/v1/report-cards', reportCardRoutes);
app.use('/api/v1/progress', competencyProgressRoutes);

// WebRTC Signaling Route
app.use('/api/v1/webrtc', webrtcRoutes);

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
      '/api/v1/analytics',
      '/api/v1/dashboard',
      '/api/v1/upload',
      '/api/v1/download',
      '/api/v1/content',
      '/api/v1/notifications',
      '/api/v1/school-settings',
      '/api/v1/reports',
      '/api/v1/attendance',
      '/api/v1/schedule'
    ]
  });
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO for real-time features (local dev only)
  io.on('connection', (socket: any) => {
    console.log('User connected:', socket.id);
    
    // Join class rooms
    socket.on('join-class', (classId: any) => {
      socket.join(classId);
      socket.emit('joined-class', { classId, userId: socket.id });
    });
    
    // Real-time chat
    socket.on('send-message', (data: any) => {
      io.to(data.classId).emit('new-message', {
        ...data,
        timestamp: new Date().toISOString(),
        senderId: socket.id
      });
    });
    
    // Live class WebRTC signaling
    socket.on('join-live-session', (roomCode: any) => {
      socket.join(roomCode);
      socket.emit('joined-session', { roomCode, userId: socket.id });
    });
    
    socket.on('webrtc-signal', (data: any) => {
      socket.to(data.roomCode).emit('webrtc-signal', {
        ...data,
        senderId: socket.id
      });
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Education Platform API running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
    console.log(`🔗 WebSocket server ready for real-time features`);
  });
}

// Export for Vercel serverless
export default function handler(req: Request, res: Response) {
  return (app as any)(req, res);
}