import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { Skeleton, Empty } from '../components/Charts.jsx';
import { Card } from './AnalyticsOverview.jsx';
import { analytics, dateRangeToFilters } from '../lib/api.js';

// Absolute density thresholds — colour based on actual count, not rank
// All areas with the same count get the same colour
const TIER_META = {
  high: { label: 'High',    color: '#F26D6D', bg: 'rgba(242,109,109,0.18)', border: 'rgba(242,109,109,0.55)' },
  med:  { label: 'Medium',  color: '#F5A623', bg: 'rgba(245,166,35,0.18)',  border: 'rgba(245,166,35,0.55)'  },
  low:  { label: 'Low',     color: '#5B8DEF', bg: 'rgba(91,141,239,0.18)',  border: 'rgba(91,141,239,0.55)'  },
  min:  { label: 'Minimal', color: '#34D399', bg: 'rgba(52,211,153,0.18)',  border: 'rgba(52,211,153,0.55)'  },
};

function tierFromCount(count, max) {
  // Percentage of the highest-count area — purely count-based
  const pct = count / Math.max(max, 1);
  if (pct >= 0.66) return 'high';
  if (pct >= 0.33) return 'med';
  if (pct >= 0.10) return 'low';
  return 'min';
}

export default function MapView() {
  const [range, setRange]     = useState('all');
  const [category, setCategory] = useState(null);
  const [status, setStatus]   = useState(null);
  const [areas, setAreas]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover]     = useState(null);

  const filters = useMemo(() => ({
    ...dateRangeToFilters(range),
    ...(category ? { category } : {}),
    ...(status   ? { status   } : {}),
  }), [range, category, status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    analytics.byArea(filters)
      .then((d) => { if (alive) { setAreas(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters]);

  const placed = useMemo(() => {
    if (!areas.length) return [];
    const max = Math.max(...areas.map(a => a.count), 1);
    const MIN_DIST = 14; // minimum % distance between bubble centres

    // Try to use real lat/lng from backend; fall back to hash-based
    const hasCoords = areas.every(a => a.lat != null && a.lng != null);

    let basePositions;
    if (hasCoords) {
      // Project real coordinates onto the 10–90% canvas range
      const lats = areas.map(a => a.lat);
      const lngs = areas.map(a => a.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const latRange = maxLat - minLat || 1;
      const lngRange = maxLng - minLng || 1;
      basePositions = areas.map(a => ({
        x: 10 + ((a.lng - minLng) / lngRange) * 78,
        y: 10 + ((maxLat - a.lat) / latRange) * 75, // invert Y (lat increases upward)
      }));
    } else {
      basePositions = areas.map(a => {
        const h = hash(a.area);
        return { x: 10 + (h % 78), y: 10 + ((h * 7) % 75) };
      });
    }

    // Collision avoidance — nudge overlapping bubbles apart
    const positions = [];
    basePositions.forEach((base, idx) => {
      let { x, y } = base;
      // Try up to 25 nudge candidates if there's a collision
      for (let attempt = 0; attempt < 25; attempt++) {
        const tooClose = positions.some(p => {
          const dx = p.x - x, dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < MIN_DIST;
        });
        if (!tooClose) break;
        // Spiral outward from original position
        const angle = attempt * 2.4;
        const radius = MIN_DIST * Math.ceil(attempt / 6);
        x = Math.min(88, Math.max(10, base.x + Math.cos(angle) * radius));
        y = Math.min(88, Math.max(10, base.y + Math.sin(angle) * radius));
      }
      positions.push({ x, y });
    });

    return areas.map((a, i) => ({
      ...a,
      x: positions[i].x,
      y: positions[i].y,
      diameter: 44 + (a.count / max) * 68,
      tier: tierFromCount(a.count, max),
    }));
  }, [areas]);

  const total = areas.reduce((s, a) => s + a.count, 0);
  const max   = Math.max(...areas.map(a => a.count), 1);

  // Build legend with actual count ranges from current data
  const legendItems = [
    { key: 'high', label: 'High',    range: `≥ ${Math.ceil(max * 0.66)} issues` },
    { key: 'med',  label: 'Medium',  range: `${Math.ceil(max * 0.33)}–${Math.ceil(max * 0.66) - 1} issues` },
    { key: 'low',  label: 'Low',     range: `${Math.ceil(max * 0.10)}–${Math.ceil(max * 0.33) - 1} issues` },
    { key: 'min',  label: 'Minimal', range: `< ${Math.ceil(max * 0.10)} issues` },
  ];

  return (
    <AppShell crumbs={['Admin', 'Map View']}>
      <div className="main">
        <div className="page-head">
          <div className="title-block">
            <span className="eyebrow">Admin · Geographic Distribution</span>
            <h1 className="h1">Map View</h1>
            <div className="muted" style={{ fontSize: 13.5 }}>
              Issue density per neighbourhood. Bubble size and colour encode reported volume.
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
          onClear={() => { setRange('all'); setCategory(null); setStatus(null); }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginTop: 20 }}>

          {/* ── Bubble density map ── */}
          <Card title="Density Map" sub={category || 'All categories'}>
            {loading ? (
              <Skeleton width="100%" height={500} />
            ) : placed.length === 0 ? (
              <Empty title="No areas to plot" sub="Try widening filters" />
            ) : (
              <div style={{
                position: 'relative', width: '100%', height: 500,
                background: 'var(--bg-2)', borderRadius: 10,
                overflow: 'hidden', border: '1px solid var(--border-1)',
              }}>
                {/* Grid */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, color: 'var(--ink-1)' }}>
                  <defs>
                    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div style={{
                  position: 'absolute', top: 12, left: 14,
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
                  color: 'var(--ink-3)', textTransform: 'uppercase',
                }}>
                  Sector overlay · synthetic projection
                </div>

                {/* Bubbles */}
                {placed.map((p) => {
                  const m = TIER_META[p.tier];
                  const isHovered = hover?.area === p.area;
                  return (
                    <div
                      key={p.area}
                      onMouseEnter={() => setHover(p)}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        position: 'absolute',
                        left: `${p.x}%`, top: `${p.y}%`,
                        width: p.diameter, height: p.diameter,
                        marginLeft: -p.diameter / 2, marginTop: -p.diameter / 2,
                        borderRadius: '50%',
                        background: m.bg,
                        border: `2px solid ${m.border}`,
                        boxShadow: isHovered
                          ? `0 0 0 4px ${m.border}, 0 8px 24px rgba(0,0,0,0.25)`
                          : `0 2px 12px rgba(0,0,0,0.15)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s, transform 0.15s',
                        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        zIndex: isHovered ? 10 : 1,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        fontSize: Math.max(11, p.diameter * 0.28),
                        color: m.color, lineHeight: 1,
                      }}>
                        {p.count}
                      </span>
                    </div>
                  );
                })}

                {/* Area labels */}
                {placed.map((p) => (
                  <div key={p.area + '-label'} style={{
                    position: 'absolute',
                    left: `${p.x}%`, top: `${p.y}%`,
                    transform: `translate(-50%, ${p.diameter / 2 + 6}px)`,
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    letterSpacing: '0.07em', color: 'var(--ink-2)',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                    textTransform: 'uppercase',
                  }}>
                    {p.area}
                  </div>
                ))}

                {/* Hover tooltip */}
                {hover && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--bg-2)', border: `1px solid ${TIER_META[hover.tier].border}`,
                    borderRadius: 10, padding: '12px 16px',
                    minWidth: 160, pointerEvents: 'none', zIndex: 20,
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: TIER_META[hover.tier].color, textTransform: 'uppercase', marginBottom: 6 }}>
                      {TIER_META[hover.tier].label} density
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{hover.area}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                      <span style={{ color: TIER_META[hover.tier].color }}>● </span>
                      {hover.count} issue{hover.count === 1 ? '' : 's'}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div style={{
                  position: 'absolute', bottom: 12, left: 14,
                  background: 'var(--bg-2)', border: '1px solid var(--border-1)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', flexDirection: 'column', gap: 7,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', color: 'var(--ink-2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                    Issue Density
                  </div>
                  {legendItems.map(({ key, label, range }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_META[key].color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-1)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 12 }}>{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ── Ranked list ── */}
          <Card title="Areas Ranked" sub="By issue volume">
            {loading ? (
              <Skeleton width="100%" height={400} />
            ) : placed.length === 0 ? (
              <Empty title="No data" sub="Try widening filters" />
            ) : (
              <div>
                {placed
                  .slice().sort((a, b) => b.count - a.count)
                  .slice(0, 12)
                  .map((p, i) => {
                    const m = TIER_META[p.tier];
                    return (
                      <div key={p.area} style={{
                        display: 'grid', gridTemplateColumns: '24px 14px 1fr auto',
                        gap: 10, alignItems: 'center',
                        padding: '10px 0', borderBottom: '1px solid var(--border-1)',
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{p.area}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: m.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {m.label}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{p.count}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

        </div>
      </div>
    </AppShell>
  );
}

function hash(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}