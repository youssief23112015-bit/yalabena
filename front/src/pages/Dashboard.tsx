import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { leadsApi } from "@/api/leads";
import { studentsApi } from "@/api/students";
import { coursesApi } from "@/api/courses";
import { branchesApi } from "@/api/branches";
import { groupsApi } from "@/api/groups";
import { sessionsApi } from "@/api/sessions";
import {
  Users,
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  Percent,
} from "lucide-react";

// Helper to normalize paginated or wrapped API responses into a flat array
const normalizeArray = <T,>(res: any): T[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.leads)) return res.leads;
  if (res && Array.isArray(res.students)) return res.students;
  if (res && Array.isArray(res.courses)) return res.courses;
  if (res && Array.isArray(res.branches)) return res.branches;
  if (res && Array.isArray(res.groups)) return res.groups;
  if (res && Array.isArray(res.sessions)) return res.sessions;
  return [];
};

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const user = useAuthStore((s) => s.user);

  // Fetch all basic data in parallel and normalize responses
  const { data: rawLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: () => leadsApi.findAll(),
  });
  const leads = normalizeArray<any>(rawLeads);

  const { data: rawStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ["dashboard-students"],
    queryFn: () => studentsApi.findAll(),
  });
  const students = normalizeArray<any>(rawStudents);

  const { data: rawCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ["dashboard-courses"],
    queryFn: () => coursesApi.findAll(),
  });
  const courses = normalizeArray<any>(rawCourses);

  const { data: rawBranches, isLoading: branchesLoading } = useQuery({
    queryKey: ["dashboard-branches"],
    queryFn: () => branchesApi.findAll(),
  });
  const branches = normalizeArray<any>(rawBranches);

  const { data: rawGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["dashboard-groups"],
    queryFn: () => groupsApi.findAll(),
  });
  const groups = normalizeArray<any>(rawGroups);

  const { data: rawSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["dashboard-sessions"],
    queryFn: () => sessionsApi.findAll(),
  });
  const sessions = normalizeArray<any>(rawSessions);

  const isLoading = leadsLoading || studentsLoading || coursesLoading || branchesLoading || groupsLoading || sessionsLoading;

  // Compute stats safely from normalized arrays
  const totalLeads = leads.length;
  const totalStudents = students.length;
  const totalCourses = courses.length;
  const totalBranches = branches.length;
  const totalGroups = groups.length;
  const totalSessions = sessions.length;

  // Conversion rate: enrolled leads / total leads
  const enrolledLeads = leads.filter((l) => l?.status === "enrolled").length;
  const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

  // Group fill rate
  const totalCapacity = groups.reduce((sum, g) => sum + (Number(g?.capacity) || 0), 0);
  const totalEnrolled = groups.reduce((sum, g) => sum + (Number(g?.student_count) || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
    .slice(0, 5);

  // Upcoming sessions (next 5 scheduled)
  const upcomingSessions = [...sessions]
    .filter((s) => s?.status === "scheduled" && s?.start_time && new Date(s.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // Attendance summary from sessions
  const presentCount = sessions.reduce((sum, s) => sum + (Array.isArray(s?.attendance) ? s.attendance.filter((a: any) => a?.status === "present").length : 0), 0);
  const absentCount = sessions.reduce((sum, s) => sum + (Array.isArray(s?.attendance) ? s.attendance.filter((a: any) => a?.status === "absent").length : 0), 0);
  const lateCount = sessions.reduce((sum, s) => sum + (Array.isArray(s?.attendance) ? s.attendance.filter((a: any) => a?.status === "late").length : 0), 0);

  const statCards = [
    { title: t("nav.leads"), value: totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: t("nav.students"), value: totalStudents, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50" },
    { title: t("nav.courses"), value: totalCourses, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { title: t("nav.branches"), value: totalBranches, icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
    { title: t("nav.groups"), value: totalGroups, icon: CalendarDays, color: "text-pink-600", bg: "bg-pink-50" },
    { title: t("nav.sessions"), value: totalSessions, icon: Clock, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  const kpiCards = [
    { title: "Conversion Rate", value: `${conversionRate}%`, icon: Percent, color: "text-emerald-600", bg: "bg-emerald-50", sub: `${enrolledLeads} of ${totalLeads} leads` },
    { title: "Group Fill Rate", value: `${fillRate}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", sub: `${totalEnrolled} of ${totalCapacity} seats` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
        <p className="text-muted-foreground">
          {user ? `${t("auth.loginSuccess")} ${user.first_name}` : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Primary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={`rounded-md p-2 ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                    <div className={`rounded-md p-2 ${kpi.bg}`}>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {recentLeads.length > 0 ? (
                  <div className="space-y-3">
                    {recentLeads.map((lead) => (
                      <div key={lead?.id || Math.random()} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{lead?.first_name} {lead?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{lead?.phone}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead?.status === "new" ? "bg-blue-100 text-blue-800" :
                          lead?.status === "enrolled" ? "bg-green-100 text-green-800" :
                          lead?.status === "lost" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {(lead?.status || "unknown").replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No leads yet</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div key={session?.id || Math.random()} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{session?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session?.start_time ? new Date(session.start_time).toLocaleString() : "—"}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                          {session?.status || "scheduled"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-xl font-bold text-green-700">{presentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-xl font-bold text-red-700">{absentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-xl font-bold text-yellow-700">{lateCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}