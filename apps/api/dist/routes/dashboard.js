"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/dashboard.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// GET /dashboard - Role-based dashboard data aggregation
router.get('/', auth_1.protect, async (req, res) => {
    const { role, id: userId, schoolId } = req.user;
    try {
        // Get full user info
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, schoolId: true, avatarUrl: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        let dashboardData = {};
        if (role === 'STUDENT') {
            dashboardData = await getStudentDashboard(userId, schoolId);
        }
        else if (role === 'TEACHER') {
            dashboardData = await getTeacherDashboard(userId, schoolId);
        }
        else if (role === 'ADMIN') {
            dashboardData = await getAdminDashboard(schoolId);
        }
        else if (role === 'SUPER_ADMIN') {
            dashboardData = await getSuperAdminDashboard();
        }
        else if (role === 'PARENT') {
            dashboardData = await getParentDashboard(userId, schoolId);
        }
        else {
            return res.status(403).json({ error: 'Invalid user role for dashboard access.' });
        }
        res.json({
            user: user,
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
        include: {
            class: {
                include: {
                    teacher: { include: { user: true } }
                }
            }
        }
    });
    const classIds = enrollments.map((e) => e.classId).filter(Boolean);
    // Get enrolled classes with details (for courses list)
    const courses = enrollments.map((enrollment) => ({
        id: enrollment.class?.id || '',
        title: enrollment.class?.name || 'Unknown Class',
        instructor: enrollment.class?.teacher?.user?.name || 'TBA',
        thumbnail: '',
        progress: 0,
        duration: '',
    }));
    // Get upcoming live sessions for enrolled classes
    const upcomingClasses = await database_1.prisma.liveSession.findMany({
        where: {
            classId: { in: classIds },
            isActive: true,
            startTime: { gte: new Date() }
        },
        take: 5,
        orderBy: { startTime: 'asc' }
    });
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
            upcomingClasses: upcomingClasses.length,
        },
        courses, // For mobile course list
        upcomingClasses: upcomingClasses.map((cls) => ({
            id: cls.id,
            title: cls.title,
            time: cls.startTime.toISOString(),
        })),
        recentActivity: quizAttempts.slice(0, 5)
    };
}
async function getTeacherDashboard(userId, schoolId) {
    const teacher = await database_1.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
        throw new Error('Teacher profile not found.');
    const classes = await database_1.prisma.class.findMany({
        where: { teacherId: teacher.id },
        select: { id: true, name: true, _count: { select: { enrollments: true } } }
    });
    const totalStudents = classes.reduce((sum, c) => sum + c._count.enrollments, 0);
    // Get pending submissions (assignments without grades)
    const pendingSubmissions = await database_1.prisma.submission.count({
        where: {
            assignment: { teacherId: teacher.id },
            score: null
        }
    });
    // Get upcoming live sessions
    const upcomingSessions = await database_1.prisma.liveSession.count({
        where: {
            teacherId: teacher.id,
            isActive: true,
            startTime: { gte: new Date() }
        }
    });
    // Get total lessons created
    const lessonsCount = await database_1.prisma.lesson.count({
        where: { teacherId: teacher.id }
    });
    return {
        stats: {
            classCount: classes.length,
            totalStudents,
            totalSubmissions: pendingSubmissions,
            lessonsCount,
            upcomingSessions,
        },
    };
}
async function getAdminDashboard(schoolId) {
    const [userCount, teacherCount, studentCount, classCount, activeUsers, lessonsCount, quizzesCount, announcementsCount] = await database_1.prisma.$transaction([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
        database_1.prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
        database_1.prisma.class.count({ where: { schoolId } }),
        database_1.prisma.user.count({ where: { schoolId, isActive: true } }),
        database_1.prisma.lesson.count({ where: { schoolId } }),
        database_1.prisma.quiz.count({ where: { schoolId } }),
        database_1.prisma.announcement.count({ where: { schoolId } })
    ]);
    return {
        stats: {
            totalUsers: userCount,
            teacherCount,
            studentCount,
            classCount,
            activeUsers,
            lessonsCount,
            quizzesCount,
            announcementsCount,
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
// Parent dashboard - shows their children's progress
async function getParentDashboard(userId, schoolId) {
    // Find students linked to this parent via parentEmail
    const parentUser = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!parentUser)
        throw new Error('Parent user not found.');
    // Find children (students whose parentEmail matches this user's email)
    const children = await database_1.prisma.student.findMany({
        where: { parentEmail: parentUser.email },
        include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
        }
    });
    if (children.length === 0) {
        return {
            stats: {
                childrenCount: 0,
                averageGrade: 0,
                totalAttendance: 0,
            },
            children: []
        };
    }
    const childIds = children.map(c => c.id);
    // Get quiz attempts for all children
    const quizAttempts = await database_1.prisma.quizAttempt.findMany({
        where: { studentId: { in: childIds } }
    });
    // Get attendance for all children
    const attendance = await database_1.prisma.attendance.findMany({
        where: { studentId: { in: childIds } }
    });
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const totalAttendance = attendance.length;
    const attendancePercent = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    const averageGrade = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
        : 0;
    // Build children data with their individual stats
    const childrenData = await Promise.all(children.map(async (child) => {
        const childQuizAttempts = quizAttempts.filter(a => a.studentId === child.id);
        const childAttendance = attendance.filter(a => a.studentId === child.id);
        const childAvgGrade = childQuizAttempts.length > 0
            ? childQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / childQuizAttempts.length
            : 0;
        const childPresent = childAttendance.filter(a => a.status === 'PRESENT').length;
        const childTotal = childAttendance.length;
        const childAttendancePercent = childTotal > 0 ? (childPresent / childTotal) * 100 : 0;
        // Get enrollments
        const enrollments = await database_1.prisma.enrollment.findMany({
            where: { studentId: child.id },
            include: { class: true }
        });
        return {
            id: child.id,
            name: child.user.name,
            email: child.user.email,
            avatarUrl: child.user.avatarUrl,
            grade: child.grade,
            averageGrade: parseFloat(childAvgGrade.toFixed(2)),
            attendancePercent: parseFloat(childAttendancePercent.toFixed(2)),
            enrolledClasses: enrollments.length,
        };
    }));
    return {
        stats: {
            childrenCount: children.length,
            averageGrade: parseFloat(averageGrade.toFixed(2)),
            totalAttendance: parseFloat(attendancePercent.toFixed(2)),
        },
        children: childrenData
    };
}
exports.default = router;
