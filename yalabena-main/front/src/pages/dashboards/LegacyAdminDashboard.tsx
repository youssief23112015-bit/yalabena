import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { dashboardApi } from "@/api/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendBadge } from "@/components/dashboard/TrendBadge";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { BranchSelect } from "@/components/dashboard/BranchSelect";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { DashboardRecentLead, DashboardRecentPayment, DashboardRecentSession } from "@/types/dashboard";

/**
 * Legacy administrative dashboard.
 */
export default function LegacyAdminDashboard() {
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isSuperAdmin = roles.includes("super_admin");

  const { data: stats, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <div className="flex gap-2">
            <PeriodFilter />
            {isSuperAdmin && <BranchSelect />}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SectionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SectionCardError
        title={t("loadError")}
        onRetry={refetch}
        message={error.message}
      />
    );
  }

  const kpis = stats?.kpis ?? {};
  const alerts = stats?.alerts ?? [];
  const recentItems = stats?.recent_items ?? {};
  const attendance = stats?.attendance_summary ?? { present: 0, absent: 0, late: 0 };

  const totalAttendances =
    (attendance.present ?? 0) + (attendance.absent ?? 0) + (attendance.late ?? 0);
  const attendanceRate =
    totalAttendances > 0
      ? Math.round(((attendance.present ?? 0) / totalAttendances) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter />
          {isSuperAdmin && <BranchSelect />}
        </div>
      </div>

      {/* KPI Row */}
      <SectionCard title={t("sections.revenue")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("sections.revenue")}
            value={formatCurrency(kpis.revenue_today?.value ?? 0)}
            trend={kpis.revenue_today?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatCurrency(kpis.revenue_today?.previous_value ?? 0)}`}
            href="/finance"
          />
          <StatCard
            title={t("sections.students")}
            value={formatNumber(kpis.total_students?.value ?? 0)}
            trend={kpis.total_students?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatNumber(kpis.total_students?.previous_value ?? 0)}`}
            href="/students"
          />
          <StatCard
            title={t("sections.groups")}
            value={formatNumber(kpis.total_groups?.value ?? 0)}
            trend={kpis.total_groups?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatNumber(kpis.total_groups?.previous_value ?? 0)}`}
            href="/groups"
          />
          <StatCard
            title={t("sections.sessions")}
            value={formatNumber(kpis.total_sessions?.value ?? 0)}
            trend={kpis.total_sessions?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatNumber(kpis.total_sessions?.previous_value ?? 0)}`}
            href="/sessions"
          />
        </div>
      </SectionCard>

      {/* Attendance Summary */}
      <SectionCard title={t("sections.attendance")}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
            <span className="h-5 w-5 text-emerald-600 dark:text-emerald-400">✓</span>
            <div>
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(attendance.present ?? 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-rose-500/10 p-4 border border-rose-500/20">
            <span className="h-5 w-5 text-rose-600 dark:text-rose-400">✗</span>
            <div>
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{formatNumber(attendance.absent ?? 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-4 border border-amber-500/20">
            <span className="h-5 w-5 text-amber-600 dark:text-amber-400">◐</span>
            <div>
              <p className="text-sm text-muted-foreground">Late</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatNumber(attendance.late ?? 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
            <span className="h-5 w-5 text-blue-600 dark:text-blue-400">📊</span>
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatPercent(attendanceRate)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Financial KPIs */}
      <SectionCard title={t("sections.revenue")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue This Month"
            value={formatCurrency(kpis.revenue_month?.value ?? 0)}
            trend={kpis.revenue_month?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatCurrency(kpis.revenue_month?.previous_value ?? 0)}`}
            href="/finance"
          />
          <StatCard
            title="Outstanding Payments"
            value={formatCurrency(kpis.outstanding_payments?.value ?? 0)}
            trend={null}
            href="/finance/invoices"
          />
          <StatCard
            title="Group Fill Rate"
            value={formatPercent(kpis.group_fill_rate?.value ?? 0)}
            trend={kpis.group_fill_rate?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatPercent(kpis.group_fill_rate?.previous_value ?? 0)}`}
            href="/groups"
          />
          <StatCard
            title="Conversion Rate"
            value={formatPercent(kpis.conversion_rate?.value ?? 0)}
            trend={kpis.conversion_rate?.change_pct ?? null}
            trendLabel={`${t("kpi.previous")}: ${formatPercent(kpis.conversion_rate?.previous_value ?? 0)}`}
            href="/leads"
          />
        </div>
      </SectionCard>

      {/* Alerts */}
      {Array.isArray(alerts) && alerts.length > 0 && (
        <SectionCard title="Needs Attention">
          <AlertList alerts={alerts} />
        </SectionCard>
      )}

      {/* Recent Items */}
      <SectionCard title={t("actions.viewAll")}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{t("sections.leads")}</h3>
            {((recentItems?.leads as DashboardRecentLead[] | undefined) ?? []).length > 0 ? (
              <ul className="space-y-1 text-sm">
                {(recentItems?.leads as DashboardRecentLead[]).slice(0, 5).map((lead) => (
                  <li key={lead.id} className="flex justify-between text-muted-foreground">
                    <span>{lead.first_name} {lead.last_name}</span>
                    <span className="font-medium">{lead.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Recent Payments</h3>
            {((recentItems?.payments as DashboardRecentPayment[] | undefined) ?? []).length > 0 ? (
              <ul className="space-y-1 text-sm">
                {(recentItems?.payments as DashboardRecentPayment[]).slice(0, 5).map((payment) => (
                  <li key={payment.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{payment.receipt_number ?? payment.id?.slice(0, 8)}</span>
                    <span className="font-medium">{formatCurrency(payment.amount ?? 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Upcoming Sessions</h3>
            {((recentItems?.upcoming_sessions as DashboardRecentSession[] | undefined) ?? []).length > 0 ? (
              <ul className="space-y-1 text-sm">
                {(recentItems?.upcoming_sessions as DashboardRecentSession[]).slice(0, 5).map((session) => (
                  <li key={session.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{session.group?.name ?? session.title ?? "—"}</span>
                    <span className="font-medium">{session.date ?? "—"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/** Skeleton placeholder for KPI grid. */
function SectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="h-8 w-32 rounded bg-muted animate-pulse" />
      <div className="h-4 w-full rounded bg-muted animate-pulse mt-2 mb-4" />
      <div className="h-16 rounded bg-muted animate-pulse" />
    </div>
  );
}

/** Error state for a section. */
function SectionCardError({ title, onRetry, message }: { title: string; onRetry: () => void; message: string }) {
  const { t } = useTranslation("dashboard");
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col items-center gap-3 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
        {t("retry")}
      </button>
    </section>
  );
}