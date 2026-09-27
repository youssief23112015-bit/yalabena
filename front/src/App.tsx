import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RequireRoles } from '@/components/common/RequireRoles';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/toaster';

import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import PlacementTestPage from '@/pages/PlacementTestPage';

import DashboardPage from '@/pages/Dashboard';
import LeadsPage from '@/pages/Leads';
import StudentsPage from '@/pages/Students';
import CoursesPage from '@/pages/Courses';
import GroupsPage from '@/pages/Groups';
import SessionsPage from '@/pages/Sessions';
import BranchesPage from '@/pages/Branches';
import UsersPage from '@/pages/Users';
import RolesPage from '@/pages/Roles';
import AttendancePage from '@/pages/Attendance';
import PlacementTestsPage from '@/pages/PlacementTests';
import WaitlistsPage from '@/pages/Waitlists';
import EnrollmentsPage from '@/pages/Enrollments';
import FinancePage from '@/pages/Finance';
import CertificatesPage from '@/pages/Certificates';
import NotificationsPage from '@/pages/Notifications';
import AuditLogsPage from '@/pages/AuditLogs';
import SecuritySettingsPage from '@/pages/SecuritySettings';
import LmsPage from '@/pages/Lms'; // <--- 1. Import your LMS Page
import NotFoundPage from '@/pages/NotFound';

const roleGate = (roles: string[], element: ReactNode) => (
  <RequireRoles roles={roles}>{element}</RequireRoles>
);

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
          }
        />

        {/* Public Placement Test */}
        <Route
          path="/placement-test"
          element={<PlacementTestPage />}
        />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            {/* <--- 2. Add the /lms route here ---> */}
            <Route
              path="/lms/*"
              element={<LmsPage />}
            />

            <Route
              path="/leads"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales'],
                <LeadsPage />,
              )}
            />

            <Route
              path="/students"
              element={roleGate(
                [
                  'super_admin',
                  'branch_manager',
                  'sales',
                  'finance',
                  'academic',
                  'teacher',
                ],
                <StudentsPage />,
              )}
            />

            <Route
              path="/courses"
              element={<CoursesPage />}
            />

            <Route
              path="/groups"
              element={roleGate(
                [
                  'super_admin',
                  'academic',
                  'branch_manager',
                  'teacher',
                ],
                <GroupsPage />,
              )}
            />

            <Route
              path="/sessions"
              element={roleGate(
                [
                  'super_admin',
                  'academic',
                  'branch_manager',
                  'teacher',
                ],
                <SessionsPage />,
              )}
            />

            <Route
              path="/attendance"
              element={roleGate(
                ['super_admin', 'academic', 'branch_manager', 'teacher'],
                <AttendancePage />,
              )}
            />

            <Route
              path="/placement-tests"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales', 'academic'],
                <PlacementTestsPage />,
              )}
            />

            <Route
              path="/waitlists"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales', 'academic'],
                <WaitlistsPage />,
              )}
            />

            <Route path="/notifications" element={<NotificationsPage />} />

            <Route
              path="/enrollments"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales', 'finance', 'academic'],
                <EnrollmentsPage />,
              )}
            />

            <Route
              path="/finance"
              element={roleGate(
                ['super_admin', 'finance', 'branch_manager'],
                <FinancePage />,
              )}
            />

            <Route
              path="/certificates"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'finance', 'teacher'],
                <CertificatesPage />,
              )}
            />

            <Route
              path="/branches"
              element={roleGate(
                ['super_admin', 'branch_manager'],
                <BranchesPage />,
              )}
            />

            <Route
              path="/users"
              element={roleGate(
                ['super_admin', 'branch_manager', 'hr'],
                <UsersPage />,
              )}
            />

            <Route
              path="/roles"
              element={roleGate(
                ['super_admin'],
                <RolesPage />,
              )}
            />

            <Route
              path="/audit"
              element={roleGate(['super_admin'], <AuditLogsPage />)}
            />

            <Route path="/security" element={<SecuritySettingsPage />} />
          </Route>
        </Route>

        {/* Unknown Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;