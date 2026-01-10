"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/chat.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /chat/messages - Get messages for a class
router.get('/messages', auth_1.protect, async (req, res) => {
    const { classId } = req.query;
    try {
        const messages = await database_1.prisma.message.findMany({
            where: { classId: classId },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});
// POST /chat/message - Send a message
router.post('/message', auth_1.protect, async (req, res) => {
    const { content, type, classId, fileUrl } = req.body;
    if (!content || !classId) {
        return res.status(400).json({ error: 'Content and class ID are required.' });
    }
    try {
        const message = await database_1.prisma.message.create({
            data: {
                content,
                type: type || 'TEXT',
                fileUrl,
                senderId: req.user.id,
                classId,
                isRead: false,
            },
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});
exports.default = router;
