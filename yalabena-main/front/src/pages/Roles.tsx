import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { rolesApi } from "@/api/roles";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Role, Permission, User } from "@/types";
import {
  Plus, X, Pencil, Trash2, Eye, ChevronLeft,
  CheckSquare, Square
} from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9_]+$/, "Slug must be lowercase letters, numbers, and underscores only"),
  description: z.string().optional(),
});

type RoleForm = z.infer<typeof roleSchema>;


export default function RolesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  const [view, setView] = useState<"list" | "detail">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const {
    data: roles,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.findAll,
  });

  const { data: allPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: rolesApi.getPermissions,
  });

  const { data: selectedRole } = useQuery({
    queryKey: ["role", selectedRoleId],
    queryFn: () => rolesApi.findOne(selectedRoleId!),
    enabled: !!selectedRoleId && view === "detail",
  });

  const { data: roleUsers } = useQuery({
    queryKey: ["role-users", selectedRoleId],
    queryFn: () => rolesApi.getUsers(selectedRoleId!),
    enabled: !!selectedRoleId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; slug: string; description?: string; permission_ids: string[] }) => rolesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => rolesApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      if (selectedRoleId) queryClient.invalidateQueries({ queryKey: ["role", selectedRoleId] });
      toast({ title: "Role updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedPermissions(new Set());
    reset();
  };

  const onSubmit = (data: RoleForm) => {
    const permissionIds = Array.from(selectedPermissions);
    const dto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      permission_ids: permissionIds,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: { name: data.name, description: data.description, permission_ids: permissionIds } });
    } else {
      createMutation.mutate(dto);
    }
  };

  const startEdit = (role: Role) => {
    setEditingId(role.id);
    setShowForm(true);
    setValue("name", role.name);
    setValue("slug", role.slug);
    setValue("description", role.description || "");
    setSelectedPermissions(new Set(role.permissions.map((p) => p.id)));
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const toggleModuleAction = (module: string, action: string, permissions: Permission[]) => {
    const perm = permissions.find((p) => p.module === module && p.action === action);
    if (perm) {
      togglePermission(perm.id);
    }
  };

 

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "slug", header: "Slug", sortable: true },
    { key: "description", header: "Description", render: (row: Role) => <span className="text-xs text-muted-foreground">{row.description || "—"}</span> },
    {
      key: "permissions",
      header: "Permissions",
      render: (row: Role) => <Badge variant="secondary">{row.permissions?.length || 0} permissions</Badge>,
    },
    {
      key: "type",
      header: "Type",
      render: (row: Role) => (
        <Badge variant="outline" className="text-[10px]">
          {row.is_system ? "System" : row.is_custom ? "Custom" : "Standard"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: Role) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedRoleId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {!row.is_system && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {!row.is_system && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Role", description: `Delete ${row.name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Permission Matrix Component
  const PermissionMatrix = ({ permissions, readOnly = false }: { permissions: Permission[]; readOnly?: boolean }) => {
    const selectedIds = readOnly && selectedRole
      ? new Set(selectedRole.permissions.map((permission) => permission.id))
      : selectedPermissions;
    const modules = [...new Set(permissions.map((p) => p.module))].sort();
    const actions = [...new Set(permissions.map((p) => p.action))].sort();

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium sticky left-0 bg-muted">Module</th>
              {actions.map((action) => (
                <th key={action} className="px-3 py-2 text-center font-medium capitalize">{action.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module} className="border-t">
                <td className="px-3 py-2 font-medium capitalize sticky left-0 bg-background">{module.replace('_', ' ')}</td>
                {actions.map((action) => {
                  const hasPerm = permissions.some((p) => p.module === module && p.action === action);
                  const isSelected = (() => {
                    const perm = permissions.find((p) => p.module === module && p.action === action);
                    return perm ? selectedIds.has(perm.id) : false;
                  })();
                  return (
                    <td key={action} className="px-3 py-2 text-center">
                      {hasPerm ? (
                        readOnly ? (
                          isSelected ? <CheckSquare className="h-4 w-4 text-green-600 mx-auto" /> : <Square className="h-4 w-4 text-muted-foreground mx-auto" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleModuleAction(module, action, permissions)}
                            className="focus:outline-none"
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4 text-green-600" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Detail View
  if (view === "detail" && selectedRole) {
    return (
      <div className="space-y-6">
        {dialog}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedRoleId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Roles
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedRole.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedRole.slug}</p>
            <p className="text-sm text-muted-foreground">{selectedRole.description || "No description"}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{selectedRole.is_system ? "System Role" : selectedRole.is_custom ? "Custom Role" : "Standard"}</Badge>
            {!selectedRole.is_system && <Button onClick={() => startEdit(selectedRole)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>}
          </div>
        </div>

        <Tabs defaultValue="permissions">
          <TabsList>
            <TabsTrigger value="permissions">Permissions ({selectedRole.permissions.length})</TabsTrigger>
            <TabsTrigger value="users">Assigned Users ({roleUsers?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Permission Matrix</CardTitle></CardHeader>
              <CardContent>
                <PermissionMatrix permissions={allPermissions || []} readOnly />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {roleUsers && roleUsers.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {roleUsers.map((user: User) => (
                  <Card key={user.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge className={user.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {user.status || "active"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No users assigned to this role.</div>
            )}
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
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.roles")}</h1>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Add Role"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Role" : "Create New Role"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input {...register("slug")} placeholder="e.g. sales_manager" disabled={!!editingId} />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...register("description")} />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="ml-2">Cancel</Button>
            </form>

            {/* Permission Matrix for form */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Permissions</h3>
              <PermissionMatrix permissions={allPermissions || []} />
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={roles || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => { setSelectedRoleId(row.id); setView("detail"); }}
        pageSize={10}
      />
    </div>
  );
}
