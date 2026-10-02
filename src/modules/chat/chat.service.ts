import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatRoom } from '../../shared/entities/chat-room.entity';
import { ChatRoomMember } from '../../shared/entities/chat-room-member.entity';
import { ChatMessage } from '../../shared/entities/chat-message.entity';
import { ChatViolation } from '../../shared/entities/chat-violation.entity';
import { ChatStrike } from '../../shared/entities/chat-strike.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ViolationQueryDto } from './dto/violation-query.dto';
import { ChatRoomType } from '../../common/enums/chat-room-type.enum';
import { ChatMessageType } from '../../common/enums/chat-message-type.enum';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { ViolationAction } from '../../common/enums/violation-action.enum';
import { StrikeAction } from '../../common/enums/strike-action.enum';
import { normalizeChatMessage } from './utils/normalize-chat';
import { toCsvLine } from './utils/csv';
import { isInternalUploadUrl } from './utils/attachment-url';
import { PdfService } from '../pdf/pdf.service';

export interface ChatAuditRow {
  id: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  type: string;
  deleted: boolean;
  editedCount: number;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  /**
   * FIX (Room Access): role slugs that may enter ANY chat room without an
   * enrollment check. Matches the slugs produced by JwtStrategy and seeded
   * in the `roles` table.
   */
  private readonly STAFF_ROLE_SLUGS = ['super_admin', 'admin', 'moderator', 'academic'];

