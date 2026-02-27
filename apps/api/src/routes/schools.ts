// apps/api/src/routes/schools.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /schools - Fetches all schools (SUPER_ADMIN) or the user's school.
router.get('/', protect, async (req, res) => {
    try {
        const { role, schoolId } = req.user!;
        const schools = await prisma.school.findMany({
            where: role === 'SUPER_ADMIN' ? undefined : { id: schoolId },
            orderBy: { name: 'asc' },
        });

        res.json(schools);
    } catch (error) {
        console.error('Failed to fetch schools:', error);
        res.status(500).json({ error: 'Failed to fetch schools.' });
    }
});

// GET /schools/:id - Get a specific school's public details
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const school = await prisma.school.findUnique({
            where: { id },
            select: { id: true, name: true, logoUrl: true, domain: true }
        });

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.json(school);
    } catch (error) {
        console.error(`Failed to fetch school ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch school.' });
    }
});


// POST /schools - Creates a new school (SUPER_ADMIN only)
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create schools.' });
    }

    const { name, domain, logoUrl, settings } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }

    try {
        const newSchool = await prisma.school.create({
            data: { name, domain, logoUrl, settings: settings || {} },
        });
        res.status(201).json(newSchool);
    } catch (error) {
        console.error('Failed to create school:', error);
        // @ts-ignore
        if (error.code === 'P2002') { // Prisma unique constraint violation for domain
            return res.status(409).json({ error: 'A school with this domain already exists.' });
        }
        res.status(500).json({ error: 'Failed to create school.' });
    }
});

// PUT /schools/:id - Update school details (School ADMIN or SUPER_ADMIN)
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { name, domain, logoUrl, settings } = req.body;
    const { role, schoolId } = req.user!;

    if (role !== 'SUPER_ADMIN' && (role !== 'ADMIN' || schoolId !== id)) {
        return res.status(403).json({ error: 'You are not authorized to update this school.' });
    }

    try {
        const school = await prisma.school.findUnique({ where: { id } });
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }
        
        // Merge settings to avoid overwriting existing ones
        const currentSettings = (school.settings || {}) as object;
        const newSettings = { ...currentSettings, ...settings };

        const updatedSchool = await prisma.school.update({
            where: { id },
            data: {
                name: name || undefined,
                domain: domain || undefined,
                logoUrl: logoUrl || undefined,
                settings: newSettings
            },
        });
        res.json(updatedSchool);
    } catch (error) {
        console.error(`Failed to update school ${id}:`, error);
        res.status(500).json({ error: 'Failed to update school.' });
    }
});

// DELETE /schools/:id - Delete a school (SUPER_ADMIN only)
router.delete('/:id', protect, async (req, res) => {
    if (req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to delete schools.' });
    }
    const { id } = req.params;

    try {
        await prisma.school.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error(`Failed to delete school ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete school.' });
    }
});

export default router;
