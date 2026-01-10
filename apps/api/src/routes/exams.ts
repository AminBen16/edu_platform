// apps/api/src/routes/exams.ts
import { Router } from 'express';
import prisma, { Role } from '../../../../packages/db';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// GET /exams - List exams for the user's school
router.get('/', protect, async (req, res) => {
    try {
        const exams = await prisma.quiz.findMany({
            where: { schoolId: req.user!.schoolId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams.' });
    }
});

// POST /exams - Create an exam (teacher or admin)
router.post('/', protect, authorize(Role.TEACHER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions || !lessonId) {
        return res.status(400).json({ error: 'Title, questions, and lessonId are required.' });
    }
    try {
        const exam = await prisma.quiz.create({
            data: {
                title,
                questions,
                lessonId,
                schoolId: req.user!.schoolId,
                authorId: req.user!.id,
            },
        });
        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create exam.' });
    }
});

export default router;