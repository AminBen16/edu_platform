"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// WebRTC Signaling Server for Live Classes
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// In-memory storage for signaling (for production, use Redis or similar)
const peerConnections = new Map();
const roomParticipants = new Map();
// All routes require authentication
router.use(auth_1.protect);
// POST /webrtc/room/:roomCode/join - Join a WebRTC room
router.post('/room/:roomCode/join', async (req, res) => {
    const { roomCode } = req.params;
    const { userName } = req.body;
    const { id: userId, role, schoolId } = req.user;
    try {
        // Verify the live session exists
        const session = await database_1.prisma.liveSession.findUnique({
            where: { roomCode },
        });
        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        if (!session.isActive) {
            return res.status(400).json({ error: 'Live session has ended' });
        }
        // Persist participant in the database
        // Check for existing participant record
        const existingParticipant = await database_1.prisma.liveSessionParticipant.findFirst({
            where: {
                sessionId: session.id,
                participantId: userId,
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
                    participantId: userId,
                    schoolId: schoolId,
                    role: role,
                    joinedAt: new Date(),
                }
            });
        }
        // Initialize room if not exists
        if (!roomParticipants.has(roomCode)) {
            roomParticipants.set(roomCode, new Map());
        }
        const participants = roomParticipants.get(roomCode);
        // Add participant
        participants.set(userId, {
            userId,
            userName: userName || req.user.name || 'Unknown',
            role,
        });
        // Get existing participants (excluding self)
        const existingParticipants = Array.from(participants.entries())
            .filter(([id]) => id !== userId)
            .map(([id, data]) => ({
            peerId: id,
            userId: data.userId,
            userName: data.userName,
            role: data.role,
        }));
        res.json({
            success: true,
            roomCode,
            participantId: userId,
            participants: existingParticipants,
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ],
        });
    }
    catch (error) {
        console.error('Error joining WebRTC room:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});
// POST /webrtc/room/:roomCode/leave - Leave a WebRTC room
router.post('/room/:roomCode/leave', async (req, res) => {
    const { roomCode } = req.params;
    const { id: userId } = req.user;
    try {
        const participants = roomParticipants.get(roomCode);
        if (participants) {
            participants.delete(userId);
            // Clean up empty rooms
            if (participants.size === 0) {
                roomParticipants.delete(roomCode);
            }
        }
        // Mark participant as left in DB
        const session = await database_1.prisma.liveSession.findUnique({ where: { roomCode } });
        if (session) {
            await database_1.prisma.liveSessionParticipant.updateMany({
                where: {
                    sessionId: session.id,
                    participantId: userId,
                    leftAt: null
                },
                data: {
                    leftAt: new Date()
                }
            }).catch(() => { });
        }
        res.json({ success: true, message: 'Left room successfully' });
    }
    catch (error) {
        console.error('Error leaving WebRTC room:', error);
        res.status(500).json({ error: 'Failed to leave room' });
    }
});
// GET /webrtc/room/:roomCode/participants - Get room participants
router.get('/room/:roomCode/participants', async (req, res) => {
    const { roomCode } = req.params;
    try {
        const participants = roomParticipants.get(roomCode);
        if (!participants) {
            return res.json({ participants: [] });
        }
        const participantList = Array.from(participants.entries()).map(([id, data]) => ({
            peerId: id,
            userId: data.userId,
            userName: data.userName,
            role: data.role,
        }));
        res.json({ participants: participantList });
    }
    catch (error) {
        console.error('Error getting participants:', error);
        res.status(500).json({ error: 'Failed to get participants' });
    }
});
// POST /webrtc/signal - Forward WebRTC signaling to target peer
router.post('/signal', async (req, res) => {
    const { roomCode, targetPeerId, signal, type } = req.body;
    const { id: senderId } = req.user;
    if (!roomCode || !targetPeerId || !signal) {
        return res.status(400).json({ error: 'roomCode, targetPeerId, and signal are required' });
    }
    try {
        // Verify sender is in the room
        const participants = roomParticipants.get(roomCode);
        if (!participants || !participants.has(senderId)) {
            return res.status(403).json({ error: 'You are not in this room' });
        }
        // In a production system, this would use WebSockets to send the signal
        // For HTTP fallback, we store the signal and the target can poll for it
        const signalKey = `${roomCode}:${targetPeerId}`;
        // Store signal for polling (TTL: 30 seconds)
        const signals = globalThis;
        if (!signals._webrtcSignals) {
            signals._webrtcSignals = new Map();
        }
        signals._webrtcSignals.set(signalKey, {
            from: senderId,
            signal,
            type: type || 'offer', // offer, answer, or ice-candidate
            timestamp: Date.now(),
        });
        // Clean up old signals
        const now = Date.now();
        for (const [key, value] of signals._webrtcSignals.entries()) {
            if (now - value.timestamp > 30000) {
                signals._webrtcSignals.delete(key);
            }
        }
        res.json({ success: true, message: 'Signal forwarded' });
    }
    catch (error) {
        console.error('Error sending signal:', error);
        res.status(500).json({ error: 'Failed to send signal' });
    }
});
// GET /webrtc/signal/:roomCode/:peerId - Poll for incoming signals
router.get('/signal/:roomCode/:peerId', async (req, res) => {
    const { roomCode, peerId } = req.params;
    const { id: userId } = req.user;
    try {
        const signals = globalThis._webrtcSignals;
        if (!signals) {
            return res.json({ signals: [] });
        }
        const signalKey = `${roomCode}:${peerId}`;
        const signalData = signals.get(signalKey);
        if (signalData && signalData.from !== userId) {
            signals.delete(signalKey); // Remove after retrieving
            return res.json({
                signals: [{
                        from: signalData.from,
                        signal: signalData.signal,
                        type: signalData.type,
                    }]
            });
        }
        res.json({ signals: [] });
    }
    catch (error) {
        console.error('Error polling signals:', error);
        res.status(500).json({ error: 'Failed to poll signals' });
    }
});
// POST /webrtc/room/:roomCode/ping - Keep-alive for participants
router.post('/room/:roomCode/ping', async (req, res) => {
    const { roomCode } = req.params;
    const { id: userId } = req.user;
    try {
        const participants = roomParticipants.get(roomCode);
        if (!participants || !participants.has(userId)) {
            return res.status(404).json({ error: 'You are not in this room' });
        }
        res.json({ success: true, timestamp: Date.now() });
    }
    catch (error) {
        console.error('Error ping:', error);
        res.status(500).json({ error: 'Failed to ping' });
    }
});
exports.default = router;
