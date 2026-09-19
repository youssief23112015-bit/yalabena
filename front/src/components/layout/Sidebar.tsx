import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}

const navItems = [
  { to: "/", label: "nav.dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "nav.leads", icon: Users },
  { to: "/students", label: "nav.students", icon: GraduationCap },
  { to: "/courses", label: "nav.courses", icon: BookOpen },
  { to: "/groups", label: "nav.groups", icon: CalendarDays },
  { to: "/sessions", label: "nav.sessions", icon: Clock },
  { to: "/branches", label: "nav.branches", icon: Building2 },
  { to: "/users", label: "nav.users", icon: UserCog },
  { to: "/roles", label: "nav.roles", icon: ShieldCheck },
];

export function Sidebar({ open, onClose, isMobile, onLogout }: SidebarProps) {
  const { t } = useTranslation("common");
  const location = useLocation();

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
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
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
