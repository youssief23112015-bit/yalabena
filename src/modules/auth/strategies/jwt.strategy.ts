import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../shared/entities/user.entity';
import { UserRole } from '../../../shared/entities/user-role.entity';
import { Role } from '../../../shared/entities/role.entity';
import { UserStatus } from '../../../common/enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  tv?: number;
  pwd?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // 1. جلب بيانات المستخدم (بدون علاقة الفرع في الفرع اللاتفرعي)
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. التحقق من حالة المستخدم بناءً على الـ Enum
    if (user.status !== UserStatus.ACTIVE && user.status?.toString().toLowerCase() !== 'active') {
      throw new UnauthorizedException('User is inactive');
    }

    // 3. Session invalidation on password change: any JWT issued before the
    //    user's last password change is rejected, forcing re-login and
    //    invalidating all active access + refresh sessions.
    const pwdChangedAt = user.password_changed_at ? user.password_changed_at.getTime() : 0;
    if (payload.pwd !== undefined && payload.pwd < pwdChangedAt) {
      throw new UnauthorizedException('Token issued before password change. Please log in again.');
    }

    // 4. جلب الأدوَار والصلاحيات ديناميكياً من جدول userRoleRepo
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: user.id },
      relations: { role: { permissions: true } },
    });

    const roles = [
      ...new Set(userRoles.map((ur) => ur.role?.slug).filter(Boolean)),
    ];

    const permissions = [
      ...new Set(
        userRoles.flatMap((ur) =>
          (ur.role?.permissions ?? []).map((p) => `${p.module}:${p.action}`),
        ),
      ),
    ];

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      roles,
      permissions,
      branchId: null,
      status: user.status,
    };
  }
}