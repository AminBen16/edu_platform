// Assignment management system
import { Router, Response, Request } from 'express';
import { protect, authorize, requirePermission } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /assignments - Get assignments for user
router.get('/', protect, async (req, res) => {
  const { role, userId, schoolId } = req.user!;

  try {
    let assignments = [];

    switch (role) {
      case 'STUDENT':
        assignments = await getStudentAssignments(userId);
        break;
      case 'TEACHER':
        assignments = await getTeacherAssignments(userId);
        break;
      case 'ADMIN':
      case 'SCHOOL_ADMIN':
        assignments = await getAdminAssignments(schoolId);
        break;
      default:
        return res.status(403).json({ error: 'Invalid user role for assignments' });
    }

    res.json({
      assignments,
      userRole: role,
      total: assignments.length
    });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

// POST /assignments - Create new assignment
router.post('/', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('assignments.write'), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, points, type } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId,
        dueDate: new Date(dueDate),
        points: points || 100,
        type: type || 'homework',
        createdBy: req.user!.id
      }
    });

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, isActive: true },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // TODO: Send real notifications
    for (const enrollment of enrollments) {
      console.log(`Assignment created for student: ${enrollment.student.name}`);
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /assignments/:id - Update assignment
router.put('/:id', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('assignments.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, points } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        points
      }
    });

    res.json(assignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /assignments/:id - Delete assignment
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('assignments.write'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.assignment.delete({
      where: { id }
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// GET /assignments/:id - Get single assignment
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: { title: true },
          instructor: { select: { name: true } }
        },
        submissions: {
          where: { userId },
          include: {
            student: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check access permissions
    const hasAccess = role === 'TEACHER' && assignment.course.instructorId === userId ||
                   role === 'ADMIN' || role === 'SCHOOL_ADMIN' ||
                   (role === 'STUDENT' && assignment.submissions?.some(sub => sub.studentId === userId));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to load assignment' });
  }
});

// Helper functions
async function getStudentAssignments(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    include: {
      course: {
        include: {
          assignments: {
            where: { dueDate: { gte: new Date() } },
            orderBy: { dueDate: 'asc' }
          }
        }
      }
    }
  });

  const assignments = enrollments.flatMap(enrollment => 
    enrollment.course.assignments || []
  );

  return assignments;
}

async function getTeacherAssignments(teacherId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId: teacherId },
    include: {
      assignments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return courses.flatMap(course => course.assignments || []);
}

async function getAdminAssignments(schoolId: string) {
  return await prisma.assignment.findMany({
    where: {
      course: { schoolId }
    },
    include: {
      course: {
        select: { title: true },
        instructor: { select: { name: true } }
      },
      submissions: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export default router;
