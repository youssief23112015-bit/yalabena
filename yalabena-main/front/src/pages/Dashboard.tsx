import React from "react";
import { useAuthStore } from "@/store/authStore";
import SuperAdminDashboard from "@/pages/dashboards/SuperAdminDashboard";
import BranchManagerDashboard from "@/pages/dashboards/BranchManagerDashboard";
import SalesDashboard from "@/pages/dashboards/SalesDashboard";
import FinanceOfficerDashboard from "@/pages/dashboards/FinanceOfficerDashboard";
import AcademicDashboard from "@/pages/dashboards/AcademicDashboard";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import HrDashboard from "@/pages/dashboards/HrDashboard";
import ModeratorDashboard from "@/pages/dashboards/ModeratorDashboard";
import AuditorDashboard from "@/pages/dashboards/AuditorDashboard";
import GenericDashboard from "@/pages/dashboards/GenericDashboard";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DashboardKind =
  | "super_admin"
  | "branch_manager"
  | "sales"
  | "finance"
  | "academic"
  | "teacher"
  | "student"
  | "hr"
  | "moderator"
  | "auditor"
  | "generic";

const DASHBOARD_ROLE_PRECEDENCE: DashboardKind[] = [
  "super_admin",
  "branch_manager",
  "finance",
  "sales",
  "academic",
  "hr",
  "teacher",
  "moderator",
  "auditor",
  "student",
];

const DASHBOARD_ELIGIBLE_ROLES: Record<string, DashboardKind> = {
  super_admin: "super_admin",
  branch_manager: "branch_manager",
  sales: "sales",
  finance: "finance",
  academic: "academic",
  teacher: "teacher",
  student: "student",
  hr: "hr",
  moderator: "moderator",
  auditor: "auditor",
};

const DASHBOARD_COMPONENTS: Record<DashboardKind, React.ComponentType> = {
  super_admin: SuperAdminDashboard,
  branch_manager: BranchManagerDashboard,
  sales: SalesDashboard,
  finance: FinanceOfficerDashboard,
  academic: AcademicDashboard,
  teacher: TeacherDashboard,
  student: StudentDashboard,
  hr: HrDashboard,
  moderator: ModeratorDashboard,
  auditor: AuditorDashboard,
  generic: GenericDashboard,
};

/**
 * Resolve the primary dashboard kind for a set of roles.
 */
export function resolveDashboardKind(roles: string[]): DashboardKind {
  for (const kind of DASHBOARD_ROLE_PRECEDENCE) {
    if (roles.some((r) => DASHBOARD_ELIGIBLE_ROLES[r] === kind)) {
      return kind;
    }
  }
  return "generic";
}

/**
 * Return all dashboard-kind tabs a multi-role user is eligible for.
 */
export function eligibleDashboardKinds(roles: string[]): DashboardKind[] {
  return DASHBOARD_ROLE_PRECEDENCE.filter((kind) =>
    roles.some((r) => DASHBOARD_ELIGIBLE_ROLES[r] === kind),
  );
}

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);

  const eligibleKinds = eligibleDashboardKinds(roles);
  const defaultKind = eligibleKinds.length > 0 ? eligibleKinds[0] : "generic";

  // Multi-role users: show a tab switcher at the top.
  if (eligibleKinds.length > 1) {
    const [activeKind, setActiveKind] = React.useState<DashboardKind>(defaultKind);
    const Component = DASHBOARD_COMPONENTS[activeKind];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <div className="flex gap-2">
            <Tabs defaultValue={defaultKind} onValueChange={(v) => setActiveKind(v as DashboardKind)}>
              <TabsList className="grid w-fit grid-cols-1">
                {eligibleKinds.map((kind) => (
                  <TabsTrigger key={kind} value={kind} className="text-sm">
                    {kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <TabsContent value={activeKind} className="mt-4">
          <Component />
        </TabsContent>
      </div>
    );
  }

  const Component = DASHBOARD_COMPONENTS[defaultKind];
  return <Component />;
}