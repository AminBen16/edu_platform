"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/reports.ts
// Professional reports management with export functionality
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
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
    // Get real data for reports
    const [totalUsers, totalLessons, totalQuizzes, totalAttempts, averageScore, recentLogins] = await Promise.all([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.lesson.count({ where: { schoolId, isPublished: true } }),
        database_1.prisma.quiz.count({ where: { schoolId, isPublished: true } }),
        database_1.prisma.quizAttempt.count({ where: { schoolId } }),
        database_1.prisma.quizAttempt.aggregate({
            where: { schoolId },
            _avg: { score: true }
        }),
        database_1.prisma.auditLog.count({
            where: {
                schoolId,
                action: 'LOGIN',
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        })
    ]);
    // Get active users (logged in last 7 days)
    const activeUsers = await database_1.prisma.user.count({
        where: {
            schoolId,
            lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
    });
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
                averageScore: Math.round((averageScore._avg?.score || 0) * 100) / 100,
                generatedAt: new Date()
            }
        },
        {
            id: 'user-activity',
            title: 'User Activity Report',
            type: 'activity',
            description: 'Detailed user engagement and activity metrics',
            data: {
                activeUsers,
                totalLoginsThisWeek: recentLogins,
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
                averageCompletionRate: Math.round((totalLessons > 0 ? (totalAttempts / totalLessons) * 100 : 0) * 100) / 100,
                averageGrade: Math.round((averageScore._avg?.score || 0) * 100) / 100,
                topPerformingSubjects: [],
                generatedAt: new Date()
            }
        }
    ];
}
async function generateTeacherReports(schoolId, teacherId) {
    // Get teacher's lessons
    const lessons = await database_1.prisma.lesson.findMany({
        where: { teacherId },
        select: { id: true, classId: true }
    });
    const lessonIds = lessons.map(l => l.id);
    const classIds = lessons.map(l => l.classId).filter(Boolean);
    // Get quiz attempts for teacher's quizzes
    const attempts = await database_1.prisma.$queryRaw `
      SELECT 
        qa.id,
        qa.score,
        qa."quizId",
        qa."userId",
        qa.createdAt
      FROM "QuizAttempt" qa
      JOIN "Quiz" q ON qa."quizId" = q.id
      WHERE q."teacherId" = ${teacherId}
    `;
    // Get attendance for teacher's classes
    const attendance = classIds.length > 0
        ? await database_1.prisma.attendance.findMany({
            where: { classId: { in: classIds } },
            select: { status: true }
        })
        : [];
    const totalPresent = attendance.filter((a) => a.status === 'PRESENT').length;
    const averageAttendance = attendance.length > 0
        ? Math.round((totalPresent / attendance.length) * 100)
        : 0;
    // Calculate average score from attempts
    const averageStudentScore = attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
        : 0;
    return [
        {
            id: 'teacher-performance',
            title: 'Teaching Performance',
            type: 'performance',
            description: 'Your teaching effectiveness and student engagement',
            data: {
                totalLessons: lessons.length,
                totalStudents: new Set(attempts.map((attempt) => attempt.userId)).size,
                averageStudentScore: Math.round(averageStudentScore * 100) / 100,
                generatedAt: new Date()
            }
        },
        {
            id: 'class-attendance',
            title: 'Class Attendance',
            type: 'attendance',
            description: 'Attendance records for your classes',
            data: {
                averageAttendance,
                totalClasses: classIds.length,
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
    // Generate PDF using PDFKit
    const fileName = `${report.id}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default();
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            // Add report content
            doc.fontSize(20).text(report.title || 'Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
            doc.moveDown();
            // Add report data
            if (report.data) {
                doc.fontSize(14).text('Report Data:');
                doc.fontSize(10);
                const data = report.data;
                Object.entries(data).forEach(([key, value]) => {
                    if (key !== 'generatedAt' && key !== 'topActiveUsers' && key !== 'topPerformingSubjects' && key !== 'subjectBreakdown') {
                        doc.text(`${key}: ${JSON.stringify(value)}`);
                    }
                });
            }
            doc.end();
            stream.on('finish', () => {
                resolve(filePath);
            });
            stream.on('error', (err) => {
                reject(err);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
async function generateCSVReport(report) {
    const fileName = `${report.id}_${Date.now()}.csv`;
    const filePath = path.join(tempDir, fileName);
    const csvContent = convertToCSV(report.data);
    // Write CSV to file
    fs.writeFileSync(filePath, csvContent, 'utf-8');
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
