// src/pages/MyIssues.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import IssueCard from "../components/IssueCard";
import Icon from "../components/Icons";
import { Button } from "../components/Primitives";
import { api } from "../lib/api";

const StatCard = ({ label, value, delta, color, electric }) => (
  <div className={`card stat ${electric ? "electric" : ""}`}>
    <div className="label">{label}</div>
    <div className="value" style={color ? { color } : {}}>{value}</div>
    <div className="delta" style={color ? { color } : {}}>{delta}</div>
  </div>
);

const MyIssues = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [data, myUpvotes] = await Promise.all([
          api("/api/issues"),
          api("/api/upvotes/user/my-upvotes").catch(() => []),
        ]);
        const all = Array.isArray(data) ? data : data.issues ?? data.data ?? [];
        const upvotedIssues = Array.isArray(myUpvotes) ? myUpvotes : myUpvotes.issues ?? myUpvotes.data ?? [];
        const upvotedSet = new Set(upvotedIssues.map((i) => i.id));
        // Filter to only this user's issues
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const myIssues = userData.id
          ? all.filter(i => i.userId === userData.id || i.user?.id === userData.id)
          : all;
        setMine(myIssues.map((i) => ({ ...i, hasUpvoted: upvotedSet.has(i.id) })));
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upvote = async (issue) => {
    setMine(list => list.map(i => i.id === issue.id
      ? { ...i, hasUpvoted: !i.hasUpvoted,
          upvoteCount: (i.upvoteCount ?? i._count?.upvotes ?? 0) + (i.hasUpvoted ? -1 : 1) }
      : i));
    try {
      if (issue.hasUpvoted) {
        await api(`/api/upvotes/${issue.id}`, { method: "DELETE" });
      } else {
        await api("/api/upvotes", { method: "POST", body: { issueId: issue.id } });
      }
    }
    catch (e) { setErr(e.message); }
  };

  const counts = {
    all: mine.length,
    pending: mine.filter(i => i.status === "Pending").length,
    progress: mine.filter(i => i.status === "In Progress").length,
    resolved: mine.filter(i => i.status === "Resolved").length,
  };
  const list = tab === "all" ? mine
    : tab === "pending"  ? mine.filter(i => i.status === "Pending")
    : tab === "progress" ? mine.filter(i => i.status === "In Progress")
    : mine.filter(i => i.status === "Resolved");

  return (
    <div className="layout">
      <Sidebar myIssuesCount={counts.all} />
      <main className="main">
        <div className="page-head">
          <div>
            <div className="eyebrow">Your reports</div>
            <h1 style={{ marginTop: 8 }}>My issues.</h1>
            <div className="sub">Track the status of everything you've reported to the city.</div>
          </div>
          <Button icon="plus" onClick={() => navigate("/report")}>New report</Button>
        </div>

        {err && <div className="field err" style={{ marginBottom: 16 }}>{err}</div>}

        <div className="stats-grid">
          <StatCard label="Total reports" value={counts.all} delta="this year" />
          <StatCard label="Pending" value={counts.pending} delta="under review" color="#F5A524" />
          <StatCard label="In progress" value={counts.progress} delta="being worked on" color="#5E9CFF" electric />
          <StatCard label="Resolved" value={counts.resolved} delta="closed" color="#22C55E" />
        </div>

        <div className="tabs">
          <button className={tab === "all"      ? "active" : ""} onClick={() => setTab("all")}>ALL <span className="count">{counts.all}</span></button>
          <button className={tab === "pending"  ? "active" : ""} onClick={() => setTab("pending")}>PENDING <span className="count">{counts.pending}</span></button>
          <button className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>IN PROGRESS <span className="count">{counts.progress}</span></button>
          <button className={tab === "resolved" ? "active" : ""} onClick={() => setTab("resolved")}>RESOLVED <span className="count">{counts.resolved}</span></button>
        </div>

        {loading ? (
          <div style={{ color: "var(--ink-500)", padding: 24 }}>Loading…</div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="ico"><Icon name="flag" size={22}/></div>
            <h3>Nothing here yet</h3>
            <p>You haven't filed an issue in this category. When you do, you'll see its status update here.</p>
            <Button icon="plus" onClick={() => navigate("/report")}>Report an issue</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(is => (
              <IssueCard key={is.id} issue={is}
                onOpen={(i) => navigate(`/issues/${i.id}`)}
                onUpvote={upvote} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyIssues;
