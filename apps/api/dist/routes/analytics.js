"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/analytics.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /analytics/event - Track a custom event (placeholder for Vercel Analytics)
router.post('/event', auth_1.protect, async (req, res) => {
    const { eventType, metadata } = req.body;
    if (!eventType) {
        return res.status(400).json({ error: 'eventType is required.' });
    }
    // Here you would send the event to Vercel Analytics or your own tracking system
    // For now, just log and return success
    console.log('Analytics event:', { eventType, metadata, user: req.user });
    res.status(200).json({ status: 'Event tracked' });
});
exports.default = router;
