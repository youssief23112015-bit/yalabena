import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { branchesApi } from "@/api/branches";
import { usersApi } from "@/api/users";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Branch, User, Classroom } from "@/types";
import {
  Plus, X, Pencil, Trash2, Eye, ChevronLeft,  MapPin,
  Phone, Mail, DoorOpen
} from "lucide-react";

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  manager_id: z.string().optional(),
  status: z.string().optional(),
});

const classroomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

type BranchForm = z.infer<typeof branchSchema>;
type ClassroomForm = z.infer<typeof classroomSchema>;

export default function BranchesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  const [view, setView] = useState<"list" | "detail">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);

  const {
    data: branches,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.findAll,
  });

  const { data: managers } = useQuery({
    queryKey: ["users", "managers"],
    queryFn: () => usersApi.findAll({ roleId: "branch_manager" }),
  });

  const { data: selectedBranch } = useQuery({
    queryKey: ["branch", selectedBranchId],
    queryFn: () => branchesApi.findOne(selectedBranchId!),
    enabled: !!selectedBranchId && view === "detail",
  });

  const { data: classrooms } = useQuery({
    queryKey: ["branch-classrooms", selectedBranchId],
    queryFn: () => branchesApi.getClassrooms(selectedBranchId!),
    enabled: !!selectedBranchId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => branchesApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      if (selectedBranchId) queryClient.invalidateQueries({ queryKey: ["branch", selectedBranchId] });
      toast({ title: "Branch updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const createClassroomMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ClassroomForm }) => branchesApi.createClassroom(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-classrooms", selectedBranchId] });
      toast({ title: "Classroom created" });
      setShowClassroomForm(false);
      setEditingClassroomId(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateClassroomMutation = useMutation({
    mutationFn: ({ branchId, classroomId, dto }: { branchId: string; classroomId: string; dto: any }) =>
      branchesApi.updateClassroom(branchId, classroomId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-classrooms", selectedBranchId] });
      toast({ title: "Classroom updated" });
      setShowClassroomForm(false);
      setEditingClassroomId(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteClassroomMutation = useMutation({
    mutationFn: ({ branchId, classroomId }: { branchId: string; classroomId: string }) => branchesApi.removeClassroom(branchId, classroomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-classrooms", selectedBranchId] });
      toast({ title: "Classroom deleted" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const {
    register: registerBranch,
    handleSubmit: handleBranchSubmit,
    reset: resetBranch,
    setValue: setBranchValue,
    formState: { errors: branchErrors },
  } = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: { status: "active" },
  });

  const {
    register: registerClassroom,
    handleSubmit: handleClassroomSubmit,
    reset: resetClassroom,
    setValue: setClassroomValue,
    formState: { errors: classroomErrors },
  } = useForm<ClassroomForm>({
    resolver: zodResolver(classroomSchema),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetBranch();
  };

  const onBranchSubmit = (data: BranchForm) => {
    const dto = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email || undefined,
      manager_id: data.manager_id || undefined,
      status: data.status,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const onClassroomSubmit = (data: ClassroomForm) => {
    if (!selectedBranchId) return;
    if (editingClassroomId) {
      updateClassroomMutation.mutate({ branchId: selectedBranchId, classroomId: editingClassroomId, dto: data });
    } else {
      createClassroomMutation.mutate({ id: selectedBranchId, dto: data });
    }
  };

  const startEditBranch = (branch: Branch) => {
    setEditingId(branch.id);
    setShowForm(true);
    setBranchValue("name", branch.name);
    setBranchValue("address", branch.address);
    setBranchValue("phone", branch.phone);
    setBranchValue("email", branch.email || "");
    setBranchValue("manager_id", branch.manager_id || "");
    setBranchValue("status", branch.status);
  };

  const startEditClassroom = (classroom: Classroom) => {
    setEditingClassroomId(classroom.id);
    setShowClassroomForm(true);
    setClassroomValue("name", classroom.name);
    setClassroomValue("capacity", classroom.capacity);
  };

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "address", header: "Address", sortable: true },
    { key: "phone", header: "Phone", sortable: true },
    {
      key: "manager",
      header: "Manager",
      render: (row: Branch) => (
        <span className="text-xs">{row.manager ? `${row.manager.first_name} ${row.manager.last_name}` : "Unassigned"}</span>
      ),
    },
    {
      key: "classroom_count",
      header: "Classrooms",
      render: (row: Branch) => <span className="text-xs">{row.classroom_count}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: Branch) => (
        <Badge className={row.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: Branch) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedBranchId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEditBranch(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Branch", description: `Delete ${row.name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Detail View
  if (view === "detail" && selectedBranch) {
    return (
      <div className="space-y-6">
        {dialog}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedBranchId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Branches
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedBranch.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedBranch.address}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedBranch.phone}</span>
              {selectedBranch.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedBranch.email}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={selectedBranch.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {selectedBranch.status}
            </Badge>
            <Button onClick={() => startEditBranch(selectedBranch)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Manager</p><p className="text-lg font-bold">{selectedBranch.manager ? `${selectedBranch.manager.first_name} ${selectedBranch.manager.last_name}` : "Unassigned"}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Classrooms</p><p className="text-lg font-bold">{classrooms?.length ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><p className="text-lg font-bold capitalize">{selectedBranch.status}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="classrooms">
          <TabsList>
            <TabsTrigger value="classrooms">Classrooms ({classrooms?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="info">Branch Info</TabsTrigger>
          </TabsList>

          <TabsContent value="classrooms" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setShowClassroomForm(!showClassroomForm); setEditingClassroomId(null); resetClassroom(); }}>
                {showClassroomForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {showClassroomForm ? "Cancel" : "Add Classroom"}
              </Button>
            </div>

            {showClassroomForm && (
              <Card>
                <CardHeader><CardTitle className="text-base">{editingClassroomId ? "Edit Classroom" : "Add Classroom"}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleClassroomSubmit(onClassroomSubmit)} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Name *</Label>
                      <Input {...registerClassroom("name")} />
                      {classroomErrors.name && <p className="text-sm text-destructive">{classroomErrors.name.message}</p>}
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Capacity *</Label>
                      <Input type="number" {...registerClassroom("capacity")} />
                      {classroomErrors.capacity && <p className="text-sm text-destructive">{classroomErrors.capacity.message}</p>}
                    </div>
                    <Button type="submit" disabled={createClassroomMutation.isPending || updateClassroomMutation.isPending}>
                      {createClassroomMutation.isPending || updateClassroomMutation.isPending ? "Saving..." : editingClassroomId ? "Update" : "Add"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {classrooms && classrooms.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.map((classroom: Classroom) => (
                  <Card key={classroom.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{classroom.name}</p>
                            <p className="text-xs text-muted-foreground">Capacity: {classroom.capacity}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditClassroom(classroom)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => confirm({ title: "Delete Classroom", description: `Delete ${classroom.name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteClassroomMutation.mutate({ branchId: selectedBranch.id, classroomId: classroom.id }) })}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No classrooms configured.</div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Name:</span><span>{selectedBranch.name}</span>
                  <span className="text-muted-foreground">Address:</span><span>{selectedBranch.address}</span>
                  <span className="text-muted-foreground">Phone:</span><span>{selectedBranch.phone}</span>
                  <span className="text-muted-foreground">Email:</span><span>{selectedBranch.email || "—"}</span>
                  <span className="text-muted-foreground">Manager:</span><span>{selectedBranch.manager ? `${selectedBranch.manager.first_name} ${selectedBranch.manager.last_name}` : "—"}</span>
                  <span className="text-muted-foreground">Status:</span><span className="capitalize">{selectedBranch.status}</span>
                  <span className="text-muted-foreground">Created:</span><span>{new Date(selectedBranch.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.branches")}</h1>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Add Branch"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Branch" : "Create New Branch"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleBranchSubmit(onBranchSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...registerBranch("name")} />
                  {branchErrors.name && <p className="text-sm text-destructive">{branchErrors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input {...registerBranch("address")} />
                  {branchErrors.address && <p className="text-sm text-destructive">{branchErrors.address.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input {...registerBranch("phone")} />
                  {branchErrors.phone && <p className="text-sm text-destructive">{branchErrors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...registerBranch("email")} />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <select {...registerBranch("manager_id")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Unassigned</option>
                    {managers?.map((u: User) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...registerBranch("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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

      <DataTable
        columns={columns}
        data={branches || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => { setSelectedBranchId(row.id); setView("detail"); }}
        pageSize={10}
      />
    </div>
  );
}
