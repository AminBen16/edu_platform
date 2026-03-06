"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/dashboard.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// GET /dashboard - Role-based dashboard data aggregation
router.get('/', auth_1.protect, async (req, res) => {
    const { role, id: userId, schoolId } = req.user;
    try {
        let dashboardData = {};
        if (role === database_2.Role.STUDENT) {
            dashboardData = await getStudentDashboard(userId, schoolId);
        }
        else if (role === database_2.Role.TEACHER) {
            dashboardData = await getTeacherDashboard(userId, schoolId);
        }
        else if (role === database_2.Role.ADMIN) {
            dashboardData = await getAdminDashboard(schoolId);
        }
        else if (role === database_2.Role.SUPER_ADMIN) {
            dashboardData = await getSuperAdminDashboard();
        }
        else {
            return res.status(403).json({ error: 'Invalid user role for dashboard access.' });
        }
        res.json({
            user: { id: userId, role, schoolId },
            ...dashboardData,
        });
    }
    catch (error) {
        console.error(`Dashboard error for role ${role}:`, error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});
async function getStudentDashboard(userId, schoolId) {
    const student = await database_1.prisma.student.findUnique({ where: { userId } });
    if (!student)
        throw new Error('Student profile not found.');
    const enrollments = await database_1.prisma.enrollment.findMany({
        where: { studentId: student.id },
        select: { classId: true }
    });
    const classIds = enrollments.map((e) => e.classId).filter(Boolean);
    const assignments = await database_1.prisma.assignment.findMany({
        where: { lesson: { classId: { in: classIds } } },
        include: { submissions: { where: { studentId: student.id } } }
    });
    const quizAttempts = await database_1.prisma.quizAttempt.findMany({
        where: { studentId: student.id },
    });
    const completedAssignments = assignments.filter((a) => a.submissions.length > 0).length;
    const totalAssignments = assignments.length;
    const averageGrade = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
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
async function getTeacherDashboard(userId, schoolId) {
    const teacher = await database_1.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
        throw new Error('Teacher profile not found.');
    const classes = await database_1.prisma.class.findMany({
        where: { teacherId: teacher.id },
        select: { id: true, _count: { select: { enrollments: true } } }
    });
    const totalStudents = classes.reduce((sum, c) => sum + c._count.enrollments, 0);
    const assignments = await database_1.prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        select: { _count: { select: { submissions: true } } }
    });
    const submissions = assignments.reduce((sum, a) => sum + a._count.submissions, 0);
    return {
        stats: {
            classCount: classes.length,
            totalStudents,
            totalSubmissions: submissions,
        },
    };
}
async function getAdminDashboard(schoolId) {
    const [userCount, teacherCount, studentCount, classCount] = await database_1.prisma.$transaction([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.user.count({ where: { schoolId, role: database_2.Role.TEACHER } }),
        database_1.prisma.user.count({ where: { schoolId, role: database_2.Role.STUDENT } }),
        database_1.prisma.class.count({ where: { schoolId } })
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
    const [schoolCount, userCount, lessonCount, quizCount] = await database_1.prisma.$transaction([
        database_1.prisma.school.count(),
        database_1.prisma.user.count(),
        database_1.prisma.lesson.count(),
        database_1.prisma.quiz.count()
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
exports.default = router;
