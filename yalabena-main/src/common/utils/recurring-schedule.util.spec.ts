import { BadRequestException } from '@nestjs/common';
import {
  MAX_RANGE_DAYS,
  dayOfWeekOf,
  durationMinutes,
  eachDateBetween,
  expandOccurrences,
  inclusiveDays,
  normalizeTime,
  toMinutes,
  validateScheduleConfig,
} from './recurring-schedule.util';

describe('recurring-schedule.util', () => {
  // ── normalizeTime / toMinutes ──
  it('normalizes HH:MM and HH:MM:SS to HH:MM:SS', () => {
    expect(normalizeTime('18:00')).toBe('18:00:00');
    expect(normalizeTime('9:05')).toBe('09:05:00');
    expect(normalizeTime('18:00:30')).toBe('18:00:30');
  });

  it('rejects malformed or out-of-range times', () => {
    expect(normalizeTime('24:00')).toBeNull();
    expect(normalizeTime('12:60')).toBeNull();
    expect(normalizeTime('abc')).toBeNull();
    expect(normalizeTime(undefined)).toBeNull();
  });

  it('converts times to minutes since midnight', () => {
    expect(toMinutes('18:00')).toBe(1080);
    expect(toMinutes('00:00:00')).toBe(0);
    expect(Number.isNaN(toMinutes('bad'))).toBe(true);
  });

  // ── calendar arithmetic ──
  it('iterates dates across a month boundary inclusively', () => {
    const dates = eachDateBetween('2026-11-29', '2026-12-02');
    expect(dates).toEqual(['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02']);
  });

  it('counts inclusive days', () => {
    expect(inclusiveDays('2026-01-01', '2026-01-01')).toBe(1);
    expect(inclusiveDays('2026-01-01', '2026-01-31')).toBe(31);
    expect(inclusiveDays('2026-02-01', '2026-02-28')).toBe(28);
  });

  it('computes weekdays Sun-first (0=Sunday)', () => {
    expect(dayOfWeekOf('2026-11-01')).toBe(0); // Sunday
    expect(dayOfWeekOf('2026-11-08')).toBe(0);
    expect(dayOfWeekOf('2026-11-04')).toBe(3); // Wednesday
  });

  it('computes duration in minutes', () => {
    expect(durationMinutes('18:00:00', '19:30:00')).toBe(90);
    expect(durationMinutes('23:00:00', '23:30:00')).toBe(30);
  });

  // ── validateScheduleConfig ──
  it('accepts a valid configuration', () => {
    expect(
      validateScheduleConfig(
        [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual([]);
  });

  it('rejects end date before start date', () => {
    const errors = validateScheduleConfig(
      [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
      '2026-11-30',
      '2026-11-01',
    );
    expect(errors.join(' ')).toMatch(/cannot be before/i);
  });

  it('rejects missing windows, bad weekdays and end<=start', () => {
    expect(validateScheduleConfig([], '2026-11-01', '2026-11-30')[0]).toMatch(/at least one/i);
    const bad = validateScheduleConfig(
      [
        { day_of_week: 9, start_time: '18:00', end_time: '19:00' },
        { day_of_week: 1, start_time: '18:00', end_time: '17:00' },
      ],
      '2026-11-01',
      '2026-11-30',
    );
    expect(bad.join(' ')).toMatch(/weekday/i);
    expect(bad.join(' ')).toMatch(/must be after/i);
  });

  it('rejects a range longer than the safety cap', () => {
    const errors = validateScheduleConfig(
      [{ day_of_week: 0, start_time: '18:00', end_time: '19:00' }],
      '2026-01-01',
      '2027-06-01',
    );
    expect(errors.join(' ')).toContain(String(MAX_RANGE_DAYS));
  });

  // ── expandOccurrences ──
  it('generates sessions for ONE selected weekday', () => {
    const out = expandOccurrences(
      [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
      '2026-11-01',
      '2026-11-30',
    );
    // Sundays of November 2026: 1, 8, 15, 22, 29
    expect(out.map((o) => o.date)).toEqual([
      '2026-11-01',
      '2026-11-08',
      '2026-11-15',
      '2026-11-22',
      '2026-11-29',
    ]);
    expect(out.every((o) => o.start_time === '18:00:00' && o.end_time === '19:30:00')).toBe(true);
    expect(out.every((o) => o.day_of_week === 0)).toBe(true);
  });

  it('generates sessions for MULTIPLE weekdays (Sun+Tue)', () => {
    const out = expandOccurrences(
      [
        { day_of_week: 0, start_time: '18:00', end_time: '19:30' },
        { day_of_week: 2, start_time: '18:00', end_time: '19:30' },
      ],
      '2026-11-01',
      '2026-11-14',
    );
    expect(out.map((o) => o.date)).toEqual([
      '2026-11-01', // Sun
      '2026-11-03', // Tue
      '2026-11-08', // Sun
      '2026-11-10', // Tue
    ]);
  });

  it('keeps start/end dates exact at the boundaries', () => {
    const out = expandOccurrences(
      [{ day_of_week: 0, start_time: '10:00', end_time: '11:00' }],
      '2026-11-01',
      '2026-11-01',
    );
    expect(out).toHaveLength(1);
    expect(out[0].date).toBe('2026-11-01');
  });

  it('handles leap-day Feb 29 inside the range', () => {
    // 2028 is a leap year; every Tuesday of Feb 2028 must be generated,
    // including the one on Feb 29.
    const out = expandOccurrences(
      [{ day_of_week: 2, start_time: '09:00', end_time: '10:00' }],
      '2028-02-01',
      '2028-03-01',
    );
    const dates = out.map((o) => o.date);
    expect(dates).toContain('2028-02-29');
    expect(dates.every((d) => dayOfWeekOf(d) === 2)).toBe(true);
  });

  it('keeps wall-clock times constant across a DST transition', () => {
    // US DST ended 2026-11-01; iterating pure calendar dates keeps the
    // wall-clock time identical on both sides of the transition.
    const out = expandOccurrences(
      [{ day_of_week: 0, start_time: '18:00', end_time: '19:00' }],
      '2026-10-25',
      '2026-11-08',
    );
    expect(out.map((o) => o.date)).toEqual(['2026-10-25', '2026-11-01', '2026-11-08']);
    expect(out.every((o) => o.start_time === '18:00:00')).toBe(true);
  });

  it('throws BadRequestException on invalid configuration', () => {
    expect(() =>
      expandOccurrences([{ day_of_week: 0, start_time: '19:00', end_time: '18:00' }], '2026-11-01', '2026-11-30'),
    ).toThrow(BadRequestException);
    expect(() => expandOccurrences([], '2026-11-30', '2026-11-01')).toThrow(BadRequestException);
  });
});

