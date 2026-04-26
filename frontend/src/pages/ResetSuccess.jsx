// src/pages/ResetSuccess.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";

const ResetSuccess = () => {
  const navigate = useNavigate();
  return (
    <AuthShell variant="success">
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          margin: "0 auto 24px",
          background: "linear-gradient(135deg, #22C55E, #15803D)",
          display: "grid", placeItems: "center",
          boxShadow: "0 14px 40px -10px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
          position: "relative"
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5L20 6"/>
          </svg>
          <div style={{
            position: "absolute", inset: -6, borderRadius: 24,
            border: "1.5px solid rgba(34,197,94,0.3)"
          }}/>
        </div>

        <div className="eyebrow" style={{ color: "#15803D", justifyContent: "center", display: "inline-flex" }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "#22C55E", marginRight: 8 }}></span>
          Done
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", margin: "12px 0 10px", lineHeight: 1.1 }}>
          Password Reset!
        </h1>
        <p style={{ color: "#4B5A7A", fontSize: 14, margin: "0 0 32px", lineHeight: 1.55 }}>
          Your password was updated successfully. Sign in with your new password to continue.
        </p>

        <button type="button" className="auth-submit electric" onClick={() => navigate("/login")}>
          Continue to sign in <Icon name="arrowRight" size={16} />
        </button>

        <div style={{ marginTop: 32, padding: "12px 16px", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 12, color: "#15803D", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
          <span style={{ opacity: 0.7 }}>SECURITY NOTE · </span>
          You've been signed out of all devices. Sign back in on each.
        </div>
      </div>
    </AuthShell>
  );
};

export default ResetSuccess;

