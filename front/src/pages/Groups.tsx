import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupsApi } from "@/api/groups";
import { coursesApi } from "@/api/courses";
import { branchesApi } from "@/api/branches";
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
import type { Group, Course, Branch, User, GroupSchedule } from "@/types";
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
  branchId: z.string().min(1, "Branch is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  substitute_teacher_id: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  mode: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  status: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
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
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: branchesApi.findAll });
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
            {(enrollableStudents ?? []).map((s: any) => {
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

  const onSubmit = (data: GroupForm) => {
    const dto = {
      name: data.name,
      courseId: data.courseId,
      branchId: data.branchId,
      teacherId: data.teacherId,
      substitute_teacher_id: data.substitute_teacher_id || undefined,
      capacity: Number(data.capacity),
      mode: data.mode as any,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as any,
    };
    
    console.log("Submitting Payload:", dto);

    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const startEdit = (group: Group) => {
    setEditingId(group.id);
    setShowForm(true);
    setValue("name", group.name);
    setValue("courseId", group.courseId || "");
    setValue("branchId", group.branchId || "");
    setValue("teacherId", group.teacherId || "");
    setValue("substitute_teacher_id", group.substitute_teacher_id || "");
    setValue("capacity", group.capacity || 20);
    setValue("mode", group.mode || "in_person");
    setValue("start_date", group.start_date ? group.start_date.slice(0, 10) : "");
    setValue("end_date", group.end_date ? group.end_date.slice(0, 10) : "");
    setValue("status", group.status || "upcoming");
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
      key: "branch",
      header: "Branch",
      render: (row: Group) => <span className="text-xs text-muted-foreground">{row.branch?.name || row.branchId || "—"}</span>,
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
              <Button onClick={() => startEdit(selectedGroup)}><Pencil className="h-4 w-4 mr-2" /> Edit Group</Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-lg font-bold">{selectedGroup.student_count ?? 0} / {selectedGroup.capacity ?? "—"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Teacher</p><p className="text-lg font-bold">{selectedGroup.teacher ? `${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}` : "Unassigned"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Branch</p><p className="text-lg font-bold">{selectedGroup.branch?.name || selectedGroup.branchId || "—"}</p></CardContent></Card>
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
                  <span className="text-muted-foreground">Branch:</span><span>{selectedGroup.branch?.name || "—"}</span>
                  <span className="text-muted-foreground">Teacher:</span><span>{selectedGroup.teacher ? `${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}` : "—"}</span>
                  <span className="text-muted-foreground">Substitute:</span><span>{selectedGroup.substitute_teacher ? `${selectedGroup.substitute_teacher.first_name} ${selectedGroup.substitute_teacher.last_name}` : "—"}</span>
                  <span className="text-muted-foreground">Capacity:</span><span>{selectedGroup.capacity || "—"}</span>
                  <span className="text-muted-foreground">Mode:</span><span className="capitalize">{selectedGroup.mode || "in_person"}</span>
                  <span className="text-muted-foreground">Meeting Link:</span><span>{selectedGroup.meeting_link || "—"}</span>
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
                  <Label>Branch *</Label>
                  <select 
                    {...register("branchId")} 
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select branch</option>
                    {branches?.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
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