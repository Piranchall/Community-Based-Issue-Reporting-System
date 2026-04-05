const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, avatar } = req.body;

    // Validation
    if (!email || !phone || !password) {
      return res.status(400).json({ 
        error: 'Email, phone, and password are required' 
      });
    }

    const result = await userService.registerUser({
      email,
      phone,
      password,
      firstName,
      lastName,
      avatar
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user — accepts email OR phone number as identifier
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;  // accept either field name

    if (!identifier || !password) {
      return res.status(400).json({ 
        error: 'Email or phone, and password are required' 
      });
    }

    const result = await userService.loginUser(identifier, password);

    res.status(200).json({
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json({
      message: 'User profile fetched successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Citizen Notifications ──────────────────────────────────────────────────
// Notifications are created automatically when an admin updates an issue
// status. Citizens read them here using their own token.

const notificationService = require('../services/notificationService');

// GET /api/users/notifications — list all notifications for current citizen
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await notificationService.listNotifications(req.user.userId);
    res.status(200).json({
      message: 'Notifications retrieved',
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/users/notifications/:id — single notification
router.get('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(Number(req.params.id));
    if (notification.userId !== req.user.userId) {
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
    const notification = await notificationService.markRead(Number(req.params.id), req.user.userId)
    res.status(200).json({ message: 'Notification marked as read', data: notification });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/users/notifications/:id — delete a notification
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    await notificationService.deleteNotification(Number(req.params.id), req.user.userId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.status(200).json({
      message: 'User fetched successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const updatedUser = await userService.updateUserProfile(req.user.userId, {
      firstName,
      lastName,
      phone,
      avatar
    });

    res.status(200).json({
      message: 'User profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    const result = await userService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      message: result.message
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const result = await userService.deleteUserAccount(req.user.userId);

    res.status(200).json({
      message: result.message,
      data: result.user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
