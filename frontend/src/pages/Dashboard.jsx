// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import IssueCard from "../components/IssueCard";
import MiniMap from "../components/MiniMap";
import Icon from "../components/Icons";
import { Button } from "../components/Primitives";
import { api } from "../lib/api";

const USER_LOCATION_KEY = "userLocationPreference";
const DEFAULT_CENTER = { latitude: 47.6062, longitude: -122.3321 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const readStoredLocation = () => {
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const hasCoords = Number.isFinite(Number(parsed.latitude)) && Number.isFinite(Number(parsed.longitude));
    if (!parsed.area && !hasCoords) return null;
    return {
      area: parsed.area ? String(parsed.area) : "",
      latitude: hasCoords ? Number(parsed.latitude) : null,
      longitude: hasCoords ? Number(parsed.longitude) : null,
    };
  } catch {
    return null;
  }
};

const geocodeArea = async (area) => {
  const q = area.trim();
  if (!q) return null;

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
      const res = await fetch(url);
      const json = await res.json();
      const point = json?.results?.[0]?.geometry?.location;
      if (Number.isFinite(point?.lat) && Number.isFinite(point?.lng)) {
        return { latitude: Number(point.lat), longitude: Number(point.lng) };
      }
    } catch {
      // Fall through to open geocoding fallback.
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "Accept": "application/json" } }
    );
    const json = await res.json();
    const point = json?.[0];
    if (Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lon))) {
      return { latitude: Number(point.lat), longitude: Number(point.lon) };
    }
  } catch {
    return null;
  }

  return null;
};

