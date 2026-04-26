import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { Skeleton, Empty } from '../components/Charts.jsx';
import { Card } from './AnalyticsOverview.jsx';
import { Icon } from '../components/Icon.jsx';
import { analytics, dateRangeToFilters } from '../lib/api.js';

/**
 * Map View — admin-only bubble map.
 * The backend's by-area endpoint returns counts per `address`. We render
 * each area as a bubble on a stylised civic grid (NOT a real geo-map —
 * that would require a Mapbox token and per-area lat/lng we don't have).
 */
export default function MapView() {
  const [range, setRange]       = useState('30d');
  const [category, setCategory] = useState(null);
  const [status, setStatus]     = useState(null);

  const [areas, setAreas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  const filters = useMemo(() => ({
    ...dateRangeToFilters(range),
    ...(category ? { category } : {}),
    ...(status   ? { status   } : {}),
  }), [range, category, status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    analytics.byArea(filters)
      .then((d) => { if (alive) { setAreas(d || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters]);

  // Deterministic pseudo-positions — keyed off the area name so positions are stable
  const placed = useMemo(() => {
    const max = Math.max(...areas.map((a) => a.count), 1);
    return areas.map((a) => {
      const h = hash(a.area);
      const x = 8 + (h % 84);
      const y = 10 + ((h * 7) % 78);
      const intensity = a.count / max;
      const r = 10 + intensity * 38;
      const tier =
        intensity > 0.66 ? 'high' :
        intensity > 0.33 ? 'med'  :
        intensity > 0.10 ? 'low'  : 'min';
      return { ...a, x, y, r, intensity, tier };
    });
  }, [areas]);

  const tierMeta = {
    high: { label: 'High',     color: '#F26D6D', range: 'Top quartile' },
    med:  { label: 'Medium',   color: '#F5A623', range: '34–66%' },
    low:  { label: 'Low',      color: '#5B8DEF', range: '11–33%' },
    min:  { label: 'Minimal',  color: '#34D399', range: '0–10%' },
  };

  const total = areas.reduce((s, a) => s + a.count, 0);

  return (
    <Layout role="admin" user={{ name: 'Hussain' }} crumbs={['Admin', 'Map View']}>
      <div className="page-head">
        <div className="title-block">
          <span className="eyebrow">Admin · Geographic Distribution</span>
          <h1 className="h1">Map View</h1>
          <div className="muted" style={{ fontSize: 13.5 }}>
            Issue density per neighborhood. Bubble size and color encode reported volume.
          </div>
        </div>
        <div className="row gap-12">
          <div className="chip">{areas.length} areas · {total} issues</div>
        </div>
      </div>

      <FilterBar
        range={range} setRange={setRange}
        category={category} setCategory={setCategory}
        status={status} setStatus={setStatus}
        showAreas={false}
        onClear={() => { setRange('30d'); setCategory(null); setStatus(null); }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <Card title="Density Map" sub={category || 'All categories'}>
          {loading ? (
            <Skeleton width="100%" height={540} />
          ) : placed.length === 0 ? (
            <Empty title="No areas to plot" sub="Try widening filters" />
          ) : (
            <div className="map-shell">
              <div className="map-grid" />
              {/* Compass / coords */}
              <div style={{
                position: 'absolute', top: 14, left: 16,
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
                color: 'var(--ink-dim)', textTransform: 'uppercase',
              }}>
                Sector overlay · synthetic projection
              </div>

              {/* Bubbles */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  {Object.entries(tierMeta).map(([t, m]) => (
                    <radialGradient key={t} id={`g-${t}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={m.color} stopOpacity="0.85" />
                      <stop offset="60%" stopColor={m.color} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={m.color} stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>
                {placed.map((p) => (
                  <g key={p.area}
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer' }}>
                    {/* halo */}
                    <circle cx={p.x} cy={p.y} r={p.r * 0.5} fill={`url(#g-${p.tier})`} />
                    {/* core */}
                    <circle cx={p.x} cy={p.y} r={Math.max(2, p.r * 0.10)} fill={tierMeta[p.tier].color}
                      stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
                  </g>
                ))}
              </svg>

              {/* Labels overlay (HTML, easier to position with px font) */}
              {placed.map((p) => (
                <div key={p.area + 'l'}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: `translate(-50%, calc(-50% + ${10 + p.r * 0.45}px))`,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'var(--ink-mute)',
                    background: 'rgba(8,9,26,0.6)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                  {p.area} · <span style={{ color: 'var(--ink)' }}>{p.count}</span>
                </div>
              ))}

              {/* Hover tooltip */}
              {hover && (
                <div style={{
                  position: 'absolute',
                  top: 14, right: 14,
                  background: 'rgba(8,9,26,0.92)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  minWidth: 180,
                  pointerEvents: 'none',
                }}>
                  <div className="card-sub" style={{ marginBottom: 6 }}>{tierMeta[hover.tier].label} density</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{hover.area}</div>
                  <div className="mono dim" style={{ fontSize: 11, marginTop: 6 }}>
                    <span style={{ color: tierMeta[hover.tier].color }}>● </span>
                    {hover.count} issue{hover.count === 1 ? '' : 's'}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="map-legend">
                <div style={{ color: 'var(--ink)', letterSpacing: '0.14em', fontWeight: 500 }}>Density</div>
                {Object.entries(tierMeta).map(([t, m]) => (
                  <div key={t} className="row gap-8">
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: `radial-gradient(circle, ${m.color}, transparent 70%)`,
                      border: `1px solid ${m.color}`,
                    }} />
                    <span style={{ color: 'var(--ink)' }}>{m.label}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }}>{m.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Side panel: ranked list */}
        <Card title="Areas Ranked" sub="By issue volume">
          {loading ? (
            <Skeleton width="100%" height={400} />
          ) : (
            <div>
              {placed
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 12)
                .map((p, i) => (
                  <div key={p.area} style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--line)',
                  }}>
                    <div className="mono dim" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.area}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: tierMeta[p.tier].color, textTransform: 'uppercase' }}>
                        {tierMeta[p.tier].label}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{p.count}</div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
