import { SetMetadata, applyDecorators } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_OPTIONS_KEY = 'permissions_options';

export interface PermissionsOptions {
  mode?: 'any' | 'all';
}

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const Permissions = (
  permissions: string | string[],
  options: PermissionsOptions = { mode: 'any' },
) => {
  const permArray = Array.isArray(permissions) ? permissions : [permissions];
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permArray),
    SetMetadata(PERMISSIONS_OPTIONS_KEY, options),
  );
};