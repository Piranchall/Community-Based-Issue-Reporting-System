const express = require('express');
const router = express.Router();
const auth = require('../middleware/AdminauthMiddleware');
const adminService = require('../services/adminService');

// POST /api/admin/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = await adminService.registerAdmin({ email, password, name });
    res.status(201).json({ message: 'Admin registered successfully', data: result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await adminService.loginAdmin({ email, password });
    res.status(200).json({ message: 'Login successful', data: result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/admin/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.admin.id);
    res.status(200).json({ message: 'Profile retrieved', data: admin });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/admin/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await adminService.updateAdmin(req.admin.id, { name, email });
    res.status(200).json({ message: 'Profile updated', data: admin });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/admin/account
router.delete('/account', auth, async (req, res) => {
  try {
    await adminService.deleteAdmin(req.admin.id);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
