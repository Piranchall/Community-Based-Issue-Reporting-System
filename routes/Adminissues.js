const express = require('express');
const router = express.Router();
const auth = require('../middleware/AdminauthMiddleware');
const issueService = require('../services/AdminissueService');

// GET /api/issues  — filter by: category, status, area, dateFrom, dateTo
//                   sort by: sortBy=upvoteCount | status | createdAt (default)
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, dateFrom, dateTo, area, sortBy } = req.query;
    const issues = await issueService.listIssues({ category, status, dateFrom, dateTo, area, sortBy });
    res.status(200).json({ message: 'Issues retrieved', count: issues.length, data: issues });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/issues/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const issue = await issueService.getIssueById(req.params.id);
    res.status(200).json({ message: 'Issue retrieved', data: issue });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/issues/:id  — update status + add remarks
router.put('/:id', auth, async (req, res) => {
  try {
    const { newStatus, remarks } = req.body;
    const updated = await issueService.updateIssueStatus(req.params.id, {
      newStatus,
      remarks,
      adminId: req.admin.id,
    });
    res.status(200).json({ message: 'Issue status updated', data: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/issues/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await issueService.deleteIssue(req.params.id);
    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
