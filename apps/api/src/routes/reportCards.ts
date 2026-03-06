import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /reportCards - List report cards
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, termId, classId, isPublished } = req.query;
    
    const where: any = { schoolId: req.user!.schoolId };
    
    if (studentId) {
      where.studentId = studentId as string;
    }
    
    if (termId) {
      where.termId = termId as string;
    }
    
    if (classId) {
      where.classId = classId as string;
    }
    
    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }

    const reportCards = await prisma.reportCard.findMany({
      where,
      include: {
        student: {
          include: { user: { select: { name: true, avatarUrl: true } } }
        },
        term: true,
        class: true,
        subjects: {
          include: { subject: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(reportCards);
  } catch (error) {
    console.error('Failed to fetch report cards:', error);
    res.status(500).json({ error: 'Failed to fetch report cards' });
  }
});

// GET /reportCards/student/:studentId - Get report cards for a student
router.get('/student/:studentId', protect, async (req, res) => {
  const { studentId } = req.params;
  const { termId } = req.query;
  
  try {
    const where: any = { 
      studentId,
      schoolId: req.user!.schoolId
    };
    
    if (termId) {
      where.termId = termId as string;
    }

    const reportCards = await prisma.reportCard.findMany({
      where,
      include: {
        term: true,
        class: true,
        subjects: {
          include: { subject: true }
        }
      },
      orderBy: { term: { startDate: 'desc' } }
    });

    res.json(reportCards);
  } catch (error) {
    console.error(`Failed to fetch report cards for student:`, error);
    res.status(500).json({ error: 'Failed to fetch report cards' });
  }
});

// GET /reportCards/:id - Get specific report card
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const reportCard = await prisma.reportCard.findFirst({
      where: { id, schoolId: req.user!.schoolId },
      include: {
        student: {
          include: { 
            user: { select: { name: true, avatarUrl: true, email: true } }
          }
        },
        term: true,
        class: true,
        subjects: {
          include: { subject: true }
        }
      }
    });

    if (!reportCard) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    res.json(reportCard);
  } catch (error) {
    console.error(`Failed to fetch report card ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
});

// POST /reportCards - Generate report card
router.post('/', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to create report cards' });
  }

  const { studentId, termId, classId, overallGrade, attendancePercent, teacherRemarks, isPublished = false } = req.body;

  if (!studentId || !termId || !classId) {
    return res.status(400).json({ error: 'Student ID, term ID, and class ID are required' });
  }

  try {
    // Check if report card already exists
    const existing = await prisma.reportCard.findFirst({
      where: { studentId, termId, classId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Report card already exists for this student in this term' });
    }

    // Get assessment results for the student in this term
    const assessmentResults = await prisma.assessmentResult.findMany({
      where: {
        studentId,
        assessment: {
          termId,
          classId
        }
      },
      include: {
        assessment: {
          include: { subject: true }
        }
      }
    });

    // Calculate subject scores from assessments
    const subjectScores: Record<string, { score: number; subjectId: string }> = {};
    
    for (const result of assessmentResults) {
      const subjectId = result.assessment.subjectId;
      if (subjectId) {
        if (!subjectScores[subjectId]) {
          subjectScores[subjectId] = { score: 0, subjectId };
        }
        if (result.score) {
          subjectScores[subjectId].score += result.score;
        }
      }
    }

    // Calculate overall grade
    const scores = Object.values(subjectScores).map(s => s.score);
    const calculatedOverallGrade = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : overallGrade || 0;

    const reportCard = await prisma.reportCard.create({
      data: {
        studentId,
        termId,
        classId,
        overallGrade: overallGrade || calculatedOverallGrade,
        attendancePercent,
        teacherRemarks,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        schoolId: req.user!.schoolId,
        subjects: {
          create: Object.values(subjectScores).map(s => ({
            subjectId: s.subjectId,
            score: s.score,
            grade: calculateGrade(s.score),
            competencyRating: null
          }))
        }
      },
      include: {
        student: {
          include: { user: { select: { name: true } } }
        },
        term: true,
        subjects: {
          include: { subject: true }
        }
      }
    });

    res.status(201).json(reportCard);
  } catch (error) {
    console.error('Failed to create report card:', error);
    res.status(500).json({ error: 'Failed to create report card' });
  }
});

// PUT /reportCards/:id - Update report card
router.put('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized to update report cards' });
  }

  const { id } = req.params;
  const { overallGrade, attendancePercent, teacherRemarks, isPublished, subjects } = req.body;

  try {
    const existing = await prisma.reportCard.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    // Update main report card
    const updated = await prisma.reportCard.update({
      where: { id },
      data: {
        overallGrade,
        attendancePercent,
        teacherRemarks,
        isPublished,
        publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        term: true,
        subjects: { include: { subject: true } }
      }
    });

    // Update subject scores if provided
    if (subjects && Array.isArray(subjects)) {
      for (const subjectUpdate of subjects) {
        if (subjectUpdate.id) {
          await prisma.reportCardSubject.update({
            where: { id: subjectUpdate.id },
            data: {
              score: subjectUpdate.score,
              grade: subjectUpdate.grade || (subjectUpdate.score ? calculateGrade(subjectUpdate.score) : null),
              competencyRating: subjectUpdate.competencyRating,
              remarks: subjectUpdate.remarks
            }
          });
        }
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(`Failed to update report card ${id}:`, error);
    res.status(500).json({ error: 'Failed to update report card' });
  }
});

// POST /reportCards/:id/publish - Publish report card
router.post('/:id/publish', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can publish report cards' });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.reportCard.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    const published = await prisma.reportCard.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date()
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        term: true
      }
    });

    res.json(published);
  } catch (error) {
    console.error(`Failed to publish report card ${id}:`, error);
    res.status(500).json({ error: 'Failed to publish report card' });
  }
});

// Helper function to calculate grade
function calculateGrade(score: number): string {
  if (score >= 90) return 'A1';
  if (score >= 80) return 'A2';
  if (score >= 70) return 'B3';
  if (score >= 60) return 'B4';
  if (score >= 55) return 'C5';
  if (score >= 50) return 'C6';
  if (score >= 45) return 'D7';
  if (score >= 40) return 'D8';
  return 'F9';
}

export default router;

