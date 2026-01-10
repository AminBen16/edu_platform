// Notification service for sending real-time notifications
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import EmailService from './emailService';

interface NotificationOptions {
  userId: string;
  type: 'ASSIGNMENT' | 'GRADE' | 'ANNOUNCEMENT' | 'REMINDER';
  title: string;
  message: string;
  data?: any;
}

class NotificationService {
  static async sendNotification(options: NotificationOptions): Promise<boolean> {
    try {
      // Store notification in database
      await prisma.notification.create({
        data: {
          userId: options.userId,
          type: options.type,
          title: options.title,
          message: options.message,
          data: options.data || {},
          isRead: false,
        }
      });

      // Send email notification
      const user = await prisma.user.findUnique({
        where: { id: options.userId },
        select: { email: true, name: true }
      });

      if (user) {
        const emailSent = await EmailService.sendEmail({
          to: user.email,
          subject: options.title,
          html: this.generateEmailHTML(options, user.name),
          text: this.generateEmailText(options, user.name)
        });

        return emailSent;
      }

      return true;
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
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: userId
      },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { 
        userId: userId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { 
        userId: userId,
        isRead: false
      }
    });
  }
}

export default NotificationService;
