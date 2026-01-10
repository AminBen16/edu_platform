// apps/api/src/routes/dashboard.ts
// Dashboard data aggregation for different user roles
import { Router, Response } from 'express';
import { protect, authorize, requirePermission } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /dashboard - Role-based dashboard data
router.get('/', protect, async (req: RequestWithUser, res: Response) => {
  const { role, id: userId, schoolId } = req.user!;

  try {
    let dashboardData = {};

    switch (role) {
      case 'STUDENT':
        dashboardData = await getStudentDashboard(userId, schoolId);
        break;
      case 'TEACHER':
        dashboardData = await getTeacherDashboard(userId, schoolId);
        break;
      case 'ADMIN':
      case 'SCHOOL_ADMIN':
        dashboardData = await getAdminDashboard(userId, schoolId);
        break;
      case 'PARENT':
        dashboardData = await getParentDashboard(userId, schoolId);
        break;
      case 'SUPER_ADMIN':
        dashboardData = await getSuperAdminDashboard(userId, schoolId);
        break;
      default:
        return res.status(403).json({ error: 'Invalid user role' });
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Student dashboard data
async function getStudentDashboard(studentId: string, schoolId: string) {
  const [enrollments, progress, upcomingClasses, completedAssignments, averageGrade] = await Promise.all([
    prisma.enrollment.findMany({
      where: { 
        studentId, 
        status: 'ACTIVE'
      },
      include: {
        Lesson: {
          select: { id: true, title: true, description: true }
        },
        class: {
          select: { id: true, name: true }
        }
      }
    }),
    getStudentProgress(studentId),
    getUpcomingClasses(studentId),
    getCompletedAssignments(studentId),
    getAverageGrade(studentId)
  ]);

  return {
    userRole: 'STUDENT',
    stats: {
      enrolledCourses: enrollments.length,
      averageProgress: progress.reduce((sum: number, p: any) => sum + (p.percentage || 0), 0) / progress.length,
      upcomingClasses: upcomingClasses.length,
      completedAssignments: completedAssignments, // Calculate from real data
      averageGrade: averageGrade // Calculate from real data
    },
    courses: enrollments.map((enrollment: any) => ({
      id: enrollment.lessonId,
      title: enrollment.Lesson?.title || `Course ${enrollment.lessonId}`,
      description: enrollment.Lesson?.description || 'Course description',
      thumbnail: 'https://via.placeholder.com/150x100?text=Course',
      progress: progress.find((p: any) => p.lessonId === enrollment.lessonId)?.percentage || 0,
      instructor: 'Teacher Name',
      duration: '8 weeks',
      enrolled: true
    })),
    upcomingClasses: upcomingClasses
  };
}

// Teacher dashboard data
async function getTeacherDashboard(teacherId: string, schoolId: string) {
  const [lessons, students, analytics, avgProgress, avgGrade] = await Promise.all([
    prisma.lesson.findMany({
      where: { 
        teacherId, 
        schoolId 
      }
    }),
    prisma.user.findMany({
      where: { 
        schoolId,
        role: 'STUDENT'
      }
    }),
    getTeacherAnalytics(teacherId),
    getTeacherAverageProgress(teacherId),
    getTeacherAverageGrade(teacherId)
  ]);

  return {
    userRole: 'TEACHER',
    stats: {
      totalCourses: lessons.length,
      totalStudents: students.length,
      averageClassSize: Math.floor(lessons.reduce((sum: number, lesson: any) => sum + 20, 0) / lessons.length), // Mock data
      activeClasses: lessons.filter((l: any) => true).length
    },
    courses: lessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      enrolledStudents: 25, // Mock data
      averageProgress: avgProgress, // Calculate from real data
      status: 'active'
    })),
    students: students.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      enrolledCourses: 5, // Mock data
      averageGrade: avgGrade // Calculate from real data
    })),
    analytics: analytics
  };
}

