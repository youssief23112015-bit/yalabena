import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  change_pct: number | null | undefined;
  className?: string;
}

export function TrendBadge({ change_pct, className }: TrendBadgeProps) {
  const value = change_pct ?? 0;
  const isUp = value > 0;
  const isDown = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold border",
        isUp
          ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
          : isDown
          ? "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400"
          : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-400",
        className,
      )}
    >
      {isUp ? (
        <>
          <span className="mr-1">▲</span>
          {value.toFixed(0)}%
        </>
      ) : isDown ? (
        <>
          <span className="mr-1">▼</span>
          {Math.abs(value).toFixed(0)}%
        </>
      ) : (
        "—"
      )}
    </span>
  );
}