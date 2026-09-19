import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../shared/entities/inventory-item.entity';
import { StockLevel } from '../../shared/entities/stock-level.entity';
import { StockMove } from '../../shared/entities/stock-move.entity';
import { StudentItemIssue } from '../../shared/entities/student-item-issue.entity';
import { StockMoveType } from '../../common/enums/stock-move-type.enum';
import { SaveItemDto } from './dto/save-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto } from './dto/issue-item.dto';

@Injectable()
export class InventoryItemsService {
  constructor(
    @InjectRepository(InventoryItem) private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(StockLevel) private readonly stockRepo: Repository<StockLevel>,
    @InjectRepository(StockMove) private readonly moveRepo: Repository<StockMove>,
    @InjectRepository(StudentItemIssue) private readonly issueRepo: Repository<StudentItemIssue>,
  ) {}

  // ==================== ITEMS ====================

  async create(dto: SaveItemDto) {
    // DB-FIRST: inventory_items is a master catalog. branch_id belongs to stock_levels.
    const item = await this.itemRepo.save(
      this.itemRepo.create({
        name: dto.name,
        sku: dto.sku ?? null,
        description: dto.description ?? null,
        category: dto.category,
        unit_cost: dto.unit_cost ?? 0,
        unit_price: dto.unit_price ?? 0, // Matches your TypeORM entity
        unit_of_measure: dto.unit_of_measure ?? 'piece',
        reorder_level: dto.reorder_level ?? 10,
      } as Partial<InventoryItem>),
    );

    if (dto.initial_quantity && dto.initial_quantity > 0 && dto.branch_id) {
      await this.adjustStock(
        item.id,
        {
          type: StockMoveType.IN,
          quantity: dto.initial_quantity,
          reason: 'initial stock',
          unit_cost: dto.unit_cost,
        } as AdjustStockDto,
        dto.branch_id,
      );
    }
    return this.findOne(item.id);
  }

  async findAll(branchId?: string, includeLowStockOnly?: boolean) {
    const qb = this.itemRepo.createQueryBuilder('item').orderBy('item.name', 'ASC');

    if (branchId) {
      // Map stock for the specific branch only
      qb.leftJoinAndMapOne(
        'item.stock',
        StockLevel,
        'stock',
        'stock.item_id = item.id AND stock.branch_id = :b',
        { b: branchId },
      );
    }

    const items = await qb.getMany();

    if (!includeLowStockOnly) return items;
    return items.filter((it: any) => (it.stock?.quantity ?? 0) <= it.reorder_level);
  }

  async findOne(id: string, branchId?: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);
    
    let stock;
    if (branchId) {
      stock = await this.getOrCreateStock(item.id, branchId);
    } else {
      // Return all branch stock levels for this item if no specific branch is requested
      stock = await this.stockRepo.find({ where: { item_id: item.id }, relations: ['branch'] });
    }

    const moves = await this.moveRepo.find({
      where: { item_id: item.id }, 
      relations: ['created_by'], 
      order: { created_at: 'DESC' }, 
      take: 50,
    });
    
