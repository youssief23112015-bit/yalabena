import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { Lead } from '../../shared/entities/lead.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { LeadSource } from '../../common/enums/lead-source.enum';
import { SlotStatus } from '../../common/enums/slot-status.enum';
import { TestStatus } from '../../common/enums/test-status.enum';
import { TestimonialStatus } from '../../common/enums/testimonial-status.enum';
import { CourseStatus } from '../../common/enums/course-status.enum';

/** Chainable QueryBuilder stub resolving getOne()/getMany(). */
const qbStub = (one: any = null, many: any[] = []) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  setLock: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(one),
  getMany: jest.fn().mockResolvedValue(many),
  getManyAndCount: jest.fn().mockResolvedValue([many, many.length]),
});

const TOMORROW = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

describe('PublicService', () => {
  let service: PublicService;
  let blogRepo: any;
  let testimonialRepo: any;
  let pageViewRepo: any;
  let leadRepo: any;
  let courseRepo: any;
  let slotRepo: any;
  let testRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    blogRepo = { createQueryBuilder: jest.fn(() => qbStub()) };
    testimonialRepo = { find: jest.fn(async () => []) };
    pageViewRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'pv-1', ...x })),
    };
    leadRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'lead-1', ...x })),
      createQueryBuilder: jest.fn(() => qbStub(null)),
    };
    courseRepo = { createQueryBuilder: jest.fn(() => qbStub(null, [])) };
    slotRepo = { createQueryBuilder: jest.fn(() => qbStub(null, [])), manager: null };
    testRepo = {};
    service = new PublicService(
      blogRepo, testimonialRepo, pageViewRepo, leadRepo, courseRepo, slotRepo, testRepo,
    );
  });

  // ---------- course catalog ----------

  describe('listCourses', () => {
    it('returns only active courses', async () => {
      const qb = qbStub(null, [{ id: 'c1', status: CourseStatus.ACTIVE }]);
      courseRepo.createQueryBuilder.mockReturnValue(qb);
      const out = await service.listCourses();
      expect(qb.where).toHaveBeenCalledWith('course.status = :status', {
        status: CourseStatus.ACTIVE,
      });
      expect(out).toHaveLength(1);
    });

    it('applies level filter when provided', async () => {
      const qb = qbStub(null, []);
      courseRepo.createQueryBuilder.mockReturnValue(qb);
      await service.listCourses('A2');
      expect(qb.andWhere).toHaveBeenCalledWith('course.level = :level', { level: 'A2' });
    });
  });

  // ---------- testimonials ----------

  describe('listTestimonials', () => {
    it('returns approved testimonials only', async () => {
      await service.listTestimonials();
      expect(testimonialRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: TestimonialStatus.APPROVED } }),
      );
    });
  });

  // ---------- lead capture ----------

  describe('captureLead', () => {
    const dto = {
      first_name: 'Mona', last_name: 'Ali', phone: '01000000001', email: 'mona@x.com',
    } as any;

    it('creates a new lead with forced website source', async () => {
      leadRepo.createQueryBuilder.mockReturnValue(qbStub(null));
      const out = await service.captureLead(dto);
      expect(out).toEqual({ lead_id: 'lead-1', is_new: true });
      expect(leadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: LeadSource.WEBSITE, phone: dto.phone }),
      );
    });

    it('is idempotent: existing contact returns is_new=false without saving', async () => {
      leadRepo.createQueryBuilder.mockReturnValue(qbStub({ id: 'lead-9' }));
      const out = await service.captureLead(dto);
      expect(out).toEqual({ lead_id: 'lead-9', is_new: false });
      expect(leadRepo.save).not.toHaveBeenCalled();
    });
  });

  // ---------- page views ----------

  describe('trackPageView', () => {
    it('stores path with request ip and user agent', async () => {
      await service.trackPageView(
        { page_path: '/courses/a1', session_id: 's-1' } as any, '1.2.3.4', 'UA',
      );
      expect(pageViewRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          page_path: '/courses/a1', ip_address: '1.2.3.4', user_agent: 'UA',
        }),
      );
    });
  });

  // ---------- placement slots ----------

  describe('listPlacementSlots', () => {
    it('lists open future slots with remaining capacity and no examiner data', async () => {
      const qb = qbStub(null, [{
        id: 's-1', date: TOMORROW, start_time: '10:00', end_time: '11:00',
        mode: 'in_person', capacity: 4, booked_count: 1,
        branch: { id: 'b-1', name: 'Nasr City' },
        examiner_id: 'exam-1',
      }]);
      slotRepo.createQueryBuilder.mockReturnValue(qb);
      const out = await service.listPlacementSlots();
      expect(qb.where).toHaveBeenCalledWith('slot.status = :status', { status: SlotStatus.OPEN });
      expect(out[0]).toEqual(expect.objectContaining({ remaining_capacity: 3 }));
      expect(out[0]).not.toHaveProperty('examiner_id');
      expect(out[0].branch.name).toBe('Nasr City');
    });
  });

  // ---------- placement self-booking ----------

  describe('bookPlacementTest', () => {
    const dto = {
      slot_id: 's-1', first_name: 'Omar', last_name: 'Saad',
      phone: '01000000002', email: 'omar@x.com',
    } as any;

    const openSlot = {
      id: 's-1', branch_id: 'b-1', examiner_id: 'exam-1',
      date: TOMORROW, start_time: '10:00', end_time: '11:00',
      mode: 'in_person', capacity: 2, booked_count: 0, status: SlotStatus.OPEN,
    };

    /** Wire the transaction callback with per-entity repo mocks. */
    const wireTx = (slot: any, existingLead: any = null, activeTest: any = null) => {
      const emSlotRepo = {
        createQueryBuilder: jest.fn(() => qbStub(slot)),
        save: jest.fn(async (x: any) => x),
      };
      const emLeadRepo = {
        createQueryBuilder: jest.fn(() => qbStub(existingLead)),
        create: jest.fn((x: any) => x),
        save: jest.fn(async (x: any) => ({ id: 'lead-1', ...x })),
      };
      const emTestRepo = {
        createQueryBuilder: jest.fn(() => qbStub(activeTest)),
        create: jest.fn((x: any) => x),
        save: jest.fn(async (x: any) => ({ id: 'test-1', ...x })),
      };
      const em = {
        getRepository: jest.fn((entity: any) => {
          if (entity === TestSlot) return emSlotRepo;
          if (entity === Lead) return emLeadRepo;
          if (entity === PlacementTest) return emTestRepo;
          throw new Error('unexpected repo');
        }),
      };
      slotRepo.manager = { transaction: jest.fn(async (cb: any) => cb(em)) };
      return { emSlotRepo, emLeadRepo, emTestRepo };
    };

    it('books: creates lead, reserves seat, schedules at slot start', async () => {
      const { emSlotRepo, emTestRepo } = wireTx({ ...openSlot });
      const out = await service.bookPlacementTest(dto);

      expect(out.test_id).toBe('test-1');
      expect(out.lead_id).toBe('lead-1');
      expect(emTestRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        slot_id: 's-1',
        examiner_id: 'exam-1',
        status: TestStatus.SCHEDULED,
      }));
      expect(new Date(out.scheduled_at).getHours()).toBe(10);
      // seat reserved
      expect(emSlotRepo.save).toHaveBeenCalledWith(expect.objectContaining({ booked_count: 1 }));
    });

    it('marks the slot FULL when the last seat is taken', async () => {
      const { emSlotRepo } = wireTx({ ...openSlot, booked_count: 1, capacity: 2 });
      await service.bookPlacementTest(dto);
      expect(emSlotRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        booked_count: 2, status: SlotStatus.FULL,
      }));
    });

    it('reuses an existing lead instead of creating a duplicate', async () => {
      const { emLeadRepo } = wireTx({ ...openSlot }, { id: 'lead-7' });
      const out = await service.bookPlacementTest(dto);
      expect(out.lead_id).toBe('lead-7');
      expect(emLeadRepo.save).not.toHaveBeenCalled();
    });

    it('rejects booking when the lead already has an active test', async () => {
      wireTx({ ...openSlot }, { id: 'lead-7' }, { id: 'test-9' });
      await expect(service.bookPlacementTest(dto)).rejects.toThrow(ConflictException);
    });

    it('rejects a full slot', async () => {
      wireTx({ ...openSlot, booked_count: 2 });
      await expect(service.bookPlacementTest(dto)).rejects.toThrow(ConflictException);
    });

    it('rejects a past slot', async () => {
      wireTx({ ...openSlot, date: YESTERDAY });
      await expect(service.bookPlacementTest(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-open slot', async () => {
      wireTx({ ...openSlot, status: SlotStatus.CANCELLED });
      await expect(service.bookPlacementTest(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown slot', async () => {
      wireTx(null);
      await expect(service.bookPlacementTest(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
