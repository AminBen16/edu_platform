// apps/api/src/routes/dashboard.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const router = Router();

// GET /dashboard - Role-based dashboard data aggregation
router.get('/', protect, async (req, res) => {
    const { role, id: userId, schoolId } = req.user!;

    try {
        let dashboardData = {};

        if (role === Role.STUDENT) {
            dashboardData = await getStudentDashboard(userId, schoolId);
        } else if (role === Role.TEACHER) {
            dashboardData = await getTeacherDashboard(userId, schoolId);
        } else if (role === Role.ADMIN) {
            dashboardData = await getAdminDashboard(schoolId);
        } else if (role === Role.SUPER_ADMIN) {
            dashboardData = await getSuperAdminDashboard();
        } else {
             return res.status(403).json({ error: 'Invalid user role for dashboard access.' });
        }

        res.json({
            user: { id: userId, role, schoolId },
            ...dashboardData,
        });

    } catch (error) {
        console.error(`Dashboard error for role ${role}:`, error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

async function getStudentDashboard(userId: string, schoolId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student profile not found.');

    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        select: { classId: true }
    });
    const classIds = enrollments.map((e: { classId: string | null }) => e.classId).filter(Boolean) as string[];
    
    const assignments = await prisma.assignment.findMany({
        where: { lesson: { classId: { in: classIds } } },
        include: { submissions: { where: { studentId: student.id } } } 
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
        where: { studentId: student.id },
    });

    const completedAssignments = assignments.filter((a: any) => a.submissions.length > 0).length;
    const totalAssignments = assignments.length;
    
    const averageGrade = quizAttempts.length > 0 
        ? quizAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / quizAttempts.length
        : 0;

    return {
        stats: {
            enrolledCourses: classIds.length,
            completedAssignments,
            totalAssignments,
            averageGrade: parseFloat(averageGrade.toFixed(2)),
        },
        recentActivity: quizAttempts.slice(0, 5) // Last 5 quiz attempts
    };
}

async function getTeacherDashboard(userId: string, schoolId: string) {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new Error('Teacher profile not found.');
    
    const classes = await prisma.class.findMany({
        where: { teacherId: teacher.id },
        select: { id: true, _count: { select: { enrollments: true } } }
    });

    const totalStudents = classes.reduce((sum: number, c: any) => sum + c._count.enrollments, 0);
    
    const assignments = await prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        select: { _count: { select: { submissions: true } } }
    });

    const submissions = assignments.reduce((sum: number, a: any) => sum + a._count.submissions, 0);

    return {
        stats: {
            classCount: classes.length,
            totalStudents,
            totalSubmissions: submissions,
        },
    };
}

async function getAdminDashboard(schoolId: string) {
    const [userCount, teacherCount, studentCount, classCount] = await prisma.$transaction([
        prisma.user.count({ where: { schoolId } }),
        prisma.user.count({ where: { schoolId, role: Role.TEACHER } }),
        prisma.user.count({ where: { schoolId, role: Role.STUDENT } }),
        prisma.class.count({ where: { schoolId } })
    ]);

    return {
        stats: {
            totalUsers: userCount,
            teacherCount,
            studentCount,
            classCount
        }
    };
}

async function getSuperAdminDashboard() {
    const [schoolCount, userCount, lessonCount, quizCount] = await prisma.$transaction([
        prisma.school.count(),
        prisma.user.count(),
        prisma.lesson.count(),
        prisma.quiz.count()
    ]);

    return {
        stats: {
            totalSchools: schoolCount,
            totalUsers: userCount,
            totalLessons: lessonCount,
            totalQuizzes: quizCount,
        }
    };
}

export default router;
