"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/lessons.ts
const express_1 = require("express");
const db_1 = __importDefault(require("db"));
const auth_1 = require("../middleware/auth");
const db_2 = require("db");
const router = (0, express_1.Router)();
// GET /lessons - List lessons for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const lessons = await db_1.default.lesson.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(lessons);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});
// POST /lessons - Create a lesson (teacher or admin)
router.post('/', auth_1.protect, (0, auth_1.authorize)(db_2.Role.TEACHER, db_2.Role.SCHOOL_ADMIN, db_2.Role.SUPER_ADMIN), async (req, res) => {
    const { title, content, topicId } = req.body;
    if (!title || !content || !topicId) {
        return res.status(400).json({ error: 'Title, content, and topicId are required.' });
    }
    try {
        const lesson = await db_1.default.lesson.create({
            data: {
                title,
                description: content,
                topicId,
                schoolId: req.user.schoolId,
                authorId: req.user.id,
            },
        });
        res.status(201).json(lesson);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});
exports.default = router;
