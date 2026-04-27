const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/connection');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const isEmail = String(identifier).includes('@');
    const candidates = [];

    if (isEmail) {
      const [admin, user] = await Promise.all([
        prisma.admin.findUnique({ where: { email: identifier } }),
        prisma.user.findUnique({ where: { email: identifier } }),
      ]);

      // Prefer admin when both exist and password matches.
      if (admin) candidates.push({ type: 'admin', data: admin });
      if (user) candidates.push({ type: 'user', data: user });
    } else {
      const user = await prisma.user.findUnique({ where: { phone: identifier } });
      if (user) candidates.push({ type: 'user', data: user });
    }

    for (const candidate of candidates) {
      const valid = await bcrypt.compare(password, candidate.data.password);
      if (!valid) continue;

      if (candidate.type === 'admin') {
        const admin = candidate.data;
        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: admin.role || 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          data: {
            role: 'admin',
            token,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
            },
          },
        });
      }

      const user = candidate.data;
      const token = jwt.sign(
        { userId: user.id, id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        data: {
          role: 'user',
          token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
        },
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

module.exports = router;
