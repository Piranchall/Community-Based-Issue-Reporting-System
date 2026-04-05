const express = require('express');
const router = express.Router();
const upvoteService = require('../services/upvoteService');
const authMiddleware = require('../middleware/authMiddleware');

// Add upvote (protected route)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({
        error: 'Issue ID is required'
      });
    }

    const upvote = await upvoteService.addUpvote(req.user.userId, issueId);

    res.status(201).json({
      message: 'Upvote added successfully',
      data: upvote
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get upvotes for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const upvotes = await upvoteService.getUpvotesForIssue(req.params.issueId);

    res.status(200).json({
      message: 'Upvotes fetched successfully',
      count: upvotes.length,
      data: upvotes
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check if user has upvoted
router.get('/check/:issueId', authMiddleware, async (req, res) => {
  try {
    const hasUpvoted = await upvoteService.hasUserUpvoted(req.user.userId, req.params.issueId);

    res.status(200).json({
      message: 'Upvote status fetched successfully',
      data: { hasUpvoted }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get issues upvoted by current user
router.get('/user/my-upvotes', authMiddleware, async (req, res) => {
  try {
    const issues = await upvoteService.getIssuesUpvotedByUser(req.user.userId);

    res.status(200).json({
      message: 'Upvoted issues fetched successfully',
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove upvote (protected route)
router.delete('/:issueId', authMiddleware, async (req, res) => {
  try {
    const result = await upvoteService.removeUpvote(req.user.userId, req.params.issueId);

    res.status(200).json({
      message: result.message
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
