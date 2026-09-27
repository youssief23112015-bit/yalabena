import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { placementAdminApi } from "@/api/placementAdmin";
import { leadsApi } from "@/api/leads";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Pencil, ExternalLink, Copy, Check } from "lucide-react";

const schema = z.object({
  leadId: z.string().min(1, "Lead is required"),
  scheduled_date: z.string().optional(),
  status: z.string().optional(),
  written_score: z.coerce.number().optional(),
  oral_score: z.coerce.number().optional(),
  assigned_level: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function PlacementTestsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState("");
const [copiedId, setCopiedId] = useState<string | null>(null);

const getTestPlayerUrl = (id: string) =>
  `${window.location.origin}/placement-test?testId=${encodeURIComponent(id)}`;

const copyTestLink = async (id: string) => {
  const url = getTestPlayerUrl(id);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  setCopiedId(id);
  toast({ title: t("common.success"), description: url });
  setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
};

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["placement-tests", leadFilter],
    queryFn: () => placementAdminApi.findAll(leadFilter || undefined),
  });
  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: () => leadsApi.findAll() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const closeForm = () => { setShowForm(false); setEditingId(null); reset(); };

  const createMutation = useMutation({
    mutationFn: (dto: Form) => placementAdminApi.create(dto as Form & { leadId: string }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["placement-tests"] }); toast({ title: t("common.success") }); closeForm(); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Form> }) => placementAdminApi.update(id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["placement-tests"] }); toast({ title: t("common.success") }); closeForm(); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const onSubmit = (f: Form) => {
    const dto: any = { ...f };
    if (!dto.scheduled_date) delete dto.scheduled_date;
    if (editingId) updateMutation.mutate({ id: editingId, dto });
    else createMutation.mutate(dto);
  };

const columns = [
  { key: "lead", header: "Lead", render: (r: any) => r.lead ? `${r.lead.first_name ?? ""} ${r.lead.last_name ?? ""}`.trim() : (r.leadId ?? r.lead_id ?? "—") },
  { key: "id", header: "Test ID", render: (r: any) => <span className="font-mono text-xs" title={r.id}>{String(r.id).slice(0,8)}…</span> },
  { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-blue-100 text-blue-800">{r.status ?? "—"}</Badge> },
  { key: "written_score", header: "Written" },
  { key: "oral_score", header: "Oral" },
  { key: "assigned_level", header: "Level" },
  {
    key: "actions", header: t("common.actions"), render: (r: any) => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" title="Edit" onClick={() => {
          setEditingId(r.id);
          reset({ leadId: r.lead?.id ?? r.lead_id ?? "", status: r.status ?? "", written_score: r.written_score, oral_score: r.oral_score, assigned_level: r.assigned_level ?? "" });
          setShowForm(true);
        }}><Pencil className="h-3 w-3" /></Button>
        <Button size="sm" variant="outline" title={`Open /placement-test?testId=${r.id}`} onClick={() => window.open(getTestPlayerUrl(r.id), "_blank", "noopener")}>
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" title="Copy test link" onClick={() => copyTestLink(r.id)}>
          {copiedId === r.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    ),
  },
];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.placementTests")}</h1>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? t("common.cancel") : t("common.create")}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Label>Lead filter</Label>
        <select value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("common.all")}</option>
          {(leads ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
        </select>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? t("common.edit") : t("common.create")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Lead *</Label>
                <select {...register("leadId")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select lead</option>
                  {(leads ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
                </select>
                {errors.leadId && <p className="text-sm text-destructive">{errors.leadId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Scheduled date</Label>
                <Input type="datetime-local" {...register("scheduled_date")} />
              </div>
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <select {...register("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  {["scheduled", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Written score</Label>
                <Input type="number" {...register("written_score")} />
              </div>
              <div className="space-y-2">
                <Label>Oral score</Label>
                <Input type="number" {...register("oral_score")} />
              </div>
              <div className="space-y-2">
                <Label>Assigned level</Label>
                <Input {...register("assigned_level")} placeholder="e.g. B1" />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} isError={isError}
        errorMessage={(error as Error)?.message} onRetry={refetch} keyExtractor={(r: any) => r.id} pageSize={10} />
    </div>
  );
}
