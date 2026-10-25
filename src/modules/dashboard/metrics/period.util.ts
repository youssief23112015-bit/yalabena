import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type DashboardPeriod = 'today' | '7d' | '30d' | 'month' | 'quarter' | 'year' | 'custom';
export type Bucket = 'day' | 'week' | 'month';

export interface ResolvedPeriod {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  bucket: Bucket;
}

/** Resolve a dashboard period into academy-time-zone date bounds. */
@Injectable()
export class PeriodResolver {
  private readonly timeZone: string;
  constructor(config: ConfigService) {
    this.timeZone = config.get<string>('APP_TIME_ZONE', 'Africa/Cairo');
  }
  private academyToday(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.timeZone }).format(new Date());
  }
  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  resolve(period: DashboardPeriod, from?: string, to?: string): ResolvedPeriod {
    const today = this.startOfDay(new Date());
    const now = new Date();

    switch (period) {
      case 'today':
        return this.dayRange(today, 1, 'day');
      case '7d':
        return this.dayRange(today, 7, 'day');
      case '30d':
        return this.dayRange(today, 30, 'day');
      case 'month': {
        const from = this.startOfMonth(now);
        const to = this.endOfMonth(now);
        const prevFrom = new Date(from);
        prevFrom.setMonth(prevFrom.getMonth() - 1);
        return { from, to, previousFrom: prevFrom, previousTo: this.endOfMonth(prevFrom), bucket: 'day' };
      }
      case 'quarter': {
        const from = this.startOfMonth(now);
        from.setMonth(Math.floor(now.getMonth() / 3) * 3);
        const to = new Date(from);
        to.setMonth(from.getMonth() + 3);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        const prevFrom = new Date(from);
        prevFrom.setMonth(prevFrom.getMonth() - 3);
        return { from, to, previousFrom: prevFrom, previousTo: this.endOfMonth(prevFrom), bucket: 'month' };
      }
      case 'year': {
        const from = new Date(now.getFullYear(), 0, 1);
        const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
        const prevTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { from, to, previousFrom: prevFrom, previousTo: prevTo, bucket: 'month' };
      }
      case 'custom': {
        const cFrom = new Date(from ?? '');
        const cTo = new Date(to ?? '');
        if (Number.isNaN(cFrom.getTime()) || Number.isNaN(cTo.getTime())) {
          throw new Error('custom period requires both from and to');
        }
        const f = this.startOfDay(cFrom);
        const t = this.endOfDay(cTo);
        const diffMs = t.getTime() - f.getTime();
        const prevFrom = new Date(f.getTime() - diffMs);
        const prevTo = new Date(f.getTime() - 1);
        const bucket = diffMs > 90 * 86_400_000 ? 'month' : diffMs > 14 * 86_400_000 ? 'week' : 'day';
        return { from: f, to: t, previousFrom: prevFrom, previousTo: prevTo, bucket };
      }
      default:
        throw new Error(`Unknown dashboard period: ${period}`);
    }
  }

  private dayRange(today: Date, daysBack: number, bucket: Bucket): ResolvedPeriod {
    const from = today;
    const to = this.endOfDay(today);
    const prevFrom = new Date(from);
    prevFrom.setDate(from.getDate() - daysBack);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    return { from, to, previousFrom: prevFrom, previousTo: this.endOfDay(prevTo), bucket };
  }
}

export const resolvePeriod = (
  period: DashboardPeriod,
  from?: string,
  to?: string,
  config?: ConfigService,
): ResolvedPeriod => new PeriodResolver(config ?? new ConfigService()).resolve(period, from, to);