import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ImageLightbox from '../components/ImageLightbox';
import StatusPill from '../components/StatusPill';
import { AdminIssues, StatusLogs } from '../lib/api';
import { resolveMediaUrl } from '../lib/api';
import { I } from '../components/Icons';
import { formatDate, STATUSES, shortId, statusPillClass } from '../lib/format';
import { getAdmin } from '../lib/auth';
import { buildGoogleEmbedUrl, hasGoogleMapsKey } from '../lib/maps';

// Derive priority from upvote count — no priority field in DB
function derivePriority(upvoteCount = 0) {
  if (upvoteCount >= 20) return 'High';
  if (upvoteCount >= 10) return 'Medium';
  return 'Low';
}

function PriorityBadge({ upvoteCount }) {
  const p = derivePriority(upvoteCount);
  const colors = {
    High:   { bg: '#e53e3e', color: '#fff' },
    Medium: { bg: '#dd6b20', color: '#fff' },
    Low:    { bg: '#38a169', color: '#fff' },
  };
  const { bg, color } = colors[p];
  return (
    <span style={{
      background: bg, color, fontWeight: 700, fontSize: 12,
      padding: '3px 12px', borderRadius: 20,
    }}>{p}</span>
  );
}

const AUTHORITIES = [
  'Sanitation Dept. – Zone A',
  'Sanitation Dept. – Zone B',
  'Electricity Dept. – Zone A',
  'Electricity Dept. – Zone B',
  'Roads & Infrastructure',
  'Water & Sewerage Dept.',
  'Parks & Recreation',
  'General Municipal Services',
];

