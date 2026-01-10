// Assignments management routes
import { Router } from 'express';
import { prisma } from '../../../packages/db';

const router = Router();

// GET /assignments - Get all assignments
router.get('/', async (req: any, res: any) => {
  try {
    // Mock assignments data
    const assignments = [
      {
        id: '1',
        title: 'Mathematics Problem Set 1',
        description: 'Complete exercises 1-20 from Chapter 3',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        lessonId: '1',
        teacherId: 'teacher-1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Physics Lab Report',
        description: 'Write a 5-page report on Newton\'s Laws',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 50,
        lessonId: '2',
        teacherId: 'teacher-2',
        createdAt: new Date().toISOString(),
      },
    ];

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /assignments - Create new assignment
router.post('/', async (req: any, res: any) => {
  try {
    const { title, description, dueDate, maxScore, lessonId } = req.body;

    const newAssignment = {
      id: `assignment-${Date.now()}`,
      title,
      description,
      dueDate,
      maxScore,
      lessonId,
      teacherId: 'teacher-1',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: newAssignment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

export default router;