  constructor(
    @InjectRepository(ChatRoom) private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember) private memberRepo: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage) private messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatViolation) private violationRepo: Repository<ChatViolation>,
    @InjectRepository(ChatStrike) private strikeRepo: Repository<ChatStrike>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent) private groupStudentRepo: Repository<GroupStudent>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    private readonly pdfService: PdfService,
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

  /**
   * Automatic group chat rooms: whenever a study Group exists, exactly one
   * GROUP-type ChatRoom is linked to it (chat_rooms.group_id is unique).
   * Idempotent — safe to call on group create/update, student assignment,
   * enrollment changes, or any chat access path.
   */
  async ensureGroupChatRoom(groupId: string): Promise<ChatRoom> {
    const existing = await this.roomRepo.findOne({
      where: { group_id: groupId, type: ChatRoomType.GROUP },
    });
    if (existing) return existing;

    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);

    const saved = await this.roomRepo.save(
      this.roomRepo.create({
        type: ChatRoomType.GROUP,
        group_id: group.id,
        name: `${group.name} — Group Chat`,
        created_by: group.teacher_id,
      }),
    );

    // Teacher + substitute are room teachers (moderation-capable) from birth.
    await this.upsertMember(saved.id, group.teacher_id, 'teacher');
    if (group.substitute_teacher_id) {
      await this.upsertMember(saved.id, group.substitute_teacher_id, 'teacher');
    }

    (saved as any).group = group; // lets role detection work for immediate joiners
    return saved;
  }

  /**
   * Full membership sync for a group's chat room: teacher + substitute +
   * every ACTIVE group_student + every ACTIVE enrollment. Adds missing rows
   * only — existing members keep their moderation state (bans/mutes) and
   * any custom roles.
   */
  async syncGroupChatRoom(groupId: string): Promise<ChatRoom> {
    const room = await this.ensureGroupChatRoom(groupId);
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) return room;

    const seats = new Map<string, 'teacher' | 'member'>();
    if (group.teacher_id) seats.set(group.teacher_id, 'teacher');
    if (group.substitute_teacher_id) seats.set(group.substitute_teacher_id, 'teacher');

    const groupStudents = await this.groupStudentRepo.find({
      where: { group_id: groupId, status: 'active' },
      relations: ['student'],
    });
    for (const gs of groupStudents) {
      if (gs.student?.user_id && !seats.has(gs.student.user_id)) seats.set(gs.student.user_id, 'member');
    }

    // enrollments.service writes 'ACTIVE' while EnrollmentStatus.ACTIVE is
    // 'active' — match both so eligibility never silently fails.
    const enrollments = await this.enrollmentRepo.find({
      where: { group_id: groupId, status: In(['active', 'ACTIVE'] as any) },
      relations: ['student'],
    });
    for (const e of enrollments) {
      if (e.student?.user_id && !seats.has(e.student.user_id)) seats.set(e.student.user_id, 'member');
    }

    for (const [uid, role] of seats) await this.upsertMember(room.id, uid, role);
    return room;
  }

  /** Staff-only helper for the controller: re-sync a room from its linked group. */
  async syncRoomMembers(roomId: string): Promise<{ room_id: string; synced: boolean }> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.group_id) throw new BadRequestException('Room is not linked to a study group');
    await this.syncGroupChatRoom(room.group_id);
    return { room_id: roomId, synced: true };
  }

  async findRooms(userId: string) {
    const rooms = new Map<string, ChatRoom>();

    // 1) Explicit memberships (previous behaviour).
    const memberships = await this.memberRepo.find({
      where: { user_id: userId, is_banned: false },
      relations: ['room'],
    });
    for (const m of memberships) if (m.room) rooms.set(m.room.id, m.room);

    // 2) Automatic group rooms.
    if (await this.isStaff(userId)) {
      // Staff roles can view & participate in EVERY group chat room.
      const groupRooms = await this.roomRepo.find({
        where: { type: ChatRoomType.GROUP },
        relations: ['group'],
      });
      for (const r of groupRooms) rooms.set(r.id, r);
    } else {
      const groupIds = await this.findEligibleGroupIds(userId);
      for (const gid of groupIds) {
        const room = await this.ensureGroupChatRoom(gid); // creates the room if the group has none yet
        await this.autoJoinEligibleUser(room, userId);    // seamless self-provisioning
        rooms.set(room.id, room);
      }
    }

    return [...rooms.values()];
  }

 async getRoom(roomId: string, userId: string) {
    // 1. التحقق من وجود العضوية مسبقاً
    let membership = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });

    // 2. إذا لم يكن عضواً، نحاول إتمامه تلقائياً (Auto-provision / Join) إذا كان مؤهلاً
    if (!membership) {
      try {
        await this.joinRoom(roomId, userId);
      } catch {
        // إذا لم يكن مؤهلاً للدخول، سيتم تجاهل الخطأ هنا ليتم التعامل معه عبر فحص العضوية أدناه
      }
    }

    // 3. جلب العضوية مع العلاقات المطلوبة
    membership = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId },
      relations: ['room', 'room.members', 'room.members.user'],
    });

    if (!membership || membership.is_banned) {
      throw new ForbiddenException('Access denied');
    }

    return membership.room;
  }
  // ─── MESSAGES ───

  /**
   * SINGLE SOURCE OF TRUTH for message enforcement (SRS §6.4).
   *
   * Both the REST path (POST /chat/messages) and the WebSocket path
   * ('send_message') funnel through this method, and this method alone:
   *   1. membership + ban/mute checks  → BEFORE any scan, so a banned user
   *      can no longer spam the violations table (minor DoS vector closed)
   *   2. attachment URL validation
   *   3. contact-info scan             → exactly once per message
   *   4. violation logging + strike escalation on hit
   *
   * The gateway used to scan too; that duplicate has been removed so a
   * message can never be evaluated twice or produce two strikes.
   */
  async saveMessage(dto: SendMessageDto, senderId: string) {
    const membership = await this.memberRepo.findOne({
      where: { room_id: dto.room_id, user_id: senderId },
    });
    if (!membership || membership.is_banned) throw new ForbiddenException('You cannot send messages in this room');
    if (membership.is_muted && membership.muted_until && membership.muted_until > new Date()) {
      throw new ForbiddenException('You are muted in this room');
    }

    if (dto.file_url && !isInternalUploadUrl(dto.file_url)) {
      throw new BadRequestException('Attachments must be uploaded through the platform, not linked externally');
    }

    const scan = this.scanMessage(dto.body || '');
    if (scan?.violation) {
      // messageId is null: the message must never be persisted once a
      // violation fires, so no message row — and therefore no id — exists.
      await this.recordViolation(null, dto.room_id, senderId, scan.rule, dto.body || '', scan.action);
      throw new ForbiddenException(
        'Sharing personal contact info is not allowed. This attempt has been logged.',
      );
    }

    const message = this.messageRepo.create({
      ...dto,
      sender_id: senderId,
      type: dto.type || ChatMessageType.TEXT,
    });
    return this.messageRepo.save(message);
  }

  /**
   * Public accessor for the gateway (replaces the old
   * chatService['messageRepo'] bracket-notation access).
   */
  async getMessageWithSender(messageId: string) {
    return this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });
  }

  async getMessages(roomId: string, userId: string, offset = 0, limit = 50) {
    let membership = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId, is_banned: false },
    });
    if (!membership) {
      // Automatic group rooms: provision eligible users on first access.
      const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['group'] });
      if (room) await this.autoJoinEligibleUser(room, userId);
      membership = await this.memberRepo.findOne({
        where: { room_id: roomId, user_id: userId, is_banned: false },
      });
    }
    if (!membership) throw new ForbiddenException('Access denied');

    const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.trunc(offset) : 0;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(200, Math.trunc(limit)) : 50;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { room_id: roomId, deleted_at: null },
      order: { created_at: 'DESC' },
      skip: safeOffset,
      take: safeLimit,
      relations: ['sender', 'reply_to'],
    });

    membership.last_read_at = new Date();
    await this.memberRepo.save(membership);

    return { data: messages.reverse(), total };
  }

  /**
   * Public accessor used by the gateway's mark_read handler (replaces the
   * old chatService['memberRepo'] bracket-notation access).
   */
  async markAsRead(roomId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (!member) throw new NotFoundException('Not a member of this room');
    member.last_read_at = new Date();
    await this.memberRepo.save(member);
    return { success: true };
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

  // ─── MODERATION (manual) ───

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
        break;
    }

    return { success: true, action: dto.action, user_id: dto.user_id };
  }

  // ─── VIOLATIONS & STRIKES ───

  async recordViolation(
    messageId: string | null,
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

    await this.applyStrike(senderId, roomId, saved.id);
    return saved;
  }

  /**
   * @deprecated Kept so existing call sites keep working. New code should
   * call recordViolation() directly.
   */
  async logViolation(
    messageId: string | null,
    roomId: string,
    senderId: string,
    ruleMatched: string,
    originalMessage: string,
    actionTaken: ViolationAction,
    detectionMethod = 'text_regex',
  ) {
    return this.recordViolation(messageId, roomId, senderId, ruleMatched, originalMessage, actionTaken, detectionMethod);
  }

  private async applyStrike(userId: string, roomId: string, violationId: string) {
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
    await this.strikeRepo.save(strike);

    await this.enforceStrikeConsequence(userId, roomId, action, expiresAt);

    return strike;
  }

  private async enforceStrikeConsequence(
    userId: string,
    roomId: string,
    action: StrikeAction,
    muteExpiresAt: Date | null,
  ) {
    if (action !== StrikeAction.MUTE_24H && action !== StrikeAction.BAN_PERMANENT) return;

    let member = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (!member) {
      member = this.memberRepo.create({ room_id: roomId, user_id: userId, role: 'member' });
    }

    if (action === StrikeAction.MUTE_24H) {
      member.is_muted = true;
      member.muted_until = muteExpiresAt;
    } else if (action === StrikeAction.BAN_PERMANENT) {
      member.is_banned = true;
      member.banned_until = null;
      member.ban_reason = member.ban_reason || 'Automatic: 3rd contact-info-sharing strike (SRS §6.4)';
    }

    await this.memberRepo.save(member);
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

  // ─── AUDIT EXPORT (CHAT-BE-10) ───

  private async loadAuditRows(roomId: string): Promise<ChatAuditRow[]> {
    const messages = await this.messageRepo.find({
      where: { room_id: roomId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });

    return messages.map((m: any) => {
      const deleted = !!m.deleted_at;
      return {
        id: m.id,
        createdAt: m.created_at,
        senderId: m.sender_id,
        senderName: m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Unknown',
        type: m.type,
        deleted,
        editedCount: m.edited_count ?? 0,
        body: deleted ? 'This message was deleted' : (m.body ?? ''),
        fileUrl: deleted ? null : (m.file_url ?? null),
        fileName: deleted ? null : (m.file_name ?? null),
      };
    });
  }

  async exportRoomMessagesCsv(roomId: string): Promise<string> {
    const rows = await this.loadAuditRows(roomId);

    const header = [
      'id', 'created_at', 'sender_id', 'sender_name', 'type',
      'deleted', 'edited_count', 'body', 'file_url', 'file_name',
    ];

    const lines = [header, ...rows.map((r) => [
      r.id,
      r.createdAt.toISOString(),
      r.senderId,
      r.senderName,
      r.type,
      r.deleted ? 'yes' : 'no',
      r.editedCount,
      r.body,
      r.fileUrl ?? '',
      r.fileName ?? '',
    ])];

    return lines.map(toCsvLine).join('\n');
  }

  async exportRoomMessagesPdf(roomId: string): Promise<Buffer> {
    const rows = await this.loadAuditRows(roomId);
    return this.pdfService.renderChatAuditPdf(roomId, rows);
  }

  // ─── COMPLIANCE ENGINE (SRS §6.1–§6.3) ───

  scanMessage(body: string): { violation: boolean; rule: string; action: ViolationAction } | null {
    if (!body) return null;

    const { canonical, squashed } = normalizeChatMessage(body);
    const targets = [canonical, squashed];

    const rules: Array<{ name: string; pattern: RegExp; action: ViolationAction }> = [
      { name: 'phone_egyptian', pattern: /01[0125]\d{8}/, action: ViolationAction.BLOCKED },
      { name: 'phone_egyptian_intl', pattern: /(\+?20|0020)1[0125]\d{8}/, action: ViolationAction.BLOCKED },
      { name: 'phone_generic', pattern: /\d{10,15}/, action: ViolationAction.BLOCKED },
      { name: 'email', pattern: /[a-zA-Z0-9._%+\-\s]{3,}@[a-zA-Z0-9.\-_\s]+\.[a-zA-Z]{2,}/, action: ViolationAction.BLOCKED },
      { name: 'messenger_link', pattern: /(wa\.me\/|api\.whatsapp\.com|t\.me\/|m\.me\/|telegram\.org|signal\.me|viber\.com)/i, action: ViolationAction.BLOCKED },
      // تم تصحيح القاعدة لتشترط وجود اسم المنصة أو علامة واضحة لمنع التداخل مع جمل اللغة الإنجليزية الطبيعية
      { name: 'social_handle', pattern: /(?:facebook|instagram|twitter|telegram|snapchat|tiktok|insta)\s*[:@\-\s]+\s*@[a-zA-Z0-9._]{3,}|(?:ig|fb|tg|insta|snap)\s*:\s*@[a-zA-Z0-9._]{3,}/i, action: ViolationAction.WARNED },
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

  // ─── MEMBERSHIP (FIX: enrollment / room-access check + automatic group rooms) ───

  async joinRoom(roomId: string, userId: string) {
    const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['group'] });
    if (!room) throw new NotFoundException('Room not found');

    const exists = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (exists) {
      if (exists.is_banned) throw new ForbiddenException('You are banned from this room');
      return exists; // idempotent for current members
    }

    // Automatic group rooms: provision the requesting user seamlessly when
    // eligible (active group_student / enrollment, teacher, substitute, staff).
    await this.autoJoinEligibleUser(room, userId);

    let membership = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (membership) return membership;

    // Not seated by the lazy provisioner → check eligibility for a precise error.
    await this.assertCanJoinRoom(userId, room);
    membership = this.memberRepo.create({ room_id: roomId, user_id: userId, role: 'member' });
    return this.memberRepo.save(membership);
  }

  async leaveRoom(roomId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (!member) throw new NotFoundException('Not a member');
    await this.memberRepo.remove(member);
    return { success: true };
  }

  // ─── Group-room access helpers ───

  private async getUserRoleSlugs(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: userId },
      relations: ['role'],
    });
    return [...new Set(userRoles.map((ur) => ur.role?.slug).filter(Boolean))];
  }

  private async isStaff(userId: string): Promise<boolean> {
    const slugs = await this.getUserRoleSlugs(userId);
    return slugs.some((s) => this.STAFF_ROLE_SLUGS.includes(s));
  }

  /** Idempotent membership insert — existing rows (incl. bans/mutes/custom roles) are never touched. */
  private async upsertMember(
    roomId: string,
    userId: string,
    role: 'admin' | 'moderator' | 'member' | 'teacher',
  ): Promise<ChatRoomMember> {
    const existing = await this.memberRepo.findOne({ where: { room_id: roomId, user_id: userId } });
    if (existing) return existing;
    return this.memberRepo.save(this.memberRepo.create({ room_id: roomId, user_id: userId, role }));
  }

  /**
   * FIX: the previous implementation looked up the FIRST active row in
   * group_students / enrollments and compared THAT student to the caller —
   * so only one arbitrary student per group could ever join. These queries
   * filter by the requesting user's own student record.
   */
  private async isEligibleGroupParticipant(group: Group, userId: string): Promise<boolean> {
    // Teacher of the group (or its substitute)
    if (group.teacher_id === userId || group.substitute_teacher_id === userId) return true;

    // Enrolled via group_students (active)
    const groupStudent = await this.groupStudentRepo.findOne({
      where: { group_id: group.id, status: 'active', student: { user_id: userId } },
      relations: ['student'],
    });
    if (groupStudent?.student?.user_id === userId) return true;

    // Enrolled via enrollments (active — both casings, see syncGroupChatRoom)
    const enrollment = await this.enrollmentRepo.findOne({
      where: { group_id: group.id, status: In(['active', 'ACTIVE'] as any), student: { user_id: userId } },
      relations: ['student'],
    });
    return enrollment?.student?.user_id === userId;
  }

  private async canAccessRoom(userId: string, room: ChatRoom): Promise<boolean> {
    if (await this.isStaff(userId)) return true;
    if (!room.group_id) return false;
    const group = room.group ?? (await this.groupRepo.findOne({ where: { id: room.group_id } }));
    if (!group) return false;
    return this.isEligibleGroupParticipant(group, userId);
  }

  private async assertCanJoinRoom(userId: string, room: ChatRoom): Promise<void> {
    if (await this.canAccessRoom(userId, room)) return;
    if (room.group_id) throw new ForbiddenException('You are not enrolled in the group linked to this chat room');
    throw new ForbiddenException('You are not a member of this chat room');
  }

  /**
   * Seamless access: when a group-linked room exists and the caller is an
   * eligible participant (student via group_students/enrollments, teacher,
   * substitute, or staff), a membership row is created on first access —
   * no manual join step required.
   */
  private async autoJoinEligibleUser(room: ChatRoom, userId: string): Promise<ChatRoomMember | null> {
    if (!room.group_id) return null;
    const existing = await this.memberRepo.findOne({ where: { room_id: room.id, user_id: userId } });
    if (existing) return existing;
    if (!(await this.canAccessRoom(userId, room))) return null;
    const isTeacher =
      !!room.group && (room.group.teacher_id === userId || room.group.substitute_teacher_id === userId);
    return this.upsertMember(room.id, userId, isTeacher ? 'teacher' : 'member');
  }

  /** All groups the user participates in (teacher/substitute, ACTIVE group_student or enrollment). */
  private async findEligibleGroupIds(userId: string): Promise<string[]> {
    const ids = new Set<string>();

    const taught = await this.groupRepo.find({
      where: [{ teacher_id: userId }, { substitute_teacher_id: userId }],
    });
    for (const g of taught) ids.add(g.id);

    const groupStudents = await this.groupStudentRepo.find({
      where: { status: 'active', student: { user_id: userId } },
      relations: ['student'],
    });
    for (const gs of groupStudents) if (gs.group_id) ids.add(gs.group_id);

    const enrollments = await this.enrollmentRepo.find({
      where: { status: In(['active'] as any), student: { user_id: userId } },
      relations: ['student'],
    });
    for (const e of enrollments) if (e.group_id) ids.add(e.group_id);

    return [...ids];
  }
}