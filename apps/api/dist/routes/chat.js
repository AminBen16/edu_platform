"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/chat.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /chat/messages - Get messages for a class
router.get('/messages/:classId', auth_1.protect, async (req, res) => {
    const { classId } = req.params;
    const userId = req.user.id;
    try {
        // Verify user is enrolled in the class
        const isEnrolled = await database_1.prisma.enrollment.findFirst({
            where: {
                userId: userId,
                classId: classId,
            },
        });
        if (!isEnrolled) {
            return res.status(403).json({ error: 'You are not authorized to view messages in this class.' });
        }
        const messages = await database_1.prisma.message.findMany({
            where: { classId: classId },
            orderBy: { createdAt: 'asc' }, // Order by asc for chat history
            include: {
                sender: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});
// POST /chat/message - Send a message
router.post('/message', auth_1.protect, async (req, res) => {
    const { content, type, classId, fileUrl } = req.body;
    const userId = req.user.id;
    if (!content || !classId) {
        return res.status(400).json({ error: 'Content and class ID are required.' });
    }
    try {
        // Verify user is enrolled in the class
        const isEnrolled = await database_1.prisma.enrollment.findFirst({
            where: {
                userId: userId,
                classId: classId,
            },
        });
        if (!isEnrolled) {
            return res.status(403).json({ error: 'You are not authorized to send messages in this class.' });
        }
        const message = await database_1.prisma.message.create({
            data: {
                content,
                type: type || 'TEXT',
                fileUrl,
                senderId: userId,
                classId,
                isRead: false,
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            }
        });
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});
exports.default = router;