export default function IssueDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const admin = getAdmin();

  const [issue, setIssue]   = useState(null);
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState('');

  const [newStatus, setNewStatus]   = useState('');
  const [remarks, setRemarks]       = useState('');
  const [authority, setAuthority]   = useState(AUTHORITIES[0]);
  const [saving, setSaving]         = useState(false);

  // Success screen state
  const [successData, setSuccessData] = useState(null);
  const hasEvidence = Boolean(issue?.image && String(issue.image).trim());
  const [lightboxOpen, setLightboxOpen] = useState(false);

  async function load() {
    setLoading(true); setErr('');
    try {
      const [i, l] = await Promise.all([
        AdminIssues.get(id),
        StatusLogs.byIssue(id),
      ]);
      setIssue(i?.data || null);
      setLogs(l?.data || []);
      setNewStatus(i?.data?.status || '');
    } catch (e) {
      setErr(e.message || 'Failed to load issue');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function onUpdate(e) {
    e.preventDefault();
    setErr('');
    if (!newStatus || newStatus === issue.status) {
      return setErr('Pick a different status to update.');
    }
    setSaving(true);
    try {
      // Include authority in remarks so it's persisted in the status log
      const fullRemarks = authority
        ? `[${authority}] ${remarks}`.trim()
        : remarks;
      await AdminIssues.update(id, { newStatus, remarks: fullRemarks });

      // Count upvoters to show on success screen
      const upvoterCount = issue.upvoteCount ?? 0;
      const reporterName = issue.user
        ? `${issue.user.firstName || ''} ${issue.user.lastName?.[0] || ''}.`.trim()
        : 'the reporter';

      setSuccessData({
        issueId: shortId(issue.id),
        newStatus,
        remarks,
        authority,
        adminName: admin?.name || 'Admin',
        upvoterCount,
        reporterName,
        timestamp: new Date(),
      });
    } catch (e2) {
      setErr(e2.message || 'Update failed');
    } finally { setSaving(false); }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (successData) {
    return (
      <AppShell crumbs={['Workspace', 'Issues', 'Status Updated']}>
        <div className="page" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
          {/* Green check circle */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(72,187,120,0.15)', border: '2px solid #48bb78',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <span style={{ fontSize: 36 }}>✅</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Issue Status Updated Successfully
          </h1>
          <p style={{ color: 'var(--ink-3)', marginBottom: 32 }}>
            The status has been recorded and affected citizens have been notified automatically.
          </p>

          {/* Summary card */}
          <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
            <div className="card-body">
              {[
                { label: 'Issue ID',        value: successData.issueId },
                { label: 'New Status',      value: <StatusPill status={successData.newStatus} /> },
                { label: 'Remarks',         value: successData.remarks || '—' },
                { label: 'Updated By',      value: `Admin: ${successData.adminName}` },
                { label: 'Responsible Dept.', value: successData.authority },
                { label: 'Timestamp',       value: formatDate(successData.timestamp) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 0', borderBottom: '1px solid var(--border-1)',
                  gap: 16,
                }}>
                  <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification banner */}
          <div style={{
            background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.4)',
            borderRadius: 10, padding: '14px 20px', marginBottom: 32,
            color: '#276749', fontSize: 14, textAlign: 'left',
          }}>
            📩 Notifications sent to: {successData.reporterName} (reporter)
            {successData.upvoterCount > 0 && ` and ${successData.upvoterCount} citizen${successData.upvoterCount === 1 ? '' : 's'} who upvoted this issue.`}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => nav('/admin/dashboard')}>
              Back to All Issues
            </button>
            <button className="btn btn-ghost" onClick={() => { setSuccessData(null); load(); }}>
              View Issue Detail
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Resolved transparency view ───────────────────────────────────────────────
  if (!loading && issue && issue.status === 'Resolved') {
    const resolutionLog = [...logs].reverse().find(l => l.newStatus === 'Resolved');
    const resolvedAt    = resolutionLog?.changedAt;
    const resolvedBy    = resolutionLog?.admin?.name || resolutionLog?.admin?.email || 'Admin';
    const resolutionNote = resolutionLog?.remarks || '';

    // Parse authority from remarks if stored as [Authority] remarks
    const authorityMatch = resolutionNote.match(/^\[(.+?)\]/);
    const displayAuthority = authorityMatch ? authorityMatch[1] : 'Municipal Authority';
    const displayNote      = resolutionNote.replace(/^\[.+?\]\s*/, '') || 'Issue has been resolved.';

    // Calc total resolution time
    let resolutionTime = '';
    if (issue.createdAt && resolvedAt) {
      const ms   = new Date(resolvedAt) - new Date(issue.createdAt);
      const days = Math.floor(ms / 86400000);
      const hrs  = Math.floor((ms % 86400000) / 3600000);
      resolutionTime = `${days > 0 ? `${days} day${days !== 1 ? 's' : ''}, ` : ''}${hrs} hour${hrs !== 1 ? 's' : ''}`;
    }

    return (
      <AppShell crumbs={['Workspace', 'Issues', shortId(issue.id)]}>
        <div className="page">
          <h1 className="page-title" style={{ marginBottom: 16 }}>Issue {shortId(issue.id)}</h1>

          {/* Green transparency banner */}
          <div style={{
            background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.4)',
            borderRadius: 10, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#276749', fontSize: 14 }}>
              ✅ This issue has been resolved. It remains publicly visible for transparency.
            </span>
            <StatusPill status="Resolved" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Issue Details */}
            <div className="card">
              <div className="card-head"><div className="card-title">Issue Details</div></div>
              <div className="card-body">
                {[
                  { label: 'Title',       value: issue.title },
                  { label: 'Category',    value: issue.category },
                  { label: 'Location',    value: issue.address || '—' },
                  { label: 'Reported By', value: `${issue.user?.firstName || ''} ${issue.user?.lastName?.[0] || ''}.`.trim() },
                  { label: 'Upvotes',     value: `▲ ${issue.upvoteCount ?? 0}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border-1)',
                  }}>
                    <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Status Timeline */}
            <div className="card">
              <div className="card-head"><div className="card-title">Full Status Timeline</div></div>
              <div className="card-body" style={{ padding: 10 }}>
                <Timeline logs={logs} currentStatus={issue.status} createdAt={issue.createdAt} />
                {resolutionTime && (
                  <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '10px 12px' }}>
                    Total Resolution Time: {resolutionTime}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            {/* Resolution Notes */}
            <div className="card">
              <div className="card-head"><div className="card-title">Resolution Notes</div></div>
              <div className="card-body">
                <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>
                  {displayNote}
                </p>
              </div>
            </div>

            {/* Responsible Authority */}
            <div className="card">
              <div className="card-head"><div className="card-title">Responsible Authority</div></div>
              <div className="card-body">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{displayAuthority}</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
                  Admin: {resolvedBy} | Updated: {resolvedAt ? new Date(resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => nav('/admin/dashboard')}>
              Back to All Issues
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Standard admin review view ───────────────────────────────────────────────
  return (
    <AppShell crumbs={['Workspace', 'Issues', issue ? shortId(issue.id) : '—']}>
      <div className="page">
        <div className="page-head">
          <div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }} onClick={() => nav(-1)}>
              <I.arrowLeft /> Back
            </button>
            <h1 className="page-title">
              {issue?.title || (loading ? 'Loading…' : 'Issue not found')}
            </h1>
            <p className="page-sub">
              {issue && (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{shortId(issue.id)}</span>
                  {' · '}Reported {formatDate(issue.createdAt)}
                </>
              )}
            </p>
          </div>
          {issue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusPill status={issue.status} />
              <span className="upvote-chip"><I.upvote width={12} height={12} /> {issue.upvoteCount ?? 0} upvotes</span>
            </div>
          )}
        </div>

        {err && <div className="banner err" style={{ marginBottom: 14 }}><I.x /> {err}</div>}

        {issue && (
          <div className="detail-grid">
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Summary card */}
              <div className="card">
                <div className="card-head"><div className="card-title">Summary</div></div>
                <div className="card-body">
                  {[
                    { label: 'Category',    value: issue.category },
                    { label: 'Title',       value: issue.title },
                    { label: 'Description', value: issue.description },
                    { label: 'Location',    value: issue.address || '—' },
                    { label: 'Reported By', value: `${issue.user?.firstName || 'Anonymous'} ${issue.user?.lastName?.[0] || ''}.  (${issue.user?.email || ''})`.trim() },
                    { label: 'Report Date', value: formatDate(issue.createdAt) },
                    { label: 'Upvotes',     value: `${issue.upvoteCount ?? 0} community votes` },
                    { label: 'Priority',    value: <PriorityBadge upvoteCount={issue.upvoteCount} /> },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '10px 0', borderBottom: '1px solid var(--border-1)', gap: 16,
                    }}>
                      <span style={{ color: 'var(--ink-3)', fontSize: 14, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hasEvidence && (
                <div className="card">
                  <div className="card-head"><div className="card-title">Uploaded Evidence</div></div>
                  <div className="card-body">
                    <div style={{
                      border: '2px dashed var(--border-2)', borderRadius: 10,
                      padding: '16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13,
                    }}>
                      <img
                        src={resolveMediaUrl(issue.image)}
                        alt="Evidence"
                        style={{ maxWidth: '100%', borderRadius: 8, cursor: 'zoom-in' }}
                        onClick={() => setLightboxOpen(true)}
                      />
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location on Map */}
              <div className="card">
                <div className="card-head"><div className="card-title">Location on Map</div></div>
                <div className="card-body" style={{ padding: 0 }}>
                  <MapCard issue={issue} />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Status History */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Status History</div>
                  </div>
                  <Link to="/admin/status-logs" className="auth-link" style={{ fontSize: 12 }}>
                    View all <I.arrowRight width={12} height={12} />
                  </Link>
                </div>
                <div className="card-body" style={{ padding: 10 }}>
                  <Timeline logs={logs} currentStatus={issue.status} createdAt={issue.createdAt} />
                </div>
              </div>

              {/* Admin Action */}
              <div className="card">
                <div className="card-head"><div className="card-title">Admin Action</div></div>
                <div className="card-body">
                  <form onSubmit={onUpdate} style={{ display: 'grid', gap: 16 }}>
                    <div className="field">
                      <label className="field-label">Update Status</label>
                      <select className="select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Quick action buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary" style={{ fontSize: 13, flex: '1 1 150px' }}
                        onClick={() => setNewStatus('In Progress')}>
                        Mark in Progress
                      </button>
                      <button type="button" className="btn" style={{ background: '#38a169', color: '#fff', fontSize: 13, flex: '1 1 130px' }}
                        onClick={() => setNewStatus('Resolved')}>
                        Mark Resolved
                      </button>
                      <button type="button" className="btn" style={{ background: '#e53e3e', color: '#fff', fontSize: 13, flex: '1 1 120px' }}
                        onClick={() => setNewStatus('Rejected')}>
                        Reject Issue
                      </button>
                    </div>

                    <div className="field">
                      <label className="field-label">Admin Remarks / Resolution Notes</label>
                      <textarea className="textarea" value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Enter remarks, resolution details, or rejection reason…"
                        rows={4} />
                    </div>

                    <div className="field">
                      <label className="field-label">Assigned Authority</label>
                      <select className="select" value={authority} onChange={e => setAuthority(e.target.value)}>
                        {AUTHORITIES.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </div>

                    {err && <div className="banner err"><I.x /> {err}</div>}

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                      {saving ? <span className="spinner" /> : 'Save & Update Status'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {issue?.image && (
          <ImageLightbox
            open={lightboxOpen}
            src={issue.image}
            alt={issue.title || 'Uploaded evidence'}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    </AppShell>
  );
}

export function Timeline({ logs, currentStatus, createdAt }) {
  const events = [
    { type: 'created', when: createdAt },
    ...logs.map(l => ({
      type: l.newStatus, when: l.changedAt, old: l.oldStatus,
      remarks: l.remarks, admin: l.admin,
    })),
  ];
  const dotClass = (s) => {
    if (s === 'Pending' || s === 'created') return 't-dot t-dot-pending';
    if (s === 'In Progress') return 't-dot t-dot-progress';
    if (s === 'Resolved')    return 't-dot t-dot-resolved';
    if (s === 'Rejected')    return 't-dot t-dot-rejected';
    return 't-dot';
  };
  const title = (e) => {
    if (e.type === 'created') return 'Issue reported';
    if (e.old) return <>{`Moved from `}<span className={statusPillClass(e.old)}><span className="dot"/>{e.old}</span>{` to `}<span className={statusPillClass(e.type)}><span className="dot"/>{e.type}</span></>;
    return <>{`Status set to `}<span className={statusPillClass(e.type)}><span className="dot"/>{e.type}</span></>;
  };
  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div className="t-item" key={i}>
          <div className={dotClass(e.type)}>
            {e.type === 'created'     ? <I.sparkle /> :
             e.type === 'Resolved'    ? <I.check />   :
             e.type === 'Rejected'    ? <I.x />       :
             e.type === 'In Progress' ? <I.clock />   : <I.dot />}
          </div>
          <div className="t-body">
            <div className="t-title">{title(e)}</div>
            <div className="t-when">{formatDate(e.when)} · {formatDate(e.when, { relative: true })}</div>
            {e.remarks && <div className="t-remark">"{e.remarks}"</div>}
            {e.admin && <div className="t-who">by {e.admin.name || e.admin.email}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MapCard({ issue }) {
  const lat = Number(issue?.latitude);
  const lng = Number(issue?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapUrl = buildGoogleEmbedUrl({
    lat,
    lng,
    query: issue?.address || 'Karachi, Pakistan',
    zoom: 15,
  });

  return (
    <div style={{
      position: 'relative', aspectRatio: '4 / 3',
      background: 'linear-gradient(160deg, #0A1026, #0B0F1A)',
      borderRadius: 'inherit', overflow: 'hidden',
    }}>
      <iframe
        title="Issue location map"
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: '100%', height: '100%', border: 0 }}
      />
      <div style={{
        position: 'absolute', left: 12, bottom: 12,
        background: 'rgba(7,9,15,0.7)', border: '1px solid var(--border-2)',
        borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11.5,
        color: 'var(--ink-2)', backdropFilter: 'blur(6px)',
      }}>
        {hasCoords ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Coordinates unavailable'}<br/>
        <span style={{ color: 'var(--ink-3)' }}>{issue.address || 'Address unknown'}</span>
      </div>
      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: 'rgba(7,9,15,0.7)', border: '1px solid var(--border-2)',
        borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'var(--ink-3)',
      }}>
        {hasGoogleMapsKey() ? 'Google Maps API' : 'Google Maps fallback'}
      </div>
    </div>
  );
}