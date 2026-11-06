import React from "react";
import { cn } from "@/lib/utils";
import { TrendBadge } from "./TrendBadge";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  trend?: number | null;
  trendLabel?: string;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  sparkline,
  href,
  className,
}: StatCardProps) {
  return (
    <a
      href={href}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all",
        href && "cursor-pointer",
        className,
      )}
    >
      {icon && <div className="flex items-center gap-2 mb-3">{icon}</div>}
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-end gap-1.5 mt-2">
        {trend != null && <TrendBadge change_pct={trend} />}
        {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
      </div>
      {sparkline && <div className="mt-3 h-4">{sparkline}</div>}
    </a>
  );
}