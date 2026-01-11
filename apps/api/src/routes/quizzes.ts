// apps/api/src/routes/quizzes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Mock quizzes data for fallback
const mockQuizzes = [
  {
    id: 'quiz-1',
    title: 'Mathematics Basics Quiz',
    description: 'Test your knowledge of basic mathematics',
    type: 'QUIZ',
    timeLimit: 30,
    maxAttempts: 1,
    passingScore: 70.0,
    isPublished: true,
    subject: 'Mathematics',
    difficulty: 'Beginner',
    questions: [
      {
        id: '1',
        question: 'What is 2 + 2?',
        type: 'multiple_choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        points: 10,
        explanation: '2 + 2 equals 4, which is the second option.'
      },
      {
        id: '2',
        question: 'What is 5 x 3?',
        type: 'multiple_choice',
        options: ['15', '8', '20', '12'],
        correctAnswer: 0,
        points: 10,
        explanation: '5 multiplied by 3 equals 15.'
      }
    ],
    schoolId: 'school123',
    teacherId: 'teacher-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /quizzes - List quizzes for the user's school
router.get('/', protect, async (req, res) => {
  try {
    // Use real database if available, fallback to mock data
    if (process.env.DATABASE_URL && prisma) {
      const quizzes = await prisma.quiz.findMany({
        where: { schoolId: req.user!.schoolId },
        orderBy: { createdAt: 'desc' },
      });
      res.json(quizzes);
    } else {
      // Fallback to mock data for demo
      res.json(mockQuizzes);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes.' });
  }
});

// GET /quizzes/:id - Get a specific quiz
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use real database if available, fallback to mock data
    if (process.env.DATABASE_URL && prisma) {
      const quiz = await prisma.quiz.findFirst({
        where: { 
          id,
          schoolId: req.user!.schoolId 
        },
      });
      
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found.' });
      }
      
      res.json(quiz);
    } else {
      // Fallback to mock data for demo
      const quiz = mockQuizzes.find(q => q.id === id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found.' });
      }
      res.json(quiz);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz.' });
  }
});

// POST /quizzes - Create a quiz (teacher or admin)
router.post('/', protect, authorize('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { 
    title, 
    description, 
    duration, 
    subject, 
    difficulty, 
    questions, 
    isPublished, 
    type 
  } = req.body;
  
  if (!title || !description || !duration || !subject || !difficulty || !questions || questions.length === 0) {
    return res.status(400).json({ 
      error: 'Title, description, duration, subject, difficulty, and questions are required.' 
    });
  }
  
  try {
    let quiz;
    
    // Use real database if available
    if (process.env.DATABASE_URL && prisma) {
      quiz = await prisma.quiz.create({
        data: {
          title,
          description,
          timeLimit: parseInt(duration),
          questions,
          isPublished: isPublished || false,
          type: 'QUIZ',
          schoolId: req.user!.schoolId,
          teacherId: req.user!.id,
        },
      });
    } else {
      // Fallback to mock data for demo
      quiz = {
        id: `quiz-${Date.now()}`,
        title,
        description,
        type: 'QUIZ',
        timeLimit: parseInt(duration),
        maxAttempts: 1,
        passingScore: 70.0,
        subject,
        difficulty,
        questions,
        isPublished: isPublished || false,
        schoolId: req.user!.schoolId,
        teacherId: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to mock quizzes array for demo
      mockQuizzes.unshift(quiz);
    }
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ error: 'Failed to create quiz.' });
  }
});

// POST /quizzes/:id/submit - Submit quiz answers
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, score, totalPoints, percentage, timeSpent, submittedAt } = req.body;
    
    // Create quiz submission record
    const submission = {
      id: `submission-${Date.now()}`,
      quizId: id,
      studentId: req.user!.id,
      answers,
      score,
      totalPoints,
      percentage,
      timeSpent,
      submittedAt,
      createdAt: new Date().toISOString(),
    };
    
    // In a real database, you would save this to a QuizSubmission table
    // For now, just return success
    res.status(201).json(submission);
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz.' });
  }
});

export default router;
