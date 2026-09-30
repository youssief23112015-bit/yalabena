import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatToastProvider } from "@/hooks/useChatToast";
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

  const navLinks = [
    { to: "/", label: t("public.nav.home", "Home") },
    { to: "/courses", label: t("public.nav.courses", "Courses") },
    { to: "/placement-booking", label: t("public.nav.placement", "Placement Test") },
    { to: "/verify-certificate", label: t("public.nav.verify", "Verify Certificate") },
  ];

  return (
    <ChatToastProvider>
      <div className={cn("min-h-screen bg-background", isRtl && "font-[system-ui]")}>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
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

              <Button asChild className="hidden md:inline-flex">
                <Link to="/register-online">{t("public.nav.register", "Register Now")}</Link>
              </Button>

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
                <Button asChild className="mt-2">
                  <Link to="/register-online" onClick={() => setMobileOpen(false)}>
                    {t("public.nav.register", "Register Now")}
                  </Link>
                </Button>
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