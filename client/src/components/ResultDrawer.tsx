import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ResultSectionCard, KeyFindingCard } from "@/components/diagnostics";
import { LabReportPrint } from "@/components/LabReportPrint";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { isTestAbnormal, isFieldAbnormal, getReferenceRange, getUnit, getTestCategoryLabel } from "@/lib/lab-abnormality";
import { Printer, AlertTriangle, CheckCircle, User, Beaker, Calendar, X, Zap, Radio } from "lucide-react";

type Patient = {
  firstName?: string;
  lastName?: string;
  patientId?: string;
  gender?: string;
  age?: string;
  phoneNumber?: string;
};

type ResultFields = Record<string, Record<string, {
  type: "number" | "text" | "select" | "multiselect";
  unit?: string;
  range?: string;
  normal?: string;
  options?: string[];
}>>;

function parseJSON<T = any>(v: any, fallback: T): T {
  try { return typeof v === "string" ? JSON.parse(v) : (v ?? fallback); } catch { return fallback; }
}

// Helper function to get initials from names
function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "??";
}

// Helper function to format date
function formatDate(date?: string): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return "—";
  }
}

// Helper function to format Age/Gender consistently as "30/M"
function formatAgeGender(age?: string | null, gender?: string | null): string {
  if (!age && !gender) return "—";
  const ageStr = age || "—";
  const genderInitial = gender?.charAt(0)?.toUpperCase() || "";
  return genderInitial ? `${ageStr}/${genderInitial}` : ageStr;
}

// Modality config for consistent styling
const modalityConfig = {
  lab: {
    icon: Beaker,
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    accentColor: "bg-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
    textColor: "text-blue-700 dark:text-blue-400"
  },
  xray: {
    icon: Zap,
    bgGradient: "from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    accentColor: "bg-cyan-600",
    iconBg: "bg-gradient-to-br from-cyan-500 to-teal-500",
    textColor: "text-cyan-700 dark:text-cyan-400"
  },
  ultrasound: {
    icon: Radio,
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    accentColor: "bg-violet-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    textColor: "text-violet-700 dark:text-violet-400"
  }
};

// Test type icon mapping
const TEST_TYPE_ICONS: Record<string, string> = {
  "Blood Film for Malaria": "🩸",
  "Hemoglobin": "🩸",
  "ESR": "🩸",  // Erythrocyte Sedimentation Rate - blood test
  "Fasting Blood Sugar": "🩸",
  "Widal Test": "🩸",
  "Liver Function Test": "⚗️",
  "Alkaline Phosphatase": "⚗️",
  "Stool Analysis": "💩",
  "Stool Examination": "💩",
  "Urine Analysis": "💧",
  "Testosterone": "💉",
  "Estrogen": "💉",
  "Thyroid": "💉",
};

// Cached lowercased keys for efficient lookup
const TEST_TYPE_KEYS_LOWER = Object.keys(TEST_TYPE_ICONS).map(k => k.toLowerCase());

function getTestTypeIcon(testName: string): string {
  const testNameLower = testName.toLowerCase();
  for (let i = 0; i < TEST_TYPE_KEYS_LOWER.length; i++) {
    if (testNameLower.includes(TEST_TYPE_KEYS_LOWER[i])) {
      const originalKey = Object.keys(TEST_TYPE_ICONS)[i];
      return TEST_TYPE_ICONS[originalKey];
    }
  }
  return "🔬"; // Default lab icon
}

