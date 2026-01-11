// apps/api/src/routes/download.ts
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../config/database';

const router = Router();

// Supabase Storage client setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// GET /download/file/:path(*) - Download a file from Supabase Storage
router.get('/file/:path(*)', protect, async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: 'Storage service not configured.' });
    }

    try {
        const { path } = req.params;
        const user = req.user!;

        // Security: Ensure user can only access files from their school
        if (!path.startsWith(user.schoolId)) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Get file from Supabase Storage
        const { data, error } = await supabase.storage
            .from('edu-files')
            .download(path);

        if (error) {
            console.error('Download error:', error);
            return res.status(404).json({ error: 'File not found.' });
        }

        if (!data) {
            return res.status(404).json({ error: 'File not found.' });
        }

        // Extract filename from path
        const filename = path.split('/').pop() || 'download';
        
        // Set appropriate headers for download
        const buffer = Buffer.from(await data.arrayBuffer());
        const contentType = getContentType(filename);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        
        res.send(buffer);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file.' });
    }
});

// GET /download/lesson/:id - Download lesson content as PDF
router.get('/lesson/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Get lesson from database
        const lesson = await prisma?.lesson.findFirst({
            where: { 
                id,
                schoolId: user.schoolId 
            },
            include: {
                subject: true,
                teacher: {
                    include: { user: true }
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        // Generate PDF content (simplified - in production, use a PDF library)
        const pdfContent = generateLessonPDF(lesson);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${lesson.title}.pdf"`);
        res.send(pdfContent);
    } catch (err) {
        console.error('Lesson download error:', err);
        res.status(500).json({ error: 'Failed to download lesson.' });
    }
});

// GET /download/quiz/:id - Download quiz as PDF
router.get('/quiz/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Get quiz from database
        const quiz = await prisma?.quiz.findFirst({
            where: { 
                id,
                schoolId: user.schoolId 
            },
            include: {
                subject: true,
                teacher: {
                    include: { user: true }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        // Generate PDF content
        const pdfContent = generateQuizPDF(quiz);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}.pdf"`);
        res.send(pdfContent);
    } catch (err) {
        console.error('Quiz download error:', err);
        res.status(500).json({ error: 'Failed to download quiz.' });
    }
});

// GET /download/assignment/:id - Download assignment as PDF
router.get('/assignment/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Get assignment from database
        const assignment = await prisma?.assignment.findFirst({
            where: { 
                id,
                lesson: {
                    schoolId: user.schoolId 
                }
            },
            include: {
                lesson: true,
                teacher: {
                    include: { user: true }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Generate PDF content
        const pdfContent = generateAssignmentPDF(assignment);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.title}.pdf"`);
        res.send(pdfContent);
    } catch (err) {
        console.error('Assignment download error:', err);
        res.status(500).json({ error: 'Failed to download assignment.' });
    }
});

// GET /download/assignments/:id/submissions - Download all assignment submissions
router.get('/assignments/:id/submissions', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Get assignment with submissions
        const assignment = await prisma?.assignment.findFirst({
            where: { 
                id,
                lesson: {
                    schoolId: user.schoolId 
                }
            },
            include: {
                submissions: {
                    include: {
                        student: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Generate ZIP with all submissions
        const zipContent = await generateSubmissionsZIP(assignment);
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.title}_submissions.zip"`);
        res.send(zipContent);
    } catch (err) {
        console.error('Submissions download error:', err);
        res.status(500).json({ error: 'Failed to download submissions.' });
    }
});

// Helper functions
function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'zip': 'application/zip',
    };
    return types[ext || ''] || 'application/octet-stream';
}

function generateLessonPDF(lesson: any): Buffer {
    const content = `LESSON: ${lesson.title}
Subject: ${lesson.subject?.name || 'N/A'}
Teacher: ${lesson.teacher?.user?.name || 'N/A'}
Created: ${new Date(lesson.createdAt).toLocaleDateString()}

DESCRIPTION:
${lesson.description || 'No description'}

CONTENT:
${lesson.content || 'No content'}`;
    
    return Buffer.from(content, 'utf-8');
}

function generateQuizPDF(quiz: any): Buffer {
    const questions = quiz.questions || [];
    const content = `QUIZ: ${quiz.title}
Subject: ${quiz.subject?.name || 'N/A'}
Teacher: ${quiz.teacher?.user?.name || 'N/A'}
Time Limit: ${quiz.timeLimit || 'N/A'} minutes
Passing Score: ${quiz.passingScore || 'N/A'}%

QUESTIONS:
${questions.map((q: any, i: number) => 
    `${i + 1}. ${q.question}
Type: ${q.type}
Points: ${q.points}
${q.options ? `Options:\n${q.options.map((opt: string, j: number) => `  ${String.fromCharCode(65 + j)}. ${opt}`).join('\n')}` : ''}
Correct Answer: ${q.correctAnswer}`
).join('\n')}`;
    
    return Buffer.from(content, 'utf-8');
}

function generateAssignmentPDF(assignment: any): Buffer {
    const content = `ASSIGNMENT: ${assignment.title}
Lesson: ${assignment.lesson?.title || 'N/A'}
Teacher: ${assignment.teacher?.user?.name || 'N/A'}
Due Date: ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
Maximum Score: ${assignment.maxScore} points

DESCRIPTION:
${assignment.description || 'No description'}`;
    
    return Buffer.from(content, 'utf-8');
}

async function generateSubmissionsZIP(assignment: any): Promise<Buffer> {
    const submissions = assignment.submissions || [];
    const content = `ASSIGNMENT SUBMISSIONS
Assignment: ${assignment.title}
Total Submissions: ${submissions.length}

${submissions.map((sub: any, i: number) => 
    `SUBMISSION ${i + 1}:
Student: ${sub.student?.user?.name || 'N/A'}
Email: ${sub.student?.user?.email || 'N/A'}
Score: ${sub.score || 'Not graded'}
Submitted: ${new Date(sub.submittedAt).toLocaleDateString()}`
).join('\n\n')}`;
    
    return Buffer.from(content, 'utf-8');
}

export default router;
