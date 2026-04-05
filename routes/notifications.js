const express = require('express');
const router = express.Router();
const auth = require('../middleware/AdminauthMiddleware');
const notificationService = require('../services/notificationService');

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await notificationService.listNotifications(String(req.admin.id));
    res.status(200).json({ message: 'Notifications retrieved', data: notifications });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id);
    res.status(200).json({ message: 'Notification retrieved', data: notification });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const notification = await notificationService.markRead(req.params.id, String(req.admin.id));
    res.status(200).json({ message: 'Notification marked as read', data: notification });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, String(req.admin.id));
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

module.exports = router;
