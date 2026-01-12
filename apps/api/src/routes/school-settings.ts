// apps/api/src/routes/school-settings.ts
// Professional school settings management
import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const router = Router();

// GET /school-settings - Get school settings
router.get('/', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;

  try {
    let settings = await (prisma as any).schoolSettings.findUnique({
      where: { schoolId }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await (prisma as any).schoolSettings.create({
        data: {
          schoolId,
          academicYear: '2024-2025',
          semester: 'Fall',
          gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
          timezone: 'UTC',
          onlineGrading: false,
          digitalLibrary: false,
          parentPortal: false
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching school settings:', error);
    res.status(500).json({ error: 'Failed to fetch school settings' });
  }
});

// PUT /school-settings - Update school settings
router.put('/', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const {
    academicYear,
    semester,
    gradingScale,
    timezone,
    onlineGrading,
    digitalLibrary,
    parentPortal,
    schoolEmail,
    schoolPhone,
    emergencyContact
  } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: {
        academicYear,
        semester,
        gradingScale,
        timezone,
        onlineGrading,
        digitalLibrary,
        parentPortal,
        schoolEmail,
        schoolPhone,
        emergencyContact
      },
      create: {
        schoolId,
        academicYear: academicYear || '2024-2025',
        semester: semester || 'Fall',
        gradingScale: gradingScale || { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: timezone || 'UTC',
        onlineGrading: onlineGrading || false,
        digitalLibrary: digitalLibrary || false,
        parentPortal: parentPortal || false,
        schoolEmail,
        schoolPhone,
        emergencyContact
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating school settings:', error);
    res.status(500).json({ error: 'Failed to update school settings' });
  }
});

// PATCH /school-settings/academic-year - Update academic year
router.patch('/academic-year', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { academicYear } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: { academicYear },
      create: {
        schoolId,
        academicYear: academicYear || '2024-2025',
        semester: 'Fall',
        gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: 'UTC',
        onlineGrading: false,
        digitalLibrary: false,
        parentPortal: false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating academic year:', error);
    res.status(500).json({ error: 'Failed to update academic year' });
  }
});

// PATCH /school-settings/semester - Update semester
router.patch('/semester', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { semester } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: { semester },
      create: {
        schoolId,
        academicYear: '2024-2025',
        semester: semester || 'Fall',
        gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: 'UTC',
        onlineGrading: false,
        digitalLibrary: false,
        parentPortal: false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ error: 'Failed to update semester' });
  }
});

// PATCH /school-settings/grading-scale - Update grading scale
router.patch('/grading-scale', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { gradingScale } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: { gradingScale },
      create: {
        schoolId,
        academicYear: '2024-2025',
        semester: 'Fall',
        gradingScale: gradingScale || { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: 'UTC',
        onlineGrading: false,
        digitalLibrary: false,
        parentPortal: false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating grading scale:', error);
    res.status(500).json({ error: 'Failed to update grading scale' });
  }
});

// PATCH /school-settings/timezone - Update timezone
router.patch('/timezone', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { timezone } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: { timezone },
      create: {
        schoolId,
        academicYear: '2024-2025',
        semester: 'Fall',
        gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: timezone || 'UTC',
        onlineGrading: false,
        digitalLibrary: false,
        parentPortal: false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating timezone:', error);
    res.status(500).json({ error: 'Failed to update timezone' });
  }
});

// PATCH /school-settings/features - Update feature toggles
router.patch('/features', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { onlineGrading, digitalLibrary, parentPortal } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: {
        onlineGrading,
        digitalLibrary,
        parentPortal
      },
      create: {
        schoolId,
        academicYear: '2024-2025',
        semester: 'Fall',
        gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: 'UTC',
        onlineGrading: onlineGrading || false,
        digitalLibrary: digitalLibrary || false,
        parentPortal: parentPortal || false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating features:', error);
    res.status(500).json({ error: 'Failed to update features' });
  }
});

// PATCH /school-settings/contact - Update contact information
router.patch('/contact', protect, authorize(Role.ADMIN, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN), async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { schoolEmail, schoolPhone, emergencyContact } = req.body;

  try {
    const settings = await (prisma as any).schoolSettings.upsert({
      where: { schoolId },
      update: {
        schoolEmail,
        schoolPhone,
        emergencyContact
      },
      create: {
        schoolId,
        academicYear: '2024-2025',
        semester: 'Fall',
        gradingScale: { "A": 90, "B": 80, "C": 70, "D": 60, "F": 0 },
        timezone: 'UTC',
        onlineGrading: false,
        digitalLibrary: false,
        parentPortal: false,
        schoolEmail,
        schoolPhone,
        emergencyContact
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating contact information:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

export default router;
