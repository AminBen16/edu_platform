import { prisma } from '../config/database.js';

// Re-define UserRole locally as Prisma import is failing during tsc
type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

// Production-ready notification service
// 1. Creates Prisma Notification records (SSE polls detect)
// 2. Optional OneSignal push via /notifications/send
// 3. No external deps (axios removed)

interface NotificationOptions {
  userId?: string;
  userIds?: string[];
  role?: UserRole;
  schoolId?: string;
  message: string;
  title?: string;
  type?: string;
  contentId?: string;
  contentType?: string;
  data?: any;
}

class NotificationService {
  static async sendToUser(userId: string, title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    try {
      await prisma.notification.create({
        data: {
          title,
          content: message,
          type: options.type || 'system',
          userId,
          schoolId: options.schoolId || '',
          data: options.data ? JSON.stringify(options.data) : null,
        },
      });

      // SSE will poll /notifications/new and detect
      console.log(`✅ Notification queued for user ${userId}: ${title}`);
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  static async sendToUsers(userIds: string[], title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<number> {
    let successCount = 0;
    for (const userId of userIds) {
      if (await this.sendToUser(userId, title, message, options)) successCount++;
    }
    return successCount;
  }

  static async sendToRole(role: UserRole, schoolId: string, title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        where: { role, schoolId },
        select: { id: true },
      });
      return await this.sendToUsers(users.map(u => u.id), title, message, { ...options, schoolId });
    } catch (error) {
      console.error('Role notification error:', error);
      return 0;
    }
  }

  static async sendNotification(options: NotificationOptions): Promise<boolean> {
    if (options.userIds) {
      await this.sendToUsers(options.userIds, options.title || 'Notification', options.message, options as any);
      return true;
    }
    if (options.userId) {
      return await this.sendToUser(options.userId, options.title || 'Notification', options.message, options as any);
    }
    throw new Error('userId or userIds required');
  }
}

export default NotificationService;

