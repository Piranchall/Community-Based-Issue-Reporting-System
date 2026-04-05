/**
 * reportService.js — Workflow 3
 *
 * CRUD operations for the `Report` entity.
 * A Report is a saved record of an analytics CSV export, created by an admin.
 * This satisfies the Milestone 3 requirement for full CRUD on a core entity.
 *
 * Uses the shared Prisma singleton from db/connection.js (WF2 pattern).
 */

const prisma          = require('../db/connection');
const analyticsService = require('./analyticsService');

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Generates a CSV from the supplied filters and saves it as a Report record.
 * @param {number} adminId   - ID of the admin creating the report
 * @param {string} title     - Human-readable title for the report
 * @param {object} filters   - { dateFrom, dateTo, category, status, area }
 */
async function createReport(adminId, { title, filters = {} }) {
  if (!title || !title.trim()) {
    const err = new Error('Report title is required');
    err.status = 400;
    throw err;
  }

  // Generate the CSV data on-the-fly from current DB state
  const csvData = await analyticsService.generateCsvData(filters);

  return prisma.report.create({
    data: {
      adminId,
      title: title.trim(),
      filters, // stored as JSONB
      csvData,
    },
    select: {
      id:        true,
      title:     true,
      filters:   true,
      createdAt: true,
      updatedAt: true,
      admin:     { select: { id: true, name: true, email: true } },
    },
  });
}

// ─── READ (list) ──────────────────────────────────────────────────────────────

/**
 * Lists all reports created by a specific admin.
 * Does NOT return csvData in the list (potentially large) — fetch individually.
 */
async function listReports(adminId) {
  return prisma.report.findMany({
    where:   { adminId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      filters:   true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ─── READ (single) ────────────────────────────────────────────────────────────

/**
 * Fetches a single report by ID, including its full csvData.
 */
async function getReportById(id, adminId) {
  const report = await prisma.report.findUnique({
    where: { id: Number(id) },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });

  if (!report) {
    const err = new Error('Report not found');
    err.status = 404;
    throw err;
  }

  if (report.adminId !== adminId) {
    const err = new Error('Access denied: you do not own this report');
    err.status = 403;
    throw err;
  }

  return report;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Updates a report's title and/or regenerates its CSV with updated filters.
 * If `regenerate: true` is passed, re-runs the CSV generation with the new filters.
 */
async function updateReport(id, adminId, { title, filters, regenerate = false }) {
  // Verify ownership first
  await getReportById(id, adminId);

  const data = {};

  if (title !== undefined) {
    if (!title.trim()) {
      const err = new Error('Report title cannot be empty');
      err.status = 400;
      throw err;
    }
    data.title = title.trim();
  }

  if (filters !== undefined) {
    data.filters = filters;
  }

  if (regenerate) {
    const filtersToUse = filters ?? (await getReportById(id, adminId)).filters;
    data.csvData = await analyticsService.generateCsvData(filtersToUse);
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Nothing to update — provide title, filters, or set regenerate: true');
    err.status = 400;
    throw err;
  }

  try {
    return await prisma.report.update({
      where: { id: Number(id) },
      data,
      select: {
        id:        true,
        title:     true,
        filters:   true,
        createdAt: true,
        updatedAt: true,
        admin:     { select: { id: true, name: true, email: true } },
      },
    });
  } catch (e) {
    if (e.code === 'P2025') {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Deletes a saved report (admin must own it).
 */
async function deleteReport(id, adminId) {
  // Verify ownership before deleting
  await getReportById(id, adminId);

  try {
    await prisma.report.delete({ where: { id: Number(id) } });
  } catch (e) {
    if (e.code === 'P2025') {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createReport,
  listReports,
  getReportById,
  updateReport,
  deleteReport,
};
