import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartCardProps {
  title: string;
  segments: DonutSegment[];
  value?: number | null;
  unit?: string;
  className?: string;
}

function toFloat(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function DonutChartCard({ title, segments, value, unit = "", className }: DonutChartCardProps) {
  const total = segments.reduce((sum, s) => sum + toFloat(s.value), 0);
  const colors = [
    "rgb(59 130 246 / 0.85)",
    "rgb(16 185 129 / 0.85)",
    "rgb(245 158 11 / 0.85)",
    "rgb(239 68 68 / 0.85)",
    "rgb(147 51 234 / 0.85)",
    "rgb(236 72 153 / 0.85)",
  ];

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
      {total === 0 && (
        <div className="h-40 rounded bg-muted/40 flex flex-col items-center justify-center text-xs text-muted-foreground">
          No data
        </div>
      )}
      {total > 0 && (
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {segments.map((seg, i) => {
                const segValue = toFloat(seg.value);
                const ratio = total > 0 ? segValue / total : 0;
                const startAngle = (i / segments.length) * 360;
                const endAngle = startAngle + (ratio * 360);
                const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                return (
                  <path
                    key={i}
                    d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A 40 40 0 ${ratio > 0.5 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth="16"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {value != null ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : 0}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-xs text-muted-foreground">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}