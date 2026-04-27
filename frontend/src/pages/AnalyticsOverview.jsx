import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { StatCard, BarList, TrendBars, ResolutionBars, RankList, Skeleton } from '../components/Charts.jsx';
import { ExportCsvModal } from '../components/ExportCsvModal.jsx';
import { Icon } from '../components/Icon.jsx';
import { analytics, isAdmin, dateRangeToFilters } from '../lib/api.js';
import { getAdmin } from '../lib/auth.js';

export default function AnalyticsOverview() {
  const admin = isAdmin();
  const navigate = useNavigate();
  const adminUser = getAdmin();
  // Read citizen info from WF1's storage key; fall back gracefully
  const citizenUser = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null'); } catch { return null; } })();
  const currentUser = admin
    ? { name: adminUser?.name || adminUser?.firstName || 'Admin' }
    : { name: citizenUser?.name || citizenUser?.firstName || 'Citizen' };
  const [range, setRange]       = useState('30d');
  const [category, setCategory] = useState(null);
  const [status, setStatus]     = useState(null);
  const [area, setArea]         = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [overview, setOverview]       = useState(null);
  const [byCategory, setByCategory]   = useState([]);
  const [topCats, setTopCats]         = useState([]);
  const [trend, setTrend]             = useState([]);
  const [resByCat, setResByCat]       = useState(null);
  const [loading, setLoading]         = useState(true);

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
      analytics.overview(filters),
      analytics.byCategory(filters),
      analytics.topCategories(filters),
      analytics.trends(filters),
    ];
    if (admin) calls.push(analytics.resolutionTimeByCategory(filters));

    Promise.all(calls.map((p) => p.catch(() => null))).then((res) => {
      if (!alive) return;
      setOverview(res[0]);
      setByCategory(res[1] || []);
      setTopCats(res[2] || []);
      setTrend(res[3] || []);
      if (admin) setResByCat(res[4]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [filters, admin]);

  const totalIssues = overview?.totalIssues ?? 0;
  const byStatus    = overview?.byStatus ?? {};

  // Format trend bars: friendly label
  const trendBars = (trend || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  // Sparklines from trend
  const trendCounts = trendBars.map((d) => d.count);

  return (
    <AppShell crumbs={['Analytics', 'Overview']}>
      <div className="main">
      <div className="page-head">
        <div className="title-block">
          <div className="title-row">
            <h1 className="h1">Analytics Overview</h1>
          </div>
          <div className="muted" style={{ fontSize: 13.5 }}>
            Real-time issue volume, category mix and resolution velocity across the city.
          </div>
        </div>
        <div className="row gap-8">
          {admin && (
            <button className="btn btn-signal" onClick={() => setExportOpen(true)}>
              <Icon name="download" size={13} /> Export CSV
            </button>
          )}
        </div>
      </div>

      <FilterBar
        range={range} setRange={(v) => { setRange(v); if (v !== '30d') navigate(admin ? '/admin/analytics/filtered' : '/analytics/filtered'); }}
        category={category} setCategory={(v) => { setCategory(v); if (v) navigate(admin ? '/admin/analytics/filtered' : '/analytics/filtered'); }}
        status={status} setStatus={(v) => { setStatus(v); if (v) navigate(admin ? '/admin/analytics/filtered' : '/analytics/filtered'); }}
        area={area} setArea={(v) => { setArea(v); if (v) navigate(admin ? '/admin/analytics/filtered' : '/analytics/filtered'); }}
        onClear={() => { setRange('30d'); setCategory(null); setStatus(null); setArea(null); }}
      />

      {/* — Stat row — */}
      <div className="stat-grid mb-24">
        {loading ? (
          Array.from({ length: admin ? 6 : 4 }).map((_, i) => (
            <div className="stat" key={i}>
              <Skeleton width="50%" height={10} />
              <Skeleton width="60%" height={32} style={{ marginTop: 12 }} />
              <Skeleton width="80%" height={28} style={{ marginTop: 14 }} />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Issues"    value={fmt(totalIssues)}    hue="accent"   spark={trendCounts} delta="Vs. previous period" />
            <StatCard label="Pending"          value={fmt(byStatus.Pending ?? 0)}     hue="pending"  spark={trendCounts.slice(2)} delta="Awaiting review" />
            <StatCard label="In Progress"      value={fmt(byStatus['In Progress'] ?? byStatus.InProgress ?? 0)} hue="progress" spark={trendCounts.slice(1)} delta="Being worked on" />
            <StatCard label="Resolved"         value={fmt(byStatus.Resolved ?? 0)}    hue="resolved" spark={trendCounts}        delta="Closed this period" />
            {admin && (
              <>
                <StatCard label="Rejected"     value={fmt(byStatus.Rejected ?? 0)}    hue="rejected" delta="Invalid or duplicate" />
                <StatCard label="Total Upvotes" value={fmt(overview?.totalUpvotes ?? 0)} hue="signal"  spark={trendCounts}      delta="Community signal" />
              </>
            )}
          </>
        )}
      </div>

      {/* — Three-up: Categories, Trend, Top 5 — */}
      <div className="grid-cat mb-24">
        <Card title="Issues by Category" sub="Volume distribution">
          {loading
            ? <SkeletonRows />
            : <BarList data={byCategory.map((d) => ({ label: d.category, value: d.count }))} />}
        </Card>

        <Card title="Issues Over Time" sub={rangeLabel(range)}>
          {loading ? <Skeleton width="100%" height={220} /> : <TrendBars data={trendBars} />}
        </Card>

        <Card title="Top 5 Categories" sub="Most reported">
          {loading
            ? <SkeletonRows count={5} />
            : <RankList data={topCats.slice(0, 5).map((d) => ({ label: d.category, value: d.count }))} total={totalIssues} />}
        </Card>
      </div>

      {/* — Admin only: Resolution time chart, full-width — */}
      {admin && (
        <Card
          title="Average Resolution Time by Category"
          sub="Days from report to resolution"
          right={
            resByCat?.overallAvgDays != null && (
              <div className="chip">
                Overall · <span className="mono" style={{ marginLeft: 4 }}>
                  {resByCat.overallAvgDays >= 1
                    ? `${resByCat.overallAvgDays}d`
                    : Math.round(resByCat.overallAvgDays * 24) < 1
                      ? '< 1h'
                      : `${Math.round(resByCat.overallAvgDays * 24)}h`}
                </span>
              </div>
            )
          }
        >
          {loading
            ? <SkeletonRows count={5} />
            : <ResolutionBars data={resByCat?.byCategory || []} overall={resByCat?.overallAvgDays} />}
        </Card>
      )}

      <ExportCsvModal open={exportOpen} onClose={() => setExportOpen(false)} initialFilters={filters} />
      </div>
    </AppShell>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('en-US').format(n);
}
function rangeLabel(r) {
  return { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', 'all': 'All time' }[r];
}

function Card({ title, sub, right, children }) {
  return (
    <section className="card card-pad-lg">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function SkeletonRows({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
          <Skeleton width={70} height={12} />
          <Skeleton width="100%" height={10} style={{ flex: 1 }} />
          <Skeleton width={32} height={12} />
        </div>
      ))}
    </div>
  );
}

export { Card };