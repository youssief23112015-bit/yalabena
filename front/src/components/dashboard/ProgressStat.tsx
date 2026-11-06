import { cn } from "@/lib/utils";

export interface ProgressStatProps {
  label: string;
  value: number | null | undefined;
  total?: number | null;
  className?: string;
}

export function ProgressStat({ label, value, total = 100, className }: ProgressStatProps) {
  if (total == null || total === 0) {
    return (
      <div className={cn("rounded-lg bg-muted/30 p-3 text-center", className)}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">0%</p>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, Math.round((Number(value ?? 0) / Number(total)) * 100)));
  return (
    <div className={cn("rounded-lg bg-muted/30 p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold">{pct}%</span>
      </div>
    </div>
  );
}