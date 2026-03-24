// DEBUG: API Index starting... (console.log removed for production linting)
// Production API Server - COMPLETE ROUTE MOUNTING
// Fixed for Vercel serverless + TypeScript CommonJS compatibility

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import path from 'path';
// import { webSocketService } from './services/websocket.js'; // PATCH 1: Disabled for Vercel

// Local middleware
import { errorHandler } from './middleware/errorHandler.js';
import { protect } from './middleware/auth.js';
import { securityHeaders } from './middleware/security.js';

// Functions from middleware files
import { logAudit } from './middleware/auditLog.js';
import { generalRateLimit } from './middleware/rateLimit.js';

// Route routers (only confirmed existing files)
import usersRouter from './routes/users.js';
import classesRouter from './routes/classes.js';
import schoolsRouter from './routes/schools.js';
import ticketsRouter from './routes/tickets.js';
import announcementsRouter from './routes/announcements.js';
import scheduleRouter from './routes/schedule.js';
import assignmentsRouter from './routes/assignments.js';
import messagesRouter from './routes/messages.js';
import competenciesRouter from './routes/competencies.js';
import topicsRouter from './routes/topics.js';
import chatRouter from './routes/chat.js';
import filesRouter from './routes/files.js';
import levelsRouter from './routes/levels.js';
import quizzesRouter from './routes/quizzes.js';
import termsRouter from './routes/terms.js';
import contentRouter from './routes/content.js';
import assessmentsRouter from './routes/assessments.js';
import competencyProgressRouter from './routes/competencyProgress.js';
import dashboardRouter from './routes/dashboard.js';
import subjectsRouter from './routes/subjects.js';
import reportsRouter from './routes/reports.js';
import attendanceRouter from './routes/attendance.js';
import webrtcRouter from './routes/webrtc.js';
import notificationsRouter from './routes/notifications.js';
import lessonsRouter from './routes/lessons.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import downloadRouter from './routes/download.js';
import liveSessionsRouter from './routes/live-sessions.js';
import reportCardsRouter from './routes/reportCards.js';
import schoolSettingsRouter from './routes/school-settings.js';

// Global Prisma client - use shared instance
import { prisma } from './config/database.js';
const globalPrisma = prisma;
const apiPrefixes = ['/api', '/api/v1'] as const;

// Create app
const app: Express = express();

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Core middleware (deps exist)
app.use(helmet());

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];

if (allowedOrigins.length === 0) {
// WARN: CORS_ALLOWED_ORIGINS is not set. CORS will be disabled. (console.warn removed for production linting)
}

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// PRODUCTION HEALTH CHECKS (Before Rate Limiting)
app.get(['/api/health', '/api/v1/health'], async (req: Request, res: Response) => {
  try {
    await globalPrisma.$connect();
    await globalPrisma.$queryRaw`SELECT 1`; // Basic DB ping
    res.status(200).json({
      status: 'healthy ✅',
      timestamp: new Date().toISOString(),
      database: 'connected',
      routes: 'ALL mounted (25+)',
      env: process.env.NODE_ENV || 'development',
      realtime: 'SSE enabled' // PATCH 1: WebSockets → SSE
    });
  } catch (error: any) {
logAudit('Healthcheck failed: ' + error.message, 'error'); // Switched to audit logging
    res.status(503).json({
      status: 'unhealthy',
      database: error.message
    });
  }
});

// Rate limiting (global)
app.use(['/api', '/api/v1'], generalRateLimit);

const mountProtectedRoute = (routePath: string, router: express.Router) => {
  apiPrefixes.forEach((prefix) => {
    app.use(`${prefix}${routePath}`, protect, router);
  });
};

const mountPublicRoute = (routePath: string, router: express.Router) => {
  apiPrefixes.forEach((prefix) => {
    app.use(`${prefix}${routePath}`, router);
  });
};

// Mount ALL confirmed API routes under /api/
// All routes except /health and /auth are protected
mountProtectedRoute('/users', usersRouter);
mountProtectedRoute('/classes', classesRouter);
mountProtectedRoute('/schools', schoolsRouter);
mountProtectedRoute('/tickets', ticketsRouter);
mountProtectedRoute('/announcements', announcementsRouter);
mountProtectedRoute('/schedule', scheduleRouter);
mountProtectedRoute('/assignments', assignmentsRouter);
mountProtectedRoute('/messages', messagesRouter);
mountProtectedRoute('/competencies', competenciesRouter);
mountProtectedRoute('/topics', topicsRouter);
mountProtectedRoute('/chat', chatRouter);
mountProtectedRoute('/files', filesRouter);
mountProtectedRoute('/download', downloadRouter);
mountProtectedRoute('/levels', levelsRouter);
mountProtectedRoute('/quizzes', quizzesRouter);
mountProtectedRoute('/terms', termsRouter);
mountProtectedRoute('/content', contentRouter);
mountProtectedRoute('/assessments', assessmentsRouter);
mountProtectedRoute('/competency-progress', competencyProgressRouter);
mountProtectedRoute('/dashboard', dashboardRouter);
mountProtectedRoute('/subjects', subjectsRouter);
mountProtectedRoute('/reports', reportsRouter);
mountProtectedRoute('/report-cards', reportCardsRouter);
mountProtectedRoute('/attendance', attendanceRouter);
mountProtectedRoute('/webrtc', webrtcRouter);
mountProtectedRoute('/notifications', notificationsRouter);
mountProtectedRoute('/lessons', lessonsRouter);
mountProtectedRoute('/analytics', analyticsRoutes);
mountProtectedRoute('/upload', uploadRouter);
mountProtectedRoute('/live-sessions', liveSessionsRouter);
mountProtectedRoute('/school-settings', schoolSettingsRouter);

// Realtime SSE routes
import realtimeRouter from './routes/realtime.js';
mountProtectedRoute('/realtime', realtimeRouter);

// Public routes
mountPublicRoute('/auth', authRouter);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    available: '/api/health, /api/test, /api/users, /api/classes etc.',
    documentation: 'All production routes now mounted!'
  });
});

// Graceful disconnect
process.on('SIGINT', async () => {
  await globalPrisma.$disconnect();
});

// Start server locally
if (process.env.NODE_ENV !== 'production' || process.env.IS_LOCAL === 'true') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless (CommonJS + ESM)
const handler = app;
export default handler;
module.exports = handler;
