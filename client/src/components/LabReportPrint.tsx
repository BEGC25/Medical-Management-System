import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";

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
  };
  /** Patient data */
  patient?: {
    firstName?: string;
    lastName?: string;
    patientId?: string;
    age?: number | string;
    gender?: string;
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
  /** Additional form values (for completedDate, resultStatus, technicianNotes) */
  formValues?: {
    completedDate?: string;
    resultStatus?: string;
    technicianNotes?: string;
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
      {/* Premium Professional Invoice Layout with Border - MATCHES INVOICE */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="p-6 max-w-4xl mx-auto bg-white">
          
          {/* HEADER - IDENTICAL TO INVOICE */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-blue-900">Bahr El Ghazal Clinic</h1>
              <p className="text-sm text-gray-600 italic">Excellence in Healthcare</p>
              <p className="text-xs text-gray-600 mt-1">Aweil, South Sudan</p>
              <p className="text-xs text-gray-600">Tel: +211916759060/+211928754760</p>
              <p className="text-xs text-gray-600">Email: bahr.ghazal.clinic@gmail.com</p>
            </div>
            <div className="w-24 h-24">
              <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* TITLE WITH ACCENT BAR - MATCHES INVOICE */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              LABORATORY TEST REPORT
              {includeInterpretation && <span className="text-sm ml-2 text-gray-600">(Clinical Copy)</span>}
            </h2>
            <div className="h-1 bg-gradient-to-r from-blue-900 to-blue-800 mt-2" />
          </div>

          {/* Patient & Test Information Cards - Side by Side like Invoice */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Patient Information Box */}
            <div className="border border-gray-300 shadow-sm rounded p-2 bg-blue-50">
              <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
                PATIENT INFORMATION
              </h3>
              <div className="space-y-1 leading-tight">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Name:</span>
                  <span className="text-xs font-bold text-gray-900">{fullName(patient)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Patient ID:</span>
                  <span className="text-xs font-medium text-gray-900">{labTest.patientId}</span>
                </div>
                {patient?.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">Age:</span>
                    <span className="text-xs font-medium text-gray-900">{patient.age}</span>
                  </div>
                )}
                {patient?.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">Gender:</span>
                    <span className="text-xs font-medium text-gray-900">{patient.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Information Box */}
            <div className="border border-gray-300 shadow-sm rounded p-2 bg-gray-50">
              <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
                TEST DETAILS
              </h3>
              <div className="space-y-1 leading-tight">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Test ID:</span>
                  <span className="text-xs font-bold text-blue-900">{labTest.testId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Category:</span>
                  <span className="text-xs font-medium capitalize">{labTest.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Priority:</span>
                  <span className="text-xs font-medium capitalize">{labTest.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Tests:</span>
                  <span className="text-xs font-medium">{tests.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Ordered - Compact */}
          <div className="mb-3">
            <h3 className="font-bold text-sm mb-1 text-gray-800">Tests Ordered:</h3>
            <div className="flex flex-wrap gap-1">
              {tests.map((test, i) => (
                <span key={i} className="inline-block bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                  {test}
                </span>
              ))}
            </div>
          </div>

          {/* Laboratory Results - Professional Table Format */}
          <div className="mb-3">
            <h3 className="font-bold text-sm mb-2 text-gray-800 border-b-2 border-gray-400 pb-1">
              LABORATORY RESULTS
            </h3>
            {Object.entries(results).map(([testName, testData]) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-3 border border-gray-300 rounded p-2 bg-gray-50">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2 uppercase">{testName}</h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(testData).map(([fieldName, value]) => {
                      const config = fields?.[fieldName];
                      const isNormal = config?.normal === value;
                      const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                      
                      // Format numeric values with commas
                      let displayValue = value;
                      if (config?.type === 'number' && value) {
                        displayValue = formatNumber(value);
                      }
                      
                      return (
                        <div key={fieldName} className="flex justify-between items-center text-xs border-b border-gray-200 py-1">
                          <span className="font-medium text-gray-700">{fieldName}:</span>
                          <span className={cx(
                            "font-semibold",
                            isNormal && "text-green-600",
                            isAbnormal && "text-red-600"
                          )}>
                            {displayValue} {config?.unit || ""}
                            {config?.normal && (
                              <span className="text-xs text-gray-500 ml-1">(Norm: {config.normal})</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Interpretation - ONLY IF includeInterpretation is true */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `🔴 ${f}`);
            const warnings = interpretation.warnings.map(w => `⚠️ ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-3 rounded p-2 border-2 ${hasFindings ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <h3 className={`text-sm font-bold mb-1 flex items-center ${hasFindings ? 'text-yellow-900' : 'text-green-900'}`}>
                  <span className="text-base mr-1">ℹ️</span> Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-2">
                    <p className="font-semibold text-red-800 mb-1 text-xs">⚠️ Critical Findings Requiring Attention:</p>
                    <div className="space-y-0.5">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="bg-red-100 border-l-4 border-red-600 p-1.5 text-xs">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="space-y-0.5">
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-yellow-100 border-l-4 border-yellow-600 p-1.5 text-xs">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-xs text-green-800 bg-green-100 border-l-4 border-green-600 p-1.5">
                    ✓ All test results are within normal limits. No critical findings or abnormalities detected.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - If Present */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-3 border border-gray-300 rounded p-2 bg-gray-50">
              <h3 className="font-bold text-xs mb-1 text-gray-800">Technician Notes:</h3>
              <p className="text-xs text-gray-700">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}

          {/* SIGNATURE SECTION - MATCHES INVOICE */}
          <div className="grid grid-cols-2 gap-12 mt-6 mb-4">
            <div>
              <div className="border-t-2 border-gray-800 pt-2 mt-20">
                <p className="text-sm font-bold">Lab Technician:</p>
                <p className="text-xs text-gray-600">Laboratory Department</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-800 pt-2 mt-20">
                <p className="text-sm font-bold">Date:</p>
                <p className="text-xs text-gray-600">{formValues?.completedDate || labTest.completedDate || new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* FOOTER - IDENTICAL TO INVOICE */}
          <div className="text-center text-xs text-gray-600 border-t pt-3 mt-4">
            <p className="font-semibold">THIS IS A COMPUTER-GENERATED LABORATORY REPORT</p>
            <p className="font-semibold mt-1">Bahr El Ghazal Clinic</p>
            <p>Accredited Medical Facility | Republic of South Sudan</p>
            <p className="mt-1 italic">Your health is our priority</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
