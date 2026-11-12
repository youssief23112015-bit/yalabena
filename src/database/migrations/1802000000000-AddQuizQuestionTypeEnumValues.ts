import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Idempotent migration for the PostgreSQL enums used by quiz question types.
 *
 * Context
 * -------
 * Two enum types exist in the database:
 *   1. public.quiz_questions_type_enum  (referenced by quiz_questions.type column)
 *   2. public.question_type              (also referenced by quiz_questions.type column)
 *
 * Both were originally created with lowercase values only:
 *   ('mcq', 'fill_blank', 'matching', 'true_false', 'ordering', 'short_answer')
 *
 * The shared `QuestionType` enum (src/common/enums/question-type.enum.ts) uses
 * UPPERCASE values ('MCQ', 'TRUE_FALSE', ...). Storing an uppercase value in a
 * column typed as either enum fails with:
 *   invalid input value for enum question_type: "TRUE_FALSE"
 *
 * This migration:
 *   1. Creates each enum type if missing (DO block + EXCEPTION handling),
 *      so it is safe on databases where InitialSchema never created the type.
 *   2. Adds each uppercase variant to BOTH enums only when not already present
 *      (guarded by a pg_enum lookup), so re-running the migration is safe.
 *
 * WARNING: TRANSACTION RESTRICTION (read before running)
 * -----------------------------------------------------
 * PostgreSQL forbids `ALTER TYPE ... ADD VALUE` inside a transaction block.
 * TypeORM wraps migrations in a transaction by default
 * (MigrationExecutor `transaction` option defaults to "all").
 *
 * Running this migration with the default transactional behaviour makes step 2
 * fail with:
 *   "ALTER TYPE ... ADD VALUE cannot run inside a transaction block"
 *
 * Required fix: disable migration transactions in the DataSource options
 * (src/database/database.module.ts):
 *
 *   migrationsRun: true,
 *   migrationsTransactionMode: "none",   // <-- add this
 *
 * Trade-off: migrations are no longer wrapped in a transaction, so a failed
 * migration can leave partial schema changes. If you prefer to keep
 * transactions for other migrations, run Step 2's ALTER TYPE statements
 * manually via psql/pgAdmin outside of TypeORM's migration runner instead.
 */
export class AddQuizQuestionTypeEnumValues1802000000000
  implements MigrationInterface {
  name = 'AddQuizQuestionTypeEnumValues1802000000000';

  /**
   * Enum type names that need uppercase values added.
   */
  private readonly enumTypes = [
    'quiz_questions_type_enum',
    'question_type',
  ];

  /**
   * Lowercase values the enum types were originally created with.
   */
  private readonly baseValues = [
    'mcq',
    'fill_blank',
    'matching',
    'true_false',
    'ordering',
    'short_answer',
  ];

  /**
   * Uppercase variants required by the shared QuestionType enum.
   */
  private readonly upperValues = [
    'MCQ',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'MATCHING',
    'ORDERING',
    'FILL_BLANK',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const enumType of this.enumTypes) {
      // ── Step 1: ensure the enum type exists (idempotent) ──
      const baseList = this.baseValues.map((v) => `'${v}'`).join(', ');
      await queryRunner.query(`
        DO $$
        BEGIN
          CREATE TYPE "public"."${enumType}" AS ENUM (${baseList});
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // ── Step 2: add each uppercase value only if not already present ──
      // PostgreSQL has no `ALTER TYPE ... ADD VALUE IF NOT EXISTS`, so we guard
      // each addition with a pg_enum lookup. Fully idempotent.
      // WARNING: must run outside a transaction block (see warning above).
      for (const value of this.upperValues) {
        await queryRunner.query(this.addEnumValueIfMissingSql(enumType, value));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing individual values from an enum type.
    // The added uppercase values remain in place; application code continues to
    // store uppercase QuestionType values. Intentionally a no-op.
  }

  /**
   * Builds a PL/pgSQL DO block that appends `value` to the specified enum type
   * only when it is not already registered in pg_enum. Values are hard-coded
   * constants; single quotes are escaped to keep the generated SQL safe.
   */
  private addEnumValueIfMissingSql(enumType: string, value: string): string {
    const esc = (v: string) => v.replace(/'/g, "'" + "'");
    const escaped = esc(value);
    return `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public'
            AND t.typname = '${enumType}'
            AND e.enumlabel = '${escaped}'
        ) THEN
          ALTER TYPE "public"."${enumType}" ADD VALUE '${escaped}';
        END IF;
      END $$;
    `;
  }
}