import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { I } from '../components/Icons';
import { getAdmin } from '../lib/auth';
import { AdminAuth } from '../lib/api';
import { formatDate } from '../lib/format';

export default function AdminProfile() {
  const nav = useNavigate();
  const admin = getAdmin() || {};
  const initials = (admin.name || admin.email || 'A')
    .split(/\s+|@/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr, setPwErr] = useState('');
  const [pwOk, setPwOk] = useState('');

  async function onChangePassword(e) {
    e.preventDefault();
    setPwErr(''); setPwOk('');
    if (pwForm.newPw.length < 8) return setPwErr('New password must be at least 8 characters.');
    if (pwForm.newPw !== pwForm.confirm) return setPwErr('Passwords do not match.');
    setPwLoading(true);
    try {
      await AdminAuth.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwOk('Password updated successfully.');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) {
      setPwErr(e.message || 'Failed to update password.');
    } finally { setPwLoading(false); }
  }

  return (
    <AppShell crumbs={['Admin', 'My Profile']}>
      <div className="page">
        <div className="page-head">
          <div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }} onClick={() => nav(-1)}>
              <I.arrowLeft /> Back
            </button>
            <h1 className="page-title">My Profile</h1>
            <p className="page-sub">Your admin account details</p>
          </div>
        </div>

        <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Profile card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Account Details</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 0 20px', borderBottom: '1px solid var(--border-1)', marginBottom: 16 }}>
                <div className="avatar" style={{ width: 56, height: 56, borderRadius: 14, fontSize: 20 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 17 }}>{admin.name || 'Administrator'}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Administrator</div>
                </div>
              </div>

              {/* Fields */}
              {[
                { label: 'Name',  value: admin.name  || '—' },
                { label: 'Email', value: admin.email || '—' },
                { label: 'Role',  value: admin.role  || 'admin' },
                { label: 'Member since', value: admin.createdAt ? formatDate(admin.createdAt) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border-1)',
                }}>
                  <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{label}</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change password card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Change Password</div>
            </div>
            <div className="card-body">
              <form onSubmit={onChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">Current password</label>
                  <input className="input" type="password" value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    placeholder="Enter current password" />
                </div>
                <div className="field">
                  <label className="field-label">New password</label>
                  <input className="input" type="password" value={pwForm.newPw}
                    onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                    placeholder="Min 8 characters" />
                </div>
                <div className="field">
                  <label className="field-label">Confirm new password</label>
                  <input className="input" type="password" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter new password" />
                </div>
                {pwErr && <div className="banner err"><I.x /> {pwErr}</div>}
                {pwOk  && <div className="banner"><I.check /> {pwOk}</div>}
                <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ justifyContent: 'center' }}>
                  {pwLoading ? <span className="spinner" /> : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
