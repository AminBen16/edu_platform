// apps/api/src/routes/lessons.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// Mock lessons data for fallback
const mockLessons = [
  {
    id: '1',
    title: 'Introduction to Mathematics',
    description: 'Basic concepts and fundamentals of mathematics',
    content: 'This lesson covers numbers, basic operations, and introductory algebra.',
    videoUrl: null,
    documentUrl: null,
    duration: 45,
    order: 1,
    isPublished: true,
    subject: 'Mathematics',
    class: 'Grade 1',
    difficulty: 'Beginner',
    tags: ['Introduction', 'Theory', 'Assessment'],
    schoolId: 'school123',
    teacherId: 'teacher-1',
    subjectId: 'math-101',
    classId: 'grade-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Physics Fundamentals',
    description: 'Introduction to basic physics concepts including motion, forces, and energy.',
    content: 'Learn about Newton\'s laws, kinematics, and basic mechanics.',
    videoUrl: 'https://example.com/physics-video.mp4',
    documentUrl: 'https://example.com/physics-notes.pdf',
    duration: 60,
    order: 1,
    isPublished: true,
    subject: 'Physics',
    class: 'Grade 10',
    difficulty: 'Intermediate',
    tags: ['Theory', 'Practical', 'Video'],
    schoolId: 'school123',
    teacherId: 'teacher-2',
    subjectId: 'physics-101',
    classId: 'grade-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Chemistry Basics',
    description: 'Understanding atoms, molecules, and chemical reactions.',
    content: 'Explore the periodic table, chemical bonds, and basic reactions.',
    videoUrl: null,
    documentUrl: 'https://example.com/chemistry-guide.pdf',
    duration: 50,
    order: 1,
    isPublished: true,
    subject: 'Chemistry',
    class: 'Grade 11',
    difficulty: 'Advanced',
    tags: ['Theory', 'Reading', 'Assessment'],
    schoolId: 'school123',
    teacherId: 'teacher-3',
    subjectId: 'chemistry-101',
    classId: 'grade-11',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /lessons - List lessons for user's school
router.get('/', protect, async (req, res) => {
    try {
        // Use real database if available, fallback to mock data
        if (process.env.DATABASE_URL && prisma) {
            const lessons = await prisma.lesson.findMany({
                where: { schoolId: req.user!.schoolId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(lessons);
        } else {
            // Fallback to mock data for demo
            res.json(mockLessons);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons.' });
    }
});

// POST /lessons - Create a lesson
router.post('/', protect, async (req, res) => {
    const { 
        title, 
        description, 
        duration, 
        videoUrl, 
        documentUrl, 
        subject, 
        class: className,
        difficulty, 
        tags, 
        isPublished, 
        type 
    } = req.body;
    
    if (!title || !description || !duration || !subject || !className || !difficulty) {
        return res.status(400).json({ 
            error: 'Title, description, duration, subject, class, and difficulty are required.' 
        });
    }
    
    try {
        let lesson;
        
        // Use real database if available
        if (process.env.DATABASE_URL && prisma) {
            lesson = await prisma.lesson.create({
                data: {
                    title,
                    description,
                    duration: duration ? parseInt(duration) : null,
                    videoUrl,
                    isPublished: isPublished || false,
                    schoolId: req.user!.schoolId,
                    teacherId: req.user!.id,
                },
            });
        } else {
            // Fallback to mock data for demo
            lesson = {
                id: `lesson-${Date.now()}`,
                title,
                description,
                content: description || '',
                videoUrl,
                documentUrl: null,
                duration: duration ? parseInt(duration) : 45,
                order: 1,
                isPublished: isPublished || false,
                subject: 'General',
                class: 'General',
                difficulty: 'Medium',
                tags: [],
                schoolId: req.user!.schoolId,
                teacherId: req.user!.id,
                subjectId: 'general',
                classId: 'general',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            // Add to mock lessons array for demo
            mockLessons.unshift(lesson);
        }
        
        res.status(201).json(lesson);
    } catch (error) {
        console.error('Lesson creation error:', error);
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
});

export default router;
