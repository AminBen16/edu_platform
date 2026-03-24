"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_js_1 = require("../config/database.js");
class NotificationService {
    static async sendToUser(userId, title, message, options = {}) {
        try {
            await database_js_1.prisma.notification.create({
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
        }
        catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }
    static async sendToUsers(userIds, title, message, options = {}) {
        let successCount = 0;
        for (const userId of userIds) {
            if (await this.sendToUser(userId, title, message, options))
                successCount++;
        }
        return successCount;
    }
    static async sendToRole(role, schoolId, title, message, options = {}) {
        try {
            const users = await database_js_1.prisma.user.findMany({
                where: { role, schoolId },
                select: { id: true },
            });
            return await this.sendToUsers(users.map(u => u.id), title, message, { ...options, schoolId });
        }
        catch (error) {
            console.error('Role notification error:', error);
            return 0;
        }
    }
    static async sendNotification(options) {
        if (options.userIds) {
            await this.sendToUsers(options.userIds, options.title || 'Notification', options.message, options);
            return true;
        }
        if (options.userId) {
            return await this.sendToUser(options.userId, options.title || 'Notification', options.message, options);
        }
        throw new Error('userId or userIds required');
    }
}
exports.default = NotificationService;
