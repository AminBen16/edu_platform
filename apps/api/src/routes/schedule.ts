// apps/api/src/routes/schedule.ts
// Schedule management API
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /schedule - Get schedule records
router.get('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { classId, dayOfWeek } = req.query;

  try {
    const db = prisma as any;
    const where: any = { schoolId };

    if (classId) {
      where.classId = classId as string;
    }

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = parseInt(dayOfWeek as string);
    }

    const schedules = await db.schedule.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Transform the response
    const transformedSchedules = schedules.map((record: any) => ({
      id: record.id,
      classId: record.classId,
      className: record.class?.name,
      dayOfWeek: record.dayOfWeek,
      startTime: record.startTime,
      endTime: record.endTime,
      subject: record.subject,
      room: record.room,
      isRecurring: record.isRecurring,
    }));

    res.json(transformedSchedules);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule records' });
  }
});

// POST /schedule - Create schedule record (teachers/admins only)
router.post(
  '/',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { classId, dayOfWeek, startTime, endTime, subject, room, isRecurring } =
      req.body;

    if (!classId || dayOfWeek === undefined || !startTime || !endTime || !subject) {
      return res.status(400).json({
        error: 'classId, dayOfWeek, startTime, endTime, and subject are required',
      });
    }

    try {
      const db = prisma as any;
      const schedule = await db.schedule.create({
        data: {
          schoolId,
          classId,
          dayOfWeek,
          startTime,
          endTime,
          subject,
          room,
          isRecurring: isRecurring ?? true,
        },
        include: {
          class: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        id: schedule.id,
        classId: schedule.classId,
        className: schedule.class?.name,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subject: schedule.subject,
        room: schedule.room,
        isRecurring: schedule.isRecurring,
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule record' });
    }
  }
);

// PUT /schedule/:id - Update schedule record
router.put(
  '/:id',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { id } = req.params;
    const { classId, dayOfWeek, startTime, endTime, subject, room, isRecurring } =
      req.body;

    try {
      const db = prisma as any;
      const schedule = await db.schedule.update({
        where: { id, schoolId },
        data: {
          classId,
          dayOfWeek,
          startTime,
          endTime,
          subject,
          room,
          isRecurring,
        },
        include: {
          class: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        id: schedule.id,
        classId: schedule.classId,
        className: schedule.class?.name,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subject: schedule.subject,
        room: schedule.room,
        isRecurring: schedule.isRecurring,
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule record' });
    }
  }
);

// DELETE /schedule/:id - Delete schedule record
router.delete(
  '/:id',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { id } = req.params;

    try {
      const db = prisma as any;
      await db.schedule.delete({
        where: { id, schoolId },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule record' });
    }
  }
);

export default router;
