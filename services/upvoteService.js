const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');

// Add an upvote to an issue
const addUpvote = async (userId, issueId) => {
  try {
    // Check if issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      throw new Error('Issue not found');
    }

    // Check if user already upvoted this issue
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_issueId: {
          userId,
          issueId
        }
      }
    });

    if (existingUpvote) {
      throw new Error('User has already upvoted this issue');
    }

    // Create upvote
    const upvote = await prisma.upvote.create({
      data: {
        userId,
        issueId
      },
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
    });

    // Increment upvote count on issue
    await prisma.issue.update({
      where: { id: issueId },
      data: { upvoteCount: { increment: 1 } }
    });

    // Notify issue owner when someone else upvotes their issue
    if (String(issue.userId) !== String(userId)) {
      await notificationService.createNotification({
        userId: issue.userId,
        issueId,
        message: `Your issue "${issue.title}" received a new upvote.`,
      });
    }

    return upvote;
  } catch (error) {
    throw new Error(`Failed to add upvote: ${error.message}`);
  }
};

// Remove an upvote from an issue
const removeUpvote = async (userId, issueId) => {
  try {
    // Check if upvote exists
    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_issueId: {
          userId,
          issueId
        }
      }
    });

    if (!upvote) {
      throw new Error('Upvote not found');
    }

    // Delete upvote
    await prisma.upvote.delete({
      where: {
        id: upvote.id
      }
    });

    // Decrement upvote count on issue
    await prisma.issue.update({
      where: { id: issueId },
      data: { upvoteCount: { decrement: 1 } }
    });

    return { message: 'Upvote removed successfully' };
  } catch (error) {
    throw new Error(`Failed to remove upvote: ${error.message}`);
  }
};

// Get all upvotes for an issue
const getUpvotesForIssue = async (issueId) => {
  try {
    const upvotes = await prisma.upvote.findMany({
      where: { issueId },
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
    });

    return upvotes;
  } catch (error) {
    throw new Error(`Failed to fetch upvotes: ${error.message}`);
  }
};

// Check if user has upvoted an issue
const hasUserUpvoted = async (userId, issueId) => {
  try {
    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_issueId: {
          userId,
          issueId
        }
      }
    });

    return !!upvote;
  } catch (error) {
    throw new Error(`Failed to check upvote status: ${error.message}`);
  }
};

// Get issues upvoted by a user
const getIssuesUpvotedByUser = async (userId) => {
  try {
    const upvotes = await prisma.upvote.findMany({
      where: { userId },
      include: {
        issue: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return upvotes.map(upvote => upvote.issue);
  } catch (error) {
    throw new Error(`Failed to fetch upvoted issues: ${error.message}`);
  }
};

module.exports = {
  addUpvote,
  removeUpvote,
  getUpvotesForIssue,
  hasUserUpvoted,
  getIssuesUpvotedByUser
};
