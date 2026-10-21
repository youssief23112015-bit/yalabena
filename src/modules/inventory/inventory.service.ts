import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InventoryItem } from '../../shared/entities/inventory-item.entity';
import { StockLevel } from '../../shared/entities/stock-level.entity';
import { StockMove } from '../../shared/entities/stock-move.entity';
import { StudentItemIssue } from '../../shared/entities/student-item-issue.entity';
import { StockMoveType } from '../../common/enums/stock-move-type.enum';
import { InventoryStatus } from '../../common/enums/inventory-status.enum';
import { ItemCondition } from '../../common/enums/item-condition.enum';
import { SaveItemDto } from './dto/save-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustStockDto, ReceiveStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto } from './dto/issue-item.dto';

/** The authenticated user as produced by JwtStrategy.validate(). */
export interface InventoryActor {
  id: string;
  roles?: string[];
}

export interface ListItemsQuery {
  search?: string;
  category?: string;
  status?: string;
  low_stock_only?: boolean;
  sort?: 'name' | 'sku' | 'quantity' | 'unit_cost' | 'created_at';
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

type RefType = 'enrollment' | 'activity' | 'manual' | 'purchase' | 'return' | 'adjustment';

@Injectable()
export class InventoryItemsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(InventoryItem) private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(StockLevel) private readonly stockRepo: Repository<StockLevel>,
    @InjectRepository(StockMove) private readonly moveRepo: Repository<StockMove>,
    @InjectRepository(StudentItemIssue) private readonly issueRepo: Repository<StudentItemIssue>,
  ) {}

  // ==================== ITEMS ====================

  private normalizeSku(sku?: string | null): string | null {
    const v = sku?.trim();
    return v ? v : null;
  }

  private async assertSkuFree(sku: string | null, exceptId?: string) {
    if (!sku) return;
    const existing = await this.itemRepo.findOne({ where: { sku } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`SKU "${sku}" is already used by item "${existing.name}"`);
    }
  }

  private rethrowUnique(err: any, sku?: string | null): never {
    if (err?.code === '23505') {
      throw new ConflictException(`SKU "${sku ?? ''}" is already in use`);
    }
    throw err;
  }

  async create(dto: SaveItemDto, actor?: InventoryActor) {
    const qty = dto.initial_quantity ?? 0;

    const sku = this.normalizeSku(dto.sku);
    await this.assertSkuFree(sku);

    // Item + opening stock are one atomic unit.
    const itemId = await this.dataSource
      .transaction(async (manager) => {
        const item = await manager.save(
          InventoryItem,
          manager.create(InventoryItem, {
            name: dto.name.trim(),
            sku,
            description: dto.description ?? null,
            category: dto.category,
            unit_cost: dto.unit_cost ?? 0,
            sale_price: dto.sale_price ?? 0,
            unit_of_measure: dto.unit_of_measure ?? 'piece',
            reorder_level: dto.reorder_level ?? 10,
          }),
        );
        if (qty > 0) {
          await this.applyMove(manager, {
            itemId: item.id,
            type: StockMoveType.IN,
            quantity: qty,
            unitCost: dto.unit_cost ?? null,
            reason: 'initial stock',
            referenceType: 'manual',
            userId: actor?.id,
          });
        }
        return item.id;
      })
      .catch((e) => this.rethrowUnique(e, sku));

    return this.findOne(itemId, actor);
  }

  /**
   * Paginated catalog with live quantities (single global stock pool).
   */
  async findAll(query: ListItemsQuery = {}, _actor?: InventoryActor) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 25));

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoin(StockLevel, 'sl', 'sl.item_id = item.id')
      .select('item.id', 'id')
      .addSelect('COALESCE(SUM(sl.quantity), 0)', 'quantity')
      .groupBy('item.id');

    if (query.search?.trim()) {
      qb.andWhere('(item.name ILIKE :q OR item.sku ILIKE :q OR item.description ILIKE :q)', {
        q: `%${query.search.trim()}%`,
      });
    }
    if (query.category) qb.andWhere('item.category = :category', { category: query.category });
    if (query.status) qb.andWhere('item.status = :status', { status: query.status });
    if (query.low_stock_only) {
      qb.andWhere('item.status = :activeStatus', { activeStatus: InventoryStatus.ACTIVE });
      qb.having('COALESCE(SUM(sl.quantity), 0) <= item.reorder_level');
    }

    const sortMap: Record<string, string> = {
      name: 'item.name',
      sku: 'item.sku',
      quantity: 'quantity',
      unit_cost: 'item.unit_cost',
      created_at: 'item.created_at',
    };
    const sortCol = sortMap[query.sort ?? 'name'] ?? 'item.name';
    qb.orderBy(sortCol, query.order === 'DESC' ? 'DESC' : 'ASC').addOrderBy('item.id', 'ASC');

    const total = (await qb.clone().getRawMany()).length;
    const rows = await qb.offset((page - 1) * limit).limit(limit).getRawMany();

    const ids = rows.map((r: any) => r.id);
    const items = ids.length ? await this.itemRepo.find({ where: { id: In(ids) } }) : [];
    const byId = new Map(items.map((i) => [i.id, i]));
    const data: any[] = [];
    for (const r of rows) {
      const item = byId.get(r.id);
      if (!item) continue;
      const quantity = Number(r.quantity);
      data.push({
        ...item,
        unit_cost: Number(item.unit_cost),
        sale_price: Number(item.sale_price),
        quantity,
        is_low_stock: item.status === InventoryStatus.ACTIVE && quantity <= item.reorder_level,
      });
    }

    return { data, total, page, limit };
  }

  async findOne(id: string, _actor?: InventoryActor) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);

    const stock = await this.stockRepo.find({ where: { item_id: id } });
    const moves = await this.moveRepo.find({
      where: { item_id: id },
      relations: ['creator'],
      order: { created_at: 'DESC' },
      take: 50,
    });
    const total_quantity = stock.reduce((s, x) => s + x.quantity, 0);

    return {
      ...item,
      unit_cost: Number(item.unit_cost),
      sale_price: Number(item.sale_price),
      total_quantity,
      stock: stock.map((s) => ({
        quantity: s.quantity,
        last_counted_at: s.last_counted_at,
      })),
      moves: moves.map((m) => this.presentMove(m)),
    };
  }

  /** Never leak password hashes etc. from the joined user row. */
  private presentMove(m: StockMove) {
    const c: any = m.creator;
    return {
      ...m,
      creator: c ? { id: c.id, first_name: c.first_name, last_name: c.last_name } : null,
    };
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);

    // Explicit whitelist: stock and ids can never be changed through this endpoint.
    if (dto.sku !== undefined) {
      const sku = this.normalizeSku(dto.sku);
      await this.assertSkuFree(sku, id);
      item.sku = sku;
    }
    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.unit_cost !== undefined) item.unit_cost = dto.unit_cost;
    if (dto.sale_price !== undefined) item.sale_price = dto.sale_price;
    if (dto.unit_of_measure !== undefined) item.unit_of_measure = dto.unit_of_measure;
    if (dto.reorder_level !== undefined) item.reorder_level = dto.reorder_level;
    if (dto.status !== undefined) item.status = dto.status;

    await this.itemRepo.save(item).catch((e) => this.rethrowUnique(e, item.sku));
    return this.findOne(id);
  }

  /**
   * Items referenced by stock moves, issues, course materials or on-hand stock
   * are never physically deleted - they are archived (deactivated) instead.
   */
  async remove(id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);

    const stock = await this.stockRepo.find({ where: { item_id: id } });
    if (stock.some((s) => s.quantity !== 0)) {
      throw new BadRequestException('Cannot remove an item with stock on hand. Adjust stock to zero first.');
    }

    const [moves, issues, materials] = await Promise.all([
      this.moveRepo.count({ where: { item_id: id } }),
      this.issueRepo.count({ where: { item_id: id } }),
      this.dataSource.query('SELECT COUNT(*)::int AS c FROM course_materials WHERE inventory_item_id = $1', [id]),
    ]);

    if (moves > 0 || issues > 0 || (materials?.[0]?.c ?? 0) > 0) {
      item.status = InventoryStatus.ARCHIVED;
      await this.itemRepo.save(item);
      return { deleted: false, archived: true, message: 'Item has history and was archived instead of deleted' };
    }

    await this.itemRepo.remove(item);
    return { deleted: true, archived: false };
  }

  // ==================== STOCK MOVEMENTS ====================

  private async ensureAndLockStock(manager: EntityManager, itemId: string) {
    await manager.query(
      'INSERT INTO stock_levels (item_id, quantity) VALUES ($1, 0) ON CONFLICT (item_id) DO NOTHING',
      [itemId],
    );
    const stock = await manager.findOne(StockLevel, {
      where: { item_id: itemId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stock) throw new NotFoundException('Stock record could not be created');
    return stock;
  }

  /**
   * Single place that changes a stock balance. MUST run inside a transaction.
   * The stock row is locked FOR UPDATE, so concurrent moves on the same
   * item are serialised and the balance can never go negative.
   */
  private async applyMove(
    manager: EntityManager,
    p: {
      itemId: string;
      type: StockMoveType;
      quantity: number; // positive for every type except ADJUSTMENT (signed)
      unitCost?: number | null;
      reason: string;
      referenceType: RefType;
      referenceId?: string | null;
      userId?: string;
    },
  ): Promise<{ before: number; after: number }> {
    if (!Number.isInteger(p.quantity) || p.quantity === 0) {
      throw new BadRequestException('Quantity must be a non-zero whole number');
    }
    if (p.type !== StockMoveType.ADJUSTMENT && p.quantity < 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const stock = await this.ensureAndLockStock(manager, p.itemId);

    const increases = [StockMoveType.IN, StockMoveType.RETURN].includes(p.type);
    const delta = p.type === StockMoveType.ADJUSTMENT ? p.quantity : increases ? p.quantity : -p.quantity;
    const before = stock.quantity;
    const after = before + delta;

    if (after < 0) {
      throw new BadRequestException(`Not enough stock (available: ${before}, requested: ${Math.abs(delta)}).`);
    }

    await manager.update(
      StockLevel,
      { id: stock.id },
      {
        quantity: after,
        ...(p.type === StockMoveType.ADJUSTMENT ? { last_counted_at: new Date() } : {}),
      },
    );

    await manager.save(
      StockMove,
      manager.create(StockMove, {
        item_id: p.itemId,
        type: p.type,
        quantity: p.quantity,
        unit_cost: p.unitCost ?? null,
        reason: p.reason,
        reference_type: p.referenceType,
        reference_id: p.referenceId ?? null,
        created_by: p.userId ?? null,
      } as any),
    );

    return { before, after };
  }

  private async requireItem(manager: EntityManager, itemId: string, allowInactive = false) {
    const item = await manager.findOne(InventoryItem, { where: { id: itemId } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${itemId} not found`);
    if (!allowInactive && item.status !== InventoryStatus.ACTIVE) {
      throw new BadRequestException(`Item "${item.name}" is ${item.status} and cannot be moved`);
    }
    return item;
  }

  /** Goods receiving. Optionally refreshes the item's unit cost. */
  async receiveStock(itemId: string, dto: ReceiveStockDto, actor?: InventoryActor) {
    await this.dataSource.transaction(async (manager) => {
      await this.requireItem(manager, itemId);
      await this.applyMove(manager, {
        itemId,
        type: StockMoveType.IN,
        quantity: dto.quantity,
        unitCost: dto.unit_cost ?? null,
        reason: dto.reason?.trim() || 'stock received',
        referenceType: 'purchase',
        referenceId: dto.reference_id ?? null,
        userId: actor?.id,
      });
      if (dto.unit_cost !== undefined) {
        await manager.update(InventoryItem, { id: itemId }, { unit_cost: dto.unit_cost });
      }
    });
    return this.findOne(itemId, actor);
  }

  /** Manual correction with mandatory reason. quantity is signed. */
  async adjustStock(itemId: string, dto: AdjustStockDto, actor?: InventoryActor) {
    if (!dto.reason?.trim()) throw new BadRequestException('A reason is required for stock adjustments');
    await this.dataSource.transaction(async (manager) => {
      await this.requireItem(manager, itemId, true);
      await this.applyMove(manager, {
        itemId,
        type: StockMoveType.ADJUSTMENT,
        quantity: dto.quantity,
        reason: dto.reason.trim(),
        referenceType: 'adjustment',
        userId: actor?.id,
      });
    });
    return this.findOne(itemId, actor);
  }

  async listMoves(
    filters: {
      item_id?: string; type?: string; from?: string; to?: string; page?: number; limit?: number;
    },
    _actor?: InventoryActor,
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));

    const qb = this.moveRepo
      .createQueryBuilder('move')
      .leftJoinAndSelect('move.item', 'item')
      .leftJoinAndSelect('move.creator', 'creator')
      .orderBy('move.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.item_id) qb.andWhere('move.item_id = :i', { i: filters.item_id });
    if (filters.type) qb.andWhere('move.type = :t', { t: filters.type });
    if (filters.from) qb.andWhere('move.created_at >= :from', { from: filters.from });
    if (filters.to) qb.andWhere("move.created_at < (CAST(:to AS date) + INTERVAL '1 day')", { to: filters.to });

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((m) => this.presentMove(m)), total, page, limit };
  }

  // ==================== ISSUE TO STUDENTS ====================

  async issueToStudent(dto: IssueItemDto, actor?: InventoryActor) {
    const quantity = dto.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1) throw new BadRequestException('Quantity must be at least 1');

    const issueId = await this.dataSource.transaction(async (manager) => {
      const item = await this.requireItem(manager, dto.item_id);
      const student = await manager.query('SELECT id FROM students WHERE id = $1', [dto.student_id]);
      if (!student?.length) throw new NotFoundException(`Student with ID ${dto.student_id} not found`);

      const issue = await manager.save(
        StudentItemIssue,
        manager.create(StudentItemIssue, {
          student_id: dto.student_id,
          item_id: item.id,
          quantity,
          cost: dto.cost ?? Number(item.sale_price ?? 0),
          created_by: actor?.id ?? null,
        } as any),
      );
      await this.applyMove(manager, {
        itemId: item.id,
        type: StockMoveType.OUT,
        quantity,
        unitCost: Number(item.unit_cost ?? 0),
        reason: `issued to student ${dto.student_id}`,
        referenceType: 'manual',
        referenceId: issue.id,
        userId: actor?.id,
      });
      return issue.id;
    });

    return this.issueRepo.findOne({ where: { id: issueId }, relations: ['item', 'student', 'student.user'] });
  }

  async listIssues(
    filters: { student_id?: string; open_only?: boolean; page?: number; limit?: number },
    _actor?: InventoryActor,
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));

    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.item', 'item')
      .leftJoinAndSelect('issue.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('issue.issued_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.student_id) qb.andWhere('issue.student_id = :s', { s: filters.student_id });
    if (filters.open_only) qb.andWhere('issue.returned_at IS NULL');

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((r: any) => ({
      ...r,
      student: r.student
        ? {
            id: r.student.id,
            student_number: r.student.student_number,
            user: r.student.user
              ? { id: r.student.user.id, first_name: r.student.user.first_name, last_name: r.student.user.last_name }
              : null,
          }
        : null,
    }));
    return { data, total, page, limit };
  }

  /**
   * Return an issued item. Only items returned in GOOD condition go back on the
   * shelf; damaged / lost items are recorded but not restocked.
   */
  async returnItem(issueId: string, condition: ItemCondition | undefined, actor?: InventoryActor) {
    const cond = condition ?? ItemCondition.GOOD;
    if (!Object.values(ItemCondition).includes(cond)) throw new BadRequestException('Invalid condition');

    await this.dataSource.transaction(async (manager) => {
      const issue = await manager.findOne(StudentItemIssue, {
        where: { id: issueId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!issue) throw new NotFoundException(`Issue record with ID ${issueId} not found`);
      if (issue.returned_at) throw new BadRequestException('This item has already been returned.');

      issue.returned_at = new Date();
      issue.condition_on_return = cond;
      await manager.save(StudentItemIssue, issue);

      if (cond === ItemCondition.GOOD) {
        await this.applyMove(manager, {
          itemId: issue.item_id,
          type: StockMoveType.RETURN,
          quantity: issue.quantity,
          reason: `returned by student ${issue.student_id}`,
          referenceType: 'return',
          referenceId: issue.id,
          userId: actor?.id,
        });
      }
    });

    return this.issueRepo.findOne({ where: { id: issueId }, relations: ['item', 'student', 'student.user'] });
  }

  // ==================== REPORTS ====================

  /** Active items at or below reorder level (SRS 4.12 low-stock alerts). */
  async lowStockAlerts() {
    const rows = await this.dataSource.query(
      `SELECT i.id AS item_id, i.name, i.sku, i.reorder_level,
              COALESCE(sl.quantity, 0)::int AS quantity
         FROM inventory_items i
         LEFT JOIN stock_levels sl ON sl.item_id = i.id
        WHERE i.status = 'active'
          AND COALESCE(sl.quantity, 0) <= i.reorder_level
          AND sl.id IS NOT NULL
        ORDER BY (COALESCE(sl.quantity, 0) - i.reorder_level) ASC, i.name ASC`,
    );
    return rows.map((r: any) => ({
      ...r,
      reorder_level: Number(r.reorder_level),
      quantity: Number(r.quantity),
      shortage: Math.max(0, Number(r.reorder_level) - Number(r.quantity)),
    }));
  }

  /** Stock value at unit cost with per-item lines (SRS 4.12 valuation). */
  async valuationReport() {
    const lines = await this.dataSource.query(
      `SELECT i.id AS item_id, i.name AS item_name, i.sku,
              sl.quantity::int AS quantity, i.unit_cost::float8 AS unit_cost,
              (sl.quantity * i.unit_cost)::float8 AS total_cost
         FROM stock_levels sl
         JOIN inventory_items i ON i.id = sl.item_id
        WHERE sl.quantity > 0
        ORDER BY i.name`,
    );
    const total_quantity = lines.reduce((s: number, l: any) => s + Number(l.quantity), 0);
    const total_cost = lines.reduce((s: number, l: any) => s + Number(l.total_cost), 0);
    return {
      total_quantity,
      grand_total_cost: Math.round(total_cost * 100) / 100,
      items: lines.map((l: any) => ({ ...l, total_cost: Math.round(Number(l.total_cost) * 100) / 100 })),
    };
  }

  /** Movement summary per item and type over a date range. */
  async movementReport(filters: { from?: string; to?: string }) {
    return this.dataSource.query(
      `SELECT i.id AS item_id, i.name AS item_name, i.sku, m.type,
              COUNT(*)::int AS moves,
              SUM(m.quantity)::int AS total_quantity
         FROM stock_moves m
         JOIN inventory_items i ON i.id = m.item_id
        WHERE ($1::date IS NULL OR m.created_at >= $1::date)
          AND ($2::date IS NULL OR m.created_at < ($2::date + INTERVAL '1 day'))
        GROUP BY i.id, i.name, i.sku, m.type
        ORDER BY i.name, m.type`,
      [filters.from ?? null, filters.to ?? null],
    );
  }
}
