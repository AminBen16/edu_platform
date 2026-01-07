// apps/api/src/routes/lessons.ts
import { Router } from 'express';
import prisma from 'db';
import { protect, authorize } from '../middleware/auth';
import { Role } from 'db';

const router = Router();

// GET /lessons - List lessons for the user's school
router.get('/', protect, async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany({
            where: { schoolId: req.user!.schoolId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});

// POST /lessons - Create a lesson (teacher or admin)
router.post('/', protect, authorize(Role.TEACHER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req, res) => {
    const { title, content, topicId } = req.body;
    if (!title || !content || !topicId) {
        return res.status(400).json({ error: 'Title, content, and topicId are required.' });
    }
    try {
        const lesson = await prisma.lesson.create({
            data: {
                title,
                description: content,
                topicId,
                schoolId: req.user!.schoolId,
                authorId: req.user!.id,
            },
        });
        res.status(201).json(lesson);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});

export default router;