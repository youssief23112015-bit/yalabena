import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { attendanceApi, type AttendanceStatus } from "@/api/attendance";
import { downloadBlob } from "@/api/finance";
import { groupsApi } from "@/api/groups";
import { sessionsApi } from "@/api/sessions";
import { studentsApi } from "@/api/students";
import { SessionPicker } from "@/components/attendance/SessionPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/common/DataTable";
import { QrCode, AlertTriangle, CheckCircle2, Download, Filter, Clock } from "lucide-react";

export const ATT_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export const statusColor = (s: string) =>
  s === "present" ? "bg-green-100 text-green-800"
  : s === "absent" ? "bg-red-100 text-red-800"
  : s === "late" ? "bg-yellow-100 text-yellow-800"
  : "bg-blue-100 text-blue-800";

export const displayName = (s: any) =>
  s?.user ? `${s.user.first_name ?? ""} ${s.user.last_name ?? ""}`.trim() || s.student_number || s.id.slice(0, 8)
  : s?.student_number || s?.id?.slice(0, 8) || "—";

export default function AttendancePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [draft, setDraft] = useState<Record<string, { student_id: string; status: AttendanceStatus; notes?: string; minutes_late?: number }>>({});
  const [checkInForm, setCheckInForm] = useState({ session_id: "", code: "" });

  // History tab state
  const [histGroup, setHistGroup] = useState("");
  const [histSession, setHistSession] = useState("");
  const [histStudent, setHistStudent] = useState("");
  const [histFrom, setHistFrom] = useState("");
  const [histTo, setHistTo] = useState("");

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });
  const { data: allStudents } = useQuery({ queryKey: ["all-students"], queryFn: () => studentsApi.findAll() });
  const { data: allSessions } = useQuery({ queryKey: ["all-sessions"], queryFn: () => sessionsApi.findAll() });

  const { data: roster, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["roster", sessionId],
    queryFn: () => attendanceApi.getRoster(sessionId),
    enabled: !!sessionId,
  });

  const { data: codeData, refetch: fetchCode } = useQuery({
    queryKey: ["checkin-code", sessionId],
    queryFn: () => attendanceApi.getCheckInCode(sessionId),
    enabled: false,
  });

  const { data: alerts } = useQuery({
    queryKey: ["absence-alerts"],
    queryFn: () => attendanceApi.absenceAlerts(3),
  });

  // History query
  const { data: history, isLoading: histLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["attendance-history", histGroup, histSession, histStudent, histFrom, histTo],
    queryFn: () => attendanceApi.history({
      group_id: histGroup || undefined,
      session_id: histSession || undefined,
      student_id: histStudent || undefined,
      from: histFrom || undefined,
      to: histTo || undefined,
    }),
    enabled: true,
  });

  const bulkMutation = useMutation({
    mutationFn: () => attendanceApi.bulkMark(sessionId, Object.values(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", sessionId] });
      setDraft({});
      toast({ title: t("common.success") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.selfCheckIn(checkInForm),
    onSuccess: () => {
      toast({ title: t("common.success") });
      setCheckInForm({ session_id: "", code: "" });
      if (checkInForm.session_id === sessionId) queryClient.invalidateQueries({ queryKey: ["roster", sessionId] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await attendanceApi.exportHistory({
        group_id: histGroup || undefined,
        session_id: histSession || undefined,
        student_id: histStudent || undefined,
        from: histFrom || undefined,
        to: histTo || undefined,
      });
      downloadBlob(blob, "attendance-history.xlsx");
    },
    onSuccess: () => toast({ title: t("common.success"), description: "History exported to Excel" }),
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const recordedBy = (att: any[], studentId: string) => att.find((a) => (a.student_id ?? a.studentId) === studentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.attendance")}</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Session</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Group filter</Label>
            <select value={groupFilter} onChange={(e) => {
              setGroupFilter(e.target.value);
              setSessionId("");
              setDraft({});
            }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{t("common.all")}</option>
              {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Session *</Label>
            <SessionPicker value={sessionId} groupFilter={groupFilter} onChange={(v) => { setSessionId(v); setDraft({}); }} />
          </div>
        </CardContent>
      </Card>
      {sessionId && (
        <Tabs defaultValue="roster">
          <TabsList>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="qr">QR Check-in</TabsTrigger>
            <TabsTrigger value="alerts">Absence alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="roster">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Roster ({roster?.students?.length ?? 0})</CardTitle>
                {Object.keys(draft).length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Unsaved changes</span>
                    <Button size="sm" onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> {bulkMutation.isPending ? "Saving…" : `Save all (${Object.keys(draft).length})`}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDraft({})} disabled={bulkMutation.isPending}>
                      Discard
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
                {isError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    {(error as Error)?.message}
                    <Button variant="outline" size="sm" onClick={() => refetch()}>{t("common.retry")}</Button>
                  </div>
                )}
                {!isLoading && (roster?.students?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                )}
                <div className="space-y-2">
                  {(roster?.students ?? []).map((st: any) => {
                    const rec = recordedBy(roster?.attendances ?? [], st.id);
                    const cur = draft[st.id]?.status ?? rec?.status;
                    return (
                      <div key={st.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                        <span className="min-w-40 flex-1 text-sm font-medium">{displayName(st)}</span>
                        {rec && <Badge className={statusColor(rec.status)}>{rec.status}</Badge>}
                        {ATT_STATUSES.map((s) => (
                          <Button key={s} size="sm" variant={cur === s ? "default" : "outline"}
                            onClick={() => {
                              const dto = { student_id: st.id, status: s };
                              setDraft((d) => ({ ...d, [st.id]: dto }));
                            }}>{s}</Button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="qr">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" /> Teacher QR code</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={() => fetchCode()}>Show today&apos;s code</Button>
                {codeData && <p className="text-3xl font-mono font-bold tracking-[0.3em]">{codeData.code}</p>}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Session ID (manual check-in)</Label>
                    <Input value={checkInForm.session_id} onChange={(e) => setCheckInForm({ ...checkInForm, session_id: e.target.value })} placeholder="session uuid" />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input value={checkInForm.code} onChange={(e) => setCheckInForm({ ...checkInForm, code: e.target.value })} placeholder="8-char code" />
                  </div>
                </div>
                <Button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending || !checkInForm.session_id || !checkInForm.code}>{t("common.submit")}</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="alerts">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Absence alerts</CardTitle></CardHeader>
              <CardContent>
                {(alerts?.flagged?.length ?? 0) === 0
                  ? <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                  : alerts!.flagged.map((f) => (
                    <div key={f.student_id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                      <span className="font-mono">{f.student_id.slice(0, 8)}</span>
                      <Badge className="bg-red-100 text-red-800">{f.absences} absences</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ============ HISTORY TAB ============ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Attendance History</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending || (history?.records?.length ?? 0) === 0}>
              <Download className="mr-2 h-4 w-4" /> {exportMutation.isPending ? "Exporting…" : "Download Excel"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetchHistory()}><Clock className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="space-y-2">
              <Label>Group</Label>
              <select value={histGroup} onChange={(e) => { setHistGroup(e.target.value); setHistSession(""); }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{t("common.all")}</option>
                {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <select value={histSession} onChange={(e) => setHistSession(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{t("common.all")}</option>
                {(allSessions ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.topic || s.id.slice(0, 8)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <select value={histStudent} onChange={(e) => setHistStudent(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{t("common.all")}</option>
                {(allStudents ?? []).map((s: any) => <option key={s.id} value={s.id}>{displayName(s)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div className="flex items-end">
              <Button size="sm" variant="outline" onClick={() => { setHistGroup(""); setHistSession(""); setHistStudent(""); setHistFrom(""); setHistTo(""); }}>{t("common.clear")}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { key: 'student_name', header: 'Student' },
                { key: 'student_number', header: 'Student No.' },
                { key: 'group_name', header: 'Group' },
                { key: 'session_date', header: 'Session Date' },
                { key: 'session_topic', header: 'Topic' },
                { key: 'status', header: 'Status', render: (r: any) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
                { key: 'minutes_late', header: 'Min. Late', render: (r: any) => r.minutes_late > 0 ? r.minutes_late : '-' },
                { key: 'check_in_method', header: 'Check-in Method' },
                { key: 'recorded_at', header: 'Recorded At' },
              ]}
              data={history?.records ?? []}
              isLoading={histLoading}
              isError={false}
              keyExtractor={(r: any) => `${r.student_id}-${r.session_id}`}
              pageSize={20}
            />
          </div>
          {(history?.records?.length ?? 0) > 0 && (
            <div className="text-xs text-muted-foreground">
              {history?.total ?? 0} record(s) found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
