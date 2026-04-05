const express = require('express');
const router = express.Router();
const auth = require('../middleware/AdminauthMiddleware');
const statusLogService = require('../services/statusLogService');

router.post('/', auth, async (req, res) => {
  try {
    const { issueId, oldStatus, newStatus, remarks } = req.body;
    const log = await statusLogService.createStatusLog({ issueId, adminId: req.admin.id, oldStatus, newStatus, remarks });
    res.status(201).json({ message: 'Status log created', data: log });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.get('/issue/:issueId', auth, async (req, res) => {
  try {
    const logs = await statusLogService.getStatusLogsByIssue(req.params.issueId);
    res.status(200).json({ message: 'Status logs retrieved', data: logs });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const log = await statusLogService.getStatusLogById(req.params.id);
    res.status(200).json({ message: 'Status log retrieved', data: log });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const log = await statusLogService.updateStatusLogRemarks(req.params.id, req.admin.id, req.body.remarks);
    res.status(200).json({ message: 'Remarks updated', data: log });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await statusLogService.deleteStatusLog(req.params.id, req.admin.id);
    res.status(200).json({ message: 'Status log deleted successfully' });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

module.exports = router;
