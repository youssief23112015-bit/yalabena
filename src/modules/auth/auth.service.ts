import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { Role } from '../../shared/entities/role.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (exists) throw new ConflictException('Email or phone already registered');

    const hash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      phone: dto.phone,
      password_hash: hash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      language: dto.language || 'ar',
      status: UserStatus.ACTIVE,
    });
    await this.userRepo.save(user);

    const studentRole = await this.roleRepo.findOne({ where: { slug: 'student' } });
    if (!studentRole) {
      throw new InternalServerErrorException(
        'Default student role not found in database. Please contact support.',
      );
    }

    await this.userRoleRepo.save({
      user_id: user.id,
      role_id: studentRole.id,
      assigned_by: user.id,
    });

    const roles = [studentRole.slug];
    const permissions = await this.getUserPermissions(user.id);
    return this.buildAuthResponse(user, roles, permissions);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.userRepo.update(user.id, { last_login_at: new Date() });

    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    return this.buildAuthResponse(user, roles, permissions);
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refresh_token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      const roles = await this.getUserRoles(user.id);
      const permissions = await this.getUserPermissions(user.id);
      return this.buildAuthResponse(user, roles, permissions);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: userId },
      relations: ['role'],
    });

    const slugs = userRoles
      .map((ur) => ur.role?.slug)
      .filter(Boolean) as string[];

    return slugs.length > 0 ? slugs : ['student'];
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: userId },
      relations: { role: { permissions: true } },
    });

    return [
      ...new Set(
        userRoles.flatMap((ur) =>
          (ur.role?.permissions ?? []).map((p) => `${p.module}:${p.action}`),
        ),
      ),
    ];
  }

  private buildAuthResponse(
    user: User,
    roles: string[] = ['student'],
    permissions: string[] = [],
  ) {
    const payload = { sub: user.id, email: user.email, roles };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        branch_id: user.branch_id,
        language: user.language,
        role: roles[0],
        roles,
        permissions,
      },
    };
  }
}
