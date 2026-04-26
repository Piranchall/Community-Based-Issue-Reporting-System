import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { analytics, downloadCsv, dateRangeToFilters } from '../lib/api.js';
import { CATEGORIES, STATUSES, AREAS, RANGES } from './FilterBar.jsx';

const ALL_COLUMNS = [
  { key: 'issueId',        label: 'Issue ID',          desc: 'Unique identifier',         required: true  },
  { key: 'category',       label: 'Category',          desc: 'Garbage, Water, Road…',     required: false },
  { key: 'locationArea',   label: 'Location / Area',   desc: 'Neighborhood or sector',    required: false },
  { key: 'status',         label: 'Status',            desc: 'Pending / In Progress / Resolved', required: false },
  { key: 'reportDate',     label: 'Report Date',       desc: 'Date issue was submitted',  required: false },
  { key: 'resolutionDate', label: 'Resolution Date',   desc: 'Only for resolved issues',  required: false },
  { key: 'upvoteCount',    label: 'Upvote Count',      desc: 'Community upvotes received',required: false },
];

export function ExportCsvModal({ open, onClose, initialFilters = {} }) {
  const [range, setRange]         = useState('30d');
  const [category, setCategory]   = useState(initialFilters.category || '');
  const [status, setStatus]       = useState('');
  const [area, setArea]           = useState('');
  const [columns, setColumns]     = useState(ALL_COLUMNS.map((c) => c.key));
  const [working, setWorking]     = useState(false);
  const [err, setErr]             = useState(null);

  if (!open) return null;

  const toggle = (key) => {
    const col = ALL_COLUMNS.find((c) => c.key === key);
    if (col?.required) return;
    setColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleExport = async () => {
    setWorking(true);
    setErr(null);
    try {
      const filters = {
        ...dateRangeToFilters(range),
        ...(category ? { category } : {}),
        ...(status   ? { status   } : {}),
        ...(area     ? { area     } : {}),
      };
      const csv = await analytics.exportCsv(filters, columns);
      const filename = `civicreport_export_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(csv, filename);
      onClose?.();
    } catch (e) {
      setErr(e.message || 'Export failed');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <div>
            <div className="modal-sub">Workflow 3 · Data Export</div>
            <div className="modal-title">Export CSV</div>
            <div className="dim" style={{ fontSize: 12.5, marginTop: 6 }}>
              Stream a filtered slice of the issue dataset as a CSV file.
            </div>
          </div>
          <button className="close-x" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div className="modal-body">
          {/* Filters row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
            <Field label="Date Range">
              <select className="select" value={range} onChange={(e) => setRange(e.target.value)} style={{ width: '100%' }}>
                {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Status Filter">
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Area">
              <select className="select" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Areas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="field-label" style={{ margin: 0 }}>Columns to Include</span>
            <div className="row gap-8">
              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setColumns(ALL_COLUMNS.map((c) => c.key))}>All</button>
              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setColumns(ALL_COLUMNS.filter((c) => c.required).map((c) => c.key))}>None</button>
            </div>
          </div>

          <div className="col-list">
            {ALL_COLUMNS.map((c) => {
              const checked = columns.includes(c.key);
              return (
                <div
                  key={c.key}
                  className={'col-row' + (checked ? ' checked' : '')}
                  onClick={() => toggle(c.key)}
                >
                  <div className="col-main">
                    <div className={'cb' + (checked ? ' checked' : '')}>
                      {checked && <Icon name="check" size={12} />}
                    </div>
                    <div>
                      <div className="col-name">{c.label}</div>
                      <div className="col-desc">{c.desc}</div>
                    </div>
                  </div>
                  {c.required && <span className="chip" style={{ fontSize: 9 }}>Required</span>}
                </div>
              );
            })}
          </div>

          {err && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'rgba(242, 109, 109, 0.08)',
              border: '1px solid rgba(242, 109, 109, 0.3)',
              borderRadius: 8,
              color: 'var(--status-rejected)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}>{err}</div>
          )}
        </div>

        <div className="modal-foot">
          <div className="dim mono" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            {columns.length} of {ALL_COLUMNS.length} columns selected
          </div>
          <div className="row gap-8">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={working || columns.length === 0} onClick={handleExport}>
              <Icon name="download" size={13} />
              {working ? 'Exporting…' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

export { ALL_COLUMNS };
