import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Menu, Globe, LogOut } from "lucide-react";

interface TopbarProps {
  onMenuToggle: () => void;
  onLogout: () => void;
}

export function Topbar({ onMenuToggle, onLogout }: TopbarProps) {
  const { t, i18n } = useTranslation("common");
  const user = useAuthStore((s) => s.user);

  const toggleLang = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <img src="/logo.svg" alt="SpeakUp" className="h-7 w-7 rounded-md lg:hidden" />
        <h1 className="text-lg font-semibold">{t("app.tagline")}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-2">
          <Globe className="h-4 w-4" />
          {i18n.language === "ar" ? "English" : "العربية"}
        </Button>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()}
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title={t("auth.logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
