// apps/api/src/routes/quizzes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// GET /quizzes - List quizzes for the user's school
router.get('/', protect, async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { schoolId: req.user!.schoolId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes.' });
  }
});

// POST /quizzes - Create a quiz (teacher or admin)
router.post('/', protect, authorize('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { title, questions, subjectId } = req.body;
  if (!title || !questions || !subjectId) {
    return res.status(400).json({ error: 'Title, questions, and subjectId are required.' });
  }
  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        questions,
        subjectId,
        schoolId: req.user!.schoolId,
        teacherId: req.user!.id,
      },
    });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz.' });
  }
});

export default router;
