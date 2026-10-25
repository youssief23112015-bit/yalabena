import { BadRequestException } from '@nestjs/common';

/**
 * Pure calendar helpers for the automatic recurring-session generator.
 *
 * Sessions in this system store academy WALL-TIME: `date` is a plain
 * calendar date (YYYY-MM-DD) and `start_time`/`end_time` are wall-clock
 * values (HH:mm[:ss]) interpreted in the academy zone (APP_TIME_ZONE,
 * default Africa/Cairo). Occurrence expansion therefore uses pure UTC
 * calendar arithmetic — no local-time or DST conversion ever happens —
 * so month boundaries, leap years and daylight-saving transitions can
 * never shift a generated session to the wrong day or time.
 *
 * `day_of_week` follows the project convention: 0 = Sunday … 6 = Saturday
 * (matches `group_schedules.day_of_week` and the admin UI's daysOfWeek).
 */

export interface ScheduleWindow {
  day_of_week: number;
  /** 'HH:MM' or 'HH:MM:SS' academy wall-clock start. */
  start_time: string;
  /** 'HH:MM' or 'HH:MM:SS' academy wall-clock end (same day, > start). */
  end_time: string;
  classroom_id?: string | null;
}

export interface Occurrence {
  /** YYYY-MM-DD calendar date of the occurrence. */
  date: string;
  day_of_week: number;
  /** Normalized 'HH:MM:SS'. */
  start_time: string;
  /** Normalized 'HH:MM:SS'. */
  end_time: string;
  classroom_id?: string | null;
}

const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Hard cap so a misconfigured date range can never explode the generator. */
export const MAX_OCCURRENCES = 1000;
/** Inclusive day-range cap (≈ 14 months) for a single generation run. */
export const MAX_RANGE_DAYS = 400;

/** 'HH:MM[:SS]' → 'HH:MM:SS' (validates shape and 24h bounds). */
export function normalizeTime(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const m = TIME_RE.exec(value.trim());
  if (!m) return null;
  const [h, mi, s] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  if (h > 23 || mi > 59 || s > 59) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(mi)}:${pad(s)}`;
}

/** 'HH:MM[:SS]' → minutes since midnight (NaN when unparseable). */
export function toMinutes(time?: string | null): number {
  const normalized = normalizeTime(time);
  if (!normalized) return NaN;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

/** Inclusive iteration of YYYY-MM-DD dates between two dates (UTC arithmetic). */
export function eachDateBetween(fromDate: string, toDate: string): string[] {
  const from = Date.parse(`${String(fromDate).slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${String(toDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) return [];
  const out: string[] = [];
  for (let t = from; t <= to; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Number of inclusive calendar days between two YYYY-MM-DD dates. */
export function inclusiveDays(fromDate: string, toDate: string): number {
  const from = Date.parse(`${String(fromDate).slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${String(toDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) return 0;
  return Math.round((to - from) / 86_400_000) + 1;
}

/** Weekday (0 = Sun … 6 = Sat) of a YYYY-MM-DD date — DST-independent. */
export function dayOfWeekOf(date: string): number {
  return new Date(`${String(date).slice(0, 10)}T00:00:00Z`).getUTCDay();
}

/**
 * Validate a recurring schedule configuration against a group date range.
 * Returns human-readable errors (empty array = valid).
 */
export function validateScheduleConfig(
  windows: Array<Partial<ScheduleWindow> | null | undefined>,
  startDate: string,
  endDate: string,
): string[] {
  const errors: string[] = [];

  const start = String(startDate ?? '').slice(0, 10);
  const end = String(endDate ?? '').slice(0, 10);
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    errors.push('Group start date and end date are required (YYYY-MM-DD).');
    return errors;
  }
  if (end < start) {
    errors.push(`End date (${end}) cannot be before start date (${start}).`);
  } else if (inclusiveDays(start, end) > MAX_RANGE_DAYS) {
    errors.push(
      `Date range spans more than ${MAX_RANGE_DAYS} days — shorten the group period or split the group.`,
    );
  }

  if (!Array.isArray(windows) || windows.length === 0) {
    errors.push('At least one weekly schedule entry (weekday + time window) is required.');
    return errors;
  }

  windows.forEach((w, i) => {
    const label = `Schedule #${i + 1}`;
    const day = Number(w?.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      errors.push(`${label}: weekday must be an integer between 0 (Sunday) and 6 (Saturday).`);
    }
    const startT = normalizeTime(w?.start_time);
    const endT = normalizeTime(w?.end_time);
    if (!startT) errors.push(`${label}: start time must be a valid time (HH:MM).`);
    if (!endT) errors.push(`${label}: end time must be a valid time (HH:MM).`);
    if (startT && endT && toMinutes(endT) <= toMinutes(startT)) {
      errors.push(
        `${label}: end time (${endT}) must be after start time (${startT}); sessions cannot cross midnight.`,
      );
    }
  });

  return errors;
}

/**
 * Expand weekly windows into concrete occurrences inside [startDate, endDate].
 * Dates iterate in UTC (calendar arithmetic) so DST can never move an
 * occurrence across a day boundary; times pass through as wall-clock values.
 *
 * Throws BadRequestException on invalid configuration so callers get the
 * same validation regardless of where expansion is triggered.
 */
export function expandOccurrences(
  windows: Array<Partial<ScheduleWindow>>,
  startDate: string,
  endDate: string,
): Occurrence[] {
  const errors = validateScheduleConfig(windows, startDate, endDate);
  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Invalid recurring schedule configuration',
      errors,
    });
  }

  const start = String(startDate).slice(0, 10);
  const end = String(endDate).slice(0, 10);

  const normalized = windows.map((w) => ({
    day_of_week: Number(w.day_of_week),
    start_time: normalizeTime(w.start_time)!,
    end_time: normalizeTime(w.end_time)!,
    classroom_id: w.classroom_id ?? null,
  }));

  const occurrences: Occurrence[] = [];
  for (const date of eachDateBetween(start, end)) {
    const dow = dayOfWeekOf(date);
    for (const w of normalized) {
      if (w.day_of_week !== dow) continue;
      occurrences.push({ date, day_of_week: dow, ...w });
      if (occurrences.length >= MAX_OCCURRENCES) {
        throw new BadRequestException({
          message: 'Invalid recurring schedule configuration',
          errors: [
            `The schedule would generate more than ${MAX_OCCURRENCES} sessions — shorten the date range or reduce weekdays.`,
          ],
        });
      }
    }
  }
  return occurrences;
}

/** Duration in minutes between two normalized times (min 1). */
export function durationMinutes(start: string, end: string): number {
  return Math.max(1, toMinutes(end) - toMinutes(start));
}

/** Sunday-first day label (matches the admin UI's daysOfWeek array). */
export function dayLabel(day: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[Number(day)] ?? `day ${day}`;
}

/** 'YYYY-MM-DD' → 'Sunday, November 8, 2026' (pure calendar, no zone math). */
export function humanDate(date: string): string {
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** 'HH:MM:SS' → 'HH:MM' for messages. */
export function shortTime(time: string): string {
  return String(time ?? '').slice(0, 5);
}
