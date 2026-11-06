import React from "react";
import { cn } from "@/lib/utils";

export interface TopRow {
  label: string;
  value: number | string;
  detail?: string;
}

export interface TopListProps {
  title: string;
  rows: TopRow[];
  emptyMessage?: string;
  renderDetail?: (row: TopRow) => React.ReactNode;
  itemClass?: string;
  className?: string;
}

export function TopList({ title, rows, emptyMessage = "No data", renderDetail, itemClass, className }: TopListProps) {
  if (rows.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/30 transition-colors", itemClass)}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.label}</p>
              {row.detail ? <p className="truncate text-xs text-muted-foreground">{row.detail}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">{row.value}</p>
              {renderDetail ? <p className="text-xs text-muted-foreground">{renderDetail(row)}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}