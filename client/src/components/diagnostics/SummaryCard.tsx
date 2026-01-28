import * as React from "react";
import { Calendar, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatClinicDay } from "@/lib/date-utils";

type Modality = "lab" | "xray" | "ultrasound";
type Priority = "routine" | "urgent" | "stat";
type PaymentStatus = "paid" | "unpaid";

interface SummaryCardProps {
  modality: Modality;
  // Patient Information (left column)
  patient: {
    name: string;
    patientId: string;
    age?: string | number | null;
    gender?: string | null;
    phone?: string | null;
  };
  // Test/Order Details (right column)
  orderId: string;
  priority: Priority;
  paymentStatus: PaymentStatus;
  requestedDate?: string | Date | null;
  completedDate?: string | Date | null;
  // Results summary (for completed view)
  abnormalCount?: number;
  criticalCount?: number;
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

const orderIdLabels: Record<Modality, string> = {
  lab: "Lab ID",
  xray: "X-ray ID",
  ultrasound: "Ultrasound ID"
};

// Modality-specific subtle accent colors (premium, not loud)
const modalityAccentConfig: Record<Modality, { accentBar: string; idColor: string }> = {
  lab: {
    accentBar: "bg-blue-600 dark:bg-blue-500",
    idColor: "text-blue-700 dark:text-blue-400"
  },
  xray: {
    accentBar: "bg-cyan-600 dark:bg-cyan-500",
    idColor: "text-cyan-700 dark:text-cyan-400"
  },
  ultrasound: {
    accentBar: "bg-violet-600 dark:bg-violet-500",
    idColor: "text-violet-700 dark:text-violet-400"
  }
};

function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatClinicDay(d.toISOString(), 'MMM d, yyyy');
}

/** Format age/gender as "30/M" style like the print page */
function formatAgeGender(age?: string | number | null, gender?: string | null): string {
  if (age === null || age === undefined || age === "") return "—";
  
  // Handle age value - keep as-is if contains letters (like "6mo", "2y")
  // or convert to string if numeric
  const ageStr = String(age).trim();
  const ageDisplay = ageStr === "0" ? "0" : ageStr; // Handle 0 as valid age
  
  if (!gender) return ageDisplay;
  
  const genderInitial = gender.charAt(0).toUpperCase();
  return `${ageDisplay}/${genderInitial}`;
}

/**
 * SummaryCard - A print-style 2-column summary card for diagnostic modals.
 * 
 * This is the SINGLE SOURCE OF TRUTH for:
 * - Patient Name, Patient ID, Age/Gender, Phone
 * - Order ID, Priority, Payment Status, Requested/Completed dates
 * - Abnormal/Critical count chip (when applicable)
 * 
 * 🚫 These fields should NOT be repeated elsewhere in the modal body.
 */
export function SummaryCard({
  modality,
  patient,
  orderId,
  priority,
  paymentStatus,
  requestedDate,
  completedDate,
  abnormalCount = 0,
  criticalCount = 0
}: SummaryCardProps) {
  const priorityConf = priorityConfig[priority];
  const paymentConf = paymentConfig[paymentStatus];
  const orderLabel = orderIdLabels[modality];
  const accentConfig = modalityAccentConfig[modality];

  // Show summary chip only in completed mode when there are findings
  const showResultsSummary = completedDate && (abnormalCount > 0 || criticalCount > 0);

  return (
    <div className="space-y-3 mb-4">
      {/* Results Summary Chip - shown at top when there are abnormal/critical findings */}
      {showResultsSummary && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Results:</span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
              <AlertCircle className="w-3 h-3" /> {criticalCount} Critical
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" /> {abnormalCount} Abnormal
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Patient Information */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-3">
            Patient Information
          </div>
          <div className={`h-[2px] ${accentConfig.accentBar} rounded-full mb-3`} />
          
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Name:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-right leading-snug break-words">
                {patient.name || "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Patient ID:</span>
              <span className={`font-bold ${accentConfig.idColor} tabular-nums`}>
                {patient.patientId || "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Age/Gender:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatAgeGender(patient.age, patient.gender)}
              </span>
            </div>
            
            {patient.phone && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {patient.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Test Details */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-3">
            Test Details
          </div>
          <div className={`h-[2px] ${accentConfig.accentBar} rounded-full mb-3`} />
          
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{orderLabel}:</span>
              <span className={`font-bold ${accentConfig.idColor} tabular-nums`}>
                {orderId || "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Priority:</span>
              <Badge
                variant="outline"
                className={`${priorityConf.className} text-xs font-semibold px-2 py-0.5`}
              >
                {priorityConf.label}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Payment:</span>
              <Badge
                variant="outline"
                className={`${paymentConf.className} text-xs font-semibold px-2 py-0.5`}
              >
                {paymentConf.label}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Requested:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(requestedDate)}
              </span>
            </div>
            
            {completedDate && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed:
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatDate(completedDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
