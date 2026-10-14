import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hrApi } from "@/api/hr";
import type { Employee, LeaveRequest } from "@/types/hr";
import { dateKeyIn, getUserTimeZone } from "@/lib/timezone";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock,
  Hourglass,
  RefreshCw,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

/** Human label for a leave request's employee (joins via the loaded list). */
function employeeLabel(leave: LeaveRequest, byId: Map<string, Employee>): string {
  const employee = leave.employee ?? byId.get(leave.employee_id);
  const name = employee?.user
    ? `${employee.user.first_name ?? ""} ${employee.user.last_name ?? ""}`.trim()
    : "";
  return name || (leave.employee_id ? `#${leave.employee_id.slice(0, 8)}` : "—");
}

/**
 * HR home: direct shortcuts into the HR modules (/hr, /hr/leaves,
 * /hr/payroll), pending leave requests summary, headcount by department and
 * an employee attendance snapshot for today.
 */
export default function HrDashboard() {
  const { t } = useTranslation("common");
  const timeZone = getUserTimeZone();
  const todayKey = dateKeyIn(timeZone);

  const employeesQ = useQuery({
    queryKey: ["hr", "dashboard-employees"],
    queryFn: () => hrApi.employees(),
    retry: false,
    staleTime: 60_000,
  });
  const leavesQ = useQuery({
    queryKey: ["hr", "dashboard-leaves"],
    queryFn: () => hrApi.leaves(),
    retry: false,
    staleTime: 60_000,
  });

  const employees: Employee[] = useMemo(
    () => (Array.isArray(employeesQ.data) ? employeesQ.data : []),
    [employeesQ.data],
  );
  const leaves: LeaveRequest[] = useMemo(
    () => (Array.isArray(leavesQ.data) ? leavesQ.data : []),
    [leavesQ.data],
  );

  const employeesById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const employee of employees) map.set(employee.id, employee);
    return map;
  }, [employees]);

  const activeCount = employees.filter((e) => e.status === "active").length;

  // Approved leaves whose [start, end] window covers today → out of office.
  const onLeaveToday = useMemo(
    () =>
      leaves.filter((l) => {
        if (l.status !== "approved") return false;
        const start = (l.start_date ?? "").slice(0, 10);
        const end = (l.end_date ?? "").slice(0, 10);
        return Boolean(start && end) && start <= todayKey && end >= todayKey;
      }),
    [leaves, todayKey],
  );

  const pendingLeaves = useMemo(
    () =>
      leaves
        .filter((l) => l.status === "pending")
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [leaves],
  );

  const presentToday = Math.max(0, activeCount - onLeaveToday.length);

  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const employee of employees) {
      if (employee.status === "terminated") continue;
      const key = employee.department?.trim() || t("hrDashboard.departments.unknown");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [employees, t]);

  const stats = [
    { key: "employees", value: employees.length, icon: Users },
    { key: "active", value: activeCount, icon: UserCheck },
    { key: "onLeave", value: onLeaveToday.length, icon: Hourglass },
    { key: "pending", value: pendingLeaves.length, icon: Clock },
  ] as const;

  const isLoading = employeesQ.isLoading || leavesQ.isLoading;
  return (
    <div className="space-y-6">
      {/* Header + direct shortcuts into HR modules */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
            <Briefcase className="h-7 w-7 text-primary" />
            {t("hrDashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("hrDashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/hr">
              <Users className="mr-2 h-4 w-4" />
              {t("hrDashboard.quick.employees")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/hr/leaves">
              <Hourglass className="mr-2 h-4 w-4" />
              {t("hrDashboard.quick.leaves")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/hr/payroll">
              <Wallet className="mr-2 h-4 w-4" />
              {t("hrDashboard.quick.payroll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Load failure */}
      {(employeesQ.isError || leavesQ.isError) && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{t("hrDashboard.loadError")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void employeesQ.refetch();
              void leavesQ.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            {t("common.retry")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Snapshot stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.key} className="shadow-sm border-border/60 transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {t(`hrDashboard.stats.${card.key}`)}
                    </CardTitle>
                    <div className="rounded-lg bg-violet-500/10 p-2">
                      <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`hrDashboard.stats.${card.key}Hint`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pending leave requests */}
            <Card className="shadow-sm border-border/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Hourglass className="h-4 w-4 text-primary" />
                  {t("hrDashboard.pendingLeaves.title")}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/hr/leaves">
                    {t("hrDashboard.pendingLeaves.viewAll")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingLeaves.length > 0 ? (
                  <div className="space-y-3">
                    {pendingLeaves.slice(0, 5).map((leave) => (
                      <div
                        key={leave.id}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {employeeLabel(leave, employeesById)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {(leave.start_date ?? "").slice(0, 10)} → {(leave.end_date ?? "").slice(0, 10)}
                            {" · "}
                            {t("hrDashboard.pendingLeaves.days", { count: leave.days_count })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline">{leave.type}</Badge>
                          <Badge variant="warning">{t("common.pending")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Hourglass className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("hrDashboard.pendingLeaves.empty")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee attendance snapshot for today */}
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {t("hrDashboard.snapshot.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {presentToday}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("hrDashboard.snapshot.present")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {onLeaveToday.length}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("hrDashboard.snapshot.onLeave")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-center">
                    <p className="text-xl font-bold text-sky-700 dark:text-sky-300">
                      {pendingLeaves.length}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("hrDashboard.snapshot.pending")}
                    </p>
                  </div>
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("hrDashboard.snapshot.hint")}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    {t("hrDashboard.departments.title")}
                  </p>
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <div
                        key={dept.name}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5 text-sm last:border-0"
                      >
                        <span className="truncate">{dept.name}</span>
                        <Badge variant="secondary">{dept.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
