// src/components/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icons";
import { applyTheme, getSystemTheme, readThemeMode, THEME_MODE_KEY } from "../lib/theme";

const SIDEBAR_COLLAPSED_KEY = "cr_sidebar_collapsed";
const THEME_MODES = ["light", "dark", "system"];

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const getDisplayUser = (user) => {
  const firstName = (user?.firstName || "").trim();
  const lastName = (user?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = (user?.email || "").trim();
  const fallbackName = email ? email.split("@")[0] : "Community User";
  const name = fullName || fallbackName;
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || (name[0] || "U").toUpperCase();
  return { name, email: email || "No email", initials };
};

const Sidebar = ({ unreadCount = 0, myIssuesCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const themeWrapRef = React.useRef(null);
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [themeMode, setThemeMode] = React.useState(() => readThemeMode());
  const [systemTheme, setSystemTheme] = React.useState(() => getSystemTheme());
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(() => getDisplayUser(getUserFromStorage()));

  React.useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "88px" : "264px");
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignore storage errors in private browsing or strict environments.
    }
  }, [collapsed]);

  React.useEffect(() => {
    applyTheme(themeMode);
    try {
      localStorage.setItem(THEME_MODE_KEY, themeMode);
    } catch {
      // Ignore storage errors in private browsing or strict environments.
    }
  }, [themeMode]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemTheme(e.matches ? "dark" : "light");
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  React.useEffect(() => {
    setUserInfo(getDisplayUser(getUserFromStorage()));

    const onStorage = (e) => {
      if (!e.key || e.key === "userData") {
        setUserInfo(getDisplayUser(getUserFromStorage()));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  React.useEffect(() => {
    const onPointerDown = (e) => {
      if (!themeWrapRef.current) return;
      if (!themeWrapRef.current.contains(e.target)) setThemeOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setThemeOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const items = [
    { path: "/dashboard",     label: "Dashboard",     icon: "home" },
    { path: "/report",        label: "Report Issue",  icon: "plus" },
    { path: "/my-issues",     label: "My Issues",     icon: "flag", count: myIssuesCount },
    { path: "/notifications", label: "Notifications", icon: "bell", count: unreadCount },
  ];

  const handleSignOut = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <button
          type="button"
          className="brand-mark brand-mark-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 L20 7 V13 C20 17 16 20 12 21 C8 20 4 17 4 13 V7 Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </button>
        <div className="brand-name">
          CivicReport
          <small>WORKFLOW · 01</small>
        </div>
      </div>

      <div className="nav-section-title">Main</div>
      <div className="nav">
        {items.map(it => (
          <button key={it.path}
            className={`nav-item ${isActive(it.path) ? "active" : ""}`}
            onClick={() => navigate(it.path)}>
            <Icon name={it.icon} />
            <span className="nav-label">{it.label}</span>
            {it.count > 0 && <span className="count">{it.count}</span>}
          </button>
        ))}
      </div>

      <div className="nav-section-title">Account</div>
      <div className="nav">
        <button className="nav-item" onClick={handleSignOut}>
          <Icon name="logout" />
          <span className="nav-label">Sign out</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="theme-wrap" ref={themeWrapRef}>
          <button
            type="button"
            className={`theme-trigger ${themeOpen ? "active" : ""}`}
            onClick={() => setThemeOpen((v) => !v)}
            aria-expanded={themeOpen}
            aria-haspopup="dialog"
            aria-label="Open theme options"
            title="Theme options"
          >
            <Icon name="settings" size={16} />
            <span className="nav-label">Theme</span>
          </button>

          <div className={`theme-popover ${themeOpen ? "open" : ""}`} role="dialog" aria-label="Theme mode">
            <span className="theme-title">Appearance</span>
            <div className="theme-segment">
              {THEME_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`theme-option ${themeMode === mode ? "active" : ""}`}
                  onClick={() => {
                    setThemeMode(mode);
                    setThemeOpen(false);
                  }}
                >
                  {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
                </button>
              ))}
            </div>
            <div className="theme-note">System default: {systemTheme === "dark" ? "Dark" : "Light"}</div>
          </div>
        </div>

        <button
          type="button"
          className={`user-card user-card-link ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}
          aria-label="Open profile"
          title="Open profile"
        >
          <div className="avatar">{userInfo.initials}</div>
          <div className="user-meta">
            <span className="name">{userInfo.name}</span>
            <span className="email">{userInfo.email}</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
