import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminAuth } from '../lib/api';
import { saveSession } from '../lib/auth';
import { I } from '../components/Icons';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await AdminAuth.login({ email, password });
      // Backend returns { message, data: { token, admin } }
      const payload = res?.data || res;
      saveSession({ token: payload.token, admin: payload.admin });
      nav('/admin/dashboard');
    } catch (e2) {
      setErr(e2.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="app-bg" />
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div className="brand-mark"><I.logo /></div>
              <div>
                <div className="brand-name">CivicReport<span className="dot">.</span></div>
                <div className="brand-sub">Admin Console</div>
              </div>
            </div>

            <h1 className="auth-title">Welcome back.</h1>
            <p className="auth-sub">Sign in to continue triaging community issues.</p>

            <form className="auth-form" onSubmit={onSubmit}>
              <div className="field">
                <label className="field-label">Work email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@agency.gov" autoFocus required />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••" required />
              </div>

              {err && <div className="banner err"><I.x /> {err}</div>}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                {loading ? <span className="spinner" /> : <>Sign in <I.arrowRight /></>}
              </button>
            </form>

            <div className="auth-foot">
              <span>Secure admin-only access</span>
              <Link to="/admin/forgot-password" className="auth-link">Forgot password?</Link>
            </div>
          </div>
        </div>

        <div className="auth-hero">
          <span className="auth-badge"><I.ping /> Live · 3 regions online</span>
          <div>
            <h1>Keep every street, every signal, <em>accountable.</em></h1>
            <p>CivicReport is the operational layer for municipal teams resolving what citizens report — from potholes to broken streetlights.</p>
          </div>
          <div className="auth-metrics">
            <div className="auth-metric"><div className="v">12,487</div><div className="l">Issues resolved</div></div>
            <div className="auth-metric"><div className="v"><span className="acc">94</span>%</div><div className="l">SLA compliance</div></div>
            <div className="auth-metric"><div className="v">3.2<span style={{ color: 'var(--ink-3)', fontSize: 14 }}>d</span></div><div className="l">Avg. resolution</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
