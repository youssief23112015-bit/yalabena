import { useAuthStore } from "@/store/authStore";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import HrDashboard from "@/pages/dashboards/HrDashboard";

/**
 * Roles that receive the full administrative dashboard (Leads, inventory,
 * financial metrics, …). `auditor` / `moderator` are back-office roles and
 * keep the historical full dashboard as well.
 */
const ADMIN_DASHBOARD_ROLES = [
  "super_admin",
  "sales",
  "finance",
  "academic",
  "auditor",
  "moderator",
];

export type DashboardKind = "student" | "teacher" | "hr" | "admin";

/**
 * Single source of truth for which dashboard a set of roles receives.
 *
 * Precedence for multi-role users: admin > hr > teacher > student —
 * a staff member who also studies still gets the staff dashboard, and an
 * unknown role safely falls back to the full dashboard (previous behaviour).
 */
export function resolveDashboardKind(roles: string[]): DashboardKind {
  if (roles.some((role) => ADMIN_DASHBOARD_ROLES.includes(role))) return "admin";
  if (roles.includes("hr")) return "hr";
  if (roles.includes("teacher")) return "teacher";
  if (roles.includes("student")) return "student";
  return "admin";
}

/**
 * Centralized post-login dashboard router.
 *
 * Rendered at `/dashboard` (and right after login) inside AppShell; picks the
 * role-tailored dashboard so each role only sees its own widgets:
 *   student ➡️ StudentDashboard     teacher ➡️ TeacherDashboard
 *   hr      ➡️ HrDashboard          admins/sales/finance/academic ➡️ AdminDashboard
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);

  switch (resolveDashboardKind(roles)) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "hr":
      return <HrDashboard />;
    default:
      return <AdminDashboard />;
  }
}
