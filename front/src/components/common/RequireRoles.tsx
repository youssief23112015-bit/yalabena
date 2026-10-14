import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface RequireRolesProps {
  roles: string[];
  children: ReactNode;
}

export function RequireRoles({ roles, children }: RequireRolesProps) {
  const user = useAuthStore((state) => state.user);
  const userRoles = user?.roles ?? (user?.role ? [user.role] : []);

  if (userRoles.includes('super_admin')) return <>{children}</>;
  if (userRoles.some((role) => roles.includes(role))) return <>{children}</>;

  // Role cannot access this URL (typed manually or stale link) → 403 fallback.
  return <Navigate to="/403" replace />;
}
