import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui/LoadingSpinner';
import './index.css';

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const FirstLoginSetup = lazy(() => import('./pages/auth/FirstLoginSetup'));

// Employee pages
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmployeeLeave = lazy(() => import('./pages/employee/EmployeeLeave'));
const EmployeePayslips = lazy(() => import('./pages/employee/EmployeePayslips'));
const EmployeeAttendance = lazy(() => import('./pages/employee/EmployeeAttendance'));
const EmployeeTasks = lazy(() => import('./pages/employee/EmployeeTasks'));
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile'));
const EmployeeLoan = lazy(() => import('./pages/employee/EmployeeLoan'));
const EmployeeSalaryAdvance = lazy(() => import('./pages/employee/EmployeeSalaryAdvance'));
const EmployeeDocuments = lazy(() => import('./pages/employee/EmployeeDocuments'));

// Manager pages
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerTeam = lazy(() => import('./pages/manager/ManagerTeam'));
const ManagerLeaves = lazy(() => import('./pages/manager/ManagerLeaves'));
const ManagerTasks = lazy(() => import('./pages/manager/ManagerTasks'));
const ManagerAttendance = lazy(() => import('./pages/manager/ManagerAttendance'));
const ManagerCalendar = lazy(() => import('./pages/manager/ManagerCalendar'));

// HR pages
const HRDashboard = lazy(() => import('./pages/hr/HRDashboard'));
const EmployeeList = lazy(() => import('./pages/hr/EmployeeList'));
const EmployeeDetail = lazy(() => import('./pages/hr/EmployeeDetail'));
const PayrollManagement = lazy(() => import('./pages/hr/PayrollManagement'));
const PayrollConfig = lazy(() => import('./pages/hr/PayrollConfig'));
const HRLeaveManagement = lazy(() => import('./pages/hr/HRLeaveManagement'));
const HRLoanManagement = lazy(() => import('./pages/hr/HRLoanManagement'));
const HRMetricsPage = lazy(() => import('./pages/hr/HRMetricsPage'));
const RecruitmentPage = lazy(() => import('./pages/hr/RecruitmentPage'));
const HRAttendancePage = lazy(() => import('./pages/hr/HRAttendancePage'));
const HRDocuments = lazy(() => import('./pages/hr/HRDocuments'));
const HRSettings = lazy(() => import('./pages/hr/HRSettings'));
const HRRoleManagement = lazy(() => import('./pages/hr/HRRoleManagement'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments'));

// Public pages
const CareersPage = lazy(() => import('./pages/public/CareersPage'));

// ── Route Guards ─────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireFirstLogin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isFirstLogin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isFirstLogin) return <Navigate to="/setup" replace />;
  switch (user.role) {
    case 'super_admin': return <Navigate to="/admin" replace />;
    case 'hr_manager': return <Navigate to="/hr" replace />;
    case 'manager': return <Navigate to="/manager" replace />;
    default: return <Navigate to="/employee" replace />;
  }
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<RequireFirstLogin><FirstLoginSetup /></RequireFirstLogin>} />

        {/* Public */}
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<CareersPage />} />

        {/* Employee */}
        <Route path="/employee" element={<RequireAuth><EmployeeDashboard /></RequireAuth>} />
        <Route path="/employee/leave" element={<RequireAuth><EmployeeLeave /></RequireAuth>} />
        <Route path="/employee/payslips" element={<RequireAuth><EmployeePayslips /></RequireAuth>} />
        <Route path="/employee/attendance" element={<RequireAuth><EmployeeAttendance /></RequireAuth>} />
        <Route path="/employee/tasks" element={<RequireAuth><EmployeeTasks /></RequireAuth>} />
        <Route path="/employee/profile" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />
        <Route path="/employee/loan" element={<RequireAuth><EmployeeLoan /></RequireAuth>} />
        <Route path="/employee/salary-advance" element={<RequireAuth><EmployeeSalaryAdvance /></RequireAuth>} />
        <Route path="/employee/documents" element={<RequireAuth><EmployeeDocuments /></RequireAuth>} />

        {/* Manager */}
        <Route path="/manager" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerDashboard /></RoleRoute></RequireAuth>} />
        <Route path="/manager/team" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerTeam /></RoleRoute></RequireAuth>} />
        <Route path="/manager/leaves" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerLeaves /></RoleRoute></RequireAuth>} />
        <Route path="/manager/tasks" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerTasks /></RoleRoute></RequireAuth>} />
        <Route path="/manager/attendance" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerAttendance /></RoleRoute></RequireAuth>} />
        <Route path="/manager/calendar" element={<RequireAuth><RoleRoute roles={['manager', 'hr_manager', 'super_admin']}><ManagerCalendar /></RoleRoute></RequireAuth>} />

        {/* HR */}
        <Route path="/hr" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRDashboard /></RoleRoute></RequireAuth>} />
        <Route path="/hr/employees" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><EmployeeList /></RoleRoute></RequireAuth>} />
        <Route path="/hr/employees/:id" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><EmployeeDetail /></RoleRoute></RequireAuth>} />
        <Route path="/hr/payroll" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><PayrollManagement /></RoleRoute></RequireAuth>} />
        <Route path="/hr/payroll/config" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><PayrollConfig /></RoleRoute></RequireAuth>} />
        <Route path="/hr/leaves" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRLeaveManagement /></RoleRoute></RequireAuth>} />
        <Route path="/hr/loans" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRLoanManagement /></RoleRoute></RequireAuth>} />
        <Route path="/hr/metrics" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRMetricsPage /></RoleRoute></RequireAuth>} />
        <Route path="/hr/recruitment" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><RecruitmentPage /></RoleRoute></RequireAuth>} />
        <Route path="/hr/attendance" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRAttendancePage /></RoleRoute></RequireAuth>} />
        <Route path="/hr/documents" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRDocuments /></RoleRoute></RequireAuth>} />
        <Route path="/hr/settings" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRSettings /></RoleRoute></RequireAuth>} />
        <Route path="/hr/roles" element={<RequireAuth><RoleRoute roles={['hr_manager', 'super_admin']}><HRRoleManagement /></RoleRoute></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth><RoleRoute roles={['super_admin']}><AdminDashboard /></RoleRoute></RequireAuth>} />
        <Route path="/admin/departments" element={<RequireAuth><RoleRoute roles={['super_admin']}><AdminDepartments /></RoleRoute></RequireAuth>} />
        <Route path="/admin/employees" element={<RequireAuth><RoleRoute roles={['super_admin']}><EmployeeList /></RoleRoute></RequireAuth>} />
        <Route path="/admin/payroll" element={<RequireAuth><RoleRoute roles={['super_admin']}><PayrollManagement /></RoleRoute></RequireAuth>} />
        <Route path="/admin/attendance" element={<RequireAuth><RoleRoute roles={['super_admin']}><HRAttendancePage /></RoleRoute></RequireAuth>} />
        <Route path="/admin/recruitment" element={<RequireAuth><RoleRoute roles={['super_admin']}><RecruitmentPage /></RoleRoute></RequireAuth>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
