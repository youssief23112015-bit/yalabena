import {
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed-password'),
  compare: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let userRoleRepo: any;
  let roleRepo: any;
  let jwtService: any;

  const baseUser = {
    id: 'u-1',
    email: 'ahmed@test.com',
    phone: '01012345678',
    password_hash: 'stored-hash',
    first_name: 'Ahmed',
    last_name: 'Ali',
    branch_id: 'b-1',
    language: 'ar',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => ({ id: 'u-1', ...x })),
      save: jest.fn(async (x: any) => x),
      update: jest.fn(async () => undefined),
      createQueryBuilder: jest.fn(),
    };
    userRoleRepo = { save: jest.fn(async (x: any) => x), find: jest.fn(async () => []) };
    roleRepo = { findOne: jest.fn() };
    jwtService = { sign: jest.fn(() => 'signed-token'), verify: jest.fn() };
    service = new AuthService(jwtService, userRepo, userRoleRepo, roleRepo);
  });

  describe('register', () => {
    const dto: any = {
      email: 'ahmed@test.com',
      phone: '01012345678',
      password: 'secret123',
      first_name: 'Ahmed',
      last_name: 'Ali',
    };

    it('rejects duplicate email/phone with ConflictException', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('fails loudly when the default student role is missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.register(dto)).rejects.toThrow(InternalServerErrorException);
    });

    it('hashes the password, assigns the student role, and returns tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({ id: 'r-student', slug: 'student' });
      userRoleRepo.find.mockResolvedValue([
        { role: { slug: 'student', permissions: [{ module: 'lms', action: 'read' }] } },
      ]);

      const res = await service.register(dto);

      expect(bcryptMock.hash).toHaveBeenCalledWith('secret123', 12);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password_hash: 'hashed-password', email: dto.email }),
      );
      expect(userRoleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u-1', role_id: 'r-student' }),
      );
      expect(res.access_token).toBe('signed-token');
      expect(res.refresh_token).toBe('signed-token');
      expect(res.user.roles).toEqual(['student']);
      expect(res.user.permissions).toEqual(['lms:read']);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u-1', email: dto.email }),
      );
    });
  });

  describe('login', () => {
    const dto: any = { email: 'ahmed@test.com', password: 'secret123' };

    const mockLoginQb = (user: any) =>
      userRepo.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      });

    it('rejects unknown email', async () => {
      mockLoginQb(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      mockLoginQb(baseUser);
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('returns tokens and defaults role to student when none assigned', async () => {
      mockLoginQb(baseUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      userRoleRepo.find.mockResolvedValue([]);

      const res: any = await service.login(dto);

      expect(userRepo.update).toHaveBeenCalledWith(
        'u-1',
        expect.objectContaining({ last_login_at: expect.any(Date) }),
      );
      expect(res.user.roles).toEqual(['student']);
      expect(res.access_token).toBe('signed-token');
    });

    it('aggregates roles and permissions from user_roles', async () => {
      mockLoginQb(baseUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      userRoleRepo.find.mockResolvedValue([
        { role: { slug: 'teacher', permissions: [{ module: 'lms', action: 'grade' }] } },
        { role: { slug: 'moderator', permissions: [{ module: 'chat', action: 'read' }] } },
      ]);

      const res: any = await service.login(dto);
      expect(res.user.roles).toEqual(['teacher', 'moderator']);
      expect(res.user.permissions).toEqual(['lms:grade', 'chat:read']);
    });
  });

  describe('refresh', () => {
    it('rejects an invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad token');
      });
      await expect(service.refresh({ refresh_token: 'bad' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues fresh tokens for a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'u-1' });
      userRepo.findOne.mockResolvedValue(baseUser);

      const res = await service.refresh({ refresh_token: 'good' } as any);
      expect(res.access_token).toBe('signed-token');
      expect(res.user.id).toBe('u-1');
    });

    it('rejects when the token subject no longer exists', async () => {
      jwtService.verify.mockReturnValue({ sub: 'ghost' });
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh({ refresh_token: 'stale' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });


  describe('two-factor authentication (SRS 7.2)', () => {
    const qbFor = (user: any) => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    });

    it('login returns requires_2fa + temp token when 2FA is enabled', async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_enabled: true }),
      );
      bcryptMock.compare.mockResolvedValue(true as never);

      const res: any = await service.login({ email: baseUser.email, password: 'x' } as any);

      expect(res).toEqual({ requires_2fa: true, temp_token: 'signed-token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'u-1', purpose: '2fa' },
        { expiresIn: '5m' },
      );
    });

    it('setup2fa stores a pending secret and returns otpauth + QR data URL', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, two_factor_enabled: false });

      const res = await service.setup2fa('u-1');

      expect(userRepo.update).toHaveBeenCalledWith('u-1', {
        two_factor_secret: expect.any(String),
      });
      expect(res.otpauth_url).toContain('otpauth://totp/');
      expect(res.qr_code_data_url).toMatch(/^data:image\/png;base64,/);
    });

    it('setup2fa refuses re-enrollment while 2FA is enabled', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, two_factor_enabled: true });
      await expect(service.setup2fa('u-1')).rejects.toThrow(BadRequestException);
    });

    it('enable2fa verifies the TOTP code against the pending secret', async () => {
      const secret = authenticator.generateSecret();
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_secret: secret }),
      );

      const res = await service.enable2fa('u-1', authenticator.generate(secret));

      expect(res).toEqual({ two_factor_enabled: true });
      expect(userRepo.update).toHaveBeenCalledWith('u-1', { two_factor_enabled: true });
    });

    it('enable2fa rejects a wrong TOTP code', async () => {
      const secret = authenticator.generateSecret();
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_secret: secret }),
      );
      await expect(service.enable2fa('u-1', '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('enable2fa requires setup first', async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_secret: null }),
      );
      await expect(service.enable2fa('u-1', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('disable2fa verifies the code then wipes the secret', async () => {
      const secret = authenticator.generateSecret();
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_enabled: true, two_factor_secret: secret }),
      );

      const res = await service.disable2fa('u-1', authenticator.generate(secret));

      expect(res).toEqual({ two_factor_enabled: false });
      expect(userRepo.update).toHaveBeenCalledWith('u-1', {
        two_factor_enabled: false,
        two_factor_secret: null,
      });
    });

    it('verify2fa completes login with a valid temp token + code', async () => {
      const secret = authenticator.generateSecret();
      jwtService.verify.mockReturnValue({ sub: 'u-1', purpose: '2fa' });
      userRepo.createQueryBuilder.mockReturnValue(
        qbFor({ ...baseUser, two_factor_enabled: true, two_factor_secret: secret }),
      );
      userRoleRepo.find.mockResolvedValue([
        { role: { slug: 'finance', permissions: [] } },
      ]);

      const res = await service.verify2fa({
        temp_token: 'temp',
        code: authenticator.generate(secret),
      } as any);

      expect(res.access_token).toBe('signed-token');
      expect(res.user.role).toBe('finance');
    });

    it('verify2fa rejects a temp token with the wrong purpose', async () => {
      jwtService.verify.mockReturnValue({ sub: 'u-1', purpose: 'refresh' });
      await expect(
        service.verify2fa({ temp_token: 'x', code: '123456' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('verify2fa rejects an expired/invalid temp token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });
      await expect(
        service.verify2fa({ temp_token: 'x', code: '123456' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
