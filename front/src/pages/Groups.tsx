import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupsApi } from "@/api/groups";
import { coursesApi } from "@/api/courses";
import { usersApi } from "@/api/users";
import { studentsApi } from "@/api/students";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Group, Course, User, GroupSchedule } from "@/types";
import {
  Plus, X, Pencil, Trash2, Eye, ChevronLeft, CalendarDays,
  Clock, AlertTriangle, MapPin, Video, Monitor, UserCog, UserPlus
} from "lucide-react";

const groupModes = ["in_person", "online", "hybrid"];
const groupStatuses = ["upcoming", "active", "completed", "cancelled"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  courseId: z.string().min(1, "Course is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  substitute_teacher_id: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  mode: z.enum(["in_person", "online", "hybrid"]).optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
  /** Recurring schedule: selected weekdays (0 = Sunday … 6 = Saturday). */
  schedule_weekdays: z
    .array(z.coerce.number().min(0).max(6))
    .min(1, "Select at least one weekday"),
  /** Recurring schedule: academy wall-clock start time (HH:MM). */
  schedule_start_time: z.string().min(1, "Start time is required"),
  /** Recurring schedule: academy wall-clock end time (HH:MM). */
  schedule_end_time: z.string().min(1, "End time is required"),
  /** The group's ONE fixed meeting URL shared by all generated sessions. */
  zoom_link: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Must be a valid http(s) URL"),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
}).refine((data) => {
  if (data.schedule_start_time && data.schedule_end_time) {
    return new Date(`1970-01-01T${data.schedule_end_time}`) > new Date(`1970-01-01T${data.schedule_start_time}`);
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["schedule_end_time"],
}).refine((data) => {
  if ((data.mode === "online" || data.mode === "hybrid") && !data.zoom_link) {
    return false;
  }
  return true;
}, {
  message: "Zoom link is required for online/hybrid groups",
  path: ["zoom_link"],
});

type GroupForm = z.infer<typeof groupSchema>;

export default function GroupsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [view, setView] = useState<"list" | "detail" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: 0, start_time: "", end_time: "" });
  const [formWeekdays, setFormWeekdays] = useState<number[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string[]>([]);

  // ── Manage Teacher modal state (direct assignment, conflict/force flow) ──
  const [teacherTarget, setTeacherTarget] = useState<Group | null>(null);
  const [teacherChoice, setTeacherChoice] = useState("");
  const [teacherError, setTeacherError] = useState<string | null>(null);

  // ── Enroll Student modal state (direct ACTIVE enrollment, capacity/force) ──
  const [enrollTarget, setEnrollTarget] = useState<Group | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.findAll(),
  });

  const { data: courses } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.findAll });
  const { data: teachers } = useQuery({ queryKey: ["users", "teachers"], queryFn: () => usersApi.findAll({ roleId: "teacher" }) });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      mode: "in_person",
      status: "upcoming",
      capacity: 20,
    },
  });

  const watchTeacherId = watch("teacherId");
  const watchStartDate = watch("start_date");
  const watchEndDate = watch("end_date");

  const { data: selectedGroup } = useQuery({
    queryKey: ["group", selectedGroupId],
    queryFn: () => groupsApi.findOne(selectedGroupId!),
    enabled: !!selectedGroupId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      console.error("Group creation error:", err);
      toast({ 
        variant: "destructive", 
        title: "Failed to create group", 
        description: err.message || err.statusCode ? `Error ${err.statusCode}: ${err.message}` : "Unknown error" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Group> }) => groupsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (selectedGroupId) queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
      toast({ title: "Group updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      console.error("Group update error:", err);
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const addScheduleMutation = useMutation({
    mutationFn: ({ id, schedule }: { id: string; schedule: Omit<GroupSchedule, "id" | "group_id"> }) => groupsApi.addSchedule(id, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
      toast({ title: "Schedule added" });
      setScheduleForm({ day_of_week: 0, start_time: "", end_time: "" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const removeScheduleMutation = useMutation({
    mutationFn: ({ id, scheduleId }: { id: string; scheduleId: string }) => groupsApi.removeSchedule(id, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
      toast({ title: "Schedule removed" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // ── Automatic recurring-session scheduling ──────────────────────
  // Activation: validate + generate sessions server-side (idempotent).
  const [activationProblems, setActivationProblems] = useState<string[]>([]);
  const activateMutation = useMutation({
    mutationFn: (id: string) => groupsApi.activate(id),
    onSuccess: (result) => {
      setActivationProblems([]);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
      toast({
        title: result.already_active ? "Group already active" : "Group activated",
        description: result.already_active
          ? `Schedule already generated (${result.total_occurrences} sessions).`
          : `${result.generated} sessions generated${result.from ? ` (${result.from} → ${result.to})` : ""}.`,
      });
    },
    onError: (err: any) => {
      const details: string[] = Array.isArray(err?.conflicts)
        ? err.conflicts.map((c: any) => String(c?.message ?? c)).filter(Boolean)
        : Array.isArray(err?.errorList)
          ? err.errorList
          : [];
      setActivationProblems(details.length > 0 ? details : [err.message || "Activation failed"]);
      toast({ variant: "destructive", title: "Activation blocked", description: err.message });
    },
  });

  // Reschedule: replace weekly windows from an effective date.
  const [rescheduleTarget, setRescheduleTarget] = useState<Group | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleWindows, setRescheduleWindows] = useState<
    Array<{ day_of_week: number; start_time: string; end_time: string }>
  >([]);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const openRescheduleDialog = (group: Group) => {
    setRescheduleTarget(group);
    setRescheduleDate(group.start_date ? group.start_date.slice(0, 10) : "");
    setRescheduleWindows(
      (group.schedule ?? []).map((s) => ({
        day_of_week: s.day_of_week,
        start_time: String(s.start_time ?? "").slice(0, 5),
        end_time: String(s.end_time ?? "").slice(0, 5),
      })),
    );
    setRescheduleError(null);
  };

  const closeRescheduleDialog = () => {
    setRescheduleTarget(null);
    setRescheduleError(null);
  };

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { effective_date: string; windows: typeof rescheduleWindows } }) =>
      groupsApi.reschedule(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", result.group_id] });
      toast({
        title: "Schedule updated",
        description: `${result.created} sessions created, ${result.deleted} replaced` +
          (result.preserved.length > 0 ? `, ${result.preserved.length} preserved (with history)` : "") + ".",
      });
      closeRescheduleDialog();
    },
    onError: (err: any) => {
      const details: string[] = Array.isArray(err?.conflicts)
        ? err.conflicts.map((c: any) => String(c?.message ?? c)).filter(Boolean)
        : Array.isArray(err?.errorList)
          ? err.errorList
          : [];
      setRescheduleError(details.length > 0 ? details.join(" • ") : err.message || "Reschedule failed");
      toast({ variant: "destructive", title: "Reschedule blocked", description: err.message });
    },
  });

  // Active students searchable for the Enroll Student modal (only while open).
  const { data: enrollableStudents } = useQuery({
    queryKey: ["students", "enroll-picker", studentSearch],
    queryFn: () =>
      studentsApi.findAll({ search: studentSearch || undefined, status: "active" }),
    enabled: enrollTarget !== null,
  });

  /**
   * Direct teacher assignment (Business Rule 1). A 409 means schedule/room
   * conflicts were detected — the modal shows them and offers a forced retry.
   */
  const assignTeacherM = useMutation({
    mutationFn: ({ group, teacher_id, force }: { group: Group; teacher_id: string; force?: boolean }) =>
      groupsApi.assignTeacher(group.id, { teacher_id, force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (selectedGroupId) queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
      if (teacherTarget) queryClient.invalidateQueries({ queryKey: ["group", teacherTarget.id] });
      toast({ title: "Teacher assigned successfully" });
      setTeacherTarget(null);
      setTeacherError(null);
    },
    onError: (err: any) => {
      if (err?.statusCode === 409) {
        setTeacherError(err.message);
        return;
      }
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  /**
   * Direct manual enrollment (Business Rule 2): ACTIVE enrollment + roster.
   * A 409 means the group is full — the modal warns and offers a forced retry.
   */
  const enrollStudentM = useMutation({
    mutationFn: ({ group, student_id, force }: { group: Group; student_id: string; force?: boolean }) =>
      groupsApi.assignStudent(group.id, { student_id, force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", enrollTarget?.id] });
      queryClient.invalidateQueries({ queryKey: ["group-students"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student enrolled — course visible in their LMS" });
      setEnrollTarget(null);
      setEnrollError(null);
      setEnrollStudentId("");
      setStudentSearch("");
    },
    onError: (err: any) => {
      if (err?.statusCode === 409) {
        setEnrollError(err.message);
        return;
      }
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const openTeacherModal = (group: Group) => {
    setTeacherTarget(group);
    setTeacherChoice(group.teacher_id ?? "");
    setTeacherError(null);
  };

  const openEnrollModal = (group: Group) => {
    setEnrollTarget(group);
    setEnrollStudentId("");
    setStudentSearch("");
    setEnrollError(null);
  };

  const closeTeacherModal = () => {
    setTeacherTarget(null);
    setTeacherError(null);
  };

  const closeEnrollModal = () => {
    setEnrollTarget(null);
    setEnrollStudentId("");
    setStudentSearch("");
    setEnrollError(null);
  };

  // ── Manage Teacher modal (conflict → 409 → "Assign Anyway" force flow) ──
  const teacherDialog = teacherTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UserCog className="h-5 w-5" /> Manage Teacher
          </h2>
          <Button variant="ghost" size="icon" onClick={closeTeacherModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {teacherTarget.name}
          {teacherTarget.teacher
            ? ` — currently ${teacherTarget.teacher.first_name} ${teacherTarget.teacher.last_name}`
            : " — unassigned"}
        </p>

        <div className="mt-4 space-y-2">
          <Label>Teacher</Label>
          <select
            value={teacherChoice}
            onChange={(e) => {
              setTeacherChoice(e.target.value);
              setTeacherError(null);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select teacher…</option>
            {teachers?.map((u: User) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </div>

        {teacherError && (
          <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/40">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Scheduling conflicts detected</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">{teacherError}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={assignTeacherM.isPending}
                onClick={() =>
                  assignTeacherM.mutate({ group: teacherTarget, teacher_id: teacherChoice, force: true })
                }
              >
                {assignTeacherM.isPending ? "Assigning…" : "Assign Anyway (Override)"}
              </Button>
              <Button size="sm" variant="ghost" onClick={closeTeacherModal}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeTeacherModal}>
            Cancel
          </Button>
          <Button
            disabled={!teacherChoice || Boolean(teacherError) || assignTeacherM.isPending}
            onClick={() =>
              assignTeacherM.mutate({ group: teacherTarget, teacher_id: teacherChoice })
            }
          >
            {assignTeacherM.isPending ? "Assigning…" : "Assign Teacher"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Enroll Student modal (capacity → 409 → "Enroll Anyway" force flow) ──
  const rosterIds = new Set((enrollTarget?.students ?? []).map((s) => s.id));
  const isFull =
    enrollTarget != null &&
    (enrollTarget.student_count ?? 0) >= (enrollTarget.capacity ?? Number.MAX_SAFE_INTEGER);

  const enrollDialog = enrollTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UserPlus className="h-5 w-5" /> Enroll Student
          </h2>
          <Button variant="ghost" size="icon" onClick={closeEnrollModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {enrollTarget.name}
          {enrollTarget.course?.name ? ` — ${enrollTarget.course.name}` : ""} ·{" "}
          {enrollTarget.student_count ?? 0} / {enrollTarget.capacity ?? "—"} seats
        </p>

        {isFull && (
          <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
            This group is at full capacity — enrolling will require an admin override.
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Label>Search active students</Label>
          <Input
            placeholder="Name, email or student number…"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
          <select
            value={enrollStudentId}
            onChange={(e) => {
              setEnrollStudentId(e.target.value);
              setEnrollError(null);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">
              {(enrollableStudents ?? []).length === 0 ? "No students match" : "Select student…"}
            </option>
            {(enrollableStudents ?? []).map((s) => {
              const label = s.user
                ? `${s.user.first_name ?? ""} ${s.user.last_name ?? ""}`.trim()
                : s.id.slice(0, 8);
              const already = rosterIds.has(s.id);
              return (
                <option key={s.id} value={s.id} disabled={already}>
                  {label}
                  {already ? " (already enrolled)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {enrollError && (
          <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/40">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Cannot enroll</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">{enrollError}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={enrollStudentM.isPending}
                onClick={() =>
                  enrollStudentM.mutate({
                    group: enrollTarget,
                    student_id: enrollStudentId,
                    force: true,
                  })
                }
              >
                {enrollStudentM.isPending ? "Enrolling…" : "Enroll Anyway (Override)"}
              </Button>
              <Button size="sm" variant="ghost" onClick={closeEnrollModal}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeEnrollModal}>
            Cancel
          </Button>
          <Button
            disabled={!enrollStudentId || Boolean(enrollError) || enrollStudentM.isPending}
            onClick={() =>
              enrollStudentM.mutate({ group: enrollTarget, student_id: enrollStudentId })
            }
          >
            {enrollStudentM.isPending ? "Enrolling…" : "Enroll Student"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Reschedule dialog: new weekly windows from an effective date ──
  const rescheduleDialog = rescheduleTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5" /> Update Schedule From Date
          </h2>
          <Button variant="ghost" size="icon" onClick={closeRescheduleDialog}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{rescheduleTarget.name}</p>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Effective date — sessions before this date stay unchanged</Label>
            <Input
              type="date"
              value={rescheduleDate}
              min={rescheduleTarget.start_date?.slice(0, 10)}
              max={rescheduleTarget.end_date?.slice(0, 10)}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">New weekly windows</Label>
            {rescheduleWindows.map((w, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <select
                  value={w.day_of_week}
                  onChange={(e) =>
                    setRescheduleWindows((ws) =>
                      ws.map((x, i) => (i === idx ? { ...x, day_of_week: Number(e.target.value) } : x)),
                    )
                  }
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {daysOfWeek.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
                <div>
                  <Label className="text-[10px] mb-0.5 block">Start</Label>
                  <Input
                    type="time"
                    value={w.start_time}
                    onChange={(e) =>
                      setRescheduleWindows((ws) =>
                        ws.map((x, i) => (i === idx ? { ...x, start_time: e.target.value } : x)),
                      )
                    }
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-[10px] mb-0.5 block">End</Label>
                  <Input
                    type="time"
                    value={w.end_time}
                    onChange={(e) =>
                      setRescheduleWindows((ws) =>
                        ws.map((x, i) => (i === idx ? { ...x, end_time: e.target.value } : x)),
                      )
                    }
                    className="h-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setRescheduleWindows((ws) => ws.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setRescheduleWindows((ws) => [...ws, { day_of_week: 0, start_time: "", end_time: "" }])
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add Window
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sessions with attendance history are preserved; future sessions without history are replaced to match
            the new schedule. Past sessions are never touched.
          </p>

          {rescheduleError && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" /> Schedule change blocked
              </div>
              <p className="mt-1">{rescheduleError}</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={closeRescheduleDialog}>
            Cancel
          </Button>
          <Button
            disabled={
              !rescheduleDate ||
              rescheduleWindows.length === 0 ||
              rescheduleWindows.some((w) => !w.start_time || !w.end_time) ||
              rescheduleMutation.isPending
            }
            onClick={() =>
              rescheduleMutation.mutate({
                id: rescheduleTarget.id,
                payload: { effective_date: rescheduleDate, windows: rescheduleWindows },
              })
            }
          >
            {rescheduleMutation.isPending ? "Applying…" : "Apply New Schedule"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const checkConflictsMutation = useMutation({
    mutationFn: groupsApi.checkConflicts,
    onSuccess: (result) => {
      setConflictWarning(result.conflicts ? result.details : []);
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setConflictWarning([]);
    reset();
  };

  const onSubmit = async (data: GroupForm) => {
    const dto = {
      name: data.name,
      courseId: data.courseId,
      teacherId: data.teacherId,
      substitute_teacher_id: data.substitute_teacher_id || undefined,
      capacity: Number(data.capacity),
      mode: data.mode,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      zoom_link: data.zoom_link?.trim() || null,
    };

    console.log("Submitting Payload:", dto);

    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      try {
        const group = await createMutation.mutateAsync(dto);

        // Create a schedule window for EVERY selected weekday using the
        // existing /groups/{id}/schedule endpoint.  Use
        // Promise.allSettled so that individual failures do not abort the
        // whole operation — the group is kept and the user is informed.
        const schedulePromises = data.schedule_weekdays.map((day) =>
          groupsApi.addSchedule(group.id, {
            day_of_week: day,
            start_time: data.schedule_start_time,
            end_time: data.schedule_end_time,
          })
        );
        const scheduleResults = await Promise.allSettled(schedulePromises);

        const failed = scheduleResults.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        );
        const succeeded = scheduleResults.filter(
          (r): r is PromiseFulfilledResult<GroupSchedule> =>
            r.status === "fulfilled"
        );

        const succeededCount = succeeded.length;

        if (failed.length > 0) {
          // Group was created successfully; do NOT roll it back.
          // Report which windows failed and which succeeded, and give the
          // user a safe recovery path (re‑try via “Update Schedule” later).
          const failedMsgs = failed.map((f) => f.reason?.message || "Unknown schedule error");
          throw new Error(
            `Group created successfully (${
              succeededCount > 0 ? succeededCount + ' schedule window' : 'no schedule windows'
            }${succeededCount !== 1 ? 's' : ''} created), ` +
              `but schedule creation${failed.length > 1 ? 's' : ''} failed: ${failedMsgs.join(
                '; '
              )}. The group was not rolled back. You can add the missing schedule windows via the "Update Schedule" feature later.`
          );
        }

        // All schedules created successfully.
        queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
        toast({
          title: "Group created successfully",
          description: succeededCount > 0
            ? `${succeededCount} schedule window${succeededCount !== 1 ? 's' : ''} created.`
            : "Group created with no schedule windows.",
        });
        closeForm();
      } catch (err: any) {
        console.error("Group creation error:", err);
        toast({
          variant: "destructive",
          title: "Failed to create group",
          description: err.message || "Unknown error",
        });
      }
    }
  };

  const startEdit = (group: Group) => {
    setEditingId(group.id);
    setShowForm(true);
    setValue("name", group.name);
    setValue("courseId", group.courseId || "");
    setValue("teacherId", group.teacherId || "");
    setValue("substitute_teacher_id", group.substitute_teacher_id || "");
    setValue("capacity", group.capacity || 20);
    setValue("mode", group.mode || "in_person");
    setValue("start_date", group.start_date ? group.start_date.slice(0, 10) : "");
    setValue("end_date", group.end_date ? group.end_date.slice(0, 10) : "");
    setValue("status", group.status || "upcoming");
    setValue("zoom_link", group.zoom_link || "");
    // Recurring schedule: populate from the first schedule window if present.
    const firstSch = (group.schedule ?? [])[0];
    if (firstSch) {
      setValue("schedule_weekdays", [firstSch.day_of_week]);
      setValue("schedule_start_time", String(firstSch.start_time).slice(0, 5));
      setValue("schedule_end_time", String(firstSch.end_time).slice(0, 5));
      setFormWeekdays([firstSch.day_of_week]);
    } else {
      setValue("schedule_weekdays", []);
      setValue("schedule_start_time", "");
      setValue("schedule_end_time", "");
      setFormWeekdays([]);
    }
  };

  const checkConflicts = () => {
    if (watchTeacherId || watchStartDate) {
      checkConflictsMutation.mutate({
        teacherId: watchTeacherId || undefined,
        start_time: watchStartDate ? `${watchStartDate}T00:00:00` : undefined,
        end_time: watchEndDate ? `${watchEndDate}T23:59:59` : undefined,
        excludeGroupId: editingId || undefined,
      });
    }
  };

  const modeIcon = (mode?: string) => {
    if (mode === "online") return <Video className="h-3 w-3" />;
    if (mode === "hybrid") return <Monitor className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
  };

  const columns = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "course",
      header: "Course",
      render: (row: Group) => <span className="text-sm">{row.course?.name || row.courseId || "—"}</span>,
    },
    {
      key: "teacher",
      header: "Teacher",
      render: (row: Group) => <span className="text-xs">{row.teacher ? `${row.teacher.first_name} ${row.teacher.last_name}` : "Unassigned"}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (row: Group) => <span className="text-xs">{row.student_count ?? 0} / {row.capacity ?? "—"}</span>,
    },
    {
      key: "mode",
      header: "Mode",
      render: (row: Group) => (
        <Badge variant="outline" className="gap-1 text-[10px]">
          {modeIcon(row.mode)} {row.mode || "in_person"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: Group) => (
        <Badge className={
          row.status === "active" ? "bg-green-100 text-green-800" :
          row.status === "completed" ? "bg-blue-100 text-blue-800" :
          row.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-yellow-100 text-yellow-800"
        }>
          {row.status || "upcoming"}
        </Badge>
      ),
    },
    {
      key: "start_date",
      header: "Period",
      render: (row: Group) => (
        <span className="text-xs text-muted-foreground">
          {row.start_date ? new Date(row.start_date).toLocaleDateString() : "—"} — {row.end_date ? new Date(row.end_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: Group) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedGroupId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {!isStudent && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Manage Teacher" onClick={(e) => { e.stopPropagation(); openTeacherModal(row); }}>
                <UserCog className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Group", description: `Delete ${row.name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (view === "calendar") {
    return (
      <div className="space-y-6">
        {dialog}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Group Calendar</h1>
          <Button variant="outline" onClick={() => setView("list")}>Back to List</Button>
        </div>
        <div className="flex gap-3 items-center">
          <Input type="date" value={calendarDate} onChange={(e) => setCalendarDate(e.target.value)} className="w-40" />
          <div className="flex gap-1">
            {(["day", "week", "month"] as const).map((v) => (
              <Button key={v} variant={calendarView === v ? "default" : "outline"} size="sm" onClick={() => setCalendarView(v)} className="capitalize">{v}</Button>
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-12">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Calendar view for {calendarView} starting {new Date(calendarDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "detail" && selectedGroup) {
    return (
      <div className="space-y-6">
        {dialog}
        {teacherDialog}
        {enrollDialog}
        {rescheduleDialog}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedGroupId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Groups
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedGroup.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge>{selectedGroup.course?.name || selectedGroup.courseId || "—"}</Badge>
              <Badge className={
                selectedGroup.status === "active" ? "bg-green-100 text-green-800" :
                selectedGroup.status === "completed" ? "bg-blue-100 text-blue-800" :
                selectedGroup.status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }>{selectedGroup.status || "upcoming"}</Badge>
              <Badge variant="outline" className="gap-1">{modeIcon(selectedGroup.mode)} {selectedGroup.mode || "in_person"}</Badge>
            </div>
          </div>
          {!isStudent && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => openTeacherModal(selectedGroup)}>
                <UserCog className="h-4 w-4 mr-2" /> Manage Teacher
              </Button>
              <Button variant="outline" onClick={() => openEnrollModal(selectedGroup)}>
                <UserPlus className="h-4 w-4 mr-2" /> Enroll Student
              </Button>
              <Button variant="outline" onClick={() => openRescheduleDialog(selectedGroup)}>
                <CalendarDays className="h-4 w-4 mr-2" /> Update Schedule
              </Button>
              <Button
                onClick={() => activateMutation.mutate(selectedGroup.id)}
                disabled={activateMutation.isPending}
                title="Validate the schedule and generate all sessions"
              >
                {activateMutation.isPending
                  ? "Activating…"
                  : selectedGroup.status === "active"
                    ? "Re-run Activation"
                    : "Activate & Generate Sessions"}
              </Button>
              <Button onClick={() => startEdit(selectedGroup)}><Pencil className="h-4 w-4 mr-2" /> Edit Group</Button>
            </div>
          )}
        </div>

        {/* Activation result: structured conflicts / configuration errors */}
        {activationProblems.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Activation blocked — fix the following and retry:</span>
            </div>
            <ul className="mt-2 ml-6 space-y-1 text-sm list-disc">
              {activationProblems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Nothing was changed — no sessions were generated and the group status was not modified.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-lg font-bold">{selectedGroup.student_count ?? 0} / {selectedGroup.capacity ?? "—"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Teacher</p><p className="text-lg font-bold">{selectedGroup.teacher ? `${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}` : "Unassigned"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Mode</p><p className="text-lg font-bold capitalize">{selectedGroup.mode || "in_person"}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="students">Students ({selectedGroup.students?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Schedule</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div>
                    <Label className="text-xs mb-1 block">Day</Label>
                    <select
                      value={scheduleForm.day_of_week}
                      onChange={(e) => setScheduleForm((s) => ({ ...s, day_of_week: parseInt(e.target.value) }))}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {daysOfWeek.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Start Time</Label>
                    <Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm((s) => ({ ...s, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Time</Label>
                    <Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm((s) => ({ ...s, end_time: e.target.value }))} />
                  </div>
                  <Button
                    onClick={() => {
                      if (scheduleForm.start_time && scheduleForm.end_time) {
                        addScheduleMutation.mutate({
                          id: selectedGroup.id,
                          schedule: { day_of_week: scheduleForm.day_of_week, start_time: scheduleForm.start_time, end_time: scheduleForm.end_time },
                        });
                      }
                    }}
                    disabled={!scheduleForm.start_time || !scheduleForm.end_time || addScheduleMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Weekly Schedule</h3>
              {selectedGroup.schedule && selectedGroup.schedule.length > 0 ? (
                <div className="grid gap-2">
                  {selectedGroup.schedule.map((sch: GroupSchedule) => (
                    <Card key={sch.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{daysOfWeek[sch.day_of_week]}</span>
                          <span className="text-sm text-muted-foreground">{sch.start_time} — {sch.end_time}</span>
                          {sch.room && <Badge variant="outline" className="text-[10px]">{sch.room.name}</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeScheduleMutation.mutate({ id: selectedGroup.id, scheduleId: sch.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No schedule set.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            {!isStudent && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => openEnrollModal(selectedGroup)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Enroll Student
                </Button>
              </div>
            )}
            {selectedGroup.students && selectedGroup.students.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedGroup.students.map((student) => {
                  const firstName = student.user?.first_name || student.first_name || "—";
                  const lastName = student.user?.last_name || student.last_name || "";
                  const contact = student.user?.email || student.user?.phone || student.email || student.phone || "—";
                  return (
                    <Card key={student.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {firstName[0]}{lastName[0] || ""}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{firstName} {lastName}</p>
                          <p className="text-xs text-muted-foreground">{contact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled.
                {!isStudent && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEnrollModal(selectedGroup)}>
                      <UserPlus className="h-4 w-4 mr-1" /> Enroll Student
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Course:</span><span>{selectedGroup.course?.name || "—"}</span>
                                    <span className="text-muted-foreground">Teacher:</span><span>{selectedGroup.teacher ? `${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}` : "—"}</span>
                  <span className="text-muted-foreground">Substitute:</span><span>{selectedGroup.substitute_teacher ? `${selectedGroup.substitute_teacher.first_name} ${selectedGroup.substitute_teacher.last_name}` : "—"}</span>
                  <span className="text-muted-foreground">Capacity:</span><span>{selectedGroup.capacity || "—"}</span>
                  <span className="text-muted-foreground">Mode:</span><span className="capitalize">{selectedGroup.mode || "in_person"}</span>
                  <span className="text-muted-foreground">Zoom Link:</span>
                  <span className="truncate">
                    {selectedGroup.zoom_link ? (
                      <a href={selectedGroup.zoom_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {selectedGroup.zoom_link}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="text-muted-foreground">Start Date:</span><span>{selectedGroup.start_date ? new Date(selectedGroup.start_date).toLocaleDateString() : "—"}</span>
                  <span className="text-muted-foreground">End Date:</span><span>{selectedGroup.end_date ? new Date(selectedGroup.end_date).toLocaleDateString() : "—"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dialog}
      {teacherDialog}
      {enrollDialog}
      {rescheduleDialog}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.groups")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("calendar")}><CalendarDays className="h-4 w-4 mr-1" /> Calendar</Button>
          {!isStudent && (
            <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
              {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {showForm ? "Cancel" : "Add Group"}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Group" : "Create New Group"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Course *</Label>
                  <select {...register("courseId")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select course</option>
                    {courses?.map((c: Course) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.courseId && <p className="text-sm text-destructive">{errors.courseId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Teacher *</Label>
                  <select {...register("teacherId")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" onBlur={checkConflicts}>
                    <option value="">Select teacher</option>
                    {teachers?.map((u: User) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                  {errors.teacherId && <p className="text-sm text-destructive">{errors.teacherId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Substitute Teacher</Label>
                  <select {...register("substitute_teacher_id")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">None</option>
                    {teachers?.map((u: User) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Capacity *</Label>
                  <Input type="number" {...register("capacity")} />
                  {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Mode</Label>
                  <select {...register("mode")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {groupModes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...register("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {groupStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" {...register("start_date")} />
                  {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" {...register("end_date")} />
                  {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
                </div>

                {/* Recurring schedule section */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-medium">Recurring Schedule</Label>
                  <p className="text-xs text-muted-foreground">
                    Sessions are generated automatically for each selected weekday.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {daysOfWeek.map((d, i) => (
                      <label key={i} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          value={i}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setFormWeekdays((prev) =>
                              val
                                ? [...prev, i]
                                : prev.filter((x) => x !== i)
                            );
                          }}
                          defaultChecked={formWeekdays.includes(i)}
                          className="rounded border-input bg-background text-sm"
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                  {errors.schedule_weekdays && <p className="text-sm text-destructive">{errors.schedule_weekdays.message}</p>}
                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        {...register("schedule_start_time")}
                      />
                      {errors.schedule_start_time && <p className="text-sm text-destructive">{errors.schedule_start_time.message}</p>}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        {...register("schedule_end_time")}
                      />
                      {errors.schedule_end_time && <p className="text-sm text-destructive">{errors.schedule_end_time.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Zoom Recurring Meeting Link</Label>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/…"
                    {...register("zoom_link")}
                  />
                  {errors.zoom_link && <p className="text-sm text-destructive">{errors.zoom_link.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Create a recurring meeting in Zoom for this group, then paste its link here once. All sessions of this group will use it automatically.
                  </p>
                </div>
              </div>

              {conflictWarning.length > 0 && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Scheduling Conflicts Detected:</span>
                  </div>
                  <ul className="mt-1 ml-6 text-sm text-yellow-700 list-disc">
                    {conflictWarning.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="ml-2">Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={groups || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => { setSelectedGroupId(row.id); setView("detail"); }}
        pageSize={10}
      />
    </div>
  );
}