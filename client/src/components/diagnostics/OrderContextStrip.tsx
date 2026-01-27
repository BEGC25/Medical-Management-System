import * as React from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Modality = "lab" | "xray" | "ultrasound";
type Priority = "routine" | "urgent" | "stat";
type PaymentStatus = "paid" | "unpaid";

interface OrderContextStripProps {
  modality: Modality;
  tests?: string[];
  examType?: string;
  bodyPart?: string;
  views?: string;
  scanRegion?: string;
  priority: Priority;
  paymentStatus: PaymentStatus;
  requestedDate?: string | Date;
  completedDate?: string | Date;
}

const modalityConfig = {
  lab: { icon: "🧪" },
  xray: { icon: "⚡" },
  ultrasound: { icon: "📡" },
};

const DETAIL_BADGE_CLASS =
  "bg-slate-50 text-slate-700 border-slate-200 text-xs font-medium px-2.5 py-0.5";

const priorityConfig = {
  routine: {
    className: "bg-slate-100 text-slate-700 border-slate-200",
    label: "Routine",
    icon: "○",
  },
  urgent: {
    className: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Urgent",
    icon: "⚠",
  },
  stat: {
    className: "bg-red-100 text-red-700 border-red-200",
    label: "STAT",
    icon: "🔥",
  },
};

const paymentConfig = {
  paid: {
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Paid",
    icon: "✓",
  },
  unpaid: {
    className: "bg-rose-100 text-rose-700 border-rose-200",
    label: "Unpaid",
    icon: "✗",
  },
};

function formatDate(date?: string | Date): string {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
  completedDate,
}: OrderContextStripProps) {
  const config = modalityConfig[modality];
  const priorityConf = priorityConfig[priority];
  const paymentConf = paymentConfig[paymentStatus];

  const detailBadges =
    modality === "lab"
      ? tests ?? []
      : dedupe(
          [examType, bodyPart, views, scanRegion].filter(
            (value): value is string => Boolean(value),
          ),
        );

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base">{config.icon}</span>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {detailBadges.map((label) => (
            <Badge key={label} variant="outline" className={DETAIL_BADGE_CLASS}>
              {label}
            </Badge>
          ))}
        </div>
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
      {(requestedDate || completedDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          {requestedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-600">Requested:</span>
              <span>{formatDate(requestedDate)}</span>
            </div>
          )}
          {completedDate && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-600">Completed:</span>
              <span>{formatDate(completedDate)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
