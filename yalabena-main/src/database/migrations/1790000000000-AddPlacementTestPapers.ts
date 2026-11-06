import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlacementTestPapers1790000000000 implements MigrationInterface {
  name = 'AddPlacementTestPapers1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "placement_test_papers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "test_id" uuid NOT NULL,
        "level" character varying(10) NOT NULL,
        "question_ids" jsonb NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_placement_test_papers" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ptp_test" UNIQUE ("test_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ptp_test') THEN
          ALTER TABLE "placement_test_papers"
            ADD CONSTRAINT "fk_ptp_test" FOREIGN KEY ("test_id")
            REFERENCES "placement_tests"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "placement_test_papers"`);
  }
}