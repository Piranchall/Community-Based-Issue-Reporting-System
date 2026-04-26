export function formatDate(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (opts.relative) return relTime(d);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function relTime(d) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24); if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

export const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export function statusPillClass(status) {
  switch (status) {
    case 'Pending':     return 'pill pill-pending';
    case 'In Progress': return 'pill pill-progress';
    case 'Resolved':    return 'pill pill-resolved';
    case 'Rejected':    return 'pill pill-rejected';
    default:            return 'pill';
  }
}

export function shortId(id) {
  if (!id) return '';
  return `#${String(id).slice(-6).toUpperCase()}`;
}
