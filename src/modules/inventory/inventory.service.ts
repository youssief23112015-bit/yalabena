import {
  Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException,
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
import { AdjustStockDto, ReceiveStockDto, TransferStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto } from './dto/issue-item.dto';

/** The authenticated user as produced by JwtStrategy.validate(). */
export interface InventoryActor {
  id: string;
  roles?: string[];
  branchId?: string | null;
}

/** Roles that may see / act on every branch (HQ-level, SRS 4.15). */
const GLOBAL_ROLES = ['super_admin', 'finance', 'auditor'];

export interface ListItemsQuery {
  branch_id?: string;
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

  // ==================== BRANCH SCOPING ====================

  private isGlobal(actor?: InventoryActor): boolean {
    if (!actor) return true; // internal call (no HTTP user)
    return (actor.roles ?? []).some((r) => GLOBAL_ROLES.includes(r));
  }

  /** Throws if the actor may not act on `branchId`. */
  private assertBranchAccess(actor: InventoryActor | undefined, branchId: string) {
    if (this.isGlobal(actor)) return;
    if (actor?.branchId && actor.branchId !== branchId) {
      throw new ForbiddenException('You can only manage inventory of your own branch');
    }
  }

  /** Branch-scoped users are always limited to their own branch for reads. */
  private resolveReadBranch(actor: InventoryActor | undefined, requested?: string): string | undefined {
    if (this.isGlobal(actor) || !actor?.branchId) return requested;
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('You can only view inventory of your own branch');
    }
    return actor.branchId;
  }

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
    if (qty > 0 && !dto.branch_id) {
      throw new BadRequestException('branch_id is required when initial_quantity is greater than 0');
    }
    if (qty > 0) this.assertBranchAccess(actor, dto.branch_id as string);

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
            branchId: dto.branch_id as string,
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

    return this.findOne(itemId, undefined, actor);
  }

  /**
   * Paginated catalog with live quantities.
   * quantity = stock in `branch_id` when filtered, otherwise summed over branches.
   */
  async findAll(query: ListItemsQuery = {}, actor?: InventoryActor) {
    const branchId = this.resolveReadBranch(actor, query.branch_id);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 25));

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoin(
        StockLevel,
        'sl',
        branchId ? 'sl.item_id = item.id AND sl.branch_id = :branchId' : 'sl.item_id = item.id',
        { branchId },
      )
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

    return { data, total, page, limit, branch_id: branchId ?? null };
  }

  async findOne(id: string, branchId?: string, actor?: InventoryActor) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);

    const scoped = this.resolveReadBranch(actor, branchId);
    const where: any = scoped ? { item_id: id, branch_id: scoped } : { item_id: id };
    const stock = await this.stockRepo.find({ where, relations: ['branch'] });
    const moves = await this.moveRepo.find({
      where,
      relations: ['creator', 'branch'],
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
        branch_id: s.branch_id,
        branch_name: s.branch?.name ?? null,
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

  private async ensureAndLockStock(manager: EntityManager, itemId: string, branchId: string) {
    await manager.query(
      'INSERT INTO stock_levels (item_id, branch_id, quantity) VALUES ($1, $2, 0) ON CONFLICT (item_id, branch_id) DO NOTHING',
      [itemId, branchId],
    );
    const stock = await manager.findOne(StockLevel, {
      where: { item_id: itemId, branch_id: branchId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stock) throw new NotFoundException('Stock record could not be created (check the branch id)');
    return stock;
  }

  /**
   * Single place that changes a stock balance. MUST run inside a transaction.
   * The stock row is locked FOR UPDATE, so concurrent moves on the same
   * item+branch are serialised and the balance can never go negative.
   */
  private async applyMove(
    manager: EntityManager,
    p: {
      itemId: string;
      branchId: string;
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

    const stock = await this.ensureAndLockStock(manager, p.itemId, p.branchId);

    const increases = [StockMoveType.IN, StockMoveType.RETURN, StockMoveType.TRANSFER_IN].includes(p.type);
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
        branch_id: p.branchId,
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
    this.assertBranchAccess(actor, dto.branch_id);
    await this.dataSource.transaction(async (manager) => {
      await this.requireItem(manager, itemId);
      await this.applyMove(manager, {
        itemId,
        branchId: dto.branch_id,
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
    return this.findOne(itemId, dto.branch_id, actor);
  }

  /** Manual correction with mandatory reason. quantity is signed. */
  async adjustStock(itemId: string, dto: AdjustStockDto, actor?: InventoryActor) {
    this.assertBranchAccess(actor, dto.branch_id);
    if (!dto.reason?.trim()) throw new BadRequestException('A reason is required for stock adjustments');
    await this.dataSource.transaction(async (manager) => {
      await this.requireItem(manager, itemId, true);
      await this.applyMove(manager, {
        itemId,
        branchId: dto.branch_id,
        type: StockMoveType.ADJUSTMENT,
        quantity: dto.quantity,
        reason: dto.reason.trim(),
        referenceType: 'adjustment',
        userId: actor?.id,
      });
    });
    return this.findOne(itemId, dto.branch_id, actor);
  }

  /** Branch-to-branch transfer: both legs commit together or not at all. */
  async transferStock(itemId: string, dto: TransferStockDto, actor?: InventoryActor) {
    if (dto.from_branch_id === dto.to_branch_id) {
      throw new BadRequestException('Source and destination branches must be different');
    }
    this.assertBranchAccess(actor, dto.from_branch_id);
    const reason = dto.reason?.trim() || 'branch transfer';
    await this.dataSource.transaction(async (manager) => {
      await this.requireItem(manager, itemId);
      // Lock rows in a fixed order (by branch id) so two opposite transfers cannot deadlock.
      for (const b of [dto.from_branch_id, dto.to_branch_id].sort()) {
        await this.ensureAndLockStock(manager, itemId, b);
      }
      await this.applyMove(manager, {
        itemId, branchId: dto.from_branch_id, type: StockMoveType.TRANSFER_OUT,
        quantity: dto.quantity, reason, referenceType: 'manual', userId: actor?.id,
      });
      await this.applyMove(manager, {
        itemId, branchId: dto.to_branch_id, type: StockMoveType.TRANSFER_IN,
        quantity: dto.quantity, reason, referenceType: 'manual', userId: actor?.id,
      });
    });
    return this.findOne(itemId, undefined, actor);
  }

  async listMoves(
    filters: {
      item_id?: string; branch_id?: string; type?: string; from?: string; to?: string; page?: number; limit?: number;
    },
    actor?: InventoryActor,
  ) {
    const branchId = this.resolveReadBranch(actor, filters.branch_id);
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));

    const qb = this.moveRepo
      .createQueryBuilder('move')
      .leftJoinAndSelect('move.item', 'item')
      .leftJoinAndSelect('move.branch', 'branch')
      .leftJoinAndSelect('move.creator', 'creator')
      .orderBy('move.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.item_id) qb.andWhere('move.item_id = :i', { i: filters.item_id });
    if (branchId) qb.andWhere('move.branch_id = :b', { b: branchId });
    if (filters.type) qb.andWhere('move.type = :t', { t: filters.type });
    if (filters.from) qb.andWhere('move.created_at >= :from', { from: filters.from });
    if (filters.to) qb.andWhere("move.created_at < (CAST(:to AS date) + INTERVAL '1 day')", { to: filters.to });

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((m) => this.presentMove(m)), total, page, limit };
  }

  // ==================== ISSUE TO STUDENTS ====================

  async issueToStudent(dto: IssueItemDto, actor?: InventoryActor) {
    this.assertBranchAccess(actor, dto.branch_id);
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
          branch_id: dto.branch_id,
          quantity,
          cost: dto.cost ?? Number(item.sale_price ?? 0),
          created_by: actor?.id ?? null,
        } as any),
      );
      await this.applyMove(manager, {
        itemId: item.id,
        branchId: dto.branch_id,
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
    filters: { student_id?: string; branch_id?: string; open_only?: boolean; page?: number; limit?: number },
    actor?: InventoryActor,
  ) {
    const branchId = this.resolveReadBranch(actor, filters.branch_id);
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
    if (branchId) qb.andWhere('issue.branch_id = :b', { b: branchId });
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
      this.assertBranchAccess(actor, issue.branch_id);
      if (issue.returned_at) throw new BadRequestException('This item has already been returned.');

      issue.returned_at = new Date();
      issue.condition_on_return = cond;
      await manager.save(StudentItemIssue, issue);

      if (cond === ItemCondition.GOOD) {
        await this.applyMove(manager, {
          itemId: issue.item_id,
          branchId: issue.branch_id,
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

  /** Active items at or below reorder level, per branch (SRS 4.12 low-stock alerts). */
  async lowStockAlerts(branchIdIn?: string, actor?: InventoryActor) {
    const branchId = this.resolveReadBranch(actor, branchIdIn);
    const rows = await this.dataSource.query(
      `SELECT i.id AS item_id, i.name, i.sku, i.reorder_level,
              b.id AS branch_id, b.name AS branch_name,
              COALESCE(sl.quantity, 0)::int AS quantity
         FROM inventory_items i
         CROSS JOIN branches b
         LEFT JOIN stock_levels sl ON sl.item_id = i.id AND sl.branch_id = b.id
        WHERE i.status = 'active'
          AND ($1::uuid IS NULL OR b.id = $1::uuid)
          AND COALESCE(sl.quantity, 0) <= i.reorder_level
          AND ($1::uuid IS NOT NULL OR sl.id IS NOT NULL)
        ORDER BY (COALESCE(sl.quantity, 0) - i.reorder_level) ASC, i.name ASC`,
      [branchId ?? null],
    );
    return rows.map((r: any) => ({
      ...r,
      reorder_level: Number(r.reorder_level),
      quantity: Number(r.quantity),
      shortage: Math.max(0, Number(r.reorder_level) - Number(r.quantity)),
    }));
  }

  /** Stock value at unit cost, per branch with per-item lines (SRS 4.12 valuation). */
  async valuationReport(branchIdIn?: string, actor?: InventoryActor) {
    const branchId = this.resolveReadBranch(actor, branchIdIn);
    const lines = await this.dataSource.query(
      `SELECT b.id AS branch_id, b.name AS branch_name,
              i.id AS item_id, i.name AS item_name, i.sku,
              sl.quantity::int AS quantity, i.unit_cost::float8 AS unit_cost,
              (sl.quantity * i.unit_cost)::float8 AS total_cost
         FROM stock_levels sl
         JOIN inventory_items i ON i.id = sl.item_id
         JOIN branches b ON b.id = sl.branch_id
        WHERE sl.quantity > 0 AND ($1::uuid IS NULL OR sl.branch_id = $1::uuid)
        ORDER BY b.name, i.name`,
      [branchId ?? null],
    );
    const byBranch = new Map<string, any>();
    for (const l of lines) {
      const b = byBranch.get(l.branch_id) ?? {
        branch_id: l.branch_id, branch_name: l.branch_name, total_quantity: 0, total_cost: 0, items: [],
      };
      b.total_quantity += Number(l.quantity);
      b.total_cost += Number(l.total_cost);
      b.items.push(l);
      byBranch.set(l.branch_id, b);
    }
    const branches = [...byBranch.values()].map((b) => ({ ...b, total_cost: Math.round(b.total_cost * 100) / 100 }));
    const grand_total_cost = Math.round(branches.reduce((s, b) => s + b.total_cost, 0) * 100) / 100;
    return { branches, grand_total_cost };
  }

  /** Movement summary per item and type over a date range. */
  async movementReport(filters: { branch_id?: string; from?: string; to?: string }, actor?: InventoryActor) {
    const branchId = this.resolveReadBranch(actor, filters.branch_id);
    return this.dataSource.query(
      `SELECT i.id AS item_id, i.name AS item_name, i.sku, m.type,
              COUNT(*)::int AS moves,
              SUM(m.quantity)::int AS total_quantity
         FROM stock_moves m
         JOIN inventory_items i ON i.id = m.item_id
        WHERE ($1::uuid IS NULL OR m.branch_id = $1::uuid)
          AND ($2::date IS NULL OR m.created_at >= $2::date)
          AND ($3::date IS NULL OR m.created_at < ($3::date + INTERVAL '1 day'))
        GROUP BY i.id, i.name, i.sku, m.type
        ORDER BY i.name, m.type`,
      [branchId ?? null, filters.from ?? null, filters.to ?? null],
    );
  }
}
