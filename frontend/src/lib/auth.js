export const ROLE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

function normalizeRole(rawRole) {
  const role = String(rawRole || '').trim().toUpperCase();
  if (role === 'ADMIN') return ROLE.ADMIN;
  if (role === 'USER') return ROLE.USER;
  return null;
}

function parseJson(raw) {
  try {
    return JSON.parse(raw || 'null');
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  try {
    const payload = token?.split('.')?.[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

export function saveSession({ token, admin }) {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(admin));
  localStorage.setItem('authToken', token);
  localStorage.setItem('authRole', ROLE.ADMIN);
  localStorage.setItem('authPrincipal', JSON.stringify(admin));
  window.dispatchEvent(new Event('cr:sessionUpdated'));
}

export function saveUserSession({ token, user }) {
  localStorage.setItem('userToken', token);
  localStorage.setItem('userData', JSON.stringify(user));
  localStorage.setItem('authToken', token);
  localStorage.setItem('authRole', ROLE.USER);
  localStorage.setItem('authPrincipal', JSON.stringify(user));
  window.dispatchEvent(new Event('cr:userDataUpdated'));
  window.dispatchEvent(new Event('cr:sessionUpdated'));
}

export function clearSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  localStorage.removeItem('authPrincipal');
  window.dispatchEvent(new Event('cr:sessionUpdated'));
}

export function getAdmin() {
  return parseJson(localStorage.getItem('adminUser'));
}

export function getUser() {
  return parseJson(localStorage.getItem('userData'));
}

export function getSession() {
  const authToken = localStorage.getItem('authToken');
  const authRole = normalizeRole(localStorage.getItem('authRole'));
  const authPrincipal = parseJson(localStorage.getItem('authPrincipal'));

  if (authToken && authRole) {
    return {
      token: authToken,
      role: authRole,
      principal: authPrincipal,
    };
  }

  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    return {
      token: adminToken,
      role: ROLE.ADMIN,
      principal: getAdmin(),
    };
  }

  const userToken = localStorage.getItem('userToken');
  if (userToken) {
    return {
      token: userToken,
      role: ROLE.USER,
      principal: getUser(),
    };
  }

  return null;
}

export function hasValidSession(requiredRole) {
  const session = getSession();
  if (!session?.token) return false;
  if (requiredRole && normalizeRole(session.role) !== normalizeRole(requiredRole)) return false;
  return !isTokenExpired(session.token);
}

export function isAuthed() {
  return hasValidSession(ROLE.ADMIN);
}

export function isUserAuthed() {
  return hasValidSession(ROLE.USER);
}
