import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { AdminAuth } from '../lib/api';
import { I } from '../components/Icons';

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

export default function CreateAdmin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = scorePassword(pw);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setSuccess('');
    if (pw.length < 8) return setErr('Password must be at least 8 characters.');
    if (strength.score < 2) return setErr('Please choose a stronger password.');
    if (pw !== pw2) return setErr('Passwords do not match.');
    setLoading(true);
    try {
      await AdminAuth.register({ name, email, password: pw });
      setSuccess(`Admin account created for ${email}.`);
      setName('');
      setEmail('');
      setPw('');
      setPw2('');
    } catch (e2) {
      setErr(e2.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell crumbs={['Workspace', 'Team', 'Add Admin']}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Add admin account</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>
            Create a new admin who can triage and manage community issues.
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form className="auth-form" onSubmit={onSubmit} style={{ gap: 18 }}>
            <div className="field">
              <label className="field-label">Full name</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Smith" autoFocus required />
            </div>
            <div className="field">
              <label className="field-label">Work email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jane@agency.gov" required />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)}
                placeholder="••••••••••" required />
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
              <input className="input" type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                placeholder="••••••••••" required />
            </div>

            {err     && <div className="banner err"><I.x />     {err}</div>}
            {success && <div className="banner ok"><I.check /> {success}</div>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}
              style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : <>Create admin <I.arrowRight /></>}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
