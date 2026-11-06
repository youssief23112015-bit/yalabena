import { useCallback, useEffect, useMemo, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { Plus, Search, CalendarDays, MapPin, Users } from "lucide-react";
import { activitiesApi, type ActivityFilters } from "@/api/activities";
import type { Activity, ActivityEventType, ActivityStatusValue } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<ActivityEventType, string> = {
  movie_night: "Movie Night",
  conversation_club: "Conversation Club",
  trip: "Trip",
  contest: "Contest",
  workshop: "Workshop",
  other: "Other",
};

const STATUS_VARIANTS: Record<ActivityStatusValue, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  open: "bg-green-100 text-green-800",
  full: "bg-amber-100 text-amber-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ActivitiesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activitiesApi.findAll(filters);
      setActivities(data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load activities" });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearch = (value: string) => {
    setFilters((f) => ({ ...f, search: value || undefined }));
  };

  const handleTypeChange = (value: string) => {
    setFilters((f) => ({
      ...f,
      type: value === "all" ? undefined : (value as ActivityEventType),
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((f) => ({
      ...f,
      status: value === "all" ? undefined : (value as ActivityStatusValue),
    }));
  };

  const activityCards = useMemo(() => activities, [activities]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">
            Manage extracurricular activities, registrations and attendance.
          </p>
        </div>
        <Button onClick={() => navigate("/activities/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Activity
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities…"
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : activityCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activityCards.map((activity) => (
            <Card
              key={activity.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/activities/${activity.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">
                    {activity.title}
                  </CardTitle>
                  <Badge className={cn("shrink-0", STATUS_VARIANTS[activity.status])}>
                    {activity.status}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit">
                  {TYPE_LABELS[activity.type]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{activity.date}</span>
                  {activity.start_time && (
                    <span>
                      · {activity.start_time}
                      {activity.end_time && ` – ${activity.end_time}`}
                    </span>
                  )}
                </div>
                {activity.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {activity.registered_count ?? 0} / {activity.capacity} registered
                  </span>
                </div>
                {Number(activity.fee) > 0 && (
                  <p className="font-medium">Fee: {Number(activity.fee).toFixed(2)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
