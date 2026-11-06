import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ForbidRolesProps {
  roles: string[];
  children: ReactNode;
}

/**
 * Renders children unless the current user carries one of `roles` (or is super_admin),
 * in which case it redirects to /dashboard. Used to keep administrative roles out of
 * employee self-service routes (/hr/my/*).
 */
export function ForbidRoles({ roles, children }: ForbidRolesProps) {
  const user = useAuthStore((state) => state.user);
  const userRoles = user?.roles ?? (user?.role ? [user.role] : []);

  const isForbidden =
    userRoles.includes('super_admin') || userRoles.some((r) => roles.includes(r));

  if (isForbidden) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export default ForbidRoles;
