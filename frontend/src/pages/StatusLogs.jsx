import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusPill from '../components/StatusPill';
import { AdminIssues, StatusLogs as StatusLogsApi } from '../lib/api';
import { I } from '../components/Icons';
import { formatDate, shortId, statusPillClass } from '../lib/format';

export default function StatusLogs() {
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    AdminIssues.list({}).then(r => {
      const list = r?.data || [];
      setIssues(list);
      if (list.length) setSelected(list[0].id);
    }).catch(e => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!selected) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    StatusLogsApi.byIssue(selected)
      .then(r => setLogs(r?.data || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  const issue = useMemo(() => issues.find(i => i.id === selected), [issues, selected]);

  return (
    <AppShell crumbs={['Workspace', 'Status logs']}>
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Status logs</h1>
            <p className="page-sub">Immutable history of every status change across reported issues.</p>
          </div>
          <button className="btn btn-ghost"><I.download /> Export log</button>
        </div>

        {err && <div className="banner err" style={{ marginBottom: 14 }}><I.x /> {err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          <div className="card" style={{ alignSelf: 'start', maxHeight: '72vh', overflow: 'auto' }}>
            <div className="card-head">
              <div>
                <div className="card-title">Issues</div>
                <div className="card-sub">{issues.length} total</div>
              </div>
            </div>
            <div>
              {issues.map(it => (
                <button key={it.id}
                  onClick={() => setSelected(it.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 16px', background: it.id === selected ? 'rgba(61,126,255,0.08)' : 'transparent',
                    border: 'none', borderTop: '1px solid var(--border-1)',
                    borderLeft: it.id === selected ? '2px solid var(--acc)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{shortId(it.id)}</span>
                    <StatusPill status={it.status} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {it.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                    {formatDate(it.updatedAt, { relative: true })}
                  </div>
                </button>
              ))}
              {issues.length === 0 && (
                <div className="empty" style={{ padding: 40 }}>
                  <div className="icon"><I.logs /></div>
                  <div className="title">No issues yet</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">{issue ? issue.title : 'Select an issue'}</div>
                {issue && <div className="card-sub">{shortId(issue.id)} · {logs.length} status change{logs.length === 1 ? '' : 's'}</div>}
              </div>
              {issue && <Link to={`/admin/issues/${issue.id}`} className="btn btn-ghost btn-sm">Open issue <I.arrowRight /></Link>}
            </div>
            <div className="card-body">
              {loading && <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>}
              {!loading && issue && (
                <LogsTable logs={logs} createdAt={issue.createdAt} />
              )}
              {!loading && !issue && (
                <div className="empty">
                  <div className="icon"><I.logs /></div>
                  <div className="title">Pick an issue on the left</div>
                  <div>Its status history will appear here.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LogsTable({ logs, createdAt }) {
  const rows = [
    { id: 'create', changedAt: createdAt, oldStatus: null, newStatus: 'Pending', remarks: 'Issue reported by citizen', admin: null, _created: true },
    ...logs,
  ];
  return (
    <div className="table-wrap" style={{ borderRadius: 10 }}>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Transition</th>
            <th>By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="num muted" style={{ whiteSpace: 'nowrap' }}>
                {formatDate(r.changedAt)}
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{formatDate(r.changedAt, { relative: true })}</div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.oldStatus && <>
                    <span className={statusPillClass(r.oldStatus)}><span className="dot" />{r.oldStatus}</span>
                    <I.arrowRight width={12} height={12} style={{ color: 'var(--ink-3)' }} />
                  </>}
                  <span className={statusPillClass(r.newStatus)}><span className="dot" />{r.newStatus}</span>
                </div>
              </td>
              <td className="muted">
                {r._created ? 'System' : (r.admin?.name || r.admin?.email || 'Admin')}
              </td>
              <td style={{ color: 'var(--ink-2)', maxWidth: 420 }}>
                {r.remarks || <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
