import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './AdminForgotPassowrd';
import { AdminAuth } from '../lib/api';
import { I } from '../components/Icons';

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = scorePassword(pw);
  const email = sessionStorage.getItem('reset_email') || '';
  const token = sessionStorage.getItem('reset_code') || '';

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (pw.length < 8) return setErr('Password must be at least 8 characters.');
    if (pw !== pw2) return setErr('Passwords do not match.');
    setLoading(true);
    try {
      await AdminAuth.resetPassword({ email, token, newPassword: pw });
      sessionStorage.removeItem('reset_code');
      nav('/admin/reset-success');
    } catch (e2) {
      setErr(e2.message || 'Could not reset password');
    } finally { setLoading(false); }
  }

  return (
    <AuthShell step={2}>
      <h1 className="auth-title">Set a new password</h1>
      <p className="auth-sub">Choose something memorable. Minimum 8 characters — mix casing, numbers, symbols.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label">New password</label>
          <input className="input" type="password" autoFocus required value={pw} onChange={e => setPw(e.target.value)} />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 3,
                background: i < strength.score ? strength.color : 'var(--bg-3)',
                transition: 'background .2s',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
            Strength: <span style={{ color: strength.color }}>{strength.label}</span>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Confirm password</label>
          <input className="input" type="password" required value={pw2} onChange={e => setPw2(e.target.value)} />
        </div>
        {err && <div className="banner err"><I.x /> {err}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <>Update password <I.lock /></>}
        </button>
      </form>
      <div className="auth-foot">
        <Link to="/login" className="auth-link"><I.arrowLeft /> Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

function scorePassword(p) {
  if (!p) return { score: 0, label: '—', color: 'var(--ink-4)' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const map = [
    { label: 'Very weak', color: 'var(--st-rejected-fg)' },
    { label: 'Weak',      color: 'var(--st-pending-fg)' },
    { label: 'Okay',      color: 'var(--st-pending-fg)' },
    { label: 'Strong',    color: 'var(--st-progress-fg)' },
    { label: 'Excellent', color: 'var(--st-resolved-fg)' },
  ];
  return { score: s, ...map[s] };
}