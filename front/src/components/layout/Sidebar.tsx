import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TEACHER_SELF_ROLES, SALES_SELF_ROLES, ACADEMIC_SELF_ROLES, ESS_NAV_ROLES } from "@/lib/rbac";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Clock,
  UserCog,
  ShieldCheck,
  ClipboardCheck,
  Hourglass,
  Wallet,
  Award,
  BookMarked,
  Briefcase,
  Sparkles,
  BookOpenText,
  BarChart3,
  MessagesSquare,
  Package,
  Bell,
  ScrollText,
  ShieldHalf,
  LogOut,
  X,
  Calendar,
  ChevronDown,
  HelpCircle
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard, roles: [] },
  { to: "/leads", label: "nav.leads", icon: Users, roles: ["super_admin", "branch_manager", "sales"] },
  { to: "/students", label: "nav.students", icon: GraduationCap, roles: ["super_admin", "branch_manager", "sales", "finance", "academic", "teacher"] },
  { to: "/courses", label: "nav.courses", icon: BookOpen, roles: ["super_admin", "branch_manager", "academic", "teacher"] },
  { to: "/groups", label: "nav.groups", icon: CalendarDays, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/sessions", label: "nav.sessions", icon: Clock, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/attendance", label: "nav.attendance", icon: ClipboardCheck, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/placement-tests", label: "nav.placementTests", icon: BookMarked, roles: ["super_admin", "branch_manager", "sales", "academic"] },
  { to: "/test-slots", label: "nav.testSlots", icon: Calendar, roles: ["super_admin", "branch_manager", "academic"] },
  { to: "/waitlists", label: "nav.waitlists", icon: Hourglass, roles: ["super_admin", "branch_manager", "sales", "academic"] },
  { to: "/enrollments", label: "nav.enrollments", icon: ScrollText, roles: ["super_admin", "branch_manager", "sales", "finance", "academic"] },
  { to: "/finance", label: "nav.finance", icon: Wallet, roles: ["super_admin", "finance", "branch_manager"] },
  { to: "/certificates", label: "nav.certificates", icon: Award, roles: ["super_admin", "branch_manager", "academic", "finance", "teacher"] },
  { to: "/lms", label: "nav.lms", icon: BookMarked, roles: ["super_admin", "academic", "teacher", "student"] },
  { to: "/instructor/question-bank", label: "nav.questionBank", icon: HelpCircle, roles: ["academic", "teacher"] },
  {
    to: "/hr",
    label: "nav.hr",
    icon: Briefcase,
    roles: [],
    children: [
      { to: "/hr", label: "nav.hr", icon: Briefcase, roles: ["super_admin", "hr"] },
      { to: "/hr/my", label: "nav.hrDashboard", icon: LayoutDashboard, roles: ESS_NAV_ROLES },
      { to: "/hr/my/profile", label: "nav.myProfile", icon: UserCog, roles: ESS_NAV_ROLES },
      { to: "/hr/my/payroll", label: "nav.myPayroll", icon: Wallet, roles: ESS_NAV_ROLES },
      { to: "/hr/my/documents", label: "nav.myDocuments", icon: BookOpen, roles: ESS_NAV_ROLES },
      { to: "/hr/my/groups", label: "nav.myGroups", icon: GraduationCap, roles: TEACHER_SELF_ROLES },
      { to: "/hr/my/students", label: "nav.myStudents", icon: BookOpenText, roles: TEACHER_SELF_ROLES },
      { to: "/hr/my/sessions", label: "nav.mySessions", icon: Clock, roles: TEACHER_SELF_ROLES },
      { to: "/hr/my/teaching-hours", label: "nav.myTeachingHours", icon: BarChart3, roles: ["teacher"] },
      { to: "/hr/my/lms", label: "nav.myLms", icon: BookMarked, roles: TEACHER_SELF_ROLES },
      { to: "/hr/my/evaluations", label: "nav.myEvaluations", icon: Award, roles: TEACHER_SELF_ROLES },
      { to: "/hr/my/leads", label: "nav.myLeads", icon: Users, roles: SALES_SELF_ROLES },
      { to: "/hr/my/sales-targets", label: "nav.mySalesTargets", icon: BarChart3, roles: SALES_SELF_ROLES },
      { to: "/hr/my/academic", label: "nav.myAcademic", icon: ShieldCheck, roles: ACADEMIC_SELF_ROLES },
    ],
  },
  { to: "/activities", label: "nav.activities", icon: Sparkles, roles: ["super_admin", "branch_manager", "academic", "teacher", "sales"] },
  { to: "/knowledge-base", label: "nav.knowledgeBase", icon: BookOpenText, roles: ["super_admin", "hr", "branch_manager", "teacher", "sales", "finance"] },
  { to: "/chat", label: "nav.chat", icon: MessagesSquare, roles: ["super_admin", "branch_manager", "academic", "teacher", "student", "moderator"] },
  { to: "/reports", label: "nav.reports", icon: BarChart3, roles: ["super_admin", "branch_manager", "sales", "academic", "finance", "hr", "teacher"] },
  { to: "/inventory", label: "nav.inventory", icon: Package, roles: ["super_admin", "branch_manager", "sales", "finance", "auditor"] },
  { to: "/notifications", label: "nav.notifications", icon: Bell, roles: [] },
  { to: "/users", label: "nav.users", icon: UserCog, roles: ["super_admin", "branch_manager", "hr"] },
  { to: "/roles", label: "nav.roles", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/audit", label: "nav.audit", icon: ScrollText, roles: ["super_admin", "auditor"] },
  { to: "/security", label: "nav.security", icon: ShieldHalf, roles: ["super_admin"] },
];

export function Sidebar({ open, onClose, isMobile, onLogout }: SidebarProps) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isSuper = roles.includes("super_admin");

  const [hrOpen, setHrOpen] = useState(() => location.pathname === "/hr" || location.pathname.startsWith("/hr/my"));

  useEffect(() => {
    if (location.pathname === "/hr" || location.pathname.startsWith("/hr/my")) {
      setHrOpen(true);
    }
  }, [location.pathname]);

  const isItemVisible = (item: NavItem): boolean => {
    if (item.roles.length === 0) return true;
    if (item.to.startsWith("/hr/my") && (roles.includes("super_admin") || roles.includes("hr"))) {
      return false;
    }
    return isSuper || item.roles.some((r) => roles.includes(r));
  };

  const visible = navItems.filter(isItemVisible);

  const resolveTarget = (to: string): string => {
    if (to !== "/hr") return to;
    if (roles.some((r) => ["super_admin", "hr", "branch_manager"].includes(r))) return "/hr";
    if (roles.includes("teacher")) return "/hr/my";
    if (roles.includes("academic")) return "/hr/my/academic";
    if (roles.includes("sales")) return "/hr/my/leads";
    if (roles.includes("finance")) return "/hr/payroll";
    return "/hr/my";
  };

  return (
    <aside
      className={cn(
        "group flex flex-col border-r bg-card transition-all duration-300 h-full shadow-sm",
        isMobile
          ? cn("fixed inset-y-0 left-0 z-50 w-64", open ? "translate-x-0" : "-translate-x-full")
          : cn("w-16 hover:w-64", !open && "w-0 overflow-hidden border-r-0")
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border/60", isMobile ? "justify-between px-4" : "justify-center px-2 group-hover:justify-between group-hover:px-4")}>
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.svg" alt="SpeakUp Academy" className="h-8 w-8 shrink-0 rounded-lg shadow-sm" />
          <div className="hidden min-w-0 leading-tight group-hover:block">
            <p className="truncate text-base font-bold text-primary">SpeakUp</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Academy</p>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visible.map((item) => {
          if (item.children && item.children.length > 0) {
            const children = item.children.filter(isItemVisible);
            if (children.length === 0) return null;
            const inHrSection = location.pathname === "/hr" || location.pathname.startsWith("/hr/my");
            const parentActive = inHrSection;
            return (
              <div key={item.to} className="mb-1">
                <button
                  onClick={() => {
                    setHrOpen((p) => !p);
                    if (isMobile) onClose();
                  }}
                  aria-expanded={hrOpen}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                    isMobile ? "px-3" : open ? "justify-start px-3" : "justify-center px-0",
                    parentActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn("truncate", !isMobile && "hidden group-hover:block")}>
                    {t(item.label)}
                  </span>
                  <ChevronDown
                    className={cn("h-5 w-5 shrink-0 transition-transform duration-200", hrOpen ? "rotate-180" : "")}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    hrOpen ? "max-h-[40rem] opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  <div className="space-y-0.5">
                    {children.map((child) => {
                      const childActive = location.pathname === child.to;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end
                          className={cn(
                            "flex items-center gap-2 rounded-lg py-1.5 text-sm text-muted-foreground transition-colors",
                            isMobile ? "px-3" : "pl-6 pr-2",
                            childActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                          <span className={cn("truncate", !isMobile && "hidden group-hover:block")}>
                            {t(child.label)}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          const Icon = item.icon;
          const target = resolveTarget(item.to);
          const isActive = location.pathname === target || location.pathname.startsWith(`${target}/`);
          return (
            <NavLink
              key={item.to}
              to={target}
              title={item.label.startsWith("nav.") ? t(item.label) : item.label}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                isMobile ? "px-3" : "justify-center px-0 group-hover:justify-start group-hover:px-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", !isMobile && "hidden group-hover:block")}>
                {item.label.startsWith("nav.") ? t(item.label) : item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-2">
        <button
          onClick={onLogout}
          title={t("auth.logout")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
            isMobile ? "px-3" : "justify-center px-0 group-hover:justify-start group-hover:px-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(!isMobile && "hidden group-hover:block")}>{t("auth.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
