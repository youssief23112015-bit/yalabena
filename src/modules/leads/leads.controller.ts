import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Leads')
@ApiBearerAuth('JWT')
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'List leads with search, filters & pagination' })
  async findAll(@Query() query: LeadQueryDto) {
    return this.service.findAll(query);
  }

  @Get('pipeline')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Lead pipeline summary (count per stage)' })
  async pipeline() {
    return this.service.pipeline();
  }

  @Get('source-report')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Lead counts per source channel (ROI report)' })
  async sourceReport() {
    return this.service.sourceReport();
  }

  @Get('follow-ups/overdue')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Overdue follow-ups across all leads' })
  async overdueFollowUps() {
    return this.service.overdueFollowUps();
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Get one lead with activities, follow-ups and tags' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Create a lead (rejects duplicates by phone/email/national ID)' })
  @ApiResponse({ status: 201, description: 'Lead created.' })
  @ApiResponse({ status: 409, description: 'Duplicate lead detected.' })
  async create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Update a lead (status changes are logged automatically)' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Post(':id/assign')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Assign lead to an agent (manual or auto round-robin)' })
  async assign(@Param('id') id: string, @Body() dto: AssignLeadDto, @CurrentUser('id') userId: string) {
    if (dto.assigned_to) {
      return this.service.assign(id, dto.assigned_to, userId);
    }
    return this.service.autoAssign(id, dto.branch_id);
  }

  @Post(':id/convert')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Convert lead to student (creates user + student profile)' })
  @ApiResponse({ status: 201, description: 'Lead converted.' })
  @ApiResponse({ status: 409, description: 'Lead already converted.' })
  async convert(@Param('id') id: string, @Body() dto: ConvertLeadDto, @CurrentUser('id') userId: string) {
    return this.service.convert(id, dto, userId);
  }

  @Post(':id/activities')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Log an activity on a lead (call, note, meeting...)' })
  async addActivity(@Param('id') id: string, @Body() dto: AddActivityDto, @CurrentUser('id') userId: string) {
    return this.service.addActivity(id, dto, userId);
  }

  @Get(':id/activities')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'List all activities of a lead' })
  async listActivities(@Param('id') id: string) {
    return this.service.listActivities(id);
  }

  @Post(':id/follow-ups')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Schedule a follow-up for a lead' })
  async createFollowUp(@Param('id') id: string, @Body() dto: CreateFollowUpDto) {
    return this.service.createFollowUp(id, dto);
  }

  @Get(':id/follow-ups')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'List follow-ups of a lead' })
  async listFollowUps(@Param('id') id: string) {
    return this.service.listFollowUps(id);
  }

  @Patch('follow-ups/:id/complete')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Mark a follow-up as done' })
  async completeFollowUp(@Param('id') id: string) {
    return this.service.completeFollowUp(id);
  }

  @Post(':id/tags')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Attach a tag to a lead (creates the tag if new)' })
  async addTag(@Param('id') id: string, @Body() dto: AddTagDto) {
    return this.service.addTag(id, dto);
  }

  @Delete(':id/tags/:tagId')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Remove a tag from a lead' })
  async removeTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.service.removeTag(id, tagId);
  }
}
