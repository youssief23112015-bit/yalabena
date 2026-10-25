import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AdminMetricService } from './admin-metric.service';
import { Lead } from '../../../shared/entities/lead.entity';
import { Student } from '../../../shared/entities/student.entity';
import { Course } from '../../../shared/entities/course.entity';
import { Branch } from '../../../shared/entities/branch.entity';
import { Group } from '../../../shared/entities/group.entity';
import { Session } from '../../../shared/entities/session.entity';
import { Invoice } from '../../../shared/entities/invoice.entity';
import { Payment } from '../../../shared/entities/payment.entity';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { GroupStudent } from '../../../shared/entities/group-student.entity';
import { User } from '../../../shared/entities/user.entity';

const appConfig = new ConfigService();
appConfig.set('APP_TIME_ZONE', 'Africa/Cairo');

function createMockRepo<T>(): Record<string, any> {
  const qb: any = {};
  qb.select = jest.fn(() => qb);
  qb.addSelect = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.innerJoin = jest.fn(() => qb);
  qb.leftJoinAndSelect = jest.fn(() => qb);
  qb.leftJoin = jest.fn(() => qb);
  qb.groupBy = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.take = jest.fn(() => qb);
  qb.getRawOne = jest.fn(() => ({ total: 0 }));
  qb.getRawMany = jest.fn(() => []);
  qb.getCount = jest.fn(() => 0);
  qb.getMany = jest.fn(() => []);
  return {
    find: jest.fn(), count: jest.fn(), getCount: jest.fn(), getRawOne: jest.fn(), getRawMany: jest.fn(), getMany: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
  };
}

function providers(): any[] {
  return [
    AdminMetricService,
    { provide: getRepositoryToken(Lead), useValue: createMockRepo() },
    { provide: getRepositoryToken(Student), useValue: createMockRepo() },
    { provide: getRepositoryToken(Course), useValue: createMockRepo() },
    { provide: getRepositoryToken(Branch), useValue: createMockRepo() },
    { provide: getRepositoryToken(Group), useValue: createMockRepo() },
    { provide: getRepositoryToken(Session), useValue: createMockRepo() },
    { provide: getRepositoryToken(Invoice), useValue: createMockRepo() },
    { provide: getRepositoryToken(Payment), useValue: createMockRepo() },
    { provide: getRepositoryToken(Attendance), useValue: createMockRepo() },
    { provide: getRepositoryToken(GroupStudent), useValue: createMockRepo() },
    { provide: getRepositoryToken(User), useValue: createMockRepo() },
    { provide: DataSource, useValue: {} as any },
    { provide: ConfigService, useValue: appConfig },
  ];
}

describe('AdminMetricService - branch scoping', () => {
  let service: AdminMetricService;
  const mocks: Record<string, any> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: providers() }).compile();
    service = module.get<AdminMetricService>(AdminMetricService);
    Object.assign(mocks, {
      lead: module.get<Repository<Lead>>(getRepositoryToken(Lead)),
      student: module.get<Repository<Student>>(getRepositoryToken(Student)),
      group: module.get<Repository<Group>>(getRepositoryToken(Group)),
      session: module.get<Repository<Session>>(getRepositoryToken(Session)),
      invoice: module.get<Repository<Invoice>>(getRepositoryToken(Invoice)),
      payment: module.get<Repository<Payment>>(getRepositoryToken(Payment)),
      gs: module.get<Repository<GroupStudent>>(getRepositoryToken(GroupStudent)),
    });
  });

  it('branch_manager sees only own branch', async () => {
    const user = { id: 'manager-1', roles: ['branch_manager'], branchId: 'b-a', branch_id: 'b-a' };
    const stats = await service.getMetrics(user, { from: undefined, to: undefined, branch_id: undefined } as any);
    expect(stats.recent_items.leads).toHaveLength(0);
    expect(stats.recent_items.payments).toHaveLength(0);
    expect(stats.recent_items.upcoming_sessions).toHaveLength(0);
  });

  it('super_admin may access all branches', async () => {
    const user = { id: 'sa-1', roles: ['super_admin'] };
    const stats = await service.getMetrics(user, { from: undefined, to: undefined, branch_id: undefined } as any);
    expect(Array.isArray(stats.recent_items.leads)).toBe(true);
  });

  it('branch_manager KPI numbers local to branch b-a', async () => {
    const user = { id: 'm-1', roles: ['branch_manager'], branchId: 'b-a', branch_id: 'b-a' };
    mocks.lead.createQueryBuilder().getCount.mockResolvedValue(3);
    mocks.student.createQueryBuilder().getCount.mockResolvedValue(20);
    mocks.group.createQueryBuilder().getCount.mockResolvedValue(5);
    mocks.session.createQueryBuilder().getCount.mockResolvedValue(2);
    mocks.invoice.createQueryBuilder().getRawOne.mockResolvedValue({ total: 5000 });
    mocks.payment.createQueryBuilder().getRawOne.mockResolvedValue({ total: 3000 });

    const stats = await service.getMetrics(user, { from: undefined, to: undefined, branch_id: undefined } as any);
    expect(stats.kpis.total_leads.value).toBe(3);
    expect(stats.kpis.total_students.value).toBe(20);
    expect(stats.kpis.total_sessions.value).toBe(2);
    expect(stats.kpis.revenue_today.value).toBe(3000);
    expect(stats.kpis.outstanding_payments.value).toBe(5000);
  });
});

describe('AdminMetricService - empty period', () => {
  let service: AdminMetricService;
  const mocks: Record<string, any> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: providers() }).compile();
    service = module.get<AdminMetricService>(AdminMetricService);
    Object.assign(mocks, {
      lead: module.get<Repository<Lead>>(getRepositoryToken(Lead)),
      student: module.get<Repository<Student>>(getRepositoryToken(Student)),
      group: module.get<Repository<Group>>(getRepositoryToken(Group)),
      session: module.get<Repository<Session>>(getRepositoryToken(Session)),
      invoice: module.get<Repository<Invoice>>(getRepositoryToken(Invoice)),
      payment: module.get<Repository<Payment>>(getRepositoryToken(Payment)),
      gs: module.get<Repository<GroupStudent>>(getRepositoryToken(GroupStudent)),
    });
  });

  it('returns zeros for empty period', async () => {
    const stats = await service.getMetrics(
      { id: 'm-1', roles: ['branch_manager'], branchId: 'b-a', branch_id: 'b-a' },
      { from: undefined, to: undefined, branch_id: undefined } as any,
    );
    expect(stats.kpis.revenue_today.value).toBe(0);
    expect(stats.kpis.revenue_month.value).toBe(0);
    expect(stats.kpis.total_leads.value).toBe(0);
    expect(stats.kpis.conversion_rate.value).toBe(0);
  });
});