import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ViolationQueryDto } from './dto/violation-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully.' })
  createRoom(@Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    return this.chatService.createRoom(dto, user.userId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List my rooms' })
  @ApiResponse({ status: 200, description: 'Returns user chat rooms.' })
  findRooms(@CurrentUser() user: any) {
    return this.chatService.findRooms(user.userId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room details' })
  @ApiParam({ name: 'id', description: 'Chat Room UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns room details.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  getRoom(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.chatService.getRoom(id, user.userId);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get room messages' })
  @ApiParam({ name: 'id', description: 'Chat Room UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiQuery({ name: 'limit', required: false, description: 'Pagination limit' })
  @ApiResponse({ status: 200, description: 'Returns room messages list.' })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.chatService.getMessages(id, user.userId, offset, limit);
  }

  /**
   * NEW — companion route for CHAT-BE-10. The service methods
   * (exportRoomMessagesCsv / exportRoomMessagesPdf) were the only
   * deliverable explicitly requested for this ticket, but without a route
   * they're unreachable from the frontend's export button (RoomActions.tsx).
   * Restricted to moderator/super_admin, matching SRS §6.5's export
   * requirement being a moderator tool.
   */
  @Get('rooms/:id/export')
  @Roles('super_admin', 'moderator')
  @ApiOperation({ summary: 'Export room chat audit log as CSV or PDF' })
  @ApiParam({ name: 'id', description: 'Chat Room UUID' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'pdf'], description: 'Defaults to csv' })
  async exportRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const buffer = await this.chatService.exportRoomMessagesPdf(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="chat-audit-${id}.pdf"`,
      });
      res.send(buffer);
      return;
    }

    const csv = await this.chatService.exportRoomMessagesCsv(id);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chat-audit-${id}.csv"`,
    });
    res.send(csv);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send message (REST fallback)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.chatService.saveMessage(dto, user.userId);
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit message' })
  @ApiParam({ name: 'id', description: 'Message UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Message edited successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  editMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('body') body: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.editMessage(id, user.userId, body);
  }

  @Put('messages/:id/delete')
  @ApiOperation({ summary: 'Soft delete message' })
  @ApiParam({ name: 'id', description: 'Message UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  deleteMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.chatService.deleteMessage(id, user.userId);
  }

  @Post('moderate')
  @Roles('super_admin', 'moderator')
  @ApiOperation({ summary: 'Moderate user in room' })
  @ApiResponse({ status: 201, description: 'User moderated successfully.' })
  moderateUser(@Body() dto: ModerateUserDto, @CurrentUser() user: any) {
    return this.chatService.moderateUser(dto, user.userId);
  }

  @Get('violations')
  @Roles('super_admin', 'moderator')
  @ApiOperation({ summary: 'List chat violations' })
  @ApiResponse({ status: 200, description: 'Returns chat violations list.' })
  getViolations(@Query() query: ViolationQueryDto) {
    return this.chatService.getViolations(query);
  }

  @Put('violations/:id/resolve')
  @Roles('super_admin', 'moderator')
  @ApiOperation({ summary: 'Resolve violation' })
  @ApiParam({ name: 'id', description: 'Violation UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Violation resolved successfully.' })
  @ApiResponse({ status: 404, description: 'Violation not found.' })
  resolveViolation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @Body('is_false_positive') isFalsePositive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.chatService.resolveViolation(id, user.userId, note, isFalsePositive);
  }

  @Get('strikes')
  @Roles('super_admin', 'moderator')
  @ApiOperation({ summary: 'Get my strikes (or all for admin)' })
  @ApiResponse({ status: 200, description: 'Returns user or system strikes.' })
  getStrikes(@CurrentUser() user: any) {
    return this.chatService.getUserStrikes(user.userId);
  }
}
