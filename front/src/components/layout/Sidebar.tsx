import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Clock,
  Building2,
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
}

const navItems: NavItem[] = [
  { to: "/", label: "nav.dashboard", icon: LayoutDashboard, roles: [] },
  { to: "/leads", label: "nav.leads", icon: Users, roles: ["super_admin", "branch_manager", "sales"] },
  { to: "/students", label: "nav.students", icon: GraduationCap, roles: ["super_admin", "branch_manager", "sales", "finance", "academic", "teacher"] },
  { to: "/courses", label: "nav.courses", icon: BookOpen, roles: [] },
  { to: "/groups", label: "nav.groups", icon: CalendarDays, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/sessions", label: "nav.sessions", icon: Clock, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/attendance", label: "nav.attendance", icon: ClipboardCheck, roles: ["super_admin", "academic", "branch_manager", "teacher"] },
  { to: "/placement-tests", label: "nav.placementTests", icon: BookMarked, roles: ["super_admin", "branch_manager", "sales", "academic"] },
  { to: "/waitlists", label: "nav.waitlists", icon: Hourglass, roles: ["super_admin", "branch_manager", "sales", "academic"] },
  { to: "/enrollments", label: "nav.enrollments", icon: ScrollText, roles: ["super_admin", "branch_manager", "sales", "finance", "academic"] },
  { to: "/finance", label: "nav.finance", icon: Wallet, roles: ["super_admin", "finance", "branch_manager"] },
  { to: "/certificates", label: "nav.certificates", icon: Award, roles: ["super_admin", "branch_manager", "academic", "finance", "teacher"] },
  { to: "/lms", label: "nav.lms", icon: BookMarked, roles: ["super_admin", "academic", "teacher", "student"] },
  { to: "/hr", label: "nav.hr", icon: Briefcase, roles: ["super_admin", "hr", "branch_manager"] },
  { to: "/activities", label: "nav.activities", icon: Sparkles, roles: ["super_admin", "branch_manager", "teacher", "student"] },
  { to: "/knowledge-base", label: "nav.knowledgeBase", icon: BookOpenText, roles: ["super_admin", "hr", "branch_manager", "teacher", "sales", "finance"] },
  { to: "/chat", label: "nav.chat", icon: MessagesSquare, roles: [] },
  { to: "/reports", label: "nav.reports", icon: BarChart3, roles: ["super_admin", "branch_manager", "sales", "academic", "finance", "hr", "teacher"] },
  { to: "/inventory", label: "nav.inventory", icon: Package, roles: ["super_admin", "branch_manager", "sales", "finance"] },
  { to: "/notifications", label: "nav.notifications", icon: Bell, roles: [] },
  { to: "/branches", label: "nav.branches", icon: Building2, roles: ["super_admin", "branch_manager"] },
  { to: "/users", label: "nav.users", icon: UserCog, roles: ["super_admin", "branch_manager", "hr"] },
  { to: "/roles", label: "nav.roles", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/audit", label: "nav.audit", icon: ScrollText, roles: ["super_admin"] },
  { to: "/security", label: "nav.security", icon: ShieldHalf, roles: [] },
];

export function Sidebar({ open, onClose, isMobile, onLogout }: SidebarProps) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isSuper = roles.includes("super_admin");
  const visible = navItems.filter(
    (i) => i.roles.length === 0 || isSuper || i.roles.some((r) => roles.includes(r)),
  );

  return (
    <aside
      className={cn(
        "group flex flex-col border-r bg-card transition-all duration-300 h-full",
        isMobile
          ? cn("fixed inset-y-0 left-0 z-50 w-64", open ? "translate-x-0" : "-translate-x-full")
          : cn("w-16 hover:w-64", !open && "w-0 overflow-hidden border-r-0")
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center border-b", isMobile ? "justify-between px-4" : "justify-center px-2 group-hover:justify-between group-hover:px-4")}>
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.svg" alt="SpeakUp Academy" className="h-8 w-8 shrink-0 rounded-lg" />
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

      {/* Rail nav: icons always, labels on hover (desktop) */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={t(item.label)}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                isMobile ? "px-3" : "justify-center px-0 group-hover:justify-start group-hover:px-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", !isMobile && "hidden group-hover:block")}>{t(item.label)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-2">
        <button
          onClick={onLogout}
          title={t("auth.logout")}
          className={cn(
            "flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
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
