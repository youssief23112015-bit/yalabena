import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
}