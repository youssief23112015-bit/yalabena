import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { TestQuestion } from '../../shared/entities/test-question.entity';
import { PlacementTestAnswer } from '../../shared/entities/placement-test-answer.entity';
import { QuestionType } from '../../common/enums/question-type.enum';
import { TestStatus } from '../../common/enums/test-status.enum';
import { SlotStatus } from '../../common/enums/slot-status.enum';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { User } from '../../shared/entities/user.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { LeadSource } from '../../common/enums/lead-source.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { AuthUser } from '../../common/utils/auth-user';
import { levelFromScorePercentage, isCefrLevel } from '../../common/utils/level.util';
import {
  applyPlacementResultToLead,
  upsertLeadForPlacement,
} from '../../common/utils/placement-lead.util';
import { SubmitWrittenDto } from './dto/submit-written.dto';
import { BookTestDto } from './dto/book-test.dto';
import { EvaluateTestDto } from './dto/evaluate-test.dto';
import { InstantPlacementBookingDto } from './dto/instant-placement-booking.dto';
import { TestSlotsService } from '../test-slots/test-slots.service';

type ScoredAnswer = {
  questionId: string;
  answer: unknown;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
};

@Injectable()
export class PlacementTestsService {
  private readonly logger = new Logger(PlacementTestsService.name);

  constructor(
    @InjectRepository(PlacementTest)
    private readonly repo: Repository<PlacementTest>,
    @InjectRepository(TestQuestion)
    private readonly questionRepo: Repository<TestQuestion>,
    @InjectRepository(PlacementTestAnswer)
    private readonly answerRepo: Repository<PlacementTestAnswer>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(TestSlot)
    private readonly slotRepo: Repository<TestSlot>,
    private readonly testSlotsService: TestSlotsService,
  ) {}

  async create(data: Record<string, any>): Promise<PlacementTest> {
    // 1. ربط الأسماء القادمة من الـ Frontend (CamelCase) بأسماء أعمدة قاعدة البيانات (Snake_case)
    if (data.leadId && !data.lead_id) {
      data.lead_id = data.leadId;
    }
    if (data.studentId && !data.student_id) {
      data.student_id = data.studentId;
    }
    if (data.slotId && !data.slot_id) {
      data.slot_id = data.slotId;
    }
    if (data.scheduled_date && !data.scheduled_at) {
      data.scheduled_at = data.scheduled_date;
    }

    // 2. جلب بيانات الـ Slot لاستكمال النواقص (examiner_id, scheduled_at)
    if (data.slot_id) {
      try {
        const slot = await this.testSlotsService.findOne(data.slot_id);
        if (slot) {
          if (!data.examiner_id && slot.examiner_id) {
            data.examiner_id = slot.examiner_id;
          }
          if (!data.scheduled_at && slot.date) {
            data.scheduled_at = slot.date;
          }
        }
      } catch {
        // في حال فشل جلب الـ slot
      }
    }

    // 3. التحقق من التزام القيد (chk_pt_target): إما lead_id أو student_id حصراً
    if ((!data.lead_id && !data.student_id) || (data.lead_id && data.student_id)) {
      throw new BadRequestException('Either lead_id or student_id must be provided, but not both.');
    }

    const test = this.repo.create(data as Partial<PlacementTest>);
    const saved = await this.repo.save(test);

    // Business Rule 2 — staff-created bookings advance the lead pipeline
    // (TEST_SCHEDULED) so sales/academic see the booking as well.
    if (saved.lead_id) {
      try {
        const lead = await this.leadRepo.findOne({ where: { id: saved.lead_id } });
        if (
          lead &&
          lead.status !== LeadStatus.ENROLLED &&
          lead.status !== LeadStatus.LOST &&
          lead.status !== LeadStatus.TEST_SCHEDULED
        ) {
          lead.status = LeadStatus.TEST_SCHEDULED;
          await this.leadRepo.save(lead);
        }
      } catch (err: any) {
        this.logger.warn(`Lead status sync failed for test ${saved.id}: ${err?.message ?? err}`);
      }
    }
    return saved;
  }

