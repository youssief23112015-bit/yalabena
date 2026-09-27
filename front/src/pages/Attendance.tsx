import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { attendanceApi, type AttendanceStatus, type MarkOneDto } from "@/api/attendance";
import { groupsApi } from "@/api/groups";
import { SessionPicker } from "@/components/attendance/SessionPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, AlertTriangle, CheckCircle2 } from "lucide-react";

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
  const [draft, setDraft] = useState<Record<string, MarkOneDto>>({});
  const [checkInForm, setCheckInForm] = useState({ session_id: "", code: "" });

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

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

  const bulkMutation = useMutation({
    mutationFn: () => attendanceApi.bulkMark(sessionId, Object.values(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", sessionId] });
      setDraft({});
      toast({ title: t("common.success") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const markOneMutation = useMutation({
    mutationFn: (dto: MarkOneDto) => attendanceApi.markOne(sessionId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roster", sessionId] }),
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

  const recordedBy = (att: any[], studentId: string) => att.find((a) => (a.student_id ?? a.studentId) === studentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.attendance")}</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Session</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Group filter</Label>
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
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
                  <Button size="sm" onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Save all ({Object.keys(draft).length})
                  </Button>
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
                              const dto: MarkOneDto = { student_id: st.id, status: s };
                              setDraft((d) => ({ ...d, [st.id]: dto }));
                              markOneMutation.mutate(dto);
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
    </div>
  );
}

