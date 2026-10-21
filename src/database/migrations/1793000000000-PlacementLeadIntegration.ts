import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Placement-test ↔ Lead integration (SRS §4.3):
 *  - leads.placement_score : the exam score/degree achieved (percent).
 *  - leads.placement_level : the evaluated CEFR level derived from the score.
 *  - the leads status enum gains 'test_completed' so sales/academic can filter
 *    leads whose placement test was graded (vs. merely scheduled).
 *
 * The leads.status enum type has shipped under TWO names depending on how the
 * database was bootstrapped:
 *   - TypeORM InitialSchema migration  -> "leads_status_enum"
 *   - database/speakup_tms_full_schema -> "lead_status"
 * Hard-coding either name made this migration 500 on the other flavour
 * ("type ... does not exist"), so up() resolves the real type from
 * pg_catalog and extends THAT one.
 *
 * PostgreSQL cannot drop an enum value portably, so `down()` leaves
 * 'test_completed' in place — it is simply no longer written by the entity.
 */
export class PlacementLeadIntegration1793000000000 implements MigrationInterface {
  name = 'PlacementLeadIntegration1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'test_completed' to whichever enum type actually backs leads.status.
    await queryRunner.query(
      `DO $$
       DECLARE
         enum_type_name TEXT;
       BEGIN
         SELECT t.typname INTO enum_type_name
         FROM pg_attribute a
         JOIN pg_class c ON c.oid = a.attrelid
         JOIN pg_type t ON t.oid = a.atttypid
         WHERE c.relname = 'leads'
           AND a.attname = 'status'
           AND t.typtype = 'e';

         IF enum_type_name IS NOT NULL THEN
           EXECUTE format(
             'ALTER TYPE %I ADD VALUE IF NOT EXISTS ''test_completed''',
             enum_type_name
           );
         END IF;
       END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "placement_score" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "placement_level" character varying(10)`,
    );
    // ADD CONSTRAINT has no IF NOT EXISTS — guard via pg_constraint so the
    // migration stays idempotent on re-run / partially-applied databases.
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_placement_level'
         ) THEN
           ALTER TABLE "leads"
             ADD CONSTRAINT "chk_leads_placement_level"
             CHECK ("placement_level" IS NULL
                    OR "placement_level" IN ('A1','A2','B1','B2','C1','C2'));
         END IF;
       END $$;`,
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
