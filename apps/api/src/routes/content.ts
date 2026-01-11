// apps/api/src/routes/content.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';

// Mock WebSocket functions for development
const emitToAll = (schoolId: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to all in school ${schoolId}:`, { event, data });
};

const emitToRole = (schoolId: string, role: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to ${role} in school ${schoolId}:`, { event, data });
};

const emitToUser = (userId: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to user ${userId}:`, { event, data });
};

const router = Router();

// Mock content data for fallback
const mockContent = [
  {
    id: 'content-1',
    type: 'lesson',
    title: 'Introduction to Mathematics',
    description: 'Basic concepts and fundamentals',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teacherId: 'teacher-1',
    schoolId: 'school123',
  },
  {
    id: 'content-2',
    type: 'quiz',
    title: 'Math Basics Quiz',
    description: 'Test your knowledge of basic math',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teacherId: 'teacher-1',
    schoolId: 'school123',
  },
];

// GET /content/recent - Get recent content (combines lessons and quizzes)
router.get('/recent', protect, async (req, res) => {
  try {
    // Combine lessons and quizzes from existing models
    let content: any[] = [];
    
    if (process.env.DATABASE_URL && prisma) {
      // Get lessons
      const lessons = await prisma.lesson.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          teacherId: req.user!.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      
      // Get quizzes
      const quizzes = await prisma.quiz.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          teacherId: req.user!.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      
      // Combine and format
      content = [
        ...lessons.map(lesson => ({
          ...lesson,
          type: 'lesson',
          status: lesson.isPublished ? 'published' : 'draft',
        })),
        ...quizzes.map(quiz => ({
          ...quiz,
          type: 'quiz',
          status: quiz.isPublished ? 'published' : 'draft',
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Fallback to mock data for demo
      content = mockContent;
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent content.' });
  }
});

// GET /content/drafts - Get draft content
router.get('/drafts', protect, async (req, res) => {
  try {
    let drafts: any[] = [];
    
    if (process.env.DATABASE_URL && prisma) {
      // Get draft lessons
      const lessons = await prisma.lesson.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          teacherId: req.user!.id,
          isPublished: false,
        },
        orderBy: { updatedAt: 'desc' },
      });
      
      // Get draft quizzes
      const quizzes = await prisma.quiz.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          teacherId: req.user!.id,
          isPublished: false,
        },
        orderBy: { updatedAt: 'desc' },
      });
      
      // Combine and format
      drafts = [
        ...lessons.map(lesson => ({
          ...lesson,
          type: 'lesson',
          status: 'draft',
        })),
        ...quizzes.map(quiz => ({
          ...quiz,
          type: 'quiz',
          status: 'draft',
        })),
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      // Fallback to mock data for demo
      drafts = [];
    }
    
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drafts.' });
  }
});

// GET /content/scheduled - Get scheduled content (placeholder for future)
router.get('/scheduled', protect, async (req, res) => {
  try {
    // For now, return empty as scheduling is not implemented
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled content.' });
  }
});

// POST /content/publish - Publish content and send notifications
router.post('/publish', protect, authorize('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { contentId, contentType, contentTitle } = req.body;
  
  if (!contentId || !contentType || !contentTitle) {
    return res.status(400).json({ 
      error: 'Content ID, type, and title are required.' 
    });
  }
  
  try {
    // Update content status to published
    let content;
    if (process.env.DATABASE_URL && prisma) {
      if (contentType === 'lesson') {
        content = await prisma.lesson.update({
          where: { id: contentId },
          data: { isPublished: true },
        });
      } else if (contentType === 'quiz') {
        content = await prisma.quiz.update({
          where: { id: contentId },
          data: { isPublished: true },
        });
      }
    } else {
      // Mock update
      content = { id: contentId, isPublished: true };
    }
    
    // Send real-time notifications to all connected users
    const notificationData = {
      type: 'content_created',
      title: 'New Content Available',
      message: `New ${contentType}: ${contentTitle}`,
      contentType,
      contentId,
      contentTitle,
      senderId: req.user!.id,
      senderName: req.user!.name,
      schoolId: req.user!.schoolId,
      timestamp: new Date().toISOString(),
    };
    
    // Emit to all users in the school
    emitToAll(req.user!.schoolId, 'content_created', notificationData);
    
    // Also emit to specific roles
    emitToRole(req.user!.schoolId, 'STUDENT', 'content_created', notificationData);
    emitToRole(req.user!.schoolId, 'PARENT', 'content_created', notificationData);
    emitToRole(req.user!.schoolId, 'SCHOOL_ADMIN', 'content_created', notificationData);
    
    res.status(200).json({ 
      success: true, 
      content,
      message: 'Content published and notifications sent successfully.' 
    });
  } catch (error) {
    console.error('Content publishing error:', error);
    res.status(500).json({ error: 'Failed to publish content.' });
  }
});

// GET /content/analytics - Get content analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    // Mock analytics data
    const analytics = {
      totalContent: 25,
      publishedContent: 20,
      draftContent: 3,
      scheduledContent: 2,
      totalViews: 1250,
      totalEngagement: 890,
      contentByType: {
        lesson: 15,
        quiz: 8,
        assignment: 2,
      },
      recentActivity: [
        {
          id: '1',
          type: 'lesson',
          title: 'Math Basics',
          views: 45,
          engagement: 32,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'quiz',
          title: 'Math Quiz',
          views: 28,
          engagement: 25,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

export default router;
