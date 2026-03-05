"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/analytics.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// Middleware to authorize only Admins and Super Admins for analytics
router.use(auth_1.protect, (0, auth_1.authorize)(database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN));
// GET /analytics/overview - Get analytics overview for the school
router.get('/overview', async (req, res) => {
    const { schoolId } = req.user;
    try {
        const [totalUsers, totalStudents, totalTeachers, totalLessons, totalQuizzes, totalClasses,] = await database_1.prisma.$transaction([
            database_1.prisma.user.count({ where: { schoolId } }),
            database_1.prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
            database_1.prisma.user.count({ where: { schoolId, role: "TEACHER" } }),
            database_1.prisma.lesson.count({ where: { schoolId, isPublished: true } }),
            database_1.prisma.quiz.count({ where: { schoolId, isPublished: true } }),
            database_1.prisma.class.count({ where: { schoolId } }),
        ]);
        // Simplified weekly activity (last 7 days counts)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyActivity = await database_1.prisma.auditLog.groupBy({
            by: ['action'],
            where: {
                createdAt: { gte: sevenDaysAgo },
                userId: { in: (await database_1.prisma.user.findMany({
                        where: { schoolId },
                        select: { id: true }
                    })).map(u => u.id) }
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
            weeklyActivity: weeklyActivity.map((item) => ({
                date: new Date().toISOString().split('T')[0],
                count: item._count || 0,
            })),
        });
    }
    catch (error) {
        console.error('Failed to fetch analytics overview:', error);
        res.status(500).json({ error: 'Failed to fetch analytics overview.' });
    }
});
// GET /analytics/users - Get detailed user analytics for the school
router.get('/users', async (req, res) => {
    const { schoolId } = req.user;
    try {
        const users = await database_1.prisma.user.findMany({
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
        const userAnalytics = users.map(user => {
            let lessonsCompleted = 0;
            let quizzesTaken = 0;
            let averageScore = 0;
            if (user.studentProfile) {
                const studentProfile = user.studentProfile;
                lessonsCompleted = studentProfile.enrollments?.length || 0;
                quizzesTaken = studentProfile.quizAttempts?.length || 0;
                averageScore = quizzesTaken > 0
                    ? studentProfile.quizAttempts.reduce((sum, qa) => sum + (qa.score || 0), 0) / quizzesTaken
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
    }
    catch (error) {
        console.error('Failed to fetch user analytics:', error);
        res.status(500).json({ error: 'Failed to fetch user analytics.' });
    }
});
exports.default = router;
