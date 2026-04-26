import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// WF1 — Citizen pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import EnterCode from "./pages/EnterCode";
import ResetPassword from "./pages/ResetPassword";
import ResetSuccess from "./pages/ResetSuccess";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import IssueDetail from "./pages/IssueDetail";
import MyIssues from "./pages/MyIssues";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { applyTheme, readThemeMode } from "./lib/theme";

// WF2 — Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminIssueDetail from "./pages/AdminIssueDetail";
import StatusLogs from "./pages/StatusLogs";
import AdminNotifications from "./pages/AdminNotifications";
import CreateAdmin from "./pages/CreateAdmin";
import ProtectedRoute from "./components/ProtectedRoute";

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch { return true; }
};

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("userToken");
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (readThemeMode() === "system") applyTheme("system"); };
    media.addEventListener ? media.addEventListener("change", onChange) : media.addListener(onChange);
    return () => media.removeEventListener ? media.removeEventListener("change", onChange) : media.removeListener(onChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* WF1 — Citizen routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/code" element={<EnterCode />} />
        <Route path="/forgot-password/reset" element={<ResetPassword />} />
        <Route path="/forgot-password/success" element={<ResetSuccess />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/report" element={<RequireAuth><ReportIssue /></RequireAuth>} />
        <Route path="/issues/:id" element={<RequireAuth><IssueDetail /></RequireAuth>} />
        <Route path="/my-issues" element={<RequireAuth><MyIssues /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/users/:id" element={<RequireAuth><UserProfile /></RequireAuth>} />

        {/* WF2 — Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/enter-code" element={<EnterCode />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin/reset-success" element={<ResetSuccess />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/issues/:id" element={<ProtectedRoute><AdminIssueDetail /></ProtectedRoute>} />
        <Route path="/admin/status-logs" element={<ProtectedRoute><StatusLogs /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/team" element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}