// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const body = isEmail ? { email: identifier, password } : { phone: identifier, password };
      const data = await api("/api/users/login", { method: "POST", body, auth: false });
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="login">
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <div className="auth-form-head">
          <div className="eyebrow">Sign in</div>
          <h1>Welcome back.</h1>
          <p>Report issues, rally your neighbourhood, hold authorities accountable.</p>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Email or phone</label>
            <input className="input" type="text" placeholder="amara@civic.io"
              value={identifier} onChange={e => setIdentifier(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
              Password
              <Link to="/forgot-password" style={{ color: "var(--electric-deep)", fontWeight: 500, textDecoration: "none" }}>
                Forgot?
              </Link>
            </label>
            <div style={{ position: "relative" }}>
              <input className="input" type={show ? "text" : "password"} placeholder="••••••••••"
                style={{ width: "100%", paddingRight: 42 }}
                value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)}
                style={{ position: "absolute", right: 12, top: 12, color: "#8A98B5" }}>
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          {err && <div className="field err">{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading}>
            {loading ? "Signing in…" : (<>Sign in <Icon name="arrowRight" size={16} /></>)}
          </button>
        </form>

        <div className="auth-alt" style={{ textAlign: "center", marginTop: 32 }}>
          New here?{" "}
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Login;
