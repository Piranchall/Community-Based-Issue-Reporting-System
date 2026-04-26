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

// ─── Trend bar chart (Issues Over Time) ──────────────────────────────────────
export function TrendBars({ data = [], height = 220, accent = '#7CC3FF' }) {
  if (!data?.length) return <Empty title="No trend data" sub="Try widening the date range" />;
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 800;
  const H = height;
  const padX = 24;
  const padTop = 16;
  const padBottom = 32;
  const barAreaW = W - padX * 2;
  const slot = barAreaW / data.length;
  const barW = Math.max(6, Math.min(slot * 0.62, 28));

  // Y-axis ticks
  const yTicks = 4;
  const tickStep = Math.ceil(max / yTicks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="trendBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="60%" stopColor="#5B8DEF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padTop + ((H - padTop - padBottom) / yTicks) * i;
        const v = tickStep * (yTicks - i);
        return (
          <g key={i}>
            <line x1={padX} x2={W - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              fontFamily="JetBrains Mono"
              fontSize="9"
              letterSpacing="0.08em"
              fill="#6B7090"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const x = padX + slot * i + (slot - barW) / 2;
        const usableH = H - padTop - padBottom;
        const h = (d.count / (tickStep * yTicks)) * usableH;
        const y = H - padBottom - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill="url(#trendBar)">
              <title>{`${d.label}: ${d.count}`}</title>
            </rect>
          </g>
        );
      })}

      {/* x-axis labels (every Nth) */}
      {data.map((d, i) => {
        const everyN = Math.max(1, Math.floor(data.length / 8));
        if (i % everyN !== 0 && i !== data.length - 1) return null;
        const x = padX + slot * i + slot / 2;
        return (
          <text
            key={`l${i}`}
            x={x}
            y={H - 10}
            textAnchor="middle"
            fontFamily="JetBrains Mono"
            fontSize="9"
            letterSpacing="0.08em"
            fill="#6B7090"
          >
            {d.label}
          </text>
        );
      })}
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

export function ResolutionBars({ data = [], overall }) {
  if (!data?.length) return <Empty title="No resolutions yet" sub="Resolved issues will appear here" />;
  const max = Math.max(...data.map((d) => d.avgResolutionDays), overall || 0, 1);

  return (
    <div style={{ position: 'relative' }}>
      {data.map((d) => {
        const c = CAT_RES_COLORS[d.category] || '#7CC3FF';
        const pct = (d.avgResolutionDays / max) * 100;
        return (
          <div key={d.category} className="chart-bar-row">
            <div className="chart-bar-label">{d.category}</div>
            <div className="chart-bar-track" style={{ height: 12 }}>
              <div
                className="chart-bar-fill"
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${c}, ${c}cc)`,
                }}
              />
              {overall != null && (
                <div
                  title={`Overall avg: ${overall}d`}
                  style={{
                    position: 'absolute',
                    top: -3,
                    bottom: -3,
                    left: `${(overall / max) * 100}%`,
                    width: 1,
                    background: 'var(--ink-mute)',
                    boxShadow: '0 0 0 0 transparent',
                  }}
                />
              )}
            </div>
            <div className="chart-bar-value">{d.avgResolutionDays}<span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>d</span></div>
          </div>
        );
      })}
      {overall != null && (
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--ink-mute)' }} />
            Overall avg · <span className="mono" style={{ color: 'var(--ink)', marginLeft: 4 }}>{overall} days</span>
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