// Admin dashboard data
async function getAdminDashboard(userId: string, schoolId: string) {
  const [users, lessons, schools, analytics, activeUsers] = await Promise.all([
    prisma.user.count({ where: { schoolId } }),
    prisma.lesson.count({ where: { schoolId } }),
    prisma.school.findUnique({ where: { id: schoolId } }),
    getSchoolAnalytics(schoolId),
    getActiveUsersCount(schoolId)
  ]);

  return {
    userRole: 'ADMIN',
    stats: {
      totalUsers: users,
      totalCourses: lessons,
      totalSchools: schools ? 1 : 0,
      activeUsers: activeUsers, // Calculate from real data
      systemHealth: 'operational'
    },
    users: await getPaginatedUsers(schoolId, 1, 10), // Implement pagination
    courses: await getPaginatedCourses(schoolId, 1, 10), // Implement pagination
    schools: schools ? [schools] : [],
    analytics: analytics
  };
}

// Super Admin dashboard data
async function getSuperAdminDashboard(userId: string, schoolId: string) {
  const [totalUsers, totalLessons, totalSchools, recentActivity] = await Promise.all([
    // Global statistics
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.school.count(),
    // Recent activity (last 24 hours)
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  return {
    userRole: 'SUPER_ADMIN',
    stats: {
      totalUsers,
      totalCourses: totalLessons,
      totalSchools,
      activeUsers: Math.floor(totalUsers * 0.8),
      systemUptime: process.env.UPTIME || 'Unknown'
    },
    recentActivity,
    globalAnalytics: {
      userGrowth: 12.5, // TODO: Calculate from real data
      courseGrowth: 8.3, // TODO: Calculate from real data
      platformUsage: {
        dailyActiveUsers: 1500,
        totalClasses: 450,
        storageUsed: '2.3TB'
      }
    }
  };
}

// Parent dashboard data
async function getParentDashboard(parentId: string, schoolId: string) {
  const [children, enrollments] = await Promise.all([
    prisma.student.findMany({
      where: { 
        schoolId,
        parentEmail: parentId // Use parentEmail to find children
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    getParentNotifications(parentId)
  ]);

  return {
    userRole: 'PARENT',
    stats: {
      totalChildren: children.length,
      activeChildren: children.filter((child: any) => true).length,
      upcomingEvents: 3, // TODO: Calculate from real data
      averageGrade: 82 // TODO: Calculate from real data
    },
    children: children.map((child: any) => ({
      id: child.id,
      name: child.user?.name || 'Unknown',
      email: child.user?.email || 'Unknown',
      enrolledCourses: 5, // Mock data
      averageGrade: 78, // TODO: Calculate from real data
      courses: [
        {
          id: 'course-1',
          title: 'Mathematics',
          instructor: 'Teacher Name',
          progress: 65 // TODO: Calculate from real data
        }
      ]
    })),
    notifications: enrollments
  };
}

// Helper functions
async function getStudentProgress(studentId: string) {
  return [
    {
      courseId: 'course-1',
      percentage: 75,
      completedLessons: 15,
      timeSpent: 45
    },
    {
      courseId: 'course-2',
      percentage: 60,
      completedLessons: 12,
      timeSpent: 30
    }
  ];
}

async function getUpcomingClasses(studentId: string) {
  return [
    {
      id: 'class-1',
      title: 'Mathematics Class',
      time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      instructor: 'Teacher Name',
      joinUrl: '/live-class/class-1'
    }
  ];
}

async function getTeacherAnalytics(teacherId: string) {
  return {
    totalStudents: 150,
    averageProgress: 78,
    courseCompletion: 85,
    studentEngagement: 82
  };
}

async function getSchoolAnalytics(schoolId: string) {
  return {
    totalUsers: 500,
    totalCourses: 25,
    totalAssignments: 100,
    userEngagement: {
      dailyActive: Math.floor(500 * 0.8),
      weeklyActive: Math.floor(500 * 0.9),
      monthlyActive: 500
    },
    performance: {
      averageGrade: 82,
      completionRate: 85,
      retentionRate: 92
    }
  };
}

async function getParentNotifications(parentId: string) {
  return [
    {
      type: 'upcoming_class',
      title: 'Class Tomorrow: Mathematics',
      message: 'Your child has Mathematics class tomorrow at 10:00 AM',
      time: new Date().toISOString(),
      priority: 'medium'
    },
    {
      type: 'grade_alert',
      title: 'Grade Alert',
      message: 'Your child is struggling in Mathematics',
      time: new Date().toISOString(),
      priority: 'high'
    }
  ];
}

// Helper functions for real data calculations
async function getCompletedAssignments(studentId: string): Promise<number> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId }
    });

    if (!student) return 0;

    const completedSubmissions = await prisma.submission.count({
      where: {
        studentId: student.id,
        score: { not: null }
      }
    });

    return completedSubmissions;
  } catch (error) {
    console.error('Error calculating completed assignments:', error);
    return 0;
  }
}

