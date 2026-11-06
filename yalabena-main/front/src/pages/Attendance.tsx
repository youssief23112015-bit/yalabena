import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { attendanceApi, type AttendanceStatus, type AttendanceRecord, type AttendanceFilter } from "@/api/attendance";
import { groupsApi } from "@/api/groups";
import { SessionPicker } from "@/components/attendance/SessionPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Download } from "lucide-react";

export const ATT_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export const statusColor = (s: string) =>
  s === "present" ? "bg-green-100 text-green-800"
  : s === "absent" ? "bg-red-100 text-red-800"
  : s === "late" ? "bg-yellow-100 text-yellow-800"
  : "bg-blue-100 text-blue-800";

const ADMIN_ROLES = ["super_admin", "branch_manager", "academic", "auditor"];

function isAdminRole(user: any): boolean {
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  return roles.some((r: string) => ADMIN_ROLES.includes(r));
}

function isTeacherRole(user: any): boolean {
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  return roles.includes("teacher");
}

export default function AttendancePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user);
  const isTeacher = isTeacherRole(user);

  const [sessionId, setSessionId] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [draft, setDraft] = useState<Record<string, { student_id: string; status: AttendanceStatus }>>({});

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

  const filter: AttendanceFilter = {};
  if (sessionId && sessionId !== "all") filter.sessionId = sessionId;
  if (groupFilter) filter.groupId = groupFilter;
  if (dateFilter) { filter.from = dateFilter; filter.to = dateFilter; }

  const { data: records, isLoading, isError, error } = useQuery({
    queryKey: ["attendance-list", sessionId, groupFilter, dateFilter],
    queryFn: () => attendanceApi.listAttendance(filter),
    enabled: true,
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const bySession: Record<string, { student_id: string; status: AttendanceStatus }[]> = {};
      Object.values(draft).forEach((d) => {
        const rec = (records ?? []).find((r: any) => r.student_id === d.student_id);
        const sid = rec?.session?.id || sessionId;
        if (!bySession[sid]) bySession[sid] = [];
        bySession[sid].push(d);
      });
      const results = await Promise.all(Object.entries(bySession).map(async ([sid, recs]) => {
        return attendanceApi.bulkMark(sid, recs);
      }));
      return results;
    },
    onSuccess: () => {
      setDraft({});
      queryClient.invalidateQueries({ queryKey: ["attendance-list", sessionId, groupFilter, dateFilter] });
      toast({ title: t("common.success") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const downloadCsvMutation = useMutation({
    mutationFn: async () => {
      const blob = await attendanceApi.exportAttendance(filter);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${dateFilter || "all"}-${sessionId || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast({ title: t("common.success") }),
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  useEffect(() => {
    if (sessionId === "all") setDraft({});
  }, [sessionId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.attendance")}</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Session</Label>
              <SessionPicker
                value={sessionId}
                groupFilter={groupFilter}
                onChange={setSessionId}
                includeAllOption={isAdmin || isTeacher}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            {groups && (
              <div className="space-y-2">
                <Label>Group</Label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All groups</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => downloadCsvMutation.mutate()}
              disabled={downloadCsvMutation.isPending}
              className="flex-1"
            >
              {downloadCsvMutation.isPending ? (
                "Exporting…"
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download as CSV
                </>
              )}
            </Button>
            {sessionId && (
              <Button
                onClick={() => {
                  setSessionId("");
                  setGroupFilter("");
                  setDateFilter("");
                  setDraft({});
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {sessionId === "all"
              ? "All Sessions"
              : sessionId
              ? "Session Attendance"
              : "Attendance Records"}
            {records && (
              <span className="ml-2 text-xs text-muted-foreground">({records.length} records)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">{error?.message}</p>
          ) : (records ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Student #</th>
                      <th className="px-4 py-2 text-left">Session</th>
                      <th className="px-4 py-2 text-left">Group</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      {(isAdmin || isTeacher) && <th className="px-4 py-2 text-left">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(records ?? []).map((r: any) => {
                      const st = r.student || {};
                      const userObj = st.user || {};
                      const sess = r.session || {};
                      const name = userObj.first_name || userObj.last_name
                        ? `${userObj.first_name ?? ""} ${userObj.last_name ?? ""}`.trim()
                        : st.student_number || (r.student_id ? r.student_id.slice(0, 8) : "—");
                      const cur = draft[st.id]?.status ?? r.status;
                      return (
                        <tr key={r.id || Math.random()} className="border-t">
                          <td className="px-4 py-2">{name}</td>
                          <td className="px-4 py-2">{st.student_number || "—"}</td>
                          <td className="px-4 py-2">{sess.title || sess.topic || "Session"}</td>
                          <td className="px-4 py-2">{sess.group?.name || "—"}</td>
                          <td className="px-4 py-2">{sess.date ? String(sess.date).slice(0, 10) : "—"}</td>
                          <td className="px-4 py-2">
                            <Badge className={statusColor(r.status)}>{r.status}</Badge>
                          </td>
                          {(isAdmin || isTeacher) && (
                            <td className="px-4 py-2">
                              {ATT_STATUSES.map((s) => (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant={cur === s ? "default" : "outline"}
                                  onClick={() => {
                                    if (st.id) {
                                      setDraft((d) => ({ ...d, [st.id]: { student_id: st.id, status: s } }));
                                    }
                                  }}
                                >{s}</Button>
                              ))}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {Object.keys(draft).length > 0 && (
                <Button
                  onClick={() => bulkMutation.mutate()}
                  disabled={bulkMutation.isPending}
                  className="mt-2"
                >
                  {bulkMutation.isPending ? "Saving…" : "Save Attendance"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}