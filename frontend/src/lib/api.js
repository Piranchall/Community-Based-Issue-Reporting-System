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
