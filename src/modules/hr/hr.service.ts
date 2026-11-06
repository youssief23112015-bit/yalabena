import {
  Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Employee } from '../../shared/entities/employee.entity';
import { EmployeeDocument } from '../../shared/entities/employee-document.entity';
import { TeacherAvailability } from '../../shared/entities/teacher-availability.entity';
import { LeaveRequest } from '../../shared/entities/leave-request.entity';
import { PayrollPeriod } from '../../shared/entities/payroll-period.entity';
import { PayrollEntry } from '../../shared/entities/payroll-entry.entity';
import { Session } from '../../shared/entities/session.entity';
import { User } from '../../shared/entities/user.entity';
import { LeaveStatus } from '../../common/enums/leave-status.enum';
import { PayrollEntryStatus } from '../../common/enums/payroll-entry-status.enum';
import { PayrollStatus } from '../../common/enums/payroll-status.enum';
import { EmployeeStatus } from '../../common/enums/employee-status.enum';
import { EmployeeType } from '../../common/enums/employee-type.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import {
  exactHours, inclusiveDays, payrollTotal, presentEmployee, presentLeave, presentPayrollEntry,
  rangesOverlap, round2, toMinutes,
} from './hr.helpers';
import { SessionsService } from '../sessions/sessions.service';
import { Group } from '../../shared/entities/group.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { SalesTarget } from '../../shared/entities/sales-target.entity';
import { TeacherEvaluation } from '../../shared/entities/teacher-evaluation.entity';
import { LmsModule as LmsModuleEntity } from '../../shared/entities/lms-module.entity';
import { LmsLesson } from '../../shared/entities/lms-lesson.entity';
import { LmsResource } from '../../shared/entities/lms-resource.entity';
import { LmsLessonProgress } from '../../shared/entities/lms-lesson-progress.entity';

/** The authenticated user (JwtStrategy.validate()). */
export interface HrActor {
  userId: string;
  roles: string[];
  branchId?: string | null;
}

