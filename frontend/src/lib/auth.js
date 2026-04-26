// ── Admin session (WF2) ──────────────────────────────────────────────────────
export function saveSession({ token, admin }) {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(admin));
}
export function clearSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
}
export function getAdmin() {
  try { return JSON.parse(localStorage.getItem('adminUser') || 'null'); }
  catch { return null; }
}
export function isAuthed() { return !!localStorage.getItem('adminToken'); }

// ── Citizen session (WF1) ────────────────────────────────────────────────────
export function saveUserSession({ token, user }) {
  localStorage.setItem('userToken', token);
  localStorage.setItem('userData', JSON.stringify(user));
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('userData') || 'null'); }
  catch { return null; }
}
export function isUserAuthed() { return !!localStorage.getItem('userToken'); }
