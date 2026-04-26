// src/lib/api.js
// Tiny fetch helper — prefixes API URL, attaches auth token, unwraps { data }.
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

const getToken = () => localStorage.getItem("userToken");

const clearAuthAndRedirect = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
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
  const t = localStorage.getItem('adminToken');
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

