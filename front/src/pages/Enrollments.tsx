import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { enrollmentsApi } from "@/api/enrollments";
import { studentsApi } from "@/api/students";
import { groupsApi } from "@/api/groups";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Check, Plus, X, UserMinus } from "lucide-react";

const STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "DROPPED"] as const;
type EnrollStatus = (typeof STATUSES)[number];

const statusClass = (s: string) => {
  const v = String(s ?? "").toLowerCase();
  return v === "active" ? "bg-green-100 text-green-800"
  : v === "completed" ? "bg-blue-100 text-blue-800"
  : v === "dropped" ? "bg-red-100 text-red-800"
  : "bg-yellow-100 text-yellow-800";
};

const studentLabel = (e: any) =>
  e?.student?.user
    ? `${e.student.user.first_name ?? ""} ${e.student.user.last_name ?? ""}`.trim()
    : e?.student?.student_number ?? (e?.student_id ?? "").slice(0, 8);

export default function EnrollmentsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  // Default to PENDING so freshly booked catalog requests ("Book this
  // Course") are visible in the approval queue the moment they are created.
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    total_fee: "",
    promo_code: "",
    installments_count: "",
    due_days: "",
  });

  const q = useQuery({
    queryKey: ["enrollments", statusFilter],
    queryFn: () => enrollmentsApi.findAll({ status: statusFilter || undefined }),
  });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => studentsApi.findAll() });
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["enrollments"] });

  const createM = useMutation({
    mutationFn: () =>
      enrollmentsApi.create({
        student_id: form.student_id,
        group_id: form.group_id,
        total_fee: form.total_fee ? Number(form.total_fee) : undefined,
        promo_code: form.promo_code || undefined,
        installments_count: form.installments_count ? Number(form.installments_count) : undefined,
        due_days: form.due_days ? Number(form.due_days) : undefined,
      }),
    onSuccess: () => {
      refresh();
      setShowForm(false);
      setForm({ student_id: "", group_id: "", total_fee: "", promo_code: "", installments_count: "", due_days: "" });
      toast({ title: t("common.success") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollStatus }) => enrollmentsApi.updateStatus(id, status),
    onSuccess: () => { refresh(); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const dropM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => enrollmentsApi.drop(id, reason),
    onSuccess: () => { refresh(); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  // Admin approval flow: PENDING -> ACTIVE (invoice + LMS access on backend)
  const approveM = useMutation({
    mutationFn: (id: string) => enrollmentsApi.approve(id),
    onSuccess: () => {
      refresh();
      toast({ title: t("enrollments.approved", "Enrollment approved") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const rejectM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => enrollmentsApi.reject(id, reason),
    onSuccess: () => {
      refresh();
      toast({ title: t("enrollments.rejected", "Enrollment request rejected") });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });


  const columns = [
    { key: "student", header: "Student", render: (e: any) => studentLabel(e) },
    {
      key: "group",
      header: "Group",
      render: (e: any) => e.group?.name ?? (e.group_id ?? "").slice(0, 8),
    },
    {
      key: "course",
      header: "Course",
      render: (e: any) => (
        <span className="inline-flex items-center gap-1.5">
          {e.group?.course?.name ?? "—"}
          {e.group?.course?.level && (
            <Badge variant="outline" className="text-xs">{e.group.course.level}</Badge>
          )}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: (e: any) => e?.group?.branch?.name ?? e?.student?.branch?.name ?? "—",
    },
    {
      key: "status",
      header: t("common.status"),
      render: (e: any) => (
        <Badge className={statusClass(e.status)}>{String(e.status ?? "").toUpperCase()}</Badge>
      ),
    },
    { key: "total_fee", header: "Fee" },
    { key: "final_amount", header: "Final" },
    {
      key: "setStatus",
      header: t("common.status"),
      render: (e: any) => (
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={String(e.status ?? "").toUpperCase()}
          onClick={(ev) => ev.stopPropagation()}
          onChange={(ev) => { ev.stopPropagation(); statusM.mutate({ id: e.id, status: ev.target.value as EnrollStatus }); }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (e: any) => (
        <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
          {String(e.status).toLowerCase() === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700"
                disabled={approveM.isPending}
                title="Approve enrollment"
                onClick={() => approveM.mutate(e.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                disabled={rejectM.isPending}
                title="Reject request"
                onClick={() =>
                  confirm({
                    title: "Reject enrollment request",
                    description: `Reject ${studentLabel(e)}'s request for this group?`,
                    variant: "destructive",
                    confirmLabel: "Reject",
                    onConfirm: () => rejectM.mutate({ id: e.id, reason: "Rejected from UI" }),
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => {
            confirm({
              title: "Drop enrollment",
              description: `Drop ${studentLabel(e)} from this group?`,
              variant: "destructive",
              confirmLabel: "Drop",
              onConfirm: () => dropM.mutate({ id: e.id, reason: "dropped from UI" }),
            });
          }}><UserMinus className="h-3 w-3" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.enrollments")}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? t("common.cancel") : "New enrollment"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Enroll student in a group</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Student *</Label>
              <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select student</option>
                {(students ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.user ? `${s.user.first_name} ${s.user.last_name}` : s.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Group *</Label>
              <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select group</option>
                {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Total fee</Label>
              <Input type="number" value={form.total_fee} onChange={(e) => setForm({ ...form, total_fee: e.target.value })}
                placeholder="defaults to course price" />
            </div>
            <div className="space-y-2">
              <Label>Promo code</Label>
              <Input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Installments</Label>
              <Input type="number" value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due days</Label>
              <Input type="number" value={form.due_days} onChange={(e) => setForm({ ...form, due_days: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Button disabled={createM.isPending || !form.student_id || !form.group_id} onClick={() => createM.mutate()}>
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Label>{t("common.status")}</Label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("common.all")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={q.data ?? []}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={(q.error as Error)?.message}
        onRetry={q.refetch}
        keyExtractor={(e: any) => e.id}
        pageSize={10}
      />
    </div>
  );
}

