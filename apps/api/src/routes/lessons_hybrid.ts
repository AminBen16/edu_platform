// apps/api/src/routes/lessons_hybrid.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// In-memory storage for demo purposes (fallback when DB is not available)
interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
  isPublished: boolean;
  schoolId: string;
  subjectId?: string;
  teacherId?: string;
  classId?: string;
  createdAt: string;
  updatedAt: string;
}

const lessonsStore: Lesson[] = [];

// GET /lessons - List lessons with hybrid approach
router.get('/', protect, async (req, res) => {
  try {
    // Try database first (when available)
    if (process.env.DATABASE_URL) {
      const lessons = await prisma.lesson.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          isPublished: true
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true }
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } }
          },
          class: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(lessons);
    } else {
      // Fallback to in-memory data for demo
      res.json(lessonsStore);
    }
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// POST /lessons - Create a lesson with hybrid approach
router.post('/', protect, async (req, res) => {
  const { title, description, content, type, videoUrl, duration, order, subjectId, classId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    let lesson;
    
    // Use real database if available
    if (process.env.DATABASE_URL) {
      lesson = await prisma.lesson.create({
        data: {
          title,
          description,
          content,
          type: type || 'LESSON',
          videoUrl,
          duration: duration ? parseInt(duration) : null,
          order: order ? parseInt(order) : null,
          isPublished: true,
          schoolId: req.user!.schoolId,
          subjectId: subjectId || null,
          teacherId: req.user!.id,
          classId: classId || null,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true }
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } }
          }
        }
      });
    } else {
      // Fallback to in-memory data for demo
      lesson = {
        id: `lesson-${Date.now()}`,
        title,
        description,
        content,
        type: type || 'LESSON',
        videoUrl,
        duration: duration ? parseInt(duration) : undefined,
        order: order ? parseInt(order) : undefined,
        isPublished: true,
        schoolId: req.user!.schoolId,
        subjectId: subjectId || undefined,
        teacherId: req.user!.id,
        classId: classId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to in-memory store
      lessonsStore.push(lesson);
    }
    
    res.status(201).json(lesson);
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// GET /lessons/:id - Get a specific lesson
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    if (process.env.DATABASE_URL) {
      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: {
          subject: {
            select: { id: true, name: true, code: true }
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } }
          },
          class: {
            select: { id: true, name: true }
          },
          resources: true,
          assignments: {
            include: {
              submissions: {
                select: { id: true, studentId: true, score: true, submittedAt: true }
              }
            }
          }
        }
      });

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      res.json(lesson);
    } else {
      // Fallback to in-memory data
      const lesson = lessonsStore.find(l => l.id === id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(lesson);
    }
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// PUT /lessons/:id - Update a lesson
router.put('/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { title, description, content, type, videoUrl, duration, order, subjectId, classId, isPublished } = req.body;

  try {
    if (process.env.DATABASE_URL) {
      const lesson = await prisma.lesson.update({
        where: { id },
        data: {
          title,
          description,
          content,
          type: type || 'LESSON',
          videoUrl,
          duration: duration ? parseInt(duration) : undefined,
          order: order ? parseInt(order) : undefined,
          isPublished: isPublished !== undefined ? isPublished : true,
          subjectId: subjectId || null,
          classId: classId || null,
          updatedAt: new Date(),
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true }
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } }
          }
        }
      });

      res.json(lesson);
    } else {
      // Fallback to in-memory data
      const lessonIndex = lessonsStore.findIndex(l => l.id === id);
      if (lessonIndex === -1) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      lessonsStore[lessonIndex] = {
        ...lessonsStore[lessonIndex],
        title,
        description,
        content,
        type: type || 'LESSON',
        videoUrl,
        duration: duration ? parseInt(duration) : undefined,
        order: order ? parseInt(order) : undefined,
        isPublished: isPublished !== undefined ? isPublished : lessonsStore[lessonIndex].isPublished,
        subjectId: subjectId || lessonsStore[lessonIndex].subjectId,
        classId: classId || lessonsStore[lessonIndex].classId,
        updatedAt: new Date().toISOString(),
      };

      res.json(lessonsStore[lessonIndex]);
    }
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// DELETE /lessons/:id - Delete a lesson
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    if (process.env.DATABASE_URL) {
      await prisma.lesson.delete({
        where: { id }
      });
    } else {
      // Fallback to in-memory data
      const lessonIndex = lessonsStore.findIndex(l => l.id === id);
      if (lessonIndex === -1) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      lessonsStore.splice(lessonIndex, 1);
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

export default router;
