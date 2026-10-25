import { acquireSchedulingLocks } from './scheduling-locks.util';

/**
 * Unit tests for the scheduling advisory-lock helper: deduplication,
 * deterministic (sorted) acquisition order, skipping of empty keys, and
 * one pg_advisory_xact_lock call per unique key.
 */
describe('acquireSchedulingLocks', () => {
  function makeEm() {
    const queries: Array<{ sql: string; params: any[] }> = [];
    const em: any = {
      query: jest.fn(async (sql: string, params?: any[]) => {
        queries.push({ sql, params: params ?? [] });
        return [];
      }),
    };
    return { em, queries };
  }

  it('locks one advisory lock per key, sorted, with stable namespaced names', async () => {
    const { em, queries } = makeEm();
    const locked = await acquireSchedulingLocks(em, [
      { kind: 'room', id: 'room-b' },
      { kind: 'teacher', id: 't-1' },
      { kind: 'room', id: 'room-a' },
    ]);

    expect(locked).toEqual(['sched.room:room-a', 'sched.room:room-b', 'sched.teacher:t-1']);
    expect(queries).toHaveLength(3);
    for (const q of queries) {
      expect(q.sql).toContain('pg_advisory_xact_lock(hashtext($1))');
    }
    expect(queries.map((q) => q.params[0])).toEqual(locked);
  });

  it('deduplicates repeated keys and skips null/empty entries', async () => {
    const { em, queries } = makeEm();
    const locked = await acquireSchedulingLocks(em, [
      { kind: 'teacher', id: 't-1' },
      { kind: 'teacher', id: 't-1' },
      null,
      undefined,
      { kind: 'room', id: '' },
    ]);

    expect(locked).toEqual(['sched.teacher:t-1']);
    expect(queries).toHaveLength(1);
  });

  it('issues no queries when no keys are provided', async () => {
    const { em, queries } = makeEm();
    await expect(acquireSchedulingLocks(em, [])).resolves.toEqual([]);
    expect(queries).toHaveLength(0);
  });
});
