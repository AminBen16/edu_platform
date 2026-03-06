// Announcements management
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /announcements - Get all announcements for a school
router.get('/', protect, async (req, res) => {
    try {
        const { schoolId, role, id: userId } = req.user!;
        const { classId, type } = req.query;
        
        const where: any = {
            schoolId,
            startDate: { lte: new Date() },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
            ]
        };

        // Students can only see public announcements or those for their classes
        if (role === 'STUDENT') {
            where.OR = [
                { isPublic: true },
                { classId: null }
            ];
        }

        if (classId) where.classId = classId as string;
        if (type) where.type = type as string;

        const announcements = await prisma.announcement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { name: true } },
                class: { select: { name: true } }
            }
        });
        res.json(announcements);
    } catch (error) {
        console.error('Failed to fetch announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements.' });
    }
});

// GET /announcements/:id - Get a specific announcement
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const announcement = await prisma.announcement.findFirst({
            where: { id, schoolId: req.user!.schoolId },
            include: {
                author: { select: { name: true } },
                class: { select: { name: true } }
            }
        });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.json(announcement);
    } catch (error) {
        console.error('Failed to fetch announcement:', error);
        res.status(500).json({ error: 'Failed to fetch announcement.' });
    }
});

// POST /announcements - Create a new announcement
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create announcements.' });
    }

    const { title, content, type, priority, isPublic, startDate, endDate, classId } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    try {
        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'GENERAL',
                priority: priority || 'NORMAL',
                isPublic: isPublic !== false,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                authorId: req.user!.id,
                classId: classId || null,
                schoolId: req.user!.schoolId
            },
            include: {
                author: { select: { name: true } }
            }
        });
        res.status(201).json(announcement);
    } catch (error) {
        console.error('Failed to create announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement.' });
    }
});

// PUT /announcements/:id - Update an announcement
router.put('/:id', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to update announcements.' });
    }

    const { id } = req.params;
    const { title, content, type, priority, isPublic, startDate, endDate, classId } = req.body;

    try {
        const announcement = await prisma.announcement.findFirst({
            where: { id, schoolId: req.user!.schoolId }
        });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(type && { type }),
                ...(priority && { priority }),
                ...(isPublic !== undefined && { isPublic }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(classId !== undefined && { classId: classId || null })
            },
            include: {
                author: { select: { name: true } }
            }
        });
        res.json(updatedAnnouncement);
    } catch (error) {
        console.error('Failed to update announcement:', error);
        res.status(500).json({ error: 'Failed to update announcement.' });
    }
});

// DELETE /announcements/:id - Delete an announcement
router.delete('/:id', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to delete announcements.' });
    }

    const { id } = req.params;

    try {
        const announcement = await prisma.announcement.findFirst({
            where: { id, schoolId: req.user!.schoolId }
        });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        await prisma.announcement.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete announcement:', error);
        res.status(500).json({ error: 'Failed to delete announcement.' });
    }
});

export default router;

