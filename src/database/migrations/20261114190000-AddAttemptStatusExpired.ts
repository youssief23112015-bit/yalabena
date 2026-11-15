import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `expired` value to the `public.attempt_status` enum — idempotently.
 *
 * Context
 * -------
 * The `QuizAttempt` entity and `LmsService.submitAttempt` use
 * `AttemptStatus.EXPIRED` (`'expired'`) when a time-limited attempt is
 * submitted after its deadline (`src/common/enums/attempt-status.enum.ts`,
 * `src/modules/lms/lms.service.ts`). The `quiz_attempts.status` column of the
 * running database is typed as `public.attempt_status`, so persisting
 * `AttemptStatus.EXPIRED` failed unless the enum contained `expired`:
 *
 *   QueryFailedError: invalid input value for enum attempt_status: "expired"
 *
 * Root cause of the startup failure
 * ---------------------------------
 * The `expired` label had already been added to `public.attempt_status`
 * out-of-band (the running enum already contains `in_progress`, `submitted`,
 * `graded`, `abandoned` and `expired`, and an existing `quiz_attempts` row
 * already uses `status = 'expired'`). However, this migration was never
 * recorded in `public.migrations`. With `migrationsRun: true` TypeORM treats
 * it as pending on every startup and re-executes
 * `ALTER TYPE attempt_status ADD VALUE 'expired'`, which fails with:
 *
 *   QueryFailedError: enum label "expired" already exists
 *
 * Fix
 * ---
 * `ALTER TYPE ... ADD VALUE IF NOT EXISTS` is supported by PostgreSQL 15:
 * when the label already exists it emits a notice and takes no action, so the
 * migration is safe to re-run and no existing enum values, rows, or business
 * data are touched. The type is referenced by its schema-qualified name
 * `public.attempt_status`, discovered from `pg_enum` (never guessed).
 *
 * Transaction note
 * ----------------
 * `ALTER TYPE ... ADD VALUE` must not run inside a transaction block on
 * PostgreSQL 15. The DataSource is configured with
 * `migrationsTransactionMode: "none"` (src/database/database.module.ts:23),
 * so this migration executes outside a transaction.
 */
export class AddAttemptStatusExpired20261114190000
  implements MigrationInterface {
  name = 'AddAttemptStatusExpired20261114190000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE public.attempt_status ADD VALUE IF NOT EXISTS 'expired';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing a single enum value without
    // rewriting the dependent table, so down() is intentionally a no-op.
    // The `expired` label (and existing rows that use it) stays intact.
    await queryRunner.query(`SELECT 1`);
  }
}
