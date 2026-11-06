import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionCardProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  actions?: React.ReactNode;
}

interface SectionCardSkeletonProps {
  title?: string;
  lines?: number;
  className?: string;
}

export function SectionCardSkeleton({ title, lines = 3, className }: SectionCardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4">
        <h3 className="h-8 w-32 rounded bg-muted animate-pulse" />
        <h3 className="h-4 w-full/3 rounded bg-muted animate-pulse mt-2" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full rounded bg-muted animate-pulse mb-2" />
      ))}
    </div>
  );
}

interface SectionCardErrorProps {
  title?: string;
  onRetry: () => void;
  message?: string;
  className?: string;
}

export function SectionCardError({ title, onRetry, message, className }: SectionCardErrorProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col items-center gap-3 text-center", className)}>
      <h3 className="text-sm font-medium">{title ?? "Could not load this section."}</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
        Retry
      </button>
    </div>
  );
}

export function SectionCard({
  title,
  children,
  className,
  headerClassName,
  actions,
}: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4", headerClassName)}>
        <h3 className="text-sm font-semibold">{title}</h3>
        {actions}
      </div>
      <div>{children}</div>
    </section>
  );
}