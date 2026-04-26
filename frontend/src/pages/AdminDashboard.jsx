import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusPill from '../components/StatusPill';
import { AdminIssues, Notifications } from '../lib/api';
import { I } from '../components/Icons';
import { formatDate, STATUSES, shortId } from '../lib/format';

const CATEGORIES = ['All', 'Pothole', 'Streetlight', 'Garbage', 'Water', 'Graffiti', 'Signage', 'Other'];
const AREAS = ['All', 'Downtown', 'Northside', 'Riverside', 'West Hills', 'Industrial', 'Uptown'];

export default function AdminDashboard() {
  const nav = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [unread, setUnread] = useState(0);

  const [filters, setFilters] = useState({
    status: '', category: '', area: '', dateFrom: '', dateTo: '', q: '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true); setErr('');
      try {
        const params = {};
        if (filters.status)   params.status   = filters.status;
        if (filters.category && filters.category !== 'All') params.category = filters.category;
        if (filters.area     && filters.area     !== 'All') params.area     = filters.area;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo)   params.dateTo   = filters.dateTo;
        params.sortBy = sortBy;

        const res = await AdminIssues.list(params);
        if (!live) return;
        setIssues(res?.data || []);
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load issues');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [filters.status, filters.category, filters.area, filters.dateFrom, filters.dateTo, sortBy]);

  useEffect(() => {
    Notifications.list().then(r => {
      const unread = (r?.data || []).filter(n => !n.isRead).length;
      setUnread(unread);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let rows = [...issues];
    if (q) rows = rows.filter(i =>
      i.title?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.address?.toLowerCase().includes(q) ||
      i.id?.toLowerCase().includes(q));
    if (sortDir === 'asc') rows.reverse();
    return rows;
  }, [issues, filters.q, sortDir]);

  const kpis = useMemo(() => {
    const total      = issues.length;
    const pending    = issues.filter(i => i.status === 'Pending').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved   = issues.filter(i => i.status === 'Resolved').length;
    const rejected   = issues.filter(i => i.status === 'Rejected').length;
    const open       = pending + inProgress;
    const upvotes    = issues.reduce((sum, i) => sum + (i.upvoteCount || 0), 0);
    return { total, pending, inProgress, resolved, rejected, open, upvotes };
  }, [issues]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  return (
    <AppShell crumbs={['Workspace', 'Issues']} counts={{ open: kpis.open, unread }}>
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">All issues</h1>
            <p className="page-sub">Triage, route, and resolve what citizens report.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost"><I.download /> Export CSV</button>
            <button className="btn btn-primary"><I.refresh /> Sync now</button>
          </div>
        </div>

        <div className="kpis">
          <Kpi label="Total Issues"  value={kpis.total}      delta="All reported issues"   bar="var(--acc)" />
          <Kpi label="Pending"       value={kpis.pending}    delta="Awaiting review"        bar="var(--st-pending-fg)" />
          <Kpi label="In Progress"   value={kpis.inProgress} delta="Being worked on"        bar="var(--acc)" />
          <Kpi label="Resolved"      value={kpis.resolved}   delta="Closed issues"          bar="var(--st-resolved-fg)" />
          <Kpi label="Rejected"      value={kpis.rejected}   delta="Invalid or duplicate"   bar="var(--st-rejected-fg)" />
          <Kpi label="Total Upvotes" value={kpis.upvotes}    delta="Community signal"        bar="var(--acc)" />
        </div>

        <div className="filter-bar">
          <div className="filter-bar-title"><I.filter /> Filters</div>
          <select className="select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c === 'All' ? 'All categories' : c}</option>)}
          </select>
          <select className="select" value={filters.area} onChange={e => setFilters(f => ({ ...f, area: e.target.value }))}>
            {AREAS.map(a => <option key={a} value={a === 'All' ? '' : a}>{a === 'All' ? 'All areas' : a}</option>)}
          </select>
          <input className="input" type="date" value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
          <input className="input" type="date" value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
          <div className="search" style={{ flex: 1 }}>
            <I.search />
            <input placeholder="Search by title, address, ID…"
              value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} />
          </div>
        </div>

        {err && <div className="banner err" style={{ marginBottom: 14 }}><I.x /> {err}</div>}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <Th label="ID" />
                <Th label="Title" />
                <Th label="Category" />
                <Th label="Area" />
                <Th label="Status" sort="status" active={sortBy} dir={sortDir} onClick={() => toggleSort('status')} />
                <Th label="Upvotes" sort="upvoteCount" active={sortBy} dir={sortDir} onClick={() => toggleSort('upvoteCount')} right />
                <Th label="Reported" sort="createdAt" active={sortBy} dir={sortDir} onClick={() => toggleSort('createdAt')} />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty">
                    <div className="icon"><I.list /></div>
                    <div className="title">No issues match</div>
                    <div>Try adjusting the filters, or clearing the search.</div>
                  </div>
                </td></tr>
              )}
              {!loading && filtered.map(it => (
                <tr key={it.id} onClick={() => nav(`/admin/issues/${it.id}`)}>
                  <td className="id-cell">{shortId(it.id)}</td>
                  <td className="title-cell">
                    {it.title}
                    <span className="sub">{it.address || '—'}</span>
                  </td>
                  <td className="muted">{it.category}</td>
                  <td className="muted">{it.area || '—'}</td>
                  <td><StatusPill status={it.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="upvote-chip"><I.upvote width={11} height={11} /> {it.upvoteCount ?? 0}</span>
                  </td>
                  <td className="muted num">{formatDate(it.createdAt, { relative: true })}</td>
                  <td style={{ textAlign: 'right' }}><I.arrowRight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, delta, bar }) {
  return (
    <div className="kpi">
      <div className="kpi-label"><span className="bar" style={{ background: bar }} />{label}</div>
      <div className="kpi-value">{Number(value).toLocaleString()}</div>
      <div className="kpi-delta" style={{ color: 'var(--ink-3)' }}>{delta}</div>
    </div>
  );
}

function Th({ label, sort, active, dir, onClick, right }) {
  const isActive = sort && active === sort;
  return (
    <th className={`${sort ? 'sortable' : ''} ${isActive ? 'sorted' : ''}`}
        onClick={onClick}
        style={right ? { textAlign: 'right' } : undefined}>
      {label}
      {sort && <span className="arr">{isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}</span>}
    </th>
  );
}
