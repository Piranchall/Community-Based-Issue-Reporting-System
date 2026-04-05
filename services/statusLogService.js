const prisma = require('../db/connection');

async function createStatusLog({ issueId, adminId, oldStatus, newStatus, remarks }) {
  if (!issueId || !adminId || !newStatus) {
    const err = new Error('issueId, adminId, and newStatus are required');
    err.status = 400;
    throw err;
  }

  return prisma.statusLog.create({
    data: {
      issueId,
      adminId,
      oldStatus: oldStatus || null,
      newStatus,
      remarks: remarks || null,
    },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });
}

async function getStatusLogsByIssue(issueId) {
  return prisma.statusLog.findMany({
    where: { issueId },
    orderBy: { changedAt: 'desc' },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });
}

async function getStatusLogById(id) {
  const log = await prisma.statusLog.findUnique({
    where: { id: Number(id) },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });
  if (!log) {
    const err = new Error('Status log not found');
    err.status = 404;
    throw err;
  }
  return log;
}

async function updateStatusLogRemarks(id, adminId, remarks) {
  if (remarks === undefined || remarks === null) {
    const err = new Error('remarks field is required');
    err.status = 400;
    throw err;
  }

  try {
    const log = await prisma.statusLog.findUnique({ where: { id: Number(id) } });
    if (!log) {
      const err = new Error('Status log not found');
      err.status = 404;
      throw err;
    }
    if (log.adminId !== adminId) {
      const err = new Error('You are not the author of this log entry');
      err.status = 403;
      throw err;
    }

    return prisma.statusLog.update({
      where: { id: Number(id) },
      data: { remarks },
      include: { admin: { select: { id: true, name: true, email: true } } },
    });
  } catch (e) {
    if (e.code === 'P2025') {
      const err = new Error('Status log not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

async function deleteStatusLog(id, adminId) {
  const log = await prisma.statusLog.findUnique({ where: { id: Number(id) } });
  if (!log) {
    const err = new Error('Status log not found');
    err.status = 404;
    throw err;
  }
  if (log.adminId !== adminId) {
    const err = new Error('You are not the author of this log entry');
    err.status = 403;
    throw err;
  }

  await prisma.statusLog.delete({ where: { id: Number(id) } });
}

module.exports = {
  createStatusLog,
  getStatusLogsByIssue,
  getStatusLogById,
  updateStatusLogRemarks,
  deleteStatusLog,
};
