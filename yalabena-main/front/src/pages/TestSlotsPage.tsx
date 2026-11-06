import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { testSlotsApi, TestSlot } from "@/api/testSlots";
import { branchesApi } from "@/api/branches";
import { usersApi } from "@/api/users";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const schema = z.object({
  branch_id: z.string().min(1, "Branch is required"),
  examiner_id: z.string().min(1, "Examiner is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  capacity: z.coerce.number().min(1).optional(),
  status: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function TestSlotsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["test-slots"],
    queryFn: () => testSlotsApi.findAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.findAll(),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.findAll(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const createMutation = useMutation({
    mutationFn: (dto: any) => testSlotsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-slots"] });
      toast({ title: t("common.success"), description: "Test slot created successfully" });
      closeForm();
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<TestSlot> }) => testSlotsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-slots"] });
      toast({ title: t("common.success"), description: "Test slot updated successfully" });
      closeForm();
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testSlotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-slots"] });
      toast({ title: t("common.success"), description: "Test slot deleted successfully" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const onSubmit = (f: Form) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: f });
    } else {
      createMutation.mutate(f);
    }
  };

  const columns = [
    {
      key: "branch",
      header: "Branch",
      render: (r: TestSlot) => r.branch?.name ?? r.branch_id.slice(0, 8),
    },
    {
      key: "examiner",
      header: "Examiner",
      render: (r: TestSlot) => r.examiner ? `${r.examiner.first_name ?? ""} ${r.examiner.last_name ?? ""}`.trim() : r.examiner_id.slice(0, 8),
    },
    { key: "date", header: "Date", render: (r: TestSlot) => r.date },
    { key: "time", header: "Time", render: (r: TestSlot) => `${r.start_time} - ${r.end_time}` },
    {
      key: "capacity",
      header: "Capacity / Booked",
      render: (r: TestSlot) => `${r.booked_count ?? 0} / ${r.capacity ?? 1}`,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (r: TestSlot) => <Badge className="bg-green-100 text-green-800">{r.status ?? "open"}</Badge>,
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (r: TestSlot) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => {
            setEditingId(r.id);
            reset({
              branch_id: r.branch_id,
              examiner_id: r.examiner_id,
              date: typeof r.date === 'string' ? r.date.split('T')[0] : '',
              start_time: r.start_time,
              end_time: r.end_time,
              capacity: r.capacity,
              status: r.status,
            });
            setShowForm(true);
          }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => {
            if (confirm("Are you sure you want to delete this slot?")) {
              deleteMutation.mutate(r.id);
            }
          }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Test Slots Management</h1>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); else reset(); }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? t("common.cancel") : "Create Test Slot"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Test Slot" : "Create New Test Slot"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Branch *</Label>
                <select {...register("branch_id")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select branch</option>
                  {(branches ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branch_id && <p className="text-sm text-destructive">{errors.branch_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Examiner *</Label>
                <select {...register("examiner_id")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select examiner</option>
                  {(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
                {errors.examiner_id && <p className="text-sm text-destructive">{errors.examiner_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Start Time (HH:MM) *</Label>
                <Input type="time" {...register("start_time")} />
                {errors.start_time && <p className="text-sm text-destructive">{errors.start_time.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>End Time (HH:MM) *</Label>
                <Input type="time" {...register("end_time")} />
                {errors.end_time && <p className="text-sm text-destructive">{errors.end_time.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" {...register("capacity")} defaultValue={1} />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>{t("common.cancel")}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update Slot" : "Save Slot"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} isError={isError}
        errorMessage={(error as Error)?.message} onRetry={refetch} keyExtractor={(r: TestSlot) => r.id} pageSize={10} />
    </div>
  );
}