"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/chat.ts
const express_1 = require("express");
const db_1 = __importDefault(require("db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /chat/threads - List chat threads for the user's school
router.get('/threads', auth_1.protect, async (req, res) => {
    try {
        const threads = await db_1.default.chat.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(threads);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat threads.' });
    }
});
// POST /chat/message - Send a message in a thread
router.post('/message', auth_1.protect, async (req, res) => {
    const { chatId, content } = req.body;
    if (!chatId || !content) {
        return res.status(400).json({ error: 'Thread ID and content are required.' });
    }
    try {
        const message = await db_1.default.chatMessage.create({
            data: {
                chatId,
                content,
                authorId: req.user.id,
                schoolId: req.user.schoolId,
            },
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});
exports.default = router;
