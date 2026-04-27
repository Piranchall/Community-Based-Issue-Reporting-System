import { Icon } from './Icon.jsx';

// ─── Stat card with sparkline ────────────────────────────────────────────────
export function StatCard({ label, value, unit, hue = 'accent', spark = [], delta }) {
  const COLOR = {
    accent:   '#7CC3FF',
    pending:  '#F5A623',
    progress: '#5B8DEF',
    resolved: '#34D399',
    rejected: '#F26D6D',
    signal:   '#C5F23F',
  }[hue] || '#7CC3FF';

  return (
    <div className="stat">
      <div className="stat-label">
        <span className="stat-dot" style={{ background: COLOR, boxShadow: `0 0 8px ${COLOR}` }} />
        {label}
      </div>
      <div className="stat-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="stat-meta">
        <span>{delta || 'Last period'}</span>
        <span style={{ color: COLOR }}>{spark.length > 0 ? '↗' : '·'}</span>
      </div>
      {spark.length > 0 && (
        <div className="stat-spark">
          <Sparkline data={spark} color={COLOR} />
        </div>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color = '#7CC3FF', height = 28 }) {
  if (!data?.length) return null;
  const w = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = w / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => [i * stepX, height - ((d - min) / range) * (height - 4) - 2]);
  const pathLine = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const pathArea = `${pathLine} L${w},${height} L0,${height} Z`;
  const gid = `sg-${color.replace('#','')}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathArea} fill={`url(#${gid})`} />
      <path d={pathLine} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Horizontal bar chart (categories / areas) ───────────────────────────────
const CAT_COLORS = ['#7CC3FF', '#5B8DEF', '#C5F23F', '#F5A623', '#B47CFF', '#F26D6D'];

export function BarList({ data = [], colorByIndex = true, color, suffix }) {
  if (!data?.length) return <Empty title="No data" sub="No issues match your filters" />;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      {data.map((d, i) => {
        const c = color || (colorByIndex ? CAT_COLORS[i % CAT_COLORS.length] : 'var(--accent)');
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="chart-bar-row">
            <div className="chart-bar-label">{d.label}</div>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c}, ${lighten(c)})`,
                }}
              />
            </div>
            <div className="chart-bar-value">
              {d.value}{suffix ? <span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>{suffix}</span> : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function lighten(hex) {
  // crude: append more brightness via additional alpha-overlay; just return hex tweaked
  return hex.length === 7 ? hex + 'cc' : hex;
}

// ─── Trend line chart (Issues Over Time) ─────────────────────────────────────
export function TrendBars({ data = [], height = 320 }) {
  if (!data?.length) return <Empty title="No trend data" sub="Try widening the date range" />;

  const max   = Math.max(...data.map(d => d.count), 1);
  const W     = 800;
  const H     = height;
  const padL  = 32;  // room for y-axis labels
  const padR  = 16;
  const padT  = 20;
  const padB  = 44;  // room for x-axis labels
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Nice y-axis: 5 ticks, rounded up to nearest clean number
  const rawStep = max / 5;
  const mag     = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const step    = Math.max(1, Math.ceil(rawStep / mag) * mag);
  const yMax    = step * 5;
  const yTicks  = Array.from({ length: 6 }, (_, i) => step * i); // 0, step, 2step … 5step

  // X positions
  const xOf = (i) => padL + (i / Math.max(data.length - 1, 1)) * plotW;
  const yOf = (v) => padT + plotH - (v / yMax) * plotH;

  // Line path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(d.count)}`).join(' ');

  // Filled area under the line
  const areaPath = [
    `M${xOf(0)},${yOf(0)}`,
    ...data.map((d, i) => `L${xOf(i)},${yOf(d.count)}`),
    `L${xOf(data.length - 1)},${yOf(0)}`,
    'Z',
  ].join(' ');

  // X labels — show at most 8, always include first and last
  const maxLabels = 8;
  const step_x    = Math.max(1, Math.ceil(data.length / maxLabels));
  const labelIdx  = new Set([
    0,
    data.length - 1,
    ...Array.from({ length: Math.floor(data.length / step_x) }, (_, i) => (i + 1) * step_x),
  ]);

  // Dot hover state handled via SVG title (tooltip on native hover)
  const DOT_R = 3.5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5B8DEF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines + Y-axis labels */}
      {yTicks.map((v) => {
        const y = yOf(v);
        return (
          <g key={v}>
            <line
              x1={padL} x2={W - padR} y1={y} y2={y}
              stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 5"
            />
            <text
              x={padL - 6} y={y + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10" fill="currentColor" fillOpacity="0.45"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#lineArea)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#5B8DEF"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots on data points */}
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.count)} r={DOT_R}
          fill="#5B8DEF" stroke="white" strokeWidth="1.5" strokeOpacity="0.8">
          <title>{`${d.label}: ${d.count} issue${d.count === 1 ? '' : 's'}`}</title>
        </circle>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (!labelIdx.has(i)) return null;
        return (
          <text
            key={`xl${i}`}
            x={xOf(i)} y={H - 10}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
            fontFamily="JetBrains Mono, monospace"
            fontSize="11" fontWeight="700" fill="currentColor" fillOpacity="0.7"
          >
            {d.label}
          </text>
        );
      })}

      {/* Baseline */}
      <line
        x1={padL} x2={W - padR} y1={yOf(0)} y2={yOf(0)}
        stroke="currentColor" strokeOpacity="0.12"
      />
    </svg>
  );
}

