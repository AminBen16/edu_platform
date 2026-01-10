"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/quizzes.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /quizzes - List quizzes for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const quizzes = await database_1.prisma.quiz.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(quizzes);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch quizzes.' });
    }
});
// POST /quizzes - Create a quiz (teacher or admin)
router.post('/', auth_1.protect, (0, auth_1.authorize)('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    const { title, questions, subjectId } = req.body;
    if (!title || !questions || !subjectId) {
        return res.status(400).json({ error: 'Title, questions, and subjectId are required.' });
    }
    try {
        const quiz = await database_1.prisma.quiz.create({
            data: {
                title,
                questions,
                subjectId,
                schoolId: req.user.schoolId,
                teacherId: req.user.id,
            },
        });
        res.status(201).json(quiz);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create quiz.' });
    }
});
exports.default = router;
