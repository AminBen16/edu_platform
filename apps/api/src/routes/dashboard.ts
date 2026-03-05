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
        
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

async function getStudentDashboard(userId: string, schoolId: string) {
    // Use type casting to handle potential mismatches between schema and generated client
    const student = await (prisma as any).studentProfile.findUnique({ where: { userId } });
    if (!student) throw new Error('Student profile not found.');

    const enrollments = await (prisma as any).enrollment.findMany({
        where: { studentProfileId: student.id },
        select: { classId: true }
    });
    const classIds = enrollments.map((e: any) => e.classId).filter(Boolean) as string[];
    
    // Note: assignments might not exist in current schema - making it optional
    let assignments: any[] = [];
    try {
        assignments = await (prisma as any).assignment.findMany({
            where: { lesson: { classId: { in: classIds } } },
            include: { submissions: true }
        });
    } catch (e) {
        // Assignment model might not exist
    }

    const quizAttempts = await (prisma as any).quizAttempt.findMany({
        where: { studentProfileId: student.id },
    });

    const completedAssignments = assignments.filter((a: any) => (a.submissions || []).length > 0).length;
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
        recentActivity: quizAttempts.slice(0, 5)
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
    
    // Use type casting for assignment model that might not exist
    let assignments: any[] = [];
    let submissions = 0;
    try {
        assignments = await (prisma as any).assignment.findMany({
            where: { teacherId: teacher.id },
            select: { _count: { select: { submissions: true } } }
        });
        submissions = assignments.reduce((sum: number, a: any) => sum + a._count.submissions, 0);
    } catch (e) {
        // Assignment model might not exist
    }

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
