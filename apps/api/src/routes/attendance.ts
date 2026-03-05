// apps/api/src/routes/attendance.ts
// Attendance management API
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /attendance - Get attendance records
// Teachers and admins can view all attendance, students can view their own
router.get('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId, role, id: userId } = req.user!;
  const { classId, studentId, startDate, endDate, status } = req.query;

  try {
    const db = prisma as any;
    const where: any = { schoolId };

    // Students can only see their own attendance
    if (role === Role.STUDENT) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId },
      });
      if (studentProfile) {
        where.studentId = studentProfile.id;
      } else {
        return res.json([]);
      }
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    if (classId) {
      where.classId = classId as string;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (status) {
      where.status = status as string;
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        class_: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Transform the response
    const transformedAttendance = attendance.map((record: any) => ({
      id: record.id,
      studentName: record.student.name,
      studentEmail: record.student.email,
      classId: record.classId,
      className: record.class_.name,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      notes: record.notes,
    }));

    res.json(transformedAttendance);
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// POST /attendance - Create attendance record (teachers/admins only)
router.post(
  '/',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { studentId, classId, date, status, checkInTime, checkOutTime, notes } =
      req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({
        error: 'studentId, classId, date, and status are required',
      });
    }

    try {
      const db = prisma as any;
      const attendance = await db.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId,
            classId,
            date: new Date(date),
          },
        },
        update: {
          status,
          checkInTime,
          checkOutTime,
          notes,
        },
        create: {
          schoolId,
          studentId,
          classId,
          date: new Date(date),
          status,
          checkInTime,
          checkOutTime,
          notes,
        },
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
          class_: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        id: attendance.id,
        studentName: attendance.student.name,
        className: attendance.class_.name,
        date: attendance.date.toISOString().split('T')[0],
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        notes: attendance.notes,
      });
    } catch (error) {
      
      res.status(500).json({ error: 'Failed to create attendance record' });
    }
  }
);

// POST /attendance/bulk - Bulk create attendance records
router.post(
  '/bulk',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array is required' });
    }

    try {
      const db = prisma as any;
      const results = await Promise.all(
        records.map(async (record: any) => {
          return db.attendance.upsert({
            where: {
              studentId_classId_date: {
                studentId: record.studentId,
                classId: record.classId,
                date: new Date(record.date),
              },
            },
            update: {
              status: record.status,
              checkInTime: record.checkInTime,
              checkOutTime: record.checkOutTime,
              notes: record.notes,
            },
            create: {
              schoolId,
              studentId: record.studentId,
              classId: record.classId,
              date: new Date(record.date),
              status: record.status,
              checkInTime: record.checkInTime,
              checkOutTime: record.checkOutTime,
              notes: record.notes,
            },
          });
        })
      );

      res.status(201).json({
        message: `${results.length} attendance records created/updated`,
        count: results.length,
      });
    } catch (error) {
      
      res.status(500).json({ error: 'Failed to bulk create attendance records' });
    }
  }
);

// GET /attendance/stats - Get attendance statistics
router.get(
  '/stats',
  async (req: RequestWithUser, res: Response) => {
    const { schoolId, role, id: userId } = req.user!;
    const { classId, startDate, endDate } = req.query;

    try {
      const db = prisma as any;
      const where: any = { schoolId };

      if (role === Role.STUDENT) {
        const studentProfile = await db.studentProfile.findUnique({
          where: { userId },
        });
        if (studentProfile) {
          where.studentId = studentProfile.id;
        }
      }

      if (classId) {
        where.classId = classId as string;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const attendance = await db.attendance.findMany({ where });

      const totalRecords = attendance.length;
      const presentCount = attendance.filter((a: any) => a.status === 'present').length;
      const absentCount = attendance.filter((a: any) => a.status === 'absent').length;
      const lateCount = attendance.filter((a: any) => a.status === 'late').length;

      const attendanceRate =
        totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      res.json({
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      });
    } catch (error) {
      
      res.status(500).json({ error: 'Failed to fetch attendance statistics' });
    }
  }
);

export default router;
