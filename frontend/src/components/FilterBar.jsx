import { Icon } from './Icon.jsx';

const RANGES = [
  { value: '7d',  label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

const CATEGORIES = ['Garbage', 'Water', 'Road', 'Electricity', 'Other'];
const STATUSES   = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
// Mock area set — backend treats area as free-form 'address contains'
const AREAS      = ['Sector 4', 'Zone B', 'Park Avenue', 'Lane 3', 'Riverside', 'Old Town'];

export function FilterBar({
  range, setRange,
  category, setCategory,
  status, setStatus,
  area, setArea,
  onClear,
  onApply,
  showAreas = true,
  showCategory = true,
  showStatus = true,
  rightSlot,
}) {
  const hasFilters = range !== '30d' || category || status || area;

  return (
    <div className="filter-bar">
      <span className="field-label" style={{ marginLeft: 4 }}>
        <Icon name="filter" size={11} style={{ marginRight: 6, verticalAlign: '-1px' }} />
        Filters
      </span>

      <div className="filter-group">
        <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {showCategory && (
        <div className="filter-group">
          <select className="select" value={category || ''} onChange={(e) => setCategory(e.target.value || null)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {showStatus && (
        <div className="filter-group">
          <select className="select" value={status || ''} onChange={(e) => setStatus(e.target.value || null)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {showAreas && (
        <div className="filter-group">
          <select className="select" value={area || ''} onChange={(e) => setArea(e.target.value || null)}>
            <option value="">All Areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {hasFilters && onClear && (
        <button className="btn btn-ghost" onClick={onClear}>
          <Icon name="close" size={12} /> Clear
        </button>
      )}

      <div style={{ flex: 1 }} />

      {rightSlot}

      {onApply && (
        <button className="btn btn-primary" onClick={onApply}>
          Apply Filters
        </button>
      )}
    </div>
  );
}

export { RANGES, CATEGORIES, STATUSES, AREAS };