const reverseGeocode = async ({ latitude, longitude }) => {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return "";

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${latitude},${longitude}`)}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
      const res = await fetch(url);
      const json = await res.json();
      const addr = json?.results?.[0]?.address_components;
      if (Array.isArray(addr)) {
        const pick = (...types) => {
          const part = addr.find((c) => Array.isArray(c.types) && types.some((t) => c.types.includes(t)));
          return part?.long_name || "";
        };
        const area = pick("sublocality", "neighborhood", "locality") || json?.results?.[0]?.formatted_address || "";
        if (area) return area;
      }
    } catch {
      // Fall through to open reverse geocoding fallback.
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      { headers: { "Accept": "application/json" } }
    );
    const json = await res.json();
    const a = json?.address || {};
    return a.suburb || a.neighbourhood || a.city_district || a.city || a.town || a.village || json?.display_name || "";
  } catch {
    return "";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("30d");
  const [issues, setIssues] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationErr, setLocationErr] = useState("");

  const RANGE_OPTIONS = [
    { key: "7d", label: "7d", days: 7, sub: "LAST 7 DAYS" },
    { key: "30d", label: "30d", days: 30, sub: "LAST 30 DAYS" },
    { key: "90d", label: "90d", days: 90, sub: "LAST 90 DAYS" },
    { key: "all", label: "All", days: null, sub: "ALL TIME" },
  ];

  const selectedRange = RANGE_OPTIONS.find((r) => r.key === range) || RANGE_OPTIONS[1];

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      setLocationData(stored);
      setLocationInput(stored.area || "");
      return;
    }
    setLocationPromptOpen(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [list, notifs, myUpvotes] = await Promise.all([
          api("/api/issues"),
          api("/api/users/notifications/unread-count").catch(() => ({ count: 0 })),
          api("/api/upvotes/user/my-upvotes").catch(() => []),
        ]);
        const allIssues = Array.isArray(list) ? list : list.issues ?? list.data ?? [];
        const upvotedIssues = Array.isArray(myUpvotes) ? myUpvotes : myUpvotes.issues ?? myUpvotes.data ?? [];
        const upvotedSet = new Set(upvotedIssues.map((i) => i.id));
        setIssues(allIssues.map((i) => ({ ...i, hasUpvoted: upvotedSet.has(i.id) })));
        setUnreadCount(notifs.count ?? 0);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upvote = async (issue) => {
    // Optimistic
    setIssues(list => list.map(i => i.id === issue.id
      ? { ...i, hasUpvoted: !i.hasUpvoted,
          upvoteCount: (i.upvoteCount ?? i._count?.upvotes ?? 0) + (i.hasUpvoted ? -1 : 1) }
      : i));
    try {
      if (issue.hasUpvoted) {
        await api(`/api/upvotes/${issue.id}`, { method: "DELETE" });
      } else {
        await api("/api/upvotes", { method: "POST", body: { issueId: issue.id } });
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveLocationPreference = (payload) => {
    const normalized = {
      area: payload.area?.trim() || "",
      latitude: Number.isFinite(Number(payload.latitude)) ? Number(payload.latitude) : null,
      longitude: Number.isFinite(Number(payload.longitude)) ? Number(payload.longitude) : null,
    };
    localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(normalized));
    setLocationData(normalized);
    setLocationInput(normalized.area || "");
    setLocationPromptOpen(false);
    setLocationErr("");
  };

  const submitManualArea = async () => {
    const area = locationInput.trim();
    if (!area) {
      setLocationErr("Enter your area name or use current location.");
      return;
    }
    setLocationBusy(true);
    const geo = await geocodeArea(area);
    saveLocationPreference({ ...locationData, area, ...(geo || {}) });
    setLocationBusy(false);
    if (!geo) {
      setLocationErr("Area saved, but we could not fetch its coordinates. Map centering may be approximate.");
      setLocationPromptOpen(true);
    }
  };

  const useCurrentLocation = async () => {
    setLocationErr("");
    const host = window.location.hostname;
    const secureEnough = window.isSecureContext || host === "localhost" || host === "127.0.0.1";
    if (!secureEnough) {
      setLocationErr("Location access requires HTTPS (or localhost). Open this app with HTTPS and try again.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationErr("Geolocation is not supported in this browser.");
      return;
    }

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setLocationErr("Location permission is blocked in browser settings. Enable it and try again.");
          return;
        }
      } catch {
        // Continue with geolocation call if permissions API is unavailable.
      }
    }

    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const resolvedArea = await reverseGeocode({ latitude, longitude });
        const fallbackArea = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
        saveLocationPreference({
          area: resolvedArea || locationInput.trim() || fallbackArea,
          latitude,
          longitude,
        });
        setLocationBusy(false);
      },
      (geoError) => {
        const reason = {
          1: "Location permission was denied. Please allow access in your browser.",
          2: "Location is unavailable right now. Check GPS/network and try again.",
          3: "Location request timed out. Please try again.",
        }[geoError?.code] || "Could not read your location. Allow permission and try again.";
        setLocationErr(reason);
        setLocationBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const mapCenterLat = Number.isFinite(locationData?.latitude) ? locationData.latitude : DEFAULT_CENTER.latitude;
  const mapCenterLon = Number.isFinite(locationData?.longitude) ? locationData.longitude : DEFAULT_CENTER.longitude;
  const mapCoordText = `${Number(mapCenterLat).toFixed(4)}° N, ${Number(mapCenterLon).toFixed(4)}° W`;
  const areaLabel = locationData?.area?.trim()
    ? locationData.area.trim().toUpperCase()
    : (Number.isFinite(locationData?.latitude) && Number.isFinite(locationData?.longitude)
      ? `${locationData.latitude.toFixed(3)}, ${locationData.longitude.toFixed(3)}`
      : "SET YOUR AREA");
  const introArea = locationData?.area?.trim() || "your area";
  const mapQuery = locationData?.area?.trim()
    ? locationData.area.trim()
    : `${mapCenterLat},${mapCenterLon}`;

  const openMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const categories = ["All", "Garbage", "Water", "Electricity", "Road", "Other"];
  const filtered = issues.filter((i) => {
    if (filter !== "All" && i.category !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      i.title,
      i.description,
      i.address,
      i.category,
      i.user?.firstName,
      i.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const dashboardStats = useMemo(() => {
    const totalIssues = issues.length;
    const pending = issues.filter((i) => i.status === "Pending").length;
    const inProgress = issues.filter((i) => i.status === "In Progress").length;

    const cutoff = selectedRange.days
      ? Date.now() - selectedRange.days * 24 * 60 * 60 * 1000
      : null;
    const inRange = cutoff
      ? issues.filter((i) => new Date(i.createdAt).getTime() >= cutoff)
      : issues;

    const resolvedInRange = inRange.filter((i) => i.status === "Resolved").length;
    const inLast24h = issues.filter((i) => new Date(i.createdAt).getTime() >= Date.now() - 24 * 60 * 60 * 1000).length;

    const percent = (value) => totalIssues ? `${Math.round((value / totalIssues) * 100)}% of total` : "No reports yet";

    return {
      totalIssues,
      pending,
      inProgress,
      resolvedInRange,
      totalDelta: `${inLast24h} in last 24h`,
      pendingDelta: percent(pending),
      inProgressDelta: percent(inProgress),
      resolvedDelta: selectedRange.sub,
    };
  }, [issues, selectedRange.days, selectedRange.sub]);

  const sparkSeries = useMemo(() => {
    const points = 8;
    const now = Date.now();

    const start = (() => {
      if (selectedRange.days) return now - selectedRange.days * 24 * 60 * 60 * 1000;
      const oldest = issues.reduce((min, i) => {
        const t = new Date(i.createdAt).getTime();
        return Number.isFinite(t) ? Math.min(min, t) : min;
      }, now);
      return Number.isFinite(oldest) && oldest < now ? oldest : now - 30 * 24 * 60 * 60 * 1000;
    })();

    const duration = Math.max(1, now - start);
    const bucketSize = duration / points;

    const build = (predicate) => {
      const buckets = new Array(points).fill(0);
      for (const issue of issues) {
        const created = new Date(issue.createdAt).getTime();
        if (!Number.isFinite(created) || created < start || created > now) continue;
        if (!predicate(issue)) continue;
        const idx = Math.min(points - 1, Math.max(0, Math.floor((created - start) / bucketSize)));
        buckets[idx] += 1;
      }
      return buckets;
    };

    return {
      total: build(() => true),
      pending: build((i) => i.status === "Pending"),
      progress: build((i) => i.status === "In Progress"),
      resolved: build((i) => i.status === "Resolved"),
    };
  }, [issues, selectedRange.days]);

  const categoryBreakdown = useMemo(() => {
    const cutoff = selectedRange.days
      ? Date.now() - selectedRange.days * 24 * 60 * 60 * 1000
      : null;

    const inRange = cutoff
      ? issues.filter((i) => new Date(i.createdAt).getTime() >= cutoff)
      : issues;

    const counts = {
      Road: 0,
      Water: 0,
      Garbage: 0,
      Electricity: 0,
      Other: 0,
    };

    inRange.forEach((issue) => {
      if (counts[issue.category] !== undefined) counts[issue.category] += 1;
      else counts.Other += 1;
    });

    const max = Math.max(...Object.values(counts), 1);

    return [
      { name: "Road",        val: counts.Road,        max, c1: "#A78BFA", c2: "#C4B5FD", glow: "rgba(167,139,250,0.35)", dot: "#A78BFA" },
      { name: "Water",       val: counts.Water,       max, c1: "#38BDF8", c2: "#7DD3FC", glow: "rgba(56,189,248,0.35)", dot: "#38BDF8" },
      { name: "Garbage",     val: counts.Garbage,     max, c1: "#F59E0B", c2: "#FCD34D", glow: "rgba(245,158,11,0.35)", dot: "#F59E0B" },
      { name: "Electricity", val: counts.Electricity, max, c1: "#C9F23E", c2: "#E4F96E", glow: "rgba(201,242,62,0.35)", dot: "#C9F23E" },
      { name: "Other",       val: counts.Other,       max, c1: "#F472B6", c2: "#F9A8D4", glow: "rgba(244,114,182,0.3)",  dot: "#F472B6" },
    ];
  }, [issues, selectedRange.days]);

  return (
    <div className="layout">
      <Sidebar unreadCount={unreadCount} />
      <main className="main">
        <div className="page-head">
          <div>
            <div className="eyebrow">Live · Community feed</div>
            <h1 style={{ marginTop: 8 }}>Good afternoon.</h1>
            <div className="sub">Here's what's happening around {introArea} in the last 24 hours.</div>
          </div>
          <Button variant="primary" size="lg" icon="plus" onClick={() => navigate("/report")}>
            Report an issue
          </Button>
        </div>

        {err && <div className="field err" style={{ marginBottom: 16 }}>{err}</div>}

        {locationPromptOpen && (
          <div className="location-modal-backdrop" onClick={() => locationData && setLocationPromptOpen(false)}>
          <div className="card location-prompt location-modal" role="dialog" aria-label="Set your area" onClick={(e) => e.stopPropagation()}>
            <div className="location-prompt-head">
              <div>
                <div className="chart-title" style={{ marginBottom: 6 }}>Where do you live?</div>
                <div className="chart-sub" style={{ marginBottom: 0 }}>
                  ADD YOUR AREA OR SHARE YOUR CURRENT LOCATION
                </div>
              </div>
              {locationData && (
                <button type="button" className="link" onClick={() => setLocationPromptOpen(false)}>
                  Close
                </button>
              )}
            </div>
            <div className="location-prompt-body">
              <input
                className="search-input location-input"
                placeholder="e.g. Bani Gala, Islamabad"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
              />
              <div className="location-prompt-actions">
                <Button variant="ghost" onClick={useCurrentLocation} disabled={locationBusy}>
                  {locationBusy ? "Locating..." : "Use current location"}
                </Button>
                <Button variant="primary" onClick={submitManualArea} disabled={locationBusy}>
                  {locationBusy ? "Saving..." : "Save area"}
                </Button>
              </div>
              {locationErr && <div className="field err" style={{ marginBottom: 0 }}>{locationErr}</div>}
            </div>
          </div>
          </div>
        )}

        <div className="stats-grid">
          <StatCard label="Reports in your area" value={dashboardStats.totalIssues} delta={dashboardStats.totalDelta} series={sparkSeries.total} />
          <StatCard label="Pending" value={dashboardStats.pending} delta={dashboardStats.pendingDelta} series={sparkSeries.pending} color="var(--status-pending)" />
          <StatCard label="In progress" value={dashboardStats.inProgress} delta={dashboardStats.inProgressDelta} series={sparkSeries.progress} color="var(--status-progress)" electric />
          <StatCard label={`Resolved · ${selectedRange.label}`} value={dashboardStats.resolvedInRange} delta={dashboardStats.resolvedDelta} series={sparkSeries.resolved} color="var(--status-resolved)" />
        </div>

        <div className="dash-grid" style={{ marginTop: 8 }}>
          <div>
            <div className="section-head">
              <h2>Nearby issues</h2>
            </div>

            <div className="filters">
              <div className="search-wrap">
                <Icon name="search" />
                <input
                  className="search-input"
                  placeholder="Search issues, locations, categories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="divider"></div>
              {categories.map(c => (
                <button key={c}
                  className={`filter-chip ${filter === c ? "active" : ""}`}
                  onClick={() => setFilter(c)}>
                  {c !== "All" && <span className="dot" style={{
                    background: { Garbage: "#F59E0B", Water: "#38BDF8", Electricity: "#C9F23E", Road: "#A78BFA", Other: "#F472B6" }[c]
                  }}/>}
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loading && <div style={{ color: "var(--ink-500)", padding: 24 }}>Loading issues…</div>}
              {!loading && filtered.map(is => (
                <IssueCard key={is.id} issue={is}
                  onOpen={(i) => navigate(`/issues/${i.id}`)}
                  onUpvote={upvote}
                  searchTerm={search} />
              ))}
              {!loading && !filtered.length && (
                <div style={{ color: "var(--ink-500)", padding: 24 }}>No issues match this filter.</div>
              )}
            </div>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 className="chart-title">Issues by category</h3>
                  <div className="chart-sub">{selectedRange.sub}</div>
                </div>
                <label className="filter-chip sm" style={{ minWidth: 84, paddingRight: 8, gap: 6, justifyContent: "space-between" }}>
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "inherit",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      width: "100%",
                      paddingRight: 4,
                    }}
                  >
                    {RANGE_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key} style={{ color: "#0B1223" }}>{r.label}</option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={12} />
                </label>
              </div>
              <div className="bar-chart">
                {categoryBreakdown.map(b => (
                  <div key={b.name} className="bar-row">
                    <span className="name"><span className="dot" style={{ background: b.dot || "#5E9CFF" }}/>{b.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{
                        width: `${(b.val / (b.max || 1)) * 100}%`,
                        "--c1": b.c1 || "#5E9CFF", "--c2": b.c2 || "#7DB0FF", "--c-glow": b.glow || "rgba(94,156,255,0.35)"
                      }}/>
                    </div>
                    <span className="val">{b.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 20px 14px" }}>
                <h3 className="chart-title">Your neighbourhood</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div className="chart-sub" style={{ marginBottom: 0 }}>{areaLabel}</div>
                  <button className="link" type="button" onClick={() => { setLocationErr(""); setLocationPromptOpen(true); }}>
                    {locationData ? "Change" : "Set area"}
                  </button>
                </div>
              </div>
              <MiniMap
                pins={issues
                  .filter((i) => Number.isFinite(Number(i.latitude)) && Number.isFinite(Number(i.longitude)))
                  .slice(0, 20)
                  .map((i) => ({
                    latitude: Number(i.latitude),
                    longitude: Number(i.longitude),
                    color: { Garbage: "#F59E0B", Water: "#38BDF8", Electricity: "#C9F23E", Road: "#A78BFA", Other: "#F472B6" }[i.category] || "#5E9CFF",
                  }))}
                centerLat={mapCenterLat}
                centerLon={mapCenterLon}
                showOverlayCoords={false}
              />
              <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>
                    {issues.length} ACTIVE · 1.2km RADIUS
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>
                    {mapCoordText}
                  </div>
                </div>
                <button type="button" className="link" onClick={openMap}>
                  Open map <Icon name="arrowRight" size={12}/>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, delta, series = [], color, electric }) => {
  const strokeColor = color || "var(--electric-bright)";
  const gradientId = `sp-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const points = Array.isArray(series) && series.length ? series : [0, 0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...points, 1);
  const xStep = 200 / (points.length - 1 || 1);

  const line = points
    .map((v, idx) => {
      const x = Math.round(idx * xStep);
      const y = Math.round(28 - (v / max) * 22);
      return `${idx === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  return (
    <div className={`card stat ${electric ? "electric" : ""}`}>
      <div className="label">{label}</div>
      <div className="value" style={color ? { color } : {}}>{value}</div>
      <div className="delta" style={color ? { color } : {}}>{delta}</div>
      <svg className="spark" viewBox="0 0 200 32" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.45"/>
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${line} L200 32 L0 32 Z`} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={strokeColor} strokeWidth="1.5"/>
      </svg>
    </div>
  );
};

export default Dashboard;
