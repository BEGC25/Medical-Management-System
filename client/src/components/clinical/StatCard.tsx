import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-[hsl(var(--clinical-teal-100))]",
    iconColor: "text-[hsl(var(--clinical-teal-600))]",
  },
  success: {
    iconBg: "bg-[hsl(var(--status-success-bg))]",
    iconColor: "text-[hsl(var(--status-success))]",
  },
  warning: {
    iconBg: "bg-[hsl(var(--status-warning-bg))]",
    iconColor: "text-[hsl(var(--status-warning))]",
  },
  error: {
    iconBg: "bg-[hsl(var(--status-error-bg))]",
    iconColor: "text-[hsl(var(--status-error))]",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-[hsl(var(--surface-white))] rounded-xl p-6",
        "border border-[hsl(var(--border-light))]",
        "shadow-[var(--shadow-card)]",
        "hover:shadow-[var(--shadow-card-hover)]",
        "transition-shadow duration-[var(--transition-base)]",
        "h-full flex flex-col",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-lg",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive
                ? "text-[hsl(var(--status-success))] bg-[hsl(var(--status-success-bg))]"
                : "text-[hsl(var(--status-error))] bg-[hsl(var(--status-error-bg))]"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-sm font-medium text-[hsl(var(--text-secondary))] mb-1">
          {title}
        </p>
        <p className="text-2xl font-semibold text-[hsl(var(--text-primary))] tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
