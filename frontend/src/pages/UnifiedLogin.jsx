import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";
import { saveSession, saveUserSession } from "../lib/auth";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const isAdminPath = location.pathname.startsWith('/admin');
  const forgotPath = isAdminPath ? '/admin/forgot-password' : '/forgot-password';

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { identifier, password },
        auth: false,
      });

      if (data.role === 'admin') {
        saveSession({ token: data.token, admin: data.admin });
        navigate('/admin/dashboard');
        return;
      }

      saveUserSession({ token: data.token, user: data.user });
      navigate('/dashboard');
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="login">
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <div className="auth-form-head">
          <div className="eyebrow">Sign in</div>
          <h1>Welcome back.</h1>
          <p>Use your credentials and we will route you to the correct workspace automatically.</p>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Email or phone</label>
            <input
              className="input"
              type="text"
              placeholder="yourname@civicreport.pk or 03XXXXXXXXX"
              value={identifier}
              onChange={(ev) => setIdentifier(ev.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={show ? "text" : "password"}
                placeholder="Enter your secure CivicReport password"
                style={{ width: "100%", paddingRight: 42 }}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                style={{ position: "absolute", right: 12, top: 12, color: "#8A98B5" }}
                aria-label={show ? "Hide password" : "Show password"}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <Link to={forgotPath} style={{ color: "var(--electric-deep)", fontWeight: 500, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {err && <div className="field err">{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading}>
            {loading ? "Signing in…" : <>Sign in <Icon name="arrowRight" size={16} /></>}
          </button>
        </form>

        <div className="auth-alt" style={{ textAlign: "center", marginTop: 32 }}>
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </AuthShell>
  );
}
