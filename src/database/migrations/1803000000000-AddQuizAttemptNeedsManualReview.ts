import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `needs_manual_review` column to `quiz_attempts`.
 *
 * Context
 * -------
 * The `QuizAttempt` entity (src/shared/entities/quiz-attempt.entity.ts) declares
 *   @Column({ name: 'needs_manual_review', type: 'boolean', default: false })
 *   needs_manual_review: boolean;
 *
 * but the `quiz_attempts` table in the running Docker PostgreSQL database was
 * never updated to include that column, so `POST /api/v1/lms/quizzes/:id/start`
 * (LmsService.startAttempt) fails with:
 *
 *   QueryFailedError: column "needs_manual_review" of relation "quiz_attempts"
 *   does not exist
 *
 * This migration adds the column using `ADD COLUMN IF NOT EXISTS` so it is safe
 * to run repeatedly (idempotent) on databases where the column already exists.
 */
export class AddQuizAttemptNeedsManualReview1803000000000
  implements MigrationInterface {
  name = 'AddQuizAttemptNeedsManualReview1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "needs_manual_review" BOOLEAN NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" DROP COLUMN IF EXISTS "needs_manual_review"`,
    );
  }
}
