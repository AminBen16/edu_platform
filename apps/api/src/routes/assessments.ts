import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// Assessment types for Uganda CBC
const ASSESSMENT_TYPES = {
  CONTINUOUS_ASSESSMENT: 'CONTINUOUS_ASSESSMENT',
  SUMMATIVE: 'SUMMATIVE',
  PRACTICAL: 'PRACTICAL',
  PROJECT_BASED: 'PROJECT_BASED',
  PARTICIPATION: 'PARTICIPATION'
} as const;

// GET /assessments - List assessments
router.get('/', protect, async (req, res) => {
  try {
    const { classId, subjectId, termId, type } = req.query;
    
    const where: any = { schoolId: req.user!.schoolId };
    
    if (classId) {
      where.classId = classId as string;
    }
    
    if (subjectId) {
      where.subjectId = subjectId as string;
    }
    
    if (termId) {
      where.termId = termId as string;
    }
    
    if (type) {
      where.type = type as string;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        subject: true,
        class: true,
        term: true,
        teacher: {
          include: { user: { select: { name: true } } }
        },
        _count: { select: { results: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(assessments);
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// GET /assessments/:id - Get specific assessment
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { id, schoolId: req.user!.schoolId },
      include: {
        subject: true,
        class: true,
        term: true,
        teacher: {
          include: { user: { select: { name: true } } }
        },
        results: {
          include: {
            student: {
              include: { user: { select: { name: true, avatarUrl: true } } }
            }
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error(`Failed to fetch assessment ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// POST /assessments - Create new assessment
router.post('/', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to create assessments' });
  }

  const { 
    title, 
    type, 
    description, 
    dueDate, 
    maxScore, 
    termId, 
    subjectId, 
    classId,
    isPublished 
  } = req.body;

  if (!title || !type || !subjectId || !classId) {
    return res.status(400).json({ error: 'Title, type, subject, and class are required' });
  }

  try {
    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    const assessment = await prisma.assessment.create({
      data: {
        title,
        type,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore || 100,
        termId,
        subjectId,
        classId,
        teacherId: teacher?.id,
        isPublished: isPublished || false,
        schoolId: req.user!.schoolId
      },
      include: {
        subject: true,
        class: true,
        term: true
      }
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error('Failed to create assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// PUT /assessments/:id - Update assessment
router.put('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to update assessments' });
  }

  const { id } = req.params;
  const { title, type, description, dueDate, maxScore, isPublished } = req.body;

  try {
    const existing = await prisma.assessment.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        title,
        type,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        maxScore,
        isPublished
      },
      include: {
        subject: true,
        class: true,
        term: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(`Failed to update assessment ${id}:`, error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE /assessments/:id - Delete assessment
router.delete('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete assessments' });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.assessment.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    await prisma.assessment.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete assessment ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// GET /assessments/:id/results - Get assessment results
router.get('/:id/results', protect, async (req, res) => {
  const { id } = req.params;
  
  try {
    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId: id },
      include: {
        student: {
          include: { user: { select: { name: true, avatarUrl: true } } }
        },
        grader: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(results);
  } catch (error) {
    console.error(`Failed to fetch assessment results:`, error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// POST /assessments/:id/results - Submit assessment result
router.post('/:id/results', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to submit results' });
  }

  const { id } = req.params;
  const { studentId, score, masteryLevel, teacherRemarks } = req.body;

  if (!studentId || score === undefined) {
    return res.status(400).json({ error: 'Student ID and score are required' });
  }

  try {
    const assessment = await prisma.assessment.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check if result already exists
    const existing = await prisma.assessmentResult.findFirst({
      where: { assessmentId: id, studentId }
    });

    if (existing) {
      // Update existing result
      const updated = await prisma.assessmentResult.update({
        where: { id: existing.id },
        data: {
          score,
          masteryLevel,
          teacherRemarks,
          gradedBy: req.user!.id,
          gradedAt: new Date()
        },
        include: {
          student: {
            include: { user: { select: { name: true } } }
          }
        }
      });
      return res.json(updated);
    }

    // Create new result
    const result = await prisma.assessmentResult.create({
      data: {
        assessmentId: id,
        studentId,
        score,
        masteryLevel,
        teacherRemarks,
        gradedBy: req.user!.id,
        gradedAt: new Date(),
        schoolId: req.user!.schoolId
      },
      include: {
        student: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(`Failed to submit assessment result:`, error);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

// GET /assessments/types - Get available assessment types
router.get('/types', protect, async (req, res) => {
  res.json(ASSESSMENT_TYPES);
});

export default router;

