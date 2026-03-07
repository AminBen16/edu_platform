"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/quizzes.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /quizzes - List quizzes for user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const quizzes = await database_1.prisma.quiz.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { createdAt: 'desc' },
            include: {
                teacher: {
                    select: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                subject: {
                    select: { name: true }
                }
            }
        });
        res.json(quizzes);
    }
    catch (error) {
        console.error('Failed to fetch quizzes:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes.' });
    }
});
// GET /quizzes/:id - Get a specific quiz with questions
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await database_1.prisma.quiz.findUnique({
            where: { id, schoolId: req.user.schoolId },
        });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json(quiz);
    }
    catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Failed to fetch quiz.' });
    }
});
// POST /quizzes - Create a quiz (only for teachers and admins)
router.post('/', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create quizzes.' });
    }
    const { title, description, type, timeLimit, duration, maxAttempts, passingScore, isPublished, subjectId, difficulty, questions // Expects questions as array with options
     } = req.body;
    if (!title || !description || !subjectId || !questions) {
        return res.status(400).json({ error: 'Title, description, subjectId, and questions are required.' });
    }
    try {
        // Get teacher profile ID
        const teacher = await database_1.prisma.teacher.findUnique({
            where: { userId: req.user.id }
        });
        const newQuiz = await database_1.prisma.quiz.create({
            data: {
                title,
                description,
                type: type || 'ASSIGNMENT',
                timeLimit: timeLimit ? parseInt(timeLimit) : duration ? parseInt(duration) : null,
                maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
                passingScore: passingScore ? parseFloat(passingScore) : null,
                isPublished: isPublished || false,
                difficulty,
                schoolId: req.user.schoolId,
                teacherId: teacher?.id,
                subjectId,
                questions: {
                    create: questions.map((q, index) => ({
                        text: q.text,
                        type: q.type || 'MULTIPLE_CHOICE',
                        order: q.order || index,
                        points: q.points || 1.0,
                        schoolId: req.user.schoolId,
                        options: q.options ? {
                            create: q.options.map((opt) => ({
                                text: opt.text,
                                isCorrect: opt.isCorrect || false,
                                order: opt.order || 0,
                                schoolId: req.user.schoolId
                            }))
                        } : undefined
                    }))
                }
            },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });
        res.status(201).json(newQuiz);
    }
    catch (error) {
        console.error('Quiz creation error:', error);
        res.status(500).json({ error: 'Failed to create quiz.' });
    }
});
// PUT /quizzes/:id - Update a quiz
router.put('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await database_1.prisma.quiz.findUnique({
            where: { id, schoolId: req.user.schoolId },
        });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Check if user is admin or the teacher who created the quiz
        let isAuthorized = req.user.role === "ADMIN";
        if (!isAuthorized && req.user.role === "TEACHER") {
            const teacher = await database_1.prisma.teacher.findUnique({
                where: { userId: req.user.id }
            });
            isAuthorized = teacher?.id === quiz.teacherId;
        }
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to update this quiz.' });
        }
        const updatedQuiz = await database_1.prisma.quiz.update({
            where: { id },
            data: { ...req.body, updatedAt: new Date() },
        });
        res.json(updatedQuiz);
    }
    catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ error: 'Failed to update quiz.' });
    }
});
// DELETE /quizzes/:id - Delete a quiz
router.delete('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await database_1.prisma.quiz.findUnique({
            where: { id, schoolId: req.user.schoolId },
        });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Check if user is admin or the teacher who created the quiz
        let isAuthorized = req.user.role === "ADMIN";
        if (!isAuthorized && req.user.role === "TEACHER") {
            const teacher = await database_1.prisma.teacher.findUnique({
                where: { userId: req.user.id }
            });
            isAuthorized = teacher?.id === quiz.teacherId;
        }
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to delete this quiz.' });
        }
        await database_1.prisma.quiz.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ error: 'Failed to delete quiz.' });
    }
});
// POST /quizzes/:id/submit - Submit quiz answers
router.post('/:id/submit', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Only students can submit quizzes.' });
    }
    const { id: quizId } = req.params;
    const { answers } = req.body; // Expects an array of { questionId: string, selectedId: string, textAnswer: string }
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Invalid submission format.' });
    }
    try {
        const quiz = await database_1.prisma.quiz.findUnique({
            where: { id: quizId, schoolId: req.user.schoolId },
            include: {
                questions: {
                    include: {
                        options: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        if (!quiz || !quiz.isPublished) {
            return res.status(404).json({ error: 'Quiz not found or is not available.' });
        }
        // Ensure user is a student profile
        const student = await database_1.prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(403).json({ error: 'User is not a student.' });
        }
        // Check max attempts
        const existingAttempts = await database_1.prisma.quizAttempt.count({
            where: { studentId: student.id, quizId }
        });
        if (quiz.maxAttempts && existingAttempts >= quiz.maxAttempts) {
            return res.status(403).json({ error: 'Maximum attempts reached for this quiz.' });
        }
        const quizQuestions = quiz.questions;
        let score = 0;
        let maxScore = 0;
        const answerRecords = answers.map((answer) => {
            const question = quizQuestions.find((q) => q.id === answer.questionId);
            if (!question)
                return null;
            let isCorrect = false;
            maxScore += (question.points || 1.0);
            if (question.type === 'MULTIPLE_CHOICE') {
                const correctOption = question.options.find((opt) => opt.isCorrect);
                if (correctOption && correctOption.id === answer.selectedId) {
                    isCorrect = true;
                    score += (question.points || 1.0);
                }
            }
            return {
                questionId: answer.questionId,
                selectedId: answer.selectedId,
                textAnswer: answer.textAnswer,
                isCorrect,
            };
        }).filter(a => a !== null);
        const quizAttempt = await database_1.prisma.quizAttempt.create({
            data: {
                score,
                maxScore,
                completedAt: new Date(),
                studentId: student.id,
                quizId: quizId,
                userId: req.user.id,
                schoolId: req.user.schoolId,
                answers: {
                    create: answerRecords.map(a => ({
                        ...a,
                        schoolId: req.user.schoolId
                    })),
                },
            },
            include: {
                answers: true,
            },
        });
        res.status(201).json(quizAttempt);
    }
    catch (error) {
        console.error('Quiz submission error:', error);
        res.status(500).json({ error: 'Failed to submit quiz.' });
    }
});
exports.default = router;
