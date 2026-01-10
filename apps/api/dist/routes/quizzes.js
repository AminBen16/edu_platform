"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/quizzes.ts
const express_1 = require("express");
const database_1 = __importStar(require("../lib/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /quizzes - List quizzes for the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const quizzes = await database_1.default.quiz.findMany({
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
router.post('/', auth_1.protect, (0, auth_1.authorize)(database_1.Role.TEACHER, database_1.Role.SCHOOL_ADMIN, database_1.Role.SUPER_ADMIN), async (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions || !lessonId) {
        return res.status(400).json({ error: 'Title, questions, and lessonId are required.' });
    }
    try {
        const quiz = await database_1.default.quiz.create({
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
