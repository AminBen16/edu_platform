// apps/api/src/routes/chat.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /chat/messages - Get messages for a class
router.get('/messages', protect, async (req, res) => {
  const { classId } = req.query;
  try {
    const messages = await prisma.message.findMany({
      where: { classId: classId as string },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /chat/message - Send a message
router.post('/message', protect, async (req, res) => {
  const { content, type, classId, fileUrl } = req.body;
  if (!content || !classId) {
    return res.status(400).json({ error: 'Content and class ID are required.' });
  }
  try {
    const message = await prisma.message.create({
      data: {
        content,
        type: type || 'TEXT',
        fileUrl,
        senderId: req.user!.id,
        classId,
        isRead: false,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
