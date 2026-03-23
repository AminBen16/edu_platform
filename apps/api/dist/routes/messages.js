"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Messages and chat routes
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const senderSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    schoolId: true,
    avatarUrl: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
const formatMessage = (msg) => ({
    id: msg.id,
    content: msg.content,
    type: msg.type || 'TEXT',
    fileUrl: msg.fileUrl ?? null,
    senderId: msg.senderId,
    sender: msg.sender ?? null,
    classId: msg.classId ?? null,
    isRead: msg.isRead || false,
    createdAt: msg.createdAt,
});
// All routes require authentication
router.use(auth_1.protect);
// GET /messages/conversations - Get all conversations for current user
router.get('/conversations', async (req, res) => {
    const { schoolId, id: userId } = req.user;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const messages = await db.message.findMany({
            where: { schoolId },
            include: {
                sender: {
                    select: senderSelect,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const conversationMap = new Map();
        for (const msg of messages) {
            const otherPartyId = msg.senderId === userId ? msg.classId : msg.senderId;
            if (!otherPartyId)
                continue;
            if (!conversationMap.has(otherPartyId)) {
                conversationMap.set(otherPartyId, {
                    userId: otherPartyId,
                    user: msg.senderId === userId ? { id: otherPartyId, name: 'Chat User', role: 'STUDENT' } : msg.sender,
                    lastMessage: { id: msg.id, content: msg.content, timestamp: msg.createdAt },
                    unreadCount: msg.isRead || msg.senderId === userId ? 0 : 1,
                });
            }
            else if (!msg.isRead && msg.senderId !== userId) {
                conversationMap.get(otherPartyId).unreadCount++;
            }
        }
        res.json(Array.from(conversationMap.values()));
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
// GET /messages - Get messages for a class
router.get('/', async (req, res) => {
    const { schoolId } = req.user;
    const { classId } = req.query;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const where = { schoolId };
        if (classId) {
            where.classId = classId;
        }
        const messages = await db.message.findMany({
            where,
            include: {
                sender: {
                    select: senderSelect,
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(messages.map(formatMessage));
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// GET /messages/:chatId - Get messages for a specific chat
router.get('/:chatId', async (req, res) => {
    const { schoolId } = req.user;
    const { chatId } = req.params;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const messages = await db.message.findMany({
            where: {
                schoolId,
                classId: chatId,
            },
            include: {
                sender: {
                    select: senderSelect,
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(messages.map(formatMessage));
    }
    catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
});
// POST /messages - Send new message
router.post('/', async (req, res) => {
    const { schoolId, id: userId } = req.user;
    const { content, type, classId, chatId, receiverId, fileUrl } = req.body;
    const targetId = classId || chatId || receiverId;
    if (!content || !targetId) {
        return res.status(400).json({ error: 'content and a conversation target are required' });
    }
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const message = await db.message.create({
            data: {
                content,
                type: type || 'TEXT',
                classId: targetId,
                senderId: userId,
                schoolId,
                fileUrl,
                isRead: false,
            },
            include: {
                sender: {
                    select: senderSelect,
                },
            },
        });
        res.status(201).json(formatMessage(message));
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
// PATCH /messages/:id/read - Mark message as read
router.patch('/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        await db.message.update({
            where: { id },
            data: { isRead: true },
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});
// DELETE /messages/:id - Delete message
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req.user;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        await db.message.delete({
            where: { id, schoolId },
        });
        res.status(200).json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});
// POST /chat/message - Send message (mobile/admin)
router.post('/chat/message', async (req, res) => {
    try {
        const { content, classId } = req.body;
        if (!content || !classId) {
            return res.status(400).json({ error: 'Missing content or classId' });
        }
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const message = await db.message.create({
            data: {
                content,
                classId,
                senderId: req.user.id,
            },
        });
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
