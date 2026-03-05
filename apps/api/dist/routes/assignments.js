"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/assignments.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// GET /assignments - Get all assignments based on user role
router.get('/', auth_1.protect, async (req, res) => {
    const { id: userId, role, schoolId } = req.user;
    try {
        let assignments;
        if (role === database_2.Role.STUDENT) {
            const student = await database_1.prisma.student.findUnique({ where: { userId } });
            if (!student)
                return res.status(404).json({ error: 'Student profile not found.' });
            // Find all classes the student is enrolled in
            const enrollments = await database_1.prisma.enrollment.findMany({
                where: { studentId: student.id },
                select: { classId: true }
            });
            const classIds = enrollments.map(e => e.classId).filter(id => id !== null);
            // Get all lessons assigned to those classes, then get assignments for those lessons
            assignments = await database_1.prisma.assignment.findMany({
                where: {
                    lesson: {
                        classId: { in: classIds }
                    }
                },
                include: { lesson: { select: { title: true, class: { select: { name: true } } } } },
                orderBy: { dueDate: 'asc' }
            });
        }
        else if (role === database_2.Role.TEACHER) {
            const teacher = await database_1.prisma.teacher.findUnique({ where: { userId } });
            if (!teacher)
                return res.status(404).json({ error: 'Teacher profile not found.' });
            assignments = await database_1.prisma.assignment.findMany({
                where: { teacherId: teacher.id },
                include: { lesson: { select: { title: true } }, _count: { select: { submissions: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }
        else { // ADMIN or other higher roles
            assignments = await database_1.prisma.assignment.findMany({
                where: { lesson: { schoolId } },
                include: { lesson: { select: { title: true } }, teacher: { select: { user: { select: { name: true } } } } },
                orderBy: { createdAt: 'desc' }
            });
        }
        res.json(assignments);
    }
    catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});
// GET /assignments/:id - Get a single assignment with details
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const assignment = await database_1.prisma.assignment.findFirst({
            where: { id, lesson: { schoolId: req.user.schoolId } },
            include: {
                lesson: true,
                teacher: { select: { user: { select: { name: true, email: true } } } },
            }
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        res.json(assignment);
    }
    catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to load assignment' });
    }
});
// POST /assignments - Create a new assignment (Teachers and Admins)
router.post('/', auth_1.protect, async (req, res) => {
    if (req.user.role !== database_2.Role.TEACHER && req.user.role !== database_2.Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to create assignments.' });
    }
    const { title, description, lessonId, dueDate, maxScore } = req.body;
    if (!title || !lessonId) {
        return res.status(400).json({ error: 'Title and lessonId are required.' });
    }
    try {
        const teacher = await database_1.prisma.teacher.findUnique({ where: { userId: req.user.id } });
        if (!teacher && req.user.role === database_2.Role.TEACHER) {
            return res.status(404).json({ error: 'Teacher profile not found.' });
        }
        const newAssignment = await database_1.prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                maxScore: maxScore ? parseFloat(maxScore) : 100,
                lessonId,
                teacherId: teacher?.id, // Can be null if admin creates it
            }
        });
        // TODO: Add notification logic here
        res.status(201).json(newAssignment);
    }
    catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment.' });
    }
});
// POST /assignments/:id/submit - Submit an assignment (Students only)
router.post('/:id/submit', auth_1.protect, async (req, res) => {
    if (req.user.role !== database_2.Role.STUDENT) {
        return res.status(403).json({ error: 'Only students can submit assignments.' });
    }
    const { id: assignmentId } = req.params;
    const { content, fileUrl } = req.body;
    try {
        const student = await database_1.prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ error: 'Student profile not found.' });
        }
        // TODO: Check if student is enrolled in the lesson/class for this assignment
        const submission = await database_1.prisma.submission.create({
            data: {
                content,
                fileUrl,
                studentId: student.id,
                assignmentId
            }
        });
        res.status(201).json(submission);
    }
    catch (error) {
        console.error('Assignment submission error:', error);
        res.status(500).json({ error: 'Failed to submit assignment.' });
    }
});
// GET /assignments/:id/submissions - Get all submissions for an assignment (Teachers and Admins)
router.get('/:id/submissions', auth_1.protect, async (req, res) => {
    if (req.user.role !== database_2.Role.TEACHER && req.user.role !== database_2.Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to view submissions.' });
    }
    const { id: assignmentId } = req.params;
    try {
        const submissions = await database_1.prisma.submission.findMany({
            where: {
                assignmentId,
                assignment: {
                    lesson: { schoolId: req.user.schoolId }
                }
            },
            include: {
                student: {
                    select: { user: { select: { id: true, name: true, avatarUrl: true } } }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Failed to get submissions:', error);
        res.status(500).json({ error: 'Failed to get submissions.' });
    }
});
// PUT /submissions/:submissionId/grade - Grade a submission (Teachers and Admins)
router.put('/submissions/:submissionId/grade', auth_1.protect, async (req, res) => {
    if (req.user.role !== database_2.Role.TEACHER && req.user.role !== database_2.Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to grade submissions.' });
    }
    const { submissionId } = req.params;
    const { score } = req.body;
    if (score === undefined) {
        return res.status(400).json({ error: 'Score is required.' });
    }
    try {
        const updatedSubmission = await database_1.prisma.submission.update({
            where: { id: submissionId },
            data: { score: parseFloat(score) }
        });
        // TODO: Notify student about the grade
        res.json(updatedSubmission);
    }
    catch (error) {
        console.error('Failed to grade submission:', error);
        res.status(500).json({ error: 'Failed to grade submission.' });
    }
});
exports.default = router;
