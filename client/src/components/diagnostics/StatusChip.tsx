import * as React from "react";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "paid" | "unpaid" | "completed" | "pending" | "routine" | "stat" | "urgent" | "normal" | "abnormal";

interface StatusChipProps {
  variant: StatusVariant;
  children?: React.ReactNode;
}

const variantConfig = {
  paid: {
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
    defaultLabel: "Paid"
  },
  unpaid: {
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
    defaultLabel: "Unpaid"
  },
  completed: {
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
    defaultLabel: "Completed"
  },
  pending: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    defaultLabel: "Pending"
  },
  routine: {
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    defaultLabel: "Routine"
  },
  stat: {
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
    defaultLabel: "STAT"
  },
  urgent: {
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    defaultLabel: "Urgent"
  },
  normal: {
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
    defaultLabel: "Normal"
  },
  abnormal: {
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
    defaultLabel: "Abnormal"
  }
};

export function StatusChip({ variant, children }: StatusChipProps) {
  const config = variantConfig[variant];
  
  return (
    <Badge variant="outline" className={`${config.className} text-xs font-semibold px-2 py-0.5`}>
      {children || config.defaultLabel}
    </Badge>
  );
}
