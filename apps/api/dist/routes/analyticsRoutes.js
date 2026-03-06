"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const database_1 = require("../lib/database");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.protect, async (req, res) => {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
        return res.status(400).json({ message: 'School ID not found in user session.' });
    }
    try {
        const [totalStudents, totalTeachers, totalLessons, totalQuizzes, recentActivity, usersWithEnrollmentData,] = await Promise.all([
            prisma.user.count({ where: { schoolId, role: database_1.Role.STUDENT } }),
            prisma.user.count({ where: { schoolId, role: database_1.Role.TEACHER } }),
            prisma.lesson.count({ where: { schoolId } }),
            prisma.quiz.count({ where: { schoolId } }),
            prisma.auditLog.findMany({
                where: {
                    schoolId: schoolId, // Explicitly cast to any to resolve type issue
                    action: {
                        in: [database_1.AuditLogAction.USER_LOGIN, database_1.AuditLogAction.LESSON_VIEWED, database_1.AuditLogAction.QUIZ_ATTEMPTED]
                    }
                }, // Cast to any
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
        const userAnalytics = usersWithEnrollmentData.map((user) => {
            let lessonsCompleted = 0;
            let quizzesTaken = 0;
            let averageQuizScore = 0;
            if (user.studentProfile) {
                lessonsCompleted = user.studentProfile.enrollments.reduce((sum, e) => sum + (e.Lesson || []).length, 0);
                quizzesTaken = user.studentProfile.quizAttempts.length;
                if (quizzesTaken > 0) {
                    averageQuizScore = user.studentProfile.quizAttempts.reduce((sum, qa) => sum + (qa.score || 0), 0) / quizzesTaken;
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
    }
    catch (error) {
        console.error('Failed to fetch dashboard analytics:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
    }
});
exports.default = router;
