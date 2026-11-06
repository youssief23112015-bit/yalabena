import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { downloadCsv } from "@/api/inventory";
import { reportsApi } from "@/api/reports";

type ReportKey = "sales-funnel" | "lead-source-roi" | "group-fill-rate" | "teacher-utilization" | "student-progress" | "revenue" | "outstanding-payments" | "attendance";
interface ReportDefinition { key: ReportKey; label: string; description: string; roles: string[]; needsDates?: boolean; needsStudent?: boolean; needsGroup?: boolean; }
const REPORTS: ReportDefinition[] = [
  { key: "sales-funnel", label: "Sales funnel", description: "Lead volume grouped by current CRM status.", roles: ["super_admin", "branch_manager", "sales"], needsDates: true },
  { key: "lead-source-roi", label: "Lead source ROI", description: "Leads and enrolled conversions by acquisition source.", roles: ["super_admin", "branch_manager", "sales"], needsDates: true },
  { key: "group-fill-rate", label: "Group fill rate", description: "Current capacity and active enrollment by group.", roles: ["super_admin", "branch_manager", "academic"] },
  { key: "teacher-utilization", label: "Teacher utilization", description: "Scheduled sessions and teaching hours for a month.", roles: ["super_admin", "branch_manager", "hr"] },
  { key: "student-progress", label: "Student progress", description: "Enrollment and attendance summary for one student.", roles: ["super_admin", "branch_manager", "academic", "teacher"], needsStudent: true },
  { key: "revenue", label: "Revenue", description: "Completed payments grouped by month.", roles: ["super_admin", "branch_manager", "finance"], needsDates: true },
  { key: "outstanding-payments", label: "Outstanding payments", description: "Invoices with unpaid balances, ordered by due date.", roles: ["super_admin", "branch_manager", "finance"] },
  { key: "attendance", label: "Attendance", description: "Attendance status counts by session date for a group.", roles: ["super_admin", "branch_manager", "academic", "teacher"], needsDates: true, needsGroup: true },
];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const monthStart = () => `${today().slice(0, 7)}-01`;
const prettyKey = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const stringifyCell = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const availableReports = useMemo(() => REPORTS.filter((report) => roles.includes("super_admin") || report.roles.some((role) => roles.includes(role))), [roles.join("|")]);
  const [reportKey, setReportKey] = useState<ReportKey>("sales-funnel");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const activeReport = availableReports.find((report) => report.key === reportKey) ?? availableReports[0];

  const reportQuery = useQuery<unknown>({
    queryKey: ["reports", activeReport?.key, from, to, month, studentId.trim(), groupId.trim()],
    enabled: !!activeReport && (!activeReport.needsStudent || !!studentId.trim()) && (!activeReport.needsGroup || !!groupId.trim()) && (!activeReport.needsDates || (!!from && !!to && from <= to)),
    queryFn: async () => {
      if (!activeReport) return [];
      const range = { from, to };
      switch (activeReport.key) {
        case "sales-funnel": return reportsApi.salesFunnel(range);
        case "lead-source-roi": return reportsApi.leadSourceRoi(range);
        case "group-fill-rate": return reportsApi.groupFillRate();
        case "teacher-utilization": return reportsApi.teacherUtilization(month);
        case "student-progress": return reportsApi.studentProgress(studentId.trim());
        case "revenue": return reportsApi.revenue(range);
        case "outstanding-payments": return reportsApi.outstandingPayments();
        case "attendance": return reportsApi.attendance({ ...range, group_id: groupId.trim() });
      }
    },
  });

  const rows = useMemo<Record<string, unknown>[]>(() => {
    const data = reportQuery.data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const entries = Object.entries(obj);
      const nestedArrays = entries.filter(([, value]) => Array.isArray(value));
      if (nestedArrays.length) {
        const arrayRows = nestedArrays.flatMap(([section, value]) => (value as unknown[]).map((item) => ({ section, ...(item && typeof item === "object" ? item as Record<string, unknown> : { value: item }) })));
        const objectRows = entries.filter(([, value]) => value && typeof value === "object" && !Array.isArray(value)).map(([section, value]) => ({ section, ...(value as Record<string, unknown>) }));
        return [...arrayRows, ...objectRows];
      }
      return [obj];
    }
    return [];
  }, [reportQuery.data]);
  const columns = useMemo(() => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))), [rows]);

  if (availableReports.length === 0) return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Your role does not have access to any available reports.</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1><p className="mt-1 text-sm text-muted-foreground">Operational and financial reports available to your role.</p></div><Badge variant="outline">{availableReports.length} reports available</Badge></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{availableReports.map((report) => <button type="button" key={report.key} onClick={() => setReportKey(report.key)} className={`rounded-xl border p-4 text-left transition-colors ${activeReport?.key === report.key ? "border-primary bg-primary/5" : "bg-card hover:bg-accent/50"}`}><div className="mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><span className="font-semibold">{report.label}</span></div><p className="text-xs text-muted-foreground">{report.description}</p></button>)}</div>
      {activeReport && <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{activeReport.label}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{activeReport.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`} />Refresh</Button><Button variant="outline" size="sm" disabled={rows.length === 0} onClick={() => downloadCsv(`${activeReport.key}-${today()}.csv`, [columns, ...rows.map((row) => columns.map((column) => stringifyCell(row[column])))])}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div></div></CardHeader>
        <CardContent className="space-y-4">
          {(activeReport.needsDates || activeReport.key === "teacher-utilization") && <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-3">{activeReport.needsDates && <><label className="space-y-1 text-sm"><span className="block text-muted-foreground">From</span><Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label><label className="space-y-1 text-sm"><span className="block text-muted-foreground">To</span><Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label></>}{activeReport.key === "teacher-utilization" && <label className="space-y-1 text-sm"><span className="block text-muted-foreground">Month</span><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>}</div>}
          {activeReport.needsStudent && <label className="block max-w-xl space-y-1 text-sm"><span className="text-muted-foreground">Student ID (UUID)</span><Input placeholder="Enter the student's ID" value={studentId} onChange={(e) => setStudentId(e.target.value.trim())} /></label>}
          {activeReport.needsGroup && <label className="block max-w-xl space-y-1 text-sm"><span className="text-muted-foreground">Group ID (UUID)</span><Input placeholder="Enter the group's ID" value={groupId} onChange={(e) => setGroupId(e.target.value.trim())} /></label>}
          {activeReport.needsDates && from && to && from > to && <p className="text-sm text-destructive">The start date must be on or before the end date.</p>}
          {((activeReport.needsStudent && !studentId.trim()) || (activeReport.needsGroup && !groupId.trim())) && <p className="text-sm text-muted-foreground">Enter the required ID above to load this report.</p>}
          {reportQuery.isLoading || reportQuery.isFetching ? <p className="py-6 text-sm text-muted-foreground">Loading report…</p> : null}
          {reportQuery.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="font-medium">This report could not be loaded.</p><p className="mt-1 text-muted-foreground">Check your permissions, the date range, and whether the supplied ID exists. The backend may return an access error for a report outside your role.</p></div>}
          {!reportQuery.isLoading && !reportQuery.isError && reportQuery.isSuccess && rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No data was returned for this report and filter.</p>}
          {!reportQuery.isLoading && !reportQuery.isError && rows.length > 0 && <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[600px] text-sm"><thead className="bg-muted/60"><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{prettyKey(column)}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={`${activeReport.key}-${index}`} className="hover:bg-muted/30">{columns.map((column) => <td key={column} className="max-w-sm whitespace-pre-wrap break-words px-3 py-2">{stringifyCell(row[column])}</td>)}</tr>)}</tbody></table></div>}
          <p className="text-xs text-muted-foreground">Report data is returned by the backend. CSV export includes the currently displayed rows; this page does not generate PDF exports.</p>
        </CardContent>
      </Card>}
    </div>
  );
}
