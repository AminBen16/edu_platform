"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Live sessions and WebRTC management
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const database_2 = require("../lib/database");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
const deriveSessionStatus = (session) => {
    if (!session.isActive)
        return 'ENDED';
    if (session.startTime && new Date(session.startTime) > new Date())
        return 'SCHEDULED';
    return 'LIVE';
};
const formatSessionResponse = (session) => {
    const status = deriveSessionStatus(session);
    const scheduledAt = session.startTime;
    const duration = session.endTime && session.startTime
        ? Math.max(15, Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000))
        : 60;
    return {
        id: session.id,
        title: session.title,
        description: session.description,
        roomCode: session.roomCode,
        startTime: session.startTime,
        scheduledAt,
        endTime: session.endTime,
        isActive: session.isActive,
        status,
        classId: session.classId,
        className: session.class?.name,
        teacherId: session.teacherId,
        teacherName: session.teacher?.user?.name,
        participantCount: session._count?.participants || 0,
        duration,
        meetingUrl: `${process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''}/live-class?roomCode=${session.roomCode}`,
        createdAt: session.createdAt,
    };
};
// GET /live-sessions - Get active live sessions
router.get('/', async (req, res) => {
    const { schoolId } = req.user;
    const { classId, isActive } = req.query;
    try {
        const where = { schoolId };
        if (classId) {
            where.classId = classId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const sessions = await database_1.prisma.liveSession.findMany({
            where,
            include: {
                class: {
                    select: { id: true, name: true },
                },
                teacher: {
                    select: { id: true, user: { select: { name: true, email: true } } },
                },
                _count: {
                    select: { participants: { where: { leftAt: null } } }
                }
            },
            orderBy: { startTime: 'desc' },
        });
        const transformedSessions = sessions.map(formatSessionResponse);
        res.json(transformedSessions);
    }
    catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({ error: 'Failed to fetch live sessions' });
    }
});
// POST /live-sessions - Create new live session (Teachers/Admins only)
router.post('/', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { schoolId, id: userId } = req.user;
    const { title, description, classId, teacherId, scheduledAt, scheduledStartTime, meetingUrl } = req.body;
    if (!title || !classId) {
        return res.status(400).json({ error: 'title and classId are required' });
    }
    try {
        const teacher = req.user.role === database_2.Role.TEACHER
            ? await database_1.prisma.teacher.findFirst({ where: { userId } })
            : teacherId
                ? await database_1.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } })
                : await database_1.prisma.teacher.findFirst({ where: { userId } });
        if (!teacher) {
            return res.status(403).json({ error: 'A valid teacher is required to create live sessions' });
        }
        // Generate unique room code
        const roomCode = `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const sessionStartTime = scheduledAt || scheduledStartTime;
        const session = await database_1.prisma.liveSession.create({
            data: {
                schoolId,
                title,
                description,
                classId,
                teacherId: teacher.id,
                roomCode,
                isActive: true,
                startTime: sessionStartTime ? new Date(sessionStartTime) : new Date(),
            },
            include: {
                class: {
                    select: { id: true, name: true },
                },
                teacher: {
                    select: { id: true, user: { select: { name: true, email: true } } },
                },
                _count: {
                    select: { participants: { where: { leftAt: null } } }
                }
            },
        });
        res.status(201).json({
            ...formatSessionResponse(session),
            meetingUrl: meetingUrl || formatSessionResponse(session).meetingUrl,
            message: 'Live session created successfully',
        });
    }
    catch (error) {
        console.error('Error creating live session:', error);
        res.status(500).json({ error: 'Failed to create live session' });
    }
});
// GET /live-sessions/:roomCode - Get session by room code
router.get('/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    try {
        const session = await database_1.prisma.liveSession.findUnique({
            where: { roomCode },
            include: {
                class: {
                    select: { id: true, name: true },
                },
                teacher: {
                    select: { id: true, user: { select: { name: true, email: true } } },
                },
                _count: {
                    select: { participants: { where: { leftAt: null } } }
                }
            },
        });
        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        res.json(formatSessionResponse(session));
    }
    catch (error) {
        console.error('Error fetching live session:', error);
        res.status(500).json({ error: 'Failed to fetch live session' });
    }
});
// PUT /live-sessions/:sessionId - Update status or schedule fields
router.put('/:sessionId', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { sessionId } = req.params;
    const { status, title, description, scheduledAt } = req.body;
    try {
        const existingSession = await database_1.prisma.liveSession.findFirst({
            where: { id: sessionId, schoolId: req.user.schoolId },
        });
        if (!existingSession) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        const updateData = {};
        if (title)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (scheduledAt)
            updateData.startTime = new Date(scheduledAt);
        if (status === 'LIVE') {
            updateData.isActive = true;
            updateData.startTime = new Date();
        }
        if (status === 'ENDED') {
            updateData.isActive = false;
            updateData.endTime = new Date();
        }
        if (status === 'SCHEDULED') {
            updateData.isActive = true;
            if (!updateData.startTime) {
                updateData.startTime = existingSession.startTime;
            }
        }
        const session = await database_1.prisma.liveSession.update({
            where: { id: sessionId },
            data: updateData,
            include: {
                class: {
                    select: { id: true, name: true },
                },
                teacher: {
                    select: { id: true, user: { select: { name: true, email: true } } },
                },
                _count: {
                    select: { participants: { where: { leftAt: null } } }
                }
            },
        });
        res.json(formatSessionResponse(session));
    }
    catch (error) {
        console.error('Error updating live session:', error);
        res.status(500).json({ error: 'Failed to update live session' });
    }
});
// DELETE /live-sessions/:sessionId - Cancel a session
router.delete('/:sessionId', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { sessionId } = req.params;
    try {
        const existingSession = await database_1.prisma.liveSession.findFirst({
            where: { id: sessionId, schoolId: req.user.schoolId },
        });
        if (!existingSession) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        await database_1.prisma.liveSession.delete({
            where: { id: sessionId },
        });
        res.json({ message: 'Live session cancelled successfully' });
    }
    catch (error) {
        console.error('Error deleting live session:', error);
        res.status(500).json({ error: 'Failed to cancel live session' });
    }
});
// POST /live-sessions/:roomCode/join - Join live session
router.post('/:roomCode/join', async (req, res) => {
    const { roomCode } = req.params;
    const { userName, role } = req.body;
    try {
        const session = await database_1.prisma.liveSession.findUnique({
            where: { roomCode },
        });
        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        if (!session.isActive) {
            return res.status(400).json({ error: 'Live session has ended' });
        }
        const participantCount = await database_1.prisma.liveSessionParticipant.count({
            where: { sessionId: session.id, leftAt: null }
        });
        if (participantCount >= 50) {
            return res.status(400).json({ error: 'Session is full' });
        }
        // Check for existing participant record
        const existingParticipant = await database_1.prisma.liveSessionParticipant.findFirst({
            where: {
                sessionId: session.id,
                participantId: req.user.id,
            }
        });
        if (existingParticipant) {
            await database_1.prisma.liveSessionParticipant.update({
                where: { id: existingParticipant.id },
                data: { leftAt: null, joinedAt: new Date() }
            });
        }
        else {
            await database_1.prisma.liveSessionParticipant.create({
                data: {
                    sessionId: session.id,
                    participantId: req.user.id,
                    role: role || 'STUDENT',
                    schoolId: session.schoolId,
                    joinedAt: new Date(),
                }
            });
        }
        res.json({
            message: 'Joined live session successfully',
            sessionId: session.id,
            roomCode: session.roomCode,
            title: session.title,
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });
    }
    catch (error) {
        console.error('Error joining live session:', error);
        res.status(500).json({ error: 'Failed to join live session' });
    }
});
// POST /live-sessions/:roomCode/leave - Leave live session
router.post('/:roomCode/leave', async (req, res) => {
    const { roomCode } = req.params;
    try {
        const session = await database_1.prisma.liveSession.findUnique({
            where: { roomCode },
        });
        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        // Update participant record
        await database_1.prisma.liveSessionParticipant.updateMany({
            where: {
                sessionId: session.id,
                participantId: req.user.id,
                leftAt: null
            },
            data: {
                leftAt: new Date()
            }
        });
        res.json({ message: 'Left live session successfully' });
    }
    catch (error) {
        console.error('Error leaving live session:', error);
        res.status(500).json({ error: 'Failed to leave live session' });
    }
});
// POST /live-sessions/:roomCode/end - End live session
router.post('/:roomCode/end', (0, auth_1.authorize)(database_2.Role.TEACHER, database_2.Role.ADMIN, database_2.Role.SUPER_ADMIN), async (req, res) => {
    const { roomCode } = req.params;
    try {
        const session = await database_1.prisma.liveSession.findUnique({
            where: { roomCode },
        });
        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        await database_1.prisma.liveSession.update({
            where: { roomCode },
            data: {
                isActive: false,
                endTime: new Date(),
            },
        });
        res.json({ message: 'Live session ended successfully' });
    }
    catch (error) {
        console.error('Error ending live session:', error);
        res.status(500).json({ error: 'Failed to end live session' });
    }
});
exports.default = router;
