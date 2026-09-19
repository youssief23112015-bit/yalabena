import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sessionsApi } from "@/api/sessions";
import { groupsApi } from "@/api/groups";
import { studentsApi } from "@/api/students";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { SessionItem, Group, Attendance, Student } from "@/types";
import {
  Plus, X, Pencil, Trash2, Eye, ChevronLeft,
  CheckCircle2, QrCode, Lock, Unlock, PlayCircle, Ban
} from "lucide-react";

const sessionTypes = ["in_person", "online", "hybrid"];
const sessionStatuses = ["scheduled", "completed", "cancelled"];
const attendanceStatuses = ["present", "absent", "late", "excused"] as const;

const sessionSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  title: z.string().min(1, "Title is required"),
  topic: z.string().optional(),
  notes: z.string().optional(),
  session_type: z.string().min(1, "Type is required"),
  meeting_link: z.string().optional(),
  classroomId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: z.string().optional(),
});

type SessionForm = z.infer<typeof sessionSchema>;

const formatTimeDisplay = (dateStr?: string, timeStr?: string) => {
  if (!timeStr) return dateStr || "—";
  if (!dateStr) return timeStr;
  return `${dateStr} ${timeStr}`;
};

export default function SessionsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [view, setView] = useState<"list" | "detail">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance["status"]>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});

  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sessions", filterGroupId],
    queryFn: () => sessionsApi.findAll(filterGroupId || undefined),
  });

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

  const { data: selectedSession } = useQuery({
    queryKey: ["session", selectedSessionId],
    queryFn: () => sessionsApi.findOne(selectedSessionId!),
    enabled: !!selectedSessionId && view === "detail",
  });

  const { data: sessionAttendance } = useQuery({
    queryKey: ["session-attendance", selectedSessionId],
    queryFn: () => sessionsApi.getAttendance(selectedSessionId!),
    enabled: !!selectedSessionId && view === "detail",
  });

  const targetGroupId = selectedSession?.groupId || (selectedSession as any)?.group_id;

  const { data: groupStudents } = useQuery({
    queryKey: ["group-students", targetGroupId],
    queryFn: () => studentsApi.findAll({ groupId: targetGroupId! }),
    enabled: !!targetGroupId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<SessionItem> }) => sessionsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (selectedSessionId) queryClient.invalidateQueries({ queryKey: ["session", selectedSessionId] });
      toast({ title: "Session updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sessionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => sessionsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (selectedSessionId) queryClient.invalidateQueries({ queryKey: ["session", selectedSessionId] });
      toast({ title: "Session cancelled" });
      setShowCancelDialog(false);
      setCancelReason("");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: ({ id, attendances }: { id: string; attendances: any[] }) => sessionsApi.recordAttendance(id, attendances),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-attendance", selectedSessionId] });
      toast({ title: "Attendance recorded" });
      setAttendanceMap({});
      setAttendanceNotes({});
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const lockAttendanceMutation = useMutation({
    mutationFn: sessionsApi.lockAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", selectedSessionId] });
      toast({ title: "Attendance locked" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const generateQrMutation = useMutation({
    mutationFn: sessionsApi.generateQrCode,
    onSuccess: (data) => {
      toast({ title: "QR Code generated", description: `Check-in code: ${data.check_in_code}` });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { session_type: "in_person", status: "scheduled" },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: SessionForm) => {
    const dto: any = {
      groupId: data.groupId,
      title: data.title,
      topic: data.topic,
      notes: data.notes,
      session_type: data.session_type,
      meeting_link: data.meeting_link,
      classroomId: data.classroomId,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const startEdit = (session: SessionItem | any) => {
    setEditingId(session.id);
    setShowForm(true);
    setValue("groupId", session.groupId || session.group_id || "");
    setValue("title", session.title || "");
    setValue("topic", session.topic || "");
    setValue("notes", session.notes || "");
    setValue("session_type", session.session_type || "in_person");
    setValue("meeting_link", session.meeting_link || "");
    setValue("classroomId", session.classroomId || session.classroom_id || "");
    setValue("date", session.date ? String(session.date).slice(0, 10) : "");
    setValue("start_time", session.start_time ? String(session.start_time).slice(0, 5) : "");
    setValue("end_time", session.end_time ? String(session.end_time).slice(0, 5) : "");
    setValue("status", session.status || "scheduled");
  };

  const handleSaveAttendance = () => {
    if (!selectedSession) return;
    const students = groupStudents || [];
    const attendances = students.map((student: Student) => ({
      student_id: student.id,
      status: attendanceMap[student.id] || "absent",
      notes: attendanceNotes[student.id] || undefined,
    }));
    recordAttendanceMutation.mutate({ id: selectedSession.id, attendances });
  };

  const getAttendanceForStudent = (studentId: string): Attendance | undefined => {
    return sessionAttendance?.find((a: Attendance) => a.student_id === studentId);
  };

  const columns = [
    { key: "title", header: "Title", sortable: true },
    {
      key: "group",
      header: "Group",
      render: (row: SessionItem | any) => (
        <span className="text-sm">{row.group?.name || row.groupId || row.group_id || "—"}</span>
      ),
    },
    {
      key: "session_type",
      header: "Type",
      render: (row: SessionItem) => (
        <Badge variant="outline" className="text-[10px]">
          {row.session_type}
        </Badge>
      ),
    },
    {
      key: "start_time",
      header: "Start",
      render: (row: SessionItem | any) => (
        <span className="text-xs">{formatTimeDisplay(row.date, row.start_time)}</span>
      ),
    },
    {
      key: "end_time",
      header: "End",
      render: (row: SessionItem | any) => <span className="text-xs">{row.end_time || "—"}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: SessionItem) => (
        <Badge className={
          row.status === "completed" ? "bg-green-100 text-green-800" :
          row.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-blue-100 text-blue-800"
        }>
          {row.status || "scheduled"}
        </Badge>
      ),
    },
    {
      key: "attendance_locked",
      header: "Locked",
      render: (row: SessionItem) => (
        row.attendance_locked ? <Lock className="h-3 w-3 text-red-500" /> : <Unlock className="h-3 w-3 text-green-500" />
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: SessionItem) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedSessionId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {!isStudent && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Session", description: `Delete ${row.title}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (view === "detail" && selectedSession) {
    const students = groupStudents || [];
    const isLocked = selectedSession.attendance_locked;

    return (
      <div className="space-y-6">
        {dialog}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedSessionId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Sessions
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedSession.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={
                selectedSession.status === "completed" ? "bg-green-100 text-green-800" :
                selectedSession.status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }>{selectedSession.status || "scheduled"}</Badge>
              <Badge variant="outline" className="text-[10px]">{selectedSession.session_type}</Badge>
              {selectedSession.attendance_locked && <Badge variant="destructive" className="text-[10px]"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {!isStudent && (
              <Button variant="outline" size="sm" onClick={() => startEdit(selectedSession)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
            )}
            {selectedSession.status !== "cancelled" && (
              <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)}><Ban className="h-4 w-4 mr-1" /> Cancel</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => generateQrMutation.mutate(selectedSession.id)}><QrCode className="h-4 w-4 mr-1" /> QR Code</Button>
          </div>
        </div>

        {showCancelDialog && (
          <Card className="border-destructive">
            <CardHeader><CardTitle className="text-base text-destructive">Cancel Session</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Reason for cancellation</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Enter cancellation reason..." />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => cancelMutation.mutate({ id: selectedSession.id, reason: cancelReason })} disabled={!cancelReason.trim() || cancelMutation.isPending}>
                  {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
                </Button>
                <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancelReason(""); }}>Abort</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Group</p><p className="text-lg font-bold">{selectedSession.group?.name || selectedSession.groupId || (selectedSession as any).group_id || "—"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Date & Time</p><p className="text-lg font-bold">{formatTimeDisplay((selectedSession as any).date, selectedSession.start_time)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">End Time</p><p className="text-lg font-bold">{selectedSession.end_time || "—"}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="info">Session Info</TabsTrigger>
            <TabsTrigger value="recording">Recording</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Student Attendance ({students.length})</h3>
              <div className="flex gap-2">
                {!isLocked && (
                  <Button size="sm" onClick={handleSaveAttendance} disabled={recordAttendanceMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Save Attendance
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => lockAttendanceMutation.mutate(selectedSession.id)} disabled={lockAttendanceMutation.isPending}>
                  {isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                  {isLocked ? "Unlock" : "Lock"}
                </Button>
              </div>
            </div>

            {students.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                      <th className="px-4 py-2 text-left">Previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: Student) => {
                      const existing = getAttendanceForStudent(student.id);
                      const currentStatus = attendanceMap[student.id] || existing?.status || "absent";
                      return (
                        <tr key={student.id} className="border-t">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </div>
                              <span className="text-sm">{student.first_name} {student.last_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={currentStatus}
                              onChange={(e) => setAttendanceMap((m) => ({ ...m, [student.id]: e.target.value as Attendance["status"] }))}
                              disabled={isLocked}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {attendanceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              value={attendanceNotes[student.id] || existing?.notes || ""}
                              onChange={(e) => setAttendanceNotes((n) => ({ ...n, [student.id]: e.target.value }))}
                              disabled={isLocked}
                              className="h-8 text-xs"
                              placeholder="Notes..."
                            />
                          </td>
                          <td className="px-4 py-2">
                            {existing && (
                              <Badge className={
                                existing.status === "present" ? "bg-green-100 text-green-800" :
                                existing.status === "absent" ? "bg-red-100 text-red-800" :
                                existing.status === "late" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {existing.status}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No students in this group.</div>
            )}

            {sessionAttendance && sessionAttendance.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Attendance Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div><p className="text-2xl font-bold text-green-600">{sessionAttendance.filter((a: Attendance) => a.status === "present").length}</p><p className="text-xs text-muted-foreground">Present</p></div>
                    <div><p className="text-2xl font-bold text-red-600">{sessionAttendance.filter((a: Attendance) => a.status === "absent").length}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                    <div><p className="text-2xl font-bold text-yellow-600">{sessionAttendance.filter((a: Attendance) => a.status === "late").length}</p><p className="text-xs text-muted-foreground">Late</p></div>
                    <div><p className="text-2xl font-bold text-gray-600">{sessionAttendance.filter((a: Attendance) => a.status === "excused").length}</p><p className="text-xs text-muted-foreground">Excused</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Topic:</span><span>{selectedSession.topic || "—"}</span>
                  <span className="text-muted-foreground">Notes:</span><span>{selectedSession.notes || "—"}</span>
                  <span className="text-muted-foreground">Meeting Link:</span><span>{selectedSession.meeting_link ? <a href={selectedSession.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open Link</a> : "—"}</span>
                  <span className="text-muted-foreground">Classroom:</span><span>{(selectedSession as any).classroomId || (selectedSession as any).classroom_id || "—"}</span>
                  <span className="text-muted-foreground">Recording:</span><span>{(selectedSession as any).recording_link || (selectedSession as any).recording_url ? <a href={(selectedSession as any).recording_link || (selectedSession as any).recording_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Recording</a> : "—"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recording" className="space-y-4">
            <Card>
              <CardContent className="p-6 text-center">
                <PlayCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                {(selectedSession as any).recording_link || (selectedSession as any).recording_url ? (
                  <div>
                    <p className="font-medium">Recording Available</p>
                    <a href={(selectedSession as any).recording_link || (selectedSession as any).recording_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{(selectedSession as any).recording_link || (selectedSession as any).recording_url}</a>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recording linked to this session.</p>
                )}
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.sessions")}</h1>
        <div className="flex gap-3">
          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All groups</option>
            {groups?.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {!isStudent && (
            <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
              {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {showForm ? "Cancel" : "Add Session"}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Session" : "Create New Session"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Group *</Label>
                  <select {...register("groupId")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select group</option>
                    {groups?.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  {errors.groupId && <p className="text-sm text-destructive">{errors.groupId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <select {...register("session_type")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {sessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...register("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {sessionStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" {...register("date")} />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" {...register("start_time")} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" {...register("end_time")} />
                </div>
                <div className="space-y-2">
                  <Label>Meeting Link</Label>
                  <Input {...register("meeting_link")} placeholder="Zoom/OnMeet URL" />
                </div>
                <div className="space-y-2">
                  <Label>Classroom ID</Label>
                  <Input {...register("classroomId")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input {...register("topic")} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...register("notes")} rows={2} />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={sessions || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => { setSelectedSessionId(row.id); setView("detail"); }}
        pageSize={10}
      />
    </div>
  );
}