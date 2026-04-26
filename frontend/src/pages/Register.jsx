// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await api("/api/users/register", { method: "POST", body: form, auth: false });
      localStorage.setItem("userToken", data.token);
      navigate("/dashboard");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="register">
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <div className="auth-form-head">
          <div className="eyebrow">Create account</div>
          <h1>Join your community.</h1>
          <p>One account. Report issues, upvote, and track status across your city.</p>
        </div>

        <form onSubmit={submit}>
          <div className="row2">
            <div className="field">
              <label className="label">First name</label>
              <input className="input" placeholder="Amara" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div className="field">
              <label className="label">Last name</label>
              <input className="input" placeholder="Reyes" value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="amara@civic.io" value={form.email} onChange={set("email")} />
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input className="input" type="tel" placeholder="+1 (555) 010-4829" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="8+ characters" value={form.password} onChange={set("password")} />
            <span className="hint">At least 8 characters. Avoid common passwords.</span>
          </div>

          {err && <div className="field err">{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading}>
            {loading ? "Creating account…" : (<>Create account <Icon name="arrowRight" size={16} /></>)}
          </button>
        </form>

        <div className="auth-alt" style={{ textAlign: "center", marginTop: 24 }}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Register;
