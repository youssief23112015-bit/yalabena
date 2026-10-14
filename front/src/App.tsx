import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RequireRoles } from '@/components/common/RequireRoles';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/toaster';

import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
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
import TestSlotsPage from '@/pages/TestSlotsPage';
import WaitlistsPage from '@/pages/Waitlists';
import EnrollmentsPage from '@/pages/Enrollments';
import FinancePage from '@/pages/Finance';
import CertificatesPage from '@/pages/Certificates';
import NotificationsPage from '@/pages/Notifications';
import AuditLogsPage from '@/pages/AuditLogs';
import SecuritySettingsPage from '@/pages/SecuritySettings';
import LmsPage from '@/pages/Lms';
import CoursePage from '@/pages/student/CoursePage';
import QuizPage from '@/pages/student/QuizPage';
import MyCertificatesPage from '@/pages/student/MyCertificates';
import QuestionBankPage from '@/pages/instructor/QuestionBankPage';
import NotFoundPage from '@/pages/NotFound';
import ForbiddenPage from '@/pages/Forbidden';
import ChatPage from '@/pages/Chat';
import LandingPage from '@/pages/public/LandingPage';
import PublicCoursesPage from '@/pages/public/CoursesPage';
import CourseDetailPage from '@/pages/public/CourseDetailPage';
import BlogPage from '@/pages/public/BlogPage';
import BlogPostPage from '@/pages/public/BlogPostPage';
import PlacementBookingPage from '@/pages/public/PlacementBookingPage';
import VerifyCertificatePage from '@/pages/public/VerifyCertificatePage';
import RegisterOnlinePage from '@/pages/public/RegisterOnlinePage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import KnowledgeBasePage from '@/pages/KnowledgeBase';
import ReportsPage from '@/pages/Reports';
import ActivityAttendancePage from '@/pages/activities/ActivityAttendancePage';
import HrLayout from '@/pages/hr/HrLayout';
import EmployeesPage from '@/pages/hr/EmployeesPage';
import EmployeeDetailsPage from '@/pages/hr/EmployeeDetailsPage';
import LeavesPage from '@/pages/hr/LeavesPage';
import MyHrPage from '@/pages/hr/MyHrPage';
import PayrollPage from '@/pages/hr/PayrollPage';

// استيراد صفحات الـ Activities الجديدة
import ActivitiesListPage from '@/pages/activities/ActivitiesListPage';
import ActivityDetailsPage from '@/pages/activities/ActivityDetailsPage';
import ActivityFormPage from '@/pages/activities/ActivityFormPage';

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
        {/* Public Landing & Catalog Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/catalog" element={<PublicCoursesPage />} />
        <Route path="/catalog/:id" element={<CourseDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/placement-booking" element={<PlacementBookingPage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/register-online" element={<RegisterOnlinePage />} />

        {/* Public Auth Routes (Redirect to dashboard if already logged in) */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          }
        />

        {/* Password Reset Routes */}
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* OAuth Callback Route - stores JWT pair into useAuthStore */}
        <Route
          path="/auth/callback"
          element={<AuthCallbackPage />}
        />

        {/* Public Placement Test */}
        <Route
          path="/placement-test"
          element={<PlacementTestPage />}
        />

        {/* Protected Application Routes (Dashboard & Management) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            {/* 403 fallback for role-gated URLs (RequireRoles redirects here) */}
            <Route path="/403" element={<ForbiddenPage />} />

            <Route
              path="/lms/*"
              element={roleGate(['super_admin', 'academic', 'teacher', 'student'], <LmsPage />)}
            />

            {/* Student course content + quiz taking */}
            <Route
              path="/student/courses/:groupId"
              element={roleGate(['student', 'teacher', 'academic'], <CoursePage />)}
            />
            <Route
              path="/student/quiz/:quizId"
              element={roleGate(['student'], <QuizPage />)}
            />

            {/* Student self-service certificates */}
            <Route
              path="/my-certificates"
              element={roleGate(['student'], <MyCertificatesPage />)}
            />

            {/* Instructor question bank */}
            <Route
              path="/instructor/question-bank"
              element={roleGate(['academic', 'teacher'], <QuestionBankPage />)}
            />

            <Route
              path="/leads"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales'],
                <LeadsPage />,
              )}
            />

            <Route
              path="/chat"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher', 'student', 'moderator'],
                <ChatPage />,
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
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher'],
                <CoursesPage />,
              )}
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

            {/* --- مسارات الـ Activities --- */}
            <Route
              path="/activities"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher', 'sales'],
                <ActivitiesListPage />,
              )}
            />
            <Route
              path="/activities/new"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher', 'sales'],
                <ActivityFormPage />,
              )}
            />
            <Route
              path="/activities/:id/edit"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic'],
                <ActivityFormPage />,
              )}
            />
            <Route
              path="/activities/:id/attendance"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher'],
                <ActivityAttendancePage />,
              )}
            />
            <Route
              path="/activities/:id"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic', 'teacher', 'sales'],
                <ActivityDetailsPage />,
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
              path="/test-slots"
              element={roleGate(
                ['super_admin', 'branch_manager', 'academic'],
                <TestSlotsPage />,
              )}
            />

            <Route
              path="/waitlists"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales', 'academic'],
                <WaitlistsPage />,
              )}
            />

            <Route
              path="/hr"
              element={roleGate(['super_admin', 'hr', 'branch_manager', 'teacher', 'finance'], <HrLayout />)}
            >
              <Route index element={roleGate(['super_admin', 'hr', 'branch_manager'], <EmployeesPage />)} />
              <Route path="employees/:id" element={roleGate(['super_admin', 'hr', 'branch_manager'], <EmployeeDetailsPage />)} />
              <Route path="leaves" element={roleGate(['super_admin', 'hr', 'branch_manager'], <LeavesPage />)} />
              <Route path="my" element={roleGate(['super_admin', 'hr', 'teacher'], <MyHrPage />)} />
              <Route path="payroll" element={roleGate(['super_admin', 'hr', 'finance'], <PayrollPage />)} />
            </Route>

            <Route
              path="/inventory"
              element={roleGate(['super_admin', 'branch_manager', 'sales', 'finance', 'auditor'], <InventoryPage />)}
            />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route
              path="/knowledge-base"
              element={roleGate(
                ['super_admin', 'hr', 'branch_manager', 'teacher', 'sales', 'finance'],
                <KnowledgeBasePage />,
              )}
            />
            <Route
              path="/reports"
              element={roleGate(
                ['super_admin', 'branch_manager', 'sales', 'academic', 'finance', 'hr', 'teacher'],
                <ReportsPage />,
              )}
            />

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
              element={roleGate(['super_admin', 'auditor'], <AuditLogsPage />)}
            />

            <Route path="/security" element={roleGate(['super_admin'], <SecuritySettingsPage />)} />
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