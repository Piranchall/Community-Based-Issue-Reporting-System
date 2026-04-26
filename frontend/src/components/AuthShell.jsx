// src/components/AuthShell.jsx
import React from "react";
import { CategoryPill, StatusBadge } from "./Primitives";

const AuthShell = ({ children, variant = "default" }) => {
  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="auth-brand">
          <div className="brand-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 L20 7 V13 C20 17 16 20 12 21 C8 20 4 17 4 13 V7 Z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="name">CivicReport</div>
            <small>COMMUNITY · ACCOUNTABILITY</small>
          </div>
        </div>

        <div className="auth-visual">
          <div className="auth-visual-inner">
            <AuthVisual variant={variant} />
          </div>
        </div>

        <div className="auth-foot">
          <span>SOC 2 Type II</span>
          <span>·</span>
          <span>GovCloud Ready</span>
          <span>·</span>
          <span>v3.0</span>
        </div>
      </div>
      <div className="auth-panel">
        {children}
      </div>
    </div>
  );
};

const AuthVisual = ({ variant }) => {
  return (
    <div style={{ position: "relative", height: 440 }}>
      <div className="stat-tile" style={{ position: "absolute", left: 0, top: 0, width: 260 }}>
        <div className="label">Issues Resolved · 30d</div>
        <div className="value">2,184</div>
        <div className="delta">▲ 14.2% vs last period</div>
        <svg width="100%" height="52" viewBox="0 0 260 52" style={{ marginTop: 8 }}>
          <defs>
            <linearGradient id="sp1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5E9CFF" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#5E9CFF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0 40 L20 35 L40 38 L60 28 L80 32 L100 22 L120 26 L140 18 L160 22 L180 14 L200 18 L220 10 L240 14 L260 6 L260 52 L0 52 Z" fill="url(#sp1)"/>
          <path d="M0 40 L20 35 L40 38 L60 28 L80 32 L100 22 L120 26 L140 18 L160 22 L180 14 L200 18 L220 10 L240 14 L260 6" fill="none" stroke="#5E9CFF" strokeWidth="1.5"/>
        </svg>
      </div>

      <div className="stat-tile" style={{ position: "absolute", right: 0, top: 40, width: 200 }}>
        <div className="label">Avg. Response</div>
        <div className="value" style={{ color: "#C9F23E" }}>38h</div>
        <div className="delta">▼ 12h faster</div>
      </div>

      <div className="stat-tile" style={{ position: "absolute", left: 40, top: 220, width: 300 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <CategoryPill category="Water" />
          <StatusBadge status="In Progress" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "white", marginBottom: 4 }}>
          Water main leaking at 14th &amp; Oak
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>
          47.608° N, 122.335° W · 142 upvotes
        </div>
      </div>

      <div className="stat-tile" style={{ position: "absolute", right: 20, bottom: 0, width: 220 }}>
        <div className="label">Community Support</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
          <div className="value" style={{ color: "#C9F23E", fontSize: 28 }}>12,847</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>upvotes</div>
        </div>
        <div style={{ display: "flex", marginTop: 10 }}>
          {["MR", "JP", "KT", "AL", "+"].map((a, i) => (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: "50%",
              background: i === 4 ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${["#5E9CFF","#C9F23E","#F59E0B","#A78BFA"][i]}, ${["#3E7BFA","#A8D61F","#D97706","#7C3AED"][i]})`,
              border: "2px solid #0E1629",
              display: "grid", placeItems: "center",
              fontSize: 9, fontWeight: 600,
              color: i === 4 ? "var(--ink-400)" : (i === 1 ? "#0B1223" : "white"),
              marginLeft: i ? -8 : 0,
              fontFamily: "var(--font-mono)",
            }}>{a}</div>
          ))}
        </div>
      </div>

      <svg style={{ position: "absolute", left: -40, top: 140, opacity: 0.5 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3E7BFA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    </div>
  );
};

export default AuthShell;
