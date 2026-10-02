import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { activitiesApi, type ActivityFilters } from "@/api/activities";
import { branchesApi } from "@/api/branches";
import { groupsApi } from "@/api/groups";
import { studentsApi } from "@/api/students";
import { filesApi } from "@/api/files";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useAuthStore } from "@/store/authStore";
import type {
  Activity,
  ActivityEventType,
  ActivityStatusValue,
} from "@/types";
import {
  ChevronLeft,
  CheckCircle2,
  Eye,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  UserX,
  Users,
  Wallet,
  X,
} from "lucide-react";

const TYPE_LABELS: Record<ActivityEventType, string> = {
  movie_night: "Movie Night",
  conversation_club: "Conversation Club",
  trip: "Trip",
  contest: "Contest",
  workshop: "Workshop",
  other: "Other",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const STATUS_OPTIONS: ActivityStatusValue[] = [
  "upcoming",
  "open",
  "full",
  "completed",
  "cancelled",
];

const statusColor = (s: string) =>
  s === "open"
    ? "bg-green-100 text-green-800"
    : s === "full"
      ? "bg-orange-100 text-orange-800"
      : s === "upcoming"
        ? "bg-blue-100 text-blue-800"
        : s === "completed"
          ? "bg-gray-100 text-gray-800"
          : "bg-red-100 text-red-800";

const attendanceColor = (s: string) =>
  s === "attended"
    ? "bg-green-100 text-green-800"
    : s === "no_show"
      ? "bg-red-100 text-red-800"
      : s === "cancelled"
        ? "bg-gray-100 text-gray-800"
        : "bg-blue-100 text-blue-800";

const feeLabel = (fee: number) => (Number(fee) > 0 ? `${Number(fee)} EGP` : "Free");

const activitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  branch_id: z.string().min(1, "Branch is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  fee: z.coerce.number().min(0, "Fee cannot be negative"),
  status: z.string().optional(),
  is_open_to_all: z.boolean().default(false),
  target_levels: z.array(z.string()).default([]),
  target_groups: z.array(z.string()).default([]),
});

type ActivityForm = z.infer<typeof activitySchema>;

const emptyForm: ActivityForm = {
  title: "",
  description: "",
  type: "conversation_club",
  date: "",
  start_time: "",
  end_time: "",
  location: "",
  branch_id: "",
  capacity: 20,
  fee: 0,
  status: "upcoming",
  is_open_to_all: false,
  target_levels: [],
  target_groups: [],
};

