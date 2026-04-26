// src/pages/IssueDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MiniMap from "../components/MiniMap";
import Icon from "../components/Icons";
import ImageLightbox from "../components/ImageLightbox";
import { Button, CategoryPill, StatusBadge } from "../components/Primitives";
import { api, resolveMediaUrl } from "../lib/api";

const IssueDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [posting, setPosting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [is, cs, upvoteState] = await Promise.all([
          api(`/api/issues/${id}`),
          api(`/api/comments/issue/${id}`).catch(() => []),
          api(`/api/upvotes/check/${id}`).catch(() => ({ hasUpvoted: false })),
        ]);
        const hasUpvoted = Boolean(upvoteState?.hasUpvoted ?? upvoteState?.data?.hasUpvoted);
        setIssue({ ...is, hasUpvoted });
        setComments(cs.comments || cs);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const postComment = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      const created = await api("/api/comments", { method: "POST", body: { issueId: id, text } });
      setComments(cs => [...cs, created]);
      setDraft("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setPosting(false);
    }
  };

  const toggleUpvote = async () => {
    const wasUpvoted = Boolean(issue?.hasUpvoted);
    setIssue(i => i && ({
      ...i,
      hasUpvoted: !i.hasUpvoted,
      upvoteCount: (i.upvoteCount ?? i._count?.upvotes ?? 0) + (i.hasUpvoted ? -1 : 1),
    }));
    try {
      if (wasUpvoted) {
        await api(`/api/upvotes/${id}`, { method: "DELETE" });
      } else {
        await api("/api/upvotes", { method: "POST", body: { issueId: id } });
      }
    } catch (e) { setErr(e.message); }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main"><div style={{ color: "var(--ink-500)", padding: 24 }}>Loading…</div></main>
      </div>
    );
  }
  if (!issue) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main"><div style={{ color: "var(--ink-500)", padding: 24 }}>{err || "Issue not found."}</div></main>
      </div>
    );
  }

  const upvoteCount = issue.upvoteCount ?? issue._count?.upvotes ?? 0;
  const address = issue.address || `${issue.latitude?.toFixed?.(4)}, ${issue.longitude?.toFixed?.(4)}`;
  const createdLabel = issue.timeAgo || new Date(issue.createdAt).toLocaleString();
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserInitials = `${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}`.toUpperCase() ||
    (currentUser.email?.[0] || "U").toUpperCase();

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
          style={{ fontSize: 13, color: "var(--ink-400)", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Icon name="arrowLeft" size={14} /> Back to feed
        </a>

        <div className="detail-grid">
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <CategoryPill category={issue.category} />
              <StatusBadge status={issue.status} />
              <span className="badge">
                <span className="dot" style={{ background: "var(--ink-400)" }}></span>
                ID · {String(issue.id).slice(-6).toUpperCase()}
              </span>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.15, textWrap: "balance" }}>
              {issue.title}
            </h1>
            <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)", marginBottom: 24 }}>
              <span><Icon name="pin" size={12} style={{ verticalAlign: "text-bottom", marginRight: 4 }}/>{address}</span>
              <span>·</span>
              <span><Icon name="clock" size={12} style={{ verticalAlign: "text-bottom", marginRight: 4 }}/>{createdLabel}</span>
              {issue.user && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    className="meta-link"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                    onClick={() => navigate(`/users/${issue.user.id}`)}
                  >
                    REPORTED BY · {issue.user.firstName} {issue.user.lastName?.[0]}.
                  </button>
                </>
              )}
            </div>

            <div className={`hero-img ${issue.image ? "has-image" : ""}`} style={{
              cursor: issue.image ? "zoom-in" : "default",
            }} onClick={() => issue.image && setLightboxOpen(true)}>
              {issue.image && (
                <img src={resolveMediaUrl(issue.image)} alt={issue.title || "Issue image"} className="hero-img-media" />
              )}
              {!issue.image && <div className="ph-label">NO PHOTO</div>}
            </div>

            <ImageLightbox
              open={lightboxOpen}
              src={issue.image}
              alt={issue.title || "Issue image"}
              onClose={() => setLightboxOpen(false)}
            />

            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 10px" }}>Description</h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-200)", margin: 0, maxWidth: 680 }}>
                {issue.description}
              </p>
            </div>

            <div style={{ marginTop: 36 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Community discussion</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>{comments.length} COMMENTS</span>
              </div>

              <div className="composer">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{currentUserInitials}</div>
                <textarea placeholder="Add context, confirm the issue, share an update…"
                  value={draft} onChange={e => setDraft(e.target.value)} rows={2}/>
                <Button size="sm" icon="send" onClick={postComment} disabled={posting}>
                  {posting ? "…" : "Post"}
                </Button>
              </div>

              <div style={{ marginTop: 12 }}>
                {comments.map(c => {
                  const name = c.name || `${c.user?.firstName ?? ""} ${c.user?.lastName ?? ""}`.trim();
                  const initials = c.initials || (name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase());
                  const time = c.time || new Date(c.createdAt).toLocaleString();
                  const canOpenProfile = Boolean(c.user?.id);
                  return (
                    <div key={c.id} className="comment">
                      {canOpenProfile ? (
                        <button
                          type="button"
                          className="avatar comment-avatar-link"
                          style={{ width: 36, height: 36, fontSize: 13 }}
                          onClick={() => navigate(`/users/${c.user.id}`)}
                          title={`View ${name || "user"} profile`}
                          aria-label={`View ${name || "user"} profile`}
                        >
                          {initials}
                        </button>
                      ) : (
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</div>
                      )}
                      <div>
                        <div className="comment-head">
                          {canOpenProfile ? (
                            <button
                              type="button"
                              className="comment-user-link"
                              onClick={() => navigate(`/users/${c.user.id}`)}
                            >
                              {name}
                            </button>
                          ) : (
                            <span className="name">{name}</span>
                          )}
                          <span className="time">· {time}</span>
                        </div>
                        <div className="comment-body">{c.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Community support
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 10 }}>
                <button
                  className={`upvote-btn ${issue.hasUpvoted ? "active" : ""}`}
                  style={{ width: 68, height: 80 }}
                  onClick={toggleUpvote}>
                  <Icon name="arrowUp" size={20} />
                  <span className="ucount" style={{ fontSize: 15 }}>{upvoteCount}</span>
                  <span className="ulabel">UPVOTES</span>
                </button>
                <div>
                  <div style={{ fontSize: 13, color: "var(--ink-200)", lineHeight: 1.5 }}>
                    {issue.hasUpvoted ? "You upvoted this." : "Confirm the severity."}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4, lineHeight: 1.5 }}>
                    Priority increases with upvotes and location density.
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px 12px" }}>
                <div className="chart-title" style={{ marginBottom: 4 }}>Location</div>
                <div className="chart-sub" style={{ marginBottom: 0 }}>{address}</div>
              </div>
              <MiniMap
                pins={[{
                  latitude: issue.latitude,
                  longitude: issue.longitude,
                  color: "var(--lime)",
                  label: "THIS ISSUE",
                }]}
                centerLat={Number(issue.latitude) || 47.6062}
                centerLon={Number(issue.longitude) || -122.3321}
              />
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="chart-title" style={{ marginBottom: 4 }}>Status timeline</div>
              <div className="chart-sub">AUTOMATIC · FROM ADMIN ACTIONS</div>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot done"><Icon name="check" size={14}/></div>
                  <div className="timeline-body">
                    <div className="t-title">Reported</div>
                    <div className="t-sub">{createdLabel}</div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className={`timeline-dot ${issue.status !== "Pending" ? "done" : "active"}`}>
                    {issue.status !== "Pending" ? <Icon name="check" size={14}/> : <Icon name="clock" size={14}/>}
                  </div>
                  <div className="timeline-body">
                    <div className="t-title">Under review</div>
                    <div className="t-sub">Public Works · District 3</div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className={`timeline-dot ${issue.status === "In Progress" || issue.status === "Resolved" ? "active" : ""}`}>
                    <Icon name="settings" size={13}/>
                  </div>
                  <div className="timeline-body">
                    <div className="t-title" style={{ color: issue.status === "In Progress" || issue.status === "Resolved" ? "var(--white)" : "var(--ink-500)" }}>
                      In progress
                    </div>
                    <div className="t-sub">{issue.status === "In Progress" ? "Crew dispatched" : "Pending assignment"}</div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className={`timeline-dot ${issue.status === "Resolved" ? "done" : ""}`}>
                    {issue.status === "Resolved" ? <Icon name="check" size={14}/> : <Icon name="checkCircle" size={13}/>}
                  </div>
                  <div className="timeline-body">
                    <div className="t-title" style={{ color: issue.status === "Resolved" ? "var(--white)" : "var(--ink-500)" }}>Resolved</div>
                    <div className="t-sub">{issue.status === "Resolved" ? "Confirmed closed" : "Awaiting completion"}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default IssueDetail;
