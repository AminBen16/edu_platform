"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/schedule.ts
// Schedule management API
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// GET /schedule - Get schedule records
router.get('/', async (req, res) => {
    const { schoolId } = req.user;
    const { classId, dayOfWeek } = req.query;
    try {
        const db = database_1.prisma;
        const where = { schoolId };
        if (classId) {
            where.classId = classId;
        }
        if (dayOfWeek !== undefined) {
            where.dayOfWeek = parseInt(dayOfWeek);
        }
        const schedules = await db.schedule.findMany({
            where,
            include: {
                class: {
                    select: { id: true, name: true },
                },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        // Transform the response
        const transformedSchedules = schedules.map((record) => ({
            id: record.id,
            classId: record.classId,
            className: record.class?.name,
            dayOfWeek: record.dayOfWeek,
            startTime: record.startTime,
            endTime: record.endTime,
            subject: record.subject,
            room: record.room,
            isRecurring: record.isRecurring,
        }));
        res.json(transformedSchedules);
    }
    catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule records' });
    }
});
// POST /schedule - Create schedule record (teachers/admins only)
router.post('/', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId } = req.user;
    const { classId, dayOfWeek, startTime, endTime, subject, room, isRecurring } = req.body;
    if (!classId || dayOfWeek === undefined || !startTime || !endTime || !subject) {
        return res.status(400).json({
            error: 'classId, dayOfWeek, startTime, endTime, and subject are required',
        });
    }
    try {
        const db = database_1.prisma;
        const schedule = await db.schedule.create({
            data: {
                schoolId,
                classId,
                dayOfWeek,
                startTime,
                endTime,
                subject,
                room,
                isRecurring: isRecurring ?? true,
            },
            include: {
                class: {
                    select: { id: true, name: true },
                },
            },
        });
        res.status(201).json({
            id: schedule.id,
            classId: schedule.classId,
            className: schedule.class?.name,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            subject: schedule.subject,
            room: schedule.room,
            isRecurring: schedule.isRecurring,
        });
    }
    catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule record' });
    }
});
// PUT /schedule/:id - Update schedule record
router.put('/:id', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId } = req.user;
    const { id } = req.params;
    const { classId, dayOfWeek, startTime, endTime, subject, room, isRecurring } = req.body;
    try {
        const db = database_1.prisma;
        const schedule = await db.schedule.update({
            where: { id, schoolId },
            data: {
                classId,
                dayOfWeek,
                startTime,
                endTime,
                subject,
                room,
                isRecurring,
            },
            include: {
                class: {
                    select: { id: true, name: true },
                },
            },
        });
        res.json({
            id: schedule.id,
            classId: schedule.classId,
            className: schedule.class?.name,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            subject: schedule.subject,
            room: schedule.room,
            isRecurring: schedule.isRecurring,
        });
    }
    catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule record' });
    }
});
// DELETE /schedule/:id - Delete schedule record
router.delete('/:id', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId } = req.user;
    const { id } = req.params;
    try {
        const db = database_1.prisma;
        await db.schedule.delete({
            where: { id, schoolId },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule record' });
    }
});
exports.default = router;
