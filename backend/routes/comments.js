const express = require('express');
const router = express.Router();
const commentService = require('../services/commentService');
const authMiddleware = require('../middleware/authMiddleware');

// Create a comment (protected route)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { issueId, text } = req.body;

    if (!issueId || !text) {
      return res.status(400).json({
        error: 'Issue ID and comment text are required'
      });
    }

    const comment = await commentService.createComment(req.user.userId, issueId, text);

    res.status(201).json({
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const comments = await commentService.getCommentsForIssue(req.params.issueId);

    res.status(200).json({
      message: 'Comments fetched successfully',
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single comment
router.get('/:commentId', async (req, res) => {
  try {
    const comment = await commentService.getCommentById(req.params.commentId);

    res.status(200).json({
      message: 'Comment fetched successfully',
      data: comment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a comment (protected route)
router.put('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Comment text is required'
      });
    }

    const existingComment = await commentService.getCommentById(req.params.commentId);

    if (existingComment.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'You do not have permission to update this comment'
      });
    }

    const updatedComment = await commentService.updateComment(req.params.commentId, text);

    res.status(200).json({
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a comment (protected route)
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const existingComment = await commentService.getCommentById(req.params.commentId);

    if (existingComment.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'You do not have permission to delete this comment'
      });
    }

    const deletedComment = await commentService.deleteComment(req.params.commentId);

    res.status(200).json({
      message: 'Comment deleted successfully',
      data: deletedComment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments by user
router.get('/user/:userId', async (req, res) => {
  try {
    const comments = await commentService.getCommentsByUser(req.params.userId);

    res.status(200).json({
      message: 'User comments fetched successfully',
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
