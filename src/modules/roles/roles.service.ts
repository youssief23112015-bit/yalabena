import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../../shared/entities/role.entity';
import { Permission } from '../../shared/entities/permission.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { User } from '../../shared/entities/user.entity';

interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permission_ids?: string[];
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async findRoleUsers(id: string) {
    await this.findOne(id);
    const assignments = await this.userRoleRepo.find({
      where: { role_id: id },
    });
    const userIds = assignments.map((assignment) => assignment.user_id);
    if (!userIds.length) return [];

    return this.userRepo.find({
      where: { id: In(userIds) },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        branch_id: true,
        language: true,
        avatar_url: true,
        phone: true,
        status: true,
      },
    });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({
      where: [{ slug: dto.slug }, { name: dto.name }],
    });
    if (existing) {
      throw new BadRequestException('Role with this name or slug already exists');
    }

    const role = this.roleRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      is_custom: true,
      is_system: false,
      permissions: [],
    });

    if (dto.permission_ids?.length) {
      role.permissions = await this.resolvePermissions(dto.permission_ids);
    }

    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    if (dto.permission_ids !== undefined) {
      role.permissions = await this.resolvePermissions(dto.permission_ids);
    }

    return this.roleRepo.save(role);
  }

  private async resolvePermissions(ids: string[]): Promise<Permission[]> {
    if (!ids.length) return [];

    const permissions = await this.permissionRepo.find({
      where: { id: In(ids) },
    });

    if (permissions.length !== new Set(ids).size) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    return permissions;
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.is_system) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    const assignedUsers = await this.userRoleRepo.count({
      where: { role_id: id },
    });
    if (assignedUsers > 0) {
      throw new BadRequestException(
        'Role has assigned users; reassign them before deleting the role',
      );
    }

    await this.roleRepo.remove(role);
    return { deleted: true };
  }
}
