// apps/api/src/routes/dashboard.ts
// Dashboard data aggregation for different user roles
import { Router, Response } from 'express';
import { protect, authorize, requirePermission } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /dashboard - Role-based dashboard data
router.get('/', protect, async (req, res) => {
  const { role, schoolId } = req.user!;

  try {
    let dashboardData = {};

    switch (role) {
      case 'STUDENT':
        dashboardData = await getStudentDashboard(req.user.id, schoolId);
        break;
      case 'TEACHER':
        dashboardData = await getTeacherDashboard(req.user.id, schoolId);
        break;
      case 'ADMIN':
      case 'SCHOOL_ADMIN':
        dashboardData = await getAdminDashboard(req.user.id, schoolId);
        break;
      case 'SUPER_ADMIN':
        dashboardData = await getSuperAdminDashboard(req.user.id, schoolId);
        break;
      case 'PARENT':
        dashboardData = await getParentDashboard(req.user.id, schoolId);
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
  const [enrollments, progress, upcomingClasses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, isActive: true },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true
          }
        }
      }
    }),
    getStudentProgress(studentId),
    getUpcomingClasses(studentId)
  ]);

  return {
    userRole: 'STUDENT',
    stats: {
      enrolledCourses: enrollments.length,
      averageProgress: progress.reduce((sum, p) => sum + p.percentage, 0) / progress.length,
      upcomingClasses: upcomingClasses.length,
      completedAssignments: 0, // TODO: Implement
      averageGrade: 85 // TODO: Calculate from real data
    },
    courses: enrollments.map(e => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      thumbnail: e.course.thumbnail,
      progress: progress.find(p => p.courseId === e.course.id)?.percentage || 0,
      instructor: e.course.instructor?.name || 'Unknown',
      duration: `${e.course.duration || 8} weeks`,
      enrolled: true
    })),
    upcomingClasses: upcomingClasses
  };
}

// Teacher dashboard data
async function getTeacherDashboard(teacherId: string, schoolId: string) {
  const [courses, students, analytics] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: teacherId, schoolId },
      include: {
        enrollments: {
          select: { count: true },
          where: { isActive: true }
        }
      }
    }),
    prisma.user.findMany({
      where: { 
        schoolId,
        role: { in: ['STUDENT'] },
        enrollments: {
          some: {
            course: { instructorId: teacherId }
          }
        }
      }
    }),
    getTeacherAnalytics(teacherId)
  ]);

  return {
    userRole: 'TEACHER',
    stats: {
      totalCourses: courses.length,
      totalStudents: students.length,
      averageClassSize: courses.reduce((sum, course) => sum + (course.enrollments?.count || 0), 0) / courses.length,
      activeClasses: courses.filter(c => c.enrollments?.some(e => e.isActive)).length
    },
    courses: courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      enrolledStudents: course.enrollments?.length || 0,
      averageProgress: 75, // TODO: Calculate from real data
      status: 'active'
    })),
    students: students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      enrolledCourses: student.enrollments?.length || 0,
      averageGrade: 80 // TODO: Calculate from real data
    })),
    analytics: analytics
  };
}

// Admin dashboard data
async function getAdminDashboard(adminId: string, schoolId: string) {
  const [users, courses, schools, analytics] = await Promise.all([
    prisma.user.count({ where: { schoolId } }),
    prisma.course.count({ where: { schoolId } }),
    prisma.school.findUnique({ where: { id: schoolId } }),
    getSchoolAnalytics(schoolId)
  ]);

  return {
    userRole: 'ADMIN',
    stats: {
      totalUsers: users,
      totalCourses: courses,
      totalSchools: schools ? 1 : 0,
      activeUsers: Math.floor(users * 0.7), // TODO: Calculate from real data
      systemHealth: 'operational'
    },
    users: [], // TODO: Implement pagination
    courses: [], // TODO: Implement pagination
    schools: schools ? [schools] : [],
    analytics: analytics
  };
}

