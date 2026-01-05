// apps/api/src/routes/schools.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { authorize, protect } from '../middleware/auth';
import { Role } from 'db';

const router = Router();

// GET /schools - Fetches all schools (for SUPER_ADMIN) or the user's school
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user!;
    let schools;

    if (user.role === Role.SUPER_ADMIN) {
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

// POST /schools - Creates a new school (SUPER_ADMIN only)
router.post('/', protect, authorize(Role.SUPER_ADMIN), async (req, res) => {
    const { name, logoUrl } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }

    try {
        const newSchool = await prisma.school.create({
            data: {
                name,
                logoUrl,
            },
        });
        res.status(201).json(newSchool);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the school.' });
    }
});


export default router;