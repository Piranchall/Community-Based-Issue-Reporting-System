const express = require('express');
const router  = express.Router();
const userService           = require('../services/userService');
const notificationService   = require('../services/notificationService');
const authMiddleware        = require('../middleware/authMiddleware');

// ── Public routes ─────────────────────────────────────────────────────────────

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, avatar } = req.body;

    if (!email || !phone || !password) {
      return res.status(400).json({ error: 'Email, phone, and password are required' });
    }

    const result = await userService.registerUser({ email, phone, password, firstName, lastName, avatar });

    res.status(201).json({ message: 'User registered successfully', data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/users/login — accepts email OR phone
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or phone, and password are required' });
    }

    const result = await userService.loginUser(identifier, password);

    res.status(200).json({ message: 'Login successful', data: result });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/users/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await userService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/users/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await userService.resetPassword(email, token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Protected routes — NOTIFICATIONS must come BEFORE /:userId ────────────────

// GET /api/users/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id);
    const notifications = await notificationService.listNotifications(userId);
    res.status(200).json({
      message: 'Notifications retrieved',
      count:   notifications.length,
      data:    notifications
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/users/notifications/:id
router.get('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id);
    const notification = await notificationService.getNotificationById(Number(req.params.id));
    if (String(notification.userId) !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(200).json({ message: 'Notification retrieved', data: notification });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/users/notifications/:id — mark as read
router.put('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id);
    const notification = await notificationService.markRead(Number(req.params.id), userId);
    res.status(200).json({ message: 'Notification marked as read', data: notification });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/users/notifications/:id
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id);
    await notificationService.deleteNotification(Number(req.params.id), userId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json({ message: 'User profile fetched successfully', data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const updatedUser = await userService.updateUserProfile(req.user.userId, { firstName, lastName, phone, avatar });
    res.status(200).json({ message: 'User profile updated successfully', data: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/users/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const result = await userService.changePassword(req.user.userId, currentPassword, newPassword);
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const result = await userService.deleteUserAccount(req.user.userId);
    res.status(200).json({ message: result.message, data: result.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:userId/public
router.get('/:userId/public', authMiddleware, async (req, res) => {
  try {
    const profile = await userService.getPublicUserProfile(req.params.userId, req.user.userId);
    res.status(200).json({ message: 'Public profile fetched successfully', data: profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── This must come LAST — catches /:userId ────────────────────────────────────

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.status(200).json({ message: 'User fetched successfully', data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
