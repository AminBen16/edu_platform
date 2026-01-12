// apps/api/src/routes/download.ts
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../config/database';
import { Role } from '../lib/database';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import { Readable } from 'stream';

const router = Router();

// Supabase Storage client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to check if user can access a school-scoped resource
const canAccessSchoolResource = async (userId: string, resourceSchoolId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return user.schoolId === resourceSchoolId;
};

// GET /download/file/:bucket/:path(*) - Download a file from Supabase Storage
router.get('/file/:bucket/:path(*)', protect, async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: 'Storage service not configured.' });
    }

    const { bucket, path } = req.params;
    const user = req.user!;

    try {
        // Basic security check: ensure user has access to the school for this file
        // This assumes that the bucket name or a prefix in the path corresponds to schoolId
        // Further granular checks might be needed based on specific file access policies
        if (!path.startsWith(`${user.schoolId}/`)) {
            return res.status(403).json({ error: 'Access denied: File does not belong to your school context.' });
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);

        if (error) {
            console.error('Supabase download error:', error);
            return res.status((error as any).statusCode || 500).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'File data not found.' });
        }

        const filename = path.split('/').pop() || 'download';
        const buffer = Buffer.from(await data.arrayBuffer());
        const contentType = getContentType(filename);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        
        res.send(buffer);
    } catch (err) {
        console.error('Download file error:', err);
        res.status(500).json({ error: 'Failed to download file.' });
    }
});

// GET /download/lesson/:id - Download lesson content as PDF
router.get('/lesson/:id', protect, async (req, res) => {
    const { id } = req.params;
    const user = req.user!;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: { subject: true, teacher: { include: { user: true } }, class: true }
        });

        if (!lesson || !(await canAccessSchoolResource(user.id, lesson.schoolId))) {
            return res.status(404).json({ error: 'Lesson not found or you do not have access.' });
        }
        
        // Ensure only enrolled students, teachers, or admins can download
        if (user.role === Role.STUDENT) {
            const isEnrolled = await prisma.enrollment.findFirst({
                where: { userId: user.id, lessonId: lesson.id }
            });
            if (!isEnrolled) {
                return res.status(403).json({ error: 'You are not enrolled in this lesson.' });
            }
        } else if (user.role === Role.TEACHER && lesson.teacherId !== (await prisma.teacher.findUnique({ where: { userId: user.id } }))?.id) {
            return res.status(403).json({ error: 'You are not the teacher of this lesson.' });
        }


        const pdfBuffer = await generateLessonPDF(lesson);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${lesson.title.replace(/\s/g, '_')}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Lesson PDF generation error:', err);
        res.status(500).json({ error: 'Failed to generate lesson PDF.' });
    }
});

// GET /download/quiz/:id - Download quiz as PDF
router.get('/quiz/:id', protect, async (req, res) => {
    const { id } = req.params;
    const user = req.user!;

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: { subject: true, teacher: { include: { user: true } } }
        });

        if (!quiz || !(await canAccessSchoolResource(user.id, quiz.schoolId))) {
            return res.status(404).json({ error: 'Quiz not found or you do not have access.' });
        }

        // Ensure only enrolled students, teachers, or admins can download
        if (user.role === Role.STUDENT) {
            const hasAttempted = await prisma.quizAttempt.count({
                where: { userId: user.id, quizId: quiz.id }
            });
            if (hasAttempted === 0) {
                return res.status(403).json({ error: 'You have not attempted this quiz.' });
            }
        } else if (user.role === Role.TEACHER && quiz.teacherId !== (await prisma.teacher.findUnique({ where: { userId: user.id } }))?.id) {
            return res.status(403).json({ error: 'You are not the teacher of this quiz.' });
        }

        const pdfBuffer = await generateQuizPDF(quiz);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/\s/g, '_')}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Quiz PDF generation error:', err);
        res.status(500).json({ error: 'Failed to generate quiz PDF.' });
    }
});

// GET /download/assignment/:id - Download assignment as PDF
router.get('/assignment/:id', protect, async (req, res) => {
    const { id } = req.params;
    const user = req.user!;

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: { lesson: true, teacher: { include: { user: true } } }
        });

        if (!assignment || !(await canAccessSchoolResource(user.id, assignment.lesson?.schoolId || ''))) {
            return res.status(404).json({ error: 'Assignment not found or you do not have access.' });
        }
        
        // Ensure only enrolled students, teachers, or admins can download
        if (user.role === Role.STUDENT) {
             const isEnrolledInLesson = await prisma.enrollment.findFirst({
                where: { userId: user.id, lessonId: assignment.lessonId }
            });
            if (!isEnrolledInLesson) {
                return res.status(403).json({ error: 'You are not enrolled in the lesson for this assignment.' });
            }
        } else if (user.role === Role.TEACHER && assignment.teacherId !== (await prisma.teacher.findUnique({ where: { userId: user.id } }))?.id) {
            return res.status(403).json({ error: 'You are not the teacher of this assignment.' });
        }

        const pdfBuffer = await generateAssignmentPDF(assignment);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.title.replace(/\s/g, '_')}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Assignment PDF generation error:', err);
        res.status(500).json({ error: 'Failed to generate assignment PDF.' });
    }
});

