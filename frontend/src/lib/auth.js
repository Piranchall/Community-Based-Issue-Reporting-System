export function saveSession({ token, admin }) {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(admin));
}
export function clearSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}
export function getAdmin() {
  try { return JSON.parse(localStorage.getItem('adminUser') || 'null'); }
  catch { return null; }
}
export function isAuthed() { return !!localStorage.getItem('adminToken'); }
