// src/pages/Notifications.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icons";
import { Button } from "../components/Primitives";
import { api } from "../lib/api";

const Notifications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/users/notifications");
        setItems(Array.isArray(data) ? data : data.notifications ?? data.data ?? []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isUnreadNotification = (item) => {
    if (typeof item.unread === "boolean") return item.unread;
    if (typeof item.isRead === "boolean") return !item.isRead;
    return !item.readAt;
  };

  const unread = items.filter(isUnreadNotification).length;

  const markAll = async () => {
    const unreadIds = items
      .filter(isUnreadNotification)
      .map(i => i.id);

    setItems(items.map(i => ({ ...i, unread: false, isRead: true, readAt: i.readAt || new Date().toISOString() })));

    try {
      await Promise.all(unreadIds.map(id => api(`/api/users/notifications/${id}`, { method: "PUT" })));
    } catch (e) {
      setErr(e.message);
    }
  };

  const markOne = async (id) => {
    setItems(items.map(i => i.id === id ? { ...i, unread: false, isRead: true, readAt: i.readAt || new Date().toISOString() } : i));
    try { await api(`/api/users/notifications/${id}`, { method: "PUT" }); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div className="layout">
      <Sidebar unreadCount={unread} />
      <main className="main">
        <div className="page-head">
          <div>
            <div className="eyebrow">Activity · {unread} unread</div>
            <h1 style={{ marginTop: 8 }}>Notifications.</h1>
            <div className="sub">Status updates, comments, and community activity on your issues.</div>
          </div>
          <Button variant="ghost" icon="check" onClick={markAll}>Mark all read</Button>
        </div>

        {err && <div className="field err" style={{ marginBottom: 16 }}>{err}</div>}

        {loading ? (
          <div style={{ color: "var(--ink-500)", padding: 24 }}>Loading…</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {items.map(n => {
              const isUnread = isUnreadNotification(n);
              return (
                <div key={n.id} className={`notif ${isUnread ? "unread" : ""}`}
                  onClick={() => { markOne(n.id); if (n.issueId) navigate(`/issues/${n.issueId}`); }}>
                  <div className="n-ico"><Icon name={n.icon || "bell"} size={18}/></div>
                  <div className="n-body">
                    <div className="n-title">Issue status update</div>
                    <div className="n-sub">{n.message || n.sub || n.body}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isUnread && <span className="n-unread-dot"></span>}
                    <span className="n-time">{n.time || new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
