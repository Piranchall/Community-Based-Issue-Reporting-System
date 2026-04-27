const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');

// Create a new issue
const createIssue = async (data) => {
  try {
    const issue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        image: data.image,
        userId: data.userId,
        status: 'Pending'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        upvotes: true,
        comments: true
      }
    });
    // Notify all admins about the new issue
    try {
      const admins = await prisma.admin.findMany({ select: { id: true } });
      const reporter = issue.user
        ? `${issue.user.firstName || ''} ${issue.user.lastName || ''}`.trim() || issue.user.email
        : 'A citizen';
      await Promise.all(admins.map(admin =>
        notificationService.createNotification({
          userId: String(admin.id),
          issueId: issue.id,
          message: `New issue reported: "${issue.title}" in ${issue.address || 'Unknown area'} by ${reporter}.`,
        })
      ));
    } catch (notifErr) {
      // Non-fatal — issue is already created, just log
      console.error('Failed to notify admins:', notifErr.message);
    }

    return issue;
  } catch (error) {
    throw new Error(`Failed to create issue: ${error.message}`);
  }
};

// Get all issues with optional filters and sort
const getAllIssues = async (filters = {}) => {
  try {
    const where = {};

    if (filters.category) where.category = filters.category;
    if (filters.status)   where.status   = filters.status;
    if (filters.userId)   where.userId   = filters.userId;

    if (filters.area) {
      where.address = { contains: filters.area, mode: 'insensitive' };
    }

    // For priority sort we fetch all matching issues first, then
    // compute the score in JS and sort — same pattern as getNearbyIssues
    if (filters.sortBy === 'priority') {
      const issues = await prisma.issue.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatar: true }
          },
          upvotes: true,
          comments: true
        }
      });

      // Density radius — issues within 1 km count toward location density
      const DENSITY_RADIUS_KM = 1;
      const DENSITY_WEIGHT    = 2; // each nearby issue = 2 extra priority points

      const scored = issues.map(issue => {
        const nearbyCount = issues.filter(other =>
          other.id !== issue.id &&
          haversineDistance(issue.latitude, issue.longitude, other.latitude, other.longitude)
            <= DENSITY_RADIUS_KM
        ).length;

        return {
          ...issue,
          nearbyIssueCount: nearbyCount,
          priorityScore: issue.upvoteCount + (nearbyCount * DENSITY_WEIGHT)
        };
      });

      // Sort highest priority first
      scored.sort((a, b) => b.priorityScore - a.priorityScore);
      return scored;
    }

    // Standard sorts
    const orderBy =
      filters.sortBy === 'upvoteCount'
        ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    const issues = await prisma.issue.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatar: true }
        },
        upvotes: true,
        comments: true
      },
      orderBy
    });

    return issues;
  } catch (error) {
    throw new Error(`Failed to fetch issues: ${error.message}`);
  }
};

// Get a single issue by ID
const getIssueById = async (issueId) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        upvotes: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!issue) {
      const err = new Error('Issue not found');
      err.status = 404;
      throw err;
    }

    return issue;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(`Failed to fetch issue: ${error.message}`);
  }
};

// Update an issue
const updateIssue = async (issueId, data) => {
  try {
    const updateData = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.status) updateData.status = data.status;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.address) updateData.address = data.address;
    if (data.image) updateData.image = data.image;

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        upvotes: true,
        comments: true
      }
    });

    return issue;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Issue not found');
    }
    throw new Error(`Failed to update issue: ${error.message}`);
  }
};

// Delete an issue
const deleteIssue = async (issueId) => {
  try {
    const issue = await prisma.issue.delete({
      where: { id: issueId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    return issue;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Issue not found');
    }
    throw new Error(`Failed to delete issue: ${error.message}`);
  }
};

// Get nearby issues (within a radius) using simple distance calculation
const getNearbyIssues = async (latitude, longitude, radiusInKm = 5) => {
  try {
    // Get all issues from database
    const allIssues = await prisma.issue.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        upvotes: true,
        comments: true
      }
    });

    // Haversine distance formula (in JavaScript)
    const haversineDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Filter issues by distance
    const nearbyIssues = allIssues
      .map(issue => ({
        ...issue,
        distance: haversineDistance(latitude, longitude, issue.latitude, issue.longitude)
      }))
      .filter(issue => issue.distance <= radiusInKm)
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...issue }) => issue); // Remove distance from final result

    return nearbyIssues;
  } catch (error) {
    throw new Error(`Failed to fetch nearby issues: ${error.message}`);
  }
};

// Haversine distance — reused for priority density calculation
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getNearbyIssues
};