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
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', file.fieldname);
      cb(null, uploadPath);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file
    },
    fileFilter: (req, file, cb) => {
      // Allow images, videos, documents
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      cb(null, allowedTypes.includes(file.mimetype));
    }
  }
});

// POST /files - Upload files
router.post('/', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('files.write'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { courseId, title, description, type } = req.body;
    const file = req.file;

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname,
        path: file.path,
        size: file.size,
        type: type || 'document',
        courseId,
        title,
        description,
        uploadedBy: req.user!.id
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileRecord
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /files/course/:courseId - Get files for course
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { role, userId } = req.user!;

    // Check access permissions
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true } }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const hasAccess = role === 'TEACHER' && course.instructorId === userId ||
                   role === 'ADMIN' || role === 'SCHOOL_ADMIN' ||
                   (role === 'STUDENT' && await prisma.enrollment.findFirst({
                     where: { courseId, studentId: userId }
                   }));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }

    const files = await prisma.file.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      files,
      courseId,
      courseTitle: course.title
    });
  } catch (error) {
    console.error('Get course files error:', error);
    res.status(500).json({ error: 'Failed to load files' });
  }
});

// GET /files/:id - Get single file
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check access permissions
    const hasAccess = role === 'TEACHER' && file.uploadedBy.id === userId ||
                   role === 'ADMIN' || role === 'SCHOOL_ADMIN' ||
                   (role === 'STUDENT' && await prisma.enrollment.findFirst({
                     where: { courseId: file.courseId, studentId: userId }
                   }));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    // Stream file for download
    const filePath = path.join(process.cwd(), 'uploads', file.path);
    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to load file' });
  }
});

// DELETE /files/:id - Delete file
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), requirePermission('files.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check access permissions
    const hasAccess = role === 'TEACHER' && file.uploadedBy.id === userId ||
                   role === 'ADMIN' || role === 'SCHOOL_ADMIN' ||
                   (role === 'STUDENT' && await prisma.enrollment.findFirst({
                     where: { courseId: file.courseId, studentId: userId }
                   }));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.file.delete({
      where: { id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
