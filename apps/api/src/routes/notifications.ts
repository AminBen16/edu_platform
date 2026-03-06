// apps/api/src/routes/notifications.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import axios from 'axios';
import { Role } from '../lib/database';

// Mock WebSocket functions for development
const emitToAll = (schoolId: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to all in school ${schoolId}:`, { event, data });
};

const emitToRole = (schoolId: string, role: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to ${role} in school ${schoolId}:`, { event, data });
};

const emitToUser = (userId: string, event: string, data: any) => {
  console.log(`[MOCK WEBSOCKET] Emit to user ${userId}:`, { event, data });
};

const router = Router();

const rolesAllowedToSendNotifications: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.SCHOOL_ADMIN,
  Role.TEACHER,
];

const hasDatabase = Boolean(process.env.DATABASE_URL) && Boolean(prisma);

function canSendNotifications(role?: string): boolean {
  return role ? rolesAllowedToSendNotifications.includes(role as Role) : false;
}

// GET /notifications - Get user notifications
router.get('/', protect, async (req, res) => {
  try {
    if (!hasDatabase) {
      return res.status(503).json({ error: 'Notification service is not configured.' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
        schoolId: req.user!.schoolId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// GET /notifications/new - Get new notifications (for real-time polling)
router.get('/new', protect, async (req, res) => {
  try {
    const lastCheck = req.query.lastCheck as string;
    const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 5000); // Last 5 seconds

    if (!hasDatabase) {
      return res.status(503).json({ error: 'Notification service is not configured.' });
    }

    const newNotifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
        schoolId: req.user!.schoolId,
        createdAt: { gt: lastCheckDate },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(newNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch new notifications.' });
  }
});

// POST /notifications/send - Send notifications (enhanced version)
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
    // Legacy fields
    toUserId 
  } = req.body;
  
  // Handle legacy single user notification
  if (toUserId && !recipients) {
    return _sendSingleUserNotification(req, res, toUserId, title, message);
  }
  
  if (!title || !message || !type) {
    return res.status(400).json({ 
      error: 'Title, message, and type are required.' 
    });
  }

  if (!canSendNotifications(req.user?.role)) {
    return res.status(403).json({ error: 'You are not authorized to send notifications.' });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients must be a non-empty array.' });
  }

  if (!hasDatabase) {
    return res.status(503).json({ error: 'Notification service is not configured.' });
  }
  
  try {
    const notificationData = {
      title,
      message,
      type,
      contentId,
      contentType,
      priority: priority || 'normal',
      data: data || {},
      schoolId: req.user!.schoolId,
      senderId: req.user!.id,
      createdAt: new Date(),
    };

    // Get target users based on recipients
    let targetUsers: any[] = [];
    
    if (recipients.includes('all')) {
      targetUsers = await prisma.user.findMany({
        where: { schoolId: req.user!.schoolId },
      });
    } else if (recipients.includes('students')) {
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: req.user!.schoolId,
          role: 'STUDENT',
        },
      });
    } else if (recipients.includes('parents')) {
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: req.user!.schoolId,
          role: 'PARENT',
        },
      });
    } else if (recipients.includes('admin')) {
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: req.user!.schoolId,
          role: { in: ['ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'] },
        },
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

      // Send real-time notification
      if (sendImmediately) {
        const notificationId = createdNotifications[createdNotifications.length - 1]?.id;
          
        emitToUser(user.id, 'notification', {
          id: notificationId,
          title,
          message,
          type,
          contentId,
          contentType,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Also emit to roles for broader real-time updates
    if (recipients.includes('students')) {
      emitToRole(req.user!.schoolId, 'STUDENT', 'notification', {
        title,
        message,
        type,
        contentId,
        contentType,
        timestamp: new Date().toISOString(),
      });
    }

    if (recipients.includes('parents')) {
      emitToRole(req.user!.schoolId, 'PARENT', 'notification', {
        title,
        message,
        type,
        contentId,
        contentType,
        timestamp: new Date().toISOString(),
      });
    }

    if (recipients.includes('admin')) {
      emitToRole(req.user!.schoolId, 'ADMIN', 'notification', {
        title,
        message,
        type,
        contentId,
        contentType,
        timestamp: new Date().toISOString(),
      });
    }

    // Also send push notifications if configured
    if (channels && channels.includes('push')) {
      await _sendPushNotifications(title, message, targetUsers);
    }

    res.status(201).json({ 
      success: true, 
      notifications: createdNotifications,
      message: `Notifications sent to ${targetUsers.length} users.` 
    });
  } catch (error) {
    console.error('Notification sending error:', error);
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

// Helper function for legacy single user notifications
async function _sendSingleUserNotification(req: any, res: any, toUserId: string, title: string, message: string) {
  try {
    if (!canSendNotifications(req.user?.role)) {
      return res.status(403).json({ error: 'You are not authorized to send notifications.' });
    }

    if (!hasDatabase) {
      return res.status(503).json({ error: 'Notification service is not configured.' });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: toUserId,
        schoolId: req.user!.schoolId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found in your school.' });
    }

    // OneSignal REST API integration (requires ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in env)
    const onesignalAppId = process.env.ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
    
    if (onesignalAppId && onesignalApiKey) {
      // Send to specific user via OneSignal
      await axios.post('https://onesignal.com/api/v1/notifications', {
        app_id: onesignalAppId,
        headings: { en: title },
        contents: { en: message },
        include_player_ids: [toUserId], // This assumes you have mapped userId to OneSignal player_id
      }, {
        headers: {
          'Authorization': `Basic ${onesignalApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Also create in-app notification
    const notificationData = {
      title,
      message,
      type: 'system',
      userId: toUserId,
      schoolId: req.user!.schoolId,
      senderId: req.user!.id,
      isRead: false,
      createdAt: new Date(),
    };

    await prisma.notification.create({
      data: notificationData,
    });

    // Send real-time notification
    emitToUser(toUserId, 'notification', {
      title,
      message,
      type: 'system',
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ status: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification.' });
  }
}

// Helper function for push notifications
async function _sendPushNotifications(title: string, message: string, targetUsers: any[]) {
  try {
    const onesignalAppId = process.env.ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
    
    if (!onesignalAppId || !onesignalApiKey) {
      console.log('OneSignal not configured, skipping push notifications');
      return;
    }

    // Send to all users (in production, you'd filter by actual player IDs)
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
    const { id } = req.params;

    if (!hasDatabase) {
      return res.status(503).json({ error: 'Notification service is not configured.' });
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user!.id,
        schoolId: req.user!.schoolId,
      },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    if (!hasDatabase) {
      return res.status(503).json({ error: 'Notification service is not configured.' });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        schoolId: req.user!.schoolId,
      },
      data: { isRead: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

export default router;