const HR_ADMIN = ['super_admin', 'hr'];
const COMPENSATION_ROLES = ['super_admin', 'hr', 'finance'];
const has = (a: HrActor | undefined, roles: string[]) => !!a?.roles?.some((r) => roles.includes(r));

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee) private empRepo: Repository<Employee>,
    @InjectRepository(EmployeeDocument) private docRepo: Repository<EmployeeDocument>,
    @InjectRepository(TeacherAvailability) private availRepo: Repository<TeacherAvailability>,
    @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
    @InjectRepository(PayrollPeriod) private periodRepo: Repository<PayrollPeriod>,
    @InjectRepository(PayrollEntry) private entryRepo: Repository<PayrollEntry>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(GroupStudent) private groupStudentRepo: Repository<GroupStudent>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(SalesTarget) private salesTargetRepo: Repository<SalesTarget>,
    @InjectRepository(TeacherEvaluation) private evalRepo: Repository<TeacherEvaluation>,
    @InjectRepository(LmsModuleEntity) private lmsModuleRepo: Repository<LmsModuleEntity>,
    @InjectRepository(LmsLesson) private lmsLessonRepo: Repository<LmsLesson>,
    @InjectRepository(LmsResource) private lmsResourceRepo: Repository<LmsResource>,
    @InjectRepository(LmsLessonProgress) private lmsProgressRepo: Repository<LmsLessonProgress>,
    private sessionsService: SessionsService,
  ) {}

  // ---------- helpers ----------

  private canSeeCompensation(actor?: HrActor) {
    return has(actor, COMPENSATION_ROLES);
  }

  /** Branch managers only work with employees of their own branch. HR / admin see all. */
  private branchScope(actor?: HrActor): string | null {
    if (!actor || has(actor, HR_ADMIN)) return null;
    return actor.branchId ?? null;
  }

  private async assertEmployeeInScope(emp: Employee, actor?: HrActor) {
    const b = this.branchScope(actor);
    if (!b) return;
    const user = emp.user ?? (await this.userRepo.findOne({ where: { id: emp.user_id } }));
    // Branchless architecture: users are not branch-scoped
  }

  /** Enforce that the actor is the employee owner or an HR/admin. */
  private async assertEmployeeOwnership(emp: Employee, actor: HrActor) {
    if (has(actor, HR_ADMIN)) return;
    if (emp.user_id === actor.userId) return;
    throw new ForbiddenException('You can only access your own employee record');
  }

  private rethrowUnique(err: any, msg: string): never {
    if (err?.code === '23505') throw new ConflictException(msg);
    throw err;
  }

  // ---------- self ----------

  async getEmployeeByUserId(userId: string, actor?: HrActor) {
    const employee = await this.resolveMyEmployee(userId, actor);
    if (!employee) return null;
    return presentEmployee(employee, true); // it is the caller's own record
  }

  private async ownEmployee(userId: string): Promise<Employee> {
    const e = await this.empRepo.findOne({ where: { user_id: userId } });
    if (!e) throw new NotFoundException('Employee record not found for current user');
    return e;
  }

  // ---------- Employees ----------

  async createEmployee(dto: any) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User account not found');
    if (await this.empRepo.findOne({ where: { user_id: dto.user_id } })) {
      throw new ConflictException('This user already has an employee record');
    }
    if (dto.employee_number && (await this.empRepo.findOne({ where: { employee_number: dto.employee_number } }))) {
      throw new ConflictException(`Employee number "${dto.employee_number}" is already used`);
    }
    if (dto.contract_end && dto.contract_end < dto.contract_start) {
      throw new BadRequestException('contract_end cannot be before contract_start');
    }
    if (dto.employee_type === EmployeeType.HOURLY && !(Number(dto.hourly_rate) > 0)) {
      throw new BadRequestException('hourly_rate is required for hourly employees');
    }

    const saved = await this.empRepo
      .save(
        this.empRepo.create({
          user_id: dto.user_id,
          employee_type: dto.employee_type,
          job_title: dto.job_title.trim(),
          department: dto.department ?? null,
          employee_number: dto.employee_number ?? null,
          contract_start: dto.contract_start,
          contract_end: dto.contract_end ?? null,
          salary: dto.salary ?? null,
          hourly_rate: dto.hourly_rate ?? null,
          currency: dto.currency?.toUpperCase() ?? 'EGP',
          bank_name: dto.bank_name ?? null,
          bank_account: dto.bank_account ?? null,
        } as any),
      )
      .catch((e) => this.rethrowUnique(e, 'Employee already exists (duplicate user or employee number)'));
    return this.findOneEmployee((saved as any).id, { userId: '', roles: ['hr'] });
  }

  async findEmployees(query: any, actor?: HrActor) {
    const qb = this.empRepo.createQueryBuilder('e').leftJoinAndSelect('e.user', 'user');
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });
    if (query.department) qb.andWhere('e.department = :dept', { dept: query.department });
    if (query.type) qb.andWhere('e.employee_type = :type', { type: query.type });
    if (query.search?.trim()) {
      qb.andWhere(
        `(user.first_name ILIKE :q OR user.last_name ILIKE :q OR user.email ILIKE :q
          OR e.job_title ILIKE :q OR e.department ILIKE :q OR e.employee_number ILIKE :q)`,
        { q: `%${query.search.trim()}%` },
      );
    }
    const scope = this.branchScope(actor);
    if (scope) qb.andWhere('user.branch_id = :scope', { scope });
    qb.orderBy('user.first_name', 'ASC').addOrderBy('e.id', 'ASC');

    const canComp = this.canSeeCompensation(actor);
    return (await qb.getMany()).map((e) => presentEmployee(e, canComp));
  }

  async findOneEmployee(id: string, actor?: HrActor) {
    const emp = await this.empRepo.findOne({ where: { id }, relations: ['user'] });
    if (!emp) throw new NotFoundException('Employee not found');
    await this.assertEmployeeInScope(emp, actor);
    return presentEmployee(emp, this.canSeeCompensation(actor));
  }

  async updateEmployee(id: string, dto: any, actor?: HrActor) {
    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    if (emp.status === EmployeeStatus.TERMINATED) {
      throw new BadRequestException('A terminated employee record cannot be edited');
    }
    await this.assertEmployeeInScope(emp, actor);
    if (actor) await this.assertEmployeeOwnership(emp, actor);

    // Explicit whitelist - never Object.assign(dto): user_id, id, termination_* stay protected.
    const allowed = [
      'employee_type', 'job_title', 'department', 'employee_number', 'contract_start', 'contract_end',
      'salary', 'hourly_rate', 'currency', 'bank_name', 'bank_account', 'status',
    ];
    for (const k of allowed) if (dto[k] !== undefined) (emp as any)[k] = dto[k];
    if (dto.currency) emp.currency = String(dto.currency).toUpperCase();

    const start = String(emp.contract_start).slice(0, 10);
    const end = emp.contract_end ? String(emp.contract_end).slice(0, 10) : null;
    if (end && end < start) throw new BadRequestException('contract_end cannot be before contract_start');
    if (emp.employee_type === EmployeeType.HOURLY && !(Number(emp.hourly_rate) > 0)) {
      throw new BadRequestException('hourly_rate is required for hourly employees');
    }
    if (dto.employee_number) {
      const other = await this.empRepo.findOne({ where: { employee_number: dto.employee_number } });
      if (other && other.id !== id) throw new ConflictException(`Employee number "${dto.employee_number}" is already used`);
    }

    await this.empRepo.save(emp).catch((e) => this.rethrowUnique(e, 'Duplicate employee number'));
    return this.findOneEmployee(id, actor);
  }

  async terminateEmployee(id: string, reason: string, termination_date?: string, actor?: HrActor) {
    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    if (emp.status === EmployeeStatus.TERMINATED) throw new BadRequestException('Employee is already terminated');
    await this.assertEmployeeInScope(emp, actor);
    if (actor) await this.assertEmployeeOwnership(emp, actor);
    emp.status = EmployeeStatus.TERMINATED;
    emp.termination_reason = reason;
    emp.termination_date = (termination_date ? termination_date.slice(0, 10) : new Date().toISOString().slice(0, 10)) as any;
    await this.empRepo.save(emp);
    return this.findOneEmployee(id, actor);
  }

  // ---------- Documents ----------

  async addDocument(dto: any, actor?: HrActor) {
    const emp = await this.empRepo.findOne({ where: { id: dto.employee_id } });
    if (!emp) throw new NotFoundException('Employee not found');
    await this.assertEmployeeInScope(emp, actor);
    if (actor) await this.assertEmployeeOwnership(emp, actor);
    return this.docRepo.save(
      this.docRepo.create({
        employee_id: dto.employee_id,
        name: dto.name.trim(),
        file_url: dto.file_url,
        document_type: dto.document_type,
        expiry_date: dto.expiry_date ?? null,
      } as any),
    );
  }

  async findDocuments(employeeId: string, actor?: HrActor) {
    const emp = await this.empRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');
    await this.assertEmployeeInScope(emp, actor);
    return this.docRepo.find({ where: { employee_id: employeeId }, order: { created_at: 'DESC' } });
  }

  async removeDocument(id: string, actor?: HrActor) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const emp = await this.empRepo.findOne({ where: { id: doc.employee_id } });
    if (!emp) throw new NotFoundException('Employee not found');
    await this.assertEmployeeInScope(emp, actor);
    if (actor) await this.assertEmployeeOwnership(emp, actor);
    // Non-admin/HR actors can only remove their own documents.
    if (!has(actor, HR_ADMIN) && emp.user_id !== actor?.userId) {
      throw new ForbiddenException('You can only remove your own documents');
    }
    await this.docRepo.remove(doc);
    return { deleted: true };
  }

  // ---------- Availability ----------

  private assertTimes(start: string, end: string) {
    if (toMinutes(end) <= toMinutes(start)) throw new BadRequestException('end_time must be after start_time');
  }

  /** Teachers may only touch their own slots; HR / admin may touch anyone's. */
  private async resolveAvailabilityOwner(employeeId: string | undefined, actor: HrActor): Promise<Employee> {
    if (has(actor, HR_ADMIN)) {
      if (!employeeId) throw new BadRequestException('employee_id is required');
      const e = await this.empRepo.findOne({ where: { id: employeeId } });
      if (!e) throw new NotFoundException('Employee not found');
      return e;
    }
    const own = await this.ownEmployee(actor.userId);
    if (employeeId && employeeId !== own.id) throw new ForbiddenException('You can only manage your own availability');
    return own;
  }

  private async assertNoOverlap(employeeId: string, day: number, start: string, end: string, exceptId?: string) {
    const same = await this.availRepo.find({ where: { employee_id: employeeId, day_of_week: day } });
    for (const s of same) {
      if (s.id === exceptId) continue;
      if (toMinutes(start) < toMinutes(s.end_time) && toMinutes(s.start_time) < toMinutes(end)) {
        throw new ConflictException('This time range overlaps an existing availability slot');
      }
    }
  }

  async setAvailability(dto: any, actor: HrActor) {
    this.assertTimes(dto.start_time, dto.end_time);
    const owner = await this.resolveAvailabilityOwner(dto.employee_id, actor);
    await this.assertNoOverlap(owner.id, dto.day_of_week, dto.start_time, dto.end_time);
    return this.availRepo.save(
      this.availRepo.create({
        employee_id: owner.id,
        day_of_week: dto.day_of_week,
        start_time: dto.start_time,
        end_time: dto.end_time,
        is_available: dto.is_available ?? true,
        note: dto.note ?? null,
      } as any),
    );
  }

  async findAvailability(employeeId: string, actor: HrActor) {
    // teachers see only their own; HR / admin / academic coordinators see anyone's
    if (!has(actor, [...HR_ADMIN, 'academic'])) {
      const own = await this.ownEmployee(actor.userId);
      if (own.id !== employeeId) throw new ForbiddenException('You can only view your own availability');
    }
    return this.availRepo.find({
      where: { employee_id: employeeId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  private async loadOwnedSlot(id: string, actor: HrActor) {
    const slot = await this.availRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (!has(actor, HR_ADMIN)) {
      const own = await this.ownEmployee(actor.userId);
      if (slot.employee_id !== own.id) throw new ForbiddenException('You can only modify your own availability');
    }
    return slot;
  }

  async updateAvailability(id: string, dto: any, actor: HrActor) {
    const slot = await this.loadOwnedSlot(id, actor);
    for (const key of ['day_of_week', 'start_time', 'end_time', 'is_available', 'note']) {
      if (dto[key] !== undefined) (slot as any)[key] = dto[key];
    }
    this.assertTimes(slot.start_time, slot.end_time);
    await this.assertNoOverlap(slot.employee_id, slot.day_of_week, slot.start_time, slot.end_time, slot.id);
    return this.availRepo.save(slot);
  }

  async deleteAvailability(id: string, actor: HrActor) {
    const slot = await this.loadOwnedSlot(id, actor);
    await this.availRepo.remove(slot);
    return { deleted: true };
  }

  // ---------- Leave Requests ----------

  async findMyLeaves(userId: string, actor?: HrActor) {
    const employee = await this.resolveMyEmployee(userId, actor);
    if (!employee) return [];
    return this.findLeaves({ employee_id: employee.id }, { userId, roles: ['hr'] });
  }

  async requestLeave(dto: any, actor: HrActor) {
    // Who is the leave for? HR/admin may file for anyone; everyone else only for themselves.
    let employee: Employee;
    if (has(actor, HR_ADMIN) && dto.employee_id) {
      const e = await this.empRepo.findOne({ where: { id: dto.employee_id } });
      if (!e) throw new NotFoundException('Employee not found');
      employee = e;
    } else {
      employee = await this.ownEmployee(actor.userId);
      if (dto.employee_id && dto.employee_id !== employee.id) {
        throw new ForbiddenException('You can only request leave for yourself');
      }
    }
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new BadRequestException('Terminated employees cannot request leave');
    }

    const start = String(dto.start_date).slice(0, 10);
    const end = String(dto.end_date).slice(0, 10);
    const days = inclusiveDays(start, end);
    if (!Number.isFinite(days)) throw new BadRequestException('Invalid dates');
    if (days < 1) throw new BadRequestException('end_date cannot be before start_date');
    if (days > 366) throw new BadRequestException('A leave request cannot exceed 366 days');

    const open = await this.leaveRepo.find({ where: { employee_id: employee.id } });
    const clash = open.find(
      (l) =>
        [LeaveStatus.PENDING, LeaveStatus.APPROVED].includes(l.status) &&
        rangesOverlap(start, end, String(l.start_date), String(l.end_date)),
    );
    if (clash) {
      throw new ConflictException(
        `Overlaps an existing ${clash.status} leave (${String(clash.start_date).slice(0, 10)} to ${String(clash.end_date).slice(0, 10)})`,
      );
    }

    const saved = await this.leaveRepo.save(
      this.leaveRepo.create({
        employee_id: employee.id,
        type: dto.type,
        start_date: start,
        end_date: end,
        days_count: days, // always server-computed
        reason: dto.reason ?? null,
        attachment_url: dto.attachment_url ?? null,
      } as any),
    );
    return presentLeave(saved);
  }

  async findLeaves(query: any, actor?: HrActor) {
    const qb = this.leaveRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'user')
      .orderBy('l.created_at', 'DESC');
    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.employee_id) qb.andWhere('employee.id = :eid', { eid: query.employee_id });
    const scope = this.branchScope(actor);
    if (scope) qb.andWhere('user.branch_id = :scope', { scope });
    return (await qb.getMany()).map(presentLeave);
  }

  async cancelMyLeave(id: string, userId: string) {
    const employee = await this.ownEmployee(userId);
    const leave = await this.leaveRepo.findOne({ where: { id, employee_id: employee.id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    // conditional update => safe against a concurrent approve
    const res = await this.leaveRepo.update({ id, status: LeaveStatus.PENDING }, { status: LeaveStatus.CANCELLED });
    if (!res.affected) throw new BadRequestException('Only pending leave requests can be cancelled');
    return presentLeave(await this.leaveRepo.findOne({ where: { id } }));
  }

  private async decideLeave(id: string, actor: HrActor, status: LeaveStatus, note?: string) {
    const leave = await this.leaveRepo.findOne({ where: { id }, relations: ['employee', 'employee.user'] });
    if (!leave) throw new NotFoundException('Leave request not found');

    // Separation of duties: nobody (except super_admin) decides their own request.
    if (leave.employee?.user_id === actor.userId && !has(actor, ['super_admin'])) {
      throw new ForbiddenException('You cannot approve or reject your own leave request');
    }
    // Branch managers decide only for their own branch.
    await this.assertEmployeeInScope(leave.employee, actor);

    const res = await this.leaveRepo.update(
      { id, status: LeaveStatus.PENDING },
      { status, approved_by: actor.userId, approved_at: new Date(), approval_note: note ?? null } as any,
    );
    if (!res.affected) throw new BadRequestException(`Only pending requests can be decided (current: ${leave.status})`);

    return presentLeave(
      await this.leaveRepo.findOne({ where: { id }, relations: ['employee', 'employee.user'] }),
    );
  }

  approveLeave(id: string, actor: HrActor, note?: string) {
    return this.decideLeave(id, actor, LeaveStatus.APPROVED, note);
  }

  rejectLeave(id: string, actor: HrActor, note?: string) {
    return this.decideLeave(id, actor, LeaveStatus.REJECTED, note);
  }

  // ---------- Payroll ----------

  async createPeriod(dto: any, actor?: HrActor) {
    if (actor && !has(actor, COMPENSATION_ROLES)) {
      throw new ForbiddenException('Only HR/finance can create payroll periods');
    }
    const start = String(dto.start_date).slice(0, 10);
    const end = String(dto.end_date).slice(0, 10);
    if (end < start) throw new BadRequestException('end_date cannot be before start_date');
    const existing = await this.periodRepo.find();
    const clash = existing.find((p) => rangesOverlap(start, end, String(p.start_date), String(p.end_date)));
    if (clash) throw new ConflictException(`Overlaps payroll period "${clash.name}"`);
    return this.periodRepo.save(this.periodRepo.create({ name: dto.name.trim(), start_date: start, end_date: end } as any));
  }

  async findPeriods() {
    return this.periodRepo.find({ order: { start_date: 'DESC' } });
  }

  async closePeriod(id: string, userId: string) {
    const period = await this.periodRepo.findOne({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === PayrollStatus.CLOSED) throw new BadRequestException('Period is already closed');
    // conditional on the status we just read => two concurrent closes cannot both succeed
    const res = await this.periodRepo.update(
      { id, status: period.status },
      { status: PayrollStatus.CLOSED, closed_at: new Date(), closed_by: userId } as any,
    );
    if (!res.affected) throw new BadRequestException('Period was changed concurrently; reload and retry');
    return this.periodRepo.findOne({ where: { id } });
  }

  private async openPeriodOrThrow(periodId: string) {
    const period = await this.periodRepo.findOne({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === PayrollStatus.CLOSED) throw new BadRequestException('Payroll period is closed');
    return period;
  }

  /** SRS 4.10: teacher payout from taught hours in the period; fixed-salary staff get their base. */
  async calculateTeacherPayroll(periodId: string) {
    const period = await this.openPeriodOrThrow(periodId);
    const employees = await this.empRepo.find({ where: { status: EmployeeStatus.ACTIVE } });

    let created = 0, updated = 0, skipped = 0;
    for (const emp of employees) {
      const existing = await this.entryRepo.findOne({ where: { payroll_period_id: periodId, employee_id: emp.id } });
      // never overwrite entries HR already approved / paid / disputed
      if (existing && existing.status !== PayrollEntryStatus.DRAFT) { skipped++; continue; }

      const sessions = await this.sessionRepo
        .createQueryBuilder('session')
        .innerJoin('session.group', 'grp')
        .where('grp.teacher_id = :teacherId', { teacherId: emp.user_id })
        .andWhere('session.date >= :startDate', { startDate: period.start_date })
        .andWhere('session.date <= :endDate', { endDate: period.end_date })
        .andWhere('session.cancelled_at IS NULL')
        .getMany();

      let rawHours = 0;
      for (const s of sessions) {
        if (s.start_time && s.end_time) rawHours += (toMinutes(s.end_time) - toMinutes(s.start_time)) / 60;
      }
      const base = Number(emp.salary ?? 0);
      const rate = Number(emp.hourly_rate ?? 0);
      const bonus = Number(existing?.bonus ?? 0);
      const deductions = Number(existing?.deductions ?? 0);
      const hours = base > 0 ? round2(rawHours) : exactHours(round2(rawHours), rate);
      const total = payrollTotal({ base, hours, rate, bonus, deductions });
      const note = `Auto-calculated for period ${period.name}`;

      if (existing) {
        await this.entryRepo.update(existing.id, {
          base_amount: base, hours_worked: hours, classes_taught: sessions.length,
          hourly_rate: rate || null, total_amount: total, notes: existing.notes ?? note,
        } as any);
        updated++;
      } else {
        await this.entryRepo.save(
          this.entryRepo.create({
            payroll_period_id: periodId, employee_id: emp.id, base_amount: base, hours_worked: hours,
            classes_taught: sessions.length, hourly_rate: rate || null, total_amount: total,
            status: PayrollEntryStatus.DRAFT, notes: note,
          } as any),
        );
        created++;
      }
    }
    return { message: 'Payroll entries calculated successfully', count: created + updated, created, updated, skipped };
  }

  /** CSV with a UTF-8 BOM so Excel opens Arabic names correctly. */
  async exportPayrollCsv(periodId: string) {
    const period = await this.periodRepo.findOne({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    const entries = await this.findPayrollEntries(periodId);

    const headers = ['Employee', 'Employee No.', 'Department', 'Base', 'Hours', 'Classes', 'Bonus', 'Deductions', 'Total', 'Status'];
    const esc = (v: unknown) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = entries.map((e: any) => [
      `${e.employee?.user?.first_name ?? ''} ${e.employee?.user?.last_name ?? ''}`.trim(),
      e.employee?.employee_number ?? '',
      e.employee?.department ?? '',
      e.base_amount, e.hours_worked, e.classes_taught, e.bonus ?? 0, e.deductions ?? 0, e.total_amount, e.status,
    ]);
    const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
    const safeName = String(period.name).replace(/[^A-Za-z0-9_-]+/g, '_');
    return { filename: `payroll_${safeName}.csv`, csv };
  }

  async createPayrollEntry(dto: any, actor?: HrActor) {
    await this.openPeriodOrThrow(dto.payroll_period_id);
    const emp = await this.empRepo.findOne({ where: { id: dto.employee_id } });
    if (!emp) throw new NotFoundException('Employee not found');
    if (emp.status === EmployeeStatus.TERMINATED) throw new BadRequestException('Employee is terminated');
    await this.assertEmployeeInScope(emp, actor);
    if (actor) await this.assertEmployeeOwnership(emp, actor);
    if (await this.entryRepo.findOne({ where: { payroll_period_id: dto.payroll_period_id, employee_id: emp.id } })) {
      throw new ConflictException('A payroll entry already exists for this employee in this period');
    }

    // numeric columns arrive from pg as strings - convert before doing arithmetic
    const base = Number(emp.salary ?? 0);
    const rate = Number(emp.hourly_rate ?? 0);
    const bonus = round2(Number(dto.bonus ?? 0));
    const deductions = round2(Number(dto.deductions ?? 0));
    const requestedHours = round2(Number(dto.hours_worked ?? 0));
    const hours = base > 0 ? requestedHours : exactHours(requestedHours, rate);
    const total = payrollTotal({ base, hours, rate, bonus, deductions });
    if (total < 0) throw new BadRequestException('Deductions exceed the total earnings');

    const saved = await this.entryRepo
      .save(
        this.entryRepo.create({
          payroll_period_id: dto.payroll_period_id,
          employee_id: emp.id,
          base_amount: base,
          hours_worked: hours,
          classes_taught: dto.classes_taught ?? 0,
          hourly_rate: rate || null,
          bonus, deductions,
          total_amount: total,
          status: dto.status ?? PayrollEntryStatus.DRAFT,
          notes: dto.notes ?? null,
        } as any),
      )
      .catch((e) => this.rethrowUnique(e, 'A payroll entry already exists for this employee in this period'));
    return presentPayrollEntry(saved);
  }

  async findPayrollEntries(periodId: string) {
    const rows = await this.entryRepo.find({
      where: { payroll_period_id: periodId },
      relations: ['employee', 'employee.user'],
      order: { created_at: 'ASC' },
    });
    return rows.map(presentPayrollEntry);
  }

  // =========================================================================
  // Employee Self-Service
  // =========================================================================

  /** Resolve the authenticated user's employee record. Returns null for admin roles without an employee record. */
  private async resolveMyEmployee(userId: string, actor?: HrActor): Promise<Employee | null> {
    let emp = await this.empRepo.findOne({ where: { user_id: userId }, relations: ['user'] });
    if (emp) return emp;

    // Admins (super_admin / hr) may not have an employee record — return null instead of throwing.
    if (actor && has(actor, HR_ADMIN)) return null;

    // Auto-resolve: create a basic employee record for active staff/teachers who are missing one,
    // so self-service endpoints (/hr/me, /hr/my-leaves, ...) resolve instead of 403/404.
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('Employee record not found for current user');
    }

    emp = this.empRepo.create({
      user_id: user.id,
      user,
      employee_type: this.defaultEmployeeType(actor?.roles ?? []),
      job_title: this.defaultJobTitle(actor?.roles ?? []),
      department: null,
      contract_start: new Date(),
      status: EmployeeStatus.ACTIVE,
    });

    try {
      return await this.empRepo.save(emp);
    } catch (e: any) {
      // Concurrency: another request created the record for this user in the meantime.
      if (e?.code === '23505') {
        const existing = await this.empRepo.findOne({ where: { user_id: userId }, relations: ['user'] });
        if (existing) return existing;
      }
      throw e;
    }
  }

  private defaultEmployeeType(roles: string[]): EmployeeType {
    return roles.includes('teacher') ? EmployeeType.HOURLY : EmployeeType.FULL_TIME;
  }

  private defaultJobTitle(roles: string[]): string {
    if (roles.includes('teacher')) return 'Teacher';
    if (roles.includes('academic')) return 'Academic Staff';
    if (roles.includes('sales')) return 'Sales';
    if (roles.includes('branch_manager')) return 'Branch Manager';
    if (roles.includes('finance')) return 'Finance';
    return 'Staff';
  }

  /** GET /hr/me/profile — own employee record (no compensation unless authorized). */
  async getMyProfile(userId: string, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return { id: null, user_id: userId, job_title: null, department: null, status: null, employee_number: null, employee_type: null, contract_start: null };
    return presentEmployee(emp, false);
  }

  /** PATCH /hr/me/profile — update own permitted fields only. */
  async updateMyProfile(userId: string, dto: any, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) throw new ForbiddenException('Self-service profile updates require an employee record');
    // Non-compensation, non-identifier fields only.
    const allowed = ['job_title', 'department'];
    for (const k of allowed) if (dto[k] !== undefined) (emp as any)[k] = dto[k];
    await this.empRepo.save(emp);

    // Phone lives on the User entity.
    if (dto.phone !== undefined) {
      await this.userRepo.update(emp.user_id, { phone: dto.phone });
    }

    const updated = await this.empRepo.findOne({ where: { id: emp.id }, relations: ['user'] });
    return presentEmployee(updated!, false);
  }

  /** GET /hr/me/groups — groups the teacher is assigned to teach. */
  async getMyGroups(userId: string, roles: string[] = [], actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const isTeacher = roles.includes('teacher');
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    let groups: Group[];
    if (isSuperAdmin || isAcademic) {
      groups = await this.groupRepo.find({
        relations: ['course', 'teacher', 'schedules'],
        order: { created_at: 'DESC' },
      });
    } else if (isTeacher) {
      groups = await this.groupRepo.find({
        where: { teacher_id: emp.user_id },
        relations: ['course', 'teacher', 'schedules'],
        order: { created_at: 'DESC' },
      });
    } else {
      groups = [];
    }

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course,
      teacher: g.teacher,
      schedules: g.schedules,
      status: g.status,
      start_date: g.start_date,
      end_date: g.end_date,
      mode: g.mode,
      is_teacher: g.teacher_id === emp.user_id,
    }));
  }

  /** GET /hr/me/students — students in the teacher's assigned groups. */
  async getMyStudents(userId: string, roles: string[] = [], actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const isTeacher = roles.includes('teacher');
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    if (!isTeacher && !isAcademic && !isSuperAdmin) return [];

    // Groups the user teaches (teacher) or all groups (academic/super_admin).
    const groupWhere = isTeacher ? { teacher_id: emp.user_id } : {};
    const groups = await this.groupRepo.find({ where: groupWhere });
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length === 0) return [];

    // Roster: active group_students ∪ ACTIVE enrollments.
    const rosterRows: { student_id: string }[] = await this.groupRepo.query(
      `SELECT student_id FROM group_students WHERE group_id = ANY($1::uuid[]) AND status = 'active'
       UNION
       SELECT student_id FROM enrollments WHERE group_id = ANY($2::uuid[]) AND LOWER(CAST(status AS TEXT)) = 'active'`,
      [groupIds, groupIds],
    );
    const studentIds = [...new Set(rosterRows.map((r) => r.student_id))];
    if (studentIds.length === 0) return [];

    const students = await this.studentRepo.find({
      where: { id: In(studentIds) },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });

    return students.map((s) => ({
      id: s.id,
      student_number: s.student_number,
      current_level: s.current_level,
      status: s.status,
      user: s.user,
      enrolled_at: s.created_at,
    }));
  }

  /** GET /hr/me/sessions — teaching sessions for the authenticated teacher. */
  async getMySessions(userId: string, roles: string[] = [], query: any = {}, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const isTeacher = roles.includes('teacher');
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    if (!isTeacher && !isAcademic && !isSuperAdmin) return [];

    const sessions = await this.sessionsService.findAll(
      undefined,
      { id: emp.user_id, userId: emp.user_id, roles },
    );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    return sessions
      .filter((s) => {
        if (query.upcoming === 'true') return String(s.date) >= today && !s.cancelled_at;
        if (query.completed === 'true') return String(s.date) < today && !s.cancelled_at;
        return !s.cancelled_at;
      })
      .map((s) => ({
        id: s.id,
        group_id: s.group_id,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        mode: s.mode,
        topic: s.topic,
        zoom_join_url: s.zoom_join_url,
        cancelled_at: s.cancelled_at,
        attendance_locked: s.attendance_locked,
        is_upcoming: String(s.date) >= today && !s.cancelled_at,
        is_completed: String(s.date) < today && !s.cancelled_at,
      }));
  }

  /** GET /hr/me/teaching-hours — own teaching hours from payroll entries. */
  async getMyTeachingHours(userId: string, period_id?: string, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return { employee_id: null, total_hours: 0, total_amount: 0, total_classes: 0, periods: [] };
    const where: any = { employee_id: emp.id };
    if (period_id) where.payroll_period_id = period_id;

    const entries = await this.entryRepo.find({
      where,
      relations: ['payroll_period'],
      order: { created_at: 'DESC' },
    });

    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours_worked ?? 0), 0);
    const totalAmount = entries.reduce((sum, e) => sum + Number(e.total_amount ?? 0), 0);
    const totalClasses = entries.reduce((sum, e) => sum + Number(e.classes_taught ?? 0), 0);

    return {
      employee_id: emp.id,
      total_hours: round2(totalHours),
      total_amount: round2(totalAmount),
      total_classes: totalClasses,
      periods: entries.map((e) => ({
        period_id: e.payroll_period_id,
        period_name: e.payroll_period?.name,
        hours_worked: e.hours_worked,
        classes_taught: e.classes_taught,
        total_amount: e.total_amount,
        status: e.status,
      })),
    };
  }

  /** GET /hr/me/lms — LMS modules/lessons/resources for the teacher's groups. */
  async getMyLmsInfo(userId: string, roles: string[] = [], actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const isTeacher = roles.includes('teacher');
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    if (!isTeacher && !isAcademic && !isSuperAdmin) return [];

    const groups = await this.groupRepo.find({
      where: isTeacher ? { teacher_id: emp.user_id } : {},
      relations: ['course'],
    });

    const result: any[] = [];
    for (const g of groups) {
      const modules = await this.lmsModuleRepo.find({
        where: { group_id: g.id },
        relations: ['lessons', 'lessons.resources'],
        order: { order: 'ASC' },
      });
      result.push({
        group_id: g.id,
        group_name: g.name,
        course: g.course,
        modules: modules.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          order: m.order,
          is_published: m.is_published,
          lessons: (m.lessons ?? []).map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            duration_minutes: l.duration_minutes,
            order: l.order,
            is_published: l.is_published,
            resources: (l.resources ?? []).map((r) => ({
              id: r.id,
              name: r.name,
              type: r.type,
              file_url: r.file_url,
              external_url: r.external_url,
              access_control: r.access_control,
            })),
          })),
        })),
      });
    }
    return result;
  }

  /** GET /hr/me/evaluations — teacher evaluations for the authenticated teacher. */
  async getMyEvaluations(userId: string, roles: string[] = [], actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const isTeacher = roles.includes('teacher');
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    if (!isTeacher && !isAcademic && !isSuperAdmin) return [];

    const evaluations = await this.evalRepo.find({
      where: isTeacher ? { teacher_id: emp.user_id } : {},
      relations: ['group', 'student', 'teacher'],
      order: { created_at: 'DESC' },
    });

    return evaluations.map((e) => ({
      id: e.id,
      group_id: e.group_id,
      student_id: e.student_id,
      teacher_id: e.teacher_id,
      term: e.term,
      overall_comment: e.overall_comment,
      is_shared_with_student: e.is_shared_with_student,
      created_at: e.created_at,
      updated_at: e.updated_at,
    }));
  }

  /** GET /hr/me/payroll — own payroll entries across periods. */
  async getMyPayrollEntries(userId: string, query: any = {}, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    const where: any = { employee_id: emp.id };
    if (query.period_id) where.payroll_period_id = query.period_id;

    const entries = await this.entryRepo.find({
      where,
      relations: ['payroll_period', 'employee', 'employee.user'],
      order: { created_at: 'DESC' },
    });

    return entries.map((e) => ({
      id: e.id,
      employee_id: e.employee_id,
      period_id: e.payroll_period_id,
      period_name: e.payroll_period?.name,
      period_start: e.payroll_period?.start_date,
      period_end: e.payroll_period?.end_date,
      base_amount: e.base_amount,
      hours_worked: e.hours_worked,
      classes_taught: e.classes_taught,
      bonus: e.bonus,
      deductions: e.deductions,
      hourly_rate: e.hourly_rate,
      total_amount: e.total_amount,
      status: e.status,
      notes: e.notes,
    }));
  }

  /** GET /hr/me/documents — own employee documents. */
  async getMyDocuments(userId: string, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return [];
    return this.docRepo.find({
      where: { employee_id: emp.id },
      order: { created_at: 'DESC' },
    });
  }

  /** POST /hr/me/documents — add own document. */
  async addMyDocument(userId: string, dto: any, actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) throw new ForbiddenException('Self-service documents require an employee record');
    return this.docRepo.save(
      this.docRepo.create({
        employee_id: emp.id,
        name: dto.name.trim(),
        file_url: dto.file_url,
        document_type: dto.document_type,
        expiry_date: dto.expiry_date ?? null,
      } as any),
    );
  }

  /** GET /hr/me/leads — sales leads assigned to the authenticated user. */
  async getMyLeads(userId: string, roles: string[] = []) {
    const isSales = roles.includes('sales');
    const isSuperAdmin = roles.includes('super_admin');
    const isBranchManager = roles.includes('branch_manager');

    if (!isSales && !isSuperAdmin && !isBranchManager) return [];

    const leads = await this.leadRepo.find({
      where: { assigned_to: userId },
      relations: ['assigned_agent'],
      order: { created_at: 'DESC' },
    });

    return leads.map((l) => ({
      id: l.id,
      first_name: l.first_name,
      last_name: l.last_name,
      phone: l.phone,
      email: l.email,
      status: l.status,
      source: l.source,
      level_interest: l.level_interest,
      placement_score: l.placement_score,
      placement_level: l.placement_level,
      converted_to_student_id: l.converted_to_student_id,
      converted_at: l.converted_at,
      assigned_to: l.assigned_to,
      created_at: l.created_at,
      updated_at: l.updated_at,
    }));
  }

  /** GET /hr/me/sales-targets — sales targets for the authenticated user. */
  async getMySalesTargets(userId: string, roles: string[] = []) {
    const isSales = roles.includes('sales');
    const isSuperAdmin = roles.includes('super_admin');
    const isBranchManager = roles.includes('branch_manager');

    if (!isSales && !isSuperAdmin && !isBranchManager) return [];

    const targets = await this.salesTargetRepo.find({
      where: { agent_id: userId },
      order: { year: 'DESC', month: 'DESC' },
    });

    return targets.map((t) => ({
      id: t.id,
      month: t.month,
      year: t.year,
      target_amount: t.target_amount,
      target_conversions: t.target_conversions,
      achieved_amount: t.achieved_amount,
      achieved_conversions: t.achieved_conversions,
      conversion_rate: t.target_conversions > 0
        ? round2((t.achieved_conversions / t.target_conversions) * 100)
        : 0,
      amount_achievement: t.target_amount > 0
        ? round2((t.achieved_amount / t.target_amount) * 100)
        : 0,
    }));
  }

  /** GET /hr/me/academic — academic responsibilities for the authenticated user. */
  async getMyAcademicData(userId: string, roles: string[] = [], actor?: HrActor) {
    const emp = await this.resolveMyEmployee(userId, actor);
    if (!emp) return { groups: [], evaluations: [] };
    const isAcademic = roles.includes('academic');
    const isSuperAdmin = roles.includes('super_admin');

    if (!isAcademic && !isSuperAdmin) return { groups: [], evaluations: [] };

    // Academic responsibilities: groups they oversee, evaluations, sessions.
    const groups = await this.groupRepo.find({
      relations: ['course', 'teacher', 'schedules'],
      order: { created_at: 'DESC' },
    });

    const evaluations = await this.evalRepo.find({
      relations: ['group', 'student', 'teacher'],
      order: { created_at: 'DESC' },
    });

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        course: g.course,
        teacher: g.teacher,
        schedules: g.schedules,
        status: g.status,
      })),
      evaluations: evaluations.map((e) => ({
        id: e.id,
        group_id: e.group_id,
        student_id: e.student_id,
        teacher_id: e.teacher_id,
        term: e.term,
        overall_comment: e.overall_comment,
        is_shared_with_student: e.is_shared_with_student,
        created_at: e.created_at,
      })),
    };
  }
}
