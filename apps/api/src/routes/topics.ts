import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /topics - List topics
router.get('/', protect, async (req, res) => {
  try {
    const { subjectId, levelId } = req.query;
    
    const where: any = {};
    
    if (subjectId) {
      where.subjectId = subjectId as string;
    }
    
    if (levelId) {
      where.subject = {
        levelSubjects: {
          some: { levelId: levelId as string }
        }
      };
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        subject: true,
        competencies: {
          include: {
            learningOutcomes: true
          },
          orderBy: { order: 'asc' }
        },
        _count: { select: { lessons: true } }
      },
      orderBy: { order: 'asc' }
    });
    
    res.json(topics);
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// GET /topics/:id - Get specific topic with competencies
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        subject: true,
        competencies: {
          include: {
            learningOutcomes: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        lessons: {
          select: { id: true, title: true, isPublished: true }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error(`Failed to fetch topic ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// POST /topics - Create new topic
router.post('/', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to create topics' });
  }

  const { name, description, order, subjectId } = req.body;

  if (!name || !subjectId) {
    return res.status(400).json({ error: 'Name and subject ID are required' });
  }

  try {
    // Verify subject belongs to school
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject || subject.schoolId !== req.user!.schoolId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        description,
        order: order || 0,
        subjectId
      },
      include: { subject: true }
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error('Failed to create topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// PUT /topics/:id - Update topic
router.put('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to update topics' });
  }

  const { id } = req.params;
  const { name, description, order } = req.body;

  try {
    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { subject: true }
    });

    if (!existing || existing.subject.schoolId !== req.user!.schoolId) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: { name, description, order },
      include: { subject: true }
    });

    res.json(updated);
  } catch (error) {
    console.error(`Failed to update topic ${id}:`, error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// DELETE /topics/:id - Delete topic
router.delete('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete topics' });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { subject: true }
    });

    if (!existing || existing.subject.schoolId !== req.user!.schoolId) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await prisma.topic.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete topic ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

export default router;

