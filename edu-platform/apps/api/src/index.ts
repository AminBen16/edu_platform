// apps/api/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';

import schoolsRouter from './routes/schools';
import lessonsRouter from './routes/lessons';
import paymentsRouter from './routes/payments';
import uploadRouter from './routes/upload';
import webrtcRouter from './routes/webrtc';
import examsRouter from './routes/exams';
import authRouter from './routes/auth';
import quizzesRouter from './routes/quizzes';
import chatRouter from './routes/chat';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';


Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
});

const app: Express = express();


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

app.use('/auth', authRouter);
app.use('/schools', schoolsRouter);
app.use('/lessons', lessonsRouter);
app.use('/payments', paymentsRouter);
app.use('/upload', uploadRouter);
app.use('/webrtc', webrtcRouter);
app.use('/exams', examsRouter);
app.use('/quizzes', quizzesRouter);
app.use('/chat', chatRouter);
app.use('/notifications', notificationsRouter);
app.use('/analytics', analyticsRouter);


// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// This is the entrypoint for Vercel Serverless Functions
export default app;