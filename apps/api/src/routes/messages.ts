// Messages and chat routes
import { Router, Response } from 'express';
import { protect } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /messages - Get messages for a class
router.get('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { classId } = req.query;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    const where: any = { schoolId };
    if (classId) {
      where.chatId = classId as string;
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

    const transformedMessages = messages.map((msg: any) => ({
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
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /messages/:chatId - Get messages for a specific chat
router.get('/:chatId', async (req: RequestWithUser, res: Response) => {
  const { schoolId } = req.user!;
  const { chatId } = req.params;

  try {
    const db = (await import('../config/database')).prisma as any;
    
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

    const transformedMessages = messages.map((msg: any) => ({
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
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// POST /messages - Send new message
router.post('/', async (req: RequestWithUser, res: Response) => {
  const { schoolId, id: userId } = req.user!;
  const { content, type, chatId, fileUrl } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ error: 'content and chatId are required' });
  }

  try {
    const db = (await import('../config/database')).prisma as any;

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
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /messages/:id/read - Mark message as read
router.patch('/:id/read', async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    await db.chatMessage.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// DELETE /messages/:id - Delete message
router.delete('/:id', async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { schoolId } = req.user!;

  try {
    const db = (await import('../config/database')).prisma as any;
    
    await db.chatMessage.delete({
      where: { id, schoolId },
    });

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
