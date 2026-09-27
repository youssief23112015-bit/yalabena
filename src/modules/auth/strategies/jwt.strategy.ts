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
    // 1. جلب بيانات المستخدم مع الفرع فقط (بدون userRoles لمنع الخطأ)
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['branch'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. التحقق من حالة المستخدم بناءً على الـ Enum
    if (user.status !== UserStatus.ACTIVE && user.status?.toString().toLowerCase() !== 'active') {
      throw new UnauthorizedException('User is inactive');
    }

    // 3. جلب الأدوَار والصلاحيات ديناميكياً من جدول userRoleRepo
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
      branchId: user.branch_id ?? null,
      status: user.status,
    };
  }
}