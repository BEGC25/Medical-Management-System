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
      {/* Compact Professional Medical Report Layout */}
      <div className="border border-gray-300 rounded">
        <div className="p-4 bg-white" style={{ width: '100%' }}>
          
          {/* HEADER - Compact 2-Column Layout */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-blue-900">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 mb-0.5">Bahr El Ghazal Clinic</h1>
              <p className="text-xs text-gray-700 italic">Excellence in Healthcare</p>
              <p className="text-xs text-gray-600 mt-0.5">Aweil, South Sudan | Tel: +211916759060 | bahr.ghazal.clinic@gmail.com</p>
            </div>
            <div className="w-16 h-16">
              <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* TITLE - Compact */}
          <div className="text-center mb-2 pb-1.5 border-b border-gray-300">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide">
              LABORATORY TEST REPORT
              {includeInterpretation && <span className="text-sm ml-2 text-blue-700">(Clinical Copy)</span>}
            </h2>
          </div>

          {/* Patient & Test Information - Compact Grid */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Patient Information Box */}
            <div className="border border-blue-200 rounded p-2 bg-blue-50">
              <h3 className="font-bold text-xs mb-1 text-blue-900 border-b border-blue-900 pb-0.5">
                PATIENT INFORMATION
              </h3>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span className="font-bold text-gray-900">{fullName(patient)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span className="font-bold text-blue-900">{labTest.patientId}</span>
                </div>
                {patient?.age && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Age:</span>
                    <span className="font-medium text-gray-900">{patient.age}</span>
                  </div>
                )}
                {patient?.gender && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Gender:</span>
                    <span className="font-medium text-gray-900">{patient.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Information Box */}
            <div className="border border-gray-300 rounded p-2 bg-gray-50">
              <h3 className="font-bold text-xs mb-1 text-blue-900 border-b border-blue-900 pb-0.5">
                TEST DETAILS
              </h3>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Test ID:</span>
                  <span className="font-bold text-blue-900">{labTest.testId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Category:</span>
                  <span className="font-medium capitalize text-gray-900">{labTest.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="font-medium text-gray-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Ordered - Inline Badges */}
          <div className="mb-2 p-1.5 bg-gray-50 border border-gray-300 rounded">
            <span className="font-bold text-xs text-gray-800 mr-2">Tests:</span>
            {tests.map((test, i) => (
              <span key={i} className="inline-block bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full text-xs font-semibold text-blue-900 mr-1.5">
                {test}
              </span>
            ))}
          </div>

          {/* Laboratory Results - Compact Table Format */}
          <div className="mb-2">
            <h3 className="font-bold text-sm mb-1.5 text-gray-900 border-b border-blue-900 pb-1 uppercase tracking-wide">
              LABORATORY RESULTS
            </h3>
            {Object.entries(results).map(([testName, testData], testIndex) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-2 border border-gray-300 rounded overflow-hidden avoid-break">
                  {/* Test Name Header - Compact */}
                  <div className="bg-blue-900 text-white px-2 py-1">
                    <h4 className="text-xs font-bold uppercase">■ {testName}</h4>
                  </div>
                  {/* Compact Table */}
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400">
                        <th className="text-left px-3 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '35%' }}>Parameter</th>
                        <th className="text-center px-3 py-1 font-bold text-gray-800 border-r border-gray-300" style={{ width: '30%' }}>Result</th>
                        <th className="text-left px-3 py-1 font-bold text-gray-800" style={{ width: '35%' }}>Normal Range</th>
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
                          <tr key={fieldName} className={cx(
                            "border-b border-gray-200",
                            isAbnormal && "bg-amber-50 border-l-4 border-amber-500"
                          )}>
                            <td className="px-3 py-1 text-gray-800 border-r border-gray-200">{fieldName}</td>
                            <td className={cx(
                              "px-3 py-1 text-center border-r border-gray-200",
                              isNormal && "text-green-700 font-medium",
                              isAbnormal && "text-red-700 font-bold",
                              !isNormal && !isAbnormal && "text-gray-900"
                            )}>
                              {displayValue} {config?.unit || ""}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
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

          {/* Clinical Interpretation - ONLY IF includeInterpretation is true - Compact */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings;
            const warnings = interpretation.warnings;
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-2 rounded p-2 border avoid-break ${hasFindings ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <h3 className={`text-xs font-bold mb-1 ${hasFindings ? 'text-yellow-900' : 'text-green-900'}`}>
                  Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-1.5">
                    <p className="font-bold text-red-800 mb-1 text-xs">Critical Findings:</p>
                    <div className="space-y-0.5">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="bg-red-100 border-l-4 border-red-600 p-1.5 text-xs font-medium text-red-900">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="space-y-0.5">
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-yellow-100 border-l-4 border-yellow-600 p-1.5 text-xs font-medium text-yellow-900">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-xs text-green-800 bg-green-100 border-l-4 border-green-600 p-1.5 font-medium">
                    ✓ All test results within normal limits. No critical findings detected.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - If Present */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-2 border border-yellow-300 rounded p-2 bg-yellow-50 avoid-break">
              <h3 className="font-bold text-xs mb-1 text-yellow-900">
                Technician Notes:
              </h3>
              <p className="text-xs text-gray-700">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}

          {/* SIGNATURE SECTION - Compact Inline */}
          <div className="flex justify-between items-center mt-3 mb-2 pt-2 border-t border-gray-900 avoid-break">
            <div>
              <p className="text-xs font-bold text-gray-900">Lab Technician: <span className="font-normal">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Date: <span className="font-normal">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</span></p>
            </div>
          </div>

          {/* FOOTER - Compact */}
          <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-1.5 mt-2 avoid-break">
            <p className="font-bold text-gray-800">COMPUTER-GENERATED LABORATORY REPORT</p>
            <p className="text-gray-600 mt-0.5">Bahr El Ghazal Clinic | Accredited Medical Facility | Republic of South Sudan</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
