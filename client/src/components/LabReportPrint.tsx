import React from "react";
import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { formatLongDate } from "@/lib/date-utils";

/**
 * Reusable Lab Report Print Component
 * 
 * This component provides a unified print layout for laboratory reports.
 * It can be used for both Patient Copy (no interpretation) and Clinical Copy (with interpretation).
 */

interface LabReportPrintProps {
  /** Unique ID for the print container (e.g., "lab-report-print", "lab-clinical-print") */
  containerId: string;
  /** Whether to show this print container */
  visible: boolean;
  /** Lab test data */
  labTest: {
    testId: string;
    patientId: string;
    category: string;
    priority: string;
    tests: string | string[];
    results: string | Record<string, Record<string, string>>;
    completedDate?: string;
    resultStatus?: string;
    technicianNotes?: string;
    completedBy?: string;
  };
  /** Patient data */
  patient?: {
    firstName?: string;
    lastName?: string;
    patientId?: string;
    age?: number | string;
    gender?: string;
    phoneNumber?: string;
  } | null;
  /** Result field configurations for displaying normal ranges */
  resultFields: Record<string, Record<string, {
    type: "number" | "text" | "select" | "multiselect";
    unit?: string;
    range?: string;
    normal?: string;
    options?: string[];
  }>>;
  /** Whether to include clinical interpretation (false for patient copy, true for clinical copy) */
  includeInterpretation?: boolean;
  /** Additional form values (for completedDate, resultStatus, technicianNotes, completedBy) */
  formValues?: {
    completedDate?: string;
    resultStatus?: string;
    technicianNotes?: string;
    completedBy?: string;
  };
}

function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    return typeof v === "object" && v !== null ? v : JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}

