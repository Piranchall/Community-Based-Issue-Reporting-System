import React from 'react';
import { I } from './Icons';

export default function Topbar({ crumbs = [], children }) {
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
      <div className="search">
        <I.search />
        <input placeholder="Search issues, users, IDs…" />
        <kbd>⌘K</kbd>
      </div>
      <button className="icon-btn" title="Notifications"><I.bell /><span className="dot" /></button>
      <button className="icon-btn" title="Settings"><I.settings /></button>
      {children}
    </header>
  );
}
