import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryItemsService } from './inventory.service';
import { SaveItemDto } from './dto/save-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { IssueItemDto } from './dto/issue-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  @Post()
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Create an inventory item (books, workbooks, merchandise)' })
  @ApiResponse({ status: 201, description: 'Item created.' })
  async create(@Body() dto: SaveItemDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'List items with live stock levels (filter by branch / low-stock only)' })
  @ApiQuery({ name: 'branch_id', required: false })
  @ApiQuery({ name: 'low_stock_only', required: false, type: Boolean })
  async findAll(@Query('branch_id') branchId?: string, @Query('low_stock_only') lowStock?: string) {
    return this.service.findAll(branchId, lowStock === 'true' || lowStock === '1');
  }

  @Get('low-stock-alerts')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Items at or below reorder level (SRS 4.12 low-stock alerts)' })
  async lowStockAlerts(@Query('branch_id') branchId?: string) {
    return this.service.lowStockAlerts(branchId);
  }

  @Get('valuation-report')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Inventory valuation report per branch (SRS 4.12)' })
  async valuationReport(@Query('branch_id') branchId?: string) {
    return this.service.valuationReport(branchId);
  }

  @Get('moves')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Stock moves history (in / out / adjustments with reason)' })
  async listMoves(
    @Query('item_id') itemId?: string,
    @Query('branch_id') branchId?: string,
    @Query('type') type?: string,
  ) {
    return this.service.listMoves({ item_id: itemId, branch_id: branchId, type });
  }

  @Get('issues')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'List item issues (filter by student / branch / open only)' })
  async listIssues(
    @Query('student_id') studentId?: string,
    @Query('branch_id') branchId?: string,
    @Query('open_only') openOnly?: string,
  ) {
    return this.service.listIssues({ student_id: studentId, branch_id: branchId, open_only: openOnly === 'true' });
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Get item with stock level and recent moves' })
  @ApiResponse({ status: 200, description: 'Returns item details.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Update item details (name, prices, reorder level...)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<SaveItemDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Delete an item (blocked while stock on hand > 0)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/adjust')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Stock adjustment with mandatory reason (SRS 4.12)' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.adjustStock(id, dto, undefined, userId);
  }

  @Post('issues')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Issue items to a student (decreases stock, optional cost)' })
  async issueToStudent(@Body() dto: IssueItemDto, @CurrentUser('id') userId: string) {
    return this.service.issueToStudent(dto, userId);
  }

  @Patch('issues/:id/return')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Return an issued item (restores stock, records condition)' })
  async returnItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('condition') condition: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.returnItem(id, condition, userId);
  }
}
