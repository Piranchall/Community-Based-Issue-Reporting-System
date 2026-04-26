import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import EnterCode from './pages/EnterCode';
import ResetPassword from './pages/ResetPassword';
import ResetSuccess from './pages/ResetSuccess';
import AdminDashboard from './pages/AdminDashboard';
import IssueDetail from './pages/IssueDetail';
import StatusLogs from './pages/StatusLogs';
import AdminNotifications from './pages/AdminNotifications';
import CreateAdmin from './pages/CreateAdmin';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* Public — auth */}
      <Route path="/admin/login"            element={<AdminLogin />} />
      <Route path="/admin/forgot-password"  element={<ForgotPassword />} />
      <Route path="/admin/enter-code"       element={<EnterCode />} />
      <Route path="/admin/reset-password"   element={<ResetPassword />} />
      <Route path="/admin/reset-success"    element={<ResetSuccess />} />

      {/* Protected */}
      <Route path="/admin/dashboard"        element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/issues/:id"       element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
      <Route path="/admin/status-logs"      element={<ProtectedRoute><StatusLogs /></ProtectedRoute>} />
      <Route path="/admin/notifications"    element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/team"             element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