async function getAverageGrade(studentId: string): Promise<number> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId }
    });

    if (!student) return 0;

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
        score: { not: null }
      },
      select: { score: true }
    });

    if (submissions.length === 0) return 0;

    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    return Math.round(totalScore / submissions.length);
  } catch (error) {
    console.error('Error calculating average grade:', error);
    return 0;
  }
}

async function getTeacherAverageProgress(teacherId: string): Promise<number> {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      include: {
        enrollments: {
          select: { studentId: true }
        }
      }
    });

    if (lessons.length === 0) return 0;

    let totalProgress = 0;
    let studentCount = 0;

    for (const lesson of lessons) {
      // Mock progress calculation - in real implementation, track lesson completion
      const lessonProgress = Math.random() * 100; // Replace with real progress tracking
      totalProgress += lessonProgress * lesson.enrollments.length;
      studentCount += lesson.enrollments.length;
    }

    return studentCount > 0 ? Math.round(totalProgress / studentCount) : 0;
  } catch (error) {
    console.error('Error calculating teacher average progress:', error);
    return 0;
  }
}

async function getTeacherAverageGrade(teacherId: string): Promise<number> {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      include: {
        assignments: {
          include: {
            submissions: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });

    let allGrades: number[] = [];

    for (const lesson of lessons) {
      for (const assignment of lesson.assignments) {
        for (const submission of assignment.submissions) {
          if (submission.score !== null) {
            allGrades.push(submission.score);
          }
        }
      }
    }

    if (allGrades.length === 0) return 0;

    const average = allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length;
    return Math.round(average);
  } catch (error) {
    console.error('Error calculating teacher average grade:', error);
    return 0;
  }
}

async function getActiveUsersCount(schoolId: string): Promise<number> {
  try {
    // Count users who have logged in within the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = await prisma.user.count({
      where: {
        schoolId: schoolId,
        isActive: true,
        lastLoginAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    return activeUsers;
  } catch (error) {
    console.error('Error calculating active users:', error);
    return 0;
  }
}

async function getPaginatedUsers(schoolId: string, page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;
    
    const users = await prisma.user.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }));
  } catch (error) {
    console.error('Error fetching paginated users:', error);
    return [];
  }
}

async function getPaginatedCourses(schoolId: string, page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;
    
    const lessons = await prisma.lesson.findMany({
      where: { schoolId },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        },
        teacher: {
          select: { id: true, user: { select: { name: true, email: true } } }
        },
        class: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      isPublished: lesson.isPublished,
      subject: lesson.subject,
      teacher: lesson.teacher?.user.name || 'Unknown',
      class: lesson.class?.name || 'No Class',
      enrolledStudents: lesson._count.enrollments,
      assignments: lesson._count.assignments,
      createdAt: lesson.createdAt
    }));
  } catch (error) {
    console.error('Error fetching paginated courses:', error);
    return [];
  }
}

export default router;
