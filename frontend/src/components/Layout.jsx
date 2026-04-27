import { NavLink, Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { isAdmin } from '../lib/api.js';

export function Sidebar({ user, role = 'citizen' }) {
  const admin = role === 'admin';

  // Admin nav: All Issues, Map View, Analytics only
  const adminNav = [
    { to: '/admin/dashboard', label: 'All Issues', icon: 'dashboard' },
    { to: '/admin/map',       label: 'Map View',   icon: 'map' },
    { to: '/admin/analytics', label: 'Analytics',  icon: 'analytics' },
  ];

  // Citizen nav: Dashboard, My Reports, Report Issue, Analytics
  const citizenNav = [
    { to: '/dashboard',    label: 'Dashboard',     icon: 'dashboard' },
    { to: '/my-reports',   label: 'My Reports',    icon: 'reports' },
    { to: '/report',       label: 'Report Issue',  icon: 'plus' },
    { to: '/analytics',    label: 'Analytics',     icon: 'analytics' },
  ];

  const navItems = admin ? adminNav : citizenNav;

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  }

  return (
    <aside className="sidebar">
      <Link to={admin ? "/admin/dashboard" : "/dashboard"} className="brand">
        <div className="brand-mark">C</div>
        <div>
          <div className="brand-name">CivicReport</div>
          <div className="brand-sub">{admin ? 'Admin Console' : 'Citizen Portal'}</div>
        </div>
      </Link>

      <div className="nav-section">{admin ? 'Operations' : 'Workspace'}</div>
      {navItems.map((n) => (
        <NavLink key={n.to} to={n.to} className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <Icon name={n.icon} className="nav-icon" />
          <span>{n.label}</span>
        </NavLink>
      ))}

      <div className="nav-spacer" />

      <div className="user-card">
        <div className="user-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{user?.name || (admin ? 'Admin' : 'Citizen')}</div>
          <div className="user-role">{admin ? 'Administrator' : 'Citizen'}</div>
        </div>
        <button className="btn-icon" title="Log out" style={{ color: 'var(--ink-dim)' }} onClick={handleLogout}>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ crumbs = [], children }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-actions">
        <span className="live-dot">Live · syncing</span>
        {children}
      </div>
    </div>
  );
}

export function Layout({ children, role, user, crumbs, topbarExtras }) {
  const detectedRole = role || (isAdmin() ? 'admin' : 'citizen');
  return (
    <div className="app-shell">
      <Sidebar role={detectedRole} user={user} />
      <main className="main-pane">
        <Topbar crumbs={crumbs}>{topbarExtras}</Topbar>
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
