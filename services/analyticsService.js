/**
 * analyticsService.js — Workflow 3
 *
 * All read-only aggregation queries for the analytics dashboard.
 * Uses the shared Prisma singleton from db/connection.js (WF2 pattern).
 */

const prisma = require('../db/connection');

// ─── Helper: build a shared `where` clause from common filter params ──────────

function buildIssueWhere({ dateFrom, dateTo, category, status, area } = {}) {
  const where = {};

  if (category) where.category = category;
  if (status)   where.status   = status;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo);
  }

  // Area filter: match against the `address` field (case-insensitive contains)
  if (area) {
    where.address = { contains: area, mode: 'insensitive' };
  }

  return where;
}

// ─── 1. Overview Statistics ───────────────────────────────────────────────────

/**
 * Returns high-level counts: total issues, breakdown by status, total upvotes.
 * Accessible by both authenticated users and public (no auth required on route).
 */
async function getOverview(filters = {}) {
  const where = buildIssueWhere(filters);

  const [total, byStatus, upvoteAggregate] = await Promise.all([
    // Total issue count
    prisma.issue.count({ where }),

    // Count per status value
    prisma.issue.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),

    // Sum of all upvoteCounts
    prisma.issue.aggregate({
      where,
      _sum: { upvoteCount: true },
    }),
  ]);

  // Normalise the groupBy result into a flat object: { Pending: N, ... }
  const statusBreakdown = {};
  for (const row of byStatus) {
    statusBreakdown[row.status] = row._count._all;
  }

  return {
    totalIssues:  total,
    byStatus:     statusBreakdown,
    totalUpvotes: upvoteAggregate._sum.upvoteCount ?? 0,
  };
}

// ─── 2. Issues by Category (bar chart data) ───────────────────────────────────

/**
 * Returns issue count grouped by category — used to render bar charts.
 */
async function getByCategoryStats(filters = {}) {
  const where = buildIssueWhere(filters);

  const rows = await prisma.issue.groupBy({
    by: ['category'],
    where,
    _count: { _all: true },
    orderBy: { _count: { category: 'desc' } },
  });

  return rows.map((r) => ({
    category: r.category,
    count:    r._count._all,
  }));
}

// ─── 3. Top N Categories ──────────────────────────────────────────────────────

/**
 * Returns the top `limit` most-reported categories (default: 5).
 */
async function getTopCategories(filters = {}, limit = 5) {
  const stats = await getByCategoryStats(filters);
  return stats.slice(0, limit);
}

// ─── 4. Issues by Area / Neighbourhood ───────────────────────────────────────

/**
 * Groups issues by their `address` field and returns a count per unique value.
 * Null/empty addresses are grouped under "Unknown".
 */
async function getByAreaStats(filters = {}) {
  const where = buildIssueWhere(filters);

  // Group by address for counts
  const rows = await prisma.issue.groupBy({
    by: ['address'],
    where,
    _count: { _all: true },
    orderBy: { _count: { address: 'desc' } },
  });

  // Get avg lat/lng per area so the frontend can project geographically
  const coordRows = await prisma.issue.groupBy({
    by: ['address'],
    where,
    _avg: { latitude: true, longitude: true },
  });

  const coordMap = {};
  for (const r of coordRows) {
    coordMap[r.address ?? 'Unknown'] = {
      lat: r._avg.latitude,
      lng: r._avg.longitude,
    };
  }

  return rows.map((r) => {
    const area = r.address ?? 'Unknown';
    const coords = coordMap[area] || {};
    return {
      area,
      count: r._count._all,
      lat: coords.lat ?? null,
      lng: coords.lng ?? null,
    };
  });
}

// ─── 5. Trend Line — Issues Reported Over Time ────────────────────────────────

/**
 * Returns a daily count of issues created within the given date range.
 * Prisma does not natively support DATE truncation in groupBy, so we
 * fetch the raw `createdAt` timestamps and aggregate in JavaScript.
 */
async function getTrendData(filters = {}) {
  const where = buildIssueWhere(filters);

  const issues = await prisma.issue.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Bucket by calendar date (YYYY-MM-DD)
  const dailyCounts = {};
  for (const { createdAt } of issues) {
    const dateKey = createdAt.toISOString().slice(0, 10);
    dailyCounts[dateKey] = (dailyCounts[dateKey] ?? 0) + 1;
  }

  return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
}

// ─── 6. Average Resolution Time — overall (Admin-only) ───────────────────────

/**
 * Calculates the average time (in hours) between issue creation and resolution
 * for issues matching the supplied filters.
 */
