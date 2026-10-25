import { EntityManager } from 'typeorm';

/**
 * Transaction-scoped PostgreSQL advisory locks for scheduling writes.
 *
 * The teacher/room conflict checks in SessionSchedulingService and
 * SessionsService are check-then-write: under READ COMMITTED, two
 * concurrent transactions that book the same teacher or the same room in
 * different (or even the same) groups can both pass the check before
 * either has inserted anything, producing a double-booking that the
 * partial unique index on sessions(group_id, date, start_time) cannot
 * catch (it only protects ONE group's occurrences).
 *
 * The simplest reliable fix consistent with this architecture: before
 * running any conflict query, every write path takes transaction-scoped
 * advisory locks (pg_advisory_xact_lock — automatically released on
 * commit or rollback, so a failed request can never leak a lock) keyed
 * by the teacher UUID and each classroom UUID involved. Transactions
 * that touch the same teacher or room then serialize: the second one
 * waits, and its conflict check sees the first one's committed rows.
 *
 * Key properties:
 *  - keys are deduplicated and always acquired in sorted order, so two
 *    transactions locking overlapping key sets can never deadlock;
 *  - the intended lock hierarchy is: group ROW locks (SELECT … FOR
 *    UPDATE on `groups`, serializing same-group writers) FIRST, then
 *    these advisory locks (serializing cross-group writers);
 *  - hash collisions (1 in 2^32 per pair) can only ever cause extra
 *    serialization, never a missed conflict.
 */
export type SchedulingLockKind = 'teacher' | 'room';

export interface SchedulingLockKey {
  kind: SchedulingLockKind;
  id: string;
}

/** Namespaces keep the teacher and room lock spaces apart after hashing. */
const KIND_NAMESPACE: Record<SchedulingLockKind, string> = {
  teacher: 'sched.teacher',
  room: 'sched.room',
};

/**
 * Acquire one advisory lock per unique key, in a deterministic order.
 * Returns the ordered key strings actually locked (for logging/tests).
 * Must be called INSIDE an open transaction (`em` from
 * `dataSource.transaction`), otherwise the locks are released immediately
 * at the end of the implicit single-statement transaction.
 */
export async function acquireSchedulingLocks(
  em: EntityManager,
  keys: Array<SchedulingLockKey | null | undefined>,
): Promise<string[]> {
  const unique = new Set<string>();
  for (const key of keys) {
    if (!key?.id) continue;
    unique.add(`${KIND_NAMESPACE[key.kind]}:${key.id}`);
  }
  const ordered = [...unique].sort();
  for (const lockKey of ordered) {
    // hashtext() → int4; the single-argument overload of
    // pg_advisory_xact_lock takes bigint, so the cast is implicit and
    // deterministic for a given key string.
    await em.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);
  }
  return ordered;
}
