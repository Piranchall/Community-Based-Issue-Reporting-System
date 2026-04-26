// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flowEmail = location.state?.email || "";
  const flowToken = location.state?.token || "";

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const strength = (() => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  })();
  const strengthLabel = ["Too short", "Weak", "Okay", "Strong", "Excellent"][strength];
  const strengthColor = ["#EF4444", "#F59E0B", "#F5A524", "#22C55E", "#22C55E"][strength];

  const submit = async (e) => {
    e.preventDefault();
    if (pwd.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pwd !== confirm) { setErr("Passwords don't match."); return; }
    setErr("");
    setLoading(true);
    try {
      await api("/api/users/reset-password", {
        method: "POST",
        body: { email: flowEmail, token: flowToken, newPassword: pwd },
        auth: false,
      });
      navigate("/forgot-password/success");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="reset">
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <div className="auth-form-head">
          <div className="eyebrow">Step 3 of 3</div>
          <h1>Set a new password.</h1>
          <p>Pick something you haven't used before. Minimum 6 characters, but longer is stronger.</p>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">New password</label>
            <input className="input" type="password" placeholder="New password"
              value={pwd} onChange={e => setPwd(e.target.value)} autoFocus />
            {pwd && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < strength ? strengthColor : "rgba(11,18,35,0.08)",
                      transition: "background .2s"
                    }}/>
                  ))}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: strengthColor, letterSpacing: ".04em" }}>
                  {strengthLabel.toUpperCase()}
                </div>
              </div>
            )}
          </div>
          <div className="field">
            <label className="label">Confirm password</label>
            <input className="input" type="password" placeholder="Re-enter password"
              value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>

          {err && <div className="field err">{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading}>
            {loading ? "Updating…" : (<>Reset password <Icon name="check" size={16} /></>)}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default ResetPassword;

