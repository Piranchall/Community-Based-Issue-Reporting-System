import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAuth } from '../lib/api';
import { I } from '../components/Icons';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await AdminAuth.forgotPassword({ email });
      sessionStorage.setItem('reset_email', email);
      nav('/admin/enter-code');
    } catch (e2) {
      setErr(e2.message || 'Could not send code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell step={0}>
      <h1 className="auth-title">Forgot password</h1>
      <p className="auth-sub">Enter the email tied to your admin account. We'll send a 6-digit code.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label">Work email</label>
          <input className="input" type="email" autoFocus required
            value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.gov" />
        </div>
        {err && <div className="banner err"><I.x /> {err}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <>Send code <I.mail /></>}
        </button>
      </form>
      <div className="auth-foot">
        <Link to="/admin/login" className="auth-link"><I.arrowLeft /> Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

/* Shared 2-column shell for all 4 reset screens */
export function AuthShell({ step, children }) {
  return (
    <>
      <div className="app-bg" />
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div className="brand-mark"><I.logo /></div>
              <div>
                <div className="brand-name">CivicReport<span className="dot">.</span></div>
                <div className="brand-sub">Password Recovery</div>
              </div>
            </div>
            <div className="step-track">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`seg ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              ))}
            </div>
            {children}
          </div>
        </div>
        <div className="auth-hero">
          <span className="auth-badge"><I.shield /> Encrypted recovery flow</span>
          <div>
            <h1>Recovery is a matter of <em>minutes</em>, not days.</h1>
            <p>Time-boxed one-hour codes, delivered to your registered email. No SMS fallbacks, no shared secrets.</p>
          </div>
          <div className="auth-metrics">
            <div className="auth-metric"><div className="v">6<span style={{ color: 'var(--ink-3)', fontSize: 14 }}>-digit</span></div><div className="l">Code</div></div>
            <div className="auth-metric"><div className="v">60<span style={{ color: 'var(--ink-3)', fontSize: 14 }}>min</span></div><div className="l">Expiry</div></div>
            <div className="auth-metric"><div className="v"><span className="acc">1</span>x</div><div className="l">Use</div></div>
          </div>
        </div>
      </div>
    </>
  );
}