import { cn, toSafeArray } from "@/lib/utils";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface AreaChartCardProps {
  title: string;
  points: TimeSeriesPoint[];
  value?: number | null;
  previousValue?: number | null;
  unit?: string;
  className?: string;
}

export function AreaChartCard({
  title,
  points,
  value,
  unit = "",
  className,
}: AreaChartCardProps) {
  const data = toSafeArray<{ date: string; value: number }>(points);
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 600;
  const height = 160;
  const pad = 32;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const chartPoints = data
    .map((d, i) => ({
      x: pad + (data.length > 1 ? ((i / (data.length - 1)) * chartW) : chartW / 2),
      y: chartH - (d.value / max) * chartH,
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

  const linePath = chartPoints.length > 1
    ? chartPoints.map((p, i) => (i === 0 ? `M${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join(" ")
    : "";

  const areaPath = linePath + ` L${chartPoints[chartPoints.length - 1]?.x.toFixed(1) ?? 0} ${chartH} L${chartPoints[0]?.x.toFixed(1) ?? 0} ${chartH} Z`;

  const labels = data.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const xLabels = labels.filter((_, i) => i % Math.max(1, Math.floor(labels.length / 6)) === 0);

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
      {data.length === 0 && (
        <div className="h-40 rounded bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
          No data for this period
        </div>
      )}
      {data.length > 0 && (
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59 130 246 / 0.45)" />
                <stop offset="100%" stopColor="rgb(59 130 246 / 0.05)" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" />
            {linePath && <path d={linePath} fill="none" stroke="rgb(59 130 246 / 0.85)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
            {chartPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(59 130 246 / 0.95)" stroke="white" strokeWidth="1.5" />
            ))}
          </svg>
          <div className="flex justify-between px-2 mt-1 text-[10px] text-muted-foreground">
            {xLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}