import * as React from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Modality = "lab" | "xray" | "ultrasound";
type Priority = "routine" | "urgent" | "stat";
type PaymentStatus = "paid" | "unpaid";

interface PremiumContextStripProps {
  modality: Modality;
  // Lab-specific
  tests?: string[];
  // X-Ray/Ultrasound-specific
  examType?: string;
  bodyPart?: string;
  views?: string;
  scanRegion?: string;
  // Common
  priority: Priority;
  paymentStatus: PaymentStatus;
  requestedDate?: string | Date;
}

const modalityConfig = {
  lab: {
    gradient: "from-blue-500/10 via-indigo-500/5 to-blue-500/10 dark:from-blue-500/20 dark:via-indigo-500/10 dark:to-blue-500/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    icon: "🧪",
  },
  xray: {
    gradient: "from-cyan-500/10 via-blue-500/5 to-cyan-500/10 dark:from-cyan-500/20 dark:via-blue-500/10 dark:to-cyan-500/20",
    borderColor: "border-cyan-200 dark:border-cyan-700",
    icon: "⚡",
  },
  ultrasound: {
    gradient: "from-violet-500/10 via-purple-500/5 to-violet-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-violet-500/20",
    borderColor: "border-violet-200 dark:border-violet-700",
    icon: "📡",
  }
};

const BADGE_BASE_CLASS = "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs font-medium px-2.5 py-0.5";

const priorityConfig = {
  routine: {
    className: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    label: "Routine",
    icon: "○"
  },
  urgent: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    label: "Urgent",
    icon: "⚠"
  },
  stat: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
    label: "STAT",
    icon: "🔥"
  }
};

const paymentConfig = {
  paid: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    label: "Paid",
    icon: "✓"
  },
  unpaid: {
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-300 dark:border-rose-700",
    label: "Unpaid",
    icon: "✗"
  }
};

function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PremiumContextStrip({
  modality,
  tests,
  examType,
  bodyPart,
  views,
  scanRegion,
  priority,
  paymentStatus,
  requestedDate
}: PremiumContextStripProps) {
  const config = modalityConfig[modality];
  const priorityConf = priorityConfig[priority];
  const paymentConf = paymentConfig[paymentStatus];

  return (
    <div className={`relative overflow-hidden rounded-xl border ${config.borderColor} bg-gradient-to-r ${config.gradient} p-4 shadow-sm mb-6`}>
      <div className="flex flex-col gap-3">
        {/* Top Row: Tests/Exam Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{config.icon}</span>
          
          {modality === "lab" && tests && tests.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {tests.map((test) => (
                <Badge
                  key={test}
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {test}
                </Badge>
              ))}
            </div>
          )}
          
          {modality === "xray" && (
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {examType && (
                <Badge
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {examType}
                </Badge>
              )}
              {bodyPart && (
                <Badge
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {bodyPart}
                </Badge>
              )}
              {views && (
                <Badge
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {views}
                </Badge>
              )}
            </div>
          )}
          
          {modality === "ultrasound" && (
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {examType && (
                <Badge
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {examType}
                </Badge>
              )}
              {scanRegion && (
                <Badge
                  variant="outline"
                  className={BADGE_BASE_CLASS}
                >
                  {scanRegion}
                </Badge>
              )}
            </div>
          )}
          
          {/* Right Side: Priority and Payment */}
          <div className="flex items-center gap-2 ml-auto">
            <Badge
              variant="outline"
              className={`${priorityConf.className} text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1`}
            >
              <span>{priorityConf.icon}</span>
              {priorityConf.label}
            </Badge>
            <Badge
              variant="outline"
              className={`${paymentConf.className} text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1`}
            >
              <span>{paymentConf.icon}</span>
              {paymentConf.label}
            </Badge>
          </div>
        </div>
        
        {/* Bottom Row: Requested Date */}
        {requestedDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Requested:</span>
            <span>{formatDate(requestedDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
