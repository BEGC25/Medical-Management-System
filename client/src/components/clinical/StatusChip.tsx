import * as React from "react";
import { cn } from "@/lib/utils";

type StatusVariant = "paid" | "unpaid" | "pending" | "completed" | "cancelled";

interface StatusChipProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className:
      "bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))] border-[hsl(var(--status-success-border))]",
  },
  unpaid: {
    label: "Unpaid",
    className:
      "bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error))] border-[hsl(var(--status-error-border))]",
  },
  pending: {
    label: "Pending",
    className:
      "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning-border))]",
  },
  completed: {
    label: "Completed",
    className:
      "bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))] border-[hsl(var(--status-success-border))]",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-[hsl(var(--surface-100))] text-[hsl(var(--text-muted))] border-[hsl(var(--border-default))]",
  },
};

export function StatusChip({ status, label, className }: StatusChipProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-xs font-medium border",
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  );
}
