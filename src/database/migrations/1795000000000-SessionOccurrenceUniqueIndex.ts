import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Safety net for automatic recurring-session generation:
 *
 * 1. Removes exact duplicate non-cancelled sessions (same group/date/start),
 *    keeping the OLDEST row so existing attendance history stays attached.
 *    Cancelled sessions are left untouched (they are historical records and
 *    are excluded from the unique index below).
 *
 * 2. Adds a PARTIAL unique index on sessions(group_id, date, start_time)
 *    WHERE cancelled_at IS NULL — concurrent activations or retried requests
 *    can never insert the same occurrence twice, while cancelled slots remain
 *    re-usable for a replacement session.
 *
 * LIMITATIONS (documented deliberately — review before running on
 * production data):
 *  - IRREVERSIBLE DATA LOSS: `down()` only drops the index. The deleted
 *    duplicate rows cannot be restored by `migration:revert`. Because
 *    attendances.session_id is ON DELETE CASCADE, any attendance recorded on
 *    a NEWER duplicate is deleted with it — if a newer duplicate holds
 *    attendance the oldest does not, back those rows up (or cancel the
 *    duplicate instead of deleting it) BEFORE running this migration.
 *  - LOCKING: the dedup DELETE takes row locks on the affected sessions and
 *    CREATE UNIQUE INDEX takes a SHARE lock blocking concurrent writes for
 *    its duration. On an academy-sized sessions table this is milliseconds;
 *    on a very large table (100k+ rows) schedule a maintenance window or
 *    replace statement 2 with CREATE UNIQUE INDEX CONCURRENTLY run outside a
 *    transaction.
 */
export class SessionOccurrenceUniqueIndex1795000000000 implements MigrationInterface {
  name = 'SessionOccurrenceUniqueIndex1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Deduplicate non-cancelled occurrences (keep the oldest row).
    await queryRunner.query(`
      DELETE FROM sessions s
      USING sessions k
      WHERE s.group_id = k.group_id
        AND s.date = k.date
        AND s.start_time = k.start_time
        AND s.cancelled_at IS NULL
        AND k.cancelled_at IS NULL
        AND (k.created_at < s.created_at OR (k.created_at = s.created_at AND k.id < s.id))
    `);

    // 2) Partial unique index: one live session per (group, date, start).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_group_date_start
        ON sessions (group_id, date, start_time)
        WHERE cancelled_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_sessions_group_date_start`);
  }
}
