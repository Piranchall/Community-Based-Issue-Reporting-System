// src/lib/api.js
// Tiny fetch helper — prefixes API URL, attaches auth token, unwraps { data }.
import { ROLE, getSession } from './auth.js';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001";

export function resolveMediaUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const getToken = () => {
  const sessionToken = getSession()?.token;
  if (sessionToken) return sessionToken;
  return localStorage.getItem("authToken") || localStorage.getItem("adminToken") || localStorage.getItem("userToken");
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authRole");
  localStorage.removeItem("authPrincipal");
  if (typeof window !== "undefined") {
    const target = '/login';
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  }
};

const isAuthFailure = (status, payload) => {
  const msg = String(payload?.error || payload?.message || "").toLowerCase();
  return status === 401 || msg.includes("token") || msg.includes("authorization") || msg.includes("unauthorized");
};

export async function api(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (auth) {
    const t = getToken();
    if (t) h.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (auth && !res.ok && isAuthFailure(res.status, json)) {
    clearAuthAndRedirect();
  }
  if (!res.ok) throw new Error(json.error || json.message || `Request failed (${res.status})`);
  return json.data ?? json;
}

// Multipart upload (images)
export async function apiForm(path, formData, { method = "POST" } = {}) {
  const h = {};
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_URL}${path}`, { method, headers: h, body: formData });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && isAuthFailure(res.status, json)) {
    clearAuthAndRedirect();
  }
  if (!res.ok) throw new Error(json.error || json.message || `Request failed (${res.status})`);
  return json.data ?? json;
}

// wf2 - Thin API wrapper — talks to Express backend from the ZIP.
// Base path is "/api" and Vite proxies it to http://localhost:5001 in dev.

const BASE = '/api';

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* -------- Admin auth -------- */
export const AdminAuth = {
  register: ({ name, email, password }) =>
    request('/admin/register', { method: 'POST', auth: false, body: { name, email, password } }),
  login: ({ email, password }) =>
    request('/admin/login', { method: 'POST', auth: false, body: { email, password } }),
  forgotPassword: ({ email }) =>
    request('/admin/forgot-password', { method: 'POST', auth: false, body: { email } }),
  resetPassword: ({ email, token, newPassword }) =>
    request('/admin/reset-password', { method: 'POST', auth: false, body: { email, token, newPassword } }),
  profile: () => request('/admin/profile'),
  changePassword: ({ currentPassword, newPassword }) =>
    request('/admin/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
};

/* -------- Issues -------- */
export const AdminIssues = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return request(`/admin/issues${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/admin/issues/${id}`),
  update: (id, { newStatus, remarks }) =>
    request(`/admin/issues/${id}`, { method: 'PUT', body: { newStatus, remarks } }),
  remove: (id) => request(`/admin/issues/${id}`, { method: 'DELETE' }),
};

/* -------- Status logs -------- */
export const StatusLogs = {
  byIssue: (issueId) => request(`/status-logs/issue/${issueId}`),
};

/* -------- Notifications -------- */
export const Notifications = {
  list: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}`, { method: 'PUT' }),
  remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

/* -------- Reports -------- */
export const Reports = {
  create: ({ title, filters }) =>
    request('/reports', { method: 'POST', body: { title, filters } }),
  list: () => request('/reports'),
  get: (id) => request(`/reports/${id}`),
  remove: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
};

// ─── Analytics (WF3) ────────────────────────────────────────────────────────
export const isAdmin = () => getSession()?.role === ROLE.ADMIN;

// Analytics endpoints return { message, data } — unwrap .data automatically
// so AnalyticsOverview/FilteredAnalytics/MapView receive the raw data directly.
// (AdminIssues, Notifications etc. use request() directly and access .data manually.)
const analyticsRequest = async (path) => {
  const r = await request(path);
  // Backend wraps all responses as { message: '...', data: <actual data> }
  return (r && typeof r === 'object' && 'data' in r) ? r.data : r;
};

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, v);
  return `?${sp.toString()}`;
};

export const analytics = {
  overview:                 (filters) => analyticsRequest(`/analytics/overview${qs(filters)}`),
  byCategory:               (filters) => analyticsRequest(`/analytics/by-category${qs(filters)}`),
  topCategories:            (filters) => analyticsRequest(`/analytics/top-categories${qs(filters)}`),
  byArea:                   (filters) => analyticsRequest(`/analytics/by-area${qs(filters)}`),
  trends:                   (filters) => analyticsRequest(`/analytics/trends${qs(filters)}`),
  categorySummary:          (filters) => analyticsRequest(`/analytics/category-summary${qs(filters)}`),
  resolutionTime:           (filters) => analyticsRequest(`/analytics/resolution-time${qs(filters)}`),
  resolutionTimeByCategory: (filters) => analyticsRequest(`/analytics/resolution-time-by-category${qs(filters)}`),
  exportCsv: async (filters, columns) => {
    // Export returns text/csv, not JSON — must use res.text() not res.json()
    const params = { ...filters };
    if (columns?.length) params.columns = columns.join(',');
    const path = `/analytics/export${qs(params)}`;
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.text();
  },
};

export function downloadCsv(csvString, filename = 'export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function dateRangeToFilters(range) {
  if (range === 'all') return {};
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  if (!days) return {};
  const to = new Date(), from = new Date();
  from.setDate(from.getDate() - days);
  to.setHours(23, 59, 59, 999);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString() };
}