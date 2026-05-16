import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout.tsx';
import AuthLayout from './layouts/AuthLayout.tsx';
import Login from './pages/auth/Login.tsx';
import ForgotPassword from './pages/auth/ForgotPassword.tsx';
import Dashboard from './pages/dashboard/Dashboard.tsx';
import Employees from './pages/employees/Employees.tsx';
import Leads from './pages/leads/Leads.tsx';
import Attendance from './pages/attendance/Attendance.tsx';
import Projects from './pages/projects/Projects.tsx';
import CRM from './pages/crm/CRM.tsx';
import Finance from './pages/finance/Finance.tsx';
import HRM from './pages/hrm/HRM.tsx';
import Settings from './pages/settings/Settings.tsx';
import Notifications from './pages/notifications/Notifications.tsx';
import ActivityLog from './pages/activity/ActivityLog.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/hrm" element={<HRM />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/activity" element={<ActivityLog />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
