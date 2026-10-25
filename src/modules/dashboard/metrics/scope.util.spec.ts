import { resolveScope, resolveBranchFilter } from './scope.util';
import { AuthUser } from '../../../common/utils/branch-scope';

const user = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u-1',
  userId: 'u-1',
  branchId: 'b-1',
  branch_id: 'b-1',
  roles: ['branch_manager'],
  ...overrides,
});

describe('resolveScope', () => {
  it('super_admin may request any branch', () => {
    const u = user({ id: 'sa-1', roles: ['super_admin'] });
    const s = resolveScope(u, 'b-2');
    expect(s.isSuperAdmin).toBe(true);
    expect(s.branchId).toBe('b-2');
  });

  it('non-super-admin is locked to their own branch', () => {
    const u = user({ id: 'm-1', roles: ['branch_manager'] });
    const s = resolveScope(u, 'b-99');
    expect(s.isSuperAdmin).toBe(false);
    expect(s.branchId).toBe('b-1');
  });

  it('branchless non-admin resolves to undefined filter', () => {
    const u = user({ id: 'm-1', roles: ['sales'], branchId: undefined, branch_id: undefined });
    const s = resolveScope(u, 'b-99');
    expect(s.branchId).toBeUndefined();
  });

  it('resolved userId matches the caller', () => {
    const u = user({ id: 'u-1' });
    expect(resolveScope(u).userId).toBe('u-1');
  });

  it('role-specific ids start null', () => {
    expect(resolveScope(user()).employeeId).toBeNull();
    expect(resolveScope(user()).teacherId).toBeNull();
    expect(resolveScope(user()).studentId).toBeNull();
  });
});

describe('resolveBranchFilter', () => {
  it('super_admin returns requested branch', () => {
    expect(resolveBranchFilter(user({ roles: ['super_admin'] }), 'b-2')).toBe('b-2');
  });

  it('non-super-admin returns their own branch_id', () => {
    expect(resolveBranchFilter(user({ roles: ['sales'] }))).toBe('b-1');
  });

  it('branchless non-admin returns undefined', () => {
    expect(resolveBranchFilter(user({ roles: ['sales'], branchId: undefined, branch_id: undefined }))).toBe('__none__');
  });
});