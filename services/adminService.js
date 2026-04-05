const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../db/connection');
const { sendPasswordResetEmail } = require('./emailService');

async function registerAdmin({ email, password, name }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.admin.create({
      data: { email, password: hashed, name: name || null },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { admin, token };
  } catch (e) {
    if (e.code === 'P2002') {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

async function loginAdmin({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...safeAdmin } = admin;
  return { admin: safeAdmin, token };
}

async function getAdminById(id) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!admin) {
    const err = new Error('Admin not found');
    err.status = 404;
    throw err;
  }
  return admin;
}

async function updateAdmin(id, { name, email }) {
  if (!name && !email) {
    const err = new Error('Nothing to update');
    err.status = 400;
    throw err;
  }

  const data = {};
  if (name)  data.name  = name;
  if (email) data.email = email;

  try {
    return await prisma.admin.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });
  } catch (e) {
    if (e.code === 'P2002') {
      const err = new Error('Email already in use');
      err.status = 409;
      throw err;
    }
    if (e.code === 'P2025') {
      const err = new Error('Admin not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

async function deleteAdmin(id) {
  try {
    await prisma.admin.delete({ where: { id } });
  } catch (e) {
    if (e.code === 'P2025') {
      const err = new Error('Admin not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

async function forgotPasswordAdmin({ email }) {
  if (!email) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  // Don't reveal whether email exists
  if (!admin) {
    return { message: 'If this email is registered, a reset token has been sent.' };
  }

  const resetToken       = Math.floor(100000 + Math.random() * 900000).toString();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.admin.update({
    where: { email },
    data: { resetToken, resetTokenExpiry },
  });

  await sendPasswordResetEmail(email, resetToken);

  return { message: 'If this email is registered, a reset token has been sent.' };
}

async function resetPasswordAdmin({ email, token, newPassword }) {
  if (!email || !token || !newPassword) {
    const err = new Error('Email, token, and new password are required');
    err.status = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.resetToken || !admin.resetTokenExpiry) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  if (admin.resetToken !== token) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  if (new Date() > admin.resetTokenExpiry) {
    const err = new Error('Reset token has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.admin.update({
    where: { email },
    data: {
      password:        hashedPassword,
      resetToken:      null,
      resetTokenExpiry: null,
    },
  });

  return { message: 'Password reset successfully' };
}

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  forgotPasswordAdmin,
  resetPasswordAdmin,
};
