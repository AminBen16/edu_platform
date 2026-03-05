// apps/api/src/routes/quizzes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /quizzes - List quizzes for user's school
router.get('/', protect, async (req, res) => {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { schoolId: req.user!.schoolId },
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
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to fetch quizzes.' });
    }
});

// GET /quizzes/:id - Get a specific quiz with questions
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id, schoolId: req.user!.schoolId },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to fetch quiz.' });
    }
});

// POST /quizzes - Create a quiz (only for teachers and admins)
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create quizzes.' });
    }

    const {
        title,
        description,
        type,
        timeLimit,
        maxAttempts,
        passingScore,
        isPublished,
        subjectId,
        difficulty,
        questions // Expects questions as array with options
    } = req.body;

    if (!title || !description || !subjectId || !questions) {
        return res.status(400).json({ error: 'Title, description, subjectId, and questions are required.' });
    }

    try {
        const newQuiz = await prisma.quiz.create({
            data: {
                title,
                description,
                type,
                timeLimit: timeLimit ? parseInt(timeLimit) : null,
                maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
                passingScore: passingScore ? parseFloat(passingScore) : null,
                isPublished: isPublished || false,
                difficulty,
                schoolId: req.user!.schoolId,
                teacherId: req.user!.id,
                subjectId,
                questions: {
                    create: questions.map((q: any, index: number) => ({
                        text: q.text,
                        type: q.type,
                        order: q.order || index,
                        points: q.points || 1.0,
                        options: q.options ? {
                            create: q.options.map((opt: any) => ({
                                text: opt.text,
                                isCorrect: opt.isCorrect || false
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
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to create quiz.' });
    }
});

// PUT /quizzes/:id - Update a quiz
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id, schoolId: req.user!.schoolId },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        if (req.user!.role !== "ADMIN" && quiz.teacherId !== req.user!.id) {
            return res.status(403).json({ error: 'You are not authorized to update this quiz.' });
        }

        const updatedQuiz = await prisma.quiz.update({
            where: { id },
            data: { ...req.body, updatedAt: new Date() },
        });
        res.json(updatedQuiz);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to update quiz.' });
    }
});

// DELETE /quizzes/:id - Delete a quiz
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id, schoolId: req.user!.schoolId },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        if (req.user!.role !== "ADMIN" && quiz.teacherId !== req.user!.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this quiz.' });
        }

        await prisma.quiz.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to delete quiz.' });
    }
});

// POST /quizzes/:id/submit - Submit quiz answers
router.post('/:id/submit', protect, async (req, res) => {
    if (req.user!.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Only students can submit quizzes.' });
    }

    const { id: quizId } = req.params;
    const { answers } = req.body; // Expects an array of { questionId: string, selectedId: string, textAnswer: string }

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Invalid submission format.' });
    }

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId, schoolId: req.user!.schoolId },
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
        const student = await prisma.student.findUnique({ where: { userId: req.user!.id }});
        if (!student) {
            return res.status(403).json({ error: 'User is not a student.' });
        }

        // TODO: Add logic to check maxAttempts

        const quizQuestions = quiz.questions;
        let score = 0;
        let maxScore = 0;

        const answerRecords = answers.map(answer => {
            const question = quizQuestions.find(q => q.id === answer.questionId);
            if (!question) return null; // Or handle error

            let isCorrect = false;
            maxScore += (question.points || 1.0);

            if (question.type === 'MULTIPLE_CHOICE') {
                const correctOption = question.options.find((opt: any) => opt.isCorrect);
                if (correctOption && correctOption.id === answer.selectedId) {
                    isCorrect = true;
                    score += (question.points || 1.0);
                }
            }
            // Add scoring for other question types (TRUE_FALSE, SHORT_ANSWER, etc.) here

            return {
                questionId: answer.questionId,
                selectedId: answer.selectedId,
                textAnswer: answer.textAnswer,
                isCorrect,
            };
        }).filter(a => a !== null);

        const quizAttempt = await prisma.quizAttempt.create({
            data: {
                score,
                maxScore,
                completedAt: new Date(),
                studentId: student.id,
                quizId: quizId,
                userId: req.user!.id,
                answers: {
                    create: answerRecords as any[],
                },
            },
            include: {
                answers: true,
            },
        });

        res.status(201).json(quizAttempt);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to submit quiz.' });
    }
});

export default router;
