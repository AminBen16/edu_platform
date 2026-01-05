// apps/api/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import schoolsRouter from './routes/schools';
import lessonsRouter from './routes/lessons';
import paymentsRouter from './routes/payments';
import uploadRouter from './routes/upload';
import webrtcRouter from './routes/webrtc';
import examsRouter from './routes/exams';
import authRouter from './routes/auth';

const app: Express = express();

// Middleware
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

// This is the entrypoint for Vercel Serverless Functions
export default app;