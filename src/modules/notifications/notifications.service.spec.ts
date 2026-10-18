import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NotificationService } from './notifications.service';
import { Notification } from '../../shared/entities/notification.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';
import { NotificationsGateway } from './notifications.gateway';
import { SendBroadcastDto } from './dto/broadcast-notification.dto';

/** Chainable QueryBuilder stub resolving getRawMany(). */
const userQb = (rows: { id: string }[] = []) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

const baseDto = { title: 'Hello there', message: 'A long enough message' };

describe('NotificationService (broadcast targeting)', () => {
  let service: NotificationService;
  let notifRepo: any;
  let userRepo: any;
  let groupRepo: any;
  let gateway: { sendToUser: jest.Mock };

  const admin = { id: 'admin-1', roles: ['super_admin'] };
  const teacher = { id: 'teacher-1', roles: ['teacher'] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn((x: any) => ({ ...x })),
            save: jest.fn(async (x: any) =>
              Array.isArray(x)
                ? x.map((e: any, i: number) => ({ ...e, id: `n-${i}` }))
                : { ...x, id: 'n-0' },
            ),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => userQb()),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: { findOne: jest.fn(), query: jest.fn(async () => []) },
        },
        { provide: NotificationsGateway, useValue: { sendToUser: jest.fn() } },
      ],
    }).compile();

    service = module.get(NotificationService);
    notifRepo = module.get(getRepositoryToken(Notification));
    userRepo = module.get(getRepositoryToken(User));
    groupRepo = module.get(getRepositoryToken(Group));
    gateway = module.get(NotificationsGateway);
  });

  afterEach(() => jest.clearAllMocks());

  // ═════════════════════════════════════════════
  // Business Rule 1 — Admin capabilities
  // ═════════════════════════════════════════════
  describe('admin targeting', () => {
    it('sends to ALL active users (no role join)', async () => {
      const qb = userQb([{ id: 'u-1' }, { id: 'u-2' }]);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'all' },
        admin,
      );

      expect(out).toMatchObject({ sent: 2, target_type: 'all' });
      expect(qb.innerJoin).not.toHaveBeenCalled();
      expect(gateway.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('sends to all STUDENTS (role join with slug student)', async () => {
      const qb = userQb([{ id: 'u-9' }]);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'students' },
        admin,
      );

      expect(out.target_type).toBe('students');
      expect(qb.innerJoin).toHaveBeenCalledWith('u.userRoles', 'ur');
      expect(qb.andWhere).toHaveBeenCalledWith('r.slug = :slug', { slug: 'student' });
      expect(out.sent).toBe(1);
    });

    it('sends to all TEACHERS (role join with slug teacher)', async () => {
      const qb = userQb([{ id: 'u-5' }]);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'teachers' },
        admin,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('r.slug = :slug', { slug: 'teacher' });
      expect(out.target_type).toBe('teachers');
    });

    it('sends to ONE specific user', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u-x', status: 'active' });

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'specific_user', target_user_id: 'u-x' },
        admin,
      );

      expect(out).toMatchObject({ sent: 1, target_type: 'specific_user' });
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u-x', type: 'broadcast' }),
      );
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('404s for an unknown specific_user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createBroadcast(
          { ...baseDto, target_type: 'specific_user', target_user_id: 'ghost' },
          admin,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('400s when specific_user lacks target_user_id (service guard)', async () => {
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'specific_user' }, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('400s when group lacks group_id (service guard)', async () => {
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'group' }, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('404s for an unknown group', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'group', group_id: 'ghost' }, admin),
      ).rejects.toThrow(NotFoundException);
    });

    it('keeps the legacy target_role audience working (student → students)', async () => {
      const qb = userQb([{ id: 'u-3' }]);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const out = await service.createBroadcast(
        { ...baseDto, target_role: 'student' } as SendBroadcastDto,
        admin,
      );

      expect(out.target_type).toBe('students');
      expect(qb.andWhere).toHaveBeenCalledWith('r.slug = :slug', { slug: 'student' });
      expect(out.target_role).toBe('student');
    });
  });

  // ═════════════════════════════════════════════
  // Business Rule 2 — Teacher restrictions (403)
  // ═════════════════════════════════════════════
  describe('teacher restrictions', () => {
    it('403s when a teacher broadcasts to ALL users', async () => {
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'all' }, teacher),
      ).rejects.toThrow(ForbiddenException);
      expect(notifRepo.create).not.toHaveBeenCalled();
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('403s when a teacher broadcasts to all STUDENTS', async () => {
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'students' }, teacher),
      ).rejects.toThrow(ForbiddenException);
      expect(notifRepo.create).not.toHaveBeenCalled();
    });

    it('403s when a teacher broadcasts to all TEACHERS', async () => {
      await expect(
        service.createBroadcast({ ...baseDto, target_type: 'teachers' }, teacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('403s when a teacher targets a SPECIFIC user', async () => {
      await expect(
        service.createBroadcast(
          { ...baseDto, target_type: 'specific_user', target_user_id: 'u-x' },
          teacher,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('403s when a teacher targets a group they do NOT own', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g-1', teacher_id: 'someone-else' });

      await expect(
        service.createBroadcast(
          { ...baseDto, target_type: 'group', group_id: 'g-1' },
          teacher,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(groupRepo.query).not.toHaveBeenCalled(); // roster never resolved
      expect(notifRepo.create).not.toHaveBeenCalled();
    });

    it('delivers to OWN group students via the roster union', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g-1', teacher_id: 'teacher-1' });
      groupRepo.query.mockResolvedValue([{ id: 'stu-user-1' }, { id: 'stu-user-2' }]);

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'group', group_id: 'g-1' },
        teacher,
      );

      expect(out).toMatchObject({ sent: 2, target_type: 'group' });
      // roster SQL covers group_students ∪ ACTIVE enrollments
      expect(groupRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('group_students'),
        expect.arrayContaining(['g-1']),
      );
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'stu-user-1',
          data: expect.objectContaining({ target_type: 'group', group_id: 'g-1' }),
        }),
      );
      expect(gateway.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('lets a teacher+academic sender broadcast (admin-like override)', async () => {
      const hybrid = { id: 't-9', roles: ['teacher', 'academic'] };
      const qb = userQb([{ id: 'u-1' }]);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const out = await service.createBroadcast(
        { ...baseDto, target_type: 'all' },
        hybrid,
      );
      expect(out.sent).toBe(1);
    });
  });

  // ═════════════════════════════════════════════
  // DTO conditional validation
  // ═════════════════════════════════════════════
  describe('SendBroadcastDto validation', () => {
    it('requires target_user_id exactly when target_type = specific_user', async () => {
      const dto = plainToInstance(SendBroadcastDto, { ...baseDto, target_type: 'specific_user' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'target_user_id')).toBe(true);
    });

    it('requires group_id exactly when target_type = group', async () => {
      const dto = plainToInstance(SendBroadcastDto, { ...baseDto, target_type: 'group' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'group_id')).toBe(true);
    });

    it('accepts a complete specific_user payload and rejects unknown targets', async () => {
      const ok = plainToInstance(SendBroadcastDto, {
        ...baseDto,
        target_type: 'specific_user',
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(await validate(ok)).toHaveLength(0);

      const bad = plainToInstance(SendBroadcastDto, { ...baseDto, target_type: 'everyone' });
      expect((await validate(bad)).some((e) => e.property === 'target_type')).toBe(true);
    });

    it('does not demand ids for the plain audiences', async () => {
      const dto = plainToInstance(SendBroadcastDto, { ...baseDto, target_type: 'all' });
      expect(await validate(dto)).toHaveLength(0);
    });
  });
});
