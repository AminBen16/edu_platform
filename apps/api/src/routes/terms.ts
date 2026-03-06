import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /terms - List terms for school
router.get('/', protect, async (req, res) => {
  try {
    const { academicYear, isActive } = req.query;
    
    const where: any = { schoolId: req.user!.schoolId };
    
    if (academicYear) {
      where.academicYear = academicYear as string;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const terms = await prisma.term.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { startDate: 'asc' }]
    });
    
    res.json(terms);
  } catch (error) {
    console.error('Failed to fetch terms:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// GET /terms/current - Get current active term
router.get('/current', protect, async (req, res) => {
  try {
    const now = new Date();
    
    const currentTerm = await prisma.term.findFirst({
      where: {
        schoolId: req.user!.schoolId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: { startDate: 'asc' }
    });

    if (!currentTerm) {
      // Try to get the most recent active term
      const recentTerm = await prisma.term.findFirst({
        where: {
          schoolId: req.user!.schoolId,
          isActive: true
        },
        orderBy: { startDate: 'desc' }
      });
      return res.json(recentTerm || null);
    }

    res.json(currentTerm);
  } catch (error) {
    console.error('Failed to fetch current term:', error);
    res.status(500).json({ error: 'Failed to fetch current term' });
  }
});

// GET /terms/:id - Get specific term
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const term = await prisma.term.findFirst({
      where: { id, schoolId: req.user!.schoolId },
      include: {
        assessments: {
          include: { subject: true, class: true }
        },
        _count: { select: { assessments: true } }
      }
    });

    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    res.json(term);
  } catch (error) {
    console.error(`Failed to fetch term ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch term' });
  }
});

// POST /terms - Create new term
router.post('/', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create terms' });
  }

  const { name, startDate, endDate, academicYear, isActive = true } = req.body;

  if (!name || !startDate || !endDate || !academicYear) {
    return res.status(400).json({ error: 'Name, start date, end date, and academic year are required' });
  }

  try {
    // Check for overlapping terms
    const overlapping = await prisma.term.findFirst({
      where: {
        schoolId: req.user!.schoolId,
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Term overlaps with existing term' });
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYear,
        isActive,
        schoolId: req.user!.schoolId
      }
    });

    res.status(201).json(term);
  } catch (error) {
    console.error('Failed to create term:', error);
    res.status(500).json({ error: 'Failed to create term' });
  }
});

// PUT /terms/:id - Update term
router.put('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update terms' });
  }

  const { id } = req.params;
  const { name, startDate, endDate, academicYear, isActive } = req.body;

  try {
    const existing = await prisma.term.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Term not found' });
    }

    const updated = await prisma.term.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        academicYear,
        isActive
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(`Failed to update term ${id}:`, error);
    res.status(500).json({ error: 'Failed to update term' });
  }
});

// DELETE /terms/:id - Delete term
router.delete('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete terms' });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.term.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Term not found' });
    }

    // Check if term has assessments
    const assessmentCount = await prisma.assessment.count({
      where: { termId: id }
    });

    if (assessmentCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete term with existing assessments. Remove assessments first.' 
      });
    }

    await prisma.term.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete term ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete term' });
  }
});

export default router;

