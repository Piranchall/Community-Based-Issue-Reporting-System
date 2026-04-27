const prisma = require('../db/connection');
const statusLogService = require('./statusLogService');
const notificationService = require('./notificationService');

const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const NOTIFIABLE_STATUSES = new Set(['In Progress', 'Resolved', 'Rejected']);

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

  // sortBy: 'priority' | 'upvoteCount' | 'status' | 'createdAt' (default)
  if (sortBy === 'priority') {
    const issues = await prisma.issue.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    const DENSITY_RADIUS_KM = 1;
    const DENSITY_WEIGHT    = 2;

    const scored = issues.map(issue => {
      const nearbyCount = issues.filter(other =>
        other.id !== issue.id &&
        haversineDistance(issue.latitude, issue.longitude, other.latitude, other.longitude)
          <= DENSITY_RADIUS_KM
      ).length;

      return {
        ...issue,
        nearbyIssueCount: nearbyCount,
        priorityScore: issue.upvoteCount + (nearbyCount * DENSITY_WEIGHT),
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    return scored;
  }

  let orderBy;
  if (sortBy === 'upvoteCount') {
    orderBy = [{ upvoteCount: 'desc' }, { createdAt: 'desc' }];
  } else if (sortBy === 'status') {
    orderBy = [{ status: 'asc' }, { createdAt: 'desc' }];
  } else {
    orderBy = { createdAt: 'desc' };
  }

  // For non-priority sorts, still compute priorityScore so the column always shows
  const issues = await prisma.issue.findMany({
    where,
    orderBy,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  const DENSITY_RADIUS_KM = 1;
  const DENSITY_WEIGHT    = 2;

  return issues.map(issue => {
    const nearbyCount = issues.filter(other =>
      other.id !== issue.id &&
      haversineDistance(issue.latitude, issue.longitude, other.latitude, other.longitude)
        <= DENSITY_RADIUS_KM
    ).length;
    return {
      ...issue,
      nearbyIssueCount: nearbyCount,
      priorityScore: issue.upvoteCount + (nearbyCount * DENSITY_WEIGHT),
    };
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

  if (NOTIFIABLE_STATUSES.has(newStatus)) {
    // Notify the original reporter for key lifecycle changes.
    await notificationService.createNotification({
      userId: issue.userId,
      issueId,
      message: `Your issue "${issue.title}" status changed from "${oldStatus}" to "${newStatus}".${remarks ? ` Remarks: ${remarks}` : ''}`,
    });

    // Notify users who upvoted (excluding the reporter).
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


// Haversine distance in km — for priority density calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { listIssues, getIssueById, updateIssueStatus, deleteIssue };