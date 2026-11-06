import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupsApi } from "@/api/groups";
import { sessionsApi } from "@/api/sessions";
import { useAuthStore } from "@/store/authStore";
import type { Group, SessionItem } from "@/types";
import {
  sessionGroupId,
  sessionDateKey,
  sessionSortMs,
  sessionTitle,
  sessionUiStatus,
  sessionWhen,
} from "@/lib/sessions";
import { dateKeyIn, getUserTimeZone } from "@/lib/timezone";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Presentation,
  RefreshCw,
  Users,
} from "lucide-react";

const GROUP_STATUS_VARIANT: Record<string, "success" | "info" | "secondary" | "destructive"> = {
  active: "success",
  upcoming: "info",
  completed: "secondary",
  cancelled: "destructive",
};

/** True when the group belongs to this teacher (owner or substitute). */
function isMyGroup(group: Group, userId?: string): boolean {
  if (!userId) return false;
  return (
    group.teacher_id === userId ||
    group.teacherId === userId ||
    group.substitute_teacher_id === userId ||
    group.teacher?.id === userId
  );
}

/**
 * Teacher home: today's teaching schedule for MY groups, assigned groups,
 * active-courses teaching load, and quick access to attendance marking and
 * the question bank.
 */
export default function TeacherDashboard() {
  const { t, i18n } = useTranslation("common");
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const timeZone = getUserTimeZone();

  const groupsQ = useQuery({
    queryKey: ["dashboard", "teacher-groups"],
    queryFn: () => groupsApi.findAll(),
    retry: false,
    staleTime: 60_000,
  });
  const sessionsQ = useQuery({
    queryKey: ["dashboard", "teacher-sessions"],
    queryFn: () => sessionsApi.findAll(),
    retry: false,
    staleTime: 60_000,
  });

  const myGroups = useMemo(
    () => (groupsQ.data ?? []).filter((g) => isMyGroup(g, userId)),
    [groupsQ.data, userId],
  );

  const myGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);

  // Teachers receive all sessions they may access — narrow to MY groups here.
  const mySessions = useMemo(() => {
    const all: SessionItem[] = sessionsQ.data ?? [];
    if (!myGroups.length) return [];
    return all.filter((s) => {
      const gid = sessionGroupId(s);
      return gid ? myGroupIds.has(gid) : false;
    });
  }, [sessionsQ.data, myGroups, myGroupIds]);

  const todayKey = dateKeyIn(timeZone);
  const weekAheadKey = dateKeyIn(timeZone, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const todaysSchedule = useMemo(
    () =>
      mySessions
        .filter(
          (s) =>
            sessionUiStatus(s) !== "cancelled" && sessionDateKey(s, timeZone) === todayKey,
        )
        .sort((a, b) => sessionSortMs(a) - sessionSortMs(b)),
    [mySessions, timeZone, todayKey],
  );

  const sessionsThisWeek = useMemo(
    () =>
      mySessions.filter((s) => {
        const status = sessionUiStatus(s);
        if (status === "cancelled") return false;
        const key = sessionDateKey(s, timeZone);
        return key !== null && key >= todayKey && key <= weekAheadKey;
      }).length,
    [mySessions, timeZone, todayKey, weekAheadKey],
  );

  const coursesTaught = useMemo(() => {
    const seen = new Map<string, { name: string; level?: string; groups: number }>();
    for (const g of myGroups) {
      const key = g.course_id ?? g.courseId ?? g.course?.id ?? g.id;
      const existing = seen.get(key);
      if (existing) existing.groups += 1;
      else
        seen.set(key, {
          name: g.course?.name ?? t("teacherDashboard.load.unknownCourse"),
          level: g.course?.level,
          groups: 1,
        });
    }
    return [...seen.entries()].map(([id, value]) => ({ id, ...value }));
  }, [myGroups, t]);

  const stats = [
    { key: "today", value: todaysSchedule.length, icon: Clock },
    { key: "groups", value: myGroups.length, icon: Users },
    { key: "courses", value: coursesTaught.length, icon: BookOpen },
    { key: "week", value: sessionsThisWeek, icon: CalendarDays },
  ] as const;

  const isLoading = groupsQ.isLoading || sessionsQ.isLoading;
  return (
    <div className="space-y-6">
      {/* Header + quick access */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
            <Presentation className="h-7 w-7 text-primary" />
            {t("teacherDashboard.title")}
          </h1>
          <p className="mt-1 font-medium text-foreground">
            {user ? t("teacherDashboard.greeting", { name: user.first_name }) : ""}
          </p>
          <p className="text-sm text-muted-foreground">{t("teacherDashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/attendance">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {t("teacherDashboard.quick.attendance")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/instructor/question-bank">
              <HelpCircle className="mr-2 h-4 w-4" />
              {t("teacherDashboard.quick.questionBank")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Load failure */}
      {(groupsQ.isError || sessionsQ.isError) && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{t("teacherDashboard.loadError")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void groupsQ.refetch();
              void sessionsQ.refetch();
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
                      {t(`teacherDashboard.stats.${card.key}`)}
                    </CardTitle>
                    <div className="rounded-lg bg-sky-500/10 p-2">
                      <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`teacherDashboard.stats.${card.key}Hint`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Today's teaching schedule */}
            <Card className="shadow-sm border-border/60">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {t("teacherDashboard.schedule.title")}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {t("teacherDashboard.schedule.timezoneNote", { tz: timeZone })}
                </span>
              </CardHeader>
              <CardContent>
                {todaysSchedule.length > 0 ? (
                  <div className="space-y-3">
                    {todaysSchedule.map((s) => {
                      const when = sessionWhen(s, locale, timeZone);
                      return (
                        <div
                          key={s.id || sessionSortMs(s)}
                          className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-lg bg-sky-500/10 p-2">
                              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {sessionTitle(s) || s.group?.name || t("teacherDashboard.schedule.fallbackTitle")}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {s.group?.name ?? "—"}
                                {when ? ` · ${when.time}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {s.mode ? s.mode.replace("_", " ") : t("teacherDashboard.schedule.inPerson")}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("teacherDashboard.schedule.empty")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active courses teaching load */}
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {t("teacherDashboard.load.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coursesTaught.length > 0 ? (
                  <div className="space-y-3">
                    {coursesTaught.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("teacherDashboard.load.groupsCount", { count: course.groups })}
                            {course.level ? ` · ${course.level}` : ""}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {t("teacherDashboard.load.active")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("teacherDashboard.load.empty")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assigned groups */}
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Users className="h-4 w-4 text-primary" />
                {t("teacherDashboard.groups.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myGroups.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {myGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{g.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {g.course?.name ?? "—"}
                          </p>
                        </div>
                        <Badge
                          variant={GROUP_STATUS_VARIANT[g.status ?? ""] ?? "secondary"}
                          className="shrink-0"
                        >
                          {g.status ?? t("teacherDashboard.groups.unknownStatus")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {g.course?.level && <Badge variant="outline">{g.course.level}</Badge>}
                        <Badge variant="outline">{(g.mode ?? "").replace("_", " ") || "—"}</Badge>
                        <span>
                          {t("teacherDashboard.groups.capacity")}: {g.capacity ?? "—"}
                        </span>
                      </div>
                      <Button size="sm" variant="secondary" asChild className="mt-auto">
                        <Link to={`/groups`}>
                          {t("teacherDashboard.groups.open")}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                  <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("teacherDashboard.groups.empty")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
