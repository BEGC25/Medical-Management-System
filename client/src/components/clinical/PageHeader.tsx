import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 border-b",
        "border-[hsl(var(--border-light))]",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-[hsl(var(--text-secondary))]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {metadata && (
        <div className="flex items-center gap-4 text-sm text-[hsl(var(--text-muted))]">
          {metadata}
        </div>
      )}
    </div>
  );
}
