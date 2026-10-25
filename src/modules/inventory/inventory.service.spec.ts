import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryItemsService } from './inventory.service';
import { InventoryItem } from '../../shared/entities/inventory-item.entity';
import { StockLevel } from '../../shared/entities/stock-level.entity';
import { StockMove } from '../../shared/entities/stock-move.entity';
import { StudentItemIssue } from '../../shared/entities/student-item-issue.entity';
import { InventoryCategory } from '../../common/enums/inventory-category.enum';
import { InventoryStatus } from '../../common/enums/inventory-status.enum';
import { ItemCondition } from '../../common/enums/item-condition.enum';
import { StockMoveType } from '../../common/enums/stock-move-type.enum';

/**
 * In-memory stand-in for PostgreSQL that models the three properties the stock
 * code relies on: transactions with rollback, FOR UPDATE row locks (held until
 * the transaction ends) and the DB constraints (unique sku, stock >= 0).
 * It does NOT execute SQL, so query-builder / raw-SQL reports are not covered here.
 */
class FakeDb {
  tables: Record<string, any[]> = {
    InventoryItem: [], StockLevel: [], StockMove: [], StudentItemIssue: [],
    students: [{ id: 'stu-1' }], branches: [{ id: 'br-A', name: 'Branch A' }, { id: 'br-B', name: 'Branch B' }],
  };
  private seq = 0;
  private locks = new Map<string, { owner: object; done: Promise<void> }>();

  uid(prefix = 'id') { return `${prefix}-${++this.seq}`; }
  /** Undo exactly the writes one transaction made (other transactions are untouched). */
  undo(journal: Array<{ table: string; op: 'insert' | 'update'; id: string; prev?: any }>) {
    for (const j of [...journal].reverse()) {
      if (j.op === 'insert') this.tables[j.table] = this.tables[j.table].filter((r) => r.id !== j.id);
      else {
        const i = this.tables[j.table].findIndex((r) => r.id === j.id);
        if (i >= 0) this.tables[j.table][i] = j.prev;
      }
    }
  }
  name(E: any) { return typeof E === 'string' ? E : E.name; }
  match(row: any, where: any) {
    return Object.entries(where ?? {}).every(([k, v]: any) => (v && v._in ? v._in.includes(row[k]) : row[k] === v));
  }

  makeManager(held: Array<() => void>, journal: any[] = []) {
    const db = this;
    const owner = {}; // identifies the transaction that owns the locks it takes
    const manager: any = {
      create: (E: any, obj: any) => ({ ...obj }),
      save: async (E: any, obj: any) => {
        const t = db.tables[db.name(E)];
        if (db.name(E) === 'InventoryItem' && obj.sku && t.some((r) => r.sku === obj.sku && r.id !== obj.id)) {
          throw Object.assign(new Error('duplicate key'), { code: '23505' });
        }
        if (!obj.id) {
          obj.id = db.uid(db.name(E));
          obj.created_at = new Date();
          if (db.name(E) === 'InventoryItem') obj.status = obj.status ?? 'active';
          t.push({ ...obj });
          journal.push({ table: db.name(E), op: 'insert', id: obj.id });
        } else {
          const i = t.findIndex((r) => r.id === obj.id);
          if (i >= 0) {
            journal.push({ table: db.name(E), op: 'update', id: obj.id, prev: { ...t[i] } });
            t[i] = { ...t[i], ...obj };
          } else {
            t.push({ ...obj });
            journal.push({ table: db.name(E), op: 'insert', id: obj.id });
          }
        }
        return obj;
      },
      update: async (E: any, crit: any, patch: any) => {
        const row = db.tables[db.name(E)].find((r) => db.match(r, crit));
        if (row) {
          if (db.name(E) === 'StockLevel' && patch.quantity !== undefined && patch.quantity < 0) {
            throw Object.assign(new Error('chk_sl_quantity'), { code: '23514' });
          }
          journal.push({ table: db.name(E), op: 'update', id: row.id, prev: { ...row } });
          Object.assign(row, patch);
        }
      },
      findOne: async (E: any, opts: any) => {
        const t = db.tables[db.name(E)];
        const row = t.find((r) => db.match(r, opts.where));
        if (row && opts.lock) {
          // FOR UPDATE: wait until whoever holds the row releases it
          const key = `${db.name(E)}:${row.id}`;
          // re-entrant for the owning transaction, like PostgreSQL row locks
          while (db.locks.has(key) && db.locks.get(key)!.owner !== owner) await db.locks.get(key)!.done;
          if (!db.locks.has(key)) {
            let release!: () => void;
            db.locks.set(key, { owner, done: new Promise<void>((res) => (release = res)) });
            held.push(() => { db.locks.delete(key); release(); });
          }
          return { ...db.tables[db.name(E)].find((r) => r.id === row.id) };
        }
        return row ? { ...row } : null;
      },
      query: async (sql: string, params: any[]) => {
        if (sql.startsWith('INSERT INTO stock_levels')) {
          const [item_id, branch_id] = params;
          if (!db.tables.StockLevel.some((r) => r.item_id === item_id && r.branch_id === branch_id)) {
            const row = { id: db.uid('sl'), item_id, branch_id, quantity: 0, last_counted_at: null };
            db.tables.StockLevel.push(row);
            journal.push({ table: 'StockLevel', op: 'insert', id: row.id });
          }
          return [];
        }
        if (sql.includes('FROM students')) return db.tables.students.filter((s) => s.id === params[0]);
        if (sql.includes('FROM course_materials')) return [{ c: 0 }];
        throw new Error('FakeDb: unsupported SQL ' + sql);
      },
    };
    return manager;
  }

