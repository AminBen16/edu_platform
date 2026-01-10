// apps/api/src/routes/files.ts
// File management system for content delivery
import { Router, Response, Request } from 'express';
import { protect, authorize, requirePermission } from '../middleware/auth';
import { prisma } from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow images, videos, documents
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// GET /files - List lesson resources for user
router.get('/', protect, async (req: Request, res: Response) => {
  const { role, id: userId, schoolId } = req.user! as any;

  try {
    let resources: any[] = [];

    switch (role) {
      case 'TEACHER':
        // Get teacher's lessons and their resources
        const teacherLessons = await prisma.lesson.findMany({
          where: { 
            teacherId: userId,
            schoolId
          },
          select: { id: true }
        });
        
        const lessonIds = teacherLessons.map(l => l.id);
        
        resources = await prisma.lessonResource.findMany({
          where: { 
            lessonId: { in: lessonIds }
          },
          include: {
            lesson: {
              select: { id: true, title: true }
            }
          }
        });
        break;
      case 'ADMIN':
      case 'SCHOOL_ADMIN':
        resources = await prisma.lessonResource.findMany({
          where: {
            lesson: { schoolId }
          },
          include: {
            lesson: {
              select: { id: true, title: true }
            }
          }
        });
        break;
      case 'STUDENT':
        // Get student's enrolled lessons and their resources
        const studentEnrollments = await prisma.enrollment.findMany({
          where: { 
            studentId: userId,
            status: 'ACTIVE'
          },
          select: { lessonId: true }
        });
        
        const enrolledLessonIds = studentEnrollments
          .map(e => e.lessonId)
          .filter((id): id is string => id !== null);
        
        if (enrolledLessonIds.length > 0) {
          resources = await prisma.lessonResource.findMany({
            where: {
              lessonId: { in: enrolledLessonIds }
            },
            include: {
              lesson: {
                select: { id: true, title: true }
              }
            }
          });
        }
        break;
    }

    res.json({
      resources,
      userRole: role,
      total: resources.length
    });
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: 'Failed to load files' });
  }
});

// POST /files - Upload files
router.post('/', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('files.write'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, type, lessonId } = req.body;
    const file = req.file;
    const user = req.user! as any;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Create lesson resource record in database
    const resource = await prisma.lessonResource.create({
      data: {
        title: title || file.originalname,
        type: (type as any) || 'DOCUMENT',
        url: `/uploads/${fileName}`,
        size: file.size,
        lessonId: lessonId || null
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      resource
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /files/:id - Get file info
router.get('/:id', protect, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const resource = await prisma.lessonResource.findUnique({
      where: { id },
      include: {
        lesson: {
          select: { id: true, title: true }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// DELETE /files/:id - Delete file
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('files.delete'), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get resource info to delete file
    const resource = await prisma.lessonResource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), resource.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.lessonResource.delete({
      where: { id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
