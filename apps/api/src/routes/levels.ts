import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// Uganda Education Level Types
const LEVEL_TYPES = {
  PRE_PRIMARY: 'PRE_PRIMARY',
  PRIMARY: 'PRIMARY',
  LOWER_SECONDARY: 'LOWER_SECONDARY',
  UPPER_SECONDARY: 'UPPER_SECONDARY',
  TVET: 'TVET',
  ADULT: 'ADULT',
  HIGHER_EDUCATION: 'HIGHER_EDUCATION'
} as const;

// Default Uganda Curriculum Levels
const DEFAULT_UGANDA_LEVELS = [
  // Pre-Primary
  { code: 'PP1', name: 'Pre-Primary 1', level: 1, type: LEVEL_TYPES.PRE_PRIMARY },
  { code: 'PP2', name: 'Pre-Primary 2', level: 2, type: LEVEL_TYPES.PRE_PRIMARY },
  { code: 'PP3', name: 'Pre-Primary 3', level: 3, type: LEVEL_TYPES.PRE_PRIMARY },
  // Primary
  { code: 'P1', name: 'Primary 1', level: 4, type: LEVEL_TYPES.PRIMARY },
  { code: 'P2', name: 'Primary 2', level: 5, type: LEVEL_TYPES.PRIMARY },
  { code: 'P3', name: 'Primary 3', level: 6, type: LEVEL_TYPES.PRIMARY },
  { code: 'P4', name: 'Primary 4', level: 7, type: LEVEL_TYPES.PRIMARY },
  { code: 'P5', name: 'Primary 5', level: 8, type: LEVEL_TYPES.PRIMARY },
  { code: 'P6', name: 'Primary 6', level: 9, type: LEVEL_TYPES.PRIMARY },
  { code: 'P7', name: 'Primary 7', level: 10, type: LEVEL_TYPES.PRIMARY },
  // Lower Secondary
  { code: 'S1', name: 'Secondary 1', level: 11, type: LEVEL_TYPES.LOWER_SECONDARY },
  { code: 'S2', name: 'Secondary 2', level: 12, type: LEVEL_TYPES.LOWER_SECONDARY },
  { code: 'S3', name: 'Secondary 3', level: 13, type: LEVEL_TYPES.LOWER_SECONDARY },
  { code: 'S4', name: 'Secondary 4', level: 14, type: LEVEL_TYPES.LOWER_SECONDARY },
  // Upper Secondary
  { code: 'S5', name: 'Secondary 5', level: 15, type: LEVEL_TYPES.UPPER_SECONDARY },
  { code: 'S6', name: 'Secondary 6', level: 16, type: LEVEL_TYPES.UPPER_SECONDARY },
  // TVET
  { code: 'TVET1', name: 'TVET Level 1', level: 17, type: LEVEL_TYPES.TVET },
  { code: 'TVET2', name: 'TVET Level 2', level: 18, type: LEVEL_TYPES.TVET },
  { code: 'TVET3', name: 'TVET Level 3', level: 19, type: LEVEL_TYPES.TVET },
  { code: 'TVET4', name: 'TVET Level 4', level: 20, type: LEVEL_TYPES.TVET },
  // Adult Education
  { code: 'A1', name: 'Adult Basic', level: 21, type: LEVEL_TYPES.ADULT },
  { code: 'A2', name: 'Adult Intermediate', level: 22, type: LEVEL_TYPES.ADULT },
  // Higher Education
  { code: 'H1', name: 'Higher Certificate', level: 23, type: LEVEL_TYPES.HIGHER_EDUCATION },
  { code: 'H2', name: 'Higher Diploma', level: 24, type: LEVEL_TYPES.HIGHER_EDUCATION },
];

// GET /levels - List all levels for school/curriculum
router.get('/', protect, async (req, res) => {
  try {
    const { curriculumId, type } = req.query;
    
    const where: any = { schoolId: req.user!.schoolId };
    
    if (curriculumId) {
      where.curriculumId = curriculumId as string;
    }
    
    if (type) {
      where.type = type as string;
    }

    const levels = await prisma.curriculumLevel.findMany({
      where,
      include: {
        _count: { select: { classes: true } }
      },
      orderBy: { level: 'asc' }
    });
    
    res.json(levels);
  } catch (error) {
    console.error('Failed to fetch levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// GET /levels/uganda-defaults - Get Uganda default curriculum levels
router.get('/uganda-defaults', protect, async (req, res) => {
  try {
    res.json(DEFAULT_UGANDA_LEVELS);
  } catch (error) {
    console.error('Failed to fetch Uganda defaults:', error);
    res.status(500).json({ error: 'Failed to fetch Uganda defaults' });
  }
});

// POST /levels/initialize-uganda - Initialize Uganda curriculum levels
router.post('/initialize-uganda', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can initialize curriculum' });
  }

  try {
    // Check if curriculum exists, create if not
    let curriculum = await prisma.curriculum.findFirst({
      where: { schoolId: req.user!.schoolId }
    });

    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: {
          name: 'Uganda Competency Based Curriculum',
          description: 'CBC - National Curriculum Development Centre',
          schoolId: req.user!.schoolId,
          isActive: true
        }
      });
    }

    // Check existing levels
    const existingLevels = await prisma.curriculumLevel.findMany({
      where: { curriculumId: curriculum.id }
    });

    if (existingLevels.length > 0) {
      return res.json({ 
        message: 'Curriculum levels already exist',
        levels: existingLevels 
      });
    }

    // Create all Uganda levels
    const createdLevels = await Promise.all(
      DEFAULT_UGANDA_LEVELS.map(levelData => 
        prisma.curriculumLevel.create({
          data: {
            code: levelData.code,
            name: levelData.name,
            level: levelData.level,
            type: levelData.type,
            curriculumId: curriculum.id
          }
        })
      )
    );

    res.status(201).json({
      message: 'Uganda curriculum levels initialized successfully',
      curriculum,
      levels: createdLevels
    });
  } catch (error) {
    console.error('Failed to initialize Uganda curriculum:', error);
    res.status(500).json({ error: 'Failed to initialize curriculum' });
  }
});