// Super Admin dashboard data
async function getSuperAdminDashboard(adminId: string, schoolId: string) {
  const [globalStats, recentActivity] = await Promise.all([
    // Global statistics
    prisma.user.count(),
    prisma.course.count(),
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
      totalUsers: globalStats[0],
      totalCourses: globalStats[1],
      totalSchools: globalStats[2],
      activeUsers: Math.floor(globalStats[0] * 0.8),
      systemUptime: process.env.UPTIME || 'Unknown'
    },
    recentActivity: recentActivity,
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
    prisma.user.findMany({
      where: { 
        parentId: parentId,
        schoolId
      },
      include: {
        enrollments: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
                instructor: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    }),
    getParentNotifications(parentId)
  ]);

  return {
    userRole: 'PARENT',
    stats: {
      totalChildren: children.length,
      activeChildren: children.filter(child => 
        child.enrollments?.some(e => e.isActive)
      ).length,
      upcomingEvents: 3, // TODO: Calculate from real data
      averageGrade: 82 // TODO: Calculate from real data
    },
    children: children.map(child => ({
      id: child.id,
      name: child.name,
      email: child.email,
      enrolledCourses: child.enrollments?.length || 0,
      averageGrade: 78, // TODO: Calculate from real data
      courses: child.enrollments?.map(e => ({
        id: e.course.id,
        title: e.course.title,
        instructor: e.course.instructor?.name || 'Unknown',
        progress: 65 // TODO: Calculate from real data
      })) || []
    })),
    notifications: enrollments
  };
}

// Helper functions
async function getStudentProgress(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    include: {
      course: true
    }
  });

  return enrollments.map(enrollment => ({
    courseId: enrollment.courseId,
    percentage: Math.floor(Math.random() * 30) + 70, // TODO: Calculate from real data
    completedLessons: Math.floor(Math.random() * 20) + 10, // TODO: Calculate from real data
    timeSpent: Math.floor(Math.random() * 60) + 30 // TODO: Calculate from real data
  }));
}

async function getUpcomingClasses(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    include: {
      course: {
        include: {
          classes: {
            where: {
              startTime: { gte: new Date() },
              instructor: {
                select: { name: true }
              }
            }
          }
        }
      }
    }
  });

  const upcomingClasses = enrollments
    .filter(e => e.course.classes?.some(cls => 
      new Date(cls.startTime) > new Date()
    ))
    .map(e => ({
      id: e.course.classes![0].id,
      title: e.course.title,
      time: e.course.classes![0].startTime,
      instructor: e.course.classes![0].instructor?.name || 'Unknown',
      joinUrl: `/live-class/${e.course.classes![0].id}`
    }));

  return upcomingClasses;
}

async function getTeacherAnalytics(teacherId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId: teacherId },
    include: {
      enrollments: true
    }
  });

  const totalStudents = courses.reduce((sum, course) => 
    sum + (course.enrollments?.length || 0), 0
  );

  const averageProgress = courses.reduce((sum, course) => {
    const courseProgress = course.enrollments?.reduce((courseSum, enrollment) => 
      courseSum + (enrollment.progress || 0), 0
    ) / (course.enrollments?.length || 1);
    return sum + courseProgress;
  }, 0) / courses.length;

  return {
    totalStudents,
    averageProgress,
    courseCompletion: 85, // TODO: Calculate from real data
    studentEngagement: 78 // TODO: Calculate from real data
  };
}

async function getSchoolAnalytics(schoolId: string) {
  const [users, courses, assignments] = await Promise.all([
    prisma.user.count({ where: { schoolId } }),
    prisma.course.count({ where: { schoolId } }),
    prisma.assignment.count({ where: { 
      course: { schoolId }
    } })
  ]);

  return {
    totalUsers: users,
    totalCourses: courses,
    totalAssignments: assignments,
    userEngagement: {
      dailyActive: Math.floor(users * 0.8),
      weeklyActive: Math.floor(users * 0.9),
      monthlyActive: users
    },
    performance: {
      averageGrade: 82,
      completionRate: 85,
      retentionRate: 92
    }
  };
}

async function getParentNotifications(parentId: string) {
  const children = await prisma.user.findMany({
    where: { parentId: parentId },
    include: {
      enrollments: {
        select: {
          course: {
            select: { title: true }
          }
        }
      }
    }
  });

  const notifications = [];

  for (const child of children) {
    for (const enrollment of child.enrollments || []) {
      if (enrollment.course) {
        // Check for upcoming classes
        const upcomingClass = enrollment.course.classes?.find(cls => 
          new Date(cls.startTime) > new Date()
        );

        if (upcomingClass) {
          notifications.push({
            type: 'upcoming_class',
            title: `Class Tomorrow: ${upcomingClass.course.title}`,
            message: `${child.name} has ${upcomingClass.course.title} tomorrow at ${upcomingClass.startTime}`,
            time: upcomingClass.startTime,
            priority: 'medium'
          });
        }

        // Check for low grades
        if (enrollment.progress && enrollment.progress < 60) {
          notifications.push({
            type: 'grade_alert',
            title: 'Grade Alert',
            message: `${child.name} is struggling in ${enrollment.course.title}`,
            time: new Date().toISOString(),
            priority: 'high'
          });
        }
      }
    }
  }

  return notifications;
}

export default router;
