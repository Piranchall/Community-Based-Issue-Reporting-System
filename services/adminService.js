const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/connection');

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
  if (name)  data.name = name;
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

module.exports = { registerAdmin, loginAdmin, getAdminById, updateAdmin, deleteAdmin };