  dataSource() {
    const db = this;
    return {
      transaction: async (cb: (m: any) => Promise<any>) => {
        const held: Array<() => void> = [];
        const journal: any[] = [];
        const manager = db.makeManager(held, journal);
        try {
          return await cb(manager);
        } catch (e) {
          db.undo(journal);
          throw e;
        } finally {
          held.forEach((r) => r());
        }
      },
      query: (sql: string, params: any[]) => db.makeManager([]).query(sql, params),
    };
  }

  repo(E: any) {
    const db = this;
    const t = () => db.tables[db.name(E)];
    return {
      findOne: async (o: any) => { const r = t().find((x) => db.match(x, o.where)); return r ? { ...r } : null; },
      find: async (o: any = {}) => t().filter((x) => db.match(x, o.where)).map((x) => {
        const c: any = { ...x };
        if (o.relations?.includes('branch')) c.branch = db.tables.branches.find((b) => b.id === x.branch_id);
        return c;
      }),
      count: async (o: any = {}) => t().filter((x) => db.match(x, o.where)).length,
      save: async (obj: any) => db.makeManager([]).save(E, obj),
      remove: async (obj: any) => { db.tables[db.name(E)] = t().filter((x) => x.id !== obj.id); return obj; },
    };
  }
}

const ADMIN = { id: 'u-admin', roles: ['super_admin'], branchId: null };
const MANAGER_A = { id: 'u-mgr-a', roles: ['branch_manager'], branchId: 'br-A' };

describe('InventoryItemsService (stock logic against in-memory DB model)', () => {
  let db: FakeDb;
  let svc: InventoryItemsService;

  const makeItem = async (over: any = {}) => {
    const r = await svc.create(
      { name: 'Book', sku: `SKU-${Math.random()}`, category: InventoryCategory.BOOK, unit_cost: 10, sale_price: 15, ...over },
      ADMIN,
    );
    return r;
  };
  const qty = (itemId: string, branch: string) =>
    db.tables.StockLevel.find((s) => s.item_id === itemId && s.branch_id === branch)?.quantity ?? 0;

  beforeEach(() => {
    db = new FakeDb();
    svc = new InventoryItemsService(
      db.dataSource() as any,
      db.repo(InventoryItem) as any,
      db.repo(StockLevel) as any,
      db.repo(StockMove) as any,
      db.repo(StudentItemIssue) as any,
    );
  });

  // ---------- items ----------
  it('creates an item with opening stock as one IN move', async () => {
    const item = await makeItem({ initial_quantity: 12, branch_id: 'br-A' });
    expect(qty(item.id, 'br-A')).toBe(12);
    expect(db.tables.StockMove).toHaveLength(1);
    expect(db.tables.StockMove[0].type).toBe(StockMoveType.IN);
    expect(db.tables.StockMove[0].reference_type).toBe('manual');
  });

  it('rejects initial_quantity without a branch', async () => {
    await expect(makeItem({ initial_quantity: 5 })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.tables.InventoryItem).toHaveLength(0);
  });

  it('rejects a duplicate SKU on create and update', async () => {
    await makeItem({ sku: 'DUP-1' });
    await expect(makeItem({ sku: 'DUP-1' })).rejects.toBeInstanceOf(ConflictException);
    const other = await makeItem({ sku: 'OTHER' });
    await expect(svc.update(other.id, { sku: 'DUP-1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a database unique violation (race) to ConflictException', async () => {
    // pre-check passes (no row yet) but the insert loses a race: simulate by pre-inserting after the check
    const original = db.repo(InventoryItem).findOne;
    const racing = { ...db.repo(InventoryItem), findOne: async () => null };
    const s2 = new InventoryItemsService(db.dataSource() as any, racing as any, db.repo(StockLevel) as any, db.repo(StockMove) as any, db.repo(StudentItemIssue) as any);
    await makeItem({ sku: 'RACE' });
    await expect(
      s2.create({ name: 'x', sku: 'RACE', category: InventoryCategory.BOOK }, ADMIN),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(original).toBeTruthy();
  });

  it('update never changes stock quantities', async () => {
    const item = await makeItem({ initial_quantity: 4, branch_id: 'br-A' });
    await svc.update(item.id, { name: 'Renamed', quantity: 999 } as any);
    expect(qty(item.id, 'br-A')).toBe(4);
    expect(db.tables.InventoryItem[0].name).toBe('Renamed');
  });

  // ---------- receive / adjust ----------
  it('receives stock, records a purchase move and refreshes unit cost', async () => {
    const item = await makeItem();
    await svc.receiveStock(item.id, { branch_id: 'br-A', quantity: 20, unit_cost: 12.5 }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(20);
    expect(db.tables.StockMove[0].reference_type).toBe('purchase');
    expect(db.tables.InventoryItem[0].unit_cost).toBe(12.5);
  });

  it('applies signed adjustments and blocks negative stock without writing a move', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    await svc.adjustStock(item.id, { branch_id: 'br-A', quantity: -3, reason: 'damaged' }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(2);
    await svc.adjustStock(item.id, { branch_id: 'br-A', quantity: 4, reason: 'recount' }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(6);

    const movesBefore = db.tables.StockMove.length;
    await expect(
      svc.adjustStock(item.id, { branch_id: 'br-A', quantity: -7, reason: 'oops' }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id, 'br-A')).toBe(6);
    expect(db.tables.StockMove).toHaveLength(movesBefore);
  });

  it('requires a reason and a non-zero whole quantity for adjustments', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    await expect(svc.adjustStock(item.id, { branch_id: 'br-A', quantity: 1, reason: '  ' }, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.adjustStock(item.id, { branch_id: 'br-A', quantity: 0, reason: 'x' }, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.adjustStock(item.id, { branch_id: 'br-A', quantity: 1.5, reason: 'x' }, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id, 'br-A')).toBe(5);
  });

  // ---------- issue / return ----------
  it('issues to a student, decreasing stock and referencing the issue record', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A', quantity: 2 }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(3);
    const issue = db.tables.StudentItemIssue[0];
    expect(issue.cost).toBe(15); // defaults to sale_price
    const out = db.tables.StockMove.find((m) => m.type === StockMoveType.OUT);
    expect(out.reference_id).toBe(issue.id);
  });

  it('rolls back the whole issue when stock is insufficient (no orphan issue row)', async () => {
    const item = await makeItem({ initial_quantity: 1, branch_id: 'br-A' });
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A', quantity: 3 }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.tables.StudentItemIssue).toHaveLength(0);
    expect(qty(item.id, 'br-A')).toBe(1);
    expect(db.tables.StockMove).toHaveLength(1); // only the opening IN
  });

  it('rejects unknown students and inactive items', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'nope', branch_id: 'br-A' }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
    await svc.update(item.id, { status: InventoryStatus.DISCONTINUED });
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A' }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('restocks on a good return, not on damaged/lost, and refuses double return', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    const i1: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A', quantity: 2 }, ADMIN);
    const i2: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A', quantity: 1 }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(2);

    await svc.returnItem(i1.id, ItemCondition.GOOD, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(4);
    await svc.returnItem(i2.id, ItemCondition.DAMAGED, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(4);
    await expect(svc.returnItem(i1.id, ItemCondition.GOOD, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id, 'br-A')).toBe(4);
  });

  // ---------- transfer ----------
  it('transfers between branches atomically', async () => {
    const item = await makeItem({ initial_quantity: 10, branch_id: 'br-A' });
    await svc.transferStock(item.id, { from_branch_id: 'br-A', to_branch_id: 'br-B', quantity: 4 }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(6);
    expect(qty(item.id, 'br-B')).toBe(4);
    const types = db.tables.StockMove.map((m) => m.type);
    expect(types).toContain(StockMoveType.TRANSFER_OUT);
    expect(types).toContain(StockMoveType.TRANSFER_IN);
  });

  it('transfer with insufficient stock leaves both branches and the ledger untouched', async () => {
    const item = await makeItem({ initial_quantity: 2, branch_id: 'br-A' });
    await expect(
      svc.transferStock(item.id, { from_branch_id: 'br-A', to_branch_id: 'br-B', quantity: 5 }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id, 'br-A')).toBe(2);
    expect(qty(item.id, 'br-B')).toBe(0);
    expect(db.tables.StockMove).toHaveLength(1);
  });

  it('rejects a transfer to the same branch', async () => {
    const item = await makeItem({ initial_quantity: 2, branch_id: 'br-A' });
    await expect(
      svc.transferStock(item.id, { from_branch_id: 'br-A', to_branch_id: 'br-A', quantity: 1 }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ---------- concurrency ----------
  it('never oversells under concurrent issues (row lock serialises them)', async () => {
    const item = await makeItem({ initial_quantity: 5, branch_id: 'br-A' });
    const attempts = Array.from({ length: 12 }, () =>
      svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', branch_id: 'br-A', quantity: 1 }, ADMIN).then(
        () => 'ok',
        () => 'fail',
      ),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((r) => r === 'ok')).toHaveLength(5);
    expect(results.filter((r) => r === 'fail')).toHaveLength(7);
    expect(qty(item.id, 'br-A')).toBe(0);
    expect(db.tables.StudentItemIssue).toHaveLength(5);
  });

  // ---------- authorization / branch scoping ----------
  it('stops a branch manager from touching another branch, allows HQ roles', async () => {
    const item = await makeItem();
    await expect(
      svc.receiveStock(item.id, { branch_id: 'br-B', quantity: 1 }, MANAGER_A),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      svc.adjustStock(item.id, { branch_id: 'br-B', quantity: 1, reason: 'x' }, MANAGER_A),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      svc.transferStock(item.id, { from_branch_id: 'br-B', to_branch_id: 'br-A', quantity: 1 }, MANAGER_A),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await svc.receiveStock(item.id, { branch_id: 'br-A', quantity: 1 }, MANAGER_A);
    await svc.receiveStock(item.id, { branch_id: 'br-B', quantity: 1 }, ADMIN);
    expect(qty(item.id, 'br-A')).toBe(1);
    expect(qty(item.id, 'br-B')).toBe(1);
  });

  it('findOne hides other branches from a branch-scoped user', async () => {
    const item = await makeItem({ initial_quantity: 3, branch_id: 'br-A' });
    await svc.receiveStock(item.id, { branch_id: 'br-B', quantity: 9 }, ADMIN);
    const asMgr: any = await svc.findOne(item.id, undefined, MANAGER_A);
    expect(asMgr.stock).toHaveLength(1);
    expect(asMgr.total_quantity).toBe(3);
    await expect(svc.findOne(item.id, 'br-B', MANAGER_A)).rejects.toBeInstanceOf(ForbiddenException);
  });

  // ---------- removal ----------
  it('refuses to remove an item with stock, archives items with history, deletes unused ones', async () => {
    const withStock = await makeItem({ initial_quantity: 2, branch_id: 'br-A' });
    await expect(svc.remove(withStock.id)).rejects.toBeInstanceOf(BadRequestException);

    await svc.adjustStock(withStock.id, { branch_id: 'br-A', quantity: -2, reason: 'clear' }, ADMIN);
    const archived = await svc.remove(withStock.id);
    expect(archived.archived).toBe(true);
    expect(db.tables.InventoryItem.find((i) => i.id === withStock.id).status).toBe(InventoryStatus.ARCHIVED);

    const unused = await makeItem();
    const res = await svc.remove(unused.id);
    expect(res.deleted).toBe(true);
    expect(db.tables.InventoryItem.some((i) => i.id === unused.id)).toBe(false);
  });
});
