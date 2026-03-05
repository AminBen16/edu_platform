"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/files.ts
// File management system for content delivery
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const multer_1 = __importDefault(require("multer"));
const storageService_1 = __importDefault(require("../services/storageService"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
    },
    fileFilter: (req, file, cb) => {
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
router.get('/', auth_1.protect, async (req, res) => {
    const { role, id: userId, schoolId } = req.user;
    try {
        let resources = [];
        switch (role) {
            case 'TEACHER':
                // Get teacher's lessons and their resources
                const teacherLessons = await database_1.prisma.lesson.findMany({
                    where: {
                        teacherId: userId,
                        schoolId
                    },
                    select: { id: true }
                });
                const lessonIds = teacherLessons.map(l => l.id);
                resources = await database_1.prisma.lessonResource.findMany({
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
                resources = await database_1.prisma.lessonResource.findMany({
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
                const studentEnrollments = await database_1.prisma.enrollment.findMany({
                    where: {
                        studentId: userId,
                        status: 'ACTIVE'
                    },
                    select: { lessonId: true }
                });
                const enrolledLessonIds = studentEnrollments
                    .map(e => e.lessonId)
                    .filter((id) => id !== null);
                if (enrolledLessonIds.length > 0) {
                    resources = await database_1.prisma.lessonResource.findMany({
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
    }
    catch (error) {
        console.error('Files error:', error);
        res.status(500).json({ error: 'Failed to load files' });
    }
});
// POST /files - Upload files
router.post('/', auth_1.protect, (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { title, description, type, lessonId } = req.body;
        const file = req.file;
        const user = req.user;
        // Create lesson resource record in database
        const resource = await database_1.prisma.lessonResource.create({
            data: {
                title: title || file.originalname,
                type: type || 'DOCUMENT',
                url: '', // Will be updated by StorageService
                size: file.size,
                lessonId: lessonId || null
            }
        });
        // Store file using StorageService (local + cloud)
        const storageResult = await storageService_1.default.storeFile({
            file: file.buffer,
            fileName: file.originalname,
            contentType: file.mimetype,
            bucket: 'education-platform'
        });
        // Update resource with storage URL
        await database_1.prisma.lessonResource.update({
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
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
// GET /files/:id - Get file info
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const resource = await database_1.prisma.lessonResource.findUnique({
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
    }
    catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});
// DELETE /files/:id - Delete file
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SCHOOL_ADMIN), async (req, res) => {
    const { id } = req.params;
    try {
        // Get resource info to delete file
        const resource = await database_1.prisma.lessonResource.findUnique({
            where: { id }
        });
        if (!resource) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Delete file using StorageService (local + cloud)
        const deleted = await storageService_1.default.deleteFile(resource.url);
        if (deleted) {
            console.log('File deleted from storage:', resource.url);
        }
        else {
            console.log('File deletion failed, but continuing with database cleanup');
        }
        // Delete from database
        await database_1.prisma.lessonResource.delete({
            where: { id }
        });
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});
exports.default = router;
