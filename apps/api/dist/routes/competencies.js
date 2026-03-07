"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /competencies - List competencies
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const { topicId, subjectId, levelId } = req.query;
        const where = {};
        if (topicId) {
            where.topicId = topicId;
        }
        if (subjectId) {
            where.topic = { subjectId: subjectId };
        }
        if (levelId) {
            where.topic = {
                ...where.topic,
                subject: {
                    levelSubjects: {
                        some: { levelId: levelId }
                    }
                }
            };
        }
        const competencies = await database_1.prisma.competency.findMany({
            where,
            include: {
                topic: {
                    include: { subject: true }
                },
                learningOutcomes: {
                    orderBy: { order: 'asc' }
                },
                _count: { select: { lessonCompetencies: true } }
            },
            orderBy: { order: 'asc' }
        });
        res.json(competencies);
    }
    catch (error) {
        console.error('Failed to fetch competencies:', error);
        res.status(500).json({ error: 'Failed to fetch competencies' });
    }
});
// GET /competencies/:id - Get specific competency with outcomes
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const competency = await database_1.prisma.competency.findUnique({
            where: { id },
            include: {
                topic: {
                    include: { subject: true }
                },
                learningOutcomes: {
                    orderBy: { order: 'asc' }
                },
                lessonCompetencies: {
                    include: { lesson: true }
                }
            }
        });
        if (!competency) {
            return res.status(404).json({ error: 'Competency not found' });
        }
        res.json(competency);
    }
    catch (error) {
        console.error(`Failed to fetch competency ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch competency' });
    }
});
// POST /competencies - Create new competency
router.post('/', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Not authorized to create competencies' });
    }
    const { name, description, order, topicId } = req.body;
    if (!name || !topicId) {
        return res.status(400).json({ error: 'Name and topic ID are required' });
    }
    try {
        // Verify topic exists and belongs to school
        const topic = await database_1.prisma.topic.findUnique({
            where: { id: topicId },
            include: { subject: true }
        });
        if (!topic || topic.subject.schoolId !== req.user.schoolId) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        const competency = await database_1.prisma.competency.create({
            data: {
                name,
                description,
                order: order || 0,
                topicId
            },
            include: {
                topic: true,
                learningOutcomes: true
            }
        });
        res.status(201).json(competency);
    }
    catch (error) {
        console.error('Failed to create competency:', error);
        res.status(500).json({ error: 'Failed to create competency' });
    }
});
// PUT /competencies/:id - Update competency
router.put('/:id', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Not authorized to update competencies' });
    }
    const { id } = req.params;
    const { name, description, order } = req.body;
    try {
        const existing = await database_1.prisma.competency.findUnique({
            where: { id },
            include: { topic: { include: { subject: true } } }
        });
        if (!existing || existing.topic.subject.schoolId !== req.user.schoolId) {
            return res.status(404).json({ error: 'Competency not found' });
        }
        const updated = await database_1.prisma.competency.update({
            where: { id },
            data: { name, description, order },
            include: {
                topic: true,
                learningOutcomes: { orderBy: { order: 'asc' } }
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(`Failed to update competency ${id}:`, error);
        res.status(500).json({ error: 'Failed to update competency' });
    }
});
// DELETE /competencies/:id - Delete competency
router.delete('/:id', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admins can delete competencies' });
    }
    const { id } = req.params;
    try {
        const existing = await database_1.prisma.competency.findUnique({
            where: { id },
            include: { topic: { include: { subject: true } } }
        });
        if (!existing || existing.topic.subject.schoolId !== req.user.schoolId) {
            return res.status(404).json({ error: 'Competency not found' });
        }
        await database_1.prisma.competency.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error(`Failed to delete competency ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete competency' });
    }
});
// GET /competencies/:id/progress - Get student progress for competency
router.get('/:id/progress', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    const { classId, studentId } = req.query;
    try {
        const where = { competencyId: id };
        if (classId) {
            where.student = {
                enrollments: {
                    some: { classId: classId }
                }
            };
        }
        if (studentId) {
            where.studentId = studentId;
        }
        const progress = await database_1.prisma.competencyProgress.findMany({
            where,
            include: {
                student: {
                    include: { user: { select: { name: true, avatarUrl: true } } }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(progress);
    }
    catch (error) {
        console.error(`Failed to fetch competency progress:`, error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
exports.default = router;