async function getAvgResolutionTime(filters = {}) {
  const { dateFrom, dateTo, category } = filters;

  const issueFilter = {};
  if (category) issueFilter.category = category;
  if (dateFrom || dateTo) {
    issueFilter.createdAt = {};
    if (dateFrom) issueFilter.createdAt.gte = new Date(dateFrom);
    if (dateTo)   issueFilter.createdAt.lte = new Date(dateTo);
  }

  const resolutionLogs = await prisma.statusLog.findMany({
    where: {
      newStatus: 'Resolved',
      issue: Object.keys(issueFilter).length ? issueFilter : undefined,
    },
    select: {
      changedAt: true,
      issue: { select: { createdAt: true } },
    },
  });

  if (resolutionLogs.length === 0) {
    return { avgResolutionHours: null, avgResolutionDays: null, resolvedCount: 0 };
  }

  const totalMs = resolutionLogs.reduce(
    (sum, log) => sum + (log.changedAt.getTime() - log.issue.createdAt.getTime()),
    0
  );

  const avgHours = totalMs / resolutionLogs.length / (1000 * 60 * 60);
  const avgDays  = avgHours / 24;

  return {
    avgResolutionHours: Math.round(avgHours * 100) / 100,
    avgResolutionDays:  Math.round(avgDays  * 100) / 100,
    resolvedCount:      resolutionLogs.length,
  };
}

// ─── 7. Average Resolution Time per Category (Admin-only) ────────────────────

/**
 * Returns the average resolution time broken down BY category — used to render
 * the horizontal bar chart on the admin analytics dashboard.
 *
 * Also computes the overall average so the frontend can draw the "Overall Average"
 * reference line shown in the wireframe.
 */
