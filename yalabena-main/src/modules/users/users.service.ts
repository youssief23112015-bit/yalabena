import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';
import { Role } from '../../shared/entities/role.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { Student } from '../../shared/entities/student.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '../../common/enums/user-status.enum';
import { StudentStatus } from '../../common/enums/student-status.enum';

export interface FindAllUsersFilter {
  branchId?: string;
}

/** Profile fields a client may edit through PUT /users/:id. */
export interface UpdateUserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
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

  /**
   * Idempotent student-profile sync: the /students list and /enrollments
   * picker read the `students` table (not `user_roles`), so a user holding
   * the student role MUST have a linked row (user_id is UNIQUE).
   * `student_number` is filled by the 'trg_students_number' DB trigger.
   * Never deletes: enrollments/invoices/payments FK-reference the row.
   */
  private async ensureStudentProfile(
    em: EntityManager,
    userId: string,
    branchId?: string | null,
  ): Promise<void> {
    const repo = em.getRepository(Student);
    const existing = await repo.findOne({ where: { user_id: userId } });
    if (existing) {
      // Re-assigned the student role after a role-change deactivation:
      // restore the row we soft-deactivated so the student number and all
      // historical enrollments stay attached. Deliberately leaves other
      // terminal states (suspended / graduated / dropped) untouched — those
      // are academic decisions, not role-sync artifacts.
      if (existing.status === StudentStatus.INACTIVE) {
        existing.status = StudentStatus.ACTIVE;
        await repo.save(existing);
      }
      return;
    }
    try {
      await repo.save(
        repo.create({
          user_id: userId,
          branch_id: branchId || null,
          enrollment_date: new Date(),
        } as Partial<Student>),
      );
    } catch (err) {
      // user_id UNIQUE race: a concurrent writer inserted the row between
      // our SELECT and INSERT — treat it as success.
      const again = await repo.findOne({ where: { user_id: userId } });
      if (!again) throw err;
    }
  }

  /**
   * Soft-deactivate counterpart of ensureStudentProfile: called when a user's
   * role changes AWAY from student. The row is kept (history, invoices,
   * enrollments) but flipped to 'inactive' so the user immediately drops out
   * of /students and the /enrollments picker. No-ops for rows that are
   * already inactive or in another terminal state.
   */
  private async deactivateStudentProfile(
    em: EntityManager,
    userId: string,
  ): Promise<void> {
    await em.getRepository(Student).update(
      { user_id: userId, status: StudentStatus.ACTIVE },
      { status: StudentStatus.INACTIVE },
    );
  }

  async create(dto: CreateUserDto, creatorId: string) {
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Resolve the role BEFORE any write so a bad role_id fails fast and the
    // slug (needed for the student-profile sync) is available below.
    let role: Role | null = null;
    if (dto.role_id) {
      role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
      if (!role) throw new NotFoundException('Role not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Atomic: user + role + (when student) students-table profile commit
    // together so the account is immediately visible in /students.
    const savedUser = await this.userRepo.manager.transaction(async (em) => {
      const created = await em.getRepository(User).save(
        em.getRepository(User).create({
          email: dto.email,
          password_hash: passwordHash,
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone,
          status: dto.status || UserStatus.ACTIVE,
          language: 'ar',
        }),
      );

      if (role) {
        await em.getRepository(UserRole).save({
          user_id: created.id,
          role_id: role.id,
          assigned_by: creatorId,
        });

        if (role.slug === 'student') {
          await this.ensureStudentProfile(em, created.id);
        }
      }

      return created;
    });

    return this.userRepo.findOne({
      where: { id: savedUser.id },
    });
  }

  async findAll(filter: FindAllUsersFilter = {}): Promise<User[]> {
    return this.userRepo.find({});
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
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

    // Atomic swap + profile sync: assigning the student role must
    // materialise the students-table row in the same commit, otherwise the
    // user never shows up in /students or the /enrollments picker.
    // Removing the student role soft-deactivates the row (status ->
    // 'inactive') instead of deleting it — historical enrollments /
    // invoices / payments FK-reference it — so the user immediately drops
    // out of both lists while their academic history stays intact.
    await this.userRoleRepo.manager.transaction(async (em) => {
      await em.getRepository(UserRole).delete({ user_id: id });

      await em.getRepository(UserRole).save({
        user_id: id,
        role_id: roleId,
        assigned_by: creatorId,
      });

      if (role.slug === 'student') {
        await this.ensureStudentProfile(em, id);
      } else {
        await this.deactivateStudentProfile(em, id);
      }
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