import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Generic fallback dashboard for custom/unknown roles.
 * Shows only non-sensitive content: greeting, notifications, upcoming sessions.
 */
export default function GenericDashboard() {
  const { t } = useTranslation("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("greeting", { name: "User" })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.groups")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          {t("noData")}
        </CardContent>
      </Card>
    </div>
  );
}