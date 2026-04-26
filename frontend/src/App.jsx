import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsOverview from './pages/AnalyticsOverview';
import FilteredAnalytics from './pages/FilteredAnalytics';
import MapView           from './pages/MapView';

// Route guard: only allows access if admin token exists
const RequireAdmin = ({ children }) =>
  localStorage.getItem('adminToken') ? children : <Navigate to="/analytics" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Navigate to="/analytics" replace />} />
        <Route path="/analytics"           element={<AnalyticsOverview />} />
        <Route path="/analytics/filtered"  element={<FilteredAnalytics />} />
        {/* Map View: accessible but only linked in admin nav */}
        <Route path="/map"                 element={<RequireAdmin><MapView /></RequireAdmin>} />

        {/* WF2 placeholders — replaced when Hussain's frontend is merged */}
        <Route path="/admin/dashboard"     element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/notifications" element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/status-logs"   element={<Navigate to="/analytics" replace />} />

        {/* WF1 placeholders — replaced when Memon's frontend is merged */}
        <Route path="/dashboard"           element={<Navigate to="/analytics" replace />} />
        <Route path="/my-reports"          element={<Navigate to="/analytics" replace />} />
        <Route path="/report"              element={<Navigate to="/analytics" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

