import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Employees from './pages/employees/Employees';
import Leads from './pages/leads/Leads';
import Attendance from './pages/attendance/Attendance';
import Projects from './pages/projects/Projects';
import CRM from './pages/crm/CRM';
import Finance from './pages/finance/Finance';
import HRM from './pages/hrm/HRM';
import Settings from './pages/settings/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
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
