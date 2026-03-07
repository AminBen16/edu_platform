// apps/api/src/routes/analytics.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';
import { Role } from '../lib/database';


const router = Router();

// Middleware to authorize only Admins and Super Admins for analytics
router.use(protect, authorize(Role.ADMIN, Role.SUPER_ADMIN));

// GET /analytics/overview - Get analytics overview for the school
router.get('/overview', async (req, res) => {
  const { schoolId } = req.user!;

  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalLessons,
      totalQuizzes,
      totalClasses,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { schoolId } }),
      prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
      prisma.user.count({ where: { schoolId, role: "TEACHER" } }),
      prisma.lesson.count({ where: { schoolId, isPublished: true } }),
      prisma.quiz.count({ where: { schoolId, isPublished: true } }),
      prisma.class.count({ where: { schoolId } }),
    ]);

    // Simplified weekly activity (last 7 days counts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivity = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        userId: { in: (await prisma.user.findMany({ 
          where: { schoolId },
          select: { id: true }
        })).map((u: { id: string }) => u.id) }
      },
      _count: true
    });

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalLessons,
      totalQuizzes,
      totalClasses,
      weeklyActivity: weeklyActivity.map((item: any) => ({
        date: new Date().toISOString().split('T')[0],
        count: (item as any)._count || 0,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
});

// GET /analytics/users - Get detailed user analytics for the school
router.get('/users', async (req, res) => {
  const { schoolId } = req.user!;

  try {
    const users = await prisma.user.findMany({
      where: { schoolId },
      include: {
        studentProfile: {
          include: {
            enrollments: true,
            quizAttempts: true
          }
        },
        teacherProfile: true
      }
    });

    const userAnalytics = users.map((user: any) => {
      let lessonsCompleted = 0;
      let quizzesTaken = 0;
      let averageScore = 0;

      if ((user as any).studentProfile) {
        const studentProfile = (user as any).studentProfile;
        lessonsCompleted = studentProfile.enrollments?.length || 0;
        quizzesTaken = studentProfile.quizAttempts?.length || 0;
        averageScore = quizzesTaken > 0
          ? studentProfile.quizAttempts.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / quizzesTaken
          : 0;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastActive: user.lastLoginAt,
        lessonsCompleted,
        quizzesTaken,
        averageScore: parseFloat(averageScore.toFixed(2)),
      };
    });

    res.json(userAnalytics);
  } catch (error) {
    console.error('Failed to fetch user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics.' });
  }
});

export default router;