import { AuditService } from './audit.service';
import { ActorType } from '../../common/enums/actor-type.enum';

describe('AuditService (SRS 7.2)', () => {
  let service: AuditService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'log-1', ...x })),
      createQueryBuilder: jest.fn(),
    };
    service = new AuditService(repo);
  });

  it('log() persists a sanitized entry without throwing', async () => {
    service.log({
      actor_id: 'u-1',
      action: 'POST /finance/payments',
      module: 'finance',
      target_type: 'http_request',
      target_id: '9b1d0f2a-0000-4000-8000-000000000000',
      after_state: { status: 201 },
      ip_address: '127.0.0.1',
    });

    // fire-and-forget: flush the microtask queue
    await new Promise((r) => setImmediate(r));

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'u-1',
        actor_type: ActorType.USER,
        action: 'POST /finance/payments',
        module: 'finance',
      }),
    );
  });

  it('log() swallows repository errors (never breaks the request)', async () => {
    repo.save.mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => {});

    expect(() =>
      service.log({ action: 'X', module: 'm', target_type: 'http_request' }),
    ).not.toThrow();

    await new Promise((r) => setImmediate(r));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });

  it('truncates over-long action/module/target_type values', async () => {
    service.log({
      action: 'A'.repeat(200),
      module: 'B'.repeat(100),
      target_type: 'C'.repeat(100),
    });
    await new Promise((r) => setImmediate(r));

    const saved = repo.save.mock.calls[0][0];
    expect(saved.action).toHaveLength(100);
    expect(saved.module).toHaveLength(50);
    expect(saved.target_type).toHaveLength(50);
  });

  it('findAll applies filters and paginates', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'l1' }], 1]),
    };
    repo.createQueryBuilder.mockReturnValue(qb);

    const res = await service.findAll({ module: 'finance', page: 2, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith('a.module = :module', { module: 'finance' });
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(res.meta).toEqual({ total: 1, page: 2, limit: 10, pages: 1 });
  });

  it('findAll caps limit at 100', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({ limit: 9999 });
    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
