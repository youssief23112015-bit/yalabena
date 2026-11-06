import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Frictionless guest placement sessions (public onboarding flow):
 *  - "Take Instant Online Test Now" creates a PlacementTest linked ONLY to a
 *    Lead — no appointment slot and no examiner are involved, so both
 *    columns must accept NULL. Staff/slot flows keep setting them.
 * Triggers are safe: the insert trigger matches `WHERE id = NEW.slot_id`
 * (NULL matches nothing → no-op) and the delete trigger already guards
 * `IF OLD.slot_id IS NOT NULL`.
 */
export class PlacementTestGuestSession1794000000000 implements MigrationInterface {
  name = 'PlacementTestGuestSession1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "placement_tests" ALTER COLUMN "slot_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "placement_tests" ALTER COLUMN "examiner_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore NOT NULL only after removing the guest sessions that lack them.
    await queryRunner.query(
      `DELETE FROM "placement_tests" WHERE "slot_id" IS NULL OR "examiner_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "placement_tests" ALTER COLUMN "examiner_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "placement_tests" ALTER COLUMN "slot_id" SET NOT NULL`,
    );
  }
}
