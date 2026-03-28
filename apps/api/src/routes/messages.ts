// Messages and chat routes
import { Router, Response } from 'express';
import { protect } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';

const router = Router();

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

const formatMessage = (msg: any) => ({
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
router.use(protect);

// GET /messages/conversations - Get all conversations for current user
router.get('/conversations', async (req: RequestWithUser, res: Response) => {
  const { schoolId, id: userId } = req.user!;

  try {
    const db = (await import('../config/database')).prisma as any;
    
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
      if (!otherPartyId) continue;

      if (!conversationMap.has(otherPartyId)) {
        conversationMap.set(otherPartyId, {
          userId: otherPartyId,
          user: msg.senderId === userId ? { id: otherPartyId, name: 'Chat User', role: 'STUDENT' } : msg.sender,
          lastMessage: { id: msg.id, content: msg.content, timestamp: msg.createdAt },
          unreadCount: msg.isRead || msg.senderId === userId ? 0 : 1,
        });
      } else if (!msg.isRead && msg.senderId !== userId) {
        conversationMap.get(otherPartyId).unreadCount++;
      }
    }
    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /messages - Get messages for a class
router.get('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { classId } = req.query;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    const where: any = { schoolId };
    if (classId) {
      where.classId = classId as string;
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
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /messages/:chatId - Get messages for a specific chat
router.get('/:chatId', async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { chatId } = req.params;

  try {
    const db = (await import('../config/database')).prisma as any;
    
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
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// POST /messages - Send new message
router.post('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId, id: userId } = req.user!;
  const { content, type, classId, chatId, receiverId, fileUrl } = req.body;
  const targetId = classId || chatId || receiverId;

  if (!content || !targetId) {
    return res.status(400).json({ error: 'content and a conversation target are required' });
  }

  try {
    const db = (await import('../config/database')).prisma as any;

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
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /messages/:id/read - Mark message as read
router.patch('/:id/read', async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    await db.message.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// DELETE /messages/:id - Delete message
router.delete('/:id', async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { schoolId } = req.user!;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    await db.message.delete({
      where: { id, schoolId },
    });

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /chat/message - Send message (mobile/admin)
router.post('/chat/message', async (req: RequestWithUser, res: Response) => {
  try {
    const { content, classId } = req.body;

    if (!content || !classId) {
      return res.status(400).json({ error: 'Missing content or classId' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const db = (await import('../config/database')).prisma as any;

    const message = await db.message.create({
      data: {
        content,
        classId,
        senderId: req.user.id,
      },
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
