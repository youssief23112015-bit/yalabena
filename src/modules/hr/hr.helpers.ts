/** Pure helpers for the HR module (kept separate so they are unit-testable). */

export const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Inclusive calendar days between two YYYY-MM-DD dates (timezone / DST independent). */
export function inclusiveDays(start: string, end: string): number {
  const s = Date.parse(`${String(start).slice(0, 10)}T00:00:00Z`);
  const e = Date.parse(`${String(end).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(s) || Number.isNaN(e)) return NaN;
  return Math.round((e - s) / 86_400_000) + 1;
}

/** True when [aStart,aEnd] and [bStart,bEnd] (YYYY-MM-DD) share at least one day. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a1 = String(aStart).slice(0, 10), a2 = String(aEnd).slice(0, 10);
  const b1 = String(bStart).slice(0, 10), b2 = String(bEnd).slice(0, 10);
  return a1 <= b2 && b1 <= a2;
}

/** Minutes since midnight for HH:mm or HH:mm:ss. */
export function toMinutes(t: string): number {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * The DB constraint chk_pe_total_formula demands
 *   total_amount = hours_worked * hourly_rate + bonus - deductions   (exact numeric equality)
 * while total_amount has only 2 decimals. hours*rate has up to 4, so it must land on a whole
 * cent. Returns the hours (2 dp) closest to `hours` for which hours*rate is exactly 2-decimal.
 */
export function exactHours(hours: number, rate: number): number {
  const rateC = Math.round(rate * 100);
  const hoursC = Math.round(hours * 100);
  if (rateC === 0) return hoursC / 100;
  for (let d = 0; d <= 100; d++) {
    for (const cand of d === 0 ? [hoursC] : [hoursC - d, hoursC + d]) {
      if (cand >= 0 && (cand * rateC) % 100 === 0) return cand / 100;
    }
  }
  return hoursC / 100;
}

/** Payroll total as the DB check computes it. All inputs are plain numbers. */
export function payrollTotal(p: { base: number; hours: number; rate: number; bonus: number; deductions: number }): number {
  const { base, hours, rate, bonus, deductions } = p;
  if (base > 0) return round2(base + bonus - deductions);
  if (rate > 0) return round2(hours * rate + bonus - deductions);
  return round2(bonus - deductions);
}

/** Only these user columns may leave the HR API (never password_hash / 2FA secret). */
export function pickUser(u: any) {
  if (!u) return u;
  return {
    id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email,
    phone: u.phone, branch_id: u.branch_id, avatar_url: u.avatar_url, status: u.status,
  };
}

const COMP_FIELDS = ['salary', 'hourly_rate', 'bank_account', 'bank_name', 'currency'] as const;

/** Shapes an Employee for the response: safe user + optional compensation. */
export function presentEmployee(e: any, canSeeCompensation: boolean) {
  if (!e) return e;
  const out: any = { ...e, user: pickUser(e.user) };
  if (!canSeeCompensation) for (const f of COMP_FIELDS) delete out[f];
  else {
    if (out.salary != null) out.salary = Number(out.salary);
    if (out.hourly_rate != null) out.hourly_rate = Number(out.hourly_rate);
  }
  return out;
}

export function presentLeave(l: any) {
  if (!l) return l;
  const out: any = { ...l };
  if (out.employee) out.employee = presentEmployee(out.employee, false);
  delete out.approver;
  return out;
}

export function presentPayrollEntry(p: any) {
  if (!p) return p;
  const out: any = { ...p };
  for (const k of ['base_amount', 'hours_worked', 'bonus', 'deductions', 'hourly_rate', 'total_amount']) {
    if (out[k] != null) out[k] = Number(out[k]);
  }
  if (out.employee) out.employee = presentEmployee(out.employee, false);
  return out;
}
