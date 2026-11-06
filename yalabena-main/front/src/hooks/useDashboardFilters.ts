import { useSearchParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";

export type DashboardPeriod =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export interface DashboardFilters {
  period: DashboardPeriod;
  from?: string;
  to?: string;
  branch_id?: string;
}

export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const period = (searchParams.get("period") as DashboardPeriod) ?? "30d";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const branch_id = searchParams.get("branch_id") || undefined;

  const setFilters = useCallback(
    (next: Partial<DashboardFilters>) => {
      const params = new URLSearchParams(searchParams);
      if (next.period != null) params.set("period", next.period);
      else params.delete("period");
      if (next.from != null) params.set("from", next.from);
      else params.delete("from");
      if (next.to != null) params.set("to", next.to);
      else params.delete("to");
      if (next.branch_id != null) params.set("branch_id", next.branch_id);
      else params.delete("branch_id");
      navigate(`?${params.toString()}`, { replace: true });
    },
    [navigate, searchParams],
  );

  return { period, from, to, branch_id, setFilters };
}