function fullName(p?: { firstName?: string; lastName?: string; patientId?: string } | null) {
  if (!p) return "";
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return n || p.patientId || "";
}

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function LabReportPrint({
  containerId,
  visible,
  labTest,
  patient,
  resultFields,
  includeInterpretation = false,
  formValues,
}: LabReportPrintProps) {
  if (!visible) return null;

  const tests = parseJSON<string[]>(labTest.tests, []);
  const results = parseJSON<Record<string, Record<string, string>>>(labTest.results, {});
  const interpretation = interpretLabResults(results);
  
  // Format number with commas
  const formatNumber = (num: number | string): string => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(parsed) ? String(num) : new Intl.NumberFormat('en-US').format(parsed);
  };

  return (
    <div id={containerId} className="prescription" style={{ minHeight: 'auto', height: 'auto' }}>
      {/* Premium Professional Medical Report Layout - Compact Single Page */}
      <div className="border border-gray-300">
        <div className="p-4 bg-white" style={{ width: '100%' }}>
          
          {/* HEADER - Compact Professional Style */}
          <div className="flex items-start justify-between mb-2 pb-2 border-b border-gray-400">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 mb-0.5 leading-tight">Bahr El Ghazal Clinic</h1>
              <p className="text-xs text-gray-600 leading-tight">Aweil, South Sudan | Tel: +211916759060 / +211928754760</p>
            </div>
            <div className="w-16 h-16">
              <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* TITLE - Compact Style */}
          <div className="text-center mb-2 pb-1 border-b border-gray-300">
            <h2 className="text-lg font-bold text-gray-900">
              LABORATORY TEST REPORT
              {includeInterpretation && <span className="text-sm ml-2 text-blue-700">(Clinical Copy)</span>}
            </h2>
          </div>

          {/* Patient & Test Information - Compact Unified Grid */}
          <div className="mb-2 p-2 bg-gray-50 border border-gray-300 text-xs">
            <div className="grid grid-cols-4 gap-x-4 gap-y-0.5">
              <div><span className="font-semibold">Patient:</span> {fullName(patient)}</div>
              <div><span className="font-semibold">ID:</span> {labTest.patientId}</div>
              <div><span className="font-semibold">Age/Gender:</span> {patient?.age}/{patient?.gender}</div>
              <div><span className="font-semibold">Test ID:</span> {labTest.testId}</div>
              <div><span className="font-semibold">Category:</span> {labTest.category}</div>
              <div><span className="font-semibold">Priority:</span> {labTest.priority}</div>
              <div className="col-span-2"><span className="font-semibold">Date:</span> {formatLongDate(formValues?.completedDate || labTest.completedDate)}</div>
            </div>
          </div>

          {/* Laboratory Results - Unified Compact Table */}
          <div className="mb-2">
            <h3 className="font-bold text-sm mb-1 text-gray-900 border-b border-gray-400 pb-1">
              LABORATORY RESULTS
            </h3>
            {/* Single unified table for all tests */}
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200 border-b border-gray-400">
                  <th className="text-left px-2 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '35%' }}>Parameter</th>
                  <th className="text-center px-2 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '25%' }}>Result</th>
                  <th className="text-left px-2 py-1 font-bold text-gray-800" style={{ width: '40%' }}>Normal Range</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results).map(([testName, testData], testIndex) => {
                  const fields = resultFields[testName];
                  return (
                    <React.Fragment key={testName}>
                      {/* Test Category Header Row */}
                      <tr className="bg-blue-900 text-white">
                        <td colSpan={3} className="px-2 py-1 font-bold text-xs uppercase">
                          {testName}
                        </td>
                      </tr>
                      {/* Test Result Rows */}
                      {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                        const config = fields?.[fieldName];
                        const isNormal = config?.normal === value;
                        const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                        
                        // Format numeric values with commas
                        let displayValue = value;
                        if (config?.type === 'number' && value) {
                          displayValue = formatNumber(value);
                        }
                        
                        // Determine status badge for abnormal values
                        let statusBadge = "";
                        if (isAbnormal && config?.type === 'number' && config?.normal) {
                          const numValue = typeof value === 'string' ? parseFloat(value) : value;
                          const normalValue = parseFloat(config.normal);
                          if (!isNaN(numValue) && !isNaN(normalValue)) {
                            statusBadge = numValue > normalValue ? " H" : " L";
                          }
                        }
                        
                        return (
                          <tr key={fieldName} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2 py-1 text-gray-700 border-r border-gray-200">{fieldName}</td>
                            <td className={cx(
                              "px-2 py-1 text-center font-bold border-r border-gray-200",
                              isNormal && "text-green-700",
                              isAbnormal && "text-red-600",
                              !isNormal && !isAbnormal && "text-gray-900"
                            )}>
                              {displayValue} {config?.unit || ""}{isAbnormal && statusBadge && <span className="text-xs ml-1 px-1 bg-red-100 rounded">{statusBadge}</span>}
                            </td>
                            <td className="px-2 py-1 text-gray-600">
                              {config?.normal || config?.range || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clinical Interpretation - Compact Version */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `⚠ ${f}`);
            const warnings = interpretation.warnings.map(w => `• ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-1.5 p-2 border text-xs avoid-break ${hasFindings ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <h3 className={`text-xs font-bold mb-1 ${hasFindings ? 'text-yellow-900' : 'text-green-900'}`}>
                  Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-1">
                    {criticalFindings.map((finding, i) => (
                      <div key={i} className="bg-red-100 border-l-2 border-red-600 px-1.5 py-0.5 text-xs text-red-900 mb-0.5">
                        {finding}
                      </div>
                    ))}
                  </div>
                )}
                {hasWarnings && (
                  <div>
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-yellow-100 border-l-2 border-yellow-600 px-1.5 py-0.5 text-xs text-yellow-900 mb-0.5">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-xs text-green-800 bg-green-100 border-l-2 border-green-600 px-1.5 py-0.5">
                    All test results within normal limits.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - Compact */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-1.5 border border-yellow-300 p-1.5 bg-yellow-50 text-xs avoid-break">
              <span className="font-bold text-yellow-900">Notes:</span> {formValues?.technicianNotes || labTest.technicianNotes}
            </div>
          )}

          {/* SIGNATURE & FOOTER - Compact Inline Style */}
          <div className="mt-3 pt-2 border-t border-gray-400 text-xs avoid-break">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="font-bold">Lab Technician:</span> {formValues?.completedBy || labTest.completedBy || "Lab Technician"}
              </div>
              <div>
                <span className="font-bold">Date:</span> {formatLongDate(formValues?.completedDate || labTest.completedDate)}
              </div>
            </div>
            <div className="text-center text-gray-600 pt-1 border-t border-gray-300">
              <p className="font-bold text-blue-900">Bahr El Ghazal Clinic</p>
              <p className="text-xs">Accredited Medical Facility | Republic of South Sudan</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
