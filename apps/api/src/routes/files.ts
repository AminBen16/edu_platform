// apps/api/src/routes/files.ts
// File management system for content delivery
import { Router, Response, Request } from 'express';
import { protect, authorize } from '../middleware/auth';
import { prisma } from '../config/database';
import { Role } from '../lib/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import StorageService from '../services/storageService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow images, videos, documents, and audio files
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'video/mp4', 'video/webm', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
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
        
        const lessonIds = teacherLessons.map((l: { id: string }) => l.id);
        
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
          .map((e: { lessonId: string | null }) => e.lessonId)
          .filter((id: string | null): id is string => id !== null);
        
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
router.post('/', protect, authorize(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, type, lessonId } = req.body;
    const file = req.file;
    const user = req.user! as any;

    // Create lesson resource record in database
    const resource = await prisma.lessonResource.create({
      data: {
        title: title || file.originalname,
        type: (type as any) || 'DOCUMENT',
        url: '', // Will be updated by StorageService
        size: file.size,
        lessonId: lessonId || null
      }
    });

    // Store file using StorageService (local + cloud)
    const storageResult = await StorageService.storeFile({
      file: file.buffer,
      fileName: file.originalname,
      contentType: file.mimetype,
      bucket: 'education-platform'
    });

    // Update resource with storage URL
    await prisma.lessonResource.update({
      where: { id: resource.id },
      data: {
        url: storageResult.url
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      resource: {
        ...resource,
        url: storageResult.url
      }
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
router.delete('/:id', protect, authorize(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get resource info to delete file
    const resource = await prisma.lessonResource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file using StorageService (local + cloud)
    const deleted = await StorageService.deleteFile(resource.url);
    
    if (deleted) {
      console.log('File deleted from storage:', resource.url);
    } else {
      console.log('File deletion failed, but continuing with database cleanup');
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
