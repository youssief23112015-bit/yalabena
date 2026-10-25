import { AuthUser, isSuperAdmin, userBranchId, effectiveBranchFilter } from '../../../common/utils/branch-scope';

/**
 * Resolved request scope for dashboard metrics.
 *
 * branchId: undefined for super_admin (no branch filter / all branches),
 *           the requested branch_id if super_admin passed one,
 *           otherwise the user's own branch (forced).
 * isSuperAdmin: whether the caller is super_admin.
 * userId: the caller's user id.
 * employeeId/teacherId/studentId: resolved role-specific ids, null when not
 * applicable or not yet resolved (filled by the metric service that needs them).
 */
export interface ResolvedScope {
  branchId: string | undefined;
  isSuperAdmin: boolean;
  userId: string | undefined;
  employeeId: string | null;
  teacherId: string | null;
  studentId: string | null;
}

/**
 * Resolve the branch + role scope for a dashboard request.
 * Non-super-admin users are always locked to their own branch regardless of
 * any branch_id they send; super_admin may optionally scope to a branch.
 */
export function resolveScope(
  user: AuthUser,
  requestedBranchId?: string,
): ResolvedScope {
  const isSuperAdminFlag = isSuperAdmin(user);
  return {
    branchId: effectiveBranchFilter(user, requestedBranchId) === '__none__'
      ? undefined
      : effectiveBranchFilter(user, requestedBranchId),
    isSuperAdmin: isSuperAdminFlag,
    userId: user?.id,
    employeeId: null,
    teacherId: null,
    studentId: null,
  };
}

/** The raw branch filter string to pass into a query (may be '__none__'). */
export function resolveBranchFilter(user: AuthUser, requestedBranchId?: string): string | undefined {
  return effectiveBranchFilter(user, requestedBranchId);
}