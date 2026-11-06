import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activitiesApi, type CreateActivityDto } from "@/api/activities";
import { branchesApi } from "@/api/branches";
import type { ActivityEventType, ActivityStatusValue } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES: { value: ActivityEventType; label: string }[] = [
  { value: "movie_night", label: "Movie Night" },
  { value: "conversation_club", label: "Conversation Club" },
  { value: "trip", label: "Trip" },
  { value: "contest", label: "Contest" },
  { value: "workshop", label: "Workshop" },
  { value: "other", label: "Other" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Branch {
  id: string;
  name: string;
}

export default function ActivityFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<CreateActivityDto>({
    title: "",
    description: "",
    type: "other",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    branch_id: "",
    capacity: 30,
    fee: 0,
    target_levels: [],
    target_groups: [],
    is_open_to_all: false,
    status: "upcoming",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const branchesRes = (await branchesApi.findAll?.()) as any;
        const branchList = Array.isArray(branchesRes) 
          ? branchesRes 
          : branchesRes?.data ?? [];
        setBranches(branchList);

        if (id) {
          const activity = await activitiesApi.findOne(id);
          setForm({
            title: activity.title,
            description: activity.description ?? "",
            type: activity.type,
            date: activity.date,
            start_time: activity.start_time ?? "",
            end_time: activity.end_time ?? "",
            location: activity.location ?? "",
            branch_id: activity.branch_id,
            capacity: activity.capacity,
            fee: Number(activity.fee),
            target_levels: activity.target_levels ?? [],
            target_groups: activity.target_groups ?? [],
            is_open_to_all: activity.is_open_to_all,
            status: activity.status,
          });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to load form data" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, toast]);

  const update = <K extends keyof CreateActivityDto>(key: K, value: CreateActivityDto[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleLevel = (level: string) => {
    setForm((f) => ({
      ...f,
      target_levels: f.target_levels?.includes(level)
        ? f.target_levels.filter((l) => l !== level)
        : [...(f.target_levels ?? []), level],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CreateActivityDto = {
        ...form,
        fee: Number(form.fee) || 0,
        capacity: Number(form.capacity),
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
      };
      if (isEdit && id) {
        await activitiesApi.update(id, payload);
        toast({ title: "Activity updated" });
      } else {
        await activitiesApi.create(payload);
        toast({ title: "Activity created" });
      }
      navigate("/activities");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isEdit ? "Failed to update activity" : "Failed to create activity",
        description: err?.response?.data?.message ?? "Please check the form and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {isEdit ? "Edit Activity" : "New Activity"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch *</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => update("branch_id", v)}
                required
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => update("type", v as ActivityEventType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => update("start_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => update("end_time", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                maxLength={255}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity &amp; Fee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={10000}
                  value={form.capacity}
                  onChange={(e) => update("capacity", Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => update("fee", Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="open_to_all"
                checked={form.is_open_to_all}
                onChange={(e) => update("is_open_to_all", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="open_to_all" className="font-normal cursor-pointer">
                Open to all students (ignore level/group targeting)
              </Label>
            </div>

            {!form.is_open_to_all && (
              <div className="space-y-2">
                <Label>Target Levels</Label>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((level) => (
                    <label
                      key={level}
                      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                        form.target_levels?.includes(level)
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.target_levels?.includes(level) ?? false}
                        onChange={() => toggleLevel(level)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as ActivityStatusValue)}
              >
                <SelectTrigger id="status" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Activity" : "Create Activity"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/activities")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}