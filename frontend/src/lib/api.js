/**
 * src/lib/api.js
 *
 * Thin fetch wrapper for the CivicReport backend.
 * Tokens live in localStorage:
 *   - 'userToken'  → citizen JWT
 *   - 'adminToken' → admin JWT  (admin endpoints require this)
 *   - 'adminUser'  → JSON-stringified admin profile
 *
 * Vite proxies /api → http://localhost:3000 in dev (see vite.config.js).
 */

const BASE = '/api';

export const isAdmin = () => !!localStorage.getItem('adminToken');

const authHeader = () => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) return { Authorization: `Bearer ${adminToken}` };
  const userToken = localStorage.getItem('userToken');
  if (userToken) return { Authorization: `Bearer ${userToken}` };
  return {};
};

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, v);
  return `?${sp.toString()}`;
};

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let err;
    try {
      const j = await res.json();
      err = new Error(j.error || `Request failed: ${res.status}`);
    } catch {
      err = new Error(`Request failed: ${res.status}`);
    }
    err.status = res.status;
    throw err;
  }

  // CSV downloads come back as text/csv
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv')) return res.text();

  const json = await res.json();
  return json.data ?? json;
}

// ─── Analytics ──────────────────────────────────────────────────────────────
export const analytics = {
  overview:                 (filters) => request(`/analytics/overview${qs(filters)}`),
  byCategory:               (filters) => request(`/analytics/by-category${qs(filters)}`),
  topCategories:            (filters) => request(`/analytics/top-categories${qs(filters)}`),
  byArea:                   (filters) => request(`/analytics/by-area${qs(filters)}`),
  trends:                   (filters) => request(`/analytics/trends${qs(filters)}`),
  categorySummary:          (filters) => request(`/analytics/category-summary${qs(filters)}`),
  resolutionTime:           (filters) => request(`/analytics/resolution-time${qs(filters)}`),
  resolutionTimeByCategory: (filters) => request(`/analytics/resolution-time-by-category${qs(filters)}`),
  exportCsv: async (filters, columns) => {
    const params = { ...filters };
    if (columns?.length) params.columns = columns.join(',');
    return request(`/analytics/export${qs(params)}`);
  },
};

// ─── Reports (admin only) ───────────────────────────────────────────────────
export const reports = {
  list:     ()                  => request('/reports'),
  get:      (id)                => request(`/reports/${id}`),
  create:   ({ title, filters }) => request('/reports', { method: 'POST', body: { title, filters } }),
  update:   (id, body)          => request(`/reports/${id}`, { method: 'PUT', body }),
  remove:   (id)                => request(`/reports/${id}`, { method: 'DELETE' }),
  download: (id)                => request(`/reports/${id}/download`),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function downloadCsv(csvString, filename = 'export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function dateRangeToFilters(range) {
  if (range === 'all') return {};
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  if (!days) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo:   to.toISOString().slice(0, 10),
  };
}
