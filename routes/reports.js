/**
 * routes/reports.js — Workflow 3
 *
 * Full CRUD for the `Report` entity (admin-only).
 * A Report is a saved analytics export: it stores the filter config and
 * the generated CSV content at the time of creation.
 *
 * All routes require admin JWT authentication (WF2 authMiddleware).
 */

const express       = require('express');
const router        = express.Router();
const auth          = require('../middleware/AdminauthMiddleware'); // WF2 admin middleware
const reportService = require('../services/reportService');

// Apply admin auth middleware to ALL report routes
router.use(auth);

// ─── POST /api/reports  (CREATE) ─────────────────────────────────────────────
// Generates a CSV from the given filters and saves it as a Report.
//
// Request body:
//   {
//     "title":   "April Garbage Issues",
//     "filters": {
//       "dateFrom": "2026-04-01",
//       "dateTo":   "2026-04-30",
//       "category": "Garbage",
//       "status":   "Resolved",
//       "area":     "Downtown"
//     }
//   }
//
// Response: saved Report record (without csvData — fetch by ID to get it)

router.post('/', async (req, res) => {
  try {
    const { title, filters } = req.body;
    const report = await reportService.createReport(req.admin.id, { title, filters });
    res.status(201).json({ message: 'Report created successfully', data: report });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/reports  (LIST) ─────────────────────────────────────────────────
// Returns all reports created by the authenticated admin.
// Note: csvData is excluded from the list for performance.
//       Retrieve a single report to access its CSV content.

router.get('/', async (req, res) => {
  try {
    const reports = await reportService.listReports(req.admin.id);
    res.status(200).json({
      message: 'Reports retrieved',
      count:   reports.length,
      data:    reports,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/reports/:id  (READ single) ─────────────────────────────────────
// Returns a single report including its stored csvData.

router.get('/:id', async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id, req.admin.id);
    res.status(200).json({ message: 'Report retrieved', data: report });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/reports/:id/download  (download CSV) ───────────────────────────
// Returns the stored CSV content as a file download attachment.

router.get('/:id/download', async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id, req.admin.id);

    if (!report.csvData) {
      return res.status(404).json({ error: 'This report has no CSV data' });
    }

    const filename = `report_${report.id}_${report.title.replace(/\s+/g, '_')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(report.csvData);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── PUT /api/reports/:id  (UPDATE) ──────────────────────────────────────────
// Update title, filters, and/or regenerate CSV with current data.
//
// Request body:
//   {
//     "title":      "Updated Title",         (optional)
//     "filters":    { "category": "Road" },  (optional)
//     "regenerate": true                     (optional — re-runs CSV generation)
//   }

router.put('/:id', async (req, res) => {
  try {
    const { title, filters, regenerate } = req.body;
    const updated = await reportService.updateReport(
      req.params.id,
      req.admin.id,
      { title, filters, regenerate }
    );
    res.status(200).json({ message: 'Report updated successfully', data: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── DELETE /api/reports/:id  (DELETE) ───────────────────────────────────────
// Permanently deletes a saved report (must be owner).

router.delete('/:id', async (req, res) => {
  try {
    await reportService.deleteReport(req.params.id, req.admin.id);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
