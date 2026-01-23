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
      {/* High-Density Medical Report Layout */}
      <div className="border border-gray-300">
        <div className="p-4 bg-white" style={{ width: '100%' }}>
          
          {/* COMPACT HEADER - Logo and Clinic Details Side-by-Side */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 flex-shrink-0">
                <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 leading-tight">Bahr El Ghazal Clinic</h1>
                <p className="text-xs text-gray-600">Aweil, South Sudan | Tel: +211916759060 / +211928754760</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900">LAB REPORT</h2>
              {includeInterpretation && <p className="text-xs text-blue-700">(Clinical Copy)</p>}
            </div>
          </div>

          {/* COMPACT PATIENT INFO GRID - 4 Columns */}
          <div className="mb-3 p-2 bg-gray-50 border border-gray-300 text-xs">
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div>
                <span className="font-semibold text-gray-700">Name:</span>
                <span className="ml-1 font-bold text-gray-900">{fullName(patient)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">ID:</span>
                <span className="ml-1 font-bold text-blue-900">{labTest.patientId}</span>
                <span className="ml-2 font-semibold text-gray-700">Gender:</span>
                <span className="ml-1 font-medium text-gray-900">{patient?.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Age:</span>
                <span className="ml-1 font-medium text-gray-900">{patient?.age || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Ref:</span>
                <span className="ml-1 font-bold text-blue-900">{labTest.testId}</span>
                <span className="ml-2 font-semibold text-gray-700">Priority:</span>
                <span className="ml-1 font-medium capitalize text-gray-900">{labTest.priority}</span>
              </div>
            </div>
            <div className="mt-1 pt-1 border-t border-gray-200">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="ml-1 font-medium text-gray-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</span>
              <span className="ml-4 font-semibold text-gray-700">Tests:</span>
              <span className="ml-1 font-medium text-gray-900">{tests.join(', ')}</span>
            </div>
          </div>

          {/* HIGH-DENSITY RESULTS TABLE */}
          <div className="mb-3">
            <h3 className="font-bold text-sm mb-2 text-gray-900 border-b border-blue-800 pb-1 uppercase">
              Laboratory Results
            </h3>
            {Object.entries(results).map(([testName, testData], testIndex) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-3 avoid-break">
                  {/* Test Name - Minimal Header */}
                  <div className="bg-blue-800 text-white px-2 py-1 text-xs font-bold uppercase">
                    {testName}
                  </div>
                  {/* Clean, Compact Table */}
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-400">
                        <th className="text-left px-2 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '40%' }}>Parameter</th>
                        <th className="text-center px-2 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '25%' }}>Result</th>
                        <th className="text-left px-2 py-1 font-bold text-gray-800" style={{ width: '35%' }}>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                        const config = fields?.[fieldName];
                        const isNormal = config?.normal === value;
                        const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                        
                        // Format numeric values with commas
                        let displayValue = value;
                        if (config?.type === 'number' && value) {
                          displayValue = formatNumber(value);
                        }
                        
                        return (
                          <tr key={fieldName} className="border-b border-gray-200 even:bg-gray-50">
                            <td className="px-2 py-1 font-medium text-gray-700 border-r border-gray-200">{fieldName}</td>
                            <td className={cx(
                              "px-2 py-1 text-center font-bold border-r border-gray-200",
                              isAbnormal && "text-red-600",
                              !isAbnormal && "text-gray-900"
                            )}>
                              {displayValue} {config?.unit || ""}
                            </td>
                            <td className="px-2 py-1 text-gray-600">
                              {config?.normal || config?.range || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Clinical Interpretation - ONLY IF includeInterpretation is true - Compact Style */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `🔴 ${f}`);
            const warnings = interpretation.warnings.map(w => `⚠️ ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-2 p-2 border avoid-break ${hasFindings ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <h3 className={`text-xs font-bold mb-1 ${hasFindings ? 'text-yellow-900' : 'text-green-900'}`}>
                  Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-2">
                    <p className="font-bold text-red-800 mb-1 text-xs">⚠️ Critical Findings:</p>
                    <div className="space-y-1">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="bg-red-100 border-l-2 border-red-600 p-1 text-xs font-medium text-red-900">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="space-y-1">
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-yellow-100 border-l-2 border-yellow-600 p-1 text-xs font-medium text-yellow-900">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-xs text-green-800 bg-green-100 border-l-2 border-green-600 p-1 font-medium">
                    ✓ All test results within normal limits.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - If Present - Compact */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-2 border border-yellow-300 p-2 bg-yellow-50 avoid-break">
              <h3 className="font-bold text-xs mb-1 text-yellow-900">
                📝 Technician Notes:
              </h3>
              <p className="text-xs text-gray-700">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}

          {/* COMPACT SIGNATURE SECTION */}
          <div className="grid grid-cols-2 gap-8 mt-4 mb-2 avoid-break">
            <div>
              <div className="border-t border-gray-900 pt-2 mt-8">
                <p className="text-xs font-bold text-gray-900">Lab Technician:</p>
                <p className="text-xs text-gray-700">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-900 pt-2 mt-8">
                <p className="text-xs font-bold text-gray-900">Date:</p>
                <p className="text-xs text-gray-700">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
              </div>
            </div>
          </div>

          {/* COMPACT FOOTER */}
          <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-2 mt-2 avoid-break">
            <p className="font-bold text-gray-800">Bahr El Ghazal Clinic</p>
            <p className="text-gray-600">Accredited Medical Facility | South Sudan</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
