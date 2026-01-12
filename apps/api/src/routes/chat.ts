// apps/api/src/routes/chat.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /chat/messages - Get messages for a class
router.get('/messages/:classId', protect, async (req, res) => {
    const { classId } = req.params;
    const userId = req.user!.id;

    try {
        // Verify user is enrolled in the class
        const isEnrolled = await prisma.enrollment.findFirst({
            where: {
                userId: userId,
                classId: classId,
            },
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'You are not authorized to view messages in this class.' });
        }

        const messages = await prisma.message.findMany({
            where: { classId: classId },
            orderBy: { createdAt: 'asc' }, // Order by asc for chat history
            include: {
                sender: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            }
        });
        res.json(messages);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// POST /chat/message - Send a message
router.post('/message', protect, async (req, res) => {
    const { content, type, classId, fileUrl } = req.body;
    const userId = req.user!.id;

    if (!content || !classId) {
        return res.status(400).json({ error: 'Content and class ID are required.' });
    }

    try {
        // Verify user is enrolled in the class
        const isEnrolled = await prisma.enrollment.findFirst({
            where: {
                userId: userId,
                classId: classId,
            },
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'You are not authorized to send messages in this class.' });
        }

        const message = await prisma.message.create({
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
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

export default router;
