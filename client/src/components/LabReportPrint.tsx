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
      {/* Premium Professional Medical Report Layout - Full Width */}
      <div className="border-2 border-gray-300 rounded-lg">
        <div className="p-6 bg-white" style={{ width: '100%' }}>
          
          {/* HEADER - Premium Professional Style */}
          <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-blue-900">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-blue-900 mb-1">Bahr El Ghazal Clinic</h1>
              <p className="text-base text-gray-700 italic font-medium">Excellence in Healthcare</p>
              <p className="text-sm text-gray-600 mt-2">Aweil, South Sudan</p>
              <p className="text-sm text-gray-600">Tel: +211916759060 / +211928754760</p>
              <p className="text-sm text-gray-600">Email: bahr.ghazal.clinic@gmail.com</p>
            </div>
            <div className="w-28 h-28">
              <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* TITLE WITH ACCENT BAR - Premium Style */}
          <div className="text-center mb-4 pb-3 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
              LABORATORY TEST REPORT
              {includeInterpretation && <span className="text-lg ml-2 text-blue-700">(Clinical Copy)</span>}
            </h2>
            <div className="h-1.5 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 mt-3 mx-auto" style={{ width: '60%' }} />
          </div>

          {/* Patient & Test Information Cards - Premium Side by Side Layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Patient Information Box */}
            <div className="border-2 border-blue-200 shadow-md rounded-lg p-3 bg-gradient-to-br from-blue-50 to-white">
              <h3 className="font-bold text-base mb-2 text-blue-900 border-b-2 border-blue-900 pb-1.5">
                PATIENT INFORMATION
              </h3>
              <div className="space-y-1.5 leading-relaxed">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Name:</span>
                  <span className="text-sm font-bold text-gray-900">{fullName(patient)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Patient ID:</span>
                  <span className="text-sm font-bold text-blue-900">{labTest.patientId}</span>
                </div>
                {patient?.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Age:</span>
                    <span className="text-sm font-medium text-gray-900">{patient.age}</span>
                  </div>
                )}
                {patient?.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Gender:</span>
                    <span className="text-sm font-medium text-gray-900">{patient.gender}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">{patient?.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Test Information Box */}
            <div className="border-2 border-gray-300 shadow-md rounded-lg p-3 bg-gradient-to-br from-gray-50 to-white">
              <h3 className="font-bold text-base mb-2 text-blue-900 border-b-2 border-blue-900 pb-1.5">
                TEST DETAILS
              </h3>
              <div className="space-y-1.5 leading-relaxed">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Test ID:</span>
                  <span className="text-sm font-bold text-blue-900">{labTest.testId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Category:</span>
                  <span className="text-sm font-medium capitalize text-gray-900">{labTest.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Priority:</span>
                  <span className="text-sm font-medium capitalize text-gray-900">{labTest.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Tests:</span>
                  <span className="text-sm font-medium text-gray-900">{tests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Date:</span>
                  <span className="text-sm font-medium text-gray-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Ordered - Premium Badge Style */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
            <h3 className="font-bold text-sm mb-2 text-gray-800">Tests Ordered:</h3>
            <div className="flex flex-wrap gap-2">
              {tests.map((test, i) => (
                <span key={i} className="inline-block bg-blue-100 border-2 border-blue-300 px-3 py-1 rounded-full text-sm font-semibold text-blue-900">
                  {test}
                </span>
              ))}
            </div>
          </div>

          {/* Laboratory Results - Premium Professional Table Format */}
          <div className="mb-3">
            <h3 className="font-bold text-base mb-3 text-gray-900 border-b-2 border-blue-900 pb-2 uppercase tracking-wide">
              LABORATORY RESULTS
            </h3>
            {Object.entries(results).map(([testName, testData], testIndex) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-4 border-2 border-gray-300 rounded-lg overflow-hidden avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {/* Test Name Header - Premium Style */}
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2">
                    <h4 className="text-sm font-bold uppercase tracking-wide">■ {testName}</h4>
                  </div>
                  {/* Professional Table */}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-400">
                        <th className="text-left px-4 py-2.5 font-bold text-gray-800 border-r border-gray-300" style={{ width: '35%' }}>Parameter</th>
                        <th className="text-center px-4 py-2.5 font-bold text-gray-800 border-r border-gray-300" style={{ width: '30%' }}>Result</th>
                        <th className="text-left px-4 py-2.5 font-bold text-gray-800" style={{ width: '35%' }}>Normal Range</th>
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
                        
                        // Alternating row colors for better readability
                        const bgColor = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                        
                        return (
                          <tr key={fieldName} className={`border-b border-gray-200 ${bgColor}`}>
                            <td className="px-4 py-2.5 font-semibold text-gray-700 border-r border-gray-200">{fieldName}</td>
                            <td className={cx(
                              "px-4 py-2.5 text-center font-bold text-base border-r border-gray-200",
                              isNormal && "text-green-700",
                              isAbnormal && "text-red-600",
                              !isNormal && !isAbnormal && "text-gray-900"
                            )}>
                              {displayValue} {config?.unit || ""}
                              {isAbnormal && <span className="ml-2">🔴</span>}
                              {isNormal && <span className="ml-2 text-green-600">✓</span>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 text-sm">
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

          {/* Clinical Interpretation - ONLY IF includeInterpretation is true - Premium Style */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `🔴 ${f}`);
            const warnings = interpretation.warnings.map(w => `⚠️ ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-3 rounded-lg p-4 border-2 avoid-break ${hasFindings ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className={`text-base font-bold mb-2 flex items-center ${hasFindings ? 'text-yellow-900' : 'text-green-900'}`}>
                  <span className="text-lg mr-2">ℹ️</span> Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-3">
                    <p className="font-bold text-red-800 mb-2 text-sm">⚠️ Critical Findings Requiring Immediate Attention:</p>
                    <div className="space-y-1">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="bg-red-100 border-l-4 border-red-600 p-2 text-sm font-medium text-red-900">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="space-y-1">
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-yellow-100 border-l-4 border-yellow-600 p-2 text-sm font-medium text-yellow-900">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-sm text-green-800 bg-green-100 border-l-4 border-green-600 p-2.5 font-medium">
                    ✓ All test results are within normal limits. No critical findings or abnormalities detected.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - If Present */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-3 border-2 border-yellow-300 rounded-lg p-3 bg-yellow-50 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <h3 className="font-bold text-sm mb-2 text-yellow-900 flex items-center">
                <span className="mr-2">📝</span> Technician Notes:
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}

          {/* SIGNATURE SECTION - Premium Professional Style - Always on Last Page */}
          <div className="grid grid-cols-2 gap-12 mt-8 mb-4 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div>
              <div className="border-t-2 border-gray-900 pt-3 mt-16">
                <p className="text-base font-bold text-gray-900">Lab Technician:</p>
                <p className="text-sm text-gray-700 mt-1">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-900 pt-3 mt-16">
                <p className="text-base font-bold text-gray-900">Date:</p>
                <p className="text-sm text-gray-700 mt-1">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
              </div>
            </div>
          </div>

          {/* FOOTER - Premium Professional Style */}
          <div className="text-center text-sm text-gray-600 border-t-2 border-gray-300 pt-3 mt-4 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="font-bold text-gray-800 tracking-wide">THIS IS A COMPUTER-GENERATED LABORATORY REPORT</p>
            <p className="font-bold text-blue-900 mt-2 text-base">Bahr El Ghazal Clinic</p>
            <p className="text-gray-600">Accredited Medical Facility | Republic of South Sudan</p>
            <p className="mt-2 italic text-gray-700">Your health is our priority</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
