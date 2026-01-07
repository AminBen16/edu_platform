// apps/api/src/routes/notifications.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// POST /notifications/send - Send a notification (teacher/admin only)
router.post('/send', protect, async (req, res) => {
  const { toUserId, title, message } = req.body;
  if (!toUserId || !title || !message) {
    return res.status(400).json({ error: 'toUserId, title, and message are required.' });
  }
  try {
    // OneSignal REST API integration (requires ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in env)
    const onesignalAppId = process.env.ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;
    if (!onesignalAppId || !onesignalApiKey) {
      return res.status(500).json({ error: 'OneSignal not configured.' });
    }
    // This assumes you have mapped userId to OneSignal player_id elsewhere
    // For demo, send to all users
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
    res.status(200).json({ status: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification.' });
  }
});

export default router;