    return { ...item, stock, moves };
  }

  async update(id: string, dto: Partial<SaveItemDto>) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);
    
    // Ignore stock/branch changes here; those must go through adjustStock
    const { initial_quantity, branch_id, ...rest } = dto as any;
    Object.assign(item, rest);
    return this.itemRepo.save(item);
  }

  async remove(id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${id} not found`);
    
    const stock = await this.stockRepo.find({ where: { item_id: id } });
    const hasStock = stock.some(s => s.quantity !== 0);
    if (hasStock) {
      throw new BadRequestException('Cannot delete an item with stock on hand. Adjust stock to zero first.');
    }
    
    await this.itemRepo.remove(item);
    return { deleted: true };
  }

  // ==================== STOCK MOVES (SRS 4.12) ====================

  private async getOrCreateStock(itemId: string, branchId: string): Promise<StockLevel> {
    let stock = await this.stockRepo.findOne({ where: { item_id: itemId, branch_id: branchId } });
    if (!stock) {
      stock = await this.stockRepo.save(
        this.stockRepo.create({ item_id: itemId, branch_id: branchId, quantity: 0 })
      );
    }
    return stock;
  }

  async adjustStock(itemId: string, dto: AdjustStockDto, branchId: string, userId?: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${itemId} not found`);

    // Validate type against enum
    if (!Object.values(StockMoveType).includes(dto.type as any)) {
      throw new BadRequestException(`Invalid stock move type: ${dto.type}`);
    }

    const stock = await this.getOrCreateStock(itemId, branchId);
    const isIn = [StockMoveType.IN, StockMoveType.RETURN, StockMoveType.TRANSFER_IN].includes(dto.type as any);
    const delta = isIn ? dto.quantity : -dto.quantity;
    
    if (stock.quantity + delta < 0) {
      throw new BadRequestException(`Not enough stock (available: ${stock.quantity}).`);
    }
    
    stock.quantity += delta;
    stock.last_counted_at = new Date();
    await this.stockRepo.save(stock);

    // Create immutable audit trail
    await this.moveRepo.save(
      this.moveRepo.create({
        item_id: itemId,
        branch_id: branchId,
        type: dto.type,
        quantity: dto.quantity,
        unit_cost: dto.unit_cost ?? null,
        reason: dto.reason,
        reference_type: dto.reference_type ?? 'manual', // Matches DB CHECK constraint
        reference_id: dto.reference_id ?? null,
        created_by: userId ?? null,
      }),
    );

    return this.findOne(itemId, branchId);
  }

  async listMoves(filters: { item_id?: string; branch_id?: string; type?: string }) {
    const qb = this.moveRepo.createQueryBuilder('move')
      .leftJoinAndSelect('move.item', 'item')
      .leftJoinAndSelect('move.created_by', 'created_by')
      .orderBy('move.created_at', 'DESC')
      .take(200);
      
    if (filters.item_id) qb.andWhere('move.item_id = :i', { i: filters.item_id });
    if (filters.branch_id) qb.andWhere('move.branch_id = :b', { b: filters.branch_id });
    if (filters.type) qb.andWhere('move.type = :t', { t: filters.type });
    
    return qb.getMany();
  }

  // ==================== ISSUE TO STUDENTS (SRS 4.12) ====================

  async issueToStudent(dto: IssueItemDto, userId?: string) {
    const item = await this.itemRepo.findOne({ where: { id: dto.item_id } });
    if (!item) throw new NotFoundException(`Inventory item with ID ${dto.item_id} not found`);

    const quantity = dto.quantity ?? 1;
    const cost = dto.cost ?? item.unit_price ?? 0;

    // Decrease stock atomically
    await this.adjustStock(
      item.id,
      {
        type: StockMoveType.OUT,
        quantity,
        reason: `issued to student ${dto.student_id}`,
        reference_type: 'enrollment', // Matches DB CHECK constraint
        reference_id: dto.reference_id ?? dto.student_id,
      } as AdjustStockDto,
      dto.branch_id,
      userId,
    );

    return this.issueRepo.save(
      this.issueRepo.create({
        student_id: dto.student_id,
        item_id: item.id,
        branch_id: dto.branch_id,
        quantity,
        cost,
        created_by: userId ?? null,
      }),
    );
  }

  async listIssues(filters: { student_id?: string; branch_id?: string; open_only?: boolean }) {
    const qb = this.issueRepo.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.item', 'item')
      .leftJoinAndSelect('issue.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('issue.issued_at', 'DESC');
      
    if (filters.student_id) qb.andWhere('issue.student_id = :s', { s: filters.student_id });
    if (filters.branch_id) qb.andWhere('issue.branch_id = :b', { b: filters.branch_id });
    if (filters.open_only) qb.andWhere('issue.returned_at IS NULL');
    
    return qb.getMany();
  }

  async returnItem(issueId: string, condition?: string, userId?: string) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId }, relations: ['item'] });
    if (!issue) throw new NotFoundException(`Issue record with ID ${issueId} not found`);
    if (issue.returned_at) throw new BadRequestException('This item has already been returned.');

    issue.returned_at = new Date();
    if (condition) issue.condition_on_return = condition as any;

    // Put quantity back into stock atomically
    await this.adjustStock(
      issue.item_id,
      {
        type: StockMoveType.RETURN,
        quantity: issue.quantity,
        reason: `returned by student ${issue.student_id}`,
        reference_type: 'return', // Matches DB CHECK constraint
        reference_id: issue.student_id,
      } as AdjustStockDto,
      issue.branch_id,
      userId,
    );

    return this.issueRepo.save(issue);
  }

  // ==================== REPORTS (SRS 4.12) ====================

  async lowStockAlerts(branchId?: string) {
    const items = await this.findAll(branchId);
    return items
      .map((it: any) => ({ 
        item: it, 
        quantity: it.stock?.quantity ?? 0, 
        reorder_level: it.reorder_level 
      }))
      .filter((x) => x.quantity <= x.reorder_level);
  }

  async valuationReport(branchId?: string) {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .innerJoin('stock.item', 'item')
      .select('stock.branch_id', 'branch_id')
      .addSelect('SUM(stock.quantity)', 'total_quantity')
      .addSelect('SUM(stock.quantity * item.unit_cost)', 'total_cost')
      .groupBy('stock.branch_id');
      
    if (branchId) qb.andWhere('stock.branch_id = :b', { b: branchId });

    const rows = await qb.getRawMany();
    const total = rows.reduce((sum: number, r: any) => sum + Number(r.total_cost ?? 0), 0);
    
    return { 
      branches: rows.map((r: any) => ({ 
        ...r, 
        total_quantity: Number(r.total_quantity), 
        total_cost: Number(r.total_cost) 
      })), 
      grand_total_cost: total 
    };
  }
}