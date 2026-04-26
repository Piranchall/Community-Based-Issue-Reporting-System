import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { I } from './Icons';
import { clearSession, getAdmin } from '../lib/auth';

export default function Sidebar({ counts = {} }) {
  const nav = useNavigate();
  const admin = getAdmin() || { name: 'Admin', email: 'admin@civicreport.app' };
  const initials = (admin.name || admin.email || 'A').split(/\s+|@/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  const logout = () => {
    clearSession();
    nav('/admin/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><I.logo /></div>
        <div>
          <div className="brand-name">CivicReport<span className="dot">.</span></div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      <div>
        <div className="nav-section-title">Operations</div>
        <div className="nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.list /> All Issues
            {counts.open != null && <span className="badge">{counts.open}</span>}
          </NavLink>
          <NavLink to="/admin/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.map /> Map View
          </NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.chart /> Analytics
          </NavLink>
        </div>
      </div>

      <div>
        <div className="nav-section-title">Reports</div>
        <div className="nav">
          <NavLink to="/my-reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.logs /> My Reports
          </NavLink>
        </div>
      </div>

      <div>
        <div className="nav-section-title">Activity</div>
        <div className="nav">
          <NavLink to="/admin/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.bell /> Notifications
            {counts.unread > 0 && <span className="badge">{counts.unread}</span>}
          </NavLink>
          <NavLink to="/admin/status-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <I.logs /> Status Logs
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="admin-card">
          <div className="avatar">{initials}</div>
          <div className="meta">
            <div className="name">{admin.name || 'Administrator'}</div>
            <div className="email">{admin.email}</div>
          </div>
          <button onClick={logout} title="Sign out"><I.logout /></button>
        </div>
      </div>
    </aside>
  );
}
