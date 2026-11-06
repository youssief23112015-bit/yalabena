import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { reloadServices } from "@/utils/dashboardCache";
import { RefreshCw } from "lucide-react";

export function LastUpdated() {
  const { t } = useTranslation("dashboard");
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await reloadServices();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 print:hidden">
      <span className="text-xs text-muted-foreground">{t("lastUpdated")}</span>
      <button
        onClick={refresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80 disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        {t("refresh")}
      </button>
    </div>
  );
}