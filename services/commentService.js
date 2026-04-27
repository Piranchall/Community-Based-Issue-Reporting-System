const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');

// Create a comment on an issue
const createComment = async (userId, issueId, text) => {
  try {
    // Check if issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      throw new Error('Issue not found');
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        userId,
        issueId
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
        }
      }
    });

    // Notify issue owner when someone else comments on their issue
    if (String(issue.userId) !== String(userId)) {
      await notificationService.createNotification({
        userId: issue.userId,
        issueId,
        message: `New comment on your issue "${issue.title}": ${text}`,
      });
    }

    return comment;
  } catch (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }
};

// Get all comments for an issue
const getCommentsForIssue = async (issueId) => {
  try {
    const comments = await prisma.comment.findMany({
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

    return comments;
  } catch (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }
};

// Get a single comment by ID
const getCommentById = async (commentId) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
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

    if (!comment) {
      throw new Error('Comment not found');
    }

    return comment;
  } catch (error) {
    throw new Error(`Failed to fetch comment: ${error.message}`);
  }
};

// Update a comment
const updateComment = async (commentId, text) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
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

    return comment;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Comment not found');
    }
    throw new Error(`Failed to update comment: ${error.message}`);
  }
};

// Delete a comment
const deleteComment = async (commentId) => {
  try {
    const comment = await prisma.comment.delete({
      where: { id: commentId },
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

    return comment;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Comment not found');
    }
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
};

// Get comments by user
const getCommentsByUser = async (userId) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { userId },
      include: {
        issue: {
          select: {
            id: true,
            title: true
          }
        },
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

    return comments;
  } catch (error) {
    throw new Error(`Failed to fetch user comments: ${error.message}`);
  }
};

module.exports = {
  createComment,
  getCommentsForIssue,
  getCommentById,
  updateComment,
  deleteComment,
  getCommentsByUser
};
