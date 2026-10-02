import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { activitiesApi } from "@/api/activities";
import type { ActivityAttendanceResponse, ActivityRegistrationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: { value: ActivityRegistrationStatus; label: string }[] = [
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No Show" },
];

export default function ActivityAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<ActivityAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, ActivityRegistrationStatus>>({});

  const fetchAttendance = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await activitiesApi.getAttendance(id);
      setData(result);
      const initial: Record<string, ActivityRegistrationStatus> = {};
      result.records.forEach((r) => {
        initial[r.student_id] = r.status;
      });
      setDraft(initial);
    } catch {
      toast({ variant: "destructive", title: "Failed to load attendance" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const records = Object.entries(draft)
        .filter(([studentId, status]) => {
          const original = data?.records.find((r) => r.student_id === studentId);
          return original && original.status !== status && status !== "cancelled";
        })
        .map(([student_id, status]) => ({ student_id, status }));
      if (records.length === 0) {
        toast({ title: "No changes to save" });
        return;
      }
      await activitiesApi.markAttendance(id, { records });
      toast({ title: "Attendance saved" });
      fetchAttendance();
    } catch {
      toast({ variant: "destructive", title: "Failed to save attendance" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <p>Attendance data not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/activities/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">{data.title}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: data.summary.total },
          { label: "Registered", value: data.summary.registered },
          { label: "Attended", value: data.summary.attended },
          { label: "No Show", value: data.summary.no_show },
          { label: "Cancelled", value: data.summary.cancelled },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({data.records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No registrations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {data.records.map((record) => (
                <div
                  key={record.registration_id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {record.student?.first_name} {record.student?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.student?.student_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {Number(record.paid_amount) > 0 && (
                      <Badge variant="outline">
                        Paid: {Number(record.paid_amount).toFixed(2)}
                      </Badge>
                    )}
                    {record.status === "cancelled" ? (
                      <Badge variant="destructive">Cancelled</Badge>
                    ) : (
                      <Select
                        value={draft[record.student_id] ?? record.status}
                        onValueChange={(v) =>
                          setDraft((d) => ({
                            ...d,
                            [record.student_id]: v as ActivityRegistrationStatus,
                          }))
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
