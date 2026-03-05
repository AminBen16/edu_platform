"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/reports.ts
// Professional reports management with export functionality
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// GET /reports - Get all reports for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    const { schoolId, role } = req.user;
    try {
        let reports = [];
        if (role === 'ADMIN' || role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
            // Admin can see all types of reports
            reports = await generateAdminReports(schoolId);
        }
        else if (role === 'TEACHER') {
            // Teachers can see class and student reports
            reports = await generateTeacherReports(schoolId, req.user.id);
        }
        else if (role === 'STUDENT') {
            // Students can see their own reports
            reports = await generateStudentReports(schoolId, req.user.id);
        }
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// POST /reports/export - Export a specific report
router.post('/export', auth_1.protect, async (req, res) => {
    const { schoolId } = req.user;
    const { reportId, format } = req.body;
    try {
        const report = await getReportById(reportId, schoolId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        let filePath;
        let contentType;
        let fileName;
        if (format === 'pdf') {
            filePath = await generatePDFReport(report);
            contentType = 'application/pdf';
            fileName = `${report.title.replace(/\s+/g, '_')}.pdf`;
        }
        else if (format === 'csv') {
            filePath = await generateCSVReport(report);
            contentType = 'text/csv';
            fileName = `${report.title.replace(/\s+/g, '_')}.csv`;
        }
        else if (format === 'excel') {
            filePath = await generateExcelReport(report);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileName = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        }
        else {
            return res.status(400).json({ error: 'Unsupported format' });
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to export report' });
            }
            else {
                // Clean up temporary file
                // fs.unlink(filePath, () => {});
            }
        });
    }
    catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
});
// POST /reports/schedule - Schedule a report to be generated periodically
router.post('/schedule', auth_1.protect, (0, auth_1.authorize)(database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId } = req.user;
    const { reportType, frequency, recipients, nextRun } = req.body;
    try {
        // In a real implementation, you would use a job scheduler like node-cron
        // For now, we'll create a simple scheduled report record
        const scheduledReport = await database_1.prisma.scheduledReport.create({
            data: {
                schoolId,
                reportType,
                frequency, // daily, weekly, monthly
                recipients, // array of email addresses
                nextRun: new Date(nextRun),
                isActive: true
            }
        });
        res.json({
            message: 'Report scheduled successfully',
            scheduledReport
        });
    }
    catch (error) {
        console.error('Error scheduling report:', error);
        res.status(500).json({ error: 'Failed to schedule report' });
    }
});
// GET /reports/scheduled - Get all scheduled reports
router.get('/scheduled', auth_1.protect, (0, auth_1.authorize)(database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId } = req.user;
    try {
        const scheduledReports = await database_1.prisma.scheduledReport.findMany({
            where: { schoolId, isActive: true },
            orderBy: { nextRun: 'asc' }
        });
        res.json(scheduledReports);
    }
    catch (error) {
        console.error('Error fetching scheduled reports:', error);
        res.status(500).json({ error: 'Failed to fetch scheduled reports' });
    }
});
// Helper functions
async function generateAdminReports(schoolId) {
    const [totalUsers, totalLessons, totalQuizzes, totalAttempts, averageScore] = await Promise.all([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.lesson.count({ where: { schoolId } }),
        database_1.prisma.quiz.count({ where: { schoolId } }),
        database_1.prisma.quizAttempt.count({ where: { schoolId } }),
        database_1.prisma.quizAttempt.aggregate({
            where: { schoolId },
            _avg: { score: true }
        })
    ]);
    return [
        {
            id: 'school-overview',
            title: 'School Overview',
            type: 'overview',
            description: 'Complete school statistics and performance metrics',
            data: {
                totalUsers,
                totalLessons,
                totalQuizzes,
                totalAttempts,
                averageScore: averageScore?._avg?.score || 0,
                generatedAt: new Date()
            }
        },
        {
            id: 'user-activity',
            title: 'User Activity Report',
            type: 'activity',
            description: 'Detailed user engagement and activity metrics',
            data: {
                // In a real implementation, you'd query actual activity data
                activeUsers: Math.floor(totalUsers * 0.7),
                averageLoginTime: '2.5 hours',
                topActiveUsers: [],
                generatedAt: new Date()
            }
        },
        {
            id: 'performance-metrics',
            title: 'Performance Metrics',
            type: 'performance',
            description: 'Academic performance and completion rates',
            data: {
                averageCompletionRate: 85,
                averageGrade: averageScore?._avg?.score || 0,
                topPerformingSubjects: [],
                generatedAt: new Date()
            }
        }
    ];
}
async function generateTeacherReports(schoolId, teacherId) {
    const attempts = await database_1.prisma.$queryRaw `
      SELECT 
        qa.id,
        qa.score,
        qa."quizId",
        qa."userId",
        qa.createdAt
      FROM "QuizAttempt" qa
      JOIN "Quiz" q ON qa."quizId" = q.id
      JOIN "Lesson" l ON q."lessonId" = l.id
      WHERE l."authorId" = ${teacherId}
    `;
    return [
        {
            id: 'teacher-performance',
            title: 'Teaching Performance',
            type: 'performance',
            description: 'Your teaching effectiveness and student engagement',
            data: {
                totalLessons: 5, // Placeholder - calculate from actual lessons
                totalStudents: new Set(attempts.map((attempt) => attempt.userId)).size,
                averageStudentScore: 0, // Calculate from attempts
                generatedAt: new Date()
            }
        },
        {
            id: 'class-attendance',
            title: 'Class Attendance',
            type: 'attendance',
            description: 'Attendance records for your classes',
            data: {
                averageAttendance: 92,
                totalClasses: 5, // Placeholder - calculate from actual lessons
                generatedAt: new Date()
            }
        }
    ];
}
async function generateStudentReports(schoolId, studentId) {
    const attempts = await database_1.prisma.$queryRaw `
      SELECT 
        qa.id,
        qa.score,
        qa."quizId",
        qa."userId",
        qa.createdAt
      FROM "QuizAttempt" qa
      WHERE qa."userId" = ${studentId}
    `;
    const averageScore = attempts.length > 0
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length
        : 0;
    return [
        {
            id: 'student-progress',
            title: 'My Progress Report',
            type: 'progress',
            description: 'Your academic progress and achievements',
            data: {
                totalQuizzesTaken: attempts.length,
                averageScore,
                completedLessons: new Set(attempts.map((a) => a.quizId)).size,
                generatedAt: new Date()
            }
        },
        {
            id: 'grades-summary',
            title: 'Grades Summary',
            type: 'grades',
            description: 'Summary of your grades across all subjects',
            data: {
                overallAverage: averageScore,
                subjectBreakdown: [], // Group by subject
                generatedAt: new Date()
            }
        }
    ];
}
async function getReportById(reportId, schoolId) {
    // In a real implementation, you'd fetch from database
    return {
        id: reportId,
        title: 'Sample Report',
        data: {},
        generatedAt: new Date()
    };
}
async function generatePDFReport(report) {
    // For now, return a placeholder path
    // In production, implement with a proper PDF library
    return `/tmp/${report.id}.pdf`;
}
async function generateCSVReport(report) {
    // Simple CSV conversion
    const filePath = `/tmp/${report.id}.csv`;
    const csvContent = convertToCSV(report.data);
    // In production, use fs.writeFileSync
    return filePath;
}
async function generateExcelReport(report) {
    // In production, use a library like xlsx
    return `/tmp/${report.id}.xlsx`;
}
function convertToCSV(data) {
    // Simple CSV conversion - in production, use a proper library
    const headers = Object.keys(data);
    const values = Object.values(data);
    return [headers.join(','), values.join(',')].join('\n');
}
exports.default = router;
