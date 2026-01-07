// apps/api/src/routes/analytics.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

// POST /analytics/event - Track a custom event (placeholder for Vercel Analytics)
router.post('/event', protect, async (req, res) => {
  const { eventType, metadata } = req.body;
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required.' });
  }
  // Here you would send the event to Vercel Analytics or your own tracking system
  // For now, just log and return success
  console.log('Analytics event:', { eventType, metadata, user: req.user });
  res.status(200).json({ status: 'Event tracked' });
});

export default router;
