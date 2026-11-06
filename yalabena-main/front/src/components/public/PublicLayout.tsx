import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatToastProvider } from "@/hooks/useChatToast";
import { useAuthStore } from "@/store/authStore";
interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  const toggleLang = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("i18nextLng", next);
  };

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // Authenticated visitors are never bounced back to the guest landing page:
  // Home (and the brand logo) resolve straight to their role-aware dashboard.
  const homePath = isAuthenticated ? "/dashboard" : "/";

  const navLinks = [
    { to: homePath, label: t("public.nav.home", "Home") },
    { to: "/catalog", label: t("public.nav.courses", "Courses") },
    { to: "/blog", label: t("public.nav.blog", "Blog") },
    { to: "/placement-booking", label: t("public.nav.placement", "Placement Test") },
    { to: "/verify-certificate", label: t("public.nav.verify", "Verify Certificate") },
  ];

  const userInitials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <ChatToastProvider>
      <div className={cn("min-h-screen bg-background", isRtl && "font-[system-ui]")}>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to={homePath} className="flex items-center gap-2">
              <img src="/logo.svg" alt="Speak Up" className="h-8 w-8" />
              <span className="text-xl font-bold text-primary">
                {t("public.brand", "Speak Up Academy")}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleLang} aria-label="Toggle language">
                <Globe className="h-4 w-4" />
                <span className="ml-1 text-xs font-bold uppercase">{isRtl ? "EN" : "ع"}</span>
              </Button>

              {isAuthenticated ? (
                <>
                  <Button asChild className="hidden md:inline-flex">
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t("public.nav.dashboard", "Dashboard")}
                    </Link>
                  </Button>
                  {user && (
                    <Link
                      to="/dashboard"
                      title={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()}
                      className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground md:flex"
                    >
                      {userInitials}
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:inline-flex"
                    onClick={handleLogout}
                    title={t("auth.logout")}
                    aria-label={t("auth.logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button asChild className="hidden md:inline-flex">
                  <Link to="/register">{t("public.nav.register", "Register Now")}</Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="border-t md:hidden">
              <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Button asChild className="mt-2">
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t("public.nav.dashboard", "Dashboard")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("auth.logout")}
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-2">
                    <Link to="/register-online" onClick={() => setMobileOpen(false)}>
                      {t("public.nav.register", "Register Now")}
                    </Link>
                  </Button>
                )}
              </nav>
            </div>
          )}
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t bg-muted/40">
          <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="" className="h-6 w-6" />
                <span className="font-bold">{t("public.brand", "Speak Up Academy")}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("public.footer.tagline", "Master English with confidence.")}
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("public.footer.quickLinks", "Quick Links")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {navLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-primary">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("public.footer.contact", "Contact")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t("public.footer.phone", "+20 100 000 0000")}</li>
                <li>{t("public.footer.email", "info@speakup.academy")}</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("public.footer.follow", "Follow Us")}</h4>
              <div className="flex gap-3">
                {["facebook", "instagram", "youtube"].map((s) => (
                  <a
                    key={s}
                    href={`https://${s}.com/speakupacademy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <span className="sr-only">{s}</span>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                      {s[0]}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t py-4">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {t("public.brand", "Speak Up Academy")}. {t("public.footer.rights", "All rights reserved.")}
            </p>
          </div>
        </footer>
      </div>
    </ChatToastProvider>
  );
}