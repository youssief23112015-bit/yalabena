import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { ReplySupportTicketDto } from './dto/reply-support-ticket.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
import { AssignSupportTicketDto } from './dto/assign-support-ticket.dto';

const STAFF_ROLES = ['super_admin', 'hr', 'branch_manager'];
const ALL_AUTH_ROLES = [
  'super_admin',
  'hr',
  'branch_manager',
  'teacher',
  'sales',
  'finance',
  'academic',
  'student',
];

@ApiTags('Support')
@ApiBearerAuth('JWT')
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post('tickets')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Submit a support ticket' })
  @ApiBody({ type: CreateSupportTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket submitted successfully.' })
  createTicket(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createTicket(dto, userId);
  }

  @Get('tickets/me')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'List the current user support tickets' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user tickets.',
  })
  myTickets(@CurrentUser('id') userId: string) {
    return this.service.findMyTickets(userId);
  }

  @Get('tickets')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'List support tickets (staff see all, students see own)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'in_progress', 'resolved'],
  })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated support tickets.',
  })
  findAll(
    @Query() query: SupportTicketQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAll(query, user);
  }

  @Get('tickets/:id')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Get a support ticket by id' })
  @ApiParam({ name: 'id', description: 'Support ticket UUID' })
  @ApiResponse({ status: 200, description: 'Returns the ticket details.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('tickets/:id/status')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Update a support ticket status' })
  @ApiParam({ name: 'id', description: 'Support ticket UUID' })
  @ApiBody({ type: UpdateSupportTicketStatusDto })
  @ApiResponse({ status: 200, description: 'Ticket status updated.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.setStatus(id, dto, adminUserId);
  }

  @Post('tickets/:id/reply')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Reply to a support ticket (staff only)' })
  @ApiParam({ name: 'id', description: 'Support ticket UUID' })
  @ApiBody({ type: ReplySupportTicketDto })
  @ApiResponse({ status: 200, description: 'Reply added to the ticket.' })
  reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplySupportTicketDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.replyTicket(id, dto, adminUserId);
  }

  @Patch('tickets/:id/assign')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Assign a support ticket to a staff member' })
  @ApiParam({ name: 'id', description: 'Support ticket UUID' })
  @ApiBody({ type: AssignSupportTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully.' })
  assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSupportTicketDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.assignTicket(id, dto.assigned_to, adminUserId);
  }
}
