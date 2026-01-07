"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/quizzes.ts
const express_1 = require("express");
const db_1 = __importDefault(require("db"));
const auth_1 = require("../middleware/auth");
const db_2 = require("db");
const router = (0, express_1.Router)();
// GET /quizzes - List quizzes for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const quizzes = await db_1.default.quiz.findMany({
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
router.post('/', auth_1.protect, (0, auth_1.authorize)(db_2.Role.TEACHER, db_2.Role.SCHOOL_ADMIN, db_2.Role.SUPER_ADMIN), async (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions || !lessonId) {
        return res.status(400).json({ error: 'Title, questions, and lessonId are required.' });
    }
    try {
        const quiz = await db_1.default.quiz.create({
            data: {
                title,
                questions,
                lessonId,
                schoolId: req.user.schoolId,
                authorId: req.user.id,
            },
        });
        res.status(201).json(quiz);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create quiz.' });
    }
});
exports.default = router;
