// apps/api/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as Sentry from '@sentry/node';

import schoolsRouter from './routes/schools';
import lessonsRouter from './routes/lessons_mock';
import paymentsRouter from './routes/payments';
import uploadRouter from './routes/upload';
import webrtcRouter, { handleWebRTCSignaling } from './routes/webrtc';
import examsRouter from './routes/exams';
import authRouter from './routes/auth_mock';
import quizzesRouter from './routes/quizzes';
import chatRouter from './routes/chat';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';


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

// Initialize WebRTC signaling
handleWebRTCSignaling(io);


// Sentry request handler
app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API is running!' });
});

// API Routes

app.use('/api/auth', authRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/webrtc', webrtcRouter);
app.use('/api/exams', examsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);


// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Start server for development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebRTC signaling available on /webrtc`);
  });
}

// This is the entrypoint for Vercel Serverless Functions
export default app;