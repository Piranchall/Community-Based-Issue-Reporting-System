// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const isTokenExpired = (token) => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
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
    const onChange = () => {
      if (readThemeMode() === "system") applyTheme("system");
    };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                       element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"                  element={<Login />} />
        <Route path="/register"               element={<Register />} />
        <Route path="/forgot-password"        element={<ForgotPassword />} />
        <Route path="/forgot-password/code"   element={<EnterCode />} />
        <Route path="/forgot-password/reset"  element={<ResetPassword />} />
        <Route path="/forgot-password/success" element={<ResetSuccess />} />

        <Route path="/dashboard"      element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/report"         element={<RequireAuth><ReportIssue /></RequireAuth>} />
        <Route path="/issues/:id"     element={<RequireAuth><IssueDetail /></RequireAuth>} />
        <Route path="/my-issues"      element={<RequireAuth><MyIssues /></RequireAuth>} />
        <Route path="/notifications"  element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/profile"        element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/users/:id"      element={<RequireAuth><UserProfile /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}