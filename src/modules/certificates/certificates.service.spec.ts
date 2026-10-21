import { NotFoundException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

/** Minimal chainable QueryBuilder stub for createQueryBuilder-based methods. */
const qbStub = (certs: any[] = []) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(certs),
});

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certs: any;
  let templates: any;
  let students: any;
  let courses: any;
  let groups: any;
  let groupStudents: any;
  let categories: any;
  let entries: any;
  let settings: any;

  const studentUser = { id: 'user-9', userId: 'user-9', roles: ['student'] };
  const admin = { id: 'user-1', userId: 'user-1', roles: ['super_admin'] };

  const ownCertificate = {
    id: 'cert-1',
    student_id: 'stu-1',
    code: 'SU-ABCDEF1234',
    issue_date: '2026-05-01',
    status: 'active',
    student: { id: 'stu-1', user_id: 'user-9', user: { id: 'user-9' } },
    course: { id: 'course-1', name: 'General English', level: 'B1' },
    group: { id: 'group-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    certs = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => qbStub()),
    };
    templates = { findOne: jest.fn(), find: jest.fn(async () => []), create: jest.fn((x: any) => x), save: jest.fn(async (x: any) => x) };
    students = { findOne: jest.fn() };
    courses = { findOne: jest.fn() };
    groups = { findOne: jest.fn() };
    groupStudents = { findOne: jest.fn(), find: jest.fn(async () => []) };
    categories = { findOne: jest.fn(), find: jest.fn(async () => []) };
    entries = { findOne: jest.fn(), find: jest.fn(async () => []) };
    settings = { findOne: jest.fn() };

    service = new CertificatesService(
      certs,
      templates,
      students,
      courses,
      groups,
      groupStudents,
      categories,
      entries,
      settings,
    );
  });

  describe('myCertificates', () => {
    it('resolves the logged-in user to their students row and returns active certificates', async () => {
      students.findOne.mockResolvedValue({ id: 'stu-1', user_id: 'user-9' });
      const expected = [ownCertificate];
      const qb = qbStub(expected);
      certs.createQueryBuilder.mockReturnValue(qb);

      const result = await service.myCertificates(studentUser);

      expect(students.findOne).toHaveBeenCalledWith({ where: { user_id: 'user-9' } });
      expect(qb.where).toHaveBeenCalledWith('c.student_id = :sid', { sid: 'stu-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('c.status = :st', { st: 'active' });
      expect(result).toEqual(expected);
    });

    it('throws NotFound when no student profile is linked to the account', async () => {
      students.findOne.mockResolvedValue(null);
      await expect(service.myCertificates(studentUser)).rejects.toThrow(NotFoundException);
      expect(certs.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getOne (student self-service ownership)', () => {
    it('lets a student read their own certificate', async () => {
      certs.findOne.mockResolvedValue(ownCertificate);
      const result = await service.getOne('cert-1', studentUser);
      expect(result).toEqual(ownCertificate);
    });

    it('hides certificates that belong to another student (NotFound, not Forbidden)', async () => {
      certs.findOne.mockResolvedValue({
        ...ownCertificate,
        student: { id: 'stu-2', user_id: 'user-99' },
      });
      await expect(service.getOne('cert-1', studentUser)).rejects.toThrow(NotFoundException);
    });

    it('lets staff read any certificate (no branch scoping in a 100% online academy)', async () => {
      certs.findOne.mockResolvedValue({
        ...ownCertificate,
        student: { id: 'stu-2', user_id: 'user-99' },
      });
      const academic = { id: 'user-2', userId: 'user-2', roles: ['academic'] };
      await expect(service.getOne('cert-1', academic)).resolves.toEqual(expect.objectContaining({ id: 'cert-1' }));
    });

    it('lets a super admin read any certificate', async () => {
      certs.findOne.mockResolvedValue({
        ...ownCertificate,
        student: { id: 'stu-2', user_id: 'user-99' },
      });
      await expect(service.getOne('cert-1', admin)).resolves.toEqual(expect.objectContaining({ id: 'cert-1' }));
    });

    it('throws NotFound for a missing certificate', async () => {
      certs.findOne.mockResolvedValue(null);
      await expect(service.getOne('missing', admin)).rejects.toThrow(NotFoundException);
    });
  });
});