  async findAll(leadId?: string): Promise<PlacementTest[]> {
    const query = this.repo.createQueryBuilder('test')
      .leftJoinAndSelect('test.lead', 'lead')
      .leftJoinAndSelect('test.examiner', 'examiner');

    if (leadId) {
      query.andWhere('lead.id = :leadId', { leadId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<PlacementTest> {
    const test = await this.repo.findOne({
      where: { id },
      relations: ['lead', 'examiner'],
    });

    if (!test) {
      throw new NotFoundException(`Placement test with ID ${id} not found`);
    }

    return test;
  }

  async update(id: string, data: Partial<PlacementTest>): Promise<PlacementTest> {
    const test = await this.findOne(id);

    // The admin UI historically sends `assigned_level`/`scheduled_date` —
    // map them onto real columns (they were previously dropped silently).
    const payload: Record<string, unknown> = { ...data };
    const assigned = (data as any).assigned_level;
    if (!data.final_level && assigned) {
      payload.final_level = String(assigned);
      payload.override_reason = (data as any).override_reason ?? 'Set by examiner evaluation';
    }
    delete payload.assigned_level;
    if ((data as any).scheduled_date && !data.scheduled_at) {
      payload.scheduled_at = (data as any).scheduled_date;
    }
    delete payload.scheduled_date;

    if (
      payload.final_level !== undefined &&
      payload.final_level !== null &&
      payload.final_level !== '' &&
      !isCefrLevel(String(payload.final_level))
    ) {
      throw new BadRequestException(
        `Invalid CEFR level "${payload.final_level}" — expected one of A1, A2, B1, B2, C1, C2`,
      );
    }

    Object.assign(test, payload);

    // Derive the suggested level from the recorded degree (scoring matrix).
    const pct = this.combinedPercentage(test);
    if (pct !== null && !test.suggested_level) {
      const derived = levelFromScorePercentage(pct);
      if (derived) test.suggested_level = derived;
    }

    // Completing without an explicit level falls back to the derived one.
    const completed = String(test.status).toLowerCase() === 'completed';
    if (completed && !test.final_level) {
      test.final_level = test.suggested_level ?? null;
      if (!test.final_level) {
        throw new BadRequestException(
          'Cannot complete a placement test without a level — provide final_level or record the scores first',
        );
      }
    }

    const saved = await this.repo.save(test);

    // Business Rule 2: push the degree + evaluated level onto the Lead, and
    // onto Student.current_level when the test targets a registered student.
    const level = saved.final_level ?? saved.suggested_level ?? null;
    const hasScore =
      (saved.written_score !== null && saved.written_score !== undefined) ||
      (saved.oral_score !== null && saved.oral_score !== undefined);
    if (completed || hasScore) {
      await this.syncResultToLead(saved, {
        score: pct,
        level,
        phase: completed ? 'final' : 'written',
      });
    }
    if (completed && saved.student_id && saved.final_level) {
      await this.syncStudentLevel(saved.student_id, saved.final_level);
    }
    return saved;
  }

  /**
   * Examiner evaluation (checklist: PATCH /placement-tests/:id/evaluate).
   * Defaults to COMPLETED so the standard grading action finalizes the test,
   * derives any missing level from the score matrix, and syncs Lead/Student.
   */
  async evaluate(id: string, dto: EvaluateTestDto): Promise<PlacementTest> {
    const patch: Record<string, unknown> = {};
    if (dto.written_score !== undefined) patch.written_score = dto.written_score;
    if (dto.oral_score !== undefined) patch.oral_score = dto.oral_score;
    if (dto.final_level !== undefined) patch.final_level = dto.final_level;
    if (dto.examiner_notes !== undefined) patch.examiner_notes = dto.examiner_notes;
    patch.status = (dto.status as TestStatus) ?? TestStatus.COMPLETED;
    return this.update(id, patch as Partial<PlacementTest>);
  }

  /**
   * Authenticated student self-booking (POST /placement-tests/book).
   * Reserves a seat, schedules the test at the slot start, upserts the
   * Lead pipeline record by the account's phone/email (Business Rule 2),
   * and keeps the test target on student_id (chk_pt_target).
   */
  async bookForStudent(user: AuthUser, dto: BookTestDto) {
    const student = await this.studentRepo.findOne({
      where: { user_id: user?.id ?? user?.userId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student profile not found');
    if (String(student.status).toLowerCase() !== 'active') {
      throw new BadRequestException('Student profile is not active');
    }

    const slot = await this.testSlotsService.findOne(dto.slot_id);
    if (slot.status !== SlotStatus.OPEN) {
      throw new BadRequestException('This slot is no longer open');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (String(slot.date).slice(0, 10) < today) {
      throw new BadRequestException('This slot is in the past');
    }
    if (slot.booked_count >= slot.capacity) {
      throw new ConflictException('This slot is fully booked');
    }

    const active = await this.repo.findOne({
      where: {
        student_id: student.id,
        status: In([TestStatus.SCHEDULED, TestStatus.IN_PROGRESS]),
      },
    });
    if (active) {
      throw new ConflictException('You already have an active placement test');
    }

    // Business Rule 2 — the booking advances/creates the Lead pipeline
    // record (deduped by the account's phone OR email).
    const contact = student.user;
    if (contact?.phone || contact?.email) {
      await upsertLeadForPlacement(this.leadRepo as any, {
        first_name: contact.first_name ?? 'Student',
        last_name: contact.last_name ?? '',
        phone: contact.phone,
        email: contact.email,
        level_interest: student.current_level,
        source: LeadSource.WEBSITE,
      });
    }

    const scheduledAt = new Date(`${slot.date}T${slot.start_time}`);
    const test = await this.repo.save(
      this.repo.create({
        student_id: student.id,
        slot_id: slot.id,
        examiner_id: slot.examiner_id,
        scheduled_at: scheduledAt,
        status: TestStatus.SCHEDULED,
      }),
    );

    // Reserve the seat (mirrors the public booking flow; matches the
    // pre-insert snapshot the DB trigger also bumps).
    slot.booked_count += 1;
    if (slot.booked_count >= slot.capacity) slot.status = SlotStatus.FULL;
    await this.slotRepo.save(slot);

    return this.findOne(test.id);
  }

  /** The logged-in student's own tests: schedule + scores + result level. */
  async findMy(user: AuthUser): Promise<PlacementTest[]> {
    const student = await this.studentRepo.findOne({
      where: { user_id: user?.id ?? user?.userId },
    });
    if (!student) return [];
    return this.repo.find({
      where: { student_id: student.id },
      relations: ['slot', 'slot.examiner', 'examiner'],
      order: { scheduled_at: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC ONBOARDING — instant guest placement flow (no login required)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Path A — "Take Instant Online Test Now" (POST /public/placement-bookings/instant).
   * Upserts the Lead (deduped by phone/email → status TEST_SCHEDULED), then
   * resumes the guest's still-open session or creates a lead-only
   * PlacementTest (no slot/examiner) and returns its id for a password-free
   * redirect to /placement-test?testId={testId}.
   */
  async bookInstant(
    dto: InstantPlacementBookingDto,
  ): Promise<{ success: true; testId: string; leadId: string }> {
    const parts = dto.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || firstName;

    const lead = await upsertLeadForPlacement(this.leadRepo as any, {
      first_name: firstName,
      last_name: lastName,
      phone: dto.phone,
      email: dto.email,
      level_interest: dto.level_interest,
      source: LeadSource.WEBSITE,
    });

    // Frictionless resume: an open session (not yet submitted) is reused
    // instead of stacking duplicate tests for the same guest.
    const active = await this.repo.findOne({
      where: { lead_id: lead.id, status: In([TestStatus.SCHEDULED, TestStatus.IN_PROGRESS]) },
      order: { created_at: 'DESC' },
    });
    if (active) {
      return { success: true, testId: active.id, leadId: lead.id };
    }

    const test = await this.create({
      lead_id: lead.id,
      scheduled_at: new Date(),
      status: TestStatus.SCHEDULED,
    });
    return { success: true, testId: test.id, leadId: lead.id };
  }

  /**
   * A guest-usable session: lead-targeted AND never a registered student's
   * test (student sessions must go through the ownership-checked routes).
   */
  private async assertGuestSession(id: string): Promise<PlacementTest> {
    const test = await this.findOne(id);
    if (!test.lead_id || test.student_id) {
      throw new ForbiddenException('This placement test link is not valid');
    }
    return test;
  }

  /**
   * GET /public/placement-tests/:id — validates the testId capability link
   * and returns the (already known to the guest) session + result so the
   * page can short-circuit straight to the completion screen on a reload.
   */
  async getGuestSession(id: string) {
    const test = await this.assertGuestSession(id);
    const completed = String(test.status).toLowerCase() === TestStatus.COMPLETED;
    const maxScore = Number(test.written_max) || 100;
    const score = Number(test.written_score ?? 0);
    return {
      testId: test.id,
      status: test.status,
      completed,
      first_name: test.lead?.first_name ?? null,
      result: completed
        ? {
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            level: test.final_level ?? test.suggested_level ?? null,
          }
        : null,
    };
  }

  /** POST /public/placement-tests/:id/paper — the player's question paper. */
  async getGuestPaper(
    id: string,
    body: { level?: string; count?: number; categories?: string[]; seed?: number },
  ) {
    await this.assertGuestSession(id);
    // No user context → assertCanAccessTest early-returns; possession of the
    // unguessable testId is the authorization.
    return this.generateWrittenPaper(id, {
      level: body?.level ?? 'A1',
      count: body?.count,
      categories: body?.categories,
      seed: body?.seed,
    });
  }

  /**
   * POST /public/placement-tests/:id/submit — auto-scores the session and
   * finalizes BOTH the test (COMPLETED) and the Lead (score + CEFR level +
   * status TEST_COMPLETED via the 'final' phase sync).
   */
  async submitGuest(id: string, dto: SubmitWrittenDto) {
    await this.assertGuestSession(id);
    return this.submitWritten(id, dto, undefined, {
      leadPhase: 'final',
      completeTest: true,
    });
  }

  /**
   * Students may only take THEIR OWN tests (paper generation + submission).
   * Staff roles keep unrestricted access; callers without a user context
   * (legacy internal calls) are unaffected.
   */
  private async assertCanAccessTest(testId: string, user?: AuthUser): Promise<void> {
    if (!user) return;
    const roles = (user.roles ?? []).map((r) => String(r).toLowerCase());
    const isStaff = roles.some((r) =>
      ['super_admin', 'admin', 'academic', 'teacher'].includes(r),
    );
    if (isStaff) return;

    const test = await this.repo.findOne({ where: { id: testId } });
    if (!test) throw new NotFoundException(`Placement test with ID ${testId} not found`);
    const student = await this.studentRepo.findOne({
      where: { user_id: user?.id ?? user?.userId },
    });
    if (!student || test.student_id !== student.id) {
      throw new ForbiddenException('You can only take your own placement test');
    }
  }

  /** Combined written/oral degree as a 0–100 percentage, or null. */
  private combinedPercentage(test: PlacementTest): number | null {
    const wMax = Number(test.written_max) || 100;
    const oMax = Number(test.oral_max) || 100;
    const w =
      test.written_score !== null && test.written_score !== undefined
        ? (Number(test.written_score) / wMax) * 100
        : null;
    const o =
      test.oral_score !== null && test.oral_score !== undefined
        ? (Number(test.oral_score) / oMax) * 100
        : null;
    if (w !== null && o !== null) return Math.round((w + o) / 2);
    if (w !== null) return Math.round(w);
    if (o !== null) return Math.round(o);
    return null;
  }

  /**
   * Sync a placement result onto the matching Lead (Business Rule 2).
   * Lead-linked tests update that lead directly; student-linked tests
   * resolve the lead by the account's phone/email, creating it when absent.
   * Failures are logged and never break grading.
   */
  private async syncResultToLead(
    test: PlacementTest,
    patch: { score?: number | null; level?: string | null; phase: 'written' | 'final' },
  ): Promise<void> {
    try {
      let lead: Lead | null = null;
      if (test.lead_id) {
        lead = await this.leadRepo.findOne({ where: { id: test.lead_id } });
      } else if (test.student_id) {
        const student = await this.studentRepo.findOne({
          where: { id: test.student_id },
          relations: ['user'],
        });
        const u = student?.user;
        if (u?.phone || u?.email) {
          lead = await upsertLeadForPlacement(this.leadRepo as any, {
            first_name: u.first_name ?? 'Student',
            last_name: u.last_name ?? '',
            phone: u.phone,
            email: u.email,
            level_interest: patch.level ?? student?.current_level,
            source: LeadSource.WEBSITE,
          });
        }
      }
      if (!lead) return;
      applyPlacementResultToLead(lead, patch);
      await this.leadRepo.save(lead);
    } catch (err: any) {
      this.logger.warn(
        `Lead sync failed for placement test ${test.id}: ${err?.message ?? err}`,
      );
    }
  }

  /** Mirror the evaluated CEFR level onto Student.current_level. */
  private async syncStudentLevel(studentId: string, level: string): Promise<void> {
    if (!isCefrLevel(level)) return;
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student || student.current_level === level) return;
    await this.studentRepo.save({ ...student, current_level: level });
  }


  async generateWrittenPaper(
    testId: string,
    opts: { level: string; count?: number; categories?: string[]; seed?: number } = { level: '' },
    user?: AuthUser,
  ): Promise<{ testId: string; totalPoints: number; questions: Array<{ id: string; type: QuestionType; question_text: string; options: unknown; points: number }> }> {
    await this.assertCanAccessTest(testId, user);
    const test = await this.findOne(testId);

    if (test.status === TestStatus.COMPLETED) {
      throw new BadRequestException('Cannot generate a paper for a completed test');
    }

    const count = Math.max(1, Math.min(opts.count ?? 40, 200));
    const qb = this.questionRepo.createQueryBuilder('q')
      .where('q.is_active = :active', { active: true })
      .andWhere('q.level = :level', { level: opts.level });

    if (opts.categories?.length) {
      qb.andWhere('q.category IN (:...categories)', { categories: opts.categories });
    }

    const bank = await qb.orderBy('RANDOM()').limit(count).getMany();
    if (!bank.length) {
      throw new BadRequestException(`No active questions found for level ${opts.level}`);
    }

    const questions = this.shuffle(bank, opts.seed).map((q) => ({
      id: q.id,
      type: q.type,
      question_text: q.question_text,
      options: q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE || q.type === QuestionType.MATCHING || q.type === QuestionType.ORDERING ? q.options : undefined,
      points: q.points,
    }));

    return {
      testId: test.id,
      totalPoints: bank.reduce((sum, q) => sum + q.points, 0),
      questions,
    };
  }

  async submitWritten(
    testId: string,
    dto: SubmitWrittenDto,
    user?: AuthUser,
    opts?: {
      /** Lead pipeline phase for the result sync (default: 'written' → INTERESTED). */
      leadPhase?: 'written' | 'final';
      /** Single-session guest tests: finalize the test itself (default: false → awaiting oral). */
      completeTest?: boolean;
    },
  ) {
    await this.assertCanAccessTest(testId, user);
    const test = await this.findOne(testId);

    if (test.status === TestStatus.COMPLETED) {
      throw new BadRequestException('Test is already completed');
    }

    const answersByQuestion = new Map<string, { question_id: string; answer: unknown }>();
    for (const item of dto.answers ?? []) {
      answersByQuestion.set(item.question_id, item);
    }
    const items = Array.from(answersByQuestion.values());

    if (items.length === 0) {
      throw new BadRequestException('At least one answer is required');
    }

    const questions = await this.questionRepo.find({
      where: { id: In(items.map((a) => a.question_id)) },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    const unknownIds = items
      .map((a) => a.question_id)
      .filter((id) => !byId.has(id));
    if (unknownIds.length > 0) {
      throw new BadRequestException(`Unknown question(s): ${unknownIds.join(', ')}`);
    }

    let earned = 0;
    let possible = 0;
    const results: ScoredAnswer[] = [];

    for (const item of items) {
      const question = byId.get(item.question_id) as TestQuestion;
      const points = Number(question.points) || 0;

      possible += points;
      const { isCorrect, score } = this.scoreQuestion(question, item.answer);
      earned += score;

      results.push({
        questionId: question.id,
        answer: item.answer,
        isCorrect,
        score,
        maxScore: points,
      });
    }

    const scale = Number(test.written_max) || 100;
    const writtenScore =
      possible > 0
        ? Math.min(scale, Math.max(0, Math.round((earned / possible) * scale * 100) / 100))
        : 0;
    const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0;

    // Derive the recommended CEFR level from the degree (scoring matrix) and
    // persist it: suggested = derived, final = examiner-overridable fallback.
    const suggestedLevel = test.suggested_level ?? levelFromScorePercentage(percentage);
    const finalLevel = test.final_level ?? suggestedLevel ?? null;
    // Guest single-session tests finish on written submission; staff tests
    // keep waiting for the examiner's oral assessment (IN_PROGRESS).
    const nextStatus = opts?.completeTest ? TestStatus.COMPLETED : TestStatus.IN_PROGRESS;

    await this.repo.manager.transaction(async (manager) => {
      await manager.delete(PlacementTestAnswer, { test_id: testId });

      const rows = results.map((r) =>
        manager.create(PlacementTestAnswer, {
          test_id: testId,
          question_id: r.questionId,
          answer: r.answer,
          score: r.score,
          is_correct: r.isCorrect,
        }),
      );
      await manager.save(PlacementTestAnswer, rows);

      await manager.update(
        PlacementTest,
        { id: testId },
        {
          written_score: writtenScore,
          status: nextStatus,
          ...(suggestedLevel ? { suggested_level: suggestedLevel } : {}),
          ...(finalLevel ? { final_level: finalLevel } : {}),
        },
      );
    });

    // Reflect the persisted values for the syncs below + the response.
    test.written_score = writtenScore;
    test.status = nextStatus;
    if (suggestedLevel) test.suggested_level = suggestedLevel;
    if (finalLevel) test.final_level = finalLevel;

    // Business Rule 2 — written auto-score results flow to the Lead
    // ('written' → INTERESTED; guest 'final' → TEST_COMPLETED) and onto
    // Student.current_level.
    await this.syncResultToLead(test, {
      score: percentage,
      level: finalLevel,
      phase: opts?.leadPhase ?? 'written',
    });
    if (test.student_id && finalLevel) {
      await this.syncStudentLevel(test.student_id, finalLevel);
    }

    return {
      testId: test.id,
      writtenScore,
      writtenMax: scale,
      earnedPoints: earned,
      possiblePoints: possible,
      percentage,
      results,
      // The player's result card reads level ?? suggested_level ?? final_level.
      level: finalLevel,
      suggested_level: suggestedLevel,
      final_level: finalLevel,
    };
  }

  private isBlank(value: unknown): boolean {
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    );
  }

  private toBool(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (['true', 't', 'yes', 'y', '1'].includes(v)) return true;
      if (['false', 'f', 'no', 'n', '0'].includes(v)) return false;
    }
    return null;
  }

  private scoreQuestion(question: TestQuestion, answer: unknown): { isCorrect: boolean | null; score: number } {
    const pts = Number(question.points) || 0;
    const correct = question.correct_answer;

    if (question.type === QuestionType.SHORT_ANSWER) {
      return { isCorrect: null, score: 0 };
    }

    if (this.isBlank(answer)) {
      return { isCorrect: false, score: 0 };
    }

    switch (question.type) {
      case QuestionType.MCQ: {
        const ok = String(answer).trim().toLowerCase() === String(correct).trim().toLowerCase();
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.TRUE_FALSE: {
        const given = this.toBool(answer);
        const expected = this.toBool(correct);
        const ok = given !== null && expected !== null && given === expected;
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.FILL_BLANK: {
        const norm = (v: unknown) => String(v).trim().toLowerCase().replace(/\s+/g, ' ');
        const accepted: string[] = Array.isArray(correct) ? correct.map(String) : [String(correct)];
        const ok = accepted.some((c) => norm(c) === norm(answer));
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.MATCHING: {
        const ok = this.shallowEqual(correct, answer);
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.ORDERING: {
        const ok = Array.isArray(correct) && Array.isArray(answer)
          && correct.length === answer.length
          && correct.every((v, i) => String(v) === String((answer as unknown[])[i]));
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      default:
        return { isCorrect: null, score: 0 };
    }
  }

  private shallowEqual(a: unknown, b: unknown): boolean {
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return String(a) === String(b);
    }
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    return ka.length === kb.length && ka.every((k) => String((a as Record<string, unknown>)[k]) === String((b as Record<string, unknown>)[k]));
  }

  private shuffle<T>(arr: T[], seed?: number): T[] {
    const out = [...arr];
    let s = (seed ?? Date.now()) | 0 || 1;
    const rand = () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) / 0xffffffff);
    };
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}