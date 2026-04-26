import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import IssueCard from "../components/IssueCard";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const UserProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("uploaded");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = JSON.parse(localStorage.getItem("userData") || "null");
        if (me?.id && me.id === id) {
          navigate("/profile", { replace: true });
          return;
        }

        const data = await api(`/api/users/${id}/public`);
        setProfile(data);
      } catch (e) {
        setErr(e.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const displayName = useMemo(() => {
    const first = profile?.user?.firstName || "";
    const last = profile?.user?.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || "Community Member";
  }, [profile]);

  const initials = useMemo(() => {
    const first = profile?.user?.firstName?.[0] || "";
    const last = profile?.user?.lastName?.[0] || "";
    const joined = `${first}${last}`.toUpperCase();
    return joined || displayName.slice(0, 1).toUpperCase();
  }, [profile, displayName]);

  const uploaded = profile?.uploadedIssues || [];
  const upvoted = profile?.upvotedIssues || [];
  const visibleList = tab === "uploaded" ? uploaded : upvoted;

  const toggleUpvote = async (issue) => {
    const wasUpvoted = Boolean(issue?.hasUpvoted);
    const update = (list) => list.map((i) => {
      if (i.id !== issue.id) return i;
      const nextActive = !i.hasUpvoted;
      const nextCount = (i.upvoteCount ?? i._count?.upvotes ?? 0) + (nextActive ? 1 : -1);
      return { ...i, hasUpvoted: nextActive, upvoteCount: nextCount };
    });

    setProfile((prev) => prev ? {
      ...prev,
      uploadedIssues: update(prev.uploadedIssues || []),
      upvotedIssues: update(prev.upvotedIssues || [])
    } : prev);

    try {
      if (wasUpvoted) {
        await api(`/api/upvotes/${issue.id}`, { method: "DELETE" });
      } else {
        await api("/api/upvotes", { method: "POST", body: { issueId: issue.id } });
      }
    } catch (e) {
      setErr(e.message || "Failed to update upvote");
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <div className="eyebrow">Community profile</div>
            <h1 style={{ marginTop: 8 }}>User activity.</h1>
            <div className="sub">View reports uploaded and reports upvoted by this resident.</div>
          </div>
        </div>

        {err && <div className="field err" style={{ marginBottom: 16 }}>{err}</div>}

        {loading ? (
          <div style={{ color: "var(--ink-500)", padding: 24 }}>Loading profile…</div>
        ) : !profile ? (
          <div style={{ color: "var(--ink-500)", padding: 24 }}>Profile not found.</div>
        ) : (
          <>
            <div className="card" style={{ padding: 24, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="avatar lg">{initials}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--white)" }}>{displayName}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>
                    MEMBER SINCE · {profile.user.createdAt ? new Date(profile.user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase() : "—"}
                  </div>
                </div>
              </div>

              <div className="stats-grid" style={{ marginTop: 18, marginBottom: 0 }}>
                <div className="card stat" style={{ padding: 16 }}>
                  <div className="label">Reports uploaded</div>
                  <div className="value">{profile.user._count?.issues ?? uploaded.length}</div>
                </div>
                <div className="card stat" style={{ padding: 16 }}>
                  <div className="label">Reports upvoted</div>
                  <div className="value" style={{ color: "#5E9CFF" }}>{profile.user._count?.upvotes ?? upvoted.length}</div>
                </div>
                <div className="card stat" style={{ padding: 16 }}>
                  <div className="label">Uploaded listed</div>
                  <div className="value">{uploaded.length}</div>
                </div>
                <div className="card stat" style={{ padding: 16 }}>
                  <div className="label">Upvoted listed</div>
                  <div className="value">{upvoted.length}</div>
                </div>
              </div>
            </div>

            <div className="tabs">
              <button className={tab === "uploaded" ? "active" : ""} onClick={() => setTab("uploaded")}>
                UPLOADED REPORTS <span className="count">{uploaded.length}</span>
              </button>
              <button className={tab === "upvoted" ? "active" : ""} onClick={() => setTab("upvoted")}>
                UPVOTED REPORTS <span className="count">{upvoted.length}</span>
              </button>
            </div>

            {!visibleList.length ? (
              <div className="empty">
                <div className="ico"><Icon name="flag" size={22} /></div>
                <h3>No reports to show</h3>
                <p>This user has no items in this section yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibleList.map((issue) => (
                  <IssueCard
                    key={`${tab}-${issue.id}`}
                    issue={issue}
                    onOpen={(i) => navigate(`/issues/${i.id}`)}
                    onUpvote={toggleUpvote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
