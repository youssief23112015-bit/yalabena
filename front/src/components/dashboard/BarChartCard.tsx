import { cn } from "@/lib/utils";

export interface BarDataPoint {
  label: string;
  value: number;
  previous?: number;
}

export interface BarChartCardProps {
  title: string;
  series: BarDataPoint[];
  value?: number | null;
  unit?: string;
  showPrevious?: boolean;
  className?: string;
}

function toFloat(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function BarChartCard({ title, series, value, unit = "", showPrevious = true, className }: BarChartCardProps) {
  const max = Math.max(1, ...series.map((s) => Math.max(toFloat(s.value), toFloat(s.previous) ?? 0)));

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {value != null && (
          <span className="text-sm font-semibold">
            {value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-end gap-3 h-48">
        {series.map((s) => {
          const prev = s.previous != null ? toFloat(s.previous) : undefined;
          const h = Math.max(2, (toFloat(s.value) / max) * 100);
          const hPrev = (prev ?? 0) > 0 ? ((prev ?? 0) / max) * 100 : 0;
          const isUp = prev != null && prev > 0 && toFloat(s.value) > prev;
          const isDown = prev != null && prev > 0 && toFloat(s.value) < prev;
          const hue = isUp ? 142 : isDown ? 0 : 210;
          return (
            <div key={s.label} className="flex-1 flex flex-col items-center gap-1 justify-end h-full py-2">
              <div className="flex items-end justify-center w-full h-32">
                {showPrevious && hPrev > 0 && (
                  <div
                    className="w-3/5 rounded-t-md bg-muted"
                    style={{ height: `${hPrev}%` }}
                  />
                )}
                <div
                  className="w-3/5 rounded-t-md transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: `hsl(${hue} 60% 55%)`,
                    opacity: isUp || isDown ? 0.85 : 0.7,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground truncate">{s.label}</span>
            </div>
          );
        })}
      </div>
      {series.length === 0 && <p className="text-xs text-muted-foreground">No data for this period.</p>}
    </div>
  );
}