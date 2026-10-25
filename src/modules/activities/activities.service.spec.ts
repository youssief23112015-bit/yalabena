import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivityStatus } from '../../common/enums/activity-status.enum';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';
import { ActivityEventType } from '../../common/enums/activity-event-type.enum';

/** Minimal chainable QueryBuilder stub for createQueryBuilder-based methods. */
const qbStub = (activities: any[] = []) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(activities),
  getRawMany: jest.fn().mockResolvedValue([]),
});

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityRepo: any;
  let regRepo: any;
  let photoRepo: any;
  let studentRepo: any;
  let groupStudentRepo: any;
  let finance: any;

  const admin = { id: 'user-1', userId: 'user-1', roles: ['super_admin'], branchId: null };
  const manager = {
    id: 'user-2',
    userId: 'user-2',
    roles: ['branch_manager'],
    branchId: 'branch-1',
  };

  const baseActivity = {
    id: 'act-1',
    title: 'Movie Night',
    branch_id: 'branch-1',
    capacity: 2,
    fee: 100,
    status: ActivityStatus.UPCOMING,
    is_open_to_all: false,
    target_levels: ['B1'],
    target_groups: [],
    registrations: [],
    photos: [],
  };

  const student = {
    id: 'stu-1',
    user_id: 'user-9',
    student_number: 'SU-0001',
    current_level: 'B1',
    branch_id: 'branch-1',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    activityRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      remove: jest.fn(async (x: any) => x),
      createQueryBuilder: jest.fn(() => qbStub()),
    };
    regRepo = {
      findOne: jest.fn(),
      count: jest.fn(async () => 0),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => (Array.isArray(x) ? x : { id: 'reg-1', ...x })),
      find: jest.fn(async () => []),
      createQueryBuilder: jest.fn(() => qbStub()),
    };
    photoRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'photo-1', ...x })),
      remove: jest.fn(async (x: any) => x),
    };
    studentRepo = { findOne: jest.fn() };
    groupStudentRepo = { findOne: jest.fn() };
    finance = { recordActivityFee: jest.fn(async () => ({ id: 'ft-1' })) };

    service = new ActivitiesService(
      activityRepo,
      regRepo,
      photoRepo,
      studentRepo,
      groupStudentRepo,
      finance,
    );
  });

  describe('create', () => {
    it('locks a non-admin to their own branch', async () => {
      const dto: any = { title: 'X', branch_id: 'branch-9', type: ActivityEventType.TRIP, date: '2026-10-01', capacity: 10 };
      await expect(service.create(dto, manager)).rejects.toThrow(ForbiddenException);
      expect(activityRepo.create).not.toHaveBeenCalled();
    });

    it('creates with created_by and returns the loaded activity', async () => {
      const dto: any = { title: 'Trip', branch_id: 'branch-1', type: ActivityEventType.TRIP, date: '2026-10-01', capacity: 10 };
      activityRepo.findOne.mockResolvedValue({ ...baseActivity, title: 'Trip' });
      const result = await service.create(dto, manager);
      expect(activityRepo.create).toHaveBeenCalledWith(expect.objectContaining({ created_by: 'user-2' }));
      expect(result).toBeDefined();
    });
  });

  describe('register', () => {
    const loadActivity = (overrides: any = {}) =>
      activityRepo.findOne.mockResolvedValue({ ...baseActivity, ...overrides });

    it('throws NotFound for an unknown activity', async () => {
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(NotFoundException);
    });

    it('rejects registration when the activity is cancelled', async () => {
      loadActivity({ status: ActivityStatus.CANCELLED });
      studentRepo.findOne.mockResolvedValue(student);
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(BadRequestException);
    });

    it('rejects a duplicate active registration', async () => {
      loadActivity();
      studentRepo.findOne.mockResolvedValue(student);
      regRepo.findOne.mockResolvedValue({ id: 'r', status: RegistrationStatus.REGISTERED });
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(
        'Student is already registered for this activity',
      );
    });

    it('enforces level targeting when the student level does not match', async () => {
      loadActivity({ target_levels: ['A1'] });
      studentRepo.findOne.mockResolvedValue({ ...student, current_level: 'B2' });
      regRepo.findOne.mockResolvedValue(null);
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(/targets levels/);
      expect(regRepo.save).not.toHaveBeenCalled();
    });

    it('enforces group targeting when only groups are targeted', async () => {
      loadActivity({ target_levels: [], target_groups: ['grp-1'] });
      studentRepo.findOne.mockResolvedValue(student);
      regRepo.findOne.mockResolvedValue(null);
      groupStudentRepo.findOne.mockResolvedValue(null);
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(
        'Activity is restricted to specific student groups',
      );
    });

    it('allows registration when the student is in a targeted group', async () => {
      loadActivity({ target_levels: [], target_groups: ['grp-1'], capacity: 5 });
      studentRepo.findOne.mockResolvedValue({ ...student, current_level: 'A1' });
      regRepo.findOne.mockResolvedValue(null);
      groupStudentRepo.findOne.mockResolvedValue({ id: 'gs-1', group_id: 'grp-1' });
      regRepo.count.mockResolvedValue(0);
      await service.register('act-1', {}, admin);
      expect(regRepo.save).toHaveBeenCalled();
    });

    it('allows registration when the activity is open to all', async () => {
      loadActivity({ is_open_to_all: true, target_levels: ['A1'], capacity: 5 });
      studentRepo.findOne.mockResolvedValue({ ...student, current_level: 'C1' });
      regRepo.findOne.mockResolvedValue(null);
      regRepo.count.mockResolvedValue(0);
      await service.register('act-1', {}, admin);
      expect(regRepo.save).toHaveBeenCalled();
    });

    it('rejects registration when the activity is full', async () => {
      loadActivity({ capacity: 2 });
      studentRepo.findOne.mockResolvedValue(student);
      regRepo.findOne.mockResolvedValue(null);
      regRepo.count.mockResolvedValue(2);
      await expect(service.register('act-1', {}, admin)).rejects.toThrow(
        'Activity is full (capacity 2)',
      );
      expect(regRepo.save).not.toHaveBeenCalled();
    });

    it('books the fee in the Finance ledger when mark_paid is set', async () => {
      loadActivity({ capacity: 5, fee: 100 });
      studentRepo.findOne.mockResolvedValue(student);
      regRepo.findOne.mockResolvedValue(null);
      regRepo.count.mockResolvedValue(0);
      await service.register('act-1', { mark_paid: true }, admin);
      expect(finance.recordActivityFee).toHaveBeenCalledWith(
        expect.objectContaining({ branch_id: 'branch-1', amount: 100 }),
      );
    });

    it('does not book a ledger transaction without mark_paid', async () => {
      loadActivity({ capacity: 5, fee: 100 });
      studentRepo.findOne.mockResolvedValue(student);
      regRepo.findOne.mockResolvedValue(null);
      regRepo.count.mockResolvedValue(0);
      await service.register('act-1', {}, admin);
      expect(finance.recordActivityFee).not.toHaveBeenCalled();
    });

    it('blocks a student from registering somebody else', async () => {
      loadActivity({ is_open_to_all: true, capacity: 5 });
      const studentUser = { id: 'user-9', userId: 'user-9', roles: ['student'], branchId: 'branch-1' };
      studentRepo.findOne.mockResolvedValueOnce({ ...student, id: 'own' });
      await expect(
        service.register('act-1', { student_id: 'someone-else' }, studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });


  describe('markAttendance', () => {
    it('rejects marking a student who is not registered', async () => {
      activityRepo.findOne.mockResolvedValue({ ...baseActivity, registrations: [] });
      await expect(
        service.markAttendance(
          'act-1',
          { student_id: 'stu-1', status: RegistrationStatus.ATTENDED },
          admin,
        ),
      ).rejects.toThrow(/not registered/);
      expect(regRepo.save).not.toHaveBeenCalled();
    });

    it('updates a registered student to attended and returns the summary', async () => {
      const registration = { id: 'reg-1', student_id: 'stu-1', status: RegistrationStatus.REGISTERED };
      activityRepo.findOne.mockResolvedValue({ ...baseActivity, registrations: [registration] });
      const result = await service.markAttendance(
        'act-1',
        { records: [{ student_id: 'stu-1', status: RegistrationStatus.ATTENDED }] },
        admin,
      );
      expect(registration.status).toBe(RegistrationStatus.ATTENDED);
      expect(regRepo.save).toHaveBeenCalledWith([registration]);
      expect(result.summary.attended).toBe(1);
    });

    it('requires at least one record pair', async () => {
      activityRepo.findOne.mockResolvedValue({ ...baseActivity, registrations: [] });
      await expect(service.markAttendance('act-1', {}, admin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelRegistration', () => {
    it('cancels and reopens a FULL activity when a seat frees up', async () => {
      const activity = { ...baseActivity, status: ActivityStatus.FULL };
      regRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        status: RegistrationStatus.REGISTERED,
        activity,
      });
      regRepo.count.mockResolvedValue(1); // one remaining after cancel of capacity 2
      await service.cancelRegistration('reg-1', admin);
      expect(regRepo.save).toHaveBeenCalled();
      expect(activity.status).toBe(ActivityStatus.UPCOMING);
      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('throws for an already cancelled registration', async () => {
      regRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        status: RegistrationStatus.CANCELLED,
        activity: baseActivity,
      });
      await expect(service.cancelRegistration('reg-1', admin)).rejects.toThrow(
        'Registration is already cancelled',
      );
    });
  });


  describe('payRegistration', () => {
    it('collects the outstanding fee and books the ledger', async () => {
      regRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        paid_amount: 0,
        payment_id: null,
        activity: { ...baseActivity, fee: 100 },
        student,
      });
      await service.payRegistration('reg-1', {}, admin);
      expect(finance.recordActivityFee).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100 }),
      );
      expect(regRepo.save).toHaveBeenCalledWith(expect.objectContaining({ paid_amount: 100 }));
    });

    it('rejects payment when the activity has no fee', async () => {
      regRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        paid_amount: 0,
        activity: { ...baseActivity, fee: 0 },
        student,
      });
      await expect(service.payRegistration('reg-1', {}, admin)).rejects.toThrow(
        'This activity has no fee',
      );
    });
  });

  describe('photos', () => {
    it('adds a photo to an existing activity', async () => {
      activityRepo.findOne.mockResolvedValue({ ...baseActivity });
      const photo = await service.addPhoto(
        'act-1',
        { file_url: '/uploads/a.jpg', caption: 'Fun' },
        admin,
      );
      expect(photo.file_url).toBe('/uploads/a.jpg');
      expect(photoRepo.save).toHaveBeenCalled();
    });

    it('throws NotFound when removing an unknown photo', async () => {
      photoRepo.findOne.mockResolvedValue(null);
      await expect(service.removePhoto('nope', admin)).rejects.toThrow(NotFoundException);
    });
  });
});

