"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/exams.ts
const express_1 = require("express");
const db_1 = __importDefault(require("db"));
const auth_1 = require("../middleware/auth");
const db_2 = require("db");
const router = (0, express_1.Router)();
// GET /exams - List exams for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const exams = await db_1.default.quiz.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(exams);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams.' });
    }
});
// POST /exams - Create an exam (teacher or admin)
router.post('/', auth_1.protect, (0, auth_1.authorize)(db_2.Role.TEACHER, db_2.Role.SCHOOL_ADMIN, db_2.Role.SUPER_ADMIN), async (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions || !lessonId) {
        return res.status(400).json({ error: 'Title, questions, and lessonId are required.' });
    }
    try {
        const exam = await db_1.default.quiz.create({
            data: {
                title,
                questions,
                lessonId,
                schoolId: req.user.schoolId,
                authorId: req.user.id,
            },
        });
        res.status(201).json(exam);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create exam.' });
    }
});
exports.default = router;
