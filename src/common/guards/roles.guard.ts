import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY, PERMISSIONS_OPTIONS_KEY } from '../decorators/roles.decorator';
import type { PermissionsOptions } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // --- Public Route Bypass ---
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // يتجاوز فحص الأدوار والمستخدم تماماً للمسارات العامة
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required for this resource');
    }

    // --- Super Admin Bypass ---
    const userRoles: string[] = user.roles ?? [];
    if (userRoles.includes('super_admin')) {
      return true; // يتجاوز أي قيود roles أو permissions فوراً
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const permOptions = this.reflector.getAllAndOverride<PermissionsOptions>(
      PERMISSIONS_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? {};

    // No requirements -> allow
    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    // --- Roles: any-of ---
    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Requires one of roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // --- Permissions ---
    if (requiredPermissions?.length) {
      const granted: string[] = user.permissions ?? [];
      const mode = permOptions.mode ?? 'any';
      const check = (perm: string) =>
        granted.some((g) => this.permissionMatches(g, perm));

      const passed = mode === 'all'
        ? requiredPermissions.every(check)
        : requiredPermissions.some(check);

      if (!passed) {
        throw new ForbiddenException(
          `Requires permissions (${mode}): ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }

  /**
   * Wildcard / hierarchical permission matching.
   *   '*'                          -> everything
   *   'users' or 'users:*'         -> any action inside the users module
   *   'users:create'               -> exact match
   */
  private permissionMatches(granted: string, required: string): boolean {
    if (granted === '*' || granted === required) return true;

    const [gModule, gAction = '*'] = granted.split(':');
    const [rModule, rAction = '*'] = required.split(':');
    if (gModule !== rModule) return false;
    if (!rAction || !gAction) return true; // module-only grant covers the whole module
    return gAction === '*' || gAction === rAction;
  }
}