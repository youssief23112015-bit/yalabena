import { SetMetadata } from '@nestjs/common';

// ---------------- Roles ----------------
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ---------------- Permissions ----------------
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_OPTIONS_KEY = 'permissionsOptions';

export interface PermissionsOptions {
  /** 'any' (default): one permission is enough. 'all': every permission is required. */
  mode?: 'any' | 'all';
}

type NestDecorator = ClassDecorator & MethodDecorator;

/**
 * Usage:
 *   @Permissions('users:create')
 *   @Permissions('users:create', 'users:delete')              // any-of
 *   @Permissions('users:create', 'users:update', { mode: 'all' })
 */
export function Permissions(
  ...args: (string | PermissionsOptions)[]
): NestDecorator {
  const last = args[args.length - 1];
  const hasOptions = typeof last === 'object' && last !== null;
  const permissions = (hasOptions ? args.slice(0, -1) : args) as string[];
  const options: PermissionsOptions = hasOptions
    ? (last as PermissionsOptions)
    : {};

  const setPermissions = SetMetadata(PERMISSIONS_KEY, permissions);
  const setOptions = SetMetadata(PERMISSIONS_OPTIONS_KEY, options);

  // NOTE: propertyKey/descriptor are OPTIONAL so this single function is
  // assignable to BOTH ClassDecorator (1 arg) and MethodDecorator (3 args).
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    setOptions(target, propertyKey as any, descriptor as any);
    setPermissions(target, propertyKey as any, descriptor as any);
  };
}