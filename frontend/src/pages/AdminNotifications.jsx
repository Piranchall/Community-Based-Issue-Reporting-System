import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Notifications as NotifApi } from '../lib/api';
import { I } from '../components/Icons';
import { formatDate, shortId } from '../lib/format';

const FILTERS = [
  { k: 'all',    label: 'All' },
  { k: 'unread', label: 'Unread' },
  { k: 'read',   label: 'Read' },
];

function iconFor(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('resolved')) return { c: 'ok',   el: <I.check /> };
  if (m.includes('reject'))   return { c: 'err',  el: <I.x /> };
  if (m.includes('pending') || m.includes('overdue')) return { c: 'warn', el: <I.clock /> };
  if (m.includes('upvote'))   return { c: '',     el: <I.upvote /> };
  return { c: '', el: <I.bell /> };
}

export default function AdminNotifications() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true); setErr('');
    try {
      const r = await NotifApi.list();
      setItems(r?.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter(n => !n.isRead);
    if (filter === 'read')   return items.filter(n => n.isRead);
    return items;
  }, [items, filter]);

  const unread = items.filter(n => !n.isRead).length;

  async function onClick(n) {
    if (!n.isRead) {
      try { await NotifApi.markRead(n.id); } catch {}
      setItems(it => it.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    if (n.issueId) nav(`/admin/issues/${n.issueId}`);
  }

  async function markAllRead() {
    const un = items.filter(n => !n.isRead);
    await Promise.all(un.map(n => NotifApi.markRead(n.id).catch(() => {})));
    setItems(it => it.map(x => ({ ...x, isRead: true })));
  }

  return (
    <AppShell crumbs={['Workspace', 'Notifications']} counts={{ unread }}>
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-sub">Alerts about new reports, upvote surges, and SLA risk.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="toolbar-segment">
              {FILTERS.map(f => (
                <button key={f.k} className={filter === f.k ? 'active' : ''} onClick={() => setFilter(f.k)}>
                  {f.label}
                  {f.k === 'unread' && unread > 0 && <span style={{ marginLeft: 6, color: 'var(--acc-hi)' }}>{unread}</span>}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={markAllRead} disabled={!unread}>
              <I.check /> Mark all read
            </button>
          </div>
        </div>

        {err && <div className="banner err" style={{ marginBottom: 14 }}><I.x /> {err}</div>}

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{filtered.length} alert{filtered.length === 1 ? '' : 's'}</div>
              <div className="card-sub">Newest first</div>
            </div>
            <button className="icon-btn" onClick={load} title="Refresh"><I.refresh /></button>
          </div>
          <div className="notif-list">
            {loading && <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>}
            {!loading && filtered.length === 0 && (
              <div className="empty">
                <div className="icon"><I.bell /></div>
                <div className="title">You're all caught up</div>
                <div>No notifications match this filter.</div>
              </div>
            )}
            {!loading && filtered.map(n => {
              const ic = iconFor(n.message);
              return (
                <div key={n.id} className={`notif ${!n.isRead ? 'unread' : ''}`} onClick={() => onClick(n)}>
                  <div className={`notif-icon ${ic.c}`}>{ic.el}</div>
                  <div className="notif-body">
                    <div className="title">{n.message}</div>
                    {n.issueId && (
                      <div className="ref">
                        <span className="k">issue</span> {shortId(n.issueId)}
                      </div>
                    )}
                  </div>
                  <div className="notif-time">{formatDate(n.createdAt, { relative: true })}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
