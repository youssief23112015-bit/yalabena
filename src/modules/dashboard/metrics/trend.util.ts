/**
 * Trend computation helpers for dashboard KPIs.
 */

/**
 * Wrap a current + previous value into a KpiResult with safe change-pct.
 *
 * - Null-safe: undefined/NaN values are treated as 0.
 * - No division by zero: when previous === 0, change_pct is 0 unless current > 0 (then 100).
 * - change_pct is rounded to 2 decimals.
 */
export function withTrend(current: number | null | undefined, previous: number | null | undefined): {
  value: number;
  previous_value: number;
  change_pct: number;
} {
  const value = Number(current ?? 0);
  const previous_value = Number(previous ?? 0);

  let change_pct: number;
  if (previous_value === 0) {
    change_pct = value > 0 ? 100 : 0;
  } else {
    change_pct = Number((((value - previous_value) / previous_value) * 100).toFixed(2));
  }

  return { value, previous_value, change_pct };
}

/** Round a monetary value to 2 decimals. */
export function toMoney(value: number | null | undefined): number {
  return Number((Number(value ?? 0)).toFixed(2));
}