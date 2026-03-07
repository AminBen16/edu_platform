// apps/api/src/routes/assignments.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import { Role } from '../lib/database';

const router = Router();

// GET /assignments - Get all assignments based on user role
router.get('/', protect, async (req, res) => {
    const { id: userId, role, schoolId } = req.user!;

    try {
        let assignments;
        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId } });
            if (!student) return res.status(404).json({ error: 'Student profile not found.' });

            // Find all classes the student is enrolled in
            const enrollments = await prisma.enrollment.findMany({
                where: { studentId: student.id },
                select: { classId: true }
            });
            const classIds = enrollments.map((e: { classId: string | null }) => e.classId).filter((id: string | null): id is string => id !== null);

            // Get all lessons assigned to those classes, then get assignments for those lessons
            assignments = await prisma.assignment.findMany({
                where: {
                    lesson: {
                        classId: { in: classIds as string[] }
                    }
                },
                include: { lesson: { select: { title: true, class: { select: { name: true } } } } },
                orderBy: { dueDate: 'asc' }
            });

        } else if (role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({ where: { userId } });
            if (!teacher) return res.status(404).json({ error: 'Teacher profile not found.' });
            
            assignments = await prisma.assignment.findMany({
                where: { teacherId: teacher.id },
                include: { lesson: { select: { title: true } }, _count: { select: { submissions: true } } },
                orderBy: { createdAt: 'desc' }
            });
        } else { // ADMIN or other higher roles
            assignments = await prisma.assignment.findMany({
                where: { lesson: { schoolId } },
                include: { lesson: { select: { title: true } }, teacher: { select: { user: { select: { name: true } } } } },
                orderBy: { createdAt: 'desc' }
            });
        }
        res.json(assignments);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});

// GET /assignments/:id - Get a single assignment with details
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const assignment = await prisma.assignment.findFirst({
            where: { id, lesson: { schoolId: req.user!.schoolId } },
            include: {
                lesson: true,
                teacher: { select: { user: { select: { name: true, email: true } } } },
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to load assignment' });
    }
});


// POST /assignments - Create a new assignment (Teachers and Admins)
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create assignments.' });
    }

    const { title, description, lessonId, dueDate, maxScore } = req.body;
    if (!title || !lessonId) {
        return res.status(400).json({ error: 'Title and lessonId are required.' });
    }

    try {
        const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id }});
        if (!teacher && req.user!.role === 'TEACHER') {
            return res.status(404).json({ error: 'Teacher profile not found.' });
        }

        // Verify lesson belongs to user's school
        const lesson = await prisma.lesson.findFirst({
            where: { id: lessonId, schoolId: req.user!.schoolId }
        });
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found in your school.' });
        }

        const newAssignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                maxScore: maxScore ? parseFloat(maxScore) : 100,
                lessonId,
                teacherId: teacher?.id,
            }
        });

        res.status(201).json(newAssignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment.' });
    }
});

// POST /assignments/:id/submit - Submit an assignment (Students only)
router.post('/:id/submit', protect, async (req, res) => {
    if (req.user!.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Only students can submit assignments.' });
    }
    const { id: assignmentId } = req.params;
    const { content, fileUrl } = req.body;

    try {
        const student = await prisma.student.findUnique({ where: { userId: req.user!.id }});
        if (!student) {
            return res.status(404).json({ error: 'Student profile not found.' });
        }

        // Verify assignment exists in student's school
        const assignment = await prisma.assignment.findFirst({
            where: { 
                id: assignmentId,
                lesson: { schoolId: req.user!.schoolId }
            }
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        const submission = await prisma.submission.create({
            data: {
                content,
                fileUrl,
                studentId: student.id,
                assignmentId,
            }
        });
        res.status(201).json(submission);
    } catch (error) {
        console.error('Assignment submission error:', error);
        res.status(500).json({ error: 'Failed to submit assignment.' });
    }
});

// GET /assignments/:id/submissions - Get all submissions for an assignment (Teachers and Admins)
router.get('/:id/submissions', protect, async (req, res) => {
     if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to view submissions.' });
    }
    const { id: assignmentId } = req.params;

    try {
        const submissions = await prisma.submission.findMany({
            where: {
                assignmentId,
                assignment: {
                    lesson: { schoolId: req.user!.schoolId }
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
    } catch (error) {
        console.error('Failed to get submissions:', error);
        res.status(500).json({ error: 'Failed to get submissions.' });
    }
});

// PUT /submissions/:submissionId/grade - Grade a submission (Teachers and Admins)
router.put('/submissions/:submissionId/grade', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to grade submissions.' });
    }
    const { submissionId } = req.params;
    const { score } = req.body;

    if (score === undefined) {
        return res.status(400).json({ error: 'Score is required.' });
    }

    try {
        // Verify submission belongs to user's school through assignment relation
        const submission = await prisma.submission.findFirst({
            where: {
                id: submissionId,
                assignment: {
                    lesson: { schoolId: req.user!.schoolId }
                }
            }
        });
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: { score: parseFloat(score) }
        });

        res.json(updatedSubmission);
    } catch (error) {
        console.error('Failed to grade submission:', error);
        res.status(500).json({ error: 'Failed to grade submission.' });
    }
});

export default router;
