const prisma = require('../db/connection');
const statusLogService = require('./statusLogService');
const notificationService = require('./notificationService');

const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

async function listIssues({ category, status, dateFrom, dateTo, area, sortBy } = {}) {
  const where = {};

  if (category) where.category = category;
  if (status)   where.status   = status;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo);
  }

  // Area/location filter — case-insensitive partial match on address field
  if (area) {
    where.address = { contains: area, mode: 'insensitive' };
  }

  // sortBy: 'upvoteCount' (priority) | 'createdAt' (default) | 'status'
  let orderBy;
  if (sortBy === 'upvoteCount') {
    orderBy = [{ upvoteCount: 'desc' }, { createdAt: 'desc' }];
  } else if (sortBy === 'status') {
    orderBy = [{ status: 'asc' }, { createdAt: 'desc' }];
  } else {
    orderBy = { createdAt: 'desc' };
  }

  return prisma.issue.findMany({
    where,
    orderBy,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
}

async function getIssueById(id) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      statusLogs: {
        orderBy: { changedAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!issue) {
    const err = new Error('Issue not found');
    err.status = 404;
    throw err;
  }
  return issue;
}

async function updateIssueStatus(issueId, { newStatus, remarks, adminId }) {
  if (!newStatus) {
    const err = new Error('newStatus is required');
    err.status = 400;
    throw err;
  }
  if (!VALID_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    const err = new Error('Issue not found');
    err.status = 404;
    throw err;
  }

  const oldStatus = issue.status;

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: { status: newStatus },
    select: { id: true, title: true, status: true, userId: true, updatedAt: true },
  });

  // Record the status change
  await statusLogService.createStatusLog({
    issueId,
    adminId,
    oldStatus,
    newStatus,
    remarks: remarks || null,
  });

  // Notify the original reporter
  await notificationService.createNotification({
    userId: issue.userId,
    issueId,
    message: `Your issue "${issue.title}" status changed from "${oldStatus}" to "${newStatus}".${remarks ? ` Remarks: ${remarks}` : ''}`,
  });

  // Notify users who upvoted (excluding the reporter)
  const upvoters = await prisma.upvote.findMany({
    where: { issueId, NOT: { userId: issue.userId } },
    select: { userId: true },
  });

  for (const { userId } of upvoters) {
    await notificationService.createNotification({
      userId,
      issueId,
      message: `An issue you upvoted ("${issue.title}") has been updated to "${newStatus}".`,
    });
  }

  return updated;
}

async function deleteIssue(id) {
  try {
    await prisma.issue.delete({ where: { id } });
  } catch (e) {
    if (e.code === 'P2025') {
      const err = new Error('Issue not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

module.exports = { listIssues, getIssueById, updateIssueStatus, deleteIssue };
