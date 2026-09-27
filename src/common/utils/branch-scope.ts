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
  return user?.branchId ?? user?.branch_id ?? undefined;
}

/**
 * Branch a non-super-admin user is locked to, or undefined for super admin.
 * Pass the result as a query filter. Returns '__none__' for branchless
 * non-admins so their queries match nothing rather than everything.
 */
export function effectiveBranchFilter(user: AuthUser, requested?: string): string | undefined {
  if (isSuperAdmin(user)) return requested;
  return userBranchId(user) ?? '__none__';
}

export function assertBranchAccess(user: AuthUser, resourceBranchId: string | undefined) {
  if (isSuperAdmin(user)) return;
  const ub = userBranchId(user);
  if (ub && resourceBranchId && ub !== resourceBranchId) {
    throw Object.assign(new Error('Forbidden: cross-branch access denied'), { status: 403 });
  }
}
