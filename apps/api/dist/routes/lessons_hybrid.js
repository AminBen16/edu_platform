"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/lessons_hybrid.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
const lessonsStore = [];
// GET /lessons - List lessons with hybrid approach
router.get('/', auth_1.protect, async (req, res) => {
    try {
        // Try database first (when available)
        if (process.env.DATABASE_URL) {
            const lessons = await database_1.prisma.lesson.findMany({
                where: {
                    schoolId: req.user.schoolId,
                    isPublished: true
                },
                include: {
                    subject: {
                        select: { id: true, name: true, code: true }
                    },
                    teacher: {
                        select: { id: true, user: { select: { name: true, email: true } } }
                    },
                    class: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(lessons);
        }
        else {
            // Fallback to in-memory data for demo
            res.json(lessonsStore);
        }
    }
    catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});
// POST /lessons - Create a lesson with hybrid approach
router.post('/', auth_1.protect, async (req, res) => {
    const { title, description, content, type, videoUrl, duration, order, subjectId, classId } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    try {
        let lesson;
        // Use real database if available
        if (process.env.DATABASE_URL) {
            lesson = await database_1.prisma.lesson.create({
                data: {
                    title,
                    description,
                    content,
                    type: type || 'LESSON',
                    videoUrl,
                    duration: duration ? parseInt(duration) : null,
                    order: order ? parseInt(order) : null,
                    isPublished: true,
                    schoolId: req.user.schoolId,
                    subjectId: subjectId || null,
                    teacherId: req.user.id,
                    classId: classId || null,
                },
                include: {
                    subject: {
                        select: { id: true, name: true, code: true }
                    },
                    teacher: {
                        select: { id: true, user: { select: { name: true, email: true } } }
                    }
                }
            });
        }
        else {
            // Fallback to in-memory data for demo
            lesson = {
                id: `lesson-${Date.now()}`,
                title,
                description,
                content,
                type: type || 'LESSON',
                videoUrl,
                duration: duration ? parseInt(duration) : undefined,
                order: order ? parseInt(order) : undefined,
                isPublished: true,
                schoolId: req.user.schoolId,
                subjectId: subjectId || undefined,
                teacherId: req.user.id,
                classId: classId || undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            // Add to in-memory store
            lessonsStore.push(lesson);
        }
        res.status(201).json(lesson);
    }
    catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});
// GET /lessons/:id - Get a specific lesson
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        if (process.env.DATABASE_URL) {
            const lesson = await database_1.prisma.lesson.findUnique({
                where: { id },
                include: {
                    subject: {
                        select: { id: true, name: true, code: true }
                    },
                    teacher: {
                        select: { id: true, user: { select: { name: true, email: true } } }
                    },
                    class: {
                        select: { id: true, name: true }
                    },
                    resources: true,
                    assignments: {
                        include: {
                            submissions: {
                                select: { id: true, studentId: true, score: true, submittedAt: true }
                            }
                        }
                    }
                }
            });
            if (!lesson) {
                return res.status(404).json({ error: 'Lesson not found' });
            }
            res.json(lesson);
        }
        else {
            // Fallback to in-memory data
            const lesson = lessonsStore.find(l => l.id === id);
            if (!lesson) {
                return res.status(404).json({ error: 'Lesson not found' });
            }
            res.json(lesson);
        }
    }
    catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});
// PUT /lessons/:id - Update a lesson
router.put('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    const { title, description, content, type, videoUrl, duration, order, subjectId, classId, isPublished } = req.body;
    try {
        if (process.env.DATABASE_URL) {
            const lesson = await database_1.prisma.lesson.update({
                where: { id },
                data: {
                    title,
                    description,
                    content,
                    type: type || 'LESSON',
                    videoUrl,
                    duration: duration ? parseInt(duration) : undefined,
                    order: order ? parseInt(order) : undefined,
                    isPublished: isPublished !== undefined ? isPublished : true,
                    subjectId: subjectId || null,
                    classId: classId || null,
                    updatedAt: new Date(),
                },
                include: {
                    subject: {
                        select: { id: true, name: true, code: true }
                    },
                    teacher: {
                        select: { id: true, user: { select: { name: true, email: true } } }
                    }
                }
            });
            res.json(lesson);
        }
        else {
            // Fallback to in-memory data
            const lessonIndex = lessonsStore.findIndex(l => l.id === id);
            if (lessonIndex === -1) {
                return res.status(404).json({ error: 'Lesson not found' });
            }
            lessonsStore[lessonIndex] = {
                ...lessonsStore[lessonIndex],
                title,
                description,
                content,
                type: type || 'LESSON',
                videoUrl,
                duration: duration ? parseInt(duration) : undefined,
                order: order ? parseInt(order) : undefined,
                isPublished: isPublished !== undefined ? isPublished : lessonsStore[lessonIndex].isPublished,
                subjectId: subjectId || lessonsStore[lessonIndex].subjectId,
                classId: classId || lessonsStore[lessonIndex].classId,
                updatedAt: new Date().toISOString(),
            };
            res.json(lessonsStore[lessonIndex]);
        }
    }
    catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});
// DELETE /lessons/:id - Delete a lesson
router.delete('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        if (process.env.DATABASE_URL) {
            await database_1.prisma.lesson.delete({
                where: { id }
            });
        }
        else {
            // Fallback to in-memory data
            const lessonIndex = lessonsStore.findIndex(l => l.id === id);
            if (lessonIndex === -1) {
                return res.status(404).json({ error: 'Lesson not found' });
            }
            lessonsStore.splice(lessonIndex, 1);
        }
        res.json({ message: 'Lesson deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});
exports.default = router;
