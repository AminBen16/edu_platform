"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Competency mastery levels
const MASTERY_LEVELS = {
    BEGINNING: 'BEGINNING',
    DEVELOPING: 'DEVELOPING',
    PROFICIENT: 'PROFICIENT',
    ADVANCED: 'ADVANCED'
};
// GET /progress - List competency progress records
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const { studentId, competencyId, classId, subjectId, masteryLevel } = req.query;
        const where = { schoolId: req.user.schoolId };
        if (studentId) {
            where.studentId = studentId;
        }
        if (competencyId) {
            where.competencyId = competencyId;
        }
        if (masteryLevel) {
            where.masteryLevel = masteryLevel;
        }
        // If classId or subjectId is provided, we need to filter by student enrollments
        if (classId || subjectId) {
            where.student = {
                enrollments: {
                    some: {
                        ...(classId ? { classId: classId } : {}),
                        ...(subjectId ? { class: { subjectId: subjectId } } : {})
                    }
                }
            };
        }
        const progress = await database_1.prisma.competencyProgress.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { name: true, avatarUrl: true } }
                    }
                },
                competency: {
                    include: {
                        topic: {
                            include: { subject: true }
                        }
                    }
                },
                evaluator: {
                    select: { name: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(progress);
    }
    catch (error) {
        console.error('Failed to fetch competency progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// GET /progress/student/:studentId - Get progress for a specific student
router.get('/student/:studentId', auth_1.protect, async (req, res) => {
    const { studentId } = req.params;
    const { subjectId, competencyId } = req.query;
    try {
        const where = {
            studentId,
            schoolId: req.user.schoolId
        };
        if (subjectId) {
            where.competency = {
                topic: { subjectId: subjectId }
            };
        }
        if (competencyId) {
            where.competencyId = competencyId;
        }
        const progress = await database_1.prisma.competencyProgress.findMany({
            where,
            include: {
                competency: {
                    include: {
                        topic: { include: { subject: true } },
                        learningOutcomes: true
                    }
                },
                evaluator: { select: { name: true } }
            },
            orderBy: { competency: { topic: { order: 'asc' } } }
        });
        res.json(progress);
    }
    catch (error) {
        console.error(`Failed to fetch student progress:`, error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// GET /progress/competency/:competencyId - Get all students' progress for a competency
router.get('/competency/:competencyId', auth_1.protect, async (req, res) => {
    const { competencyId } = req.params;
    const { classId } = req.query;
    try {
        const where = {
            competencyId,
            schoolId: req.user.schoolId
        };
        if (classId) {
            where.student = {
                enrollments: {
                    some: { classId: classId }
                }
            };
        }
        const progress = await database_1.prisma.competencyProgress.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { name: true, avatarUrl: true } }
                    }
                }
            },
            orderBy: { student: { user: { name: 'asc' } } }
        });
        // Calculate mastery distribution
        const distribution = {
            BEGINNING: 0,
            DEVELOPING: 0,
            PROFICIENT: 0,
            ADVANCED: 0
        };
        progress.forEach((p) => {
            if (p.masteryLevel in distribution) {
                distribution[p.masteryLevel]++;
            }
        });
        res.json({ progress, distribution });
    }
    catch (error) {
        console.error(`Failed to fetch competency progress:`, error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// GET /progress/:id - Get specific progress record
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const progress = await database_1.prisma.competencyProgress.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, avatarUrl: true, email: true } }
                    }
                },
                competency: {
                    include: {
                        topic: { include: { subject: true } },
                        learningOutcomes: { orderBy: { order: 'asc' } }
                    }
                },
                evaluator: { select: { name: true } }
            }
        });
        if (!progress || progress.schoolId !== req.user.schoolId) {
            return res.status(404).json({ error: 'Progress record not found' });
        }
        res.json(progress);
    }
    catch (error) {
        console.error(`Failed to fetch progress ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// POST /progress - Create or update competency progress
router.post('/', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Not authorized to record progress' });
    }
    const { studentId, competencyId, masteryLevel, notes } = req.body;
    if (!studentId || !competencyId || !masteryLevel) {
        return res.status(400).json({ error: 'Student ID, competency ID, and mastery level are required' });
    }
    // Validate mastery level
    if (!Object.values(MASTERY_LEVELS).includes(masteryLevel)) {
        return res.status(400).json({ error: 'Invalid mastery level' });
    }
    try {
        // Check if progress record already exists
        const existing = await database_1.prisma.competencyProgress.findFirst({
            where: { studentId, competencyId }
        });
        if (existing) {
            // Update existing
            const updated = await database_1.prisma.competencyProgress.update({
                where: { id: existing.id },
                data: {
                    masteryLevel,
                    notes,
                    evaluatedBy: req.user.id,
                    evaluatedAt: new Date()
                },
                include: {
                    student: { include: { user: { select: { name: true } } } },
                    competency: { include: { topic: true } }
                }
            });
            return res.json(updated);
        }
        // Create new progress record
        const progress = await database_1.prisma.competencyProgress.create({
            data: {
                studentId,
                competencyId,
                masteryLevel,
                notes,
                evaluatedBy: req.user.id,
                evaluatedAt: new Date(),
                schoolId: req.user.schoolId
            },
            include: {
                student: { include: { user: { select: { name: true } } } },
                competency: { include: { topic: true } }
            }
        });
        res.status(201).json(progress);
    }
    catch (error) {
        console.error('Failed to record progress:', error);
        res.status(500).json({ error: 'Failed to record progress' });
    }
});
// PUT /progress/:id - Update competency progress
router.put('/:id', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Not authorized to update progress' });
    }
    const { id } = req.params;
    const { masteryLevel, notes } = req.body;
    try {
        const existing = await database_1.prisma.competencyProgress.findFirst({
            where: { id, schoolId: req.user.schoolId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Progress record not found' });
        }
        const updated = await database_1.prisma.competencyProgress.update({
            where: { id },
            data: {
                ...(masteryLevel && { masteryLevel }),
                notes,
                evaluatedBy: req.user.id,
                evaluatedAt: new Date()
            },
            include: {
                student: { include: { user: { select: { name: true } } } },
                competency: { include: { topic: true } }
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(`Failed to update progress ${id}:`, error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});
// GET /progress/mastery-levels - Get available mastery levels
router.get('/mastery-levels', auth_1.protect, async (req, res) => {
    res.json(MASTERY_LEVELS);
});
exports.default = router;
