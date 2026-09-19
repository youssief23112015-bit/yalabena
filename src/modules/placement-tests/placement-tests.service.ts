import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { TestQuestion } from '../../shared/entities/test-question.entity';
import { PlacementTestAnswer } from '../../shared/entities/placement-test-answer.entity';
import { QuestionType } from '../../common/enums/question-type.enum';
import { TestStatus } from '../../common/enums/test-status.enum';
import { SubmitWrittenDto } from './dto/submit-written.dto';

type ScoredAnswer = {
  questionId: string;
  answer: unknown;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
};

@Injectable()
export class PlacementTestsService {
  constructor(
    @InjectRepository(PlacementTest)
    private readonly repo: Repository<PlacementTest>,
    @InjectRepository(TestQuestion)
    private readonly questionRepo: Repository<TestQuestion>,
    @InjectRepository(PlacementTestAnswer)
    private readonly answerRepo: Repository<PlacementTestAnswer>,
  ) {}

  async create(data: Partial<PlacementTest>): Promise<PlacementTest> {
    const test = this.repo.create(data);
    return this.repo.save(test);
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
    Object.assign(test, data);
    return this.repo.save(test);
  }

  /**
   * Builds a randomized written-test paper for a placement test.
   * Questions are drawn from the bank by level, optionally filtered by
   * category, then shuffled (Fisher-Yates) and capped at `count`.
   * Correct answers are NEVER returned to the client.
   */
  async generateWrittenPaper(
    testId: string,
    opts: { level: string; count?: number; categories?: string[]; seed?: number } = { level: '' },
  ): Promise<{ testId: string; totalPoints: number; questions: Array<{ id: string; type: QuestionType; question_text: string; options: unknown; points: number }> }> {
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

  /**
   * Auto-scores a written submission. Objective types (MCQ, TRUE_FALSE,
   * FILL_BLANK, MATCHING, ORDERING) are graded automatically; SHORT_ANSWER
   * is stored with score 0 and is_correct = null for manual grading.
   *
   * Idempotent per test: all previously stored answers for the test are
   * replaced, and the delete + insert + score update run in ONE transaction,
   * so a failure can never leave partial rows behind.
   */
  async submitWritten(testId: string, dto: SubmitWrittenDto) {
    const test = await this.findOne(testId);

    if (test.status === TestStatus.COMPLETED) {
      throw new BadRequestException('Test is already completed');
    }

    // Dedupe by question_id (last value wins) so the unique index
    // (test_id, question_id) can never be tripped by the payload itself.
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

    // Scale to the test's written_max (defaults to 100) and clamp so the
    // CHECK (written_score <= written_max) constraint can never fail.
    const scale = Number(test.written_max) || 100;
    const writtenScore =
      possible > 0
        ? Math.min(scale, Math.max(0, Math.round((earned / possible) * scale * 100) / 100))
        : 0;

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
        { written_score: writtenScore, status: TestStatus.IN_PROGRESS },
      );
    });

    return {
      testId: test.id,
      writtenScore,
      writtenMax: scale,
      earnedPoints: earned,
      possiblePoints: possible,
      percentage: possible > 0 ? Math.round((earned / possible) * 100) : 0,
      results,
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

    // Short answers are always graded manually, even when blank.
    if (question.type === QuestionType.SHORT_ANSWER) {
      return { isCorrect: null, score: 0 };
    }

    // An unanswered objective question is simply wrong.
    if (this.isBlank(answer)) {
      return { isCorrect: false, score: 0 };
    }

    switch (question.type) {
      case QuestionType.MCQ: {
        const ok = String(answer).trim().toLowerCase() === String(correct).trim().toLowerCase();
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.TRUE_FALSE: {
        // Frontend sends "true"/"false" strings; Boolean("false") would be true.
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
        // correct_answer: { "leftId": "rightId", ... } ; answer: same shape
        const ok = this.shallowEqual(correct, answer);
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      case QuestionType.ORDERING: {
        // correct_answer: ["a","b","c"] ; answer: submitted array
        const ok = Array.isArray(correct) && Array.isArray(answer)
          && correct.length === answer.length
          && correct.every((v, i) => String(v) === String((answer as unknown[])[i]));
        return { isCorrect: ok, score: ok ? pts : 0 };
      }
      default:
        // Unknown type: manual grading required.
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
    // xorshift32 gets stuck at 0, so never start from 0.
    let s = (seed ?? Date.now()) | 0 || 1;
    const rand = () => {
      // xorshift32 — deterministic when seed is provided
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