// ─── Resolution-time horizontal bars (admin only) ────────────────────────────
const CAT_RES_COLORS = {
  Garbage:     '#7CC3FF',
  Water:       '#5B8DEF',
  Road:        '#C5F23F',
  Electricity: '#F5A623',
  Other:       '#B47CFF',
};

function fmtResolution(days) {
  if (days == null) return '—';
  if (days >= 1) return <>{days}<span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>d</span></>;
  const hrs = Math.round(days * 24);
  if (hrs < 1) return <span style={{ color: 'var(--ink-dim)' }}>&lt; 1h</span>;
  return <>{hrs}<span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>h</span></>;
}

export function ResolutionBars({ data = [], overall }) {
  if (!data?.length) return <Empty title="No resolutions yet" sub="Resolved issues will appear here" />;
  const max = Math.max(...data.map((d) => d.avgResolutionDays), overall || 0, 0.001);
  const overallPct = overall != null ? (overall / max) * 100 : null;

  return (
    <div>
      {data.map((d) => {
        const c = CAT_RES_COLORS[d.category] || '#7CC3FF';
        const pct = Math.max((d.avgResolutionDays / max) * 100, d.avgResolutionDays > 0 ? 3 : 0);
        return (
          <div key={d.category} className="chart-bar-row">
            <div className="chart-bar-label">{d.category}</div>
            {/* wrapper keeps track + marker in same relative context, outside overflow:hidden */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div className="chart-bar-track" style={{ height: 20, flex: 1, overflow: 'hidden', borderRadius: 6 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 6,
                    background: `linear-gradient(90deg, ${c}bb, ${c})`,
                    transition: 'width 700ms cubic-bezier(.16,1,.3,1)',
                  }}
                />
              </div>
              {overallPct != null && (
                <div
                  title={`Overall avg`}
                  style={{
                    position: 'absolute',
                    top: -4,
                    bottom: -4,
                    left: `${overallPct}%`,
                    width: 2,
                    borderRadius: 2,
                    background: 'rgba(180,180,200,0.7)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <div className="chart-bar-value">
              {fmtResolution(d.avgResolutionDays)}
            </div>
          </div>
        );
      })}
      {overall != null && (
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--ink-mute)' }} />
            Overall avg · <span className="mono" style={{ color: 'var(--ink)', marginLeft: 4 }}>{fmtResolution(overall)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Top-N ranked list ───────────────────────────────────────────────────────
export function RankList({ data = [], total }) {
  if (!data?.length) return <Empty title="Nothing to rank" />;
  return (
    <div>
      {data.map((d, i) => {
        const rank = i + 1;
        const pct = total ? Math.round((d.value / total) * 1000) / 10 : null;
        const c = CAT_COLORS[i % CAT_COLORS.length];
        return (
          <div key={d.label} className={`rank-row rank-${rank}`}>
            <div className="rank-num">#{String(rank).padStart(2, '0')}</div>
            <div>
              <div className="rank-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
                {d.label}
              </div>
              {pct != null && <div className="rank-meta">{pct}% of total</div>}
            </div>
            <div className="rank-count">{d.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────────────
export function StatusPill({ status }) {
  const cls = {
    Pending:       'pill-pending',
    'In Progress': 'pill-progress',
    InProgress:    'pill-progress',
    Resolved:      'pill-resolved',
    Rejected:      'pill-rejected',
  }[status] || 'pill-neutral';
  return <span className={`pill ${cls}`}>{status}</span>;
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function Empty({ title = 'No data', sub }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {sub && <div>{sub}</div>}
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 14, style }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export { CAT_COLORS, CAT_RES_COLORS };