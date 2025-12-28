import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="p-4 rounded-full bg-[hsl(var(--surface-100))] mb-4">
        <Icon className="w-8 h-8 text-[hsl(var(--text-muted))]" />
      </div>
      <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[hsl(var(--text-secondary))] max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
