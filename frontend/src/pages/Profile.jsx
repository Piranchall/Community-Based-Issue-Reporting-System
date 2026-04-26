// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icons";
import { Button } from "../components/Primitives";
import { api } from "../lib/api";

const SecurityRow = ({ label, sub, action, danger, onAction }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderRadius: "var(--r-sm)",
    background: "rgba(255,255,255,0.02)", border: "1px solid var(--stroke-soft)"
  }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: danger ? "#F87171" : "white" }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>
    </div>
    <button onClick={onAction} className="btn ghost sm" style={danger ? { color: "#F87171", borderColor: "rgba(239,68,68,0.3)" } : {}}>
      {action}
    </button>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [original, setOriginal] = useState(form);
  const [issueCount, setIssueCount] = useState(0);
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const hydrateFromUser = (user) => {
    if (!user || typeof user !== "object") return;
    const next = {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    };
    setForm(next);
    setOriginal(next);
    setMemberSince(user.createdAt
      ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase()
      : "");
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("userData") || "null");
      hydrateFromUser(cached);
    } catch {
      // Ignore malformed cache and continue with network request.
    }

    (async () => {
      try {
        const me = await api("/api/users/profile");
        hydrateFromUser(me);
        setIssueCount(me.issueCount ?? me._count?.issues ?? 0);
        localStorage.setItem("userData", JSON.stringify(me));
      } catch (e) {
        const msg = String(e?.message || "").toLowerCase();
        if (msg.includes("token") || msg.includes("unauthorized") || msg.includes("authorization")) {
          setErr("Session expired. Showing last saved profile data. Please sign in again to refresh account details.");
        } else {
          setErr(e.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      const updated = await api("/api/users/profile", { method: "PUT", body: form });
      setOriginal(form);
      if (updated) {
        // keep any server-canonicalised fields in sync
        setForm(f => ({ ...f, ...updated }));
        try {
          const existing = JSON.parse(localStorage.getItem("userData") || "{}");
          localStorage.setItem("userData", JSON.stringify({ ...existing, ...updated }));
        } catch {
          localStorage.setItem("userData", JSON.stringify(updated));
        }
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "··";

  return (
    <div className="layout">
      <Sidebar />
      <main className="main" style={{ maxWidth: 900 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow">Account</div>
            <h1 style={{ marginTop: 8 }}>Profile.</h1>
            <div className="sub">Manage how the community sees you and how we reach you.</div>
          </div>
        </div>

        {err && <div className="field err" style={{ marginBottom: 16 }}>{err}</div>}

        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div className="avatar lg">{initials}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>
                {loading ? "Loading…" : `${form.firstName} ${form.lastName}`}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>
                {memberSince && <>MEMBER SINCE · {memberSince} · </>}{issueCount} REPORTS
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" icon="upload">Change photo</Button>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--stroke-soft)", margin: "4px 0 24px" }}/>

          <div className="row2">
            <div className="field dark">
              <label className="label">First name</label>
              <input className="input" value={form.firstName} onChange={set("firstName")}/>
            </div>
            <div className="field dark">
              <label className="label">Last name</label>
              <input className="input" value={form.lastName} onChange={set("lastName")}/>
            </div>
          </div>
          <div className="row2">
            <div className="field dark">
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set("email")}/>
            </div>
            <div className="field dark">
              <label className="label">Phone</label>
              <input className="input" type="tel" value={form.phone} onChange={set("phone")}/>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <Button variant="ghost" onClick={() => setForm(original)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Security</h2>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>
                PASSWORD · SESSIONS
              </div>
            </div>
            <Icon name="shield" size={20} style={{ color: "var(--electric-bright)" }} />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <SecurityRow label="Password" sub="Change via email reset" action="Change" onAction={() => navigate("/forgot-password")}/>
            <SecurityRow label="Active sessions" sub="Sign out of all devices" action="Sign out"
              onAction={async () => { try { await api("/api/users/logout", { method: "POST" }); } catch {} localStorage.removeItem("userToken"); navigate("/login"); }}/>
            <SecurityRow label="Delete account" sub="Permanently remove your data" action="Delete" danger
              onAction={async () => {
                if (!confirm("Permanently delete your account? This cannot be undone.")) return;
                try {
                  await api("/api/users/profile", { method: "DELETE" });
                  localStorage.removeItem("userToken");
                  navigate("/register");
                } catch (e) { setErr(e.message); }
              }}/>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
