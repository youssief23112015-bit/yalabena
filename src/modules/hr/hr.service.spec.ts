import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { HrService, HrActor } from './hr.service';
import { LeaveStatus } from '../../common/enums/leave-status.enum';
import { PayrollStatus } from '../../common/enums/payroll-status.enum';

/** Tiny in-memory repository: flat `where` matching, conditional update, optional relation joins. */
class Repo {
  rows: any[] = [];
  n = 0;
  constructor(private joins: Record<string, (r: any) => any> = {}) {}
  private m(r: any, w: any) { return Object.entries(w ?? {}).every(([k, v]) => r[k] === v); }
  create(o: any) { return { ...o }; }
  async save(o: any) {
    if (!o.id) { o.id = `id-${++this.n}-${Math.random()}`; o.created_at = new Date(); if (o.status === undefined && 'type' in o && 'start_date' in o) o.status = 'pending'; this.rows.push({ ...o }); }
    else { const i = this.rows.findIndex((r) => r.id === o.id); this.rows[i] = { ...this.rows[i], ...o }; }
    return { ...o };
  }
  private out(r: any, rel?: string[]) {
    const c = { ...r };
    for (const k of rel ?? []) { const top = k.split('.')[0]; if (this.joins[top]) c[top] = this.joins[top](r); }
    return c;
  }
  async findOne(o: any) { const r = this.rows.find((x) => this.m(x, o.where)); return r ? this.out(r, o.relations) : null; }
  async find(o: any = {}) { return this.rows.filter((x) => this.m(x, o.where)).map((r) => this.out(r, o.relations)); }
  async update(crit: any, patch: any) {
    const c = typeof crit === 'string' ? { id: crit } : crit;
    let affected = 0;
    for (const r of this.rows) if (this.m(r, c)) { Object.assign(r, patch); affected++; }
    return { affected };
  }
  async remove(o: any) { this.rows = this.rows.filter((r) => r.id !== o.id); return o; }
}

const HR: HrActor = { userId: 'u-hr', roles: ['hr'], branchId: null };
const ADMIN: HrActor = { userId: 'u-admin', roles: ['super_admin'], branchId: null };
const TEACHER: HrActor = { userId: 'u-t1', roles: ['teacher'], branchId: 'br-A' };
const TEACHER2: HrActor = { userId: 'u-t2', roles: ['teacher'], branchId: 'br-A' };
const MGR_A: HrActor = { userId: 'u-mgrA', roles: ['branch_manager'], branchId: 'br-A' };
const MGR_B: HrActor = { userId: 'u-mgrB', roles: ['branch_manager'], branchId: 'br-B' };

describe('HrService workflows', () => {
  let svc: HrService;
  let users: Repo, emps: Repo, leaves: Repo, avail: Repo, periods: Repo, entries: Repo;

  beforeEach(() => {
    users = new Repo(); emps = new Repo(); leaves = new Repo(); avail = new Repo(); periods = new Repo(); entries = new Repo();
    users.rows = [
      { id: 'u-t1', first_name: 'T', last_name: 'One', branch_id: 'br-A', password_hash: 'X' },
      { id: 'u-t2', first_name: 'T', last_name: 'Two', branch_id: 'br-A', password_hash: 'X' },
      { id: 'u-hr', first_name: 'H', last_name: 'R', branch_id: 'br-A', password_hash: 'X' },
    ];
    emps.rows = [
      { id: 'e1', user_id: 'u-t1', status: 'active', salary: '0', hourly_rate: '100.00', employee_type: 'hourly', job_title: 'Teacher', contract_start: '2026-01-01' },
      { id: 'e2', user_id: 'u-t2', status: 'active', salary: '4000.00', hourly_rate: null, employee_type: 'full_time', job_title: 'Teacher', contract_start: '2026-01-01' },
      { id: 'e3', user_id: 'u-hr', status: 'active', salary: '6000.00', employee_type: 'full_time', job_title: 'HR', contract_start: '2026-01-01' },
    ];
    // join helpers so findOne({relations}) returns employee.user like TypeORM would
    (leaves as any).joins = { employee: (r: any) => ({ ...emps.rows.find((e) => e.id === r.employee_id), user: users.rows.find((u) => u.id === emps.rows.find((e) => e.id === r.employee_id)?.user_id) }) };
    svc = new (HrService as any)(emps, new Repo(), avail, leaves, periods, entries, new Repo(), users);
  });

  const lv = (over: any = {}) => ({ type: 'annual', start_date: '2026-11-01', end_date: '2026-11-03', ...over });

  // ---- leave requests ----
  it('computes days_count server-side and ignores a client-supplied value', async () => {
    const l: any = await svc.requestLeave(lv({ days_count: 99 }), TEACHER);
    expect(l.days_count).toBe(3);
    expect(l.employee_id).toBe('e1');
  });

  it('blocks a teacher from filing leave for someone else (IDOR)', async () => {
    await expect(svc.requestLeave(lv({ employee_id: 'e2' }), TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
    expect(leaves.rows).toHaveLength(0);
  });

  it('lets HR file leave on behalf of an employee', async () => {
    const l: any = await svc.requestLeave(lv({ employee_id: 'e2' }), HR);
    expect(l.employee_id).toBe('e2');
  });

  it('rejects reversed dates and overlapping pending/approved leave', async () => {
    await expect(svc.requestLeave(lv({ start_date: '2026-11-05', end_date: '2026-11-01' }), TEACHER)).rejects.toBeInstanceOf(BadRequestException);
    await svc.requestLeave(lv(), TEACHER);
    await expect(svc.requestLeave(lv({ start_date: '2026-11-03', end_date: '2026-11-07' }), TEACHER)).rejects.toBeInstanceOf(ConflictException);
    await svc.requestLeave(lv({ start_date: '2026-11-04', end_date: '2026-11-05' }), TEACHER); // adjacent is fine
  });

  // ---- approval workflow ----
  it('approves once; a second decision is refused', async () => {
    const l: any = await svc.requestLeave(lv(), TEACHER);
    const ok: any = await svc.approveLeave(l.id, HR, 'enjoy');
    expect(ok.status).toBe(LeaveStatus.APPROVED);
    expect(ok.approved_by).toBe('u-hr');
    await expect(svc.rejectLeave(l.id, HR, 'late')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.approveLeave(l.id, ADMIN)).rejects.toBeInstanceOf(BadRequestException);
    expect(leaves.rows[0].status).toBe(LeaveStatus.APPROVED);
  });

  it('records rejection with the note', async () => {
    const l: any = await svc.requestLeave(lv(), TEACHER);
    const r: any = await svc.rejectLeave(l.id, MGR_A, 'busy period');
    expect(r.status).toBe(LeaveStatus.REJECTED);
    expect(r.approval_note).toBe('busy period');
  });

  it('forbids deciding your own leave (except super_admin)', async () => {
    const l: any = await svc.requestLeave(lv({ employee_id: 'e3' }), HR);
    await expect(svc.approveLeave(l.id, HR)).rejects.toBeInstanceOf(ForbiddenException);
    const done: any = await svc.approveLeave(l.id, ADMIN);
    expect(done.status).toBe(LeaveStatus.APPROVED);
  });

  it('branch manager cannot decide leave of another branch', async () => {
    const l: any = await svc.requestLeave(lv(), TEACHER);
    await expect(svc.approveLeave(l.id, MGR_B)).rejects.toBeInstanceOf(ForbiddenException);
    expect(leaves.rows[0].status).toBe('pending');
    const ok: any = await svc.approveLeave(l.id, MGR_A);
    expect(ok.status).toBe(LeaveStatus.APPROVED);
  });

  it('owner can cancel only while pending', async () => {
    const l: any = await svc.requestLeave(lv(), TEACHER);
    await expect(svc.cancelMyLeave(l.id, 'u-t2')).rejects.toBeInstanceOf(NotFoundException);
    const c: any = await svc.cancelMyLeave(l.id, 'u-t1');
    expect(c.status).toBe(LeaveStatus.CANCELLED);
    const l2: any = await svc.requestLeave(lv({ start_date: '2026-12-01', end_date: '2026-12-02' }), TEACHER);
    await svc.approveLeave(l2.id, HR);
    await expect(svc.cancelMyLeave(l2.id, 'u-t1')).rejects.toBeInstanceOf(BadRequestException);
  });

  // ---- availability ----
  it('teacher manages only own availability; overlap and reversed times rejected', async () => {
    const s: any = await svc.setAvailability({ day_of_week: 1, start_time: '09:00', end_time: '12:00' }, TEACHER);
    expect(s.employee_id).toBe('e1');
    await expect(svc.setAvailability({ employee_id: 'e2', day_of_week: 1, start_time: '09:00', end_time: '12:00' }, TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.setAvailability({ day_of_week: 1, start_time: '11:00', end_time: '13:00' }, TEACHER)).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.setAvailability({ day_of_week: 2, start_time: '12:00', end_time: '09:00' }, TEACHER)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.updateAvailability(s.id, { note: 'x' }, TEACHER2)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.deleteAvailability(s.id, TEACHER2)).rejects.toBeInstanceOf(ForbiddenException);
    await svc.updateAvailability(s.id, { note: 'HR edit' }, HR); // HR may edit anyone's
    await svc.deleteAvailability(s.id, TEACHER);
    expect(avail.rows).toHaveLength(0);
  });

  it('teacher cannot read another teacher availability', async () => {
    await expect(svc.findAvailability('e2', TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
    await svc.findAvailability('e1', TEACHER);
    await svc.findAvailability('e2', HR);
  });

  // ---- payroll ----
  it('payroll entry uses numeric arithmetic from the employee record', async () => {
    const p: any = await svc.createPeriod({ name: 'Nov', start_date: '2026-11-01', end_date: '2026-11-30' });
    const e: any = await svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e2', bonus: 200, deductions: 50 });
    expect(e.total_amount).toBe(4150); // string "4000.00" + 200 must not concatenate
    // hourly employee, rate 100.00: 7.33h => 733 cents * 10000 is a whole cent already
    const h: any = await svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e1', hours_worked: 7.33, bonus: 10 });
    expect(h.hours_worked).toBe(7.33);
    expect(h.total_amount).toBe(743);
  });

  it('rejects duplicate entries, closed periods, negative totals and overlapping periods', async () => {
    const p: any = await svc.createPeriod({ name: 'Nov', start_date: '2026-11-01', end_date: '2026-11-30' });
    await expect(svc.createPeriod({ name: 'X', start_date: '2026-11-15', end_date: '2026-12-15' })).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.createPeriod({ name: 'Bad', start_date: '2027-02-02', end_date: '2027-02-01' })).rejects.toBeInstanceOf(BadRequestException);
    await svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e2' });
    await expect(svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e2' })).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e3', deductions: 999999 })).rejects.toBeInstanceOf(BadRequestException);
    await svc.closePeriod(p.id, 'u-hr');
    expect(periods.rows[0].status).toBe(PayrollStatus.CLOSED);
    await expect(svc.createPayrollEntry({ payroll_period_id: p.id, employee_id: 'e3' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.closePeriod(p.id, 'u-hr')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.calculateTeacherPayroll(p.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  // ---- employee records ----
  it('update whitelists fields: user_id / termination / id cannot be changed', async () => {
    emps.rows[1].contract_end = null;
    const out: any = await (svc as any).updateEmployee('e2', { job_title: 'Senior', user_id: 'evil', termination_reason: 'x', id: 'zzz', status: 'on_leave' });
    expect(emps.rows[1].job_title).toBe('Senior');
    expect(emps.rows[1].user_id).toBe('u-t2');
    expect(emps.rows[1].id).toBe('e2');
    expect(emps.rows[1].termination_reason).toBe(undefined);
    expect(out).toBeTruthy();
  });

  it('terminated employees cannot be edited, terminated twice, or request leave', async () => {
    await svc.terminateEmployee('e2', 'resigned');
    expect(emps.rows[1].status).toBe('terminated');
    await expect(svc.terminateEmployee('e2', 'again')).rejects.toBeInstanceOf(BadRequestException);
    await expect((svc as any).updateEmployee('e2', { job_title: 'x' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.requestLeave(lv(), TEACHER2)).rejects.toBeInstanceOf(BadRequestException);
  });
});
