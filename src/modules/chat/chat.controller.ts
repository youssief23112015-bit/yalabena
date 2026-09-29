import {
  Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe, Res,
  UseInterceptors, UploadedFile, BadRequestException, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatConsentService } from './chat-consent.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ViolationQueryDto } from './dto/violation-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { chatUploadMulterOptions, CHAT_UPLOAD_URL_PREFIX, isImageMimetype } from './utils/upload.config';

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly consentService: ChatConsentService,
  ) {}

  // ─── CONSENT (CHAT-BE-09, SRS §6.6) ───

  @Post('consent')
  @ApiOperation({ summary: 'Record chat policy consent for the current user' })
  @ApiResponse({ status: 201, description: 'Consent recorded.' })
  async acceptConsent(@CurrentUser() user: any) {
    const consent = await this.consentService.accept(user.userId);
    return { accepted: true, accepted_at: consent.accepted_at.toISOString(), policy_version: consent.policy_version };
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get chat policy consent status for the current user' })
  @ApiResponse({ status: 200, description: 'Returns whether the user has accepted the current policy version.' })
  async getConsentStatus(@CurrentUser() user: any) {
    return this.consentService.getStatus(user.userId);
  }

  // ─── UPLOAD (CHAT-BE-03/04/05 — upload portion) ───

  @Post('upload')
  @ApiOperation({ summary: 'Upload a chat attachment (image, PDF, or doc)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Returns the internal URL of the stored file.' })
  @UseInterceptors(FileInterceptor('file', chatUploadMulterOptions))
  uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    // NOTE: this endpoint stores the file and returns its URL — it does
    // NOT yet run OCR (tesseract.js), QR decoding (jsQR), or PDF text
    // extraction (pdf-parse) against scanMessage(). That's the remaining
    // scope of CHAT-BE-03/04/05 beyond "the upload works": an image
    // containing a phone number, or a QR code encoding a WhatsApp link,
    // will currently pass through unscanned. Flagging this explicitly
    // rather than silently shipping partial compliance coverage.
    return {
      url: `${CHAT_UPLOAD_URL_PREFIX}/${file.filename}`,
      name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      is_image: isImageMimetype(file.mimetype),
    };
  }

  // ─── ROOMS ───

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
    // DefaultValuePipe MUST come before ParseIntPipe: it substitutes 0/50
    // when the query param is absent, BEFORE ParseIntPipe (or the global
    // ValidationPipe's implicit Number conversion) ever sees it. Without
    // this, an absent query param gets coerced to NaN, not undefined —
    // that's what was causing "Provided skip value is not a number".
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser() user?: any,
  ) {
    return this.chatService.getMessages(id, user.userId, offset, limit);
  }

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