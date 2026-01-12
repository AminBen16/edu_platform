// apps/api/src/routes/lessons.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /lessons - List lessons for user's school
router.get('/', protect, async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany({
            where: { schoolId: req.user!.schoolId },
            orderBy: { createdAt: 'desc' },
            include: {
                teacher: true,
                subject: true,
                class: true,
            },
        });
        res.json(lessons);
    } catch (error) {
        console.error('Failed to fetch lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});

// GET /lessons/:id - Get a specific lesson
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id, schoolId: req.user!.schoolId },
            include: {
                teacher: true,
                subject: true,
                class: true,
                resources: true,
                assignments: true,
            },
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to fetch lesson.' });
    }
});

// POST /lessons - Create a lesson (only for teachers and admins)
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== UserRole.TEACHER && req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to create lessons.' });
    }

    const {
        title,
        description,
        content,
        type,
        videoUrl,
        documentUrl,
        duration,
        order,
        isPublished,
        subjectId,
        classId,
        difficulty,
        tags,
    } = req.body;

    if (!title || !description || !subjectId || !classId) {
        return res.status(400).json({ error: 'Title, description, subjectId, and classId are required.' });
    }

    try {
        const newLesson = await prisma.lesson.create({
            data: {
                title,
                description,
                content,
                type,
                videoUrl,
                documentUrl,
                duration: duration ? parseInt(duration) : undefined,
                order: order ? parseInt(order) : undefined,
                isPublished: isPublished || false,
                difficulty,
                tags,
                schoolId: req.user!.schoolId,
                teacherId: req.user!.id,
                subjectId,
                classId,
            },
        });
        res.status(201).json(newLesson);
    } catch (error) {
        console.error('Lesson creation error:', error);
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});

// PUT /lessons/:id - Update a lesson (only for the teacher who created it or an admin)
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        content,
        type,
        videoUrl,
        documentUrl,
        duration,
        order,
        isPublished,
        subjectId,
        classId,
        difficulty,
        tags,
    } = req.body;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id, schoolId: req.user!.schoolId },
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (req.user!.role !== UserRole.ADMIN && lesson.teacherId !== req.user!.id) {
            return res.status(403).json({ error: 'You are not authorized to update this lesson.' });
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id },
            data: {
                title,
                description,
                content,
                type,
                videoUrl,
                documentUrl,
                duration: duration ? parseInt(duration) : undefined,
                order: order ? parseInt(order) : undefined,
                isPublished,
                difficulty,
                tags,
                subjectId,
                classId,
                updatedAt: new Date(),
            },
        });
        res.json(updatedLesson);
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ error: 'Failed to update lesson.' });
    }
});

// DELETE /lessons/:id - Delete a lesson (only for the teacher who created it or an admin)
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id, schoolId: req.user!.schoolId },
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (req.user!.role !== UserRole.ADMIN && lesson.teacherId !== req.user!.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this lesson.' });
        }

        await prisma.lesson.delete({
            where: { id },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Failed to delete lesson.' });
    }
});

export default router;
