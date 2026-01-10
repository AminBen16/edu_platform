// apps/api/src/routes/lessons_prod.ts
import { Router } from 'express';

const router = Router();

// GET /lessons - Production lessons with fallback data
router.get('/', async (req, res) => {
  try {
    // Production lessons data
    const productionLessons = [
      {
        id: '1',
        title: 'Introduction to Mathematics',
        description: 'Basic mathematical concepts and operations',
        content: 'This lesson covers fundamental mathematical operations including addition, subtraction, multiplication, and division.',
        topicId: '1',
        schoolId: 'default-school',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Advanced Physics',
        description: 'Exploring the laws of physics',
        content: 'Deep dive into Newton\'s laws, thermodynamics, and quantum mechanics basics.',
        topicId: '2',
        schoolId: 'default-school',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, and JavaScript',
        content: 'Complete guide to modern web development with practical examples and projects.',
        topicId: '3',
        schoolId: 'default-school',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Introduction to Chemistry',
        description: 'Basic chemical concepts and reactions',
        content: 'Understanding atoms, molecules, chemical bonds, and basic reactions.',
        topicId: '4',
        schoolId: 'default-school',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        title: 'Data Structures & Algorithms',
        description: 'Computer science fundamentals',
        content: 'Learn about arrays, linked lists, trees, sorting algorithms, and problem-solving techniques.',
        topicId: '5',
        schoolId: 'default-school',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.json(productionLessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lessons.' });
  }
});

export default router;
