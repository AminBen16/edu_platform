"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/lessons.ts
const express_1 = require("express");
const database_1 = require("../lib/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Mock lessons data for fallback
const mockLessons = [
    {
        id: '1',
        title: 'Introduction to Mathematics',
        description: 'Basic concepts and fundamentals of mathematics',
        content: 'This lesson covers numbers, basic operations, and introductory algebra.',
        topicId: 'math-101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Physics Fundamentals',
        description: 'Introduction to basic physics concepts including motion, forces, and energy.',
        content: 'Learn about Newton\'s laws, kinematics, and basic mechanics.',
        topicId: 'physics-101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'Chemistry Basics',
        description: 'Understanding atoms, molecules, and chemical reactions.',
        content: 'Explore the periodic table, chemical bonds, and basic reactions.',
        topicId: 'chemistry-101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
// GET /lessons - List lessons for user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        // Use real database if available, fallback to mock data
        if (process.env.DATABASE_URL && database_1.prisma) {
            const lessons = await database_1.prisma.findLessons({
                where: { schoolId: req.user.schoolId },
            });
            res.json(lessons);
        }
        else {
            // Fallback to mock data for demo
            res.json(mockLessons);
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});
// POST /lessons - Create a lesson
router.post('/', auth_1.protect, async (req, res) => {
    const { title, content, topicId } = req.body;
    if (!title || !content || !topicId) {
        return res.status(400).json({ error: 'Title, content, and topicId are required.' });
    }
    try {
        let lesson;
        // Use real database if available
        if (process.env.DATABASE_URL && database_1.prisma) {
            lesson = await database_1.prisma.createLesson({
                title,
                description: content,
                topicId,
                schoolId: req.user.schoolId,
                authorId: req.user.id,
            });
        }
        else {
            // Fallback to mock data for demo
            lesson = {
                id: `lesson-${Date.now()}`,
                title,
                description: content,
                topicId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
        res.status(201).json(lesson);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});
exports.default = router;
