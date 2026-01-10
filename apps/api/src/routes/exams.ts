// apps/api/src/routes/exams.ts
import { Router } from 'express';

const router = Router();

// Mock exams data
const mockExams = [
  {
    id: '1',
    title: 'Mathematics Final Exam',
    description: 'Comprehensive assessment covering all topics from the semester',
    questions: [
      {
        id: 'q1',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '2'],
        correctAnswer: 0,
      },
      {
        id: 'q2',
        question: 'Solve for x: 3x + 5 = 20',
        options: ['x = 5', 'x = 15/3', 'x = 3', 'x = 25/3'],
        correctAnswer: 1,
      }
    ],
    duration: 60, // minutes
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Physics Midterm',
    description: 'Assessment on mechanics and thermodynamics',
    questions: [
      {
        id: 'q1',
        question: 'What is Newton\'s Second Law?',
        options: ['F=ma', 'F=mv', 'F=mg', 'F=dp'],
        correctAnswer: 0,
      }
    ],
    duration: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /exams - List exams
router.get('/', async (req, res) => {
    try {
        res.json(mockExams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams.' });
    }
});

// POST /exams - Create an exam
router.post('/', async (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions || !lessonId) {
        return res.status(400).json({ error: 'Title, questions, and lessonId are required.' });
    }
    try {
        const newExam = {
            id: `exam-${Date.now()}`,
            title,
            questions,
            lessonId,
            duration: 60, // default duration
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        res.status(201).json(newExam);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create exam.' });
    }
});

export default router;