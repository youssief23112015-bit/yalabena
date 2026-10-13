import {
  exactHours, inclusiveDays, payrollTotal, presentEmployee, presentLeave, presentPayrollEntry,
  pickUser, rangesOverlap, round2, toMinutes,
} from './hr.helpers';

describe('hr.helpers', () => {
  it('counts inclusive leave days independent of order of months / DST', () => {
    expect(inclusiveDays('2026-10-01', '2026-10-01')).toBe(1);
    expect(inclusiveDays('2026-10-01', '2026-10-05')).toBe(5);
    expect(inclusiveDays('2026-03-27', '2026-03-30')).toBe(4);
    expect(inclusiveDays('2026-10-05', '2026-10-01')).toBe(-3); // caller rejects < 1
  });

  it('detects overlapping ranges including touching days', () => {
    expect(rangesOverlap('2026-10-01', '2026-10-05', '2026-10-05', '2026-10-09')).toBe(true);
    expect(rangesOverlap('2026-10-01', '2026-10-04', '2026-10-05', '2026-10-09')).toBe(false);
  });

  it('parses times to minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('17:00:00')).toBe(1020);
  });

  it('computes payroll totals with numeric (not string) arithmetic', () => {
    expect(payrollTotal({ base: 5000, hours: 0, rate: 0, bonus: 200, deductions: 50 })).toBe(5150);
    expect(payrollTotal({ base: 0, hours: 10, rate: 150, bonus: 100, deductions: 0 })).toBe(1600);
    expect(payrollTotal({ base: 0, hours: 0, rate: 0, bonus: 100, deductions: 30 })).toBe(70);
  });

  it('exactHours yields hours*rate on a whole cent (DB chk_pe_total_formula)', () => {
    for (const [h, r] of [[7.33, 12.5], [10.01, 33.33], [3.17, 0.07], [9.99, 125.55], [1.5, 100]]) {
      const x = exactHours(h, r);
      const cents = Math.round(x * 100) * Math.round(r * 100);
      expect(cents % 100).toBe(0);
      expect(Math.abs(x - h) <= 1).toBe(true);
    }
    expect(exactHours(1.5, 100)).toBe(1.5); // already exact: unchanged
  });

  it('never leaks password hash / 2FA secret through user presenters', () => {
    const u = { id: 'u', first_name: 'A', last_name: 'B', email: 'e', password_hash: 'SECRET', two_factor_secret: 'S2' };
    const p = pickUser(u) as any;
    expect(p.password_hash).toBe(undefined);
    expect(p.two_factor_secret).toBe(undefined);
    const emp = presentEmployee({ id: 'e', salary: '5000.00', bank_account: '123', user: u }, false) as any;
    expect(emp.salary).toBe(undefined);
    expect(emp.bank_account).toBe(undefined);
    expect(emp.user.password_hash).toBe(undefined);
    const withComp = presentEmployee({ id: 'e', salary: '5000.00', user: u }, true) as any;
    expect(withComp.salary).toBe(5000);
    const leave = presentLeave({ id: 'l', employee: { id: 'e', salary: '1', user: u }, approver: u }) as any;
    expect(leave.employee.user.password_hash).toBe(undefined);
    expect(leave.employee.salary).toBe(undefined);
    expect(leave.approver).toBe(undefined);
    const pe = presentPayrollEntry({ total_amount: '10.50', employee: { user: u } }) as any;
    expect(pe.total_amount).toBe(10.5);
    expect(pe.employee.user.password_hash).toBe(undefined);
  });

  it('round2 rounds half-up on cents', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.5)).toBe(2.5);
  });
});
