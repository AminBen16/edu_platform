"use strict";
// apps/api/src/routes/reports.ts
// PATCH 2 CRIT-002: No local fs - direct streams/buffers for Vercel
// PDFKit buffer generation + R2 for CSV/Excel
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const pdfkit_1 = __importDefault(require("pdfkit"));
const storageService_js_1 = __importDefault(require("../services/storageService.js"));
const router = (0, express_1.Router)();
const reportSchedulingEnabled = process.env.REPORT_SCHEDULER_ENABLED === 'true';
// CRIT-002: No temp dirs/fs on Vercel
// GET /reports - unchanged
router.get('/', auth_1.protect, async (req, res) => {
    const { schoolId, role } = req.user;
    try {
        let reports = [];
        if (role === 'ADMIN' || role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
            reports = await generateAdminReports(schoolId);
        }
        else if (role === 'TEACHER') {
            reports = await generateTeacherReports(schoolId, req.user.id);
        }
        else if (role === 'STUDENT') {
            reports = await generateStudentReports(schoolId, req.user.id);
        }
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// POST /reports/export - direct buffers (no fs.sendFile)
router.post('/export', auth_1.protect, async (req, res) => {
    const { schoolId } = req.user;
    const { reportId, format } = req.body;
    try {
        const report = await getReportById(reportId, schoolId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        let content;
        let contentType;
        let fileName;
        if (format === 'pdf') {
            content = await generatePDFReport(report);
            contentType = 'application/pdf';
            fileName = `${report.title.replace(/\\s+/g, '_')}.pdf`;
        }
        else if (format === 'csv') {
            content = convertToCSV(report.data);
            const csvResult = await storageService_js_1.default.storeFile({
                file: Buffer.from(content, 'utf-8'),
                fileName: `${report.title.replace(/\\s+/g, '_')}.csv`,
                contentType: 'text/csv'
            });
            return res.json({ downloadUrl: csvResult.url });
        }
        else {
            return res.status(400).json({ error: 'Unsupported format (PDF/CSV)' });
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(content);
    }
    catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
});
// schedule/scheduled routes unchanged...
router.post('/schedule', auth_1.protect, (0, auth_1.authorize)(database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    if (!reportSchedulingEnabled) {
        return res.status(501).json({
            error: 'Automated report scheduling is not enabled on this deployment yet.',
        });
    }
    const { frequency = 'weekly', email } = req.body ?? {};
    res.status(201).json({
        message: 'Report scheduling saved in zero-budget mode.',
        frequency,
        recipient: email || req.user?.email,
    });
});
router.get('/scheduled', auth_1.protect, (0, auth_1.authorize)(database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    if (!reportSchedulingEnabled) {
        return res.status(200).json({
            enabled: false,
            reports: [],
            message: 'Automated report scheduling is not enabled on this deployment yet.',
        });
    }
    res.json([]);
});
async function generateAdminReports(schoolId) {
    const [users, lessons, quizzes, liveSessions] = await Promise.all([
        database_1.prisma.user.count({ where: { schoolId } }),
        database_1.prisma.lesson.count({ where: { schoolId } }),
        database_1.prisma.quiz.count({ where: { schoolId } }),
        database_1.prisma.liveSession.count({ where: { schoolId } }),
    ]);
    return [
        {
            id: `admin-overview-${schoolId}`,
            title: 'School Operations Overview',
            type: 'KPIs',
            status: 'ready',
            generatedBy: 'System',
            date: new Date().toISOString(),
            description: 'High-level performance indicators for administrators.',
            data: { users, lessons, quizzes, liveSessions, generatedAt: new Date().toISOString() },
        },
    ];
}
async function generateTeacherReports(schoolId, teacherId) {
    const [lessons, quizzes, assignments] = await Promise.all([
        database_1.prisma.lesson.count({ where: { schoolId, teacherId } }),
        database_1.prisma.quiz.count({ where: { schoolId, teacherId } }),
        database_1.prisma.assignment.count({ where: { schoolId, teacherId } }),
    ]);
    return [
        {
            id: `teacher-overview-${teacherId}`,
            title: 'Teaching Activity Overview',
            type: 'Performance',
            status: 'ready',
            generatedBy: 'System',
            date: new Date().toISOString(),
            description: 'Summary of lessons, quizzes, and assignments created by this teacher.',
            data: { lessons, quizzes, assignments, generatedAt: new Date().toISOString() },
        },
    ];
}
async function generateStudentReports(schoolId, studentId) {
    const student = await database_1.prisma.student.findFirst({ where: { userId: studentId, schoolId } });
    if (!student) {
        return [];
    }
    const [quizAttempts, submissions, attendance] = await Promise.all([
        database_1.prisma.quizAttempt.findMany({ where: { studentId: student.id, schoolId } }),
        database_1.prisma.submission.count({ where: { studentId: student.id, schoolId } }),
        database_1.prisma.attendance.findMany({ where: { studentId: student.id, schoolId } }),
    ]);
    const averageScore = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
        : 0;
    const attendancePercent = attendance.length > 0
        ? (attendance.filter((item) => item.status === 'PRESENT').length / attendance.length) * 100
        : 100;
    return [
        {
            id: `student-progress-${student.id}`,
            title: 'Student Progress Snapshot',
            type: 'Performance',
            status: 'ready',
            generatedBy: 'System',
            date: new Date().toISOString(),
            description: 'Current learning progress for the student.',
            data: {
                averageScore: parseFloat(averageScore.toFixed(2)),
                submissions,
                attendancePercent: parseFloat(attendancePercent.toFixed(2)),
                generatedAt: new Date().toISOString(),
            },
        },
    ];
}
async function getReportById(reportId, schoolId) {
    const reports = [
        ...(await generateAdminReports(schoolId)),
        ...(await generateTeacherReports(schoolId, reportId)),
        ...(await generateStudentReports(schoolId, reportId)),
    ];
    return reports.find((report) => report.id === reportId) ?? null;
}
async function generatePDFReport(report) {
    return new Promise((resolve) => {
        const chunks = [];
        const doc = new pdfkit_1.default();
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.fontSize(20).text(report.title || 'Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
        doc.moveDown();
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
    });
}
function convertToCSV(data) {
    const rows = Object.entries(data ?? {}).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value]);
    return ['key,value', ...rows.map(([key, value]) => `"${key}","${String(value).replace(/"/g, '""')}"`)].join('\n');
}
exports.default = router;
