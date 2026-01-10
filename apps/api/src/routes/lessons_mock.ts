// apps/api/src/routes/lessons_mock.ts
import { Router } from 'express';

const router = Router();

// GET /lessons - Mock lessons for development
router.get('/', async (req, res) => {
  try {
    // Mock lessons data
    const mockLessons = [
      {
        id: '1',
        title: 'Introduction to Mathematics',
        description: 'Basic mathematical concepts and operations',
        content: 'This lesson covers fundamental mathematical operations including addition, subtraction, multiplication, and division.',
        topicId: '1',
        schoolId: 'kavuma-education-platform',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Advanced Physics',
        description: 'Exploring the laws of physics',
        content: 'Deep dive into Newton\'s laws, thermodynamics, and quantum mechanics basics.',
        topicId: '2',
        schoolId: 'kavuma-education-platform',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, and JavaScript',
        content: 'Complete guide to modern web development with practical examples and projects.',
        topicId: '3',
        schoolId: 'kavuma-education-platform',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.json(mockLessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lessons.' });
  }
});

export default router;
