"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/lessons_hybrid.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// In-memory storage for demo (persists until restart)
let lessonsStore = [
    {
        id: '1',
        title: 'Introduction to Mathematics',
        description: 'Basic concepts and fundamentals of mathematics',
        content: 'This lesson covers numbers, basic operations, and introductory algebra.',
        topicId: 'math-101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
// GET /lessons - List lessons with optional database
router.get('/', auth_1.protect, async (req, res) => {
    try {
        // Try database first (when available)
        if (process.env.DATABASE_URL) {
            // TODO: Add real database queries here
            // const lessons = await prisma.lesson.findMany({...});
        }
        // Fallback to in-memory data for demo
        res.json(lessonsStore);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});
// POST /lessons - Create with persistence
router.post('/', auth_1.protect, async (req, res) => {
    const { title, content, topicId } = req.body;
    if (!title || !content || !topicId) {
        return res.status(400).json({ error: 'Title, content, and topicId are required.' });
    }
    try {
        const newLesson;
        `,
            title,
            description: content,
            topicId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        // Add to in-memory store
        lessonsStore.push(newLesson);
        
        // TODO: Save to database when available
        // if (process.env.DATABASE_URL) {
        //     await prisma.lesson.create({
        //         data: {
        //             title,
        //             description: content,
        //             topicId,
        //             schoolId: req.user!.schoolId,
        //             authorId: req.user!.id,
        //         },
        //     });
        // }
        
        res.status(201).json(newLesson);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});

export default router;
        ;
    }
    finally { }
});
