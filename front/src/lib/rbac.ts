import { useAuthStore } from "@/store/authStore";

export const HR_VIEW_ROLES = ["super_admin", "hr", "branch_manager"];
export const HR_PAYROLL_ROLES = ["super_admin", "hr", "finance"];

// Administrative roles that manage employees but do NOT have self-service profiles.
// These roles must be kept out of /hr/my/* (redirected to /dashboard).
export const HR_ADMIN_ROLES = ["super_admin", "hr"];

// Employee self-service roles (hr:self:view / hr:self:edit)
export const HR_SELF_VIEW_ROLES = ["super_admin", "hr", "teacher", "academic", "sales", "branch_manager", "finance"];
export const HR_SELF_EDIT_ROLES = ["super_admin", "hr", "teacher", "academic", "sales", "branch_manager", "finance"];

// Roles whose members actually have employee records and see self-service nav items.
// Excludes super_admin and hr (administrative roles without self-service employee profiles).
export const ESS_NAV_ROLES = ["teacher", "academic", "sales", "branch_manager", "finance"];
export const TEACHER_SELF_ROLES = ["super_admin", "hr", "teacher", "academic"];
export const ACADEMIC_SELF_ROLES = ["super_admin", "hr", "academic"];
export const SALES_SELF_ROLES = ["super_admin", "hr", "sales", "branch_manager"];

export function useUserRoles(): string[] {
  const user = useAuthStore((s) => s.user);
  return user?.roles ?? (user?.role ? [user.role] : []);
}

export function hasAnyRole(roles: string[], allowed: string[]) {
  return roles.includes("super_admin") || allowed.some((role) => roles.includes(role));
}

export function canViewSelfService(roles: string[]) {
  return hasAnyRole(roles, HR_SELF_VIEW_ROLES);
}

export function canEditSelfService(roles: string[]) {
  return hasAnyRole(roles, HR_SELF_EDIT_ROLES);
}

export function canViewTeacherSelf(roles: string[]) {
  return hasAnyRole(roles, TEACHER_SELF_ROLES);
}

export function canViewAcademicSelf(roles: string[]) {
  return hasAnyRole(roles, ACADEMIC_SELF_ROLES);
}

export function canViewSalesSelf(roles: string[]) {
  return hasAnyRole(roles, SALES_SELF_ROLES);
}
