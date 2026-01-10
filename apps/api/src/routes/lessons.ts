// apps/api/src/routes/lessons.ts
import { Router } from 'express';

const router = Router();

// Mock lessons data
const mockLessons = [
  {
    id: '1',
    title: 'Introduction to Mathematics',
    description: 'Basic concepts and fundamentals of mathematics',
    content: 'This lesson covers numbers, basic operations, and introductory algebra.',
    topicId: 'math-101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Physics Fundamentals',
    description: 'Introduction to basic physics concepts including motion, forces, and energy.',
    content: 'Learn about Newton\'s laws, kinematics, and basic mechanics.',
    topicId: 'physics-101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Chemistry Basics',
    description: 'Understanding atoms, molecules, and chemical reactions.',
    content: 'Explore the periodic table, chemical bonds, and basic reactions.',
    topicId: 'chemistry-101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /lessons - List lessons
router.get('/', async (req, res) => {
    try {
        res.json(mockLessons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});

// POST /lessons - Create a lesson
router.post('/', async (req, res) => {
    const { title, content, topicId } = req.body;
    if (!title || !content || !topicId) {
        return res.status(400).json({ error: 'Title, content, and topicId are required.' });
    }
    try {
        const newLesson = {
            id: `lesson-${Date.now()}`,
            title,
            description: content,
            topicId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        res.status(201).json(newLesson);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});

export default router;