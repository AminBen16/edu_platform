// apps/api/src/routes/notifications.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import axios from 'axios';

// WebSocket event emitters - to be integrated with actual WebSocket server
const emitToUser = async (userId: string, event: string, data: any) => {
  // In production, this would emit via Socket.IO or similar
  // For now, we rely on polling via /notifications/new endpoint
  console.log(`[WebSocket] Emitting ${event} to user ${userId}:`, data);
};

const router = Router();

const serializeNotificationData = (payload: Record<string, unknown>) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
    )
  );

// Validation helper
const validateDatabaseConnection = () => {
  return true;
};

// GET /notifications - Get user notifications
router.get('/', protect, async (req, res) => {
  try {
    validateDatabaseConnection();
    
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: req.user!.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured. Please set DATABASE_URL.' });
    }
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// GET /notifications/new - Get new notifications (for real-time polling)
router.get('/new', protect, async (req, res) => {
  try {
    validateDatabaseConnection();
    
    const lastCheck = req.query.lastCheck as string;
    const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 5000);

    const newNotifications = await prisma.notification.findMany({
      where: { 
        userId: req.user!.id,
        createdAt: { gt: lastCheckDate },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(newNotifications);
  } catch (error: any) {
    console.error('Failed to fetch new notifications:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured.' });
    }
    res.status(500).json({ error: 'Failed to fetch new notifications.' });
  }
});

// POST /notifications/send - Send notifications to multiple users
router.post('/send', protect, async (req, res) => {
  const { 
    title, 
    message, 
    type, 
    contentId, 
    contentType, 
    recipients, 
    channels, 
    priority, 
    sendImmediately,
    data,
    toUserId 
  } = req.body;
  
  // Handle single user notification
  if (toUserId && !recipients) {
    return _sendSingleUserNotification(req, res, toUserId, title, message, type);
  }
  
  if (!title || !message || !type) {
    return res.status(400).json({ 
      error: 'Title, message, and type are required.' 
    });
  }
  
  try {
    validateDatabaseConnection();
    const recipientGroups = Array.isArray(recipients) ? recipients : [];
    
    const notificationData = {
      title,
      message,
      type,
      schoolId: req.user!.schoolId,
      data: serializeNotificationData({
        contentId,
        contentType,
        priority: priority || 'normal',
        channels,
        sendImmediately,
        senderId: req.user!.id,
        metadata: data ?? null,
      }),
      createdAt: new Date(),
    };

    // Get target users based on recipients
    let targetUsers: any[] = [];
    
    if (recipientGroups.includes('all')) {
      targetUsers = await prisma.user.findMany({
        where: { schoolId: req.user!.schoolId },
      });
    } else if (recipientGroups.includes('students')) {
      targetUsers = await prisma.user.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          role: 'STUDENT',
        },
      });
    } else if (recipientGroups.includes('parents')) {
      targetUsers = await prisma.user.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          role: 'PARENT',
        },
      });
    } else if (recipientGroups.includes('admin')) {
      targetUsers = await prisma.user.findMany({
        where: { 
          schoolId: req.user!.schoolId,
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });
    } else {
      targetUsers = await prisma.user.findMany({
        where: { schoolId: req.user!.schoolId, id: req.user!.id },
      });
    }

    // Create notifications for each target user
    const createdNotifications = [];
    
    for (const user of targetUsers) {
      const notification = {
        ...notificationData,
        userId: user.id,
        isRead: false,
      };

      const created = await prisma.notification.create({
        data: notification,
      });
      createdNotifications.push(created);

      // Send real-time notification if requested
      if (sendImmediately) {
        await emitToUser(user.id, 'notification', {
          id: created.id,
          title,
          message,
          type,
          contentId,
          contentType,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Send push notifications if configured
    if (channels && channels.includes('push')) {
      await _sendPushNotifications(title, message, targetUsers);
    }

    res.status(201).json({ 
      success: true, 
      notifications: createdNotifications,
      message: `Notifications sent to ${targetUsers.length} users.` 
    });
  } catch (error: any) {
    console.error('Notification sending error:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured.' });
    }
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

// Helper function for single user notifications
async function _sendSingleUserNotification(req: any, res: any, toUserId: string, title: string, message: string, type: string = 'system') {
  try {
    validateDatabaseConnection();
    
    // OneSignal push notification if configured
    const onesignalAppId = process.env.ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
    
    if (onesignalAppId && onesignalApiKey) {
      await axios.post('https://onesignal.com/api/v1/notifications', {
        app_id: onesignalAppId,
        headings: { en: title },
        contents: { en: message },
        include_player_ids: [toUserId],
      }, {
        headers: {
          'Authorization': `Basic ${onesignalApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Create in-app notification
    const notificationData = {
      title,
      message,
      type,
      userId: toUserId,
      schoolId: req.user!.schoolId,
      isRead: false,
      data: serializeNotificationData({
        senderId: req.user!.id,
        channel: 'direct',
      }),
      createdAt: new Date(),
    };

    const created = await prisma.notification.create({
      data: notificationData,
    });

    // Send real-time notification
    await emitToUser(toUserId, 'notification', {
      id: created.id,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ status: 'Notification sent', notification: created });
  } catch (error: any) {
    console.error('Failed to send notification:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured.' });
    }
    res.status(500).json({ error: 'Failed to send notification.' });
  }
}

// Helper function for push notifications
async function _sendPushNotifications(title: string, message: string, targetUsers: any[]) {
  try {
    const onesignalAppId = process.env.ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
    
    if (!onesignalAppId || !onesignalApiKey) {
      console.log('OneSignal not configured, skipping push notification');
      return;
    }

    await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: onesignalAppId,
      headings: { en: title },
      contents: { en: message },
      included_segments: ['All'],
    }, {
      headers: {
        'Authorization': `Basic ${onesignalApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    validateDatabaseConnection();
    
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured.' });
    }
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    validateDatabaseConnection();
    
    await prisma.notification.updateMany({
      where: { 
        userId: req.user!.id,
      },
      data: { isRead: true },
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    if (error.message.includes('DATABASE_URL')) {
      return res.status(503).json({ error: 'Database not configured.' });
    }
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

export default router;
