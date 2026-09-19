import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../shared/entities/user.entity';
import { UserRole } from '../../../shared/entities/user-role.entity';
import { Role } from '../../../shared/entities/role.entity';

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
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['branch'],
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User inactive or not found');
    }

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

    // Keep both `id` and `userId` because existing controllers use both forms.
    // Load branch/roles/permissions from DB so permission changes are effective
    // on the next request without relying on stale JWT fields.
    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      roles,
      permissions,
      branchId: user.branch_id ?? null,
    };
  }
}