export default function ActivitiesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isSuper = roles.includes("super_admin");
  const canManage = isSuper || roles.some((r) => ["branch_manager", "academic"].includes(r));
  const canRegister = canManage || roles.some((r) => ["teacher", "sales"].includes(r));
  const canAttend = canManage || roles.includes("teacher");
  const isStudent = roles.includes("student") && !canRegister;
  const canPickBranch = isSuper || roles.includes("branch_manager");

  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    type: string;
    level: string;
    branch_id: string;
    status: string;
    search: string;
  }>({ type: "", level: "", branch_id: "", status: "", search: "" });
  const [regStudentId, setRegStudentId] = useState("");
  const [regMarkPaid, setRegMarkPaid] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: activities,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["activities", filters],
    queryFn: () =>
      activitiesApi.findAll({
        type: (filters.type || undefined) as ActivityFilters["type"],
        status: (filters.status || undefined) as ActivityFilters["status"],
        level: filters.level || undefined,
        branch_id: filters.branch_id || undefined,
        search: filters.search || undefined,
      }),
  });

  const { data: activity } = useQuery({
    queryKey: ["activity", selectedId],
    queryFn: () => activitiesApi.findOne(selectedId!),
    enabled: view === "detail" && !!selectedId,
  });

  const { data: attendance } = useQuery({
    queryKey: ["activity-attendance", selectedId],
    queryFn: () => activitiesApi.getAttendance(selectedId!),
    enabled: view === "detail" && !!selectedId,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.findAll,
    enabled: canPickBranch,
  });

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.findAll(),
    enabled: showForm && canManage,
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.findAll(),
    enabled: view === "detail" && canRegister,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["activity"] });
    queryClient.invalidateQueries({ queryKey: ["activity-attendance"] });
  };

  const onSaved = (message: string) => {
    refreshAll();
    toast({ title: message });
    closeForm();
  };
  const onErr = (e: any) =>
    toast({ variant: "destructive", title: t("common.error"), description: e.message });

  const createM = useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => onSaved("Activity scheduled"),
    onError: onErr,
  });
  const updateM = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => activitiesApi.update(id, dto),
    onSuccess: () => onSaved("Activity updated"),
    onError: onErr,
  });
  const removeM = useMutation({
    mutationFn: activitiesApi.remove,
    onSuccess: () => {
      refreshAll();
      toast({ title: "Activity deleted" });
      setView("list");
      setSelectedId(null);
    },
    onError: onErr,
  });


  const registerM = useMutation({
    mutationFn: ({ activityId, dto }: { activityId: string; dto: any }) =>
      activitiesApi.register(activityId, dto),
    onSuccess: () => {
      refreshAll();
      toast({ title: "Registered successfully" });
      setRegStudentId("");
      setRegMarkPaid(false);
    },
    onError: onErr,
  });

  const cancelRegM = useMutation({
    mutationFn: activitiesApi.cancelRegistration,
    onSuccess: () => {
      refreshAll();
      toast({ title: "Registration cancelled" });
    },
    onError: onErr,
  });

  const payM = useMutation({
    mutationFn: ({ registrationId, amount }: { registrationId: string; amount?: number }) =>
      activitiesApi.payRegistration(registrationId, amount ? { amount } : {}),
    onSuccess: () => {
      refreshAll();
      toast({ title: "Fee recorded in Finance ledger" });
    },
    onError: onErr,
  });

  const attendanceM = useMutation({
    mutationFn: ({
      activityId,
      dto,
    }: {
      activityId: string;
      dto: { records: { student_id: string; status: any }[] };
    }) => activitiesApi.markAttendance(activityId, dto),
    onSuccess: () => {
      refreshAll();
      toast({ title: t("common.success") });
    },
    onError: onErr,
  });

  const uploadM = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await filesApi.upload(file, "activity");
      await activitiesApi.addPhoto(selectedId!, {
        file_url: uploaded.file_url,
        caption: uploadCaption || undefined,
      });
    },
    onSuccess: () => {
      refreshAll();
      setUploadCaption("");
      toast({ title: "Photo added to gallery" });
    },
    onError: onErr,
  });

  const removePhotoM = useMutation({
    mutationFn: activitiesApi.removePhoto,
    onSuccess: () => {
      refreshAll();
      toast({ title: "Photo removed" });
    },
    onError: onErr,
  });

  // ─── Schedule / edit form ───
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: emptyForm,
  });

  const openForm = (row?: Activity) => {
    if (row) {
      setEditingId(row.id);
      reset({
        title: row.title,
        description: row.description ?? "",
        type: row.type,
        date: String(row.date).slice(0, 10),
        start_time: row.start_time ? String(row.start_time).slice(0, 5) : "",
        end_time: row.end_time ? String(row.end_time).slice(0, 5) : "",
        location: row.location ?? "",
        branch_id: row.branch_id,
        capacity: row.capacity,
        fee: Number(row.fee ?? 0),
        status: row.status,
        is_open_to_all: row.is_open_to_all,
        target_levels: row.target_levels ?? [],
        target_groups: row.target_groups ?? [],
      });
    } else {
      setEditingId(null);
      reset({
        ...emptyForm,
        branch_id: canPickBranch ? user?.branch_id ?? "" : "",
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset(emptyForm);
  };

  const onSubmit = (data: ActivityForm) => {
    const dto = {
      ...data,
      description: data.description || undefined,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      location: data.location || undefined,
      status: (data.status || undefined) as ActivityStatusValue | undefined,
    };
    if (editingId) updateM.mutate({ id: editingId, dto });
    else createM.mutate(dto as any);
  };

  const toggleLevel = (level: string) => {
    const current = watch("target_levels") ?? [];
    setValue(
      "target_levels",
      current.includes(level) ? current.filter((l) => l !== level) : [...current, level],
    );
  };

  const toggleGroup = (groupId: string) => {
    const current = watch("target_groups") ?? [];
    setValue(
      "target_groups",
      current.includes(groupId)
        ? current.filter((g) => g !== groupId)
        : [...current, groupId],
    );
  };

  const askDelete = (row: Activity) =>
    confirm({
      title: "Delete activity",
      description: `"${row.title}" and its registrations/photos will be permanently removed.`,
      variant: "destructive",
      confirmLabel: "Delete",
      onConfirm: () => removeM.mutate(row.id),
    });


  // ─── List columns ───
  const columns: Column<Activity>[] = [
    {
      key: "title",
      header: "Activity",
      sortable: true,
      render: (row) => (
        <div className="max-w-[240px]">
          <p className="truncate font-medium">{row.title}</p>
          {row.location && (
            <p className="truncate text-xs text-muted-foreground">{row.location}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <Badge variant="outline">{TYPE_LABELS[row.type] ?? row.type}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-sm">
          {String(row.date).slice(0, 10)}
          {row.start_time ? ` · ${String(row.start_time).slice(0, 5)}` : ""}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: (row) => (
        <span className="text-sm">{row.branch?.name ?? row.branch_id.slice(0, 8)}</span>
      ),
    },
    {
      key: "capacity",
      header: "Seats",
      sortable: true,
      render: (row) => (
        <span className="text-sm">
          {row.registered_count ?? row.registrations?.length ?? 0} / {row.capacity}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee",
      sortable: true,
      render: (row) => (
        <span className="text-sm">{feeLabel(Number(row.fee))}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge className={statusColor(row.status)}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="View"
            onClick={() => {
              setSelectedId(row.id);
              setView("detail");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit"
                onClick={() => openForm(row)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Delete"
                onClick={() => askDelete(row)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filterSelect =
    "h-10 rounded-md border border-input bg-background px-3 text-sm";

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <select
          className={filterSelect}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Level</Label>
        <select
          className={filterSelect}
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {canPickBranch && (
        <div className="space-y-1">
          <Label className="text-xs">Branch</Label>
          <select
            className={filterSelect}
            value={filters.branch_id}
            onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
          >
            
            <option value="">All branches</option>
            {(branches ?? []).map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <select
          className={filterSelect}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Search</Label>
        <Input
          className="h-10 w-48"
          placeholder="Title or description…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
    </div>
  );


  // ─── Schedule / edit dialog ───
  const formDialog = (
    <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Activity" : "Schedule Activity"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input {...register("title")} placeholder="e.g. October Movie Night" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea
                {...register("description")}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="What is this activity about?"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <select {...register("type")} className={filterSelect + " w-full"}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select {...register("status")} className={filterSelect + " w-full"}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register("location")} placeholder="Main Hall" />
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" {...register("start_time")} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input type="time" {...register("end_time")} />
            </div>


            <div className="space-y-2">
              <Label>Branch *</Label>
              {canPickBranch ? (
                <select {...register("branch_id")} className={filterSelect + " w-full"}>
                  <option value="">Select branch</option>
                  {(branches ?? []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input {...register("branch_id")} readOnly placeholder="Your branch" />
              )}
              {errors.branch_id && (
                <p className="text-sm text-destructive">{errors.branch_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Capacity *</Label>
              <Input type="number" min={1} {...register("capacity", { valueAsNumber: true })} />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fee (EGP) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...register("fee", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                0 = free. Paid fees are booked in the Finance ledger.
              </p>
              {errors.fee && <p className="text-sm text-destructive">{errors.fee.message}</p>}
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={watch("is_open_to_all")}
                onCheckedChange={(v) => setValue("is_open_to_all", v)}
              />
              <div>
                <Label>Open to all students</Label>
                <p className="text-xs text-muted-foreground">
                  Bypasses level/group targeting rules below.
                </p>
              </div>
            </div>
            {!watch("is_open_to_all") && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Target levels</Label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => {
                      const active = (watch("target_levels") ?? []).includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleLevel(l)}
                          className={
                            active
                              ? "rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                              : "rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                          }
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Empty = any level may register.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Target groups</Label>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
                    {(groups ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No groups available.</p>
                    )}
                    {(groups ?? []).map((g: any) => {
                      const active = (watch("target_groups") ?? []).includes(g.id);
                      return (
                        <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleGroup(g.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          {g.name}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Empty = any group may register.</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={createM.isPending || updateM.isPending}>
              {editingId ? t("common.save") : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );


  // ─── Detail view ───
  const studentName = (s: any) =>
    s?.user
      ? `${s.user.first_name ?? ""} ${s.user.last_name ?? ""}`.trim() ||
        s.student_number ||
        s.id?.slice(0, 8)
      : s?.student_number || s?.id?.slice(0, 8) || "—";

  const detailView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setView("list")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activity?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {activity &&
                `${TYPE_LABELS[activity.type] ?? activity.type} · ${String(activity.date).slice(0, 10)}${
                  activity.start_time ? ` · ${String(activity.start_time).slice(0, 5)}` : ""
                }`}
            </p>
          </div>
          {activity && <Badge className={statusColor(activity.status)}>{activity.status}</Badge>}
        </div>
        {canManage && activity && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openForm(activity)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => askDelete(activity)}
              disabled={removeM.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      {!activity ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <Tabs defaultValue="registrations">
          <TabsList>
            <TabsTrigger value="registrations">
              <Users className="mr-2 h-4 w-4" /> Registrations
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <ImagePlus className="mr-2 h-4 w-4" /> Gallery
            </TabsTrigger>
          </TabsList>


          {/* ── Registrations ── */}
          <TabsContent value="registrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    Registered: {activity.registered_count ?? 0} / {activity.capacity}
                  </span>
                  <Badge className={statusColor(activity.status)}>{activity.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canRegister &&
                  activity.status !== "cancelled" &&
                  activity.status !== "completed" && (
                    <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Register student</Label>
                        <select
                          className={filterSelect}
                          value={regStudentId}
                          onChange={(e) => setRegStudentId(e.target.value)}
                        >
                          <option value="">Select student…</option>
                          {(students ?? []).map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {studentName(s)} {s.current_level ? `(${s.current_level})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      {Number(activity.fee) > 0 && (
                        <label className="flex items-center gap-2 pb-2 text-sm">
                          <input
                            type="checkbox"
                            checked={regMarkPaid}
                            onChange={(e) => setRegMarkPaid(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Wallet className="h-4 w-4" />
                          Collect {feeLabel(Number(activity.fee))} now
                        </label>
                      )}
                      <Button
                        disabled={!regStudentId || registerM.isPending}
                        onClick={() =>
                          registerM.mutate({
                            activityId: activity.id,
                            dto: { student_id: regStudentId, mark_paid: regMarkPaid },
                          })
                        }
                      >
                        Register
                      </Button>
                    </div>
                  )}
                {isStudent && activity.status !== "cancelled" && activity.status !== "completed" && (
                  <Button
                    variant="outline"
                    disabled={registerM.isPending}
                    onClick={() => registerM.mutate({ activityId: activity.id, dto: {} })}
                  >
                    Register myself
                  </Button>
                )}


                <div className="space-y-2">
                  {(activity.registrations ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                  {(activity.registrations ?? []).map((reg) => (
                    <div
                      key={reg.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border p-3"
                    >
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-medium">{studentName(reg.student)}</p>
                        <p className="text-xs text-muted-foreground">
                          {reg.student?.current_level ?? "—"} ·{" "}
                          {new Date(reg.registered_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={attendanceColor(reg.status)}>{reg.status}</Badge>
                      {Number(activity.fee) > 0 && (
                        <Badge
                          className={
                            Number(reg.paid_amount) >= Number(activity.fee)
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {feeLabel(Number(reg.paid_amount))}
                        </Badge>
                      )}
                      {canRegister &&
                        Number(activity.fee) > 0 &&
                        reg.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              payM.isPending ||
                              Number(reg.paid_amount) >= Number(activity.fee)
                            }
                            onClick={() => payM.mutate({ registrationId: reg.id })}
                          >
                            Collect fee
                          </Button>
                        )}
                      {canRegister && reg.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={cancelRegM.isPending}
                          onClick={() =>
                            confirm({
                              title: "Cancel registration",
                              description: `Remove this student's seat for "${activity.title}"?`,
                              variant: "destructive",
                              confirmLabel: "Cancel registration",
                              onConfirm: () => cancelRegM.mutate(reg.id),
                            })
                          }
                        >
                          <X className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ── Attendance dashboard ── */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>Attendance tracking</span>
                  <div className="flex flex-wrap gap-2 text-xs font-normal">
                    <Badge className="bg-blue-100 text-blue-800">
                      Registered {attendance?.summary.registered ?? 0}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Attended {attendance?.summary.attended ?? 0}
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      No-show {attendance?.summary.no_show ?? 0}
                    </Badge>
                    <Badge variant="outline">
                      Total {attendance?.summary.total ?? 0} / {activity.capacity}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canAttend && attendance && attendance.records.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={attendanceM.isPending}
                    onClick={() =>
                      attendanceM.mutate({
                        activityId: activity.id,
                        dto: {
                          records: attendance.records
                            .filter((r) => r.status !== "cancelled")
                            .map((r) => ({ student_id: r.student_id, status: "attended" as any })),
                        },
                      })
                    }
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark all attended
                  </Button>
                )}
                {(!attendance || attendance.records.length === 0) && (
                  <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                )}
                {(attendance?.records ?? []).map((rec) => (
                  <div
                    key={rec.registration_id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                  >
                    <span className="min-w-40 flex-1 text-sm font-medium">
                      {studentName(rec.student)}
                    </span>
                    <Badge className={attendanceColor(rec.status)}>{rec.status}</Badge>
                    {canAttend && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={rec.status === "attended" ? "default" : "outline"}
                          disabled={attendanceM.isPending}
                          onClick={() =>
                            attendanceM.mutate({
                              activityId: activity.id,
                              dto: {
                                records: [
                                  { student_id: rec.student_id, status: "attended" as any },
                                ],
                              },
                            })
                          }
                        >
                          Attended
                        </Button>
                        <Button
                          size="sm"
                          variant={rec.status === "no_show" ? "destructive" : "outline"}
                          disabled={attendanceM.isPending}
                          onClick={() =>
                            attendanceM.mutate({
                              activityId: activity.id,
                              dto: {
                                records: [
                                  { student_id: rec.student_id, status: "no_show" as any },
                                ],
                              },
                            })
                          }
                        >
                          <UserX className="mr-1 h-4 w-4" /> No-show
                        </Button>
                        <Button
                          size="sm"
                          variant={rec.status === "registered" ? "secondary" : "ghost"}
                          disabled={attendanceM.isPending}
                          onClick={() =>
                            attendanceM.mutate({
                              activityId: activity.id,
                              dto: {
                                records: [
                                  { student_id: rec.student_id, status: "registered" as any },
                                ],
                              },
                            })
                          }
                        >
                          Reset
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>


          {/* ── Photo gallery ── */}
          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photo gallery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canAttend && (
                  <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Caption (optional)</Label>
                      <Input
                        className="w-64"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="Students at the conversation club"
                      />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadM.mutate(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadM.isPending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {uploadM.isPending ? "Uploading…" : "Upload photo"}
                    </Button>
                  </div>
                )}
                {(activity.photos ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {(activity.photos ?? []).map((photo) => (
                      <figure key={photo.id} className="group relative overflow-hidden rounded-md border">
                        <img
                          src={photo.file_url}
                          alt={photo.caption ?? "Activity photo"}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                        {photo.caption && (
                          <figcaption className="truncate px-2 py-1 text-xs text-muted-foreground">
                            {photo.caption}
                          </figcaption>
                        )}
                        {canAttend && (
                          <button
                            className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            title="Remove photo"
                            onClick={() =>
                              confirm({
                                title: "Remove photo",
                                description: "This photo will be removed from the gallery.",
                                variant: "destructive",
                                confirmLabel: "Remove",
                                onConfirm: () => removePhotoM.mutate(photo.id),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );


  // ─── List view ───
  const listView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.activities")}</h1>
        {canManage && (
          <Button onClick={() => (showForm ? closeForm() : openForm())}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? "Cancel" : "Schedule Activity"}
          </Button>
        )}
      </div>

      {filterBar}

      <DataTable
        columns={columns}
        data={activities ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => {
          setSelectedId(row.id);
          setView("detail");
        }}
        pageSize={10}
        emptyMessage="No activities scheduled yet"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {dialog}
      {formDialog}
      {view === "detail" ? detailView : listView}
    </div>
  );
}

