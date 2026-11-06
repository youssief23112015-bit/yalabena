import { DataSource } from 'typeorm';
import { Role } from '../../shared/entities/role.entity';
import { Permission } from '../../shared/entities/permission.entity';

/**
 * Idempotent repair: grant the ESS self-service permissions
 * (hr:self:view, hr:self:edit) to the intended roles without touching
 * any other role-permission rows.
 *
 * Intended roles: teacher, academic, sales, branch_manager, finance, hr
 * super_admin retains access via the RolesGuard super-admin bypass and
 * is intentionally left untouched (it already holds ~all permissions).
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING semantics (only inserts
 * missing rows, never deletes or changes unrelated permissions).
 */
const ESS_ROLES = ['teacher', 'academic', 'sales', 'branch_manager', 'finance', 'hr'];
const ESS_PERMISSIONS = [
  { module: 'hr', action: 'self:view' },
  { module: 'hr', action: 'self:edit' },
];

export async function repairHrSelfServicePermissions(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);

  const roles = await roleRepo.find();
  const rolesBySlug = new Map(roles.map((r) => [r.slug, r]));

  const permissions = await permissionRepo.find();
  const permsByCode = new Map(
    permissions.map((p) => [`${p.module}:${p.action}`, p]),
  );

  const missingRoles = ESS_ROLES.filter((slug) => !rolesBySlug.has(slug));
  if (missingRoles.length) {
    throw new Error(`Missing roles: ${missingRoles.join(', ')}`);
  }

  const missingPerms = ESS_PERMISSIONS.filter(
    (p) => !permsByCode.has(`${p.module}:${p.action}`),
  );
  if (missingPerms.length) {
    throw new Error(`Missing permissions: ${missingPerms.map((p) => `${p.module}:${p.action}`).join(', ')}`);
  }

  // Use the junction table directly so we only INSERT missing rows and
  // never delete or alter existing role-permission assignments.
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    let inserted = 0;
    for (const slug of ESS_ROLES) {
      const role = rolesBySlug.get(slug)!;
      for (const { module, action } of ESS_PERMISSIONS) {
        const permission = permsByCode.get(`${module}:${action}`)!;
        const already = await queryRunner.query(
          `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
          [role.id, permission.id],
        );
        if (already.length) continue;
        await queryRunner.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
          [role.id, permission.id],
        );
        inserted++;
        console.log(`Granted ${module}:${action} to role ${slug}`);
      }
    }
    console.log(`Hr self-service permission repair complete. Inserted ${inserted} role-permission row(s).`);
  } finally {
    await queryRunner.release();
  }
}
