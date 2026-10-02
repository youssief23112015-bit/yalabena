import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from '../../shared/entities/activity.entity';
import { ActivityRegistration } from '../../shared/entities/activity-registration.entity';
import { ActivityPhoto } from '../../shared/entities/activity-photo.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';
import { ActivityStatus } from '../../common/enums/activity-status.enum';
import {
  AuthUser,
  assertBranchAccess,
  effectiveBranchFilter,
} from '../../common/utils/branch-scope';
import { FinanceService } from '../finance/finance.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { RegisterActivityDto } from './dto/register-activity.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AddPhotoDto } from './dto/add-photo.dto';
import { PayRegistrationDto } from './dto/pay-registration.dto';

/** Registration states that occupy a capacity seat. */
const OCCUPYING_STATUSES = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
];

/** Roles that may register a student other than themselves. */
const STAFF_ROLES = [
  'super_admin',
  'branch_manager',
  'sales',
  'academic',
  'teacher',
  'finance',
];

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityPhoto) private readonly photoRepo: Repository<ActivityPhoto>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepo: Repository<GroupStudent>,
    private readonly finance: FinanceService,
  ) {}

  // ─── LOOKUP HELPERS ───

  private actorId(user: AuthUser): string {
    return user.userId ?? user.id;
  }

  private async loadActivity(id: string, user: AuthUser): Promise<Activity> {
    const activity = await this.repo.findOne({
      where: { id },
      relations: [
        'branch',
        'registrations',
        'registrations.student',
        'registrations.student.user',
        'photos',
      ],
    });
    if (!activity) throw new NotFoundException('Activity not found');
    assertBranchAccess(user, activity.branch_id);
    return activity;
  }

  /** Resolve the student a registration applies to (self-service or staff pick). */
  private async resolveStudent(user: AuthUser, studentId?: string): Promise<Student> {
    const roles = user.roles ?? [];
    const isSelfServiceOnly =
      roles.includes('student') && !roles.some((r) => STAFF_ROLES.includes(r));

    if (studentId) {
      if (isSelfServiceOnly) {
        const own = await this.studentRepo.findOne({
          where: { user_id: this.actorId(user) },
        });
        if (!own || own.id !== studentId) {
          throw new ForbiddenException('You can only register yourself for activities');
        }
      }
      const student = await this.studentRepo.findOne({
        where: { id: studentId },
        relations: ['user'],
      });
      if (!student) throw new NotFoundException('Student not found');
      return student;
    }

    const student = await this.studentRepo.findOne({
      where: { user_id: this.actorId(user) },
      relations: ['user'],
    });
    if (!student) {
      throw new NotFoundException('No student profile is linked to this account');
    }
    return student;
  }

  private async occupyingCount(activityId: string): Promise<number> {
    return this.regRepo.count({
      where: { activity_id: activityId, status: In(OCCUPYING_STATUSES) },
    });
  }


  // ─── ACTIVITIES (SRS 4.11) ───

  async create(dto: CreateActivityDto, user: AuthUser) {
    const branchFilter = effectiveBranchFilter(user, dto.branch_id);
    if (branchFilter && branchFilter !== dto.branch_id) {
      throw new ForbiddenException('Cannot create activities outside your branch');
    }
    const activity = this.repo.create({
      ...dto,
      date: new Date(dto.date) as any,
      created_by: this.actorId(user),
    });
    const saved = await this.repo.save(activity);
    return this.loadActivity(saved.id, user);
  }

  async findAll(query: ActivityQueryDto, user: AuthUser) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.branch', 'branch');

    const branchFilter = effectiveBranchFilter(user, query.branch_id);
    if (branchFilter) qb.andWhere('a.branch_id = :branchId', { branchId: branchFilter });

    if (query.type) qb.andWhere('a.type = :type', { type: query.type });
    if (query.status) qb.andWhere('a.status = :status', { status: query.status });

    if (query.level) {
      // Show activities that are open to all / untargeted, or that explicitly
      // include this level in their targeting list.
      qb.andWhere(
        '(a.is_open_to_all = TRUE OR a.target_levels IS NULL OR jsonb_array_length(a.target_levels) = 0 OR a.target_levels @> :lvl)',
        { lvl: JSON.stringify([query.level]) },
      );
    }

    if (query.search) {
      qb.andWhere('(a.title ILIKE :q OR a.description ILIKE :q)', {
        q: `%${query.search}%`,
      });
    }

    const activities = await qb
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.start_time', 'ASC')
      .getMany();
    await this.attachRegisteredCounts(activities);
    return activities;
  }

  async findOne(id: string, user: AuthUser) {
    const activity = await this.loadActivity(id, user);
    await this.attachRegisteredCounts([activity]);
    return activity;
  }

  /** Adds `registered_count` (excludes cancelled) to each activity. */
  private async attachRegisteredCounts(activities: Activity[]) {
    const ids = activities.map((a) => a.id);
    const counts = ids.length
      ? await this.regRepo
          .createQueryBuilder('r')
          .select('r.activity_id', 'activity_id')
          .addSelect('COUNT(*)', 'count')
          .where('r.activity_id IN (:...ids)', { ids })
          .andWhere('r.status != :cancelled', { cancelled: RegistrationStatus.CANCELLED })
          .groupBy('r.activity_id')
          .getRawMany()
      : [];
    const countMap = new Map(counts.map((c) => [c.activity_id, Number(c.count)]));
    for (const activity of activities) {
      (activity as any).registered_count = countMap.get(activity.id) ?? 0;
    }
    return activities;
  }

  async update(id: string, dto: UpdateActivityDto, user: AuthUser) {
    const activity = await this.loadActivity(id, user);

    Object.assign(activity, dto);
    if (dto.date) (activity as any).date = new Date(dto.date);

    const occupied = await this.occupyingCount(id);
    if (dto.capacity !== undefined && dto.capacity < occupied) {
      throw new BadRequestException(
        `Capacity cannot be below the ${occupied} existing registrations`,
      );
    }

    // Keep the derived FULL status in sync with capacity changes.
    if (
      activity.status !== ActivityStatus.CANCELLED &&
      activity.status !== ActivityStatus.COMPLETED
    ) {
      if (occupied >= activity.capacity) {
        activity.status = ActivityStatus.FULL;
      } else if (activity.status === ActivityStatus.FULL) {
        activity.status = ActivityStatus.UPCOMING;
      }
    }

    await this.repo.save(activity);
    return this.findOne(id, user);
  }

  async remove(id: string, user: AuthUser) {
    const activity = await this.loadActivity(id, user);
    await this.repo.remove(activity);
    return { id, deleted: true };
  }


  // ─── REGISTRATION + LEVEL/GROUP TARGETING (SRS 4.11) ───

  async register(activityId: string, dto: RegisterActivityDto, user: AuthUser) {
    const activity = await this.loadActivity(activityId, user);
    const student = await this.resolveStudent(user, dto.student_id);

    if (
      activity.status === ActivityStatus.CANCELLED ||
      activity.status === ActivityStatus.COMPLETED
    ) {
      throw new BadRequestException('Registration is closed for this activity');
    }

    const existing = await this.regRepo.findOne({
      where: { activity_id: activity.id, student_id: student.id },
    });
    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Student is already registered for this activity');
    }

    // Branch rule: a student may only join their own branch's activity.
    if (student.branch_id && activity.branch_id && student.branch_id !== activity.branch_id) {
      throw new BadRequestException('Student belongs to a different branch than this activity');
    }

    // Level/group targeting rules (skipped when the activity is open to all).
    if (!activity.is_open_to_all) {
      const levels = activity.target_levels ?? [];
      const groups = activity.target_groups ?? [];

      if (levels.length || groups.length) {
        const levelMatch = !!student.current_level && levels.includes(student.current_level);
        const groupMatch = groups.length
          ? Boolean(
              await this.groupStudentRepo.findOne({
                where: {
                  student_id: student.id,
                  group_id: In(groups),
                  status: 'active',
                },
              }),
            )
          : false;

        if (!levelMatch && !groupMatch) {
          throw new BadRequestException(
            levels.length && groups.length
              ? 'Student matches neither the targeted levels nor the targeted groups for this activity'
              : levels.length
                ? `Activity targets levels: ${levels.join(', ')} (student is ${student.current_level ?? 'unassigned'})`
                : 'Activity is restricted to specific student groups',
          );
        }
      }
    }

    const occupied = await this.occupyingCount(activity.id);
    if (occupied >= activity.capacity) {
      if (activity.status !== ActivityStatus.FULL) {
        activity.status = ActivityStatus.FULL;
        await this.repo.save(activity);
      }
      throw new BadRequestException(`Activity is full (capacity ${activity.capacity})`);
    }

    const fee = Number(activity.fee ?? 0);
    const registration =
      existing ?? this.regRepo.create({ activity_id: activity.id, student_id: student.id });
    registration.status = RegistrationStatus.REGISTERED;
    registration.paid_amount = dto.mark_paid ? fee : Number(registration.paid_amount ?? 0);
    const saved = await this.regRepo.save(registration);

    // Finance integration: book the optional fee into the ledger.
    if (fee > 0 && dto.mark_paid && !saved.payment_id) {
      const tx = await this.finance.recordActivityFee({
        branch_id: activity.branch_id,
        amount: fee,
        description: `Activity fee — ${activity.title} (${student.student_number})`,
        created_by: this.actorId(user),
      });
      saved.payment_id = tx?.id ?? null;
      await this.regRepo.save(saved);
    }

    // Auto-promote to FULL when the last seat is taken.
    if (occupied + 1 >= activity.capacity && activity.status !== ActivityStatus.FULL) {
      activity.status = ActivityStatus.FULL;
      await this.repo.save(activity);
    }

    return this.findOne(activity.id, user);
  }

  async cancelRegistration(registrationId: string, user: AuthUser) {
    const registration = await this.regRepo.findOne({
      where: { id: registrationId },
      relations: ['activity'],
    });
    if (!registration) throw new NotFoundException('Registration not found');
    assertBranchAccess(user, registration.activity?.branch_id);

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration is already cancelled');
    }
    registration.status = RegistrationStatus.CANCELLED;
    await this.regRepo.save(registration);

    // Free the seat and reopen registration if the activity was FULL.
    const activity = registration.activity;
    if (activity && activity.status === ActivityStatus.FULL) {
      const occupied = await this.occupyingCount(activity.id);
      if (occupied < activity.capacity) {
        activity.status = ActivityStatus.UPCOMING;
        await this.repo.save(activity);
      }
    }
    return registration;
  }

 

  /** Collect the optional activity fee and book it in the Finance ledger. */
  async payRegistration(registrationId: string, dto: PayRegistrationDto, user: AuthUser) {
    const registration = await this.regRepo.findOne({
      where: { id: registrationId },
      relations: ['activity', 'student', 'student.user'],
    });
    if (!registration) throw new NotFoundException('Registration not found');
    assertBranchAccess(user, registration.activity?.branch_id);

    const fee = Number(registration.activity?.fee ?? 0);
    if (fee <= 0) throw new BadRequestException('This activity has no fee');
    const alreadyPaid = Number(registration.paid_amount ?? 0);
    const outstanding = fee - alreadyPaid;
    if (outstanding <= 0) throw new BadRequestException('Fee is already fully paid');

    const amount = Math.min(Number(dto.amount ?? outstanding), outstanding);

    const tx = await this.finance.recordActivityFee({
      branch_id: registration.activity!.branch_id,
      amount,
      description: `Activity fee — ${registration.activity!.title} (${
        registration.student?.student_number ?? registration.student_id
      })`,
      created_by: this.actorId(user),
    });

    registration.paid_amount = alreadyPaid + amount;
    registration.payment_id = tx?.id ?? registration.payment_id;
    return this.regRepo.save(registration);
  }

  // ─── ATTENDANCE (SRS 4.11) ───

  async getAttendance(activityId: string, user: AuthUser) {
    const activity = await this.loadActivity(activityId, user);
    const registrations = activity.registrations ?? [];
    return {
      activity_id: activity.id,
      title: activity.title,
      capacity: activity.capacity,
      records: registrations.map((r) => ({
        registration_id: r.id,
        student_id: r.student_id,
        student: r.student,
        status: r.status,
        paid_amount: r.paid_amount,
        registered_at: r.registered_at,
      })),
      summary: this.attendanceSummary(registrations),
    };
  }

  async markAttendance(activityId: string, dto: MarkAttendanceDto, user: AuthUser) {
    const activity = await this.loadActivity(activityId, user);

    const records = dto.records?.length
      ? dto.records
      : dto.student_id && dto.status
        ? [{ student_id: dto.student_id, status: dto.status }]
        : null;
    if (!records) {
      throw new BadRequestException(
        'Provide attendance records or a single student/status pair',
      );
    }

    const allowed = new Set<string>([
      RegistrationStatus.REGISTERED,
      RegistrationStatus.ATTENDED,
      RegistrationStatus.NO_SHOW,
    ]);
    const byStudent = new Map((activity.registrations ?? []).map((r) => [r.student_id, r]));

    const updated: ActivityRegistration[] = [];
    const errors: string[] = [];

    for (const record of records) {
      if (!allowed.has(record.status)) {
        errors.push(`Invalid attendance status "${record.status}"`);
        continue;
      }
      const registration = byStudent.get(record.student_id);
      if (!registration || registration.status === RegistrationStatus.CANCELLED) {
        errors.push(`Student ${record.student_id} is not registered for this activity`);
        continue;
      }
      registration.status = record.status;
      updated.push(registration);
    }

    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }

    await this.regRepo.save(updated);
    return this.getAttendance(activity.id, user);
  }

  private attendanceSummary(registrations: ActivityRegistration[]) {
    const summary = {
      registered: 0,
      attended: 0,
      no_show: 0,
      cancelled: 0,
      total: registrations.length,
    };
    for (const r of registrations) {
      if (r.status === RegistrationStatus.REGISTERED) summary.registered++;
      else if (r.status === RegistrationStatus.ATTENDED) summary.attended++;
      else if (r.status === RegistrationStatus.NO_SHOW) summary.no_show++;
      else if (r.status === RegistrationStatus.CANCELLED) summary.cancelled++;
    }
    return summary;
  }

  // ─── PHOTO GALLERY (SRS 4.11) ───

  async addPhoto(activityId: string, dto: AddPhotoDto, user: AuthUser) {
    const activity = await this.loadActivity(activityId, user);
    const photo = await this.photoRepo.save(
      this.photoRepo.create({
        activity_id: activity.id,
        file_url: dto.file_url,
        caption: dto.caption,
        uploaded_by: this.actorId(user),
      }),
    );
    return photo;
  }

  async removePhoto(photoId: string, user: AuthUser) {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId },
      relations: ['activity'],
    });
    if (!photo) throw new NotFoundException('Photo not found');
    assertBranchAccess(user, photo.activity?.branch_id);
    await this.photoRepo.remove(photo);
    return { id: photoId, deleted: true };
  }
}
