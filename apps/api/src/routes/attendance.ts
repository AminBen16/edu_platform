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
    const where: any = { schoolId };

    // Students can only see their own attendance
    if (role === Role.STUDENT) {
      const student = await prisma.student.findFirst({
        where: { userId },
      });
      if (student) {
        where.studentId = student.id;
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

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Get student and class info separately
    const studentIds = [...new Set(attendance.map(a => a.studentId))];
    const classIds = [...new Set(attendance.map(a => a.classId).filter(Boolean))];
    
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { name: true, email: true } } }
    });
    
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds as string[] } },
      select: { id: true, name: true }
    });

    const studentMap = new Map(students.map(s => [s.id, s]));
    const classMap = new Map(classes.map(c => [c.id, c]));

    // Transform the response
    const transformedAttendance = attendance.map((record) => {
      const student = studentMap.get(record.studentId);
      const classInfo = classMap.get(record.classId || '');
      return {
        id: record.id,
        studentName: student?.user.name,
        studentEmail: student?.user.email,
        classId: record.classId,
        className: classInfo?.name,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        notes: record.notes,
      };
    });

    res.json(transformedAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// POST /attendance - Create attendance record (teachers/admins only)
router.post(
  '/',
  authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: RequestWithUser, res: Response) => {
    const { schoolId } = req.user!;
    const { studentId, classId, date, status, notes } =
      req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({
        error: 'studentId, classId, date, and status are required',
      });
    }

    try {
      // Try to find existing record first
      const existingRecord = await prisma.attendance.findFirst({
        where: {
          studentId,
          classId,
          date: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(date).setHours(23, 59, 59, 999))
          }
        },
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } }
          },
          class: {
            select: { id: true, name: true }
          }
        }
      });

      if (existingRecord) {
        // Update existing record
        const updated = await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: { status, notes }
        });
        return res.status(200).json({
          id: updated.id,
          studentId: updated.studentId,
          classId: updated.classId,
          date: updated.date.toISOString().split('T')[0],
          status: updated.status,
          notes: updated.notes
        });
      }

      // Create new record
      const attendance = await prisma.attendance.create({
        data: {
          schoolId,
          studentId,
          classId,
          date: new Date(date),
          status,
          notes,
        }
      });

      res.status(201).json({
        id: attendance.id,
        studentId: attendance.studentId,
        classId: attendance.classId,
        date: attendance.date.toISOString().split('T')[0],
        status: attendance.status,
        notes: attendance.notes,
      });
    } catch (error) {
      console.error('Error creating attendance:', error);
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
      const results = await Promise.all(
        records.map(async (record: any) => {
          // Try to find existing record first
          const existingRecord = await prisma.attendance.findFirst({
            where: {
              studentId: record.studentId,
              classId: record.classId,
              date: {
                gte: new Date(new Date(record.date).setHours(0, 0, 0, 0)),
                lt: new Date(new Date(record.date).setHours(23, 59, 59, 999))
              }
            }
          });

          if (existingRecord) {
            // Update existing record
            return prisma.attendance.update({
              where: { id: existingRecord.id },
              data: { status: record.status, notes: record.notes }
            });
          }

          // Create new record
          return prisma.attendance.create({
            data: {
              schoolId,
              studentId: record.studentId,
              classId: record.classId,
              date: new Date(record.date),
              status: record.status,
              notes: record.notes,
            }
          });
        })
      );

      res.status(201).json({
        message: `${results.length} attendance records created/updated`,
        count: results.length,
      });
    } catch (error) {
      console.error('Error bulk creating attendance:', error);
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
      const where: any = { schoolId };

      if (role === Role.STUDENT) {
        const student = await prisma.student.findFirst({
          where: { userId },
        });
        if (student) {
          where.studentId = student.id;
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

      const attendance = await prisma.attendance.findMany({ where });

      const totalRecords = attendance.length;
      const presentCount = attendance.filter((a) => a.status === 'present').length;
      const absentCount = attendance.filter((a) => a.status === 'absent').length;
      const lateCount = attendance.filter((a) => a.status === 'late').length;

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
      console.error('Error fetching attendance stats:', error);
      res.status(500).json({ error: 'Failed to fetch attendance statistics' });
    }
  }
);

export default router;
