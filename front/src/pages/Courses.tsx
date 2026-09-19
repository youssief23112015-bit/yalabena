import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { coursesApi } from "@/api/courses";
import { branchesApi } from "@/api/branches";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Course, Branch } from "@/types";
import {
  Plus, X, Pencil, Trash2, Eye, ChevronLeft, BookOpen, DollarSign,
  Minus
} from "lucide-react";

const courseStatuses = ["active", "inactive", "archived"];

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.string().min(1, "Level is required"),
  duration_hours: z.coerce.number().min(1, "Must be at least 1 hour"),
  default_price: z.coerce.number().min(0, "Price must be positive"),
  syllabus: z.string().optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  min_age: z.coerce.number().min(0).optional(),
  max_age: z.coerce.number().min(0).optional(),
});

type CourseForm = z.infer<typeof courseSchema>;

export default function CoursesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [view, setView] = useState<"list" | "detail">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [prereqSearch, setPrereqSearch] = useState("");
  const [branchPriceInput, setBranchPriceInput] = useState<{ branchId: string; price: string }>({ branchId: "", price: "" });

  const {
    data: courses,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.findAll,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.findAll,
  });

  const { data: selectedCourse } = useQuery({
    queryKey: ["course", selectedCourseId],
    queryFn: () => coursesApi.findOne(selectedCourseId!),
    enabled: !!selectedCourseId && view === "detail",
  });

  const { data: courseMaterials } = useQuery({
    queryKey: ["course-materials", selectedCourseId],
    queryFn: () => coursesApi.getMaterials(selectedCourseId!),
    enabled: !!selectedCourseId && view === "detail",
  });

  const { data: branchPricing } = useQuery({
    queryKey: ["course-branch-pricing", selectedCourseId],
    queryFn: () => coursesApi.getBranchPricing(selectedCourseId!),
    enabled: !!selectedCourseId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Course> }) => coursesApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (selectedCourseId) queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
      toast({ title: "Course updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: coursesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course deleted successfully" });
      if (view === "detail") setView("list");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const addPrereqMutation = useMutation({
    mutationFn: ({ id, prereqId }: { id: string; prereqId: string }) => coursesApi.addPrerequisite(id, prereqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
      toast({ title: "Prerequisite added" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const removePrereqMutation = useMutation({
    mutationFn: ({ id, prereqId }: { id: string; prereqId: string }) => coursesApi.removePrerequisite(id, prereqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
      toast({ title: "Prerequisite removed" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const setBranchPriceMutation = useMutation({
    mutationFn: ({ id, branchId, price }: { id: string; branchId: string; price: number }) => coursesApi.setBranchPricing(id, branchId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-branch-pricing", selectedCourseId] });
      toast({ title: "Branch pricing updated" });
      setBranchPriceInput({ branchId: "", price: "" });
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
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: { status: "active" },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: CourseForm) => {
    const dto: Partial<Course> = {
      name: data.name,
      level: data.level,
      duration_hours: data.duration_hours,
      default_price: data.default_price,
      syllabus: data.syllabus,
      description: data.description,
      status: data.status,
      min_age: data.min_age,
      max_age: data.max_age,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setShowForm(true);
    setValue("name", course.name);
    setValue("level", course.level);
    setValue("duration_hours", course.duration_hours);
    setValue("default_price", Number(course.default_price));
    setValue("syllabus", course.syllabus || "");
    setValue("description", course.description || "");
    setValue("status", course.status);
    setValue("min_age", course.min_age);
    setValue("max_age", course.max_age);
  };

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "level", header: "Level", sortable: true },
    { key: "duration_hours", header: "Hours", sortable: true },
    {
      key: "default_price",
      header: "Price",
      sortable: true,
      render: (row: Course) => `$${Number(row.default_price).toFixed(2)}`,
    },
    {
      key: "code",
      header: "Code",
      render: (row: Course) => <span className="text-xs font-mono text-muted-foreground">{row.code || "—"}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row: Course) => (
        <Badge className={row.status === "active" ? "bg-green-100 text-green-800" : row.status === "archived" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: Course) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedCourseId(row.id); setView("detail"); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {!isStudent && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirm({ title: "Delete Course", description: `Delete ${row.name}?`, variant: "destructive", confirmLabel: "Delete", onConfirm: () => deleteMutation.mutate(row.id) }); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Detail View
  if (view === "detail" && selectedCourse) {
    const availablePrereqs = courses?.filter((c) => c.id !== selectedCourse.id && !selectedCourse.prerequisites?.find((p) => p.id === c.id)) || [];
    const filteredPrereqs = prereqSearch
      ? availablePrereqs.filter((c) => c.name.toLowerCase().includes(prereqSearch.toLowerCase()) || c.level.toLowerCase().includes(prereqSearch.toLowerCase()))
      : availablePrereqs;

    return (
      <div className="space-y-6">
        {dialog}
        <Button variant="outline" onClick={() => { setView("list"); setSelectedCourseId(null); }} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Courses
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedCourse.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge>{selectedCourse.level}</Badge>
              <Badge className={selectedCourse.status === "active" ? "bg-green-100 text-green-800" : selectedCourse.status === "archived" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}>
                {selectedCourse.status}
              </Badge>
              {selectedCourse.code && <span className="text-xs font-mono text-muted-foreground">{selectedCourse.code}</span>}
            </div>
          </div>
          {!isStudent && (
            <Button onClick={() => startEdit(selectedCourse)}><Pencil className="h-4 w-4 mr-2" /> Edit Course</Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Duration</p><p className="text-lg font-bold">{selectedCourse.duration_hours} hours</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Default Price</p><p className="text-lg font-bold">${Number(selectedCourse.default_price).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Age Range</p><p className="text-lg font-bold">{selectedCourse.min_age ?? "Any"} — {selectedCourse.max_age ?? "Any"}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="syllabus">
          <TabsList>
            <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
            <TabsTrigger value="prerequisites">Prerequisites ({selectedCourse.prerequisites?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({courseMaterials?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="pricing">Branch Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="syllabus" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{selectedCourse.description || "No description available."}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Syllabus</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{selectedCourse.syllabus || "No syllabus available."}</p></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prerequisites" className="space-y-4">
            {/* Add Prerequisite */}
            <Card>
              <CardHeader><CardTitle className="text-base">Add Prerequisite</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Search courses..." value={prereqSearch} onChange={(e) => setPrereqSearch(e.target.value)} />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredPrereqs.length > 0 ? (
                    filteredPrereqs.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.level}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addPrereqMutation.mutate({ id: selectedCourse.id, prereqId: c.id })}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No available courses found.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Prerequisites */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Prerequisites</h3>
              {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 ? (
                selectedCourse.prerequisites.map((prereq) => (
                  <Card key={prereq.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prereq.name}</p>
                        <p className="text-xs text-muted-foreground">{prereq.level} · {prereq.duration_hours}h</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePrereqMutation.mutate({ id: selectedCourse.id, prereqId: prereq.id })}>
                        <Minus className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No prerequisites set.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {courseMaterials && courseMaterials.length > 0 ? (
              <div className="grid gap-3">
                {courseMaterials.map((mat: any) => (
                  <Card key={mat.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{mat.inventory_item?.name || "Unknown Item"}</p>
                        <p className="text-xs text-muted-foreground">Qty: {mat.quantity} {mat.required ? "· Required" : "· Optional"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No materials linked to this course.</div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            {/* Set Branch Price */}
            <Card>
              <CardHeader><CardTitle className="text-base">Set Branch-Specific Price</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Branch</Label>
                    <select
                      value={branchPriceInput.branchId}
                      onChange={(e) => setBranchPriceInput((p) => ({ ...p, branchId: e.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select branch</option>
                      {branches?.map((b: Branch) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs mb-1 block">Price (EGP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={branchPriceInput.price}
                      onChange={(e) => setBranchPriceInput((p) => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (branchPriceInput.branchId && branchPriceInput.price) {
                        setBranchPriceMutation.mutate({
                          id: selectedCourse.id,
                          branchId: branchPriceInput.branchId,
                          price: parseFloat(branchPriceInput.price),
                        });
                      }
                    }}
                    disabled={!branchPriceInput.branchId || !branchPriceInput.price || setBranchPriceMutation.isPending}
                  >
                    Set Price
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Branch Pricing */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Branch Pricing</h3>
              {branchPricing && branchPricing.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {branchPricing.map((bp: any) => (
                    <Card key={bp.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{bp.branch?.name || "Unknown Branch"}</span>
                        </div>
                        <span className="font-bold">{bp.price} {bp.currency || "EGP"}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No branch-specific pricing set. Using default price.</p>
              )}
            </div>
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
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.courses")}</h1>
        {!isStudent && (
          <Button onClick={() => { setShowForm(!showForm); if (showForm) closeForm(); }}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? "Cancel" : "Add Course"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Course" : "Create New Course"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Input {...register("level")} placeholder="e.g. A1, B2, Advanced" />
                  {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Duration (hours) *</Label>
                  <Input type="number" {...register("duration_hours")} />
                  {errors.duration_hours && <p className="text-sm text-destructive">{errors.duration_hours.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Default Price *</Label>
                  <Input type="number" step="0.01" {...register("default_price")} />
                  {errors.default_price && <p className="text-sm text-destructive">{errors.default_price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <select {...register("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {courseStatuses.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input type="number" {...register("min_age")} />
                </div>
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input type="number" {...register("max_age")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...register("description")} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Syllabus</Label>
                <Textarea {...register("syllabus")} rows={4} placeholder="Enter course syllabus..." />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={courses || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onRetry={refetch}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => { setSelectedCourseId(row.id); setView("detail"); }}
        pageSize={10}
      />
    </div>
  );
}
