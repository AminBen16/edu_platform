// apps/api/src/routes/classes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import { Role } from '../lib/database';

const router = Router();

// GET /classes - Get all classes for a school
router.get('/', protect, async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            where: { schoolId: req.user!.schoolId },
            include: {
                teacher: {
                    select: { user: { select: { id: true, name: true, email: true } } }
                },
                _count: { select: { enrollments: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(classes);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});

// GET /classes/:id - Get specific class with details
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const classData = await prisma.class.findFirst({
            where: { id, schoolId: req.user!.schoolId },
            include: {
                teacher: {
                    select: { user: { select: { id: true, name: true, email: true } } }
                },
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: { select: { id: true, name: true, email: true, avatarUrl: true } }
                            }
                        }
                    },
                    orderBy: { student: { user: { name: 'asc' } } }
                },
                lessons: {
                    where: { isPublished: true },
                    select: { id: true, title: true, type: true, order: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(classData);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to fetch class details' });
    }
});

// POST /classes - Create new class (Admins only)
router.post('/', protect, async (req, res) => {
    if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to create classes.' });
    }

    const { name, code, grade, capacity, teacherId } = req.body;

    if (!name || !grade) {
        return res.status(400).json({ error: 'Class name and grade are required' });
    }

    try {
        const newClass = await prisma.class.create({
            data: {
                name,
                code: code || `${grade.replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                grade,
                capacity: capacity ? parseInt(capacity) : 30,
                teacherId,
                schoolId: req.user!.schoolId,
            },
            include: {
                teacher: {
                    select: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });
        res.status(201).json(newClass);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to create class' });
    }
});

// PUT /classes/:id - Update class (Admins only)
router.put('/:id', protect, async (req, res) => {
    if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to update classes.' });
    }
    const { id } = req.params;
    const { name, code, grade, capacity, teacherId } = req.body;

    try {
        const updatedClass = await prisma.class.update({
            where: { id, schoolId: req.user!.schoolId },
            data: { name, code, grade, capacity: capacity ? parseInt(capacity) : undefined, teacherId },
            include: {
                teacher: {
                    select: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });
        res.json(updatedClass);
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to update class' });
    }
});

// DELETE /classes/:id - Delete class (Admins only)
router.delete('/:id', protect, async (req, res) => {
    if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'You are not authorized to delete classes.' });
    }
    const { id } = req.params;

    try {
        // Prisma's onDelete: Cascade in schema.prisma will handle related enrollments
        await prisma.class.delete({
            where: { id, schoolId: req.user!.schoolId }
        });
        res.status(204).send();
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to delete class' });
    }
});

// POST /classes/:id/enroll - Enroll students in a class (Admins and Teachers)
router.post('/:id/enroll', protect, async (req, res) => {
    if (req.user!.role !== Role.ADMIN && req.user!.role !== Role.TEACHER) {
        return res.status(403).json({ error: 'You are not authorized to enroll students.' });
    }
    const { id: classId } = req.params;
    const { studentIds } = req.body; // Expect an array of student IDs

    if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ error: 'An array of studentIds is required.' });
    }

    try {
        const enrollments = await prisma.enrollment.createMany({
            data: studentIds.map(studentId => ({
                classId,
                studentId,
                userId: req.user?.id
            })),
        });
        res.status(201).json({ message: `${enrollments.count} students enrolled successfully.` });
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to enroll students' });
    }
});

// DELETE /classes/:classId/enrollments/:enrollmentId - Remove a student's enrollment from a class
router.delete('/:classId/enrollments/:enrollmentId', protect, async (req, res) => {
    if (req.user!.role !== Role.ADMIN && req.user!.role !== Role.TEACHER) {
        return res.status(403).json({ error: 'You are not authorized to manage enrollments.' });
    }
    const { enrollmentId } = req.params;

    try {
        await prisma.enrollment.delete({
            where: { id: enrollmentId }
        });
        res.status(204).send();
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to remove student from class' });
    }
});

export default router;
