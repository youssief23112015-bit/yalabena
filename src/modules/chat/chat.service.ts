import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ChatRoom } from '../../shared/entities/chat-room.entity';
import { ChatRoomMember } from '../../shared/entities/chat-room-member.entity';
import { ChatMessage } from '../../shared/entities/chat-message.entity';
import { ChatViolation } from '../../shared/entities/chat-violation.entity';
import { ChatStrike } from '../../shared/entities/chat-strike.entity';
import { User } from '../../shared/entities/user.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ViolationQueryDto } from './dto/violation-query.dto';
import { ChatMessageType } from '../../common/enums/chat-message-type.enum';
import { ViolationAction } from '../../common/enums/violation-action.enum';
import { StrikeAction } from '../../common/enums/strike-action.enum';
import { normalizeChatMessage } from './utils/normalize-chat';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom) private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember) private memberRepo: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage) private messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatViolation) private violationRepo: Repository<ChatViolation>,
    @InjectRepository(ChatStrike) private strikeRepo: Repository<ChatStrike>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // ─── ROOMS ───

  async createRoom(dto: CreateRoomDto, userId: string) {
    const room = this.roomRepo.create({
      ...dto,
      created_by: userId,
    });
    const saved = await this.roomRepo.save(room);

    // Add creator as admin
    await this.memberRepo.save({
      room_id: saved.id,
      user_id: userId,
      role: 'admin',
    });

    // Add other members
    if (dto.member_ids?.length) {
      const members = dto.member_ids
        .filter((id) => id !== userId)
        .map((id) => ({
          room_id: saved.id,
          user_id: id,
          role: 'member',
        }));
      if (members.length) await this.memberRepo.save(members);
    }

    return this.roomRepo.findOne({ where: { id: saved.id }, relations: ['members', 'members.user'] });
  }

  async findRooms(userId: string) {
    const memberships = await this.memberRepo.find({
      where: { user_id: userId, is_banned: false },
      relations: ['room'],
    });
    return memberships.map((m) => m.room);
  }

  async getRoom(roomId: string, userId: string) {
    const membership = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId },
      relations: ['room', 'room.members', 'room.members.user'],
    });
    if (!membership || membership.is_banned) throw new ForbiddenException('Access denied');
    return membership.room;
  }

  // ─── MESSAGES ───

  async saveMessage(dto: SendMessageDto, senderId: string) {
    const membership = await this.memberRepo.findOne({
      where: { room_id: dto.room_id, user_id: senderId },
    });
    if (!membership || membership.is_banned) throw new ForbiddenException('You cannot send messages in this room');
    if (membership.is_muted && membership.muted_until && membership.muted_until > new Date()) {
      throw new ForbiddenException('You are muted in this room');
    }

    const message = this.messageRepo.create({
      ...dto,
      sender_id: senderId,
      type: dto.type || ChatMessageType.TEXT,
    });
    return this.messageRepo.save(message);
  }

  async getMessages(roomId: string, userId: string, offset = 0, limit = 50) {
    const membership = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId, is_banned: false },
    });
    if (!membership) throw new ForbiddenException('Access denied');

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { room_id: roomId, deleted_at: null },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
      relations: ['sender', 'reply_to'],
    });

    // Update last read
    membership.last_read_at = new Date();
    await this.memberRepo.save(membership);

    return { data: messages.reverse(), total };
  }

  async editMessage(messageId: string, userId: string, body: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId, sender_id: userId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.deleted_at) throw new BadRequestException('Cannot edit deleted message');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.created_at < fiveMinutesAgo) throw new BadRequestException('Edit window expired (5 minutes)');

    message.body = body;
    message.edited_at = new Date();
    message.edited_count += 1;
    return this.messageRepo.save(message);
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId, sender_id: userId } });
    if (!message) throw new NotFoundException('Message not found');
    message.deleted_at = new Date();
    return this.messageRepo.save(message);
  }

  // ─── MODERATION ───

  async moderateUser(dto: ModerateUserDto, moderatorId: string) {
    const room = await this.roomRepo.findOne({ where: { id: dto.room_id } });
    if (!room) throw new NotFoundException('Room not found');

    const modMembership = await this.memberRepo.findOne({
      where: { room_id: dto.room_id, user_id: moderatorId },
    });
    if (!modMembership || !['admin', 'moderator', 'teacher'].includes(modMembership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    let member = await this.memberRepo.findOne({
      where: { room_id: dto.room_id, user_id: dto.user_id },
    });

    switch (dto.action) {
      case 'mute':
        if (!member) {
          member = this.memberRepo.create({ room_id: dto.room_id, user_id: dto.user_id });
        }
        member.is_muted = true;
        member.muted_until = dto.duration_minutes
          ? new Date(Date.now() + dto.duration_minutes * 60 * 1000)
          : null;
        await this.memberRepo.save(member);
        break;
      case 'unmute':
        if (member) {
          member.is_muted = false;
          member.muted_until = null;
          await this.memberRepo.save(member);
        }
        break;
      case 'ban':
        if (!member) {
          member = this.memberRepo.create({ room_id: dto.room_id, user_id: dto.user_id });
        }
        member.is_banned = true;
        member.banned_until = dto.duration_minutes
          ? new Date(Date.now() + dto.duration_minutes * 60 * 1000)
          : null;
        member.ban_reason = dto.reason;
        await this.memberRepo.save(member);
        break;
      case 'unban':
        if (member) {
          member.is_banned = false;
          member.banned_until = null;
          member.ban_reason = null;
          await this.memberRepo.save(member);
        }
        break;
      case 'warn':
        // Just a logical action, could emit a system message
        break;
    }

    return { success: true, action: dto.action, user_id: dto.user_id };
  }

  // ─── VIOLATIONS & STRIKES ───

  async logViolation(
    messageId: string,
    roomId: string,
    senderId: string,
    ruleMatched: string,
    originalMessage: string,
    actionTaken: ViolationAction,
    detectionMethod = 'text_regex',
  ) {
    const violation = this.violationRepo.create({
      message_id: messageId,
      room_id: roomId,
      sender_id: senderId,
      rule_matched: ruleMatched,
      original_message: originalMessage,
      action_taken: actionTaken,
      detection_method: detectionMethod,
    });
    const saved = await this.violationRepo.save(violation);

    // Apply strike system
    await this.applyStrike(senderId, saved.id);
    return saved;
  }

  private async applyStrike(userId: string, violationId: string) {
    const strikeCount = await this.strikeRepo.count({ where: { user_id: userId, is_active: true } });
    const strikeNumber = strikeCount + 1;

    let action: StrikeAction;
    let expiresAt: Date | null = null;

    if (strikeNumber === 1) {
      action = StrikeAction.WARNING;
    } else if (strikeNumber === 2) {
      action = StrikeAction.MUTE_24H;
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      action = StrikeAction.BAN_PERMANENT;
    }

    const strike = this.strikeRepo.create({
      user_id: userId,
      violation_id: violationId,
      strike_number: strikeNumber,
      action,
      expires_at: expiresAt,
    });
    return this.strikeRepo.save(strike);
  }

  async getViolations(query: ViolationQueryDto) {
    const qb = this.violationRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.sender', 'sender')
      .leftJoinAndSelect('v.room', 'room')
      .orderBy('v.created_at', 'DESC');

    if (query.room_id) qb.andWhere('v.room_id = :roomId', { roomId: query.room_id });
    if (query.sender_id) qb.andWhere('v.sender_id = :senderId', { senderId: query.sender_id });
    if (query.rule_matched) qb.andWhere('v.rule_matched = :rule', { rule: query.rule_matched });
    if (query.is_false_positive !== undefined) qb.andWhere('v.is_false_positive = :fp', { fp: query.is_false_positive });

    const [data, total] = await qb
      .skip(query.offset || 0)
      .take(query.limit || 20)
      .getManyAndCount();
    return { data, total };
  }

  async resolveViolation(violationId: string, moderatorId: string, note?: string, isFalsePositive = false) {
    const violation = await this.violationRepo.findOne({ where: { id: violationId } });
    if (!violation) throw new NotFoundException('Violation not found');

    violation.resolved_at = new Date();
    violation.moderator_id = moderatorId;
    violation.moderator_note = note;
    violation.is_false_positive = isFalsePositive;
    return this.violationRepo.save(violation);
  }

  async getUserStrikes(userId: string) {
    return this.strikeRepo.find({
      where: { user_id: userId },
      relations: ['violation'],
      order: { strike_number: 'DESC' },
    });
  }

  // ─── COMPLIANCE ENGINE ───

    scanMessage(body: string): { violation: boolean; rule: string; action: ViolationAction } | null {
    if (!body) return null;

    const { canonical, squashed } = normalizeChatMessage(body);
    const targets = [canonical, squashed]; // test both forms

    const rules: Array<{ name: string; pattern: RegExp; action: ViolationAction }> = [
      // Egyptian mobile: 010/011/012/015 + 8 digits (catches squashed separators too)
      { name: 'phone_egyptian', pattern: /01[0125]\d{8}/, action: ViolationAction.BLOCKED },
      // International Egypt: +20 / 0020 variants
      { name: 'phone_egyptian_intl', pattern: /(\+?20|0020)1[0125]\d{8}/, action: ViolationAction.BLOCKED },
      // Any 10–15 digit run (post-squash catches spaced/dashed forms)
      { name: 'phone_generic', pattern: /\d{10,15}/, action: ViolationAction.BLOCKED },
      // Email (canonical already collapsed "at"/"dot")
      { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, action: ViolationAction.BLOCKED },
      // WhatsApp / messenger links
      { name: 'messenger_link', pattern: /(wa\.me\/|api\.whatsapp\.com|t\.me\/|m\.me\/|telegram\.org|signal\.me|viber\.com)/i, action: ViolationAction.BLOCKED },
      // Social handle + platform mention
      { name: 'social_handle', pattern: /(facebook|instagram|twitter|telegram|snapchat|tiktok)\s*[:@]\s*\w+/i, action: ViolationAction.WARNED },
      // Trigger phrases (EN + AR)
      { name: 'trigger_contact_share', pattern: /(call me|text me|dm me|my number is|كلمني بره|رقمي هو|ابعت ?لي|ابعتلي|على الواتس|الواتس اب|الواتساب)/i, action: ViolationAction.BLOCKED },
    ];

    for (const rule of rules) {
      for (const target of targets) {
        if (rule.pattern.test(target)) {
          return { violation: true, rule: rule.name, action: rule.action };
        }
      }
    }
    return null;
  }

  // ─── MEMBERSHIP ───

  async joinRoom(roomId: string, userId: string) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const exists = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (exists) return exists;

    const member = this.memberRepo.create({ room_id: roomId, user_id: userId, role: 'member' });
    return this.memberRepo.save(member);
  }

  async leaveRoom(roomId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (!member) throw new NotFoundException('Not a member');
    await this.memberRepo.remove(member);
    return { success: true };
  }
}
