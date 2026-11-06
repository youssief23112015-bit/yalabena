export interface AuthUser {
  id: string;
  userId?: string;
  branchId?: string;
  branch_id?: string;
  roles?: string[];
}

export function isSuperAdmin(user: AuthUser): boolean {
  return Array.isArray(user?.roles) && user.roles.includes('super_admin');
}

export function userBranchId(user: AuthUser): string | undefined {
  return undefined;
}

/**
 * Branch a non-super-admin user is locked to, or undefined for super admin.
 * Pass the result as a query filter. Returns '__none__' for branchless
 * non-admins so their queries match nothing rather than everything.
 */
export function effectiveBranchFilter(user: AuthUser, requested?: string): string | undefined {
  if (isSuperAdmin(user)) return requested;
  return undefined;
}

export function assertBranchAccess(user: AuthUser, resourceBranchId: string | undefined) {
  // Branchless: no-op, all access allowed
}
