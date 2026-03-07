import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { protect } from '../middleware/auth';
import { Role, AuditLogAction } from '../lib/database';

const prisma = new PrismaClient();
const router = Router();

router.get('/dashboard', protect, async (req, res) => {
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    return res.status(400).json({ message: 'School ID not found in user session.' });
  }

  try {
    const [
      totalStudents,
      totalTeachers,
      totalLessons,
      totalQuizzes,
      recentActivity,
      usersWithEnrollmentData,
    ] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: Role.STUDENT } }),
      prisma.user.count({ where: { schoolId, role: Role.TEACHER } }),
      prisma.lesson.count({ where: { schoolId } }),
      prisma.quiz.count({ where: { schoolId } }),
      prisma.auditLog.findMany({
        where: {
          schoolId: schoolId, // Explicitly cast to any to resolve type issue
          action: {
            in: [AuditLogAction.USER_LOGIN, AuditLogAction.LESSON_VIEWED, AuditLogAction.QUIZ_ATTEMPTED]
          }
        } as any, // Cast to any
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true, role: true } } }
      }),
      prisma.user.findMany({
        where: {
          schoolId,
          studentProfile: {
            is: {
              enrollments: {
                some: {}
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: {
            include: {
              enrollments: {
                select: {
                  Lesson: {
                    select: {
                      id: true
                    }
                  }
                }
              },
              quizAttempts: {
                select: {
                  score: true
                }
              }
            }
          }
        }
      })
    ]);

    // Process lessons completed and quizzes taken for each user
    const userAnalytics = usersWithEnrollmentData.map((user: any) => {
      let lessonsCompleted = 0;
      let quizzesTaken = 0;
      let averageQuizScore = 0;

      if (user.studentProfile) {
        lessonsCompleted = user.studentProfile.enrollments.reduce((sum: number, e: any) => sum + ((e.Lesson || []) as Array<{ id: string }>).length, 0);
        quizzesTaken = user.studentProfile.quizAttempts.length;
        if (quizzesTaken > 0) {
          averageQuizScore = user.studentProfile.quizAttempts.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / quizzesTaken;
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        lessonsCompleted,
        quizzesTaken,
        averageQuizScore,
      };
    });

    res.json({
      totalStudents,
      totalTeachers,
      totalLessons,
      totalQuizzes,
      recentActivity,
      userAnalytics,
    });

  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
});

export default router;
