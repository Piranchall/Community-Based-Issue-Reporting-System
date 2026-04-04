/**
 * routes/analytics.js — Workflow 3
 *
 * Public analytics endpoints do not require authentication.
 * Admin-only endpoints require the admin JWT middleware from Workflow 2.
 *
 * Aligned to the Figma wireframes:
 *   User view  — overview, by-category, top-categories, trends, by-area, category-summary
 *   Admin view — all of the above + resolution-time, resolution-time-by-category, export
 *
 * All routes accept query params: dateFrom, dateTo, category, status, area
 */

const express          = require('express');
const router           = express.Router();
const auth             = require('../middleware/AdminauthMiddleware');
const analyticsService = require('../services/analyticsService');

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractFilters(query) {
  const { dateFrom, dateTo, category, status, area } = query;
  const filters = {};
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo)   filters.dateTo   = dateTo;
  if (category) filters.category = category;
  if (status)   filters.status   = status;
  if (area)     filters.area     = area;
  return filters;
}

// ─── GET /api/analytics/overview  (public) ───────────────────────────────────
// Stat cards: Total Issues, Pending, In Progress, Resolved, Rejected, Total Upvotes
// Query params: dateFrom, dateTo, category, status, area

router.get('/overview', async (req, res) => {
  try {
    const data = await analyticsService.getOverview(extractFilters(req.query));
    res.status(200).json({ message: 'Overview statistics retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/by-category  (public) ────────────────────────────────
// Bar chart: issue count per category, sorted by count desc
// Query params: dateFrom, dateTo, status, area

router.get('/by-category', async (req, res) => {
  try {
    const data = await analyticsService.getByCategoryStats(extractFilters(req.query));
    res.status(200).json({ message: 'Category statistics retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/top-categories  (public) ─────────────────────────────
// "Top 5 Issue Categories" ranked list with counts
// Query params: dateFrom, dateTo, status, area, limit (default 5)

router.get('/top-categories', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data  = await analyticsService.getTopCategories(extractFilters(req.query), limit);
    res.status(200).json({ message: 'Top categories retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/by-area  (public) ────────────────────────────────────
// Area bar chart + map bubble data — counts per address/neighbourhood
// Query params: dateFrom, dateTo, category, status

router.get('/by-area', async (req, res) => {
  try {
    const data = await analyticsService.getByAreaStats(extractFilters(req.query));
    res.status(200).json({ message: 'Area statistics retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/trends  (public) ─────────────────────────────────────
// "Issues Over Time" bar/line chart — daily counts over the selected period
// Query params: dateFrom, dateTo, category, status, area

router.get('/trends', async (req, res) => {
  try {
    const data = await analyticsService.getTrendData(extractFilters(req.query));
    res.status(200).json({ message: 'Trend data retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/category-summary  (public) ───────────────────────────
// Powers the "Summary" panel shown in the filtered analytics view (wireframe):
//   Total in Category | % of All Issues | Avg. Resolution Time | Most Affected Area
//   + per-status breakdown (Pending / In Progress / Resolved cards)
//
// REQUIRES: ?category=<value>
// Query params: category (required), dateFrom, dateTo, area

router.get('/category-summary', async (req, res) => {
  try {
    if (!req.query.category) {
      return res.status(400).json({ error: '?category is required for this endpoint' });
    }
    const data = await analyticsService.getCategorySummary(extractFilters(req.query));
    res.status(200).json({ message: 'Category summary retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/resolution-time  (admin only) ────────────────────────
// Overall average resolution time — single stat on admin overview
// Returns: avgResolutionHours, avgResolutionDays, resolvedCount
// Query params: dateFrom, dateTo, category

router.get('/resolution-time', auth, async (req, res) => {
  try {
    const data = await analyticsService.getAvgResolutionTime(extractFilters(req.query));
    res.status(200).json({ message: 'Average resolution time retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/resolution-time-by-category  (admin only) ────────────
// Powers the horizontal bar chart on the admin dashboard (wireframe):
//   Garbage: 4.1d | Water: 1.1d | Road: 3.9d | Electricity: 2.1d
// + overallAvgDays for the "Overall Average" reference line
// Query params: dateFrom, dateTo

router.get('/resolution-time-by-category', auth, async (req, res) => {
  try {
    const data = await analyticsService.getResolutionTimeByCategory(extractFilters(req.query));
    res.status(200).json({ message: 'Resolution time by category retrieved', data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/export  (admin only) ─────────────────────────────────
// Streams a CSV directly — does NOT save a Report record.
// Use POST /api/reports to persist an export.
//
// Query params: dateFrom, dateTo, category, status, area
// Optional: columns=issueId,category,status,reportDate
//   Comma-separated subset matching the wireframe CSV export modal checkboxes:
//     issueId | category | locationArea | status | reportDate | resolutionDate | upvoteCount
//   Omit to include all 7 columns.

router.get('/export', auth, async (req, res) => {
  try {
    const filters = extractFilters(req.query);

    const columns = req.query.columns
      ? req.query.columns.split(',').map((c) => c.trim()).filter(Boolean)
      : analyticsService.ALL_CSV_COLUMNS;

    const csvData  = await analyticsService.generateCsvData(filters, columns);
    const filename = `civicreport_export_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
