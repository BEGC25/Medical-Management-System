import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[hsl(var(--surface-200))]",
        variant === "text" && "h-4 rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[hsl(var(--surface-white))] rounded-xl border border-[hsl(var(--border-light))] p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-12 w-12" variant="circular" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-8 w-32" variant="text" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-[hsl(var(--surface-white))] rounded-lg border border-[hsl(var(--border-light))]"
        >
          <Skeleton className="h-10 w-10" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
