// apps/api/src/routes/chat.ts
import { Router } from 'express';
import prisma from 'db';
import { protect } from '../middleware/auth';

const router = Router();

// GET /chat/threads - List chat threads for the user's school
router.get('/threads', protect, async (req, res) => {
  try {
    const threads = await prisma.chat.findMany({
      where: { schoolId: req.user!.schoolId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat threads.' });
  }
});

// POST /chat/message - Send a message in a thread
router.post('/message', protect, async (req, res) => {
  const { chatId, content } = req.body;
  if (!chatId || !content) {
    return res.status(400).json({ error: 'Thread ID and content are required.' });
  }
  try {
    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        content,
        authorId: req.user!.id,
        schoolId: req.user!.schoolId,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
