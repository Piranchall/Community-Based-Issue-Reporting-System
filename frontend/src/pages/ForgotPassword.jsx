// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email) { setErr("Please enter your email."); return; }
    setErr("");
    setLoading(true);
    try {
      await api("/api/users/forgot-password", { method: "POST", body: { email }, auth: false });
      // Pass email forward via router state so EnterCode / ResetPassword can read it.
      navigate("/forgot-password/code", { state: { email } });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="forgot">
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
          <Icon name="arrowLeft" size={14} /> Back to sign in
        </a>

        <div className="auth-form-head">
          <div className="eyebrow">Password recovery</div>
          <h1>Forgot your password?</h1>
          <p>No worries. Enter the email linked to your account and we'll send a 6-digit code to reset it.</p>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="amara@civic.io"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>

          {err && <div className="field err">{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading}>
            {loading ? "Sending code…" : (<>Send reset code <Icon name="mail" size={16} /></>)}
          </button>
        </form>

        <div className="auth-alt" style={{ textAlign: "center", marginTop: 32, color: "#8A98B5", fontSize: 12 }}>
          The code expires in 1 hour. Check your spam folder if you don't see it.
        </div>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;


