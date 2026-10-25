import { withTrend, toMoney } from './trend.util';

describe('withTrend', () => {
  it('computes change_pct when previous > 0', () => {
    expect(withTrend(120, 100)).toEqual({ value: 120, previous_value: 100, change_pct: 20 });
  });

  it('returns 100 when previous is 0 and current > 0', () => {
    expect(withTrend(10, 0)).toEqual({ value: 10, previous_value: 0, change_pct: 100 });
  });

  it('returns 0 when both are 0', () => {
    expect(withTrend(0, 0)).toEqual({ value: 0, previous_value: 0, change_pct: 0 });
  });

  it('treats undefined as 0', () => {
    expect(withTrend(undefined, 50)).toEqual({ value: 0, previous_value: 50, change_pct: -100 });
    expect(withTrend(50, undefined)).toEqual({ value: 50, previous_value: 0, change_pct: 100 });
  });

  it('rounds change_pct to 2 decimals', () => {
    expect(withTrend(33.33, 100).change_pct).toBe(-66.67);
  });

  it('handles negative change', () => {
    expect(withTrend(80, 100)).toEqual({ value: 80, previous_value: 100, change_pct: -20 });
  });
});

describe('toMoney', () => {
  it('rounds to 2 decimals', () => {
    expect(toMoney(10.123)).toBe(10.12);
    expect(toMoney(10.126)).toBe(10.13);
    expect(toMoney(undefined)).toBe(0);
    expect(toMoney(null)).toBe(0);
  });
});