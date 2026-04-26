import React from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './ForgotPassword';
import { I } from '../components/Icons';

export default function ResetSuccess() {
  return (
    <AuthShell step={3}>
      <div className="success-mark">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="auth-title" style={{ textAlign: 'center' }}>Password reset!</h1>
      <p className="auth-sub" style={{ textAlign: 'center' }}>You can now sign in with your new password. All previous sessions have been revoked.</p>
      <Link to="/admin/login" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 12 }}>
        Continue to sign in <I.arrowRight />
      </Link>
    </AuthShell>
  );
}