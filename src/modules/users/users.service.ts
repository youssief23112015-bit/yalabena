import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';
import { Role } from '../../shared/entities/role.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '../../common/enums/user-status.enum';

export interface FindAllUsersFilter {
  branchId?: string;
}

/** Profile fields a client may edit through PUT /users/:id. */
export interface UpdateUserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  branch_id?: string;
  status?: string;
  role_id?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateUserDto, creatorId: string) {
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
      branch_id: dto.branch_id,
      status: dto.status || UserStatus.ACTIVE,
      language: 'ar',
    });

    const savedUser = await this.userRepo.save(user);

    if (dto.role_id) {
      await this.userRoleRepo.save({
        user_id: savedUser.id,
        role_id: dto.role_id,
        assigned_by: creatorId,
      });
    }

    return this.userRepo.findOne({
      where: { id: savedUser.id },
      relations: ['branch'],
    });
  }

  async findAll(filter: FindAllUsersFilter = {}): Promise<User[]> {
    return this.userRepo.find({
      where: filter.branchId ? { branch_id: filter.branchId } : {},
      relations: ['branch'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateRole(id: string, roleId: string, creatorId: string): Promise<User> {
    const user = await this.findOne(id);
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    await this.userRoleRepo.delete({ user_id: id });

    await this.userRoleRepo.save({
      user_id: id,
      role_id: roleId,
      assigned_by: creatorId,
    });

    return this.findOne(id);
  }

  // ─── Profile update / delete / status / password (admin panel) ───

  /**
   * Update profile fields; optionally swaps the role in the same call
   * (the frontend edit form sends role_id alongside the name/email fields).
   */
  async update(id: string, dto: UpdateUserProfile): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const duplicate = await this.userRepo.findOne({ where: { email: dto.email } });
      if (duplicate) throw new ConflictException('Email already exists');
    }
    if (dto.phone && dto.phone !== user.phone) {
      const duplicate = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (duplicate) throw new ConflictException('Phone already exists');
    }

    const patch: Partial<User> = {};
    if (dto.first_name !== undefined) patch.first_name = dto.first_name;
    if (dto.last_name !== undefined) patch.last_name = dto.last_name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.branch_id !== undefined) patch.branch_id = dto.branch_id || (null as unknown as string);
    if (dto.status !== undefined) patch.status = dto.status as UserStatus;

    if (Object.keys(patch).length > 0) {
      await this.userRepo.update(id, patch);
    }

    if (dto.role_id) {
      await this.updateRole(id, dto.role_id, id);
    }

    return this.findOne(id);
  }

  async updateStatus(id: string, status: string): Promise<User> {
    await this.findOne(id);
    const allowed = Object.values(UserStatus) as string[];
    if (!allowed.includes(status)) {
      throw new ConflictException(`Invalid status: ${status}`);
    }
    await this.userRepo.update(id, { status: status as UserStatus });
    return this.findOne(id);
  }

  async resetPassword(id: string, newPassword: string): Promise<{ id: string; reset: true }> {
    await this.findOne(id);
    if (!newPassword || newPassword.length < 6) {
      throw new ConflictException('Password must be at least 6 characters');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password_hash: hash });
    return { id, reset: true };
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const user = await this.findOne(id);
    // Link-check: refuse if the user still has HR/academic dependents.
    const employeeCount = await this.userRepo.manager
      .getRepository('Employee')
      .count({ where: { user_id: user.id } })
      .catch(() => 0);
    if (employeeCount > 0) {
      throw new ForbiddenException('User has an employee record — terminate it from HR first');
    }
    await this.userRoleRepo.delete({ user_id: id });
    await this.userRepo.remove(user);
    return { id, deleted: true };
  }
}