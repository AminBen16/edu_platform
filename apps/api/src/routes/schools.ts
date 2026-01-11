// apps/api/src/routes/schools.ts
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authorize, protect } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';

const router = Router();

// GET /schools - Fetches all schools (for SUPER_ADMIN) or the user's school
router.get('/', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    let schools;

    if (user.role === 'SUPER_ADMIN') {
      schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Other roles can only see their own school
      schools = await prisma.school.findMany({
        where: { id: user.schoolId },
      });
    }
    
    res.status(200).json(schools);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching schools.' });
  }
});

// GET /schools/current - Get current user's school with full details
router.get('/current', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user!;
    
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        classes: true
      }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.status(200).json(school);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching school details.' });
  }
});

// POST /schools - Creates a new school (SUPER_ADMIN only)
router.post('/', protect, authorize('SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
    const { name, code, address, phone, email, principal, vicePrincipal, academicYear, semester, timezone, gradingScale, attendancePolicy, features } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }

    try {
        const newSchool = await prisma.school.create({
            data: {
                name,
                logoUrl: code || null,
                settings: {
                    address: address || '',
                    phone: phone || '',
                    email: email || '',
                    principal: principal || '',
                    vicePrincipal: vicePrincipal || '',
                    academicYear: academicYear || '2023-2024',
                    semester: semester || 'Fall',
                    timezone: timezone || 'UTC',
                    gradingScale: gradingScale || '4.0 GPA Scale',
                    attendancePolicy: attendancePolicy || 'Standard attendance policy',
                    features: features || {
                      onlineGrading: true,
                      digitalLibrary: true,
                      parentPortal: true,
                      studentEmail: true,
                      emergencyAlerts: true,
                    },
                },
            },
        });
        res.status(201).json(newSchool);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the school.' });
    }
});

// PUT /schools/:id - Update school details (ADMIN/SCHOOL_ADMIN/SUPER_ADMIN)
router.put('/:id', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = req.user!;
    
    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== id) {
      return res.status(403).json({ error: 'Not authorized to update this school' });
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        settings: updates
      }
    });

    res.status(200).json(updatedSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the school.' });
  }
});

// POST /schools/:id/subjects - Add subjects to school
router.post('/:id/subjects', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { subjects } = req.body;

  try {
    const user = req.user!;
    
    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== id) {
      return res.status(403).json({ error: 'Not authorized to manage this school' });
    }

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Create subjects
    const subjectPromises = subjects.map((subject: any) => 
      prisma.subject.create({
        data: {
          name: subject.name,
          code: subject.code,
          description: subject.description,
          color: subject.color,
          schoolId: id,
        }
      })
    );

    await Promise.all(subjectPromises);

    res.status(200).json({ message: 'Subjects added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding subjects.' });
  }
});

// POST /schools/:id/levels - Add grade levels to school settings
router.post('/:id/levels', protect, authorize('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { levels } = req.body;

  try {
    const user = req.user!;
    
    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== id) {
      return res.status(403).json({ error: 'Not authorized to manage this school' });
    }

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        settings: {
          ...(school.settings as any || {}),
          levels: levels || []
        }
      }
    });

    res.status(200).json(updatedSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating levels.' });
  }
});

export default router;
