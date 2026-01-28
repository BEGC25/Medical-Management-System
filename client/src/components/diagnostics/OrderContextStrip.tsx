import * as React from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatClinicDay } from "@/lib/date-utils";

type Modality = "lab" | "xray" | "ultrasound";
type Priority = "routine" | "urgent" | "stat";
type PaymentStatus = "paid" | "unpaid";

interface OrderContextStripProps {
  modality: Modality;
  // Lab-specific
  tests?: string[];
  // X-Ray/Ultrasound-specific
  examType?: string | null;
  bodyPart?: string | null;
  views?: string | null;
  scanRegion?: string | null;
  // Common
  priority: Priority;
  paymentStatus: PaymentStatus;
  requestedDate?: string | Date | null;
  completedDate?: string | Date | null;
}

const priorityConfig = {
  routine: {
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
    label: "Routine"
  },
  urgent: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-600",
    label: "Urgent"
  },
  stat: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-600",
    label: "STAT"
  }
};

const paymentConfig = {
  paid: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600",
    label: "Paid"
  },
  unpaid: {
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-600",
    label: "Unpaid"
  }
};

function formatDate(date?: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return formatClinicDay(d.toISOString(), 'MMM d, yyyy');
}

/**
 * OrderContextStrip - A unified component that shows order context (tests/exams, priority, payment, dates)
 * without duplicating patient information. Used in BOTH pending and completed modes.
 * 
 * Key differences from PremiumContextStrip:
 * - Supports completedDate for completed mode
 * - Cleaner white surface with subtle border (no saturated gradients)
 * - Same component works across Lab/X-ray/Ultrasound
 */
export function OrderContextStrip({
  modality,
  tests,
  examType,
  bodyPart,
  views,
  scanRegion,
  priority,
  paymentStatus,
  requestedDate,
  completedDate
}: OrderContextStripProps) {
  const priorityConf = priorityConfig[priority];
  const paymentConf = paymentConfig[paymentStatus];

  // Build exam description based on modality
  const getExamDescription = (): string[] | null => {
    if (modality === "lab" && tests && tests.length > 0) {
      return tests;
    }
    if (modality === "xray") {
      const parts = [examType, bodyPart, views].filter((x): x is string => Boolean(x));
      return parts.length > 0 ? parts : null;
    }
    if (modality === "ultrasound") {
      const parts = [examType, scanRegion].filter((x): x is string => Boolean(x));
      return parts.length > 0 ? parts : null;
    }
    return null;
  };

  const examItems = getExamDescription();

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Exam/Tests Info */}
        {examItems && examItems.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {examItems.map((item, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs font-medium px-2 py-0.5"
              >
                {item}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Separator */}
        {examItems && examItems.length > 0 && (
          <span className="text-gray-300 dark:text-gray-600">|</span>
        )}
        
        {/* Priority Badge */}
        <Badge
          variant="outline"
          className={`${priorityConf.className} text-xs font-semibold px-2 py-0.5`}
        >
          {priorityConf.label}
        </Badge>
        
        {/* Payment Badge */}
        <Badge
          variant="outline"
          className={`${paymentConf.className} text-xs font-semibold px-2 py-0.5`}
        >
          {paymentConf.label}
        </Badge>
        
        {/* Separator before dates */}
        {(requestedDate || completedDate) && (
          <span className="text-gray-300 dark:text-gray-600">|</span>
        )}
        
        {/* Dates Section */}
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          {requestedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Requested: {formatDate(requestedDate)}</span>
            </div>
          )}
          {completedDate && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed: {formatDate(completedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
