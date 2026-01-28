import * as React from "react";
import { Calendar, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortenViewDescription, formatExamLabel } from "./diagnostic-utils";

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
  // Tests/Exam ordered (now integrated into summary card)
  tests?: string[];
  examType?: string | null;
  bodyPart?: string | null;
  views?: string | null;
  scanRegion?: string | null;
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
const modalityAccentConfig: Record<Modality, { accentBar: string; idColor: string; borderColor: string }> = {
  lab: {
    accentBar: "bg-blue-600 dark:bg-blue-500",
    idColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  xray: {
    accentBar: "bg-cyan-600 dark:bg-cyan-500",
    idColor: "text-cyan-700 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800"
  },
  ultrasound: {
    accentBar: "bg-violet-600 dark:bg-violet-500",
    idColor: "text-violet-700 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800"
  }
};

function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
 * SummaryCard - A print-style unified summary card for diagnostic modals.
 * 
 * This is the SINGLE SOURCE OF TRUTH (one scan zone) for:
 * - Patient Name, Patient ID, Age/Gender, Phone
 * - Order ID, Priority, Payment Status, Requested/Completed dates
 * - Abnormal/Critical count chip (when applicable)
 * - Tests/Exam ordered chips (now integrated inside)
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
  criticalCount = 0,
  tests,
  examType,
  bodyPart,
  views,
  scanRegion
}: SummaryCardProps) {
  const priorityConf = priorityConfig[priority];
  const paymentConf = paymentConfig[paymentStatus];
  const orderLabel = orderIdLabels[modality];
  const accentConfig = modalityAccentConfig[modality];

  // Show summary chip only in completed mode when there are findings
  const showResultsSummary = completedDate && (abnormalCount > 0 || criticalCount > 0);

  // Build tests/exam display items
  const getTestsDisplay = () => {
    if (modality === "lab" && tests && tests.length > 0) {
      return { label: "Tests Ordered:", items: tests, viewsChip: undefined };
    }
    if (modality === "xray") {
      const examLabel = formatExamLabel(examType, bodyPart, null);
      const items = examLabel ? [examLabel] : [];
      const shortenedViews = views ? shortenViewDescription(views) : null;
      return { 
        label: "Exam requested:", 
        items, 
        viewsChip: shortenedViews ? `Views: ${shortenedViews}` : undefined 
      };
    }
    if (modality === "ultrasound") {
      const examLabel = formatExamLabel(examType, null, scanRegion);
      const items = examLabel ? [examLabel] : [];
      return { label: "Exam requested:", items, viewsChip: undefined };
    }
    return { label: "Tests:", items: [], viewsChip: undefined };
  };

  const testsDisplay = getTestsDisplay();
  const hasTests = testsDisplay.items.length > 0 || testsDisplay.viewsChip;

  // For lab tests, show first 3, then "+N more"
  const maxVisibleTests = 3;
  const visibleTests = testsDisplay.items.slice(0, maxVisibleTests);
  const hiddenTests = testsDisplay.items.slice(maxVisibleTests);

  return (
    <div className={`rounded-xl border ${accentConfig.borderColor} bg-white dark:bg-gray-900 mb-4 overflow-hidden`}>
      {/* Subtle modality accent bar at top */}
      <div className={`h-1 ${accentConfig.accentBar}`} />
      
      <div className="p-4 space-y-4">
        {/* Results Summary Strip - shown at top when there are abnormal/critical findings */}
        {showResultsSummary && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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

        {/* Two-column layout: Patient Info | Test Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Patient Information */}
          <div className="space-y-2.5 text-sm">
            <div className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-2">
              Patient Information
            </div>
            
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

          {/* Right Column: Test Details */}
          <div className="space-y-2.5 text-sm">
            <div className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-2">
              Test Details
            </div>
            
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

        {/* Tests/Exam Ordered Row - integrated at bottom of summary card */}
        {hasTests && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {testsDisplay.label}
              </span>
              
              {visibleTests.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs font-medium px-2.5 py-1"
                >
                  {item}
                </Badge>
              ))}
              
              {/* Views chip for X-ray */}
              {testsDisplay.viewsChip && (
                <Badge
                  variant="outline"
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs font-medium px-2.5 py-1"
                >
                  {testsDisplay.viewsChip}
                </Badge>
              )}
              
              {hiddenTests.length > 0 && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 py-1">
                  +{hiddenTests.length} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
