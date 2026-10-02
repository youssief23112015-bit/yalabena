import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Pencil,
  Trash2,
  ImagePlus,
  UserPlus,
  ClipboardCheck,
} from "lucide-react";
import { activitiesApi } from "@/api/activities";
import type { Activity } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RegisterStudentModal } from "@/components/activities/RegisterStudentModal";
import { AddPhotoModal } from "@/components/activities/AddPhotoModal";
import { PayFeeModal } from "@/components/activities/PayFeeModal";
import { PhotoGallery } from "@/components/activities/PhotoGallery";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  open: "bg-green-100 text-green-800",
  full: "bg-amber-100 text-amber-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ActivityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [payTarget, setPayTarget] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await activitiesApi.findOne(id);
      setActivity(data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load activity" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await activitiesApi.remove(id);
      toast({ title: "Activity deleted" });
      navigate("/activities");
    } catch {
      toast({ variant: "destructive", title: "Failed to delete activity" });
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await activitiesApi.cancelRegistration(registrationId);
      toast({ title: "Registration cancelled" });
      fetchActivity();
    } catch {
      toast({ variant: "destructive", title: "Failed to cancel registration" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto py-6">
        <p>Activity not found.</p>
        <Button variant="outline" onClick={() => navigate("/activities")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activities
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/activities")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{activity.title}</h1>
              <Badge className={cn(STATUS_VARIANTS[activity.status])}>
                {activity.status}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">{activity.type.replace(/_/g, " ")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/activities/${id}/attendance`)}>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Attendance
          </Button>
          <Button variant="outline" onClick={() => navigate(`/activities/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.description && (
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.date}</span>
                </div>
                {(activity.start_time || activity.end_time) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {activity.start_time ?? "—"}
                      {activity.end_time && ` – ${activity.end_time}`}
                    </span>
                  </div>
                )}
                {activity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {activity.registered_count ?? 0} / {activity.capacity} registered
                  </span>
                </div>
                {Number(activity.fee) > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Fee: {Number(activity.fee).toFixed(2)}</span>
                  </div>
                )}
              </div>
              {activity.target_levels && activity.target_levels.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {activity.target_levels.map((lvl) => (
                    <Badge key={lvl} variant="secondary">{lvl}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registrations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registrations ({activity.registrations?.length ?? 0})</CardTitle>
              <Button size="sm" onClick={() => setShowRegisterModal(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Register Student
              </Button>
            </CardHeader>
            <CardContent>
              {activity.registrations && activity.registrations.length > 0 ? (
                <div className="space-y-2">
                  {activity.registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between rounded-md border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {reg.student?.first_name} {reg.student?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reg.student?.student_number} · {reg.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {Number(reg.paid_amount) > 0 && (
                          <Badge variant="outline">
                            Paid: {Number(reg.paid_amount).toFixed(2)}
                          </Badge>
                        )}
                        {reg.status !== "cancelled" && (
                          <>
                            {Number(activity.fee) > 0 &&
                              Number(reg.paid_amount) < Number(activity.fee) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPayTarget(reg.id)}
                                >
                                  Collect Fee
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelRegistration(reg.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No registrations yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Photos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Photo Gallery</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddPhotoModal(true)}>
                <ImagePlus className="mr-2 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                photos={activity.photos ?? []}
                onRemove={(photoId) => {
                  activitiesApi.removePhoto(photoId).then(fetchActivity);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <RegisterStudentModal
        open={showRegisterModal}
        onOpenChange={setShowRegisterModal}
        activityId={activity.id}
        fee={Number(activity.fee)}
        onSuccess={fetchActivity}
      />
      <AddPhotoModal
        open={showAddPhotoModal}
        onOpenChange={setShowAddPhotoModal}
        activityId={activity.id}
        onSuccess={fetchActivity}
      />
      {payTarget && (
        <PayFeeModal
          open={!!payTarget}
          onOpenChange={(open) => !open && setPayTarget(null)}
          registrationId={payTarget}
          outstandingFee={
            Number(activity.fee) -
            Number(
              activity.registrations?.find((r) => r.id === payTarget)?.paid_amount ?? 0,
            )
          }
          onSuccess={fetchActivity}
        />
      )}

      {/* Delete confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{activity.title}" along with all its
              registrations and photos. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}