import { DataSource, In } from 'typeorm';
import { Role } from '../../shared/entities/role.entity';
import { Permission } from '../../shared/entities/permission.entity';

const matrix: Record<string, string[]> = {
  super_admin: ['*'],

  branch_manager: [
    'crm:view', 'crm:create', 'crm:edit', 'crm:delete', 'crm:assign',
    'sales:view', 'placement:view',
    'groups:view', 'groups:create', 'groups:edit', 'groups:delete',
    'attendance:view', 'attendance:create', 'attendance:edit',
    'lms:view', 'finance:view', 'finance:create',
    'certificates:view', 'certificates:create',
    'activities:view', 'activities:create', 'activities:edit', 'activities:delete',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:issue',
    'kb:view', 'reports:view', 'reports:export', 'branches:view',
    'users:read', 'users:create', 'users:edit',
    'chat:view', 'chat:send', 'system:view',
  ],

  sales: [
    'crm:view', 'crm:create', 'crm:edit',
    'sales:view', 'sales:create', 'sales:edit',
    'placement:view', 'groups:view', 'attendance:view', 'lms:view',
    'inventory:view', 'inventory:issue', 'activities:view', 'kb:view',
    'chat:view', 'chat:send',
  ],

  finance: [
    'finance:view', 'finance:create', 'finance:edit', 'finance:approve', 'finance:export',
    'certificates:view', 'crm:view', 'inventory:view', 'reports:view', 'reports:export',
    'kb:view', 'chat:view',
  ],

  academic: [
    'placement:view', 'placement:create', 'placement:edit', 'placement:delete',
    'groups:view', 'groups:create', 'groups:edit', 'groups:delete',
    'attendance:view', 'attendance:create', 'attendance:edit', 'attendance:lock',
    'lms:view', 'lms:create', 'lms:edit', 'lms:delete', 'lms:grade',
    'certificates:view', 'certificates:create', 'certificates:edit', 'certificates:revoke',
    'reports:view', 'reports:export', 'kb:view', 'chat:view', 'chat:send',
  ],

  teacher: [
    'attendance:view', 'attendance:create', 'attendance:edit',
    'lms:view', 'lms:create', 'lms:edit', 'lms:grade',
    'groups:view', 'chat:view', 'chat:send', 'kb:view', 'reports:view',
  ],

  student: [
    'lms:view', 'chat:view', 'chat:send', 'activities:view', 'kb:view',
  ],

  moderator: [
    'chat:view', 'chat:moderate', 'chat:ban',
  ],

  hr: [
    'hr:view', 'hr:create', 'hr:edit', 'hr:approve', 'hr:process_payroll',
    'kb:view', 'kb:create', 'kb:edit', 'kb:delete', 'reports:view', 'chat:view',
  ],

  auditor: [
    'crm:view', 'sales:view', 'placement:view', 'groups:view', 'attendance:view',
    'lms:view', 'finance:view', 'certificates:view', 'hr:view',
    'activities:view', 'inventory:view', 'kb:view', 'reports:view',
    'branches:view', 'system:view', 'chat:view',
  ],
};

export async function seedRolePermissions(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);

  const roles = await roleRepo.find();
  const permissions = await permissionRepo.find();
  const rolesBySlug = new Map(roles.map((r) => [r.slug, r]));
  const permissionsByCode = new Map(
    permissions.map((p) => [`${p.module}:${p.action}`, p]),
  );

  const allPermissions = permissions;
  const errors: string[] = [];

  for (const [slug, codes] of Object.entries(matrix)) {
    const role = rolesBySlug.get(slug);
    if (!role) {
      errors.push(`Missing role: ${slug}`);
      continue;
    }

    if (codes.includes('*')) {
      role.permissions = allPermissions;
    } else {
      const missing = codes.filter((code) => !permissionsByCode.has(code));
      if (missing.length) {
        errors.push(`Missing permissions for ${slug}: ${missing.join(', ')}`);
        continue;
      }
      role.permissions = codes.map((code) => permissionsByCode.get(code)!);
    }

    await roleRepo.save(role);
    console.log(`Role permissions seeded: ${slug} (${role.permissions.length})`);
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
}
