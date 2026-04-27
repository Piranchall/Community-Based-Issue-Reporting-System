import React from 'react';
import { useNavigate } from 'react-router-dom';
import { I } from './Icons';
import { getSession, ROLE } from '../lib/auth';

export default function Topbar({ crumbs = [], onSearch, children }) {
  const navigate = useNavigate();
  const isAdmin = getSession()?.role === ROLE.ADMIN;

  return (
    <header className="topbar">
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer" />
      {onSearch && (
        <div className="search">
          <I.search />
          <input placeholder="Search issues, IDs…" onChange={e => onSearch(e.target.value)} />
          <kbd>⌘K</kbd>
        </div>
      )}
      {isAdmin && (
        <button
          className="icon-btn"
          title="Notifications"
          onClick={() => navigate('/admin/notifications')}
        >
          <I.bell />
        </button>
      )}
      {children}
    </header>
  );
}