// GET /download/submissions/:assignmentId - Download all assignment submissions as ZIP
router.get('/submissions/:assignmentId', protect, authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
    const { assignmentId } = req.params;
    const user = req.user!;

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { 
                lesson: true,
                submissions: {
                    include: { student: { include: { user: true } } }
                }
            }
        });

        if (!assignment || !(await canAccessSchoolResource(user.id, assignment.lesson?.schoolId || ''))) {
            return res.status(404).json({ error: 'Assignment not found or you do not have access.' });
        }

        if (user.role === Role.TEACHER && assignment.teacherId !== (await prisma.teacher.findUnique({ where: { userId: user.id } }))?.id) {
            return res.status(403).json({ error: 'You are not authorized to download submissions for this assignment.' });
        }
        
        const zipBuffer = await generateSubmissionsZIP(assignment);
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.title.replace(/\s/g, '_')}_submissions.zip"`);
        res.send(zipBuffer);
    } catch (err) {
        console.error('Submissions ZIP generation error:', err);
        res.status(500).json({ error: 'Failed to generate submissions ZIP.' });
    }
});

// Helper functions for content type, PDF generation, and ZIP generation
function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: { [key: string]: string } = {
        'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
        'mp4': 'video/mp4', 'mp3': 'audio/mpeg', 'zip': 'application/zip',
    };
    return types[ext || ''] || 'application/octet-stream';
}

async function generateLessonPDF(lesson: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.fontSize(25).text(lesson.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Subject: ${lesson.subject?.name || 'N/A'}`);
        doc.text(`Class: ${lesson.class?.name || 'N/A'}`);
        doc.text(`Teacher: ${lesson.teacher?.user?.name || 'N/A'}`);
        doc.text(`Created: ${new Date(lesson.createdAt).toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(16).text('Description:');
        doc.fontSize(12).text(lesson.description || 'No description provided.');
        doc.moveDown();
        doc.fontSize(16).text('Content:');
        doc.fontSize(12).text(lesson.content || 'No content provided.');

        doc.end();
    });
}

async function generateQuizPDF(quiz: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.fontSize(25).text(quiz.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Subject: ${quiz.subject?.name || 'N/A'}`);
        doc.text(`Teacher: ${quiz.teacher?.user?.name || 'N/A'}`);
        doc.text(`Time Limit: ${quiz.timeLimit || 'N/A'} minutes`);
        doc.text(`Passing Score: ${quiz.passingScore || 'N/A'}%`);
        doc.moveDown();
        doc.fontSize(16).text('Questions:');

        const questions = quiz.questions || [];
        questions.forEach((q: any, index: number) => {
            doc.moveDown();
            doc.fontSize(14).text(`${index + 1}. ${q.question}`);
            doc.fontSize(10).text(`Type: ${q.type} | Points: ${q.points}`);
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt: any, optIndex: number) => {
                    doc.text(`  ${String.fromCharCode(65 + optIndex)}. ${opt.text} ${opt.isCorrect ? '(Correct)' : ''}`);
                });
            } else if (q.correctAnswer) { // For simpler quiz types where correctAnswer is a direct string
                 doc.text(`  Correct Answer: ${q.correctAnswer}`);
            }
        });
        doc.end();
    });
}

async function generateAssignmentPDF(assignment: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.fontSize(25).text(assignment.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Lesson: ${assignment.lesson?.title || 'N/A'}`);
        doc.text(`Teacher: ${assignment.teacher?.user?.name || 'N/A'}`);
        doc.text(`Due Date: ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}`);
        doc.text(`Maximum Score: ${assignment.maxScore} points`);
        doc.moveDown();
        doc.fontSize(16).text('Description:');
        doc.fontSize(12).text(assignment.description || 'No description provided.');

        doc.end();
    });
}

async function generateSubmissionsZIP(assignment: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const buffers: Buffer[] = [];

        archive.on('data', (data) => buffers.push(data));
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', (err) => reject(err));

        archive.append(`Assignment: ${assignment.title}\nTotal Submissions: ${assignment.submissions.length}\n\n`, { name: 'summary.txt' });

        assignment.submissions.forEach((sub: any, index: number) => {
            const submissionContent = `
SUBMISSION ${index + 1}:
Student: ${sub.student?.user?.name || 'N/A'}
Email: ${sub.student?.user?.email || 'N/A'}
Score: ${sub.score || 'Not graded'}
Submitted: ${new Date(sub.submittedAt).toLocaleString()}
Content:
${sub.content || 'No text content provided.'}
File URL: ${sub.fileUrl || 'No file uploaded.'}
            `.trim();
            archive.append(submissionContent, { name: `submission_${sub.student?.user?.name || `student_${index + 1}`}.txt` });
            // TODO: If sub.fileUrl points to a file in Supabase, fetch and append it to the zip
        });

        archive.finalize();
    });
}

export default router;
