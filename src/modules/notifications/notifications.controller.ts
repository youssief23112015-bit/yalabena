import { Body, Controller, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/utils/auth-user';
import { NotificationService } from './notifications.service';
import { SendBroadcastDto } from './dto/broadcast-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated notification inbox for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unread_only', required: false, type: Boolean })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unread_only') unreadOnly?: string,
  ) {
    return this.service.findAll(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unread_only: unreadOnly === 'true' || unreadOnly === '1',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.service.unreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.markRead(userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark every unread notification as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.service.markAllRead(userId);
  }

  // Route must stay below the literal routes above so "broadcast" is never
  // swallowed by a future parameterised route.
  @Post('broadcast')
  // Global JwtAuthGuard + RolesGuard already run (see app.module.ts); they are
  // re-declared here so the endpoint's auth surface is explicit and self-documenting.
  // Teachers are admitted here but the service restricts them to target_type
  // "group" on their own groups (403 otherwise) — Business Rule 2.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'hr', 'academic', 'teacher')
  @ApiOperation({
    summary:
      'Send a targeted notification (all / students / teachers / specific_user / group). ' +
      'Teachers: own groups only.',
  })
  createBroadcast(@Body() dto: SendBroadcastDto, @CurrentUser() user: AuthUser) {
    return this.service.createBroadcast(dto, user);
  }
}
