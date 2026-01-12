// apps/api/src/routes/content.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';
import { Role } from '../lib/database';

const router = Router();

// Middleware to protect content routes and allow only teachers and admins
router.use(protect, authorize(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN));

// GET /content/recent - Get recent content (lessons and quizzes) for the user's school
router.get('/recent', async (req, res) => {
    const { schoolId } = req.user!;
    const teacherId = req.user!.role === Role.TEACHER ? (await prisma.teacher.findUnique({ where: { userId: req.user!.id } }))?.id : undefined;

    try {
        const lessons = await prisma.lesson.findMany({
            where: { schoolId, isPublished: true, ...(teacherId && { teacherId }) },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, description: true, createdAt: true, updatedAt: true, isPublished: true, type: true }
        });

        const quizzes = await prisma.quiz.findMany({
            where: { schoolId, isPublished: true, ...(teacherId && { teacherId }) },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, description: true, createdAt: true, updatedAt: true, isPublished: true, type: true }
        });

        const combinedContent = [
            ...lessons.map(item => ({ ...item, contentType: 'lesson' })),
            ...quizzes.map(item => ({ ...item, contentType: 'quiz' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json(combinedContent);
    } catch (error) {
        console.error('Failed to fetch recent content:', error);
        res.status(500).json({ error: 'Failed to fetch recent content.' });
    }
});

// GET /content/drafts - Get draft content (lessons and quizzes) for the user's school
router.get('/drafts', async (req, res) => {
    const { schoolId } = req.user!;
    const teacherId = req.user!.role === Role.TEACHER ? (await prisma.teacher.findUnique({ where: { userId: req.user!.id } }))?.id : undefined;

    try {
        const lessons = await prisma.lesson.findMany({
            where: { schoolId, isPublished: false, ...(teacherId && { teacherId }) },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, description: true, createdAt: true, updatedAt: true, isPublished: true, type: true }
        });

        const quizzes = await prisma.quiz.findMany({
            where: { schoolId, isPublished: false, ...(teacherId && { teacherId }) },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, description: true, createdAt: true, updatedAt: true, isPublished: true, type: true }
        });

        const combinedDrafts = [
            ...lessons.map(item => ({ ...item, contentType: 'lesson' })),
            ...quizzes.map(item => ({ ...item, contentType: 'quiz' }))
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        res.json(combinedDrafts);
    } catch (error) {
        console.error('Failed to fetch draft content:', error);
        res.status(500).json({ error: 'Failed to fetch draft content.' });
    }
});

// POST /content/publish - Publish content
router.post('/publish', async (req, res) => {
    const { contentId, contentType } = req.body; // contentTitle is not needed as it's part of the content

    if (!contentId || !contentType) {
        return res.status(400).json({ error: 'Content ID and content type are required.' });
    }

    try {
        let content;
        if (contentType === 'lesson') {
            content = await prisma.lesson.update({
                where: { id: contentId, schoolId: req.user!.schoolId },
                data: { isPublished: true, updatedAt: new Date() },
            });
        } else if (contentType === 'quiz') {
            content = await prisma.quiz.update({
                where: { id: contentId, schoolId: req.user!.schoolId },
                data: { isPublished: true, updatedAt: new Date() },
            });
        } else {
            return res.status(400).json({ error: 'Invalid content type provided.' });
        }

        if (!content) {
            return res.status(404).json({ error: 'Content not found or not authorized.' });
        }
        
        // TODO: Integrate with real-time notification service if needed

        res.status(200).json({ message: 'Content published successfully.', content });
    } catch (error) {
        console.error('Content publishing error:', error);
        res.status(500).json({ error: 'Failed to publish content.' });
    }
});

// POST /content/unpublish - Unpublish content
router.post('/unpublish', async (req, res) => {
    const { contentId, contentType } = req.body;

    if (!contentId || !contentType) {
        return res.status(400).json({ error: 'Content ID and content type are required.' });
    }

    try {
        let content;
        if (contentType === 'lesson') {
            content = await prisma.lesson.update({
                where: { id: contentId, schoolId: req.user!.schoolId },
                data: { isPublished: false, updatedAt: new Date() },
            });
        } else if (contentType === 'quiz') {
            content = await prisma.quiz.update({
                where: { id: contentId, schoolId: req.user!.schoolId },
                data: { isPublished: false, updatedAt: new Date() },
            });
        } else {
            return res.status(400).json({ error: 'Invalid content type provided.' });
        }

        if (!content) {
            return res.status(404).json({ error: 'Content not found or not authorized.' });
        }

        res.status(200).json({ message: 'Content unpublished successfully.', content });
    } catch (error) {
        console.error('Content unpublishing error:', error);
        res.status(500).json({ error: 'Failed to unpublish content.' });
    }
});


export default router;
