import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-branch price overrides for courses (multi-branch academies charge
 * differently per location). Backs the new CourseBranchPricing entity used
 * by GET/POST /courses/:id/branch-pricing.
 */
export class AddCourseBranchPricing1791000000000 implements MigrationInterface {
  name = 'AddCourseBranchPricing1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_branch_pricing" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_branch_pricing" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_course_branch_pricing" UNIQUE ("course_id", "branch_id"),
        CONSTRAINT "FK_cbp_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_cbp_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_branch_pricing"`);
  }
}
