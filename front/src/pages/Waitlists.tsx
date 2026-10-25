import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { waitlistsApi } from "@/api/waitlists";
import { groupsApi } from "@/api/groups";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";

export default function WaitlistsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [filters, setFilters] = useState({ status: "", level: "" });
  const [threshold, setThreshold] = useState(8);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignGroup, setAssignGroup] = useState("");

  const q = useQuery({
    queryKey: ["waitlists", filters],
    queryFn: () => waitlistsApi.findAll({
      status: filters.status || undefined,
      level: filters.level || undefined,
    }),
  });
  const th = useQuery({
    queryKey: ["waitlist-threshold", threshold],
    queryFn: () => waitlistsApi.thresholdReport(threshold),
  });
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["waitlists"] });
    queryClient.invalidateQueries({ queryKey: ["waitlist-threshold"] });
  };

  const assignOne = useMutation({
    mutationFn: ({ id, group_id }: { id: string; group_id: string }) => waitlistsApi.assignToGroup(id, group_id),
    onSuccess: () => { refresh(); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const bulkAssign = useMutation({
    mutationFn: () => waitlistsApi.bulkAssign(selected, assignGroup),
    onSuccess: (r: any) => {
      refresh(); setSelected([]); setAssignGroup("");
      toast({ title: `Enrolled ${r?.enrolled?.length ?? 0}, failed ${r?.failed?.length ?? 0}` });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => waitlistsApi.remove(id),
    onSuccess: () => { refresh(); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });


  const columns = [
    {
      key: "student", header: "Student",
      render: (r: any) => r.student?.user ? `${r.student.user.first_name ?? ""} ${r.student.user.last_name ?? ""}`.trim() : (r.student_id ?? "").slice(0, 8),
    },
    { key: "level", header: "Level", render: (r: any) => r.level ?? "—" },
    { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-yellow-100 text-yellow-800">{r.status}</Badge> },
    { key: "priority", header: "Priority" },
    {
      key: "assign", header: "Assign", render: (r: any) => (
        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <select id={`g-${r.id}`} className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            defaultValue="" onClick={(e) => e.stopPropagation()}>
            <option value="">Group…</option>
            {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button size="sm" onClick={(e) => {
            e.stopPropagation();
            const gid = (document.getElementById(`g-${r.id}`) as HTMLSelectElement)?.value;
            if (gid) assignOne.mutate({ id: r.id, group_id: gid });
          }}>OK</Button>
        </span>
      ),
    },
    {
      key: "actions", header: t("common.actions"), render: (r: any) => (
        <Button size="sm" variant="outline" onClick={(e) => {
          e.stopPropagation();
          confirm({ title: "Delete entry", description: `Remove this waitlist entry?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => removeM.mutate(r.id) });
        }}><Trash2 className="h-3 w-3" /></Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.waitlists")}</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Ready to open (threshold)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label>Threshold</Label>
            <Input type="number" value={threshold} min={1} onChange={(e) => setThreshold(Number(e.target.value) || 8)} className="w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(th.data?.ready_to_open ?? []).map((r: any, i: number) => (
              <Badge key={i} className="bg-green-100 text-green-800">
                {(r.branch_id ?? "").slice(0, 8)} · {r.level} · {r.waiting}
              </Badge>
            ))}
            {(th.data?.ready_to_open?.length ?? 0) === 0 && (
              <span className="text-sm text-muted-foreground">{t("common.empty")}</span>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>{t("common.status")}</Label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("common.all")}</option>
            {["waiting", "notified", "enrolled", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Input value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} placeholder="e.g. B1" className="w-32" />
        </div>
      </div>
      <DataTable columns={columns} data={q.data ?? []} isLoading={q.isLoading} isError={q.isError}
        errorMessage={(q.error as Error)?.message} onRetry={q.refetch} keyExtractor={(r: any) => r.id}
        selectable selectedIds={selected} onSelectionChange={setSelected} pageSize={10} />
      {selected.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-2 pt-4">
            <div className="space-y-2">
              <Label>Bulk assign {selected.length} → group</Label>
              <select value={assignGroup} onChange={(e) => setAssignGroup(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select group</option>
                {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Button onClick={() => bulkAssign.mutate()} disabled={!assignGroup || bulkAssign.isPending}>Enroll</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
