import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { RequireRoles } from '@/components/common/RequireRoles';

import DashboardPage from '@/pages/Dashboard';
import LeadsPage from '@/pages/Leads';
import StudentsPage from '@/pages/Students';
import CoursesPage from '@/pages/Courses';
import GroupsPage from '@/pages/Groups';
import SessionsPage from '@/pages/Sessions';
import BranchesPage from '@/pages/Branches';
import UsersPage from '@/pages/Users';
import RolesPage from '@/pages/Roles';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import NotFoundPage from '@/pages/NotFound';

const gate = (roles: string[], element: ReactNode) => (
  <RequireRoles roles={roles}>{element}</RequireRoles>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={gate(['super_admin', 'branch_manager', 'sales'], <LeadsPage />)} />
        <Route path="/students" element={gate(['super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher'], <StudentsPage />)} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/groups" element={gate(['super_admin', 'academic', 'branch_manager', 'teacher'], <GroupsPage />)} />
        <Route path="/sessions" element={gate(['super_admin', 'academic', 'branch_manager', 'teacher'], <SessionsPage />)} />
        <Route path="/branches" element={gate(['super_admin', 'branch_manager'], <BranchesPage />)} />
        <Route path="/users" element={gate(['super_admin', 'branch_manager', 'hr'], <UsersPage />)} />
        <Route path="/roles" element={gate(['super_admin'], <RolesPage />)} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
