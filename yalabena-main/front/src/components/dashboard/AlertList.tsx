import React from "react";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  title: string;
  description?: string;
  severity: "info" | "warning" | "critical";
  link?: string;
}

interface AlertListProps {
  alerts: AlertItem[];
  className?: string;
}

const SEVERITY_STYLES: Record<AlertItem["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300",
  critical: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300",
};

export function AlertList({ alerts, className }: AlertListProps) {
  const ordered = [...alerts].sort((a, b) => {
    const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
  });

  if (ordered.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {ordered.map((alert) => (
        <a
          key={alert.id}
          href={alert.link}
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
            SEVERITY_STYLES[alert.severity],
            alert.link && "cursor-pointer hover:bg-muted/50 transition-colors",
          )}
        >
          <span className="mr-2 shrink-0">{alert.severity === "critical" ? "🔴" : alert.severity === "warning" ? "🟠" : "🔵"}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight">{alert.title}</p>
            {alert.description && (
              <p className="text-xs opacity-80 line-clamp-1">{alert.description}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}