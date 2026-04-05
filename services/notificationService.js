const prisma = require('../db/connection');

async function createNotification({ userId, issueId, message }) {
  return prisma.notification.create({
    data: { userId, issueId: issueId || null, message },
  });
}

async function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function getNotificationById(id) {
  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
  });
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  return notification;
}

async function markRead(id, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
  });
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  return prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  });
}

async function deleteNotification(id, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
  });
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  await prisma.notification.delete({ where: { id: Number(id) } });
}

module.exports = {
  createNotification,
  listNotifications,
  getNotificationById,
  markRead,
  deleteNotification,
};
