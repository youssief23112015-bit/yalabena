import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthUser, effectiveBranchFilter, isSuperAdmin } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, TimeSeriesPoint } from '../dashboard.dto';

/**
 * Shared base for all per-role dashboard metric services.
 * Provides previous-period comparison, change-pct computation, branch scoping,
 * and academy-time-zone date bucketing.
 */
@Injectable()
export abstract class BaseMetricService {
  constructor(protected readonly config: ConfigService) {}

  /** Academy wall-clock today as YYYY-MM-DD. */
  protected get academyToday(): string {
    const timeZone = this.config.get<string>('APP_TIME_ZONE', 'Africa/Cairo');
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  }

  /** Academy time-zone-aware start of a period as a JS Date (UTC midnight of local day). */
  protected startOfPeriod(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /** Branch filter for a user: super_admin gets requested branch_id, others locked to their own. */
  protected branchFilter(user: AuthUser, requested?: string): string | undefined {
    return effectiveBranchFilter(user, requested);
  }

  /** Is the user a super admin? */
  protected isSuperAdmin(user: AuthUser): boolean {
    return isSuperAdmin(user);
  }

  /**
   * Compute change percentage between current and previous value.
   * Returns 0 when previous is 0 (avoid division by zero).
   */
  protected changePct(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  /** Wrap a raw count into a KpiResult with previous-period comparison. */
  protected makeKpi(value: number, previous: number): KpiResult {
    return {
      value,
      previous_value: previous,
      change_pct: this.changePct(value, previous),
    };
  }

  /** Shift a date range back by the same duration for previous-period comparison. */
  protected previousRange(from: Date, to: Date): { from: Date; to: Date } {
    const diffMs = to.getTime() - from.getTime();
    return {
      from: new Date(from.getTime() - diffMs),
      to: new Date(from.getTime()),
    };
  }

  /**
   * Apply branch scope to a query builder. Non-super-admin users are locked
   * to their own branch; super_admin may optionally pass a branch_id.
   */
  protected applyBranchScope<T>(
    qb: Repository<T> | any,
    user: AuthUser,
    requestedBranchId?: string,
    branchColumn = 'branch_id',
  ): void {
    const bf = this.branchFilter(user, requestedBranchId);
    if (bf && bf !== '__none__') {
      qb.andWhere(`x.${branchColumn} = :b`, { b: bf });
    }
  }

  /** Format a Date as YYYY-MM-DD in academy time zone. */
  protected formatDate(date: Date): string {
    const timeZone = this.config.get<string>('APP_TIME_ZONE', 'Africa/Cairo');
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  }

  /**
   * Generate gap-free daily time-series points between from and to (inclusive),
   * merging with actual data by date string.
   */
  protected buildTimeSeries(
    from: Date,
    to: Date,
    data: Array<{ date: string; value: number }>,
  ): TimeSeriesPoint[] {
    const dataMap = new Map(data.map((d) => [d.date, d.value]));
    const points: TimeSeriesPoint[] = [];
    const current = new Date(from);
    while (current <= to) {
      const key = this.formatDate(current);
      points.push({ date: key, value: dataMap.get(key) ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    return points;
  }
}