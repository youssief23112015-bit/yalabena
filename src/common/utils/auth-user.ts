/**
 * Lightweight authenticated-user shape used by services/controllers.
 * The academy is 100% online — no branch scoping exists anymore.
 */
export interface AuthUser {
  id: string;
  userId?: string;
  roles?: string[];
}

export function isSuperAdmin(user: AuthUser): boolean {
  return Array.isArray(user?.roles) && user.roles.includes('super_admin');
}
