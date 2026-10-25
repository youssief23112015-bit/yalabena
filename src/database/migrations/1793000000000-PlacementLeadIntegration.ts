import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Placement-test ↔ Lead integration (SRS §4.3):
 *  - leads.placement_score : the exam score/degree achieved (percent).
 *  - leads.placement_level : the evaluated CEFR level derived from the score.
 *  - leads_status_enum gains 'test_completed' so sales/academic can filter
 *    leads whose placement test was graded (vs. merely scheduled).
 * PostgreSQL cannot drop an enum value portably, so `down()` leaves
 * 'test_completed' in place — it is simply no longer written by the entity.
 */
export class PlacementLeadIntegration1793000000000 implements MigrationInterface {
  name = 'PlacementLeadIntegration1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The status enum may be named either `leads_status_enum` (created by this
    // migration chain / TypeORM synchronize) or `lead_status` (created by
    // database/speakup_tms_full_schema.sql which this project's Docker DB was
    // initialized from). Add the value to whichever type actually exists.
    await queryRunner.query(
      `DO $$
       BEGIN
         IF to_regtype('"public"."leads_status_enum"') IS NOT NULL THEN
           EXECUTE 'ALTER TYPE "public"."leads_status_enum" ADD VALUE IF NOT EXISTS ''test_completed''';
         ELSIF to_regtype('"public"."lead_status"') IS NOT NULL THEN
           EXECUTE 'ALTER TYPE "public"."lead_status" ADD VALUE IF NOT EXISTS ''test_completed''';
         END IF;
       END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "placement_score" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "placement_level" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "chk_leads_placement_level" CHECK ("placement_level" IS NULL OR "placement_level" IN ('A1','A2','B1','B2','C1','C2'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "chk_leads_placement_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP COLUMN IF EXISTS "placement_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP COLUMN IF EXISTS "placement_score"`,
    );
  }
}
