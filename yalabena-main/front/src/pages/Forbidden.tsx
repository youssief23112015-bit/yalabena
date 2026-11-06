import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ShieldAlert } from "lucide-react";

/**
 * 403 fallback shown when a user manually types a URL their role cannot
 * access (e.g. a student opening /inventory). Reached through RequireRoles /
 * ProtectedRoute redirects — never rendered directly by a route guard bypass.
 */
export default function ForbiddenPage() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md shadow-sm border-border/60">
        <CardHeader className="items-center text-center">
          <div className="mb-2 rounded-full bg-destructive/10 p-3">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold">{t("forbidden.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{t("forbidden.message")}</p>
          <Button asChild className="w-full">
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t("forbidden.backToDashboard")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
