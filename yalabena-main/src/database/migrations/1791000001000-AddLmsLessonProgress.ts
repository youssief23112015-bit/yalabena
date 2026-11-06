import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-student lesson completion tracking (SRS 4.6). Backs
 * PATCH /lms/lessons/:id/toggle-completion and the `completed` flag the
 * frontend LMS page shows on each lesson checkbox.
 */
export class AddLmsLessonProgress1791000001000 implements MigrationInterface {
  name = 'AddLmsLessonProgress1791000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lms_lesson_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lesson_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "completed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lms_lesson_progress" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lms_lesson_progress" UNIQUE ("lesson_id", "user_id"),
        CONSTRAINT "FK_lms_progress_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_lms_progress_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lms_lesson_progress"`);
  }
}
