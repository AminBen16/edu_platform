// Notification service for sending real-time notifications
import EmailService from './emailService';

interface NotificationOptions {
  userId: string;
  type: 'ASSIGNMENT' | 'GRADE' | 'ANNOUNCEMENT' | 'REMINDER';
  title: string;
  message: string;
  data?: any;
}

// In-memory storage for notifications (fallback when DB is not available)
const notificationsStore: any[] = [];

class NotificationService {
  static async sendNotification(options: NotificationOptions): Promise<boolean> {
    try {
      // Store notification in memory (fallback when DB is not available)
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        data: options.data || {},
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      notificationsStore.push(notification);
      console.log(`Notification stored in memory: ${options.title} for user ${options.userId}`);

      // Send email notification
      // Note: In a real implementation, you would fetch user data from database
      // For now, we'll send the email without user-specific data
      const emailSent = await EmailService.sendEmail({
        to: 'user@example.com', // Would be user.email from database
        subject: options.title,
        html: this.generateEmailHTML(options, 'User'),
        text: this.generateEmailText(options, 'User')
      });

      return emailSent;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  static async sendBulkNotifications(userIds: string[], options: Omit<NotificationOptions, 'userId'>): Promise<number> {
    let successCount = 0;
    
    for (const userId of userIds) {
      const sent = await this.sendNotification({
        ...options,
        userId
      });
      if (sent) successCount++;
    }

    return successCount;
  }

  private static generateEmailHTML(options: NotificationOptions, userName: string): string {
    const colors = {
      ASSIGNMENT: '#007bff',
      GRADE: '#28a745',
      ANNOUNCEMENT: '#fd7e14',
      REMINDER: '#dc3545'
    };

    const icons = {
      ASSIGNMENT: '📚',
      GRADE: '📊',
      ANNOUNCEMENT: '📢',
      REMINDER: '⏰'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: ${colors[options.type]}; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">${icons[options.type]}</div>
          <h1>${options.title}</h1>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2>Hello ${userName},</h2>
          <p>${options.message}</p>
          ${options.data ? this.generateDataSection(options.data) : ''}
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/dashboard" 
               style="background-color: ${colors[options.type]}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="background-color: #343a40; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 Education Platform. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private static generateEmailText(options: NotificationOptions, userName: string): string {
    return `Hello ${userName},\n\n${options.message}\n\nView your dashboard: http://localhost:3000/dashboard\n\n© 2024 Education Platform. All rights reserved.`;
  }

  private static generateDataSection(data: any): string {
    if (!data) return '';

    let html = '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">';
    
    Object.entries(data).forEach(([key, value]) => {
      html += `
        <div style="margin-bottom: 10px;">
          <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  static async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    // Return in-memory notifications (fallback)
    return notificationsStore
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  static async markAsRead(notificationId: string, userId: string) {
    // Mark notification as read in memory
    const notification = notificationsStore.find(n => n.id === notificationId && n.userId === userId);
    if (notification) {
      notification.isRead = true;
    }
    return notification;
  }

  static async markAllAsRead(userId: string) {
    // Mark all notifications as read for user
    notificationsStore.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  }

  static async getUnreadCount(userId: string) {
    // Count unread notifications in memory
    return notificationsStore.filter(n => n.userId === userId && !n.isRead).length;
  }
}

export default NotificationService;
