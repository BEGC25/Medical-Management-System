import * as React from "react";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "paid" | "unpaid" | "completed" | "pending" | "routine" | "stat" | "urgent";

interface PremiumPatientBannerProps {
  patientName: string;
  patientId: string;
  age?: number | string;
  gender?: string;
  orderId?: string;
  statuses: Array<{
    variant: StatusVariant;
    label?: string;
  }>;
}

const statusConfig = {
  paid: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    defaultLabel: "Paid",
    dot: "bg-emerald-500"
  },
  unpaid: {
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-300 dark:border-rose-700",
    defaultLabel: "Unpaid",
    dot: "bg-rose-500"
  },
  completed: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    defaultLabel: "Completed",
    dot: "bg-emerald-500"
  },
  pending: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    defaultLabel: "Pending",
    dot: "bg-amber-500"
  },
  routine: {
    className: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    defaultLabel: "Routine",
    dot: "bg-slate-500"
  },
  stat: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
    defaultLabel: "STAT",
    dot: "bg-red-500 animate-pulse"
  },
  urgent: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    defaultLabel: "Urgent",
    dot: "bg-amber-500"
  }
};

export function PremiumPatientBanner({
  patientName,
  patientId,
  age,
  gender,
  orderId,
  statuses
}: PremiumPatientBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-5 shadow-sm">
      {/* Subtle decorative gradient element */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -z-0"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Patient Info Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            
            {/* Patient Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {patientName}
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                  ID: {patientId}
                </span>
                {age && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {age} {age === 1 || age === "1" ? "year" : "years"}
                  </span>
                )}
                {gender && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • {gender}
                  </span>
                )}
                {orderId && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    Order #{orderId}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Pills Section */}
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((status, idx) => {
              const config = statusConfig[status.variant];
              return (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`${config.className} text-xs font-semibold px-3 py-1 flex items-center gap-1.5`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                  {status.label || config.defaultLabel}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
