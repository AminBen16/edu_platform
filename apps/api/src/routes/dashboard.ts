// apps/api/src/routes/dashboard.ts
// Dashboard data aggregation for different user roles
import { Router, Response } from 'express';
import { protect, authorize, requirePermission } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /dashboard - Role-based dashboard data
router.get('/', protect, async (req: RequestWithUser, res: Response) => {
  const { role, id: userId, schoolId, email, name } = req.user!;

  try {
    let dashboardData = {};

    switch (role) {
      case 'STUDENT':
        dashboardData = getStudentDashboardMock(userId, schoolId);
        break;
      case 'TEACHER':
        dashboardData = getTeacherDashboardMock(userId, schoolId);
        break;
      case 'ADMIN':
      case 'SCHOOL_ADMIN':
        dashboardData = getAdminDashboardMock(userId, schoolId);
        break;
      case 'PARENT':
        dashboardData = getParentDashboardMock(userId, schoolId);
        break;
      case 'SUPER_ADMIN':
        dashboardData = getSuperAdminDashboardMock(userId, schoolId);
        break;
      default:
        return res.status(403).json({ error: 'Invalid user role' });
    }

    // Include user information in response
    res.json({
      user: {
        id: userId,
        email,
        name,
        role,
        schoolId
      },
      ...dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Mock dashboard data for development
function getStudentDashboardMock(studentId: string, schoolId: string) {
  return {
    userRole: 'STUDENT',
    stats: {
      enrolledCourses: 2,
      averageProgress: 68,
      upcomingClasses: 1,
      completedAssignments: 12,
      averageGrade: 85
    },
    courses: [
      {
        id: '1',
        title: 'Mathematics 101',
        description: 'Introduction to Algebra and Geometry',
        thumbnail: 'https://via.placeholder.com/150x100?text=Math',
        progress: 75,
        instructor: 'Dr. Smith',
        duration: '8 weeks',
        enrolled: true
      },
      {
        id: '2',
        title: 'Science Fundamentals',
        description: 'Basic Physics and Chemistry',
        thumbnail: 'https://via.placeholder.com/150x100?text=Science',
        progress: 60,
        instructor: 'Prof. Johnson',
        duration: '10 weeks',
        enrolled: true
      }
    ],
    upcomingClasses: [
      {
        id: '1',
        title: 'Live Math Session',
        time: '2024-01-15 14:00',
        instructor: 'Dr. Smith',
        joinUrl: '/live-class/1'
      }
    ]
  };
}

function getTeacherDashboardMock(teacherId: string, schoolId: string) {
  return {
    userRole: 'TEACHER',
    stats: {
      myClasses: 4,
      totalStudents: 45,
      pendingGrades: 8,
      avgProgress: 72
    },
    courses: [
      {
        id: '1',
        title: 'Advanced Mathematics',
        description: 'Calculus and beyond',
        thumbnail: 'https://via.placeholder.com/150x100?text=Calc',
        students: 12,
        instructor: 'Dr. Smith',
        duration: '12 weeks'
      }
    ],
    upcomingClasses: []
  };
}

function getAdminDashboardMock(adminId: string, schoolId: string) {
  return {
    userRole: 'ADMIN',
    stats: {
      totalUsers: 234,
      activeSchools: 12,
      systemHealth: 98,
      pendingApprovals: 5
    },
    courses: [],
    upcomingClasses: []
  };
}

function getSuperAdminDashboardMock(adminId: string, schoolId: string) {
  return {
    userRole: 'SUPER_ADMIN',
    stats: {
      totalUsers: 234,
      activeSchools: 12,
      systemHealth: 98,
      pendingApprovals: 5
    },
    courses: [],
    upcomingClasses: []
  };
}

function getParentDashboardMock(parentId: string, schoolId: string) {
  return {
    userRole: 'PARENT',
    stats: {
      children: 2,
      avgGrade: 85,
      attendance: 92,
      messages: 3
    },
    courses: [],
    upcomingClasses: []
  };
}

export default router;
