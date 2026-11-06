import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The academy pivots to 100% online: the "Branch Manager" role disappears
 * along with the branch concept itself (see RemoveBranches1795000000000).
 *
 * Users who held ONLY `branch_manager` are re-pointed at `academic`, the
 * role that now carries the day-to-day operational duties (courses,
 * groups, attendance, certificates). Users who also hold another role
 * keep it and simply lose the branch_manager grant.
 *
 * The `branches:*` permissions are removed as well — they were dropped
 * from the permission seed in the same change.
 */
export class RemoveBranchManagerRole1796000000000 implements MigrationInterface {
  name = 'RemoveBranchManagerRole1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Re-point branch_manager-only users at `academic` ──
    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT ur.user_id, academic.id
      FROM user_roles ur
      JOIN roles bm ON bm.id = ur.role_id AND bm.slug = 'branch_manager'
      CROSS JOIN roles academic
      WHERE academic.slug = 'academic'
        AND NOT EXISTS (
          SELECT 1 FROM user_roles x
          WHERE x.user_id = ur.user_id AND x.role_id = academic.id
        )
      ON CONFLICT DO NOTHING
    `);

    // ── 2. Drop the branch_manager grants ──
    await queryRunner.query(`
      DELETE FROM user_roles ur
      USING roles bm
      WHERE ur.role_id = bm.id AND bm.slug = 'branch_manager'
    `);

    // ── 3. Drop the role itself ──
    await queryRunner.query(`DELETE FROM roles WHERE slug = 'branch_manager'`);

    // ── 4. Drop the branch-scoped permissions ──
    await queryRunner.query(`DELETE FROM permissions WHERE module = 'branches'`);
  }

  public async down(): Promise<void> {
    // The branch concept is gone; recreating the role would resurrect a
    // branch-scoped permission model that no longer exists.
    throw new Error(
      'RemoveBranchManagerRole migration is irreversible — the branch concept was removed permanently.',
    );
  }
}