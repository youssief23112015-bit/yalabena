import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@/api/users";
import { branchesApi } from "@/api/branches";
import { rolesApi } from "@/api/roles";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { User, Branch, Role } from "@/types";
import {
  Plus, X, Pencil, Trash2, Search, Filter, KeyRound,
  UserCheck, UserX
} from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  branch_id: z.string().optional(),
  role_id: z.string().optional(),
  status: z.string().optional(),
});

const updateUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  branch_id: z.string().optional(),
  role_id: z.string().optional(),
  status: z.string().optional(),
});

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(1, "Confirm password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function UsersPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [filterRoleId, setFilterRoleId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", branchId: "", roleId: "", status: "" });

  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", appliedFilters],
    queryFn: () => usersApi.findAll({
      search: appliedFilters.search || undefined,
      branchId: appliedFilters.branchId || undefined,
      roleId: appliedFilters.roleId || undefined,
      status: appliedFilters.status || undefined,
    }),
  });

  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: branchesApi.findAll });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: rolesApi.findAll });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserForm }) => usersApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => usersApi.resetPassword(id, password),
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setShowPasswordForm(false);
      setPasswordUserId(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersApi.toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Status updated" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { status: "active" },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    setValue: setUpdateValue,
    formState: { errors: updateErrors },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetCreate();
    resetUpdate();
  };

  const onCreateSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: UpdateUserForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: data });
    }
  };

  const onPasswordSubmit = (data: ResetPasswordForm) => {
    if (passwordUserId) {
      resetPasswordMutation.mutate({ id: passwordUserId, password: data.new_password });
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setShowForm(true);
    setUpdateValue("first_name", user.first_name);
    setUpdateValue("last_name", user.last_name);
    setUpdateValue("email", user.email);
    setUpdateValue("phone", user.phone || "");
    setUpdateValue("branch_id", user.branch_id || "");
    setUpdateValue("role_id", user.role_id || "");
    setUpdateValue("status", user.status || "active");
  };

  const openPasswordReset = (userId: string) => {
    setPasswordUserId(userId);
    setShowPasswordForm(true);
    resetPassword();
  };

  const handleSearch = () => {
    setAppliedFilters({ search, branchId: filterBranchId, roleId: filterRoleId, status: filterStatus });
  };

  const handleClear = () => {
    setSearch("");
    setFilterBranchId("");
    setFilterRoleId("");
    setFilterStatus("");
    setAppliedFilters({ search: "", branchId: "", roleId: "", status: "" });
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: User) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar_url} />
            <AvatarFallback className="text-xs">{row.first_name[0]}{row.last_name[0]}</AvatarFallback>
          </Avatar>
          <span>{row.first_name} {row.last_name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (row: User) => <Badge variant="outline" className="text-[10px]">{row.role || "—"}</Badge>,
    },
    {
      key: "branch",
      header: "Branch",
      render: (row: User) => <span className="text-xs text-muted-foreground">{row.branch_id || "—"}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: User) => (
        <Badge className={row.status === "active" ? "bg-green-100 text-green-800" : row.status === "suspended" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}>
          {row.status || "active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: User) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openPasswordReset(row.id); }}>
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate({ id: row.id, status: row.status === "active" ? "inactive" : "active" }); }}>
            {row.status === "active" ? <UserX className="h-4 w-4 text-yellow-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete User", description: `Delete ${row.first_name} ${row.last_name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.users")}</h1>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          </div>
        </div>
        <div className="w-40">
          <Label className="text-xs mb-1 block">Branch</Label>
          <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {branches?.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="w-40">
          <Label className="text-xs mb-1 block">Role</Label>
          <select value={filterRoleId} onChange={(e) => setFilterRoleId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {roles?.map((r: Role) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="w-32">
          <Label className="text-xs mb-1 block">Status</Label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <Button onClick={handleSearch}><Filter className="h-4 w-4 mr-1" /> Filter</Button>
        <Button variant="outline" onClick={handleClear}>Clear</Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit User" : "Create New User"}</CardTitle></CardHeader>
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
                  <Label>Email *</Label>
                  <Input type="email" {...(editingId ? registerUpdate("email") : registerCreate("email"))} />
                  {editingId ? updateErrors.email && <p className="text-sm text-destructive">{updateErrors.email.message}</p> : createErrors.email && <p className="text-sm text-destructive">{createErrors.email.message}</p>}
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" {...registerCreate("password")} />
                    {createErrors.password && <p className="text-sm text-destructive">{createErrors.password.message}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...(editingId ? registerUpdate("phone") : registerCreate("phone"))} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select {...(editingId ? registerUpdate("role_id") : registerCreate("role_id"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select role</option>
                    {roles?.map((r: Role) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <select {...(editingId ? registerUpdate("branch_id") : registerCreate("branch_id"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select branch</option>
                    {branches?.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...(editingId ? registerUpdate("status") : registerCreate("status"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
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

      {/* Password Reset Form */}
      {showPasswordForm && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-base">Reset Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>New Password</Label>
                <Input type="password" {...registerPassword("new_password")} />
                {passwordErrors.new_password && <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" {...registerPassword("confirm_password")} />
                {passwordErrors.confirm_password && <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>}
              </div>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowPasswordForm(false); setPasswordUserId(null); }}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={users || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        pageSize={10}
      />
    </div>
  );
}
