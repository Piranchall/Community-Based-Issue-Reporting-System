// src/pages/EnterCode.jsx
import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icons";
import { api } from "../lib/api";

const EnterCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flowEmail = location.state?.email || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resent, setResent] = useState(false);
  const refs = useRef([]);

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      e.preventDefault();
      const next = Array.from({ length: 6 }, (_, i) => text[i] || "");
      setDigits(next);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const code = digits.join("");
  const complete = code.length === 6;

  const submit = async (e) => {
    e.preventDefault();
    if (!complete) { setErr("Please enter all 6 digits."); return; }
    // The 6-digit code is verified server-side at /api/users/reset-password
    // — we just forward it to the next step.
    navigate("/forgot-password/reset", { state: { email: flowEmail, token: code } });
  };

  const resend = async () => {
    if (!flowEmail) return;
    try {
      await api("/api/users/forgot-password", { method: "POST", body: { email: flowEmail }, auth: false });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <AuthShell variant="code">
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }}>
          <Icon name="arrowLeft" size={14} /> Back
        </a>

        <div className="auth-form-head">
          <div className="eyebrow">Step 2 of 3</div>
          <h1>Check your email.</h1>
          <p>
            We sent a 6-digit code to <b>{flowEmail || "your inbox"}</b>.
            It's valid for the next hour.
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="otp" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input key={i} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
                className={d ? "filled" : ""}
                ref={el => refs.current[i] = el}
                value={d}
                onChange={e => setDigit(i, e.target.value)}
                onKeyDown={e => onKey(i, e)}
                autoFocus={i === 0}/>
            ))}
          </div>

          {err && <div className="field err" style={{ marginBottom: 12 }}>{err}</div>}

          <button type="submit" className="auth-submit electric" disabled={loading || !complete}>
            {loading ? "Verifying…" : (<>Verify code <Icon name="arrowRight" size={16} /></>)}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#4B5A7A" }}>
          Didn't get it?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); resend(); }}
            style={{ color: "var(--electric-deep)", fontWeight: 500 }}>
            {resent ? "Sent — check your inbox" : "Resend code"}
          </a>
        </div>
      </div>
    </AuthShell>
  );
};

export default EnterCode;
