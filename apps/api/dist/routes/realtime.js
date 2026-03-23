"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const database_js_1 = require("../config/database.js");
const router = (0, express_1.Router)();
// SSE endpoint: /api/realtime/events?lastSeen=iso_timestamp
router.get('/events', auth_js_1.protect, async (req, res) => {
    const schoolId = req.user.schoolId;
    const lastSeen = req.query.lastSeen || new Date(0).toISOString();
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });
    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    // Poll for new events every 2s (Vercel safe)
    const interval = setInterval(async () => {
        try {
            // Fetch new Messages for school since lastSeen
            const newMessages = await database_js_1.prisma.message.findMany({
                where: {
                    schoolId,
                    createdAt: { gt: new Date(lastSeen) },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            // Fetch new Notifications for user
            const newNotifications = await database_js_1.prisma.notification.findMany({
                where: {
                    userId: req.user.id,
                    createdAt: { gt: new Date(lastSeen) },
                },
                take: 5,
            });
            if (newMessages.length > 0) {
                res.write(`data: ${JSON.stringify({ type: 'new-message', data: newMessages })}\n\n`);
            }
            if (newNotifications.length > 0) {
                res.write(`data: ${JSON.stringify({ type: 'new-notification', data: newNotifications })}\n\n`);
            }
        }
        catch (error) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Poll error' })}\n\n`);
        }
    }, 2000);
    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});
// POST emit event (for other services to trigger)
router.post('/emit/:event', auth_js_1.protect, async (req, res) => {
    const event = req.params.event;
    const data = req.body;
    // For now, create Message/Notification in DB (triggers SSE polls)
    // Future: Redis pub/sub
    if (event === 'new-message') {
        await database_js_1.prisma.message.create({
            data: {
                ...data,
                schoolId: req.user.schoolId,
            },
        });
    }
    res.json({ success: true });
});
exports.default = router;
