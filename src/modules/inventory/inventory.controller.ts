import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryItemsService, InventoryActor } from './inventory.service';
import { SaveItemDto } from './dto/save-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustStockDto, ReceiveStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto, ReturnItemDto } from './dto/issue-item.dto';
import {
  ListItemsQueryDto, ListMovesQueryDto, ListIssuesQueryDto, MovementReportQueryDto,
} from './dto/query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

// Authorization (enforced server-side by the global RolesGuard):
//   READ   - super_admin, sales, finance, auditor
//   MANAGE - super_admin             (catalog, receive, adjust)
//   ISSUE  - super_admin, sales
const READ = ['super_admin', 'sales', 'finance', 'auditor'] as const;
const MANAGE = ['super_admin'] as const;
const ISSUE = ['super_admin', 'sales'] as const;

/** request.user (JwtStrategy.validate) -> actor. NB: CurrentUser() returns the whole object. */
const toActor = (u: any): InventoryActor => ({
  id: u?.userId ?? u?.id,
  roles: u?.roles ?? [],
});

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  // ---------- Static routes first (must precede ':id') ----------

  @Get('low-stock-alerts')
  @Roles(...READ)
  @ApiOperation({ summary: 'Items at or below reorder level (SRS 4.12)' })
  lowStockAlerts() {
    return this.service.lowStockAlerts();
  }

  @Get('valuation-report')
  @Roles(...READ)
  @ApiOperation({ summary: 'Inventory valuation per item (SRS 4.12)' })
  valuationReport() {
    return this.service.valuationReport();
  }

  @Get('movement-report')
  @Roles(...READ)
  @ApiOperation({ summary: 'Stock movement totals per item and type for a date range' })
  movementReport(@Query() q: MovementReportQueryDto) {
    return this.service.movementReport(q);
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
  @ApiOperation({ summary: 'Create an inventory item (optionally with opening stock)' })
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
  @ApiOperation({ summary: 'Item with stock level and recent movements' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, toActor(user));
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
  @ApiOperation({ summary: 'Receive stock (purchase, donation, supplier delivery)' })
  receive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceiveStockDto, @CurrentUser() user: any) {
    return this.service.receiveStock(id, dto, toActor(user));
  }

  @Post(':id/adjust')
  @Roles(...MANAGE)
  @ApiOperation({ summary: 'Stock adjustment with mandatory reason (signed quantity)' })
  adjust(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto, @CurrentUser() user: any) {
    return this.service.adjustStock(id, dto, toActor(user));
  }
}
