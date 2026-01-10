"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/dashboard.ts
// Dashboard data aggregation for different user roles
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// GET /dashboard - Role-based dashboard data
router.get('/', auth_1.protect, async (req, res) => {
    const { role, userId, schoolId } = req.user;
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
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});
// Student dashboard data
async function getStudentDashboard(studentId, schoolId) {
    const [enrollments, progress, upcomingClasses] = await Promise.all([
        database_1.prisma.enrollment.findMany({
            where: {
                studentId,
                status: 'ACTIVE'
            }
        }),
        getStudentProgress(studentId),
        getUpcomingClasses(studentId)
    ]);
    return {
        userRole: 'STUDENT',
        stats: {
            enrolledCourses: enrollments.length,
            averageProgress: progress.reduce((sum, p) => sum + (p.percentage || 0), 0) / progress.length,
            upcomingClasses: upcomingClasses.length,
            completedAssignments: 0, // TODO: Calculate from real data
            averageGrade: 85 // TODO: Calculate from real data
        },
        courses: enrollments.map((enrollment) => ({
            id: enrollment.courseId,
            title: `Course ${enrollment.courseId}`,
            description: 'Course description',
            thumbnail: 'https://via.placeholder.com/150x100?text=Course',
            progress: progress.find((p) => p.courseId === enrollment.courseId)?.percentage || 0,
            instructor: 'Teacher Name',
            duration: '8 weeks',
            enrolled: true
        })),
        upcomingClasses: upcomingClasses
    };
}
// Teacher dashboard data
async function getTeacherDashboard(teacherId, schoolId) {
    const [courses, students, analytics] = await Promise.all([
        database_1.prisma.course.findMany({
            where: {
                instructorId: teacherId,
                schoolId
            }
        }),
        database_1.prisma.user.findMany({
            where: {
                schoolId,
                role: 'STUDENT'
            }
        }),
        getTeacherAnalytics(teacherId)
    ]);
    return {
        userRole: 'TEACHER',
        stats: {
            totalCourses: courses.length,
            totalStudents: students.length,
            averageClassSize: Math.floor(courses.reduce((sum, course) => sum + 20, 0) / courses.length), // Mock data
            activeClasses: courses.filter((c) => true).length
        },
        courses: courses.map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            enrolledStudents: 25, // Mock data
            averageProgress: 75, // TODO: Calculate from real data
            status: 'active'
        })),
        students: students.map((student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            enrolledCourses: 5, // Mock data
            averageGrade: 80 // TODO: Calculate from real data
        })),
        analytics: analytics
    };
}
// Admin dashboard data
async function getAdminDashboard(userId, schoolId) {
    const [users, courses, schools, analytics] = await Promise.all([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.course.count({ where: { schoolId } }),
        database_1.prisma.school.findUnique({ where: { id: schoolId } }),
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
async function getSuperAdminDashboard(userId, schoolId) {
    const [globalStats, recentActivity] = await Promise.all([
        // Global statistics
        database_1.prisma.user.count(),
        database_1.prisma.course.count(),
        database_1.prisma.school.count(),
        // Recent activity (last 24 hours)
        database_1.prisma.user.findMany({
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
async function getParentDashboard(parentId, schoolId) {
    const [children, enrollments] = await Promise.all([
        database_1.prisma.user.findMany({
            where: {
                parentId: parentId,
                schoolId
            }
        }),
        getParentNotifications(parentId)
    ]);
    return {
        userRole: 'PARENT',
        stats: {
            totalChildren: children.length,
            activeChildren: children.filter((child) => true).length,
            upcomingEvents: 3, // TODO: Calculate from real data
            averageGrade: 82 // TODO: Calculate from real data
        },
        children: children.map((child) => ({
            id: child.id,
            name: child.name,
            email: child.email,
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
async function getStudentProgress(studentId) {
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
async function getUpcomingClasses(studentId) {
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
async function getTeacherAnalytics(teacherId) {
    return {
        totalStudents: 150,
        averageProgress: 78,
        courseCompletion: 85,
        studentEngagement: 82
    };
}
async function getSchoolAnalytics(schoolId) {
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
async function getParentNotifications(parentId) {
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
exports.default = router;
