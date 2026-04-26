import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ crumbs, counts, children }) {
  return (
    <>
      <div className="app-bg" />
      <div className="app-shell">
        <Sidebar counts={counts} />
        <main>
          <Topbar crumbs={crumbs} />
          {children}
        </main>
      </div>
    </>
  );
}
