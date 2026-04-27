import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Add these imports at the top with WF3 pages
import AnalyticsOverview from './pages/AnalyticsOverview';
import FilteredAnalytics from './pages/FilteredAnalytics';
import MapView from './pages/MapView';

// WF1 — Citizen pages
import UnifiedLogin from "./pages/UnifiedLogin";
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
import { clearSession, isUserAuthed } from "./lib/auth";

// WF2 — Admin pages
import AdminForgotPassword from "./pages/AdminForgotPassowrd";
import AdminEnterCode from "./pages/AdminEnterCode";
import AdminResetPassword from "./pages/AdminResetPassword";
import AdminResetSuccess from "./pages/AdminResetSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import AdminIssueDetail from "./pages/AdminIssueDetail";
import StatusLogs from "./pages/StatusLogs";
import AdminNotifications from "./pages/AdminNotifications";
import CreateAdmin from "./pages/CreateAdmin";
import AdminProfile from "./pages/AdminProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const RequireAuth = ({ children }) => {
  if (!isUserAuthed()) {
    clearSession();
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
        <Route path="/login" element={<UnifiedLogin />} />
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
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/enter-code" element={<AdminEnterCode />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin/reset-success" element={<AdminResetSuccess />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/issues/:id" element={<ProtectedRoute><AdminIssueDetail /></ProtectedRoute>} />
        <Route path="/admin/status-logs" element={<ProtectedRoute><StatusLogs /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/team" element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />

        {/* WF3 — Analytics routes */}
        <Route path="/analytics" element={<RequireAuth><ErrorBoundary><AnalyticsOverview /></ErrorBoundary></RequireAuth>} />
        <Route path="/analytics/filtered" element={<RequireAuth><ErrorBoundary><FilteredAnalytics /></ErrorBoundary></RequireAuth>} />
        <Route path="/map" element={<Navigate to="/admin/map" replace />} />
        <Route path="/admin/analytics" element={<ProtectedRoute><ErrorBoundary><AnalyticsOverview /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/analytics/filtered" element={<ProtectedRoute><ErrorBoundary><FilteredAnalytics /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/map" element={<ProtectedRoute><ErrorBoundary><MapView /></ErrorBoundary></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}