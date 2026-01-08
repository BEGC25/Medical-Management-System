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

  return (
    <div id={containerId} className="prescription">
      <div className="bg-white p-6 max-w-4xl mx-auto">
        {/* Header - Modern Professional with Logo */}
        <div className="mb-4 pb-3 border-b-2 border-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={clinicLogo} alt="Clinic Logo" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-blue-600 mb-0.5">Bahr El Ghazal Clinic</h1>
                <p className="text-xs text-gray-600">Comprehensive Healthcare Services</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-gray-800">
                Laboratory Test Report {includeInterpretation ? "(Clinical Copy)" : "(Patient Copy)"}
              </p>
              <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Patient Information - Comes First */}
        <div className="mb-4">
          <h2 className="text-base font-bold mb-2 text-gray-900">Patient Information</h2>
          <div className="text-xs">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Patient Name:</strong> {fullName(patient)}</span>
              <span><strong>Patient ID:</strong> {labTest.patientId}</span>
              {patient?.age && <span><strong>Age:</strong> {patient.age}</span>}
              {patient?.gender && <span><strong>Gender:</strong> {patient.gender}</span>}
            </div>
          </div>
        </div>

        {/* Test Information - Compact Inline */}
        <div className="mb-4">
          <h2 className="text-base font-bold mb-2 text-gray-900">Test Information</h2>
          <div className="text-xs space-y-1">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Category:</strong> {labTest.category}</span>
              <span><strong>Priority:</strong> {labTest.priority}</span>
              <span><strong>Test ID:</strong> {labTest.testId}</span>
            </div>
            <div>
              <strong>Tests Ordered:</strong>
              <div className="mt-1 inline-flex flex-wrap gap-1 ml-1">
                {tests.map((test, i) => (
                  <span key={i} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {test}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Laboratory Results - SHOW DATA FIRST */}
        <div className="mb-4">
          <h2 className="text-base font-bold mb-2 text-gray-900">Laboratory Results</h2>
          {Object.entries(results).map(([testName, testData]) => {
            const fields = resultFields[testName];
            return (
              <div key={testName} className="mb-3 border border-gray-300 rounded p-3">
                <h3 className="text-sm font-semibold text-blue-700 mb-2">{testName}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(testData).map(([fieldName, value]) => {
                    const config = fields?.[fieldName];
                    const isNormal = config?.normal === value;
                    const isAbnormal = config?.normal && config.normal !== value;
                    
                    return (
                      <div key={fieldName} className="flex justify-between items-center border-b border-gray-200 py-1">
                        <span className="font-medium text-gray-700">{fieldName}:</span>
                        <span className={cx(
                          "font-semibold",
                          isNormal && "text-green-600",
                          isAbnormal && value && value !== "Not seen" && value !== "Negative" && "text-red-600"
                        )}>
                          {value} {config?.unit || ""}
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

          return (criticalFindings.length > 0 || warnings.length > 0) ? (
            <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded p-3">
              <h2 className="text-sm font-bold mb-1 text-yellow-900 flex items-center">
                <span className="text-base mr-1">ℹ️</span> Clinical Interpretation
              </h2>
              {criticalFindings.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold text-red-800 mb-1 text-xs">Critical Findings Requiring Attention:</p>
                  <div className="space-y-0.5">
                    {criticalFindings.map((finding, i) => (
                      <div key={i} className="bg-red-100 border-l-2 border-red-600 p-1.5 text-xs">
                        {finding}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="space-y-0.5">
                  {warnings.map((warning, i) => (
                    <div key={i} className="bg-yellow-100 border-l-2 border-yellow-600 p-1.5 text-xs">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null;
        })()}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Completed Date:</strong> {formValues?.completedDate || labTest.completedDate || "N/A"}</p>
              <p><strong>Result Status:</strong> <span className="capitalize">{formValues?.resultStatus || labTest.resultStatus || "completed"}</span></p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Lab Technician Signature:</p>
              <div className="border-b border-gray-400 w-48 ml-auto mt-6"></div>
            </div>
          </div>
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mt-3">
              <p><strong>Technician Notes:</strong></p>
              <p className="text-gray-700">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