// GET /levels/:id - Get specific level with subjects
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const level = await prisma.curriculumLevel.findFirst({
      where: { id, schoolId: req.user!.schoolId },
      include: {
        subjects: {
          include: { subject: true }
        },
        classes: true,
        curriculum: true
      }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    res.json(level);
  } catch (error) {
    console.error(`Failed to fetch level ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch level' });
  }
});

// POST /levels - Create new level
router.post('/', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create levels' });
  }

  const { code, name, level, type, curriculumId } = req.body;

  if (!code || !name || !type) {
    return res.status(400).json({ error: 'Code, name, and type are required' });
  }

  try {
    // Get or create default curriculum
    let curriculum = curriculumId 
      ? await prisma.curriculum.findUnique({ where: { id: curriculumId } })
      : await prisma.curriculum.findFirst({ where: { schoolId: req.user!.schoolId } });

    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: {
          name: 'Uganda Competency Based Curriculum',
          schoolId: req.user!.schoolId,
          isActive: true
        }
      });
    }

    const newLevel = await prisma.curriculumLevel.create({
      data: {
        code,
        name,
        level: level || 0,
        type,
        curriculumId: curriculum.id
      }
    });

    res.status(201).json(newLevel);
  } catch (error) {
    console.error('Failed to create level:', error);
    res.status(500).json({ error: 'Failed to create level' });
  }
});

// PUT /levels/:id - Update level
router.put('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update levels' });
  }

  const { id } = req.params;
  const { code, name, level, type } = req.body;

  try {
    const existingLevel = await prisma.curriculumLevel.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const updatedLevel = await prisma.curriculumLevel.update({
      where: { id },
      data: { code, name, level, type }
    });

    res.json(updatedLevel);
  } catch (error) {
    console.error(`Failed to update level ${id}:`, error);
    res.status(500).json({ error: 'Failed to update level' });
  }
});

// DELETE /levels/:id - Delete level
router.delete('/:id', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete levels' });
  }

  const { id } = req.params;

  try {
    const existingLevel = await prisma.curriculumLevel.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: 'Level not found' });
    }

    await prisma.curriculumLevel.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete level ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete level' });
  }
});

// GET /levels/:id/subjects - Get subjects for a level
router.get('/:id/subjects', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const levelSubjects = await prisma.levelSubject.findMany({
      where: { levelId: id },
      include: {
        subject: true
      }
    });

    res.json(levelSubjects);
  } catch (error) {
    console.error(`Failed to fetch subjects for level ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// POST /levels/:id/subjects - Add subject to level
router.post('/:id/subjects', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { id } = req.params;
  const { subjectId, isEnabled = true } = req.body;

  if (!subjectId) {
    return res.status(400).json({ error: 'Subject ID is required' });
  }

  try {
    // Check if level exists
    const level = await prisma.curriculumLevel.findFirst({
      where: { id, schoolId: req.user!.schoolId }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Check if subject already added to level
    const existingMapping = await prisma.levelSubject.findFirst({
      where: { levelId: id, subjectId }
    });

    if (existingMapping) {
      return res.status(400).json({ error: 'Subject already added to this level' });
    }

    const levelSubject = await prisma.levelSubject.create({
      data: {
        levelId: id,
        subjectId,
        isEnabled
      },
      include: { subject: true }
    });

    res.status(201).json(levelSubject);
  } catch (error) {
    console.error(`Failed to add subject to level ${id}:`, error);
    res.status(500).json({ error: 'Failed to add subject to level' });
  }
});

// DELETE /levels/:id/subjects/:subjectId - Remove subject from level
router.delete('/:id/subjects/:subjectId', protect, async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can remove subjects' });
  }

  const { id, subjectId } = req.params;

  try {
    await prisma.levelSubject.deleteMany({
      where: { levelId: id, subjectId }
    });

    res.status(204).send();
  } catch (error) {
    console.error(`Failed to remove subject from level:`, error);
    res.status(500).json({ error: 'Failed to remove subject' });
  }
});

export default router;

