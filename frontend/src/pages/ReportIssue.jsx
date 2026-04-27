// src/pages/ReportIssue.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MiniMap from "../components/MiniMap";
import Icon from "../components/Icons";
import { Button, CategoryPill, StatusBadge, categoryColor, categoryIcon } from "../components/Primitives";
import { apiForm } from "../lib/api";

const CATEGORIES = [
  { name: "Garbage",     desc: "Uncollected trash, dumping, overflowing bins." },
  { name: "Water",       desc: "Leaks, flooding, drainage, water quality." },
  { name: "Electricity", desc: "Streetlights, power outages, exposed wires." },
  { name: "Road",        desc: "Potholes, signage, signals, traffic hazards." },
  { name: "Other",       desc: "Anything else that needs civic attention." },
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", address: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [pin, setPin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    setErr("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", cat);
      if (pin) {
        const lat = 47.6 + (pin.y / 100 - 0.5) * -0.03;
        const lon = -122.33 + (pin.x / 100 - 0.5) * 0.04;
        fd.append("latitude", pin.latitude ?? lat);
        fd.append("longitude", pin.longitude ?? lon);
      }
      if (form.address) fd.append("address", form.address);
      if (photoFile) fd.append("image", photoFile);

      await apiForm("/api/issues", fd);
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) setPhotoFile(f);
  };

  const selectedLat = pin
    ? (pin.latitude ?? 47.6 + (pin.y / 100 - 0.5) * -0.03)
    : null;
  const selectedLon = pin
    ? (pin.longitude ?? -122.33 + (pin.x / 100 - 0.5) * 0.04)
    : null;

  const StepsBar = (
    <div className="stepper">
      <div className={`step ${step >= 0 ? "active" : ""} ${step > 0 ? "done" : ""}`}>
        <div className="num">{step > 0 ? "✓" : "1"}</div>Category
      </div>
      <div className={`step-conn ${step > 0 ? "done" : ""}`}/>
      <div className={`step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
        <div className="num">{step > 1 ? "✓" : "2"}</div>Details
      </div>
      <div className={`step-conn ${step > 1 ? "done" : ""}`}/>
      <div className={`step ${step >= 2 ? "active" : ""} ${step > 2 ? "done" : ""}`}>
        <div className="num">{step > 2 ? "✓" : "3"}</div>Location
      </div>
      <div className={`step-conn ${step > 2 ? "done" : ""}`}/>
      <div className={`step ${step >= 3 ? "active" : ""}`}>
        <div className="num">4</div>Review
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <div className="eyebrow">New report</div>
            <h1 style={{ marginTop: 8 }}>Report an issue.</h1>
            <div className="sub">One report can surface a problem your whole neighbourhood is living with.</div>
          </div>
          <Button variant="ghost" icon="arrowLeft" onClick={() => navigate("/dashboard")}>Cancel</Button>
        </div>

        {StepsBar}

        {step === 0 && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>What kind of issue is this?</h2>
            <p style={{ color: "var(--ink-500)", fontSize: 13, margin: "0 0 20px" }}>
              Choose the category that best matches. This helps route your report to the right team.
            </p>
            <div className="category-grid">
              {CATEGORIES.map(c => {
                const col = categoryColor(c.name);
                return (
                  <button key={c.name}
                    className={`card cat-card ${cat === c.name ? "selected" : ""}`}
                    onClick={() => setCat(c.name)}>
                    <div className="icon-wrap" style={{ "--c-bg": col.bg, "--c-fg": col.fg, "--c-bd": col.bd }}>
                      <Icon name={categoryIcon(c.name)} size={20} />
                    </div>
                    <div>
                      <div className="cname">{c.name}</div>
                      <div className="cdesc">{c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <Button disabled={!cat} iconRight="arrowRight" onClick={next}>Continue</Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Describe the issue</h2>
            <p style={{ color: "var(--ink-500)", fontSize: 13, margin: "0 0 20px" }}>
              Specific titles get action faster. Describe what, where exactly, and why it needs attention.
            </p>

            <div className="card" style={{ padding: 24 }}>
              <div className="field dark">
                <label className="label">Title</label>
                <input className="input" placeholder="Overflowing garbage bins blocking sidewalk on Pine St"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <span className="hint" style={{ color: "var(--ink-500)" }}>{form.title.length}/120</span>
              </div>
              <div className="field dark">
                <label className="label">Description</label>
                <textarea className="input" rows="6"
                  placeholder="What's happening? Who's affected? How long has it been like this?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="field dark" style={{ marginBottom: 0 }}>
                <label className="label">Photo <span style={{ color: "var(--ink-500)" }}>(optional, max 5 MB)</span></label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickPhoto}/>
                {photoFile ? (
                  <div className="photo-preview" style={{
                    background: "linear-gradient(135deg, #1D2845, #0B1223)",
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(94,156,255,0.08) 0 8px, transparent 8px 16px)"
                  }}>
                    <div className="filename">{photoFile.name}</div>
                    <button className="remove" onClick={() => setPhotoFile(null)}><Icon name="x" size={14}/></button>
                  </div>
                ) : (
                  <div className="uploader" onClick={() => fileRef.current?.click()}>
                    <div className="ico"><Icon name="upload" size={22} /></div>
                    <div className="title">Drop a photo or click to upload</div>
                    <div className="sub">JPEG, PNG, HEIC · UP TO 5 MB</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <Button variant="ghost" icon="arrowLeft" onClick={back}>Back</Button>
              <Button disabled={!form.title || !form.description} iconRight="arrowRight" onClick={next}>Continue</Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Pin the location</h2>
            <p style={{ color: "var(--ink-500)", fontSize: 13, margin: "0 0 20px" }}>
              Click on the map to place a pin, or use your current location.
            </p>
            <MiniMap pickable selected={pin} onPick={setPin} tall showOverlayCoords={false} />
            <div style={{
              marginTop: 14, padding: "14px 18px",
              border: "1px solid var(--stroke-soft)", borderRadius: "var(--r-md)",
              background: "rgba(255,255,255,0.02)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{pin ? "Pin placed" : "No location yet"}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                  {pin ? "Address entered below" : "Click the map or use your location"}
                </div>
              </div>
              <div className="field dark" style={{ marginBottom: 0, width: 280 }}>
                <input className="input" placeholder="Address (optional)"
                  value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
                  {pin
                    ? `LAT ${selectedLat.toFixed(4)} · LON ${selectedLon.toFixed(4)}`
                    : "LAT -- · LON --"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <Button variant="ghost" icon="arrowLeft" onClick={back}>Back</Button>
              <Button disabled={!pin} iconRight="arrowRight" onClick={next}>Continue</Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Review and submit</h2>
            <p style={{ color: "var(--ink-500)", fontSize: 13, margin: "0 0 20px" }}>
              Your report will be public immediately. You can edit or delete it anytime.
            </p>

            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <CategoryPill category={cat} />
                <StatusBadge status="Pending" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>TITLE</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "white" }}>{form.title}</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ fontSize: 14, color: "var(--ink-200)", lineHeight: 1.6 }}>{form.description}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>LOCATION</div>
                  <div style={{ fontSize: 13, color: "var(--ink-200)" }}>{form.address || "—"}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                    {pin ? `${selectedLat.toFixed(4)}° N, ${selectedLon.toFixed(4)}° W` : ""}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>PHOTO</div>
                  <div style={{ fontSize: 13, color: "var(--ink-200)" }}>{photoFile?.name || "No photo attached"}</div>
                </div>
              </div>
            </div>

            {err && <div className="field err" style={{ marginTop: 12 }}>{err}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <Button variant="ghost" icon="arrowLeft" onClick={back} disabled={submitting}>Back</Button>
              <Button variant="primary" iconRight="arrowRight" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit report"}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReportIssue;
