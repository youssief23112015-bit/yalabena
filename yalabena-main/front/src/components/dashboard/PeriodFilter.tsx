import React from "react";
import { useTranslation } from "react-i18next";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PERIODS: { value: import("@/hooks/useDashboardFilters").DashboardPeriod; labelKey: string }[] = [
  { value: "today", labelKey: "today" },
  { value: "7d", labelKey: "last7d" },
  { value: "30d", labelKey: "last30d" },
  { value: "month", labelKey: "thisMonth" },
  { value: "quarter", labelKey: "thisQuarter" },
  { value: "year", labelKey: "thisYear" },
  { value: "custom", labelKey: "custom" },
];

export function PeriodFilter() {
  const { t } = useTranslation("dashboard");
  const { period, setFilters } = useDashboardFilters();

  return (
    <Select onValueChange={(v) => setFilters({ period: v as any })}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder={t("period")} />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {t(`period.${p.labelKey}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}