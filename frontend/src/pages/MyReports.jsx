import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout.jsx';
import { Card } from './AnalyticsOverview.jsx';
import { Skeleton, Empty } from '../components/Charts.jsx';
import { Icon } from '../components/Icon.jsx';
import { CATEGORIES, STATUSES, RANGES, AREAS } from '../components/FilterBar.jsx';
import { reports, downloadCsv, dateRangeToFilters } from '../lib/api.js';

export default function MyReports() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => {
    setLoading(true);
    reports.list()
      .then((d) => { setList(d || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this saved report? This cannot be undone.')) return;
    try { await reports.remove(id); refresh(); } catch (e) { alert(e.message); }
  };

  const handleDownload = async (r) => {
    try {
      const csv = await reports.download(r.id);
      downloadCsv(csv, `report_${r.id}_${(r.title || 'report').replace(/[^a-z0-9_-]/gi, '_')}.csv`);
    } catch (e) { alert(e.message); }
  };

  return (
    <Layout role="admin" user={{ name: 'Hussain' }} crumbs={['Admin', 'My Reports']}>
      <div className="page-head">
        <div className="title-block">
          <span className="eyebrow">Admin · Saved Exports</span>
          <h1 className="h1">My Reports</h1>
          <div className="muted" style={{ fontSize: 13.5 }}>
            Persist filtered analytics snapshots as CSV reports — re-download or regenerate later.
          </div>
        </div>
        <div className="row gap-12">
          <button className="btn btn-primary" onClick={() => { setEditing(null); setCreateOpen(true); }}>
            <Icon name="plus" size={13} /> New Report
          </button>
        </div>
      </div>

      <Card title="Saved Reports" sub={`${list.length} total`}
        right={<button className="btn btn-ghost" onClick={refresh}>Refresh</button>}
      >
        {loading ? (
          <div className="col gap-12">
            <Skeleton width="100%" height={50} />
            <Skeleton width="100%" height={50} />
            <Skeleton width="100%" height={50} />
          </div>
        ) : list.length === 0 ? (
          <Empty
            title="No saved reports yet"
            sub="Capture a filtered snapshot of your analytics with the New Report button above."
          />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th>Filters</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div className="mono dim" style={{ fontSize: 10, letterSpacing: '0.08em', marginTop: 2 }}>
                      ID · {String(r.id).slice(0, 8)}
                    </div>
                  </td>
                  <td>
                    <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                      {summarizeFilters(r.filters).map((f) => (
                        <span key={f} className="chip" style={{ fontSize: 10 }}>{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="mono dim" style={{ fontSize: 12 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => handleDownload(r)} title="Download CSV">
                        <Icon name="download" size={13} /> Download
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(r); setCreateOpen(true); }} title="Edit">
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="btn btn-danger btn-icon" onClick={() => handleDelete(r.id)} title="Delete">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ReportFormModal
        open={createOpen}
        editing={editing}
        onClose={() => { setCreateOpen(false); setEditing(null); }}
        onSaved={() => { setCreateOpen(false); setEditing(null); refresh(); }}
      />
    </Layout>
  );
}

function summarizeFilters(f = {}) {
  const out = [];
  if (f.category) out.push(f.category);
  if (f.status)   out.push(f.status);
  if (f.area)     out.push(f.area);
  if (f.dateFrom || f.dateTo) {
    out.push(`${f.dateFrom?.slice(5) || '…'} → ${f.dateTo?.slice(5) || '…'}`);
  }
  if (out.length === 0) out.push('All issues');
  return out;
}

// ─── Create / Edit Modal ─────────────────────────────────────────────────────
function ReportFormModal({ open, onClose, onSaved, editing }) {
  const [title, setTitle]       = useState('');
  const [range, setRange]       = useState('30d');
  const [category, setCategory] = useState('');
  const [status, setStatus]     = useState('');
  const [area, setArea]         = useState('');
  const [working, setWorking]   = useState(false);
  const [err, setErr]           = useState(null);
  const [regenerate, setRegen]  = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '');
      setCategory(editing?.filters?.category || '');
      setStatus(editing?.filters?.status || '');
      setArea(editing?.filters?.area || '');
      setRange('30d');
      setErr(null);
      setRegen(false);
    }
  }, [open, editing]);

  if (!open) return null;

  const handleSave = async () => {
    setWorking(true); setErr(null);
    try {
      const filters = {
        ...dateRangeToFilters(range),
        ...(category ? { category } : {}),
        ...(status   ? { status   } : {}),
        ...(area     ? { area     } : {}),
      };
      if (editing) {
        await reports.update(editing.id, { title, filters, regenerate });
      } else {
        await reports.create({ title: title || 'Untitled report', filters });
      }
      onSaved?.();
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally { setWorking(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-sub">{editing ? 'Edit Report' : 'New Saved Report'}</div>
            <div className="modal-title">{editing ? editing.title : 'Capture Analytics Snapshot'}</div>
            <div className="dim" style={{ fontSize: 12.5, marginTop: 6 }}>
              Reports persist the filter config and a generated CSV at creation time.
            </div>
          </div>
          <button className="close-x" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="field-label">Title</div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. April Garbage Issues — Sector 4"
            style={{ width: '100%' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
            <Field label="Date Range">
              <select className="select" value={range} onChange={(e) => setRange(e.target.value)} style={{ width: '100%' }}>
                {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Area">
              <select className="select" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Areas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          {editing && (
            <label className="row gap-8" style={{ marginTop: 18, cursor: 'pointer' }}>
              <div className={'cb' + (regenerate ? ' checked' : '')}
                onClick={() => setRegen((v) => !v)}>
                {regenerate && <Icon name="check" size={12} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Regenerate CSV with current data</div>
                <div className="dim mono" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
                  Re-runs the export against today's dataset
                </div>
              </div>
            </label>
          )}

          {err && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(242,109,109,0.08)', border: '1px solid rgba(242,109,109,0.3)', borderRadius: 8, color: 'var(--status-rejected)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {err}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <span className="dim mono" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            {editing ? 'PUT /api/reports/:id' : 'POST /api/reports'}
          </span>
          <div className="row gap-8">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={working} onClick={handleSave}>
              {working ? 'Saving…' : editing ? 'Save Changes' : 'Create Report'}
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