async function getResolutionTimeByCategory(filters = {}) {
  const { dateFrom, dateTo } = filters;

  const issueFilter = {};
  if (dateFrom || dateTo) {
    issueFilter.createdAt = {};
    if (dateFrom) issueFilter.createdAt.gte = new Date(dateFrom);
    if (dateTo)   issueFilter.createdAt.lte = new Date(dateTo);
  }

  const resolutionLogs = await prisma.statusLog.findMany({
    where: {
      newStatus: 'Resolved',
      issue: Object.keys(issueFilter).length ? issueFilter : undefined,
    },
    select: {
      changedAt: true,
      issue: { select: { createdAt: true, category: true } },
    },
  });

  if (resolutionLogs.length === 0) {
    return { byCategory: [], overallAvgDays: null };
  }

  // Group resolution times by category
  const categoryBuckets = {};
  let totalMs = 0;

  for (const log of resolutionLogs) {
    const cat = log.issue.category;
    const ms  = log.changedAt.getTime() - log.issue.createdAt.getTime();
    totalMs  += ms;

    if (!categoryBuckets[cat]) categoryBuckets[cat] = { totalMs: 0, count: 0 };
    categoryBuckets[cat].totalMs += ms;
    categoryBuckets[cat].count   += 1;
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const byCategory = Object.entries(categoryBuckets)
    .map(([category, { totalMs: catMs, count }]) => ({
      category,
      avgResolutionDays: Math.round((catMs / count / MS_PER_DAY) * 100) / 100,
      resolvedCount:     count,
    }))
    .sort((a, b) => b.avgResolutionDays - a.avgResolutionDays); // longest first

  const overallAvgDays =
    Math.round((totalMs / resolutionLogs.length / MS_PER_DAY) * 100) / 100;

  return { byCategory, overallAvgDays };
}

// ─── 8. Category Summary Panel ────────────────────────────────────────────────

/**
 * Returns the "Summary" data shown in the filtered analytics panel (wireframe).
 * Requires `filters.category` to be set.
 *
 * Returns:
 *   - totalInCategory      — count of issues in this category (with date/area filters)
 *   - percentOfAllIssues   — that count as a % of ALL issues (same date/area filters, no category)
 *   - avgResolutionDays    — average resolution time for this category
 *   - mostAffectedArea     — address with the highest issue count in this category
 *   - byStatus             — status breakdown for this category
 */
async function getCategorySummary(filters = {}) {
  if (!filters.category) {
    const err = new Error('category filter is required for category summary');
    err.status = 400;
    throw err;
  }

  const categoryWhere = buildIssueWhere(filters);

  // All-issues where (same date/area but NO category restriction — for % calc)
  const { category: _removed, ...filtersWithoutCategory } = filters;
  const allWhere = buildIssueWhere(filtersWithoutCategory);

  const [categoryTotal, allTotal, byStatusRows, areaRows, resolutionTime] =
    await Promise.all([
      prisma.issue.count({ where: categoryWhere }),
      prisma.issue.count({ where: allWhere }),

      prisma.issue.groupBy({
        by: ['status'],
        where: categoryWhere,
        _count: { _all: true },
      }),

      prisma.issue.groupBy({
        by: ['address'],
        where: categoryWhere,
        _count: { _all: true },
        orderBy: { _count: { address: 'desc' } },
        take: 1,
      }),

      getAvgResolutionTime(filters),
    ]);

  const statusBreakdown = {};
  for (const row of byStatusRows) {
    statusBreakdown[row.status] = row._count._all;
  }

  const mostAffectedArea =
    areaRows.length > 0 ? (areaRows[0].address ?? 'Unknown') : null;

  const percentOfAllIssues =
    allTotal > 0 ? Math.round((categoryTotal / allTotal) * 1000) / 10 : 0; // 1 dp

  return {
    category:            filters.category,
    totalInCategory:     categoryTotal,
    percentOfAllIssues,
    avgResolutionDays:   resolutionTime.avgResolutionDays,
    mostAffectedArea,
    byStatus:            statusBreakdown,
  };
}

// ─── 9. CSV Data Generator (with optional column selection) ───────────────────

/**
 * All available columns — matches the checkboxes shown in the CSV Export modal
 * in the wireframe.
 */
const ALL_CSV_COLUMNS = [
  'issueId',
  'category',
  'locationArea',
  'status',
  'reportDate',
  'resolutionDate',
  'upvoteCount',
];

/**
 * Builds a CSV string for all issues matching `filters`.
 *
 * @param {object} filters  - standard filter params
 * @param {string[]} columns - subset of ALL_CSV_COLUMNS to include.
 *                             Defaults to all columns if omitted.
 *
 * Column keys map to the wireframe checkbox labels:
 *   issueId        → "Issue ID"
 *   category       → "Category"
 *   locationArea   → "Location / Area"
 *   status         → "Status"
 *   reportDate     → "Report Date"
 *   resolutionDate → "Resolution Date"
 *   upvoteCount    → "Upvote Count"
 */
async function generateCsvData(filters = {}, columns = ALL_CSV_COLUMNS) {
  // Validate requested columns
  const invalidCols = columns.filter((c) => !ALL_CSV_COLUMNS.includes(c));
  if (invalidCols.length > 0) {
    const err = new Error(`Invalid column(s): ${invalidCols.join(', ')}. Valid: ${ALL_CSV_COLUMNS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const colSet = new Set(columns);
  const where  = buildIssueWhere(filters);

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      category:    true,
      address:     true,
      status:      true,
      upvoteCount: true,
      createdAt:   true,
      // Only fetch statusLogs if resolutionDate is requested (avoids extra JOIN)
      ...(colSet.has('resolutionDate') && {
        statusLogs: {
          where:   { newStatus: 'Resolved' },
          orderBy: { changedAt: 'desc' },
          take:    1,
          select:  { changedAt: true },
        },
      }),
    },
  });

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Column label map
  const LABELS = {
    issueId:        'Issue ID',
    category:       'Category',
    locationArea:   'Location / Area',
    status:         'Status',
    reportDate:     'Report Date',
    resolutionDate: 'Resolution Date',
    upvoteCount:    'Upvote Count',
  };

  // Build header using only the requested columns, preserving original order
  const orderedCols = ALL_CSV_COLUMNS.filter((c) => colSet.has(c));
  const header      = orderedCols.map((c) => LABELS[c]).join(',');

  const rows = issues.map((issue) => {
    const resolutionDate =
      colSet.has('resolutionDate') && issue.statusLogs?.length > 0
        ? issue.statusLogs[0].changedAt.toISOString()
        : '';

    const valueMap = {
      issueId:        escapeCsv(issue.id),
      category:       escapeCsv(issue.category),
      locationArea:   escapeCsv(issue.address ?? 'N/A'),
      status:         escapeCsv(issue.status),
      reportDate:     issue.createdAt.toISOString(),
      resolutionDate: resolutionDate,
      upvoteCount:    issue.upvoteCount,
    };

    return orderedCols.map((c) => valueMap[c]).join(',');
  });

  return [header, ...rows].join('\n');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  ALL_CSV_COLUMNS,
  getOverview,
  getByCategoryStats,
  getTopCategories,
  getByAreaStats,
  getTrendData,
  getAvgResolutionTime,
  getResolutionTimeByCategory,
  getCategorySummary,
  generateCsvData,
};