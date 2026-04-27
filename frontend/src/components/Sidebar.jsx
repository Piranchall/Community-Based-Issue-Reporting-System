// src/components/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icons";
import { applyTheme, getSystemTheme, readThemeMode, THEME_MODE_KEY } from "../lib/theme";
import { ROLE, clearSession, getSession } from "../lib/auth";
import { api } from "../lib/api";

const SIDEBAR_COLLAPSED_KEY = "cr_sidebar_collapsed";
const THEME_MODES = ["light", "dark", "system"];

const getDisplayUser = (user, isAdmin = false) => {
  const adminName = (user?.name || "").trim();
  const firstName = (user?.firstName || "").trim();
  const lastName = (user?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = (user?.email || "").trim();
  const fallbackName = email ? email.split("@")[0] : (isAdmin ? "Admin User" : "Community User");
  const name = adminName || fullName || fallbackName;
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || (name[0] || "U").toUpperCase();
  return { name, email: email || "No email", initials };
};

const readSidebarIdentity = () => {
  const session = getSession();
  const isAdmin = session?.role === ROLE.ADMIN;
  const principal = session?.principal || null;
  return {
    isAdmin,
    userInfo: getDisplayUser(principal, isAdmin),
  };
};

const Sidebar = ({ unreadCount = 0, myIssuesCount = 0, counts = {} }) => {
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
  const [identity, setIdentity] = React.useState(readSidebarIdentity);
  const [liveUnreadCount, setLiveUnreadCount] = React.useState(unreadCount);

  const isAdmin = identity.isAdmin;
  const userInfo = identity.userInfo;

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
    setIdentity(readSidebarIdentity());

    const onStorage = () => {
      setIdentity(readSidebarIdentity());
    };

    const onUserDataUpdated = () => {
      setIdentity(readSidebarIdentity());
    };

    const onSessionUpdated = () => {
      setIdentity(readSidebarIdentity());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cr:userDataUpdated", onUserDataUpdated);
    window.addEventListener("cr:sessionUpdated", onSessionUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cr:userDataUpdated", onUserDataUpdated);
      window.removeEventListener("cr:sessionUpdated", onSessionUpdated);
    };
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

  React.useEffect(() => {
    setLiveUnreadCount(unreadCount);
  }, [unreadCount]);

  React.useEffect(() => {
    if (isAdmin) return;

    let mounted = true;

    const refreshUnread = async () => {
      try {
        const data = await api("/api/users/notifications");
        const list = Array.isArray(data) ? data : data?.data || data?.notifications || [];
        const unread = list.filter((n) => n && n.isRead === false).length;
        if (mounted) setLiveUnreadCount(unread);
      } catch {
        // Keep last known count if fetch fails.
      }
    };

    refreshUnread();
    const intervalId = window.setInterval(refreshUnread, 20000);
    const onFocus = () => refreshUnread();
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, location.pathname]);

  const citizenItems = [
    { path: "/dashboard", label: "Dashboard", icon: "home" },
    { path: "/report", label: "Report Issue", icon: "plus" },
    { path: "/my-issues", label: "My Issues", icon: "flag", count: myIssuesCount },
    { path: "/notifications", label: "Notifications", icon: "bell", count: liveUnreadCount },
    { path: "/analytics", label: "Analytics", icon: "sparkle" },
  ];

  const adminItems = [
    { path: "/admin/dashboard", label: "All Issues", icon: "home", count: counts?.open || 0 },
    { path: "/admin/map", label: "Map View", icon: "map" },
    { path: "/admin/analytics", label: "Analytics", icon: "sparkle" },
    { path: "/admin/status-logs", label: "Status Logs", icon: "clock" },
    { path: "/admin/notifications", label: "Notifications", icon: "bell", count: counts?.unread || 0 },
    { path: "/admin/team", label: "Team", icon: "user" },
  ];

  const items = isAdmin ? adminItems : citizenItems;

  const handleSignOut = () => {
    clearSession();
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
          <small>{isAdmin ? "ADMIN · CONSOLE" : "CITIZEN · CONSOLE"}</small>
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
          className={`user-card user-card-link ${isActive(isAdmin ? "/admin/profile" : "/profile") ? "active" : ""}`}
          onClick={() => navigate(isAdmin ? "/admin/profile" : "/profile")}
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