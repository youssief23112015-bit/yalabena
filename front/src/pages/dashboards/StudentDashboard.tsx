import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionsApi } from "@/api/sessions";
import { lmsApi } from "@/api/lms";
import { placementAdminApi } from "@/api/placementAdmin";
import { fetchPublicTestSlots } from "@/api/public";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import type { Group, SessionItem } from "@/types";
import {
  sessionGroupId,
  sessionSortMs,
  sessionTitle,
  sessionUiStatus,
  sessionWhen,
  type SessionUiStatus,
} from "@/lib/sessions";
import { getUserTimeZone } from "@/lib/timezone";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hourglass,
  Layers,
  RefreshCw,
  XCircle,
} from "lucide-react";

/** Elapsed % between the group's start/end dates, clamped to 0..100. */
function courseProgress(group: Group): number | null {
  if (!group.start_date || !group.end_date) return null;
  const start = new Date(group.start_date).getTime();
  const end = new Date(group.end_date).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
}

const STATUS_STYLES: Record<SessionUiStatus, string> = {
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  unscheduled: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
};

/** Badge colors for placement-test statuses (matches backend TestStatus). */
const PLACEMENT_STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  no_show: "bg-red-500/10 text-red-700 dark:text-red-300",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
};

/**
 * Distraction-free student home: my session statistics, upcoming sessions
 * (rendered in the user's time zone, default Africa/Cairo), active courses
 * with progress, and quick actions into the catalog / LMS.
 */
export default function StudentDashboard() {
  const { t, i18n } = useTranslation("common");
  const user = useAuthStore((s) => s.user);
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const timeZone = getUserTimeZone();

  // GET /sessions is role-scoped server-side to the student's own groups.
  const sessionsQ = useQuery({
    queryKey: ["dashboard", "student-sessions"],
    queryFn: () => sessionsApi.findAll(),
    retry: false,
    staleTime: 60_000,
  });
  // GET /lms/groups → my actively enrolled groups (course relation loaded).
  const groupsQ = useQuery({
    queryKey: ["dashboard", "student-groups"],
    queryFn: () => lmsApi.myGroups(),
    retry: false,
    staleTime: 60_000,
  });

  // ── Placement test: my bookings (schedule + evaluated result) and the
  //    open slots published by the public self-booking flow.
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [slotToBook, setSlotToBook] = useState("");

  const placementTestsQ = useQuery({
    queryKey: ["dashboard", "my-placement-tests"],
    queryFn: () => placementAdminApi.myTests(),
    retry: false,
    staleTime: 60_000,
  });
  const placementSlotsQ = useQuery({
    queryKey: ["public-placement-slots"],
    queryFn: () => fetchPublicTestSlots(),
    retry: false,
  });

  const bookPlacementM = useMutation({
    mutationFn: (slotId: string) => placementAdminApi.book({ slot_id: slotId }),
    onSuccess: () => {
      toast({
        title: t("studentDashboard.placement.bookedTitle", "Placement test booked"),
        description: t(
          "studentDashboard.placement.bookedDesc",
          "Your test has been scheduled. We will see you there!",
        ),
      });
      setSlotToBook("");
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "my-placement-tests"] });
      void queryClient.invalidateQueries({ queryKey: ["public-placement-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: any) =>
      toast({
        variant: "destructive",
        title: t("common.error", "Error"),
        description: e?.message,
      }),
  });

  const myGroups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);

  // Defensive double-filter: even if the API returned more than the student's
  // own sessions, only groups they belong to are ever rendered.
  const mySessions = useMemo(() => {
    const all: SessionItem[] = sessionsQ.data ?? [];
    if (!myGroups.length) return all;
    const ids = new Set(myGroups.map((g) => g.id));
    return all.filter((s) => {
      const gid = sessionGroupId(s);
      return gid ? ids.has(gid) : false;
    });
  }, [sessionsQ.data, myGroups]);

  const stats = useMemo(() => {
    const buckets: Record<SessionUiStatus, number> = { done: 0, scheduled: 0, unscheduled: 0, cancelled: 0 };
    for (const s of mySessions) buckets[sessionUiStatus(s)] += 1;
    return buckets;
  }, [mySessions]);

  // "Unscheduled" = active courses with nothing scheduled ahead on the calendar.
  const groupsAwaitingSchedule = useMemo(() => {
    const scheduledGroupIds = new Set(
      mySessions
        .filter((s) => sessionUiStatus(s) === "scheduled")
        .map((s) => sessionGroupId(s))
        .filter((gid): gid is string => Boolean(gid)),
    );
    return myGroups.filter(
      (g) => g.status !== "completed" && g.status !== "cancelled" && !scheduledGroupIds.has(g.id),
    ).length;
  }, [mySessions, myGroups]);

  const upcoming = useMemo(
    () =>
      mySessions
        .filter((s) => sessionUiStatus(s) === "scheduled")
        .sort((a, b) => sessionSortMs(a) - sessionSortMs(b))
        .slice(0, 6),
    [mySessions],
  );

  const nextByGroup = useMemo(() => {
    const map = new Map<string, SessionItem>();
    for (const s of upcoming) {
      const gid = sessionGroupId(s);
      if (gid && !map.has(gid)) map.set(gid, s);
    }
    return map;
  }, [upcoming]);

  const statCards: {
    key: "done" | "scheduled" | "unscheduled" | "cancelled";
    value: number;
    icon: typeof Clock;
  }[] = [
    { key: "done", value: stats.done, icon: CheckCircle2 },
    { key: "scheduled", value: stats.scheduled, icon: CalendarClock },
    { key: "unscheduled", value: groupsAwaitingSchedule, icon: Hourglass },
    { key: "cancelled", value: stats.cancelled, icon: XCircle },
  ];

  const isLoading = sessionsQ.isLoading || groupsQ.isLoading;
  return (
    <div className="space-y-6">
      {/* Header + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
            <GraduationCap className="h-7 w-7 text-primary" />
            {t("studentDashboard.title")}
          </h1>
          <p className="mt-1 font-medium text-foreground">
            {user ? t("studentDashboard.greeting", { name: user.first_name }) : ""}
          </p>
          <p className="text-sm text-muted-foreground">{t("studentDashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/catalog">
              <CalendarPlus className="mr-2 h-4 w-4" />
              {t("studentDashboard.actions.bookCourse")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/lms">
              <Layers className="mr-2 h-4 w-4" />
              {t("studentDashboard.actions.allCourses")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Load failure (e.g. API unreachable) */}
      {(sessionsQ.isError || groupsQ.isError) && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{t("studentDashboard.loadError")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void sessionsQ.refetch();
              void groupsQ.refetch();
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
          {/* Session statistics: Done / Scheduled / Unscheduled / Canceled */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const labelKey = card.key === "cancelled" ? "canceled" : card.key;
              return (
                <Card key={card.key} className="shadow-sm border-border/60 transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {t(`studentDashboard.stats.${labelKey}`)}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${STATUS_STYLES[card.key]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`studentDashboard.stats.${labelKey}Hint`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Upcoming Sessions (user's time zone, default Africa/Cairo) */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Clock className="h-4 w-4 text-primary" />
                {t("studentDashboard.upcoming.title")}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {t("studentDashboard.upcoming.timezoneNote", { tz: timeZone })}
              </span>
            </CardHeader>
            <CardContent>
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((s) => {
                    const when = sessionWhen(s, locale, timeZone);
                    return (
                      <div
                        key={s.id || sessionSortMs(s)}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {sessionTitle(s) || s.group?.name || t("studentDashboard.upcoming.fallbackTitle")}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.group?.name && sessionTitle(s) ? `${s.group.name} · ` : ""}
                            {when ? `${when.date} · ${when.time}` : "—"}
                          </p>
                        </div>
                        <Badge variant="info" className="shrink-0">
                          {t("studentDashboard.stats.scheduled")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("studentDashboard.upcoming.empty")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placement test: book an open slot, track status, see the result */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <GraduationCap className="h-4 w-4 text-primary" />
                {t("studentDashboard.placement.title", "Placement Test")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available slots → booking */}
              {(placementSlotsQ.data ?? []).length > 0 && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[16rem] flex-1 space-y-1">
                    <label
                      htmlFor="placement-slot"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {t("studentDashboard.placement.chooseSlot", "Available slot")}
                    </label>
                    <select
                      id="placement-slot"
                      value={slotToBook}
                      onChange={(e) => setSlotToBook(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">
                        {t("studentDashboard.placement.pickSlot", "Pick a date & time…")}
                      </option>
                      {(placementSlotsQ.data ?? []).map((s: any) => {
                        const seats = Math.max(0, (s.capacity ?? 0) - (s.booked_count ?? 0));
                        return (
                          <option key={s.id} value={s.id} disabled={seats <= 0}>
                            {s.date ?? ""} {String(s.start_time ?? "").slice(0, 5)}
                            {s.branch ? ` — ${s.branch.name}` : ""} ({seats}{" "}
                            {t("studentDashboard.placement.seats", "seats")})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    disabled={!slotToBook || bookPlacementM.isPending}
                    onClick={() => bookPlacementM.mutate(slotToBook)}
                  >
                    {bookPlacementM.isPending && (
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    {t("studentDashboard.placement.book", "Book Placement Test")}
                  </Button>
                </div>
              )}

              {/* My tests: schedule + status + evaluated degree/level */}
              {(placementTestsQ.data ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(placementTestsQ.data ?? []).map((pt) => {
                    const pct =
                      pt.written_score != null ? Math.round(Number(pt.written_score)) : null;
                    const level = pt.final_level ?? pt.suggested_level ?? null;
                    const when =
                      pt.slot?.date ??
                      (pt.scheduled_at ? String(pt.scheduled_at).slice(0, 10) : null);
                    const status = String(pt.status ?? "scheduled");
                    return (
                      <div
                        key={pt.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {when
                              ? `${when}${pt.slot?.start_time ? ` · ${String(pt.slot.start_time).slice(0, 5)}` : ""}`
                              : t("studentDashboard.placement.unknownTime", "Scheduled test")}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {pt.slot?.branch?.name ??
                              pt.slot?.mode ??
                              t("studentDashboard.placement.awaitingNotes", "Awaiting evaluation results")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {pct !== null && (
                            <Badge variant="outline" className="tabular-nums">
                              {t("studentDashboard.placement.degree", "Degree")}: {pct}%
                            </Badge>
                          )}
                          {level && (
                            <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                              {level}
                            </Badge>
                          )}
                          <Badge className={PLACEMENT_STATUS_STYLES[status] ?? ""}>
                            {status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <GraduationCap className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "studentDashboard.placement.empty",
                      "No placement test booked yet — pick a slot above to get your level assessed.",
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Courses grid with progress indicators */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("studentDashboard.courses.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/catalog">
                  {t("studentDashboard.courses.browseCatalog")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {myGroups.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {myGroups.map((g) => {
                    const progress = courseProgress(g);
                    const next = nextByGroup.get(g.id);
                    const nextWhen = next ? sessionWhen(next, locale, timeZone) : null;
                    return (
                      <div
                        key={g.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{g.course?.name ?? g.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{g.name}</p>
                          </div>
                          {g.course?.level && (
                            <Badge variant="outline" className="shrink-0">{g.course.level}</Badge>
                          )}
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t("studentDashboard.courses.progress")}</span>
                            <span>
                              {progress != null ? `${progress}%` : t("studentDashboard.courses.noProgress")}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress ?? 0}%` }}
                            />
                          </div>
                        </div>

                        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {next && nextWhen
                              ? `${nextWhen.date} · ${nextWhen.time}`
                              : t("studentDashboard.courses.noSchedule")}
                          </span>
                        </p>

                        <Button size="sm" variant="secondary" asChild className="mt-auto">
                          <Link to={`/student/courses/${g.id}`}>
                            {t("studentDashboard.courses.openCourse")}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                  <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("studentDashboard.courses.empty")}</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link to="/catalog">{t("studentDashboard.actions.bookCourse")}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
