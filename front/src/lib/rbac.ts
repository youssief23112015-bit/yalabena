import { useAuthStore } from "@/store/authStore";

export const HR_VIEW_ROLES = ["super_admin", "hr", "branch_manager"];
export const HR_PAYROLL_ROLES = ["super_admin", "hr", "finance"];

export function useUserRoles(): string[] {
  const user = useAuthStore((s) => s.user);
  return user?.roles ?? (user?.role ? [user.role] : []);
}

export function hasAnyRole(roles: string[], allowed: string[]) {
  return roles.includes("super_admin") || allowed.some((role) => roles.includes(role));
}