export default function ResultDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "lab" | "xray" | "ultrasound" | null;
  data: any;
  patient?: Patient;
  resultFields?: ResultFields;
  onAcknowledge?: (orderLineId: number, value: boolean) => void;
  onAddToSummary?: (orderLineId: number, add: boolean) => void;
  onCopyToNotes?: (txt: string) => void;
  userRole?: "admin" | "reception" | "doctor" | "lab" | "radiology" | "pharmacy";
}) {
  const { open, onOpenChange, kind, data, patient, resultFields, userRole } = props;
  const [showClinicalPrint, setShowClinicalPrint] = React.useState(false);
  const [includeClinicalInterpretation, setIncludeClinicalInterpretation] = React.useState(true);

  // Common bits
  const paid = (data?.paymentStatus ?? data?.isPaid) === "paid" || data?.isPaid === 1 || data?.isPaid === true;
  const completed = data?.status === "completed";
  const orderLineId = data?.orderLine?.id ?? data?.orderLineId ?? data?.orderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wider modal on desktop: max-w-5xl for more content visibility */}
      <DialogContent 
        className="w-[95vw] max-w-5xl max-h-[92vh] p-0 flex flex-col overflow-hidden"
        hideCloseButton={true}
      >
        {/* ===== UNIFIED FIXED HEADER ===== */}
        {kind && (
          <div className={`shrink-0 border-b ${modalityConfig[kind].borderColor} bg-gradient-to-r ${modalityConfig[kind].bgGradient}`}>
            {/* Header Row: Close button + Title + Print (for doctors) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${modalityConfig[kind].iconBg} flex items-center justify-center`}>
                  {React.createElement(modalityConfig[kind].icon, { className: "w-4 h-4 text-white" })}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {kind === "lab" && "Lab Report"}{kind === "xray" && "X-Ray Report"}{kind === "ultrasound" && "Ultrasound Report"}
                  </h2>
                  <span className={`text-xs font-medium ${modalityConfig[kind].textColor}`}>
                    {data?.testId || data?.examId || ""}
                  </span>
                </div>
              </div>
              
              {/* Right side: Print button (doctors only) + Close */}
              <div className="flex items-center gap-3">
                {/* Print button for lab results (doctors/admins only) */}
                {kind === "lab" && completed && (userRole === "doctor" || userRole === "admin") && (
                  <div className="flex items-center gap-3 mr-2">
                    {/* Toggle for clinical interpretation */}
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeClinicalInterpretation}
                        onChange={(e) => setIncludeClinicalInterpretation(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        aria-label="Include clinical interpretation in print"
                      />
                      <span className="font-medium">Include Interpretation</span>
                    </label>
                    
                    {/* Print button */}
                    <Button 
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => {
                        setShowClinicalPrint(true);
                        setTimeout(() => {
                          const done = () => setShowClinicalPrint(false);
                          window.addEventListener("afterprint", done, { once: true });
                          window.print();
                        }, 100);
                      }}
                    >
                      <Printer className="w-4 h-4 mr-1.5" />
                      Print
                    </Button>
                  </div>
                )}
                
                {/* Close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Patient Summary "Scan Zone" Header */}
            <div className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Left: Avatar + Patient Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full ${modalityConfig[kind].iconBg} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                    {getInitials(patient?.firstName, patient?.lastName)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {patient?.firstName} {patient?.lastName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">ID: {patient?.patientId}</span>
                      <span>•</span>
                      <span>{formatAgeGender(patient?.age, patient?.gender)}</span>
                      {patient?.phoneNumber && (
                        <>
                          <span>•</span>
                          <span>{patient.phoneNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right: Status Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {paid && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  )}
                  {!paid && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-full text-xs font-semibold">
                      Unpaid
                    </span>
                  )}
                  {completed ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  )}
                  {data?.priority && data.priority !== "routine" && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      data.priority === "stat" 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : data.priority === "urgent"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Bottom row: Dates + Order ID */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Requested: {formatDate(data?.requestedDate || data?.requestDate)}
                </span>
                {(data?.completedDate || data?.completedAt || data?.reportDate) && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Completed: {formatDate(data?.completedDate || data?.completedAt || data?.reportDate)}
                  </span>
                )}
                <span className={`font-medium ${modalityConfig[kind].textColor}`}>
                  {kind === "lab" && `Lab ID: ${data?.testId || "—"}`}
                  {kind === "xray" && `X-Ray ID: ${data?.examId || "—"}`}
                  {kind === "ultrasound" && `Ultrasound ID: ${data?.examId || "—"}`}
                </span>
              </div>
            </div>
            
            {/* Sticky Results Summary Row for Lab Tests */}
            {kind === "lab" && results && Object.keys(results).length > 0 && (() => {
              let criticalCount = 0;
              let abnormalCount = 0;
              let normalCount = 0;
              
              Object.entries(results).forEach(([testName, testResults]) => {
                const abnormalityResult = isTestAbnormal(testName, testResults, patient);
                if (abnormalityResult.isCritical) {
                  criticalCount++;
                } else if (abnormalityResult.isAbnormal) {
                  abnormalCount++;
                } else {
                  normalCount++;
                }
              });
              
              const totalTests = Object.keys(results).length;
              
              return (
                <div className="px-4 py-2 bg-white/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Tests: {totalTests}
                    </span>
                    {criticalCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Critical: {criticalCount}
                      </span>
                    )}
                    {abnormalCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Abnormal: {abnormalCount}
                      </span>
                    )}
                    {normalCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">
                        <CheckCircle className="w-3 h-3" /> Normal: {normalCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== SCROLLABLE BODY ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {/* LAB CONTENT */}
          {kind === "lab" && (
            <div className="space-y-4">
              {/* Tests ordered - compact */}
              {tests?.length > 0 && (
                <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Tests Ordered</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tests.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Laboratory Results - Compact Premium Cards */}
              {results && Object.keys(results).length > 0 && (
                <div className="space-y-3">
                  {/* Premium Color-Coded Result Cards - More Compact */}
                  {Object.entries(results).map(([testName, testResults]) => {
                    const abnormalityResult = isTestAbnormal(testName, testResults, patient);
                    const isAbnormalPanel = abnormalityResult.isAbnormal;
                    const isCriticalPanel = abnormalityResult.isCritical;
                    
                    return (
                      <div 
                        key={testName}
                        className={`relative rounded-lg border-l-4 ${
                          isCriticalPanel 
                            ? 'border-l-red-500 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-gray-900'
                            : isAbnormalPanel 
                            ? 'border-l-amber-500 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900' 
                            : 'border-l-green-500 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-gray-900'
                        } shadow-sm p-3`}
                      >
                        {/* Compact Header with Icon and Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg flex-shrink-0">{getTestTypeIcon(testName)}</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{testName}</h4>
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-white text-xs font-bold rounded-full flex items-center gap-0.5 ${
                            isCriticalPanel ? 'bg-red-600' : isAbnormalPanel ? 'bg-amber-500' : 'bg-green-500'
                          }`}>
                            {isCriticalPanel ? (
                              <>
                                <AlertTriangle className="w-3 h-3" /> CRITICAL
                              </>
                            ) : isAbnormalPanel ? (
                              <>
                                <AlertTriangle className="w-3 h-3" /> ABNORMAL
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" /> NORMAL
                              </>
                            )}
                          </span>
                        </div>
                        
                        {/* Compact Results Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(testResults).map(([fieldName, value]) => {
                            const abnormal = isFieldAbnormal(testName, fieldName, value, patient);
                            const unit = getUnit(testName, fieldName);
                            const refRange = getReferenceRange(testName, fieldName, patient);
                            
                            return (
                              <div key={fieldName} className="flex items-center justify-between py-1.5 px-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{fieldName}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold text-sm ${abnormal ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {value} {unit}
                                  </span>
                                  {refRange && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                                      ({refRange})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Clinical Interpretation - Compact */}
              {(() => {
                const interpretation = interpretLabResults(results, patient);
                const { criticalFindings, warnings } = interpretation;

                if (criticalFindings.length > 0 || warnings.length > 0) {
                  const severity = criticalFindings.length > 0 ? "critical" : "attention";
                  const summary = criticalFindings.length > 0 
                    ? criticalFindings[0] 
                    : warnings[0];
                  
                  const items = [];
                  
                  if (criticalFindings.length > 1) {
                    for (let i = 1; i < criticalFindings.length; i++) {
                      items.push({ text: criticalFindings[i] });
                    }
                  }
                  
                  const warningStart = criticalFindings.length > 0 ? 0 : 1;
                  for (let i = warningStart; i < warnings.length; i++) {
                    items.push({ text: warnings[i] });
                  }
                  
                  return (
                    <KeyFindingCard
                      severity={severity}
                      summary={summary}
                      items={items}
                    />
                  );
                }
                return (
                  <KeyFindingCard
                    severity="normal"
                    summary="All test results are within normal limits. No critical findings or abnormalities detected."
                  />
                );
              })()}

              {!results || Object.keys(results).length === 0 ? (
                <div className="rounded-md border bg-muted p-3 text-sm">No result values recorded yet.</div>
              ) : null}
            </div>
          )}

          {/* XRAY CONTENT */}
          {kind === "xray" && (
            <div className="space-y-3">

              {/* View Descriptions */}
              {data?.viewDescriptions && (
                <ResultSectionCard
                  title="View Descriptions"
                  tone="accent-green"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.viewDescriptions}</div>
                </ResultSectionCard>
              )}

              {/* Radiological Findings */}
              {data?.findings && (
                <ResultSectionCard
                  title="Radiological Findings"
                  tone="accent-blue"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.findings}</div>
                </ResultSectionCard>
              )}

              {/* Clinical Impression */}
              {data?.impression && (
                <ResultSectionCard
                  title="Clinical Impression"
                  tone="accent-purple"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line font-medium">{data.impression}</div>
                </ResultSectionCard>
              )}

              {/* Recommendations */}
              {data?.recommendations && (
                <ResultSectionCard
                  title="Recommendations"
                  tone="accent-amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.recommendations}</div>
                </ResultSectionCard>
              )}

              {/* Technical Details */}
              <ResultSectionCard
                title="Technical Details"
                tone="neutral"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data?.imageQuality && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Image Quality:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{data.imageQuality}</span>
                    </div>
                  )}
                  {data?.technicalFactors && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Technical Factors:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{data.technicalFactors}</span>
                    </div>
                  )}
                  {data?.radiologist && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Radiologist:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{data.radiologist}</span>
                    </div>
                  )}
                  {data?.reportDate && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Report Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{new Date(data.reportDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </ResultSectionCard>

              {/* If no meaningful data available */}
              {!data?.viewDescriptions && !data?.findings && !data?.impression && !data?.recommendations && 
               !data?.imageQuality && !data?.technicalFactors && !data?.radiologist && (
                <div className="rounded-md border bg-muted p-3 text-sm text-center">
                  No report data available yet. Report pending completion.
                </div>
              )}
            </div>
          )}

          {/* ULTRASOUND CONTENT */}
          {kind === "ultrasound" && (
            <div className="space-y-3">
              {/* Sonographic Findings */}
              {data?.findings && (
                <ResultSectionCard
                  title="Sonographic Findings"
                  tone="accent-blue"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.findings}</div>
                </ResultSectionCard>
              )}

              {/* Impression / Key Findings */}
              {data?.impression && (() => {
                const impressionLower = data.impression.toLowerCase();
                const isNormal = impressionLower.includes("normal") && 
                                 !impressionLower.includes("abnormal") &&
                                 (impressionLower.includes("no abnormalities") || 
                                  impressionLower.includes("unremarkable") ||
                                  impressionLower.includes("within normal limits"));
                
                const severity = isNormal ? "normal" : "attention";
                
                return (
                  <KeyFindingCard
                    severity={severity}
                    title="Impression / Key Findings"
                    summary={data.impression}
                  />
                );
              })()}

              {/* Technical Details (if available) */}
              {(data?.technicalDetails || data?.probe || data?.limitations) && (
                <ResultSectionCard
                  title="Technical Details"
                  tone="neutral"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <div className="space-y-2 text-sm">
                    {data?.probe && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground">Probe Type:</span>
                        <span className="font-semibold">{data.probe}</span>
                      </div>
                    )}
                    {data?.technicalDetails && (
                      <div>
                        <span className="text-muted-foreground">Details:</span>
                        <p className="mt-1">{data.technicalDetails}</p>
                      </div>
                    )}
                    {data?.limitations && (
                      <div>
                        <span className="text-muted-foreground">Limitations:</span>
                        <p className="mt-1">{data.limitations}</p>
                      </div>
                    )}
                  </div>
                </ResultSectionCard>
              )}

              {/* Empty state */}
              {!data?.findings && !data?.impression && (
                <div className="rounded-md border bg-muted p-3 text-sm text-center">
                  No report data available yet. Report pending completion.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== FIXED FOOTER ===== */}
        <div className="shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
          {typeof orderLineId === "number" && props.onAcknowledge && (
            <Button variant="outline" size="sm" onClick={() => props.onAcknowledge!(orderLineId, true)}>Acknowledge</Button>
          )}
          {typeof orderLineId === "number" && props.onAddToSummary && (
            <Button variant="outline" size="sm" onClick={() => props.onAddToSummary!(orderLineId, true)}>Add to Summary</Button>
          )}
          <div className="ml-auto" />
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
      
      {/* Clinical Print Component for Lab Results (Doctors/Admins only) */}
      {kind === "lab" && data && patient && resultFields && (
        <LabReportPrint
          containerId="lab-clinical-print"
          visible={showClinicalPrint}
          labTest={{
            testId: data.testId || "",
            patientId: data.patientId || patient.patientId || "",
            category: data.category || "",
            priority: data.priority || "",
            tests: data.tests || [],
            results: data.results || {},
            completedDate: data.completedDate || data.completedAt,
            resultStatus: data.resultStatus || data.status,
            technicianNotes: data.technicianNotes,
          }}
          patient={patient}
          resultFields={resultFields}
          includeInterpretation={includeClinicalInterpretation}
        />
      )}
    </Dialog>
  );
}
