import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { leadsApi, type CreateLeadDto, type UpdateLeadDto, type LeadFilters } from "@/api/leads";
import { branchesApi } from "@/api/branches";
import { usersApi } from "@/api/users";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Lead, Branch, User, LeadActivity } from "@/types";
import {
  Plus, X, Pencil, Trash2, Search, Filter, Download, Upload,
  Eye, Phone, Mail, Calendar, UserCheck,
  ChevronLeft, MessageSquare, History, CheckCircle2
} from "lucide-react";

const leadSources = ["walk_in", "website", "referral", "social_media", "other"];
const leadStatuses = ["new", "contacted", "interested", "test_scheduled", "enrolled", "lost"];
const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  interested: "bg-indigo-100 text-indigo-800",
  test_scheduled: "bg-cyan-100 text-cyan-800",
  enrolled: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const activityTypeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  note: <MessageSquare className="h-3 w-3" />,
  follow_up: <Calendar className="h-3 w-3" />,
  status_change: <History className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  visit: <Eye className="h-3 w-3" />,
};

const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  source: z.string().min(1, "Source is required"),
  national_id: z.string().optional(),
  level_interest: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
  branch_id: z.string().optional(),
  tags: z.string().optional(),
  follow_up_date: z.string().optional(),
});

const updateLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  source: z.string().min(1, "Source is required"),
  national_id: z.string().optional(),
  level_interest: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
  branch_id: z.string().optional(),
  tags: z.string().optional(),
  follow_up_date: z.string().optional(),
  status: z.string().optional(),
});

type CreateLeadForm = z.infer<typeof createLeadSchema>;
type UpdateLeadForm = z.infer<typeof updateLeadSchema>;

export default function LeadsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"list" | "kanban" | "detail">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<LeadFilters>({});
  const [activityForm, setActivityForm] = useState({ type: "note" as LeadActivity["type"], description: "" });

  const {
    data: leads,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["leads", appliedFilters],
    queryFn: () => leadsApi.findAll(appliedFilters),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.findAll,
  });

  const { data: salesAgents } = useQuery({
    queryKey: ["users", "sales"],
    queryFn: () => usersApi.findAll({ roleId: "sales" }),
  });

  const { data: selectedLead } = useQuery({
    queryKey: ["lead", selectedLeadId],
    queryFn: () => leadsApi.findOne(selectedLeadId!),
    enabled: !!selectedLeadId && view === "detail",
  });

  const { data: leadActivities } = useQuery({
    queryKey: ["lead-activities", selectedLeadId],
    queryFn: () => leadsApi.getActivities(selectedLeadId!),
    enabled: !!selectedLeadId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to create lead", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeadDto }) => leadsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (selectedLeadId) queryClient.invalidateQueries({ queryKey: ["lead", selectedLeadId] });
      toast({ title: "Lead updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => leadsApi.convertToStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead converted to student successfully" });
      if (selectedLeadId) queryClient.invalidateQueries({ queryKey: ["lead", selectedLeadId] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Conversion failed", description: err.message });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: ({ id, activity }: { id: string; activity: Omit<LeadActivity, "id" | "lead_id" | "created_at"> }) =>
      leadsApi.addActivity(id, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ["lead", selectedLeadId] });
      toast({ title: "Activity added" });
      setActivityForm({ type: "note", description: "" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const importMutation = useMutation({
    mutationFn: leadsApi.bulkImport,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: `Imported ${result.imported} leads successfully` });
      if (result.errors.length > 0) {
        toast({ variant: "destructive", title: `${result.errors.length} errors during import`, description: result.errors.join("; ") });
      }
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Import failed", description: err.message });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateLeadForm>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { source: "walk_in" },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    setValue: setUpdateValue,
    formState: { errors: updateErrors },
  } = useForm<UpdateLeadForm>({
    resolver: zodResolver(updateLeadSchema),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetCreate();
    resetUpdate();
  };

  const onCreateSubmit = (data: CreateLeadForm) => {
    const dto: CreateLeadDto = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email || undefined,
      source: data.source,
      national_id: data.national_id || undefined,
      level_interest: data.level_interest || undefined,
      notes: data.notes || undefined,
      assigned_to: data.assigned_to || undefined,
      branch_id: data.branch_id || undefined,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
      follow_up_date: data.follow_up_date || undefined,
    };
    createMutation.mutate(dto);
  };

  const onUpdateSubmit = (data: UpdateLeadForm) => {
    const dto: UpdateLeadDto = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email || undefined,
      source: data.source,
      national_id: data.national_id || undefined,
      level_interest: data.level_interest || undefined,
      notes: data.notes || undefined,
      assigned_to: data.assigned_to || undefined,
      branch_id: data.branch_id || undefined,
      status: data.status,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
      follow_up_date: data.follow_up_date || undefined,
    };
    updateMutation.mutate({ id: editingId!, dto });
  };

  const startEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setShowForm(true);
    setUpdateValue("first_name", lead.first_name);
    setUpdateValue("last_name", lead.last_name);
    setUpdateValue("phone", lead.phone);
    setUpdateValue("email", lead.email || "");
    setUpdateValue("source", lead.source);
    setUpdateValue("national_id", lead.national_id || "");
    setUpdateValue("level_interest", lead.level_interest || "");
    setUpdateValue("notes", lead.notes || "");
    setUpdateValue("assigned_to", lead.assigned_to || "");
    setUpdateValue("branch_id", lead.branch_id || "");
    setUpdateValue("tags", lead.tags?.join(", ") || "");
    setUpdateValue("follow_up_date", lead.follow_up_date ? lead.follow_up_date.slice(0, 16) : "");
    setUpdateValue("status", lead.status);
  };

  const handleSearch = () => {
    setAppliedFilters({
      ...appliedFilters,
      search: search || undefined,
      status: filterStatus || undefined,
      source: filterSource || undefined,
      branch_id: filterBranchId || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterSource("");
    setFilterBranchId("");
    setAppliedFilters({});
  };

  const handleExport = async () => {
    try {
      const blob = await leadsApi.bulkExport(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export downloaded successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export failed", description: err.message });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const columns = [
    { key: "first_name", header: "First Name", sortable: true },
    { key: "last_name", header: "Last Name", sortable: true },
    { key: "phone", header: "Phone", sortable: true },
    { key: "email", header: "Email", sortable: true },
    {
      key: "source",
      header: "Source",
      render: (row: Lead) => (
        <span className="text-xs capitalize">{row.source.replace("_", " ")}</span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: Lead) => (
        <Badge variant="default" className={leadStatusColors[row.status] || "bg-gray-100 text-gray-800"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "assigned_to",
      header: "Assigned To",
      render: (row: Lead) => (
        <span className="text-xs text-muted-foreground">
          {row.assigned_to_user ? `${row.assigned_to_user.first_name} ${row.assigned_to_user.last_name}` : "Unassigned"}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: (row: Lead) => (
        <span className="text-xs text-muted-foreground">{row.branch?.name || "—"}</span>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (row: Lead) => (
        <div className="flex flex-wrap gap-1">
          {row.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
          )) || "—"}
        </div>
      ),
    },
    {
      key: "follow_up_date",
      header: "Follow-up",
      render: (row: Lead) => (
        <span className="text-xs text-muted-foreground">
          {row.follow_up_date ? new Date(row.follow_up_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: Lead) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedLeadId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Lead", description: `Are you sure you want to delete ${row.first_name} ${row.last_name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Kanban view
  const kanbanColumns = leadStatuses.map((status) => ({
    status,
    title: status.replace("_", " ").toUpperCase(),
    leads: leads?.filter((l) => l.status === status) || [],
  }));

  if (view === "detail" && selectedLead) {
    return (
      <div className="space-y-6">
        {dialog}
        {/* Back button */}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedLeadId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Leads
        </Button>

        {/* Lead Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedLead.first_name} {selectedLead.last_name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedLead.phone}</span>
              {selectedLead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedLead.email}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={leadStatusColors[selectedLead.status] || ""}>{selectedLead.status.replace("_", " ")}</Badge>
            {selectedLead.converted_to_student_id && (
              <Badge variant="success" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Converted
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activities">Activities ({leadActivities?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{selectedLead.phone}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedLead.email || "—"}</span>
                    <span className="text-muted-foreground">National ID:</span>
                    <span>{selectedLead.national_id || "—"}</span>
                    <span className="text-muted-foreground">Source:</span>
                    <span className="capitalize">{selectedLead.source.replace("_", " ")}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span>{selectedLead.assigned_to_user ? `${selectedLead.assigned_to_user.first_name} ${selectedLead.assigned_to_user.last_name}` : "Unassigned"}</span>
                    <span className="text-muted-foreground">Branch:</span>
                    <span>{selectedLead.branch?.name || "—"}</span>
                    <span className="text-muted-foreground">Level Interest:</span>
                    <span>{selectedLead.level_interest || "—"}</span>
                    <span className="text-muted-foreground">Follow-up Date:</span>
                    <span>{selectedLead.follow_up_date ? new Date(selectedLead.follow_up_date).toLocaleString() : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{selectedLead.notes || "No notes added."}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  )) || <span className="text-sm text-muted-foreground">No tags</span>}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => startEdit(selectedLead)}><Pencil className="h-4 w-4 mr-2" /> Edit Lead</Button>
              {!selectedLead.converted_to_student_id && (
                <Button variant="outline" onClick={() => confirm({ title: "Convert to Student", description: `Convert ${selectedLead.first_name} ${selectedLead.last_name} to a student?`, onConfirm: () => convertMutation.mutate(selectedLead.id) })}>
                  <UserCheck className="h-4 w-4 mr-2" /> Convert to Student
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {/* Add Activity */}
            <Card>
              <CardHeader><CardTitle className="text-base">Add Activity</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value as LeadActivity["type"] }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="call">Call</option>
                    <option value="note">Note</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="email">Email</option>
                    <option value="visit">Visit</option>
                  </select>
                  <Textarea
                    placeholder="Enter activity description..."
                    value={activityForm.description}
                    onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))}
                    className="flex-1 min-h-[40px]"
                  />
                  <Button
                    onClick={() => {
                      if (!activityForm.description.trim()) return;
                      addActivityMutation.mutate({
                        id: selectedLead.id,
                        activity: { type: activityForm.type, description: activityForm.description },
                      });
                    }}
                    disabled={addActivityMutation.isPending || !activityForm.description.trim()}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <div className="space-y-3">
              {leadActivities && leadActivities.length > 0 ? (
                leadActivities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-muted p-1.5">
                          {activityTypeIcons[activity.type] || <MessageSquare className="h-3 w-3" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{activity.type.replace("_", " ")}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                            {activity.created_by_user && (
                              <span className="text-xs text-muted-foreground">by {activity.created_by_user.first_name}</span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{activity.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No activities recorded yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dialog}
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.leads")}</h1>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,.xlsx" className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showForm ? "Cancel" : "Add Lead"}
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>List</Button>
        <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>Kanban</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
          </div>
          <div className="w-40">
            <Label className="text-xs mb-1 block">Status</Label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All Statuses</option>
              {leadStatuses.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
            </select>
          </div>
          <div className="w-40">
            <Label className="text-xs mb-1 block">Source</Label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All Sources</option>
              {leadSources.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
            </select>
          </div>
          <div className="w-48">
            <Label className="text-xs mb-1 block">Branch</Label>
            <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All Branches</option>
              {branches?.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <Button onClick={handleSearch}><Filter className="h-4 w-4 mr-1" /> Filter</Button>
          <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Lead" : "Create New Lead"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdateSubmit(onUpdateSubmit) : handleCreateSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input {...(editingId ? registerUpdate("first_name") : registerCreate("first_name"))} />
                  {editingId ? updateErrors.first_name && <p className="text-sm text-destructive">{updateErrors.first_name.message}</p> : createErrors.first_name && <p className="text-sm text-destructive">{createErrors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input {...(editingId ? registerUpdate("last_name") : registerCreate("last_name"))} />
                  {editingId ? updateErrors.last_name && <p className="text-sm text-destructive">{updateErrors.last_name.message}</p> : createErrors.last_name && <p className="text-sm text-destructive">{createErrors.last_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input {...(editingId ? registerUpdate("phone") : registerCreate("phone"))} />
                  {editingId ? updateErrors.phone && <p className="text-sm text-destructive">{updateErrors.phone.message}</p> : createErrors.phone && <p className="text-sm text-destructive">{createErrors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...(editingId ? registerUpdate("email") : registerCreate("email"))} />
                </div>
                <div className="space-y-2">
                  <Label>Source *</Label>
                  <select {...(editingId ? registerUpdate("source") : registerCreate("source"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {leadSources.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input {...(editingId ? registerUpdate("national_id") : registerCreate("national_id"))} />
                </div>
                <div className="space-y-2">
                  <Label>Level Interest</Label>
                  <Input {...(editingId ? registerUpdate("level_interest") : registerCreate("level_interest"))} placeholder="e.g. A1, B2" />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <select {...(editingId ? registerUpdate("assigned_to") : registerCreate("assigned_to"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Unassigned</option>
                    {salesAgents?.map((u: User) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <select {...(editingId ? registerUpdate("branch_id") : registerCreate("branch_id"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select branch</option>
                    {branches?.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {editingId && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select {...registerUpdate("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {leadStatuses.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input type="datetime-local" {...(editingId ? registerUpdate("follow_up_date") : registerCreate("follow_up_date"))} />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Tags (comma separated)</Label>
                  <Input {...(editingId ? registerUpdate("tags") : registerCreate("tags"))} placeholder="e.g. urgent, callback, vip" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Notes</Label>
                  <Textarea {...(editingId ? registerUpdate("notes") : registerCreate("notes"))} rows={3} />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="ml-2">Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <DataTable
          columns={columns}
          data={leads || []}
          isLoading={isLoading}
          isError={isError}
          errorMessage={(error as Error)?.message}
          onRetry={refetch}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => { setSelectedLeadId(row.id); setView("detail"); }}
          pageSize={10}
        />
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => (
            <div key={col.status} className="min-w-[280px] flex-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase">{col.title}</h3>
                <Badge variant="secondary">{col.leads.length}</Badge>
              </div>
              <div className="space-y-2">
                {col.leads.map((lead) => (
                  <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedLeadId(lead.id); setView("detail"); }}>
                    <CardContent className="p-3 space-y-2">
                      <p className="font-medium text-sm">{lead.first_name} {lead.last_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      {lead.follow_up_date && (
                        <p className="text-xs flex items-center gap-1 text-orange-600">
                          <Calendar className="h-3 w-3" /> {new Date(lead.follow_up_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {lead.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {col.leads.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">No leads</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
