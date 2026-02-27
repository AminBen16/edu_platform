// Live sessions and WebRTC management
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /live-sessions - Get active live sessions
router.get('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId, role } = req.user!;
  const { classId, isActive } = req.query;

  try {
    const db = prisma as any;
    const where: any = { schoolId };

    if (classId) {
      where.classId = classId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const sessions = await db.liveSession.findMany({
      where,
      include: {
        class_: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    const transformedSessions = sessions.map((session: any) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      roomCode: session.roomCode,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      classId: session.classId,
      className: session.class_?.name,
      teacherId: session.teacherId,
      teacherName: session.teacher?.user?.name,
      participantCount: session.participantCount || 0,
      maxParticipants: session.maxParticipants,
      createdAt: session.createdAt,
    }));

    res.json(transformedSessions);
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
});

// POST /live-sessions - Create new live session (Teachers/Admins only)
router.post(
  '/',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId, id: userId } = req.user!;
    const { title, description, classId, maxParticipants, scheduledStartTime } = req.body;

    if (!title || !classId) {
      return res.status(400).json({ error: 'title and classId are required' });
    }

    try {
      const db = prisma as any;
      
      // Get teacher profile
      const teacher = await db.teacher.findFirst({
        where: { userId },
      });

      if (!teacher) {
        return res.status(403).json({ error: 'Only teachers can create live sessions' });
      }

      // Generate unique room code
      const roomCode = `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const session = await db.liveSession.create({
        data: {
          schoolId,
          title,
          description,
          classId,
          teacherId: teacher.id,
          roomCode,
          maxParticipants: maxParticipants || 50,
          isActive: true,
          startTime: scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
        },
        include: {
          class_: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        id: session.id,
        title: session.title,
        description: session.description,
        roomCode: session.roomCode,
        startTime: session.startTime,
        isActive: session.isActive,
        classId: session.classId,
        className: session.class_?.name,
        message: 'Live session created successfully',
      });
    } catch (error) {
      console.error('Error creating live session:', error);
      res.status(500).json({ error: 'Failed to create live session' });
    }
  }
);

// GET /live-sessions/:roomCode - Get session by room code
router.get('/:roomCode', async (req: RequestWithUser, res: Response) => {
  const { roomCode } = req.params;

  try {
    const db = prisma as any;
    const session = await db.liveSession.findUnique({
      where: { roomCode },
      include: {
        class_: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    res.json({
      id: session.id,
      title: session.title,
      description: session.description,
      roomCode: session.roomCode,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      classId: session.classId,
      className: session.class_?.name,
      teacherId: session.teacherId,
      teacherName: session.teacher?.user?.name,
      participantCount: session.participantCount || 0,
      maxParticipants: session.maxParticipants,
    });
  } catch (error) {
    console.error('Error fetching live session:', error);
    res.status(500).json({ error: 'Failed to fetch live session' });
  }
});

// POST /live-sessions/:roomCode/join - Join live session
router.post('/:roomCode/join', async (req: RequestWithUser, res: Response) => {
  const { roomCode } = req.params;
  const { userId, userName, role } = req.body;

  try {
    const db = prisma as any;
    const session = await db.liveSession.findUnique({
      where: { roomCode },
    });

    if (!session) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    if (!session.isActive) {
      return res.status(400).json({ error: 'Live session has ended' });
    }

    if (session.maxParticipants && (session.participantCount || 0) >= session.maxParticipants) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Increment participant count
    await db.liveSession.update({
      where: { roomCode },
      data: {
        participantCount: { increment: 1 },
      },
    });

    res.json({
      message: 'Joined live session successfully',
      sessionId: session.id,
      roomCode: session.roomCode,
      title: session.title,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
  } catch (error) {
    console.error('Error joining live session:', error);
    res.status(500).json({ error: 'Failed to join live session' });
  }
});

// POST /live-sessions/:roomCode/leave - Leave live session
router.post('/:roomCode/leave', async (req: RequestWithUser, res: Response) => {
  const { roomCode } = req.params;

  try {
    const db = prisma as any;
    const session = await db.liveSession.findUnique({
      where: { roomCode },
    });

    if (!session) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    // Decrement participant count
    if (session.participantCount && session.participantCount > 0) {
      await db.liveSession.update({
        where: { roomCode },
        data: {
          participantCount: { decrement: 1 },
        },
      });
    }

    res.json({ message: 'Left live session successfully' });
  } catch (error) {
    console.error('Error leaving live session:', error);
    res.status(500).json({ error: 'Failed to leave live session' });
  }
});

// POST /live-sessions/:roomCode/end - End live session
router.post(
  '/:roomCode/end',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { roomCode } = req.params;

    try {
      const db = prisma as any;
      const session = await db.liveSession.findUnique({
        where: { roomCode },
      });

      if (!session) {
        return res.status(404).json({ error: 'Live session not found' });
      }

      await db.liveSession.update({
        where: { roomCode },
        data: {
          isActive: false,
          endTime: new Date(),
        },
      });

      res.json({ message: 'Live session ended successfully' });
    } catch (error) {
      console.error('Error ending live session:', error);
      res.status(500).json({ error: 'Failed to end live session' });
    }
  }
);

export default router;
