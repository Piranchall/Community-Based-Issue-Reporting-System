const express = require('express');
const router = express.Router();
const path   = require('path');
const issueService = require('../services/issueService');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Create a new issue (protected route)
// Accepts multipart/form-data with an optional `image` file field.
// Also still accepts a JSON body with an `image` URL string (for API clients
// that handle their own file hosting).
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;

    // Validation
    if (!title || !description || !category || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Title, description, category, latitude, and longitude are required'
      });
    }

    // Image: prefer the uploaded file path; fall back to URL string from body
    let imageValue = null;
    if (req.file) {
      // Build a relative URL that the frontend can use: /uploads/issues/<filename>
      imageValue = `/uploads/issues/${req.file.filename}`;
    } else if (req.body.image) {
      imageValue = req.body.image;
    }

    const issue = await issueService.createIssue({
      title,
      description,
      category,
      latitude:  parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      image: imageValue,
      userId: req.user.userId
    });

    res.status(201).json({
      message: 'Issue created successfully',
      data: issue
    });
  } catch (error) {
    // Multer errors (file size, wrong type) come through here too
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be 5 MB or smaller' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all issues — supports ?category, ?status, ?userId, ?area, ?sortBy=upvoteCount|priority
router.get('/', async (req, res) => {
  try {
    const { category, status, userId, area, sortBy } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (status)   filters.status   = status;
    if (userId)   filters.userId   = userId;
    if (area)     filters.area     = area;
    if (sortBy)   filters.sortBy   = sortBy; // 'upvoteCount' | 'createdAt'

    const issues = await issueService.getAllIssues(filters);

    res.status(200).json({
      message: 'Issues fetched successfully',
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get nearby issues (must be BEFORE /:issueId route)
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    const radiusInKm = radius || 5;
    const issues = await issueService.getNearbyIssues(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radiusInKm)
    );

    res.status(200).json({
      message: 'Nearby issues fetched successfully',
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single issue by ID
router.get('/:issueId', async (req, res) => {
  try {
    const issue = await issueService.getIssueById(req.params.issueId);

    res.status(200).json({
      message: 'Issue fetched successfully',
      data: issue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an issue (protected route)
router.put('/:issueId', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, status, latitude, longitude, address, image } = req.body;

    // Get the issue to check ownership
    const existingIssue = await issueService.getIssueById(req.params.issueId);

    if (existingIssue.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'You do not have permission to update this issue'
      });
    }

    const updatedIssue = await issueService.updateIssue(req.params.issueId, {
      title,
      description,
      category,
      status,
      latitude,
      longitude,
      address,
      image
    });

    res.status(200).json({
      message: 'Issue updated successfully',
      data: updatedIssue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an issue (protected route)
router.delete('/:issueId', authMiddleware, async (req, res) => {
  try {
    // Get the issue to check ownership
    const existingIssue = await issueService.getIssueById(req.params.issueId);

    if (existingIssue.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'You do not have permission to delete this issue'
      });
    }

    const deletedIssue = await issueService.deleteIssue(req.params.issueId);

    res.status(200).json({
      message: 'Issue deleted successfully',
      data: deletedIssue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
