import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../shared/entities/employee.entity';
import { EmployeeDocument } from '../../shared/entities/employee-document.entity';
import { TeacherAvailability } from '../../shared/entities/teacher-availability.entity';
import { LeaveRequest } from '../../shared/entities/leave-request.entity';
import { PayrollPeriod } from '../../shared/entities/payroll-period.entity';
import { PayrollEntry } from '../../shared/entities/payroll-entry.entity';
import { Session } from '../../shared/entities/session.entity'; // Added for payroll calculation
import { LeaveStatus } from '../../common/enums/leave-status.enum';
import { PayrollEntryStatus } from '../../common/enums/payroll-entry-status.enum';
import { PayrollStatus } from '../../common/enums/payroll-status.enum';
import { EmployeeStatus } from '../../common/enums/employee-status.enum';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee) private empRepo: Repository<Employee>,
    @InjectRepository(EmployeeDocument) private docRepo: Repository<EmployeeDocument>,
    @InjectRepository(TeacherAvailability) private availRepo: Repository<TeacherAvailability>,
    @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
    @InjectRepository(PayrollPeriod) private periodRepo: Repository<PayrollPeriod>,
    @InjectRepository(PayrollEntry) private entryRepo: Repository<PayrollEntry>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>, // Injected for session counting
  ) {}

  // ---------- Employees ----------
  async createEmployee(dto: any) {
    return this.empRepo.save(this.empRepo.create(dto));
  }

  async findEmployees(query: any) {
    const qb = this.empRepo.createQueryBuilder('e').leftJoinAndSelect('e.user', 'user');
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });
    if (query.department) qb.andWhere('e.department = :dept', { dept: query.department });
    if (query.type) qb.andWhere('e.employee_type = :type', { type: query.type });
    return qb.getMany();
  }

  async findOneEmployee(id: string) {
    const emp = await this.empRepo.findOne({ where: { id }, relations: ['user'] });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async updateEmployee(id: string, dto: any) {
    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    Object.assign(emp, dto);
    return this.empRepo.save(emp);
  }

  async terminateEmployee(id: string, reason: string, termination_date?: string) {
    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    emp.status = EmployeeStatus.TERMINATED;
    emp.termination_reason = reason;
    emp.termination_date = termination_date ? new Date(termination_date) : new Date();
    return this.empRepo.save(emp);
  }

  // ---------- Documents ----------
  async addDocument(dto: any) {
    return this.docRepo.save(this.docRepo.create(dto));
  }

  async findDocuments(employeeId: string) {
    return this.docRepo.find({ 
      where: { employee: { id: employeeId } },
      order: { created_at: 'DESC' }
    });
  }

  async removeDocument(id: string) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.docRepo.remove(doc);
    return { deleted: true };
  }

  // ---------- Availability ----------
  async setAvailability(dto: any) {
    return this.availRepo.save(this.availRepo.create(dto));
  }

  async findAvailability(employeeId: string) {
    return this.availRepo.find({
      where: { employee: { id: employeeId } },
      order: { day_of_week: 'ASC' },
    });
  }

  // ---------- Leave Requests ----------
  async requestLeave(dto: any) {
    // Auto-compute days_count if not provided
    if (dto.start_date && dto.end_date && !dto.days_count) {
      const start = new Date(dto.start_date);
      const end = new Date(dto.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      dto.days_count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return this.leaveRepo.save(this.leaveRepo.create(dto));
  }

  async findLeaves(query: any) {
    const qb = this.leaveRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'user');
    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.employee_id) qb.andWhere('employee.id = :eid', { eid: query.employee_id });
    return qb.getMany();
  }

  async approveLeave(id: string, approverId: string, note?: string) {
    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    leave.status = LeaveStatus.APPROVED;
    leave.approved_by = approverId;
    leave.approved_at = new Date();
    leave.approval_note = note;
    return this.leaveRepo.save(leave);
  }

  async rejectLeave(id: string, approverId: string, note?: string) {
    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    leave.status = LeaveStatus.REJECTED;
    leave.approved_by = approverId;
    leave.approved_at = new Date();
    leave.approval_note = note;
    return this.leaveRepo.save(leave);
  }

  // ---------- Payroll ----------
  async createPeriod(dto: any) {
    return this.periodRepo.save(this.periodRepo.create(dto));
  }

  async findPeriods() {
    return this.periodRepo.find({ order: { start_date: 'DESC' } });
  }

  async closePeriod(id: string, userId: string) {
    const period = await this.periodRepo.findOne({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === PayrollStatus.CLOSED) {
      throw new BadRequestException('Period is already closed');
    }
    period.status = PayrollStatus.CLOSED;
    period.closed_at = new Date();
    period.closed_by = userId;
    return this.periodRepo.save(period);
  }

  /** SRS 4.10: Auto-calculate teacher payouts from taught hours in the period */
  async calculateTeacherPayroll(periodId: string) {
    const period = await this.periodRepo.findOne({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === PayrollStatus.CLOSED) {
      throw new BadRequestException('Cannot calculate payroll for a closed period');
    }

    const employees = await this.empRepo.find({ 
      where: { status: EmployeeStatus.ACTIVE },
      relations: ['user'],
    });

    for (const emp of employees) {
      // Check if entry already exists to prevent duplicates
      let entry = await this.entryRepo.findOne({ 
        where: { payroll_period: { id: periodId }, employee: { id: emp.id } } 
      });

      if (!entry) {
        // Count sessions taught by this employee's user_id within the period dates
        const sessions = await this.sessionRepo
          .createQueryBuilder('session')
          .innerJoin('session.group', 'group')
          .where('group.teacher_id = :teacherId', { teacherId: emp.user_id })
          .andWhere('session.date >= :startDate', { startDate: period.start_date })
          .andWhere('session.date <= :endDate', { endDate: period.end_date })
          .andWhere('session.cancelled_at IS NULL')
          .getMany();

        const classesTaught = sessions.length;
        let hoursWorked = 0;
        
        for (const s of sessions) {
          if (s.start_time && s.end_time) {
            // Calculate duration in hours
            const start = new Date(`1970-01-01T${s.start_time}Z`);
            const end = new Date(`1970-01-01T${s.end_time}Z`);
            hoursWorked += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
        }

        const baseAmount = emp.salary || 0;
        const hourlyRate = emp.hourly_rate || 0;
        let total = 0;
        
        // Match DB CHECK constraint: chk_pe_total_formula
        if (baseAmount > 0) {
          total = baseAmount; 
        } else if (hourlyRate > 0) {
          total = hoursWorked * hourlyRate;
        }

        entry = this.entryRepo.create({
          payroll_period: { id: periodId },
          employee: { id: emp.id },
          base_amount: baseAmount,
          hours_worked: Math.round(hoursWorked * 100) / 100,
          classes_taught: classesTaught,
          hourly_rate: hourlyRate,
          total_amount: total,
          status: PayrollEntryStatus.DRAFT,
          notes: `Auto-calculated for period ${period.name}`,
        });
        await this.entryRepo.save(entry);
      }
    }
    return { message: 'Payroll entries calculated successfully', count: employees.length };
  }

  async exportPayrollCsv(periodId: string) {
    const entries = await this.entryRepo.find({
      where: { payroll_period: { id: periodId } },
      relations: ['employee', 'employee.user'],
      order: { created_at: 'ASC' },
    });

    const headers = ['Employee Name', 'Department', 'Base Amount', 'Hours Worked', 'Classes Taught', 'Bonus', 'Deductions', 'Total Amount', 'Status'];
    const rows = entries.map(e => [
      `${e.employee?.user?.first_name || ''} ${e.employee?.user?.last_name || ''}`.trim(),
      e.employee?.department || '',
      e.base_amount,
      e.hours_worked,
      e.classes_taught,
      e.bonus || 0,
      e.deductions || 0,
      e.total_amount,
      e.status,
    ]);

    // Properly escape CSV values
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return {
      filename: `payroll_period_${periodId}.csv`,
      csv: csvContent,
    };
  }

  async createPayrollEntry(dto: any) {
    const emp = await this.empRepo.findOne({ where: { id: dto.employee_id } });
    if (!emp) throw new NotFoundException('Employee not found');

    const baseAmount = emp.salary || 0;
    const hourlyRate = emp.hourly_rate || 0;
    const hoursWorked = dto.hours_worked || 0;
    const bonus = dto.bonus || 0;
    const deductions = dto.deductions || 0;

    let total = 0;
    if (baseAmount > 0) {
      total = baseAmount + bonus - deductions;
    } else if (hourlyRate > 0) {
      total = (hoursWorked * hourlyRate) + bonus - deductions;
    } else {
      total = bonus - deductions;
    }

    const entry = this.entryRepo.create({
      payroll_period: { id: dto.payroll_period_id },
      employee: { id: dto.employee_id },
      base_amount: baseAmount,
      hours_worked: hoursWorked,
      classes_taught: dto.classes_taught || 0,
      hourly_rate: hourlyRate,
      bonus: bonus,
      deductions: deductions,
      total_amount: total, // Guaranteed to pass the DB CHECK constraint
      status: dto.status || PayrollEntryStatus.DRAFT,
      notes: dto.notes,
    });

    return this.entryRepo.save(entry);
  }

  async findPayrollEntries(periodId: string) {
    return this.entryRepo.find({
      where: { payroll_period: { id: periodId } },
      relations: ['employee', 'employee.user'],
      order: { created_at: 'ASC' }
    });
  }
}