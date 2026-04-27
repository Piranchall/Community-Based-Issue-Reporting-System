import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './AdminForgotPassowrd';
import { I } from '../components/Icons';

export default function EnterCode() {
  const nav = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);
  const email = sessionStorage.getItem('reset_email') || '';
  const masked = email.replace(/(.{1}).+(@.+)/, '$1•••••$2');

  function onChange(i, v) {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  }
  function onKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }
  function onPaste(e) {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!txt) return;
    const n = Array.from({ length: 6 }, (_, i) => txt[i] || '');
    setDigits(n);
    refs.current[Math.min(txt.length, 5)]?.focus();
    e.preventDefault();
  }

  const code = digits.join('');
  const ready = code.length === 6;

  function onSubmit(e) {
    e.preventDefault();
    if (!ready) return;
    sessionStorage.setItem('reset_code', code);
    nav('/admin/reset-password');
  }

  return (
    <AuthShell step={1}>
      <h1 className="auth-title">Check your email</h1>
      <p className="auth-sub">We sent a 6-digit code to <strong style={{ color: 'var(--ink-1)' }}>{masked || 'your email'}</strong>. It expires in 60 minutes.</p>
      <form className="auth-form" onSubmit={onSubmit} onPaste={onPaste}>
        <div className="otp">
          {digits.map((d, i) => (
            <input key={i}
              ref={el => refs.current[i] = el}
              value={d}
              onChange={e => onChange(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              inputMode="numeric" maxLength={1} autoFocus={i === 0} />
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!ready}>
          Verify code <I.arrowRight />
        </button>
      </form>
      <div className="auth-foot">
        <Link to="/admin/forgot-password" className="auth-link"><I.arrowLeft /> Use a different email</Link>
        <button className="auth-link" style={{ background: 'none', border: 0 }}>Resend</button>
      </div>
    </AuthShell>
  );
}