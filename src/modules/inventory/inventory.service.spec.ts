import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryItemsService } from './inventory.service';
import { InventoryItem } from '../../shared/entities/inventory-item.entity';
import { StockLevel } from '../../shared/entities/stock-level.entity';
import { StockMove } from '../../shared/entities/stock-move.entity';
import { StudentItemIssue } from '../../shared/entities/student-item-issue.entity';
import { InventoryCategory } from '../../common/enums/inventory-category.enum';
import { ItemCondition } from '../../common/enums/item-condition.enum';

/** In-memory stand-in for PostgreSQL: transactions with rollback + DB constraints. */
class FakeDb {
  tables: Record<string, any[]> = {
    InventoryItem: [], StockLevel: [], StockMove: [], StudentItemIssue: [],
    students: [{ id: 'stu-1' }],
  };
  private seq = 0;

  uid(prefix = 'id') { return `${prefix}-${++this.seq}`; }
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

  makeManager(journal: any[] = []) {
    const db = this;
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
          journal.push({ table: db.name(E), op: 'update', id: row.id, prev: { ...row } });
          Object.assign(row, patch);
        }
        return { affected: row ? 1 : 0 };
      },
      findOne: async (E: any, o: any) => {
        const row = db.tables[db.name(E)].find((r) => db.match(r, o.where));
        return row ? { ...row } : null;
      },
      query: async (sql: string, params: any[]) => {
        if (sql.startsWith('INSERT INTO stock_levels')) {
          const [item_id] = params;
          if (!db.tables.StockLevel.some((r) => r.item_id === item_id)) {
            const row = { id: db.uid('sl'), item_id, quantity: 0, last_counted_at: null };
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
        const journal: any[] = [];
        const manager = db.makeManager(journal);
        try {
          return await cb(manager);
        } catch (e) {
          db.undo(journal);
          throw e;
        }
      },
      query: (sql: string, params: any[]) => db.makeManager([]).query(sql, params ?? []),
    };
  }

  repo(E: any) {
    const db = this;
    const t = () => db.tables[db.name(E)];
    return {
      findOne: async (o: any) => { const r = t().find((x) => db.match(x, o.where)); return r ? { ...r } : null; },
      find: async (o: any = {}) => t().filter((x) => db.match(x, o.where)).map((x) => ({ ...x })),
      count: async (o: any = {}) => t().filter((x) => db.match(x, o.where)).length,
      save: async (obj: any) => db.makeManager([]).save(E, obj),
      remove: async (obj: any) => { db.tables[db.name(E)] = t().filter((x) => x.id !== obj.id); return obj; },
    };
  }
}

const ADMIN = { id: 'u-admin', roles: ['super_admin'] };

describe('InventoryItemsService (stock logic against in-memory DB model)', () => {
  let db: FakeDb;
  let svc: InventoryItemsService;

  const makeItem = async (over: any = {}) => {
    return svc.create(
      { name: 'Book', sku: `SKU-${Math.random()}`, category: InventoryCategory.BOOK, unit_cost: 10, sale_price: 15, ...over },
      ADMIN,
    );
  };
  const qty = (itemId: string) =>
    db.tables.StockLevel.find((s) => s.item_id === itemId)?.quantity ?? 0;

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

  it('creates an item with opening stock in the single global pool', async () => {
    const item = await makeItem({ initial_quantity: 12 });
    expect(item.total_quantity).toBe(12);
    expect(qty(item.id)).toBe(12);
    expect(db.tables.StockLevel.filter((s) => s.item_id === item.id)).toHaveLength(1);
  });

  it('rejects a duplicate SKU', async () => {
    await makeItem({ sku: 'DUP-1' });
    await expect(makeItem({ sku: 'DUP-1' })).rejects.toBeInstanceOf(ConflictException);
  });

  // ---------- receive / adjust ----------

  it('receiveStock increases the balance', async () => {
    const item = await makeItem({ initial_quantity: 4 });
    await svc.receiveStock(item.id, { quantity: 20, unit_cost: 12.5 }, ADMIN);
    expect(qty(item.id)).toBe(24);
  });

  it('adjustStock applies a signed delta and records the count time', async () => {
    const item = await makeItem({ initial_quantity: 5 });
    await svc.adjustStock(item.id, { quantity: -3, reason: 'damaged' }, ADMIN);
    expect(qty(item.id)).toBe(2);
    await svc.adjustStock(item.id, { quantity: 4, reason: 'recount' }, ADMIN);
    expect(qty(item.id)).toBe(6);
  });

  it('adjustStock rejects missing reason, zero, non-integer and underflow', async () => {
    const item = await makeItem({ initial_quantity: 5 });
    await expect(svc.adjustStock(item.id, { quantity: 1, reason: '  ' }, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.adjustStock(item.id, { quantity: 0, reason: 'x' } as any, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.adjustStock(item.id, { quantity: 1.5, reason: 'x' } as any, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    // underflow rolls the whole transaction back
    await expect(svc.adjustStock(item.id, { quantity: -7, reason: 'oops' }, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id)).toBe(5);
  });

  // ---------- issue / return ----------

  it('issueToStudent decreases stock and records the issue', async () => {
    const item = await makeItem({ initial_quantity: 5 });
    const i: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 2 }, ADMIN);
    expect(qty(item.id)).toBe(3);
    expect(i.quantity).toBe(2);
    const i2: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 1 }, ADMIN);
    expect(qty(item.id)).toBe(2);
    expect(i2.quantity).toBe(1);
  });

  it('issueToStudent rejects unknown students, insufficient stock and bad quantities', async () => {
    const item = await makeItem({ initial_quantity: 1 });
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'nope' }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 3 }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 0 } as any, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(qty(item.id)).toBe(1);
    expect(db.tables.StockMove).toHaveLength(1); // only the initial stock move
  });

  it('returns a good-condition issue back on the shelf; damaged stays out', async () => {
    const item = await makeItem({ initial_quantity: 5 });
    const i1: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 2 }, ADMIN);
    const i2: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 1 }, ADMIN);
    expect(qty(item.id)).toBe(2); // 5 - 2 - 1
    await svc.returnItem(i1.id, ItemCondition.GOOD, ADMIN);
    expect(qty(item.id)).toBe(4); // 2 + 2 restocked
    await svc.returnItem(i2.id, ItemCondition.DAMAGED, ADMIN);
    expect(qty(item.id)).toBe(4); // damaged units are NOT restocked
  });

  it('rejects returning the same issue twice', async () => {
    const item = await makeItem({ initial_quantity: 2 });
    const i: any = await svc.issueToStudent({ item_id: item.id, student_id: 'stu-1', quantity: 1 }, ADMIN);
    await svc.returnItem(i.id, ItemCondition.GOOD, ADMIN);
    await expect(svc.returnItem(i.id, ItemCondition.GOOD, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
  });

  // ---------- removal ----------

  it('refuses to delete an item with stock on hand', async () => {
    const item = await makeItem({ initial_quantity: 2 });
    await expect(svc.remove(item.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('archives items that have history instead of deleting them', async () => {
    const item = await makeItem({ initial_quantity: 2 });
    await svc.adjustStock(item.id, { quantity: -2, reason: 'clear' }, ADMIN);
    const res: any = await svc.remove(item.id);
    expect(res.deleted).toBe(false);
    expect(res.archived).toBe(true);
    expect(db.tables.InventoryItem.find((r) => r.id === item.id)?.status).toBe('archived');
  });
});
