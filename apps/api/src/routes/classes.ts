// Classes management routes
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';

const router = Router();

// GET /classes - Get all classes for a school
router.get('/', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    
    const classes = await prisma.class.findMany({
      where: { schoolId: user.schoolId },
      include: {
        teacher: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: { select: { enrollments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /classes/:id - Get specific class with details
router.get('/:id', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const classData = await prisma.class.findFirst({
      where: { 
        id,
        schoolId: user.schoolId 
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true }
                }
              }
            }
          }
        },
        lessons: {
          select: { id: true, title: true, type: true, isPublished: true }
        },
        _count: { select: { enrollments: true, lessons: true } }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /classes - Create new class
router.post('/', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { name, code, grade, capacity, teacherId, subjects, schedule, room } = req.body;

    if (!name || !grade) {
      return res.status(400).json({ error: 'Class name and grade are required' });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        code: code || `${grade}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        grade,
        capacity: capacity || 30,
        teacherId,
        schoolId: user.schoolId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PUT /classes/:id - Update class
router.put('/:id', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const updates = req.body;

    // Check if class belongs to user's school
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: user.schoolId }
    });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updates,
      include: {
        teacher: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE /classes/:id - Delete class
router.delete('/:id', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Check if class belongs to user's school
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: user.schoolId }
    });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    await prisma.class.delete({
      where: { id }
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// POST /classes/:id/students - Add students to class
router.post('/:id/students', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { studentIds } = req.body;

    // Check if class belongs to user's school
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: user.schoolId }
    });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Create enrollments for students
    const enrollmentPromises = studentIds.map((studentId: string) => 
      prisma.enrollment.create({
        data: {
          studentId,
          classId: id,
          enrolledAt: new Date(),
        }
      })
    );

    await Promise.all(enrollmentPromises);

    res.json({ message: 'Students added to class successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add students to class' });
  }
});

// DELETE /classes/:id/students/:studentId - Remove student from class
router.delete('/:id/students/:studentId', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    const { id, studentId } = req.params;

    // Check if class belongs to user's school
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: user.schoolId }
    });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Remove student enrollment
    await prisma.enrollment.deleteMany({
      where: {
        studentId,
        classId: id,
      }
    });

    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove student from class' });
  }
});

export default router;
