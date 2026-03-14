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
// All routes require authentication
router.use(auth_1.protect);
// GET /messages - Get messages for a class
router.get('/', async (req, res) => {
    const { schoolId } = req.user;
    const { classId } = req.query;
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const where = { schoolId };
        if (classId) {
            where.chatId = classId;
        }
        const messages = await db.chatMessage.findMany({
            where,
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const transformedMessages = messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            type: msg.type || 'TEXT',
            senderId: msg.authorId,
            senderName: msg.author?.name,
            senderAvatar: msg.author?.avatarUrl,
            chatId: msg.chatId,
            isRead: msg.isRead || false,
            fileUrl: msg.fileUrl,
            createdAt: msg.createdAt,
        }));
        res.json(transformedMessages);
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
        const messages = await db.chatMessage.findMany({
            where: {
                schoolId,
                chatId,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const transformedMessages = messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            type: msg.type || 'TEXT',
            senderId: msg.authorId,
            senderName: msg.author?.name,
            senderAvatar: msg.author?.avatarUrl,
            isRead: msg.isRead || false,
            fileUrl: msg.fileUrl,
            createdAt: msg.createdAt,
        }));
        res.json(transformedMessages);
    }
    catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
});
// POST /messages - Send new message
router.post('/', async (req, res) => {
    const { schoolId, id: userId } = req.user;
    const { content, type, chatId, fileUrl } = req.body;
    if (!content || !chatId) {
        return res.status(400).json({ error: 'content and chatId are required' });
    }
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../config/database')))).prisma;
        const message = await db.chatMessage.create({
            data: {
                content,
                type: type || 'TEXT',
                chatId,
                authorId: userId,
                schoolId,
                fileUrl,
                isRead: false,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
        res.status(201).json({
            id: message.id,
            content: message.content,
            type: message.type || 'TEXT',
            senderId: message.authorId,
            senderName: message.author?.name,
            senderAvatar: message.author?.avatarUrl,
            chatId: message.chatId,
            isRead: message.isRead || false,
            fileUrl: message.fileUrl,
            createdAt: message.createdAt,
            message: 'Message sent successfully',
        });
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
        await db.chatMessage.update({
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
        await db.chatMessage.delete({
            where: { id, schoolId },
        });
        res.status(200).json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});
exports.default = router;
