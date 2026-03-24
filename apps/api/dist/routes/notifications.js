"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/notifications.ts
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const auth_js_1 = require("../middleware/auth.js");
const axios_1 = __importDefault(require("axios"));
// WebSocket event emitters - to be integrated with actual WebSocket server
const emitToUser = async (userId, event, data) => {
    // In production, this would emit via Socket.IO or similar
    // For now, we rely on polling via /notifications/new endpoint
    console.log(`[WebSocket] Emitting ${event} to user ${userId}:`, data);
};
const router = (0, express_1.Router)();
const serializeNotificationData = (payload) => JSON.stringify(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)));
// GET /notifications - Get user notifications
router.get('/', auth_js_1.protect, async (req, res) => {
    try {
        const notifications = await database_js_1.prisma.notification.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Failed to fetch notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});
// GET /notifications/new - Get new notifications (for real-time polling)
router.get('/new', auth_js_1.protect, async (req, res) => {
    try {
        const lastCheck = req.query.lastCheck;
        const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 5000);
        const newNotifications = await database_js_1.prisma.notification.findMany({
            where: {
                userId: req.user.id,
                createdAt: { gt: lastCheckDate },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(newNotifications);
    }
    catch (error) {
        console.error('Failed to fetch new notifications:', error);
        res.status(500).json({ error: 'Failed to fetch new notifications.' });
    }
});
// POST /notifications/send - Send notifications to multiple users
router.post('/send', auth_js_1.protect, async (req, res) => {
    const { title, message, type, contentId, contentType, recipients, sendImmediately, toUserId } = req.body;
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
        const recipientGroups = Array.isArray(recipients) ? recipients : [];
        // Get target users based on recipients
        let targetUsers = [];
        if (recipientGroups.includes('all')) {
            targetUsers = await database_js_1.prisma.user.findMany({
                where: { schoolId: req.user.schoolId },
            });
        }
        else if (recipientGroups.includes('STUDENT')) {
            targetUsers = await database_js_1.prisma.user.findMany({
                where: {
                    schoolId: req.user.schoolId,
                    role: 'STUDENT',
                },
            });
        }
        else if (recipientGroups.includes('TEACHER')) {
            targetUsers = await database_js_1.prisma.user.findMany({
                where: {
                    schoolId: req.user.schoolId,
                    role: 'TEACHER',
                },
            });
        }
        else if (recipientGroups.includes('ADMIN')) {
            targetUsers = await database_js_1.prisma.user.findMany({
                where: {
                    schoolId: req.user.schoolId,
                    role: { in: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
                },
            });
        }
        else {
            targetUsers = await database_js_1.prisma.user.findMany({
                where: { schoolId: req.user.schoolId, id: req.user.id },
            });
        }
        // Create notifications for each target user
        const createdNotifications = [];
        for (const user of targetUsers) {
            const created = await database_js_1.prisma.notification.create({
                data: {
                    title,
                    content: message,
                    type,
                    userId: user.id,
                    read: false,
                },
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
        await _sendPushNotifications(title, message, targetUsers);
        res.status(201).json({
            success: true,
            notifications: createdNotifications,
            message: `Notifications sent to ${targetUsers.length} users.`
        });
    }
    catch (error) {
        console.error('Notification sending error:', error);
        res.status(500).json({ error: 'Failed to send notifications.' });
    }
});
// Helper function for single user notifications
async function _sendSingleUserNotification(req, res, toUserId, title, message, type = 'system') {
    try {
        // Create in-app notification
        const created = await database_js_1.prisma.notification.create({
            data: {
                title,
                content: message,
                type,
                userId: toUserId,
                read: false,
            },
        });
        // Send OneSignal push if configured
        await _sendPushNotifications(title, message, [{ id: toUserId }]);
        // Send real-time notification
        await emitToUser(toUserId, 'notification', {
            id: created.id,
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
        });
        res.status(200).json({ status: 'Notification sent', notification: created });
    }
    catch (error) {
        console.error('Failed to send notification:', error);
        res.status(500).json({ error: 'Failed to send notification.' });
    }
}
// Helper function for push notifications
async function _sendPushNotifications(title, message, targetUsers) {
    try {
        const onesignalAppId = process.env.ONESIGNAL_APP_ID;
        const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
        if (!onesignalAppId || !onesignalApiKey) {
            return;
        }
        await axios_1.default.post('https://onesignal.com/api/v1/notifications', {
            app_id: onesignalAppId,
            headings: { en: title },
            contents: { en: message },
            // In production, mapping user IDs to OneSignal Player IDs/External IDs
            include_external_user_ids: targetUsers.map(u => u.id),
        }, {
            headers: {
                'Authorization': `Basic ${onesignalApiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }
    catch (error) {
        console.error('Push notification error:', error);
    }
}
// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', auth_js_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        await database_js_1.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
});
// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', auth_js_1.protect, async (req, res) => {
    try {
        await database_js_1.prisma.notification.updateMany({
            where: {
                userId: req.user.id,
            },
            data: { read: true },
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read.' });
    }
});
exports.default = router;
