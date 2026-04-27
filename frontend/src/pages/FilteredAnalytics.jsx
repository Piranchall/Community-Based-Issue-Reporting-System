import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { FilterBar, CATEGORIES } from '../components/FilterBar.jsx';
import { BarList, TrendBars, StatusPill, Skeleton, Empty } from '../components/Charts.jsx';
import { Icon } from '../components/Icon.jsx';
import { Card } from './AnalyticsOverview.jsx';
import { analytics, isAdmin, dateRangeToFilters, Reports } from '../lib/api.js';
import { getAdmin } from '../lib/auth.js';

export default function FilteredAnalytics() {
  const admin = isAdmin();
  const navigate = useNavigate();
  const adminUser = getAdmin();
  const citizenUser = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null'); } catch { return null; } })();
  const currentUser = admin
    ? { name: adminUser?.name || adminUser?.firstName || 'Admin' }
    : { name: citizenUser?.name || citizenUser?.firstName || 'Citizen' };
  const [range, setRange] = useState('all');
  const [category, setCategory] = useState('Garbage');
  const [status, setStatus]     = useState(null);
  const [area, setArea]         = useState(null);

  const [summary, setSummary]   = useState(null);
  const [byArea, setByArea]     = useState([]);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const filters = useMemo(() => ({
    ...dateRangeToFilters(range),
    ...(category ? { category } : {}),
    ...(status   ? { status   } : {}),
    ...(area     ? { area     } : {}),
  }), [range, category, status, area]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const calls = [
      category ? analytics.categorySummary(filters) : Promise.resolve(null),
      analytics.byArea(filters),
      analytics.trends(filters),
    ];
    Promise.all(calls.map((p) => p.catch(() => null))).then((res) => {
      if (!alive) return;
      setSummary(res[0]);
      setByArea(res[1] || []);
      setTrend(res[2] || []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [filters]);

  const trendBars = (trend || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  const rangeLbl = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', 'all': 'All Time' }[range];

  return (
    <AppShell crumbs={['Analytics', 'Filtered']}>
      <div className="main">
      <div className="page-head">
        <div className="title-block">
          <Link to="/admin/analytics" className="row gap-8" style={{ color: 'var(--ink-mute)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Icon name="arrow-left" size={12} /> Analytics Overview
          </Link>
          <h1 className="h1" style={{ marginTop: 4 }}>Filtered Analytics</h1>
          <div className="muted" style={{ fontSize: 13.5 }}>
            Showing results for{' '}
            <span style={{ color: 'var(--ink)' }}>
              {category || 'All Categories'} · {rangeLbl} · {status || 'All Statuses'}{area ? ` · ${area}` : ''}
            </span>
          </div>
        </div>
      </div>

      <FilterBar
        range={range} setRange={setRange}
        category={category} setCategory={setCategory}
        status={status} setStatus={setStatus}
        area={area} setArea={setArea}
        onClear={() => { setRange('30d'); setCategory(null); setStatus(null); setArea(null); navigate(admin ? '/admin/analytics' : '/analytics'); }}
      />

      {/* — Two-col layout: left breakdown + trend, right summary panel — */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* LEFT */}
        <div className="col gap-20">
          {/* Category status breakdown card */}
          <Card
            title={category ? `Category Breakdown — ${category}` : 'Status Breakdown'}
            sub={rangeLbl}
          >
            {loading ? (
              <Skeleton width="100%" height={120} />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
                  <StatusBlock label="Pending"     value={summary?.byStatus?.Pending ?? 0}        hue="pending" />
                  <StatusBlock label="In Progress" value={summary?.byStatus?.['In Progress'] ?? summary?.byStatus?.InProgress ?? 0} hue="progress" />
                  <StatusBlock label="Resolved"    value={summary?.byStatus?.Resolved ?? 0}       hue="resolved" />
                </div>

                <div className="card-sub" style={{ marginBottom: 10 }}>Top Affected Areas</div>
                {byArea.length === 0
                  ? <Empty title="No area data" />
                  : <BarList data={byArea.slice(0, 6).map((d) => ({ label: d.area, value: d.count }))} colorByIndex={false} color="#5B8DEF" />}
              </>
            )}
          </Card>

          {/* Trend chart */}
          <Card title={`Trend — ${category || 'All'} Issues`} sub={rangeLbl}>
            {loading
              ? <Skeleton width="100%" height={220} />
              : <TrendBars data={trendBars} />}
          </Card>
        </div>

        {/* RIGHT — Summary panel (only when category filter active) */}
        <div className="col gap-20">
          {category ? (
            <SummaryPanel summary={summary} loading={loading} category={category} admin={admin} />
          ) : (
            <Card title="Category Summary" sub="Pick a category">
              <Empty
                title="Select a category to see summary"
                sub="The summary panel surfaces % share, avg resolution time, and most-affected area for the chosen category."
              />
              <div className="row gap-8" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <button key={c} className="chip" style={{ cursor: 'pointer' }} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </Card>
          )}


        </div>
      </div>
      </div>
    </AppShell>
  );
}

function StatusBlock({ label, value, hue }) {
  const COLOR = { pending: '#F5A623', progress: '#5B8DEF', resolved: '#34D399' }[hue];
  return (
    <div style={{
      padding: '14px 14px 12px',
      borderRadius: 10,
      border: '1px solid var(--line)',
      background: 'var(--bg-input)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: COLOR }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: COLOR, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function SummaryPanel({ summary, loading, category, admin = false }) {
  if (loading) {
    return (
      <Card title="Summary" sub={category}>
        <Skeleton width="100%" height={180} />
      </Card>
    );
  }
  if (!summary) {
    return (
      <Card title="Summary" sub={category}>
        <Empty title="No summary available" />
      </Card>
    );
  }

  const rows = [
    { label: 'Total in Category',  value: fmt(summary.totalInCategory),   accent: 'var(--ink)' },
    { label: '% of All Issues',    value: `${summary.percentOfAllIssues}%`, accent: 'var(--accent-bright)' },
    ...(admin ? [{ label: 'Avg. Resolution', value: summary.avgResolutionDays != null ? `${summary.avgResolutionDays}d` : '—', accent: 'var(--signal)' }] : []),
    { label: 'Most Affected Area', value: summary.mostAffectedArea || '—', accent: 'var(--ink)' },
  ];

  return (
    <Card title="Summary" sub={`Category: ${category}`}
      right={<span className="pill pill-progress">Filtered</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r) => (
          <div key={r.label} style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '13px 0',
            borderBottom: '1px solid var(--line)',
            gap: 12,
          }}>
            <span className="card-sub">{r.label}</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: r.accent,
              fontVariantNumeric: 'tabular-nums',
            }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Stacked status mini-bar */}
      <div className="mt-20">
        <div className="card-sub mb-12">Status Mix</div>
        <StackedStatusBar by={summary.byStatus} />
      </div>
    </Card>
  );
}

function StackedStatusBar({ by = {} }) {
  const segs = [
    { key: 'Pending',     value: by.Pending ?? 0,                                    color: '#F5A623' },
    { key: 'In Progress', value: by['In Progress'] ?? by.InProgress ?? 0,            color: '#5B8DEF' },
    { key: 'Resolved',    value: by.Resolved ?? 0,                                   color: '#34D399' },
    { key: 'Rejected',    value: by.Rejected ?? 0,                                   color: '#F26D6D' },
  ];
  const total = segs.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        {segs.map((s) => s.value > 0 && (
          <div key={s.key} title={`${s.key}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: `linear-gradient(180deg, ${s.color}, ${s.color}cc)` }} />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 12 }}>
        {segs.map((s) => (
          <span key={s.key} className="legend-item">
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.key} <span className="mono" style={{ marginLeft: 4, color: 'var(--ink)' }}>{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function fmt(n) { return new Intl.NumberFormat('en-US').format(n); }

function SaveReportBtn({ filters }) {
  const [state, setState] = React.useState('idle');
  const [errMsg, setErrMsg] = React.useState('');
  const navigate = useNavigate();

  async function handleSave() {
    setState('saving');
    setErrMsg('');
    try {
      const title = `Filtered Report · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      await Reports.create({ title, filters });
      setState('done');
      setTimeout(() => navigate('/admin/reports'), 1200);
    } catch (e) {
      setErrMsg(e.message || 'Failed to save report');
      setState('err');
      setTimeout(() => setState('idle'), 4000);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'space-between' }}
        onClick={handleSave}
        disabled={state === 'saving' || state === 'done'}
      >
        <span>
          <Icon name="reports" size={13} />
          &nbsp;{' '}
          {state === 'saving' ? 'Saving…' : state === 'done' ? '✓ Saved! Redirecting…' : 'Save This as Report'}
        </span>
        <span className="dim mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          {state === 'done' ? 'SAVED' : 'ADMIN →'}
        </span>
      </button>
      {state === 'err' && (
        <div style={{ fontSize: 11, color: 'var(--st-rejected-fg)', marginTop: 4, paddingLeft: 4 }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}