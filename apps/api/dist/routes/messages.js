"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Messages and chat routes
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /messages - Get messages for a class
router.get('/', async (req, res) => {
    try {
        const { classId } = req.query;
        // Mock messages data
        const messages = [
            {
                id: '1',
                content: 'Welcome to the class!',
                type: 'TEXT',
                senderId: 'teacher-1',
                classId: classId || '1',
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '2',
                content: 'Can someone explain the homework again?',
                type: 'TEXT',
                senderId: 'student-1',
                classId: classId || '1',
                isRead: true,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
        ];
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// POST /messages - Send new message
router.post('/', async (req, res) => {
    try {
        const { content, type, classId, fileUrl } = req.body;
        const newMessage = {
            id: `message-${Date.now()}`,
            content,
            type: type || 'TEXT',
            fileUrl,
            senderId: 'student-1', // Would come from authenticated user
            classId,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        res.status(201).json({
            message: 'Message sent successfully',
            data: newMessage,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
