import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { Course } from '../../shared/entities/course.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { FinanceService } from '../finance/finance.service';
import { ChatService } from '../chat/chat.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn((x: any) => Promise.resolve({ ...x })),
  create: jest.fn((x: any) => ({ ...x })),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn(),
});

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollRepo: ReturnType<typeof mockRepo>;
  let studentRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;
  let courseRepo: ReturnType<typeof mockRepo>;
  let finance: { hasInvoiceForEnrollment: jest.Mock; createInvoiceForEnrollment: jest.Mock };
  let chat: { syncGroupChatRoom: jest.Mock };
  let savedEnrollment: any = null;

  const admin = { id: 'admin-1', roles: ['branch_manager'], branchId: 'br-1' };
  const studentAuth = { id: 'user-1', roles: ['student'] };

  const student = {
    id: 'stu-1',
    user_id: 'user-1',
    current_level: 'B1',
    status: 'active',
    branch_id: 'br-1',
  };

  const group = {
    id: 'grp-1',
    name: 'B1 Morning',
    course_id: 'crs-1',
    branch_id: 'br-1',
    capacity: 10,
    status: 'upcoming',
    course: { id: 'crs-1', name: 'B1 Complete', level: 'B1', default_price: 1000 },
  };

  const course = { id: 'crs-1', name: 'B1 Complete', level: 'B1', default_price: 1000 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useFactory: mockRepo },
        { provide: getRepositoryToken(Student), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(Course), useFactory: mockRepo },
        {
          provide: FinanceService,
          useValue: {
            hasInvoiceForEnrollment: jest.fn().mockResolvedValue(false),
            createInvoiceForEnrollment: jest.fn().mockResolvedValue({
              discount_amount: 0,
              total_amount: 1000,
            }),
          },
        },
        {
          provide: ChatService,
          useValue: { syncGroupChatRoom: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(EnrollmentsService);
    enrollRepo = module.get(getRepositoryToken(Enrollment));
    studentRepo = module.get(getRepositoryToken(Student));
    groupRepo = module.get(getRepositoryToken(Group));
    courseRepo = module.get(getRepositoryToken(Course));
    finance = module.get(FinanceService);
    chat = module.get(ChatService);

    studentRepo.findOne.mockResolvedValue({ ...student });
    courseRepo.findOne.mockResolvedValue({ ...course });
    groupRepo.find.mockResolvedValue([{ ...group }]);
    groupRepo.findOne.mockResolvedValue({ ...group });
    enrollRepo.count.mockResolvedValue(0);
    // dup-check lookups (no id) return null; :id lookups return the saved row
    enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
      where?.id
        ? { ...(savedEnrollment ?? {}), id: where.id, student: { ...student }, group }
        : null,
    );
    enrollRepo.save.mockImplementation(async (e: any) => {
      savedEnrollment = { ...e, id: e.id ?? 'enr-1' };
      return savedEnrollment;
    });
  });

  afterEach(() => {
    savedEnrollment = null;
    jest.clearAllMocks();
  });

  describe('bookCourse — level eligibility (Business Rule 1)', () => {
    it('allows booking the SAME level and creates a PENDING request', async () => {
      const result = await service.bookCourse(studentAuth, { course_id: 'crs-1' });
      expect(result.status).toBe(EnrollmentStatus.PENDING);
      expect(enrollRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: EnrollmentStatus.PENDING }),
      );
      expect(finance.createInvoiceForEnrollment).not.toHaveBeenCalled();
    });

    it('allows booking ONE level below (B1 student -> A2 course)', async () => {
      courseRepo.findOne.mockResolvedValue({ ...course, level: 'A2' });
      const result = await service.bookCourse(studentAuth, { course_id: 'crs-1' });
      expect(result.status).toBe(EnrollmentStatus.PENDING);
    });

    it('BLOCKS booking ABOVE the student level (B1 -> B2) with 400', async () => {
      courseRepo.findOne.mockResolvedValue({ ...course, level: 'B2' });
      await expect(service.bookCourse(studentAuth, { course_id: 'crs-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(enrollRepo.save).not.toHaveBeenCalled();
    });

    it('BLOCKS booking MORE than one level below (B1 -> A1) with 400', async () => {
      courseRepo.findOne.mockResolvedValue({ ...course, level: 'A1' });
      await expect(service.bookCourse(studentAuth, { course_id: 'crs-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(enrollRepo.save).not.toHaveBeenCalled();
    });

    it('skips the check when the student has no assigned level', async () => {
      studentRepo.findOne.mockResolvedValue({ ...student, current_level: null });
      const result = await service.bookCourse(studentAuth, { course_id: 'crs-1' });
      expect(result.status).toBe(EnrollmentStatus.PENDING);
    });
  });

  describe('bookCourse — workflow guards', () => {
    it('404s when the student has no profile', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.bookCourse(studentAuth, { course_id: 'crs-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('400s on duplicate pending/active requests for the group', async () => {
      enrollRepo.findOne.mockResolvedValue({ id: 'enr-x', status: EnrollmentStatus.PENDING });
      await expect(service.bookCourse(studentAuth, { course_id: 'crs-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('400s when no group has free capacity', async () => {
      enrollRepo.count.mockResolvedValue(10);
      await expect(service.bookCourse(studentAuth, { course_id: 'crs-1' })).rejects.toThrow(
        /full|capacity/i,
      );
    });
  });

  describe('approve (Business Rule 2)', () => {
    const pendingEnrollment = () => ({
      id: 'enr-1',
      student_id: 'stu-1',
      group_id: 'grp-1',
      status: EnrollmentStatus.PENDING,
      total_fee: 1000,
      final_amount: 1000,
      student: { ...student },
      group,
    });

    it('PENDING -> ACTIVE and triggers the invoice workflow exactly once', async () => {
      const row: any = pendingEnrollment();
      enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 'enr-1' ? row : null,
      );

      const result = await service.approve('enr-1', admin);
      expect(result.status).toBe(EnrollmentStatus.ACTIVE);
      expect(finance.createInvoiceForEnrollment).toHaveBeenCalledTimes(1);
      expect(chat.syncGroupChatRoom).toHaveBeenCalledWith('grp-1');
    });

    it('is idempotent — re-approving ACTIVE does not re-invoice', async () => {
      const row: any = { ...pendingEnrollment(), status: EnrollmentStatus.ACTIVE };
      enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 'enr-1' ? row : null,
      );

      const result = await service.approve('enr-1', admin);
      expect(result.status).toBe(EnrollmentStatus.ACTIVE);
      expect(finance.createInvoiceForEnrollment).not.toHaveBeenCalled();
    });

    it('skips invoicing when the enrollment was already invoiced', async () => {
      enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 'enr-1' ? pendingEnrollment() : null,
      );
      finance.hasInvoiceForEnrollment.mockResolvedValue(true);

      await service.approve('enr-1', admin);
      expect(finance.createInvoiceForEnrollment).not.toHaveBeenCalled();
    });

    it('blocks approval when the group is full', async () => {
      enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 'enr-1' ? pendingEnrollment() : null,
      );
      enrollRepo.count.mockResolvedValue(10);

      await expect(service.approve('enr-1', admin)).rejects.toThrow(BadRequestException);
    });

    it('blocks approving non-pending enrollments', async () => {
      enrollRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 'enr-1'
          ? { ...pendingEnrollment(), status: EnrollmentStatus.DROPPED }
          : null,
      );
      await expect(service.approve('enr-1', admin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('moves PENDING -> DROPPED and keeps the reason', async () => {
      enrollRepo.findOne.mockResolvedValue({
        id: 'enr-1',
        status: EnrollmentStatus.PENDING,
        student: { ...student },
        group,
      });

      const result = await service.reject('enr-1', 'level too low for this group', admin);
      expect(result.status).toBe(EnrollmentStatus.DROPPED);
      expect(result.drop_reason).toBe('level too low for this group');
      expect(result.dropped_at).toBeInstanceOf(Date);
    });

    it('blocks rejecting non-pending enrollments', async () => {
      enrollRepo.findOne.mockResolvedValue({
        id: 'enr-1',
        status: EnrollmentStatus.ACTIVE,
        student: { ...student },
        group,
      });
      await expect(service.reject('enr-1', undefined, admin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create — staff path honors the same level gate', () => {
    const chainable = () => {
      const qb: any = {
        innerJoin: jest.fn(() => qb),
        where: jest.fn(() => qb),
        andWhere: jest.fn(() => qb),
        getExists: jest.fn().mockResolvedValue(true),
      };
      return qb;
    };

    it('blocks enrolling a B1 student into a B2 group with 400', async () => {
      studentRepo.createQueryBuilder.mockReturnValue(chainable());
      groupRepo.findOne.mockResolvedValue({
        ...group,
        course: { ...group.course, level: 'B2' },
      });

      await expect(
        service.create({ student_id: 'stu-1', group_id: 'grp-1' } as any, admin),
      ).rejects.toThrow(BadRequestException);
      expect(enrollRepo.save).not.toHaveBeenCalled();
    });

    it('allows same-level enrollment and keeps the ACTIVE staff path', async () => {
      studentRepo.createQueryBuilder.mockReturnValue(chainable());

      const result = await service.create(
        { student_id: 'stu-1', group_id: 'grp-1' } as any,
        admin,
      );
      expect(result.status).toBe(EnrollmentStatus.ACTIVE);
      expect(finance.createInvoiceForEnrollment).toHaveBeenCalledTimes(1);
    });

    it('skips ONLY the capacity gate with opts.skipCapacityCheck (admin force)', async () => {
      studentRepo.createQueryBuilder.mockReturnValue(chainable());
      enrollRepo.count.mockResolvedValue(10); // group.capacity is 10 → full

      // Without the opt → capacity error
      await expect(
        service.create({ student_id: 'stu-1', group_id: 'grp-1' } as any, admin),
      ).rejects.toThrow(/full/i);

      // With the opt → enrollment goes through
      const result = await service.create(
        { student_id: 'stu-1', group_id: 'grp-1' } as any,
        admin,
        { skipCapacityCheck: true },
      );
      expect(result.status).toBe(EnrollmentStatus.ACTIVE);
      expect(enrollRepo.save).toHaveBeenCalled();
    });
  });
});
