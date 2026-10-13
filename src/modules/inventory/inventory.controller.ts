import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryItemsService, InventoryActor } from './inventory.service';
import { SaveItemDto } from './dto/save-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustStockDto, ReceiveStockDto, TransferStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto, ReturnItemDto } from './dto/issue-item.dto';
import {
  ListItemsQueryDto, ListMovesQueryDto, ListIssuesQueryDto, BranchQueryDto, MovementReportQueryDto,
} from './dto/query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

// Authorization (enforced server-side by the global RolesGuard):
//   READ   - super_admin, branch_manager, sales, finance, auditor
//   MANAGE - super_admin, branch_manager   (catalog, receive, adjust, transfer)
//   ISSUE  - super_admin, branch_manager, sales
// Branch scoping for non-HQ roles is enforced inside the service.
const READ = ['super_admin', 'branch_manager', 'sales', 'finance', 'auditor'] as const;
const MANAGE = ['super_admin', 'branch_manager'] as const;
const ISSUE = ['super_admin', 'branch_manager', 'sales'] as const;

/** request.user (JwtStrategy.validate) -> actor. NB: CurrentUser() returns the whole object. */
const toActor = (u: any): InventoryActor => ({
  id: u?.userId ?? u?.id,
  roles: u?.roles ?? [],
  branchId: u?.branchId ?? null,
});

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  // ---------- Static routes first (must precede ':id') ----------

  @Get('low-stock-alerts')
  @Roles(...READ)
  @ApiOperation({ summary: 'Items at or below reorder level, per branch (SRS 4.12)' })
  lowStockAlerts(@Query() q: BranchQueryDto, @CurrentUser() user: any) {
    return this.service.lowStockAlerts(q.branch_id, toActor(user));
  }

  @Get('valuation-report')
  @Roles(...READ)
  @ApiOperation({ summary: 'Inventory valuation per branch and item (SRS 4.12)' })
  valuationReport(@Query() q: BranchQueryDto, @CurrentUser() user: any) {
    return this.service.valuationReport(q.branch_id, toActor(user));
  }

  @Get('movement-report')
  @Roles(...READ)
  @ApiOperation({ summary: 'Stock movement totals per item and type for a date range' })
  movementReport(@Query() q: MovementReportQueryDto, @CurrentUser() user: any) {
    return this.service.movementReport(q, toActor(user));
  }

  @Get('moves')
  @Roles(...READ)
  @ApiOperation({ summary: 'Stock movement history (paginated, filterable)' })
  listMoves(@Query() q: ListMovesQueryDto, @CurrentUser() user: any) {
    return this.service.listMoves(q, toActor(user));
  }

  @Get('issues')
  @Roles(...READ)
  @ApiOperation({ summary: 'Items issued to students (paginated)' })
  listIssues(@Query() q: ListIssuesQueryDto, @CurrentUser() user: any) {
    return this.service.listIssues(q, toActor(user));
  }

  @Post('issues')
  @Roles(...ISSUE)
  @ApiOperation({ summary: 'Issue items to a student (decreases stock, optional cost)' })
  issueToStudent(@Body() dto: IssueItemDto, @CurrentUser() user: any) {
    return this.service.issueToStudent(dto, toActor(user));
  }

  @Patch('issues/:id/return')
  @Roles(...ISSUE)
  @ApiOperation({ summary: 'Return an issued item (restocks only when returned in good condition)' })
  returnItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReturnItemDto, @CurrentUser() user: any) {
    return this.service.returnItem(id, dto.condition, toActor(user));
  }

  // ---------- Catalog ----------

  @Post()
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Create an inventory item (optionally with opening stock in one branch)' })
  @ApiResponse({ status: 201, description: 'Item created.' })
  @ApiResponse({ status: 409, description: 'Duplicate SKU.' })
  create(@Body() dto: SaveItemDto, @CurrentUser() user: any) {
    return this.service.create(dto, toActor(user));
  }

  @Get()
  @Roles(...READ)
  @ApiOperation({ summary: 'Paginated catalog with live quantities; search, filter, sort' })
  findAll(@Query() q: ListItemsQueryDto, @CurrentUser() user: any) {
    return this.service.findAll(q, toActor(user));
  }

  @Get(':id')
  @Roles(...READ)
  @ApiOperation({ summary: 'Item with per-branch stock and recent movements' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Query() q: BranchQueryDto, @CurrentUser() user: any) {
    return this.service.findOne(id, q.branch_id, toActor(user));
  }

  @Put(':id')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Update catalog fields / deactivate (status). Quantities cannot be edited here.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Delete an unused item; items with history are archived instead' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // ---------- Stock movements ----------

  @Post(':id/receive')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Receive stock into a branch' })
  receive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceiveStockDto, @CurrentUser() user: any) {
    return this.service.receiveStock(id, dto, toActor(user));
  }

  @Post(':id/adjust')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Stock adjustment with mandatory reason (signed quantity)' })
  adjust(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto, @CurrentUser() user: any) {
    return this.service.adjustStock(id, dto, toActor(user));
  }

  @Post(':id/transfer')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Transfer stock between branches (atomic)' })
  transfer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransferStockDto, @CurrentUser() user: any) {
    return this.service.transferStock(id, dto, toActor(user));
  }
}
