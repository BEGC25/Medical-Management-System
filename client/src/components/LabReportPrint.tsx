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
          <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-slate-900">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">Bahr El Ghazal Clinic</h1>
              <p className="text-lg text-slate-700 italic font-medium tracking-wide">Excellence in Healthcare</p>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-slate-600">Aweil, South Sudan</p>
                <p className="text-sm text-slate-600">Tel: +211916759060 / +211928754760</p>
                <p className="text-sm text-slate-600">Email: bahr.ghazal.clinic@gmail.com</p>
              </div>
            </div>
            <div className="w-32 h-32 flex-shrink-0">
              <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* TITLE WITH ACCENT BAR - Premium Style */}
          <div className="text-center mb-6 pb-5 border-b border-slate-300">
            <h2 className="text-3xl font-bold text-slate-900 tracking-widest">
              LABORATORY TEST REPORT
              {includeInterpretation && <span className="text-xl ml-3 text-slate-600 font-normal">(Clinical Copy)</span>}
            </h2>
            <div className="h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent mt-4 mx-auto" style={{ width: '50%' }} />
          </div>

          {/* Patient & Test Information Cards - Premium Side by Side Layout */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Patient Information Box */}
            <div className="border-2 border-slate-800 rounded-lg p-5 bg-white shadow-sm">
              <h3 className="font-bold text-sm mb-4 text-slate-900 border-b-2 border-slate-800 pb-2 tracking-widest uppercase">
                Patient Information
              </h3>
              <div className="space-y-2 leading-relaxed">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Name:</span>
                  <span className="text-sm font-bold text-slate-900">{fullName(patient)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Patient ID:</span>
                  <span className="text-sm font-bold text-slate-900">{labTest.patientId}</span>
                </div>
                {patient?.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Age:</span>
                    <span className="text-sm font-medium text-slate-900">{patient.age}</span>
                  </div>
                )}
                {patient?.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Gender:</span>
                    <span className="text-sm font-medium text-slate-900">{patient.gender}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Phone:</span>
                  <span className="text-sm font-medium text-slate-900">{patient?.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Test Information Box */}
            <div className="border border-slate-400 rounded-lg p-5 bg-slate-50 shadow-sm">
              <h3 className="font-bold text-sm mb-4 text-slate-900 border-b-2 border-slate-800 pb-2 tracking-widest uppercase">
                Test Details
              </h3>
              <div className="space-y-2 leading-relaxed">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Test ID:</span>
                  <span className="text-sm font-bold text-slate-900">{labTest.testId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Category:</span>
                  <span className="text-sm font-medium capitalize text-slate-900">{labTest.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Priority:</span>
                  <span className="text-sm font-medium capitalize text-slate-900">{labTest.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Tests:</span>
                  <span className="text-sm font-medium text-slate-900">{tests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Date:</span>
                  <span className="text-sm font-medium text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Ordered - Premium Badge Style */}
          <div className="mb-6 p-5 bg-slate-50 border border-slate-300 rounded-lg">
            <h3 className="font-bold text-sm mb-3 text-slate-900 tracking-wider uppercase">Tests Ordered</h3>
            <div className="flex flex-wrap gap-2">
              {tests.map((test, i) => (
                <span key={i} className="inline-block bg-white border border-slate-400 px-4 py-2 rounded-md text-sm font-medium text-slate-800">
                  {test}
                </span>
              ))}
            </div>
          </div>

          {/* Laboratory Results - Premium Professional Table Format */}
          <div className="mb-4">
            <h3 className="font-bold text-base mb-4 text-slate-900 border-b border-slate-800 pb-2 uppercase tracking-widest">
              LABORATORY RESULTS
            </h3>
            {Object.entries(results).map(([testName, testData], testIndex) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-4 border border-slate-300 rounded-xl overflow-hidden shadow-sm avoid-break">
                  {/* Test Name Header - Premium Style */}
                  <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-700">
                    <h4 className="text-sm font-bold uppercase tracking-widest">● {testName}</h4>
                  </div>
                  {/* Professional Table */}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="text-left px-5 py-4 font-bold text-slate-900 border-r border-slate-300 tracking-wide" style={{ width: '35%' }}>Test</th>
                        <th className="text-center px-5 py-4 font-bold text-slate-900 border-r border-slate-300 tracking-wide" style={{ width: '30%' }}>Result</th>
                        <th className="text-left px-5 py-4 font-bold text-slate-900 tracking-wide" style={{ width: '35%' }}>Normal Range</th>
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
                        const bgColor = rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                        
                        return (
                          <tr key={fieldName} className={`border-b border-slate-200 ${bgColor}`}>
                            <td className="px-5 py-4 font-semibold text-slate-700 border-r border-slate-200">{fieldName}</td>
                            <td className={cx(
                              "px-5 py-4 text-center font-bold text-base border-r border-slate-200",
                              isNormal && "text-emerald-700",
                              isAbnormal && "text-red-700",
                              !isNormal && !isAbnormal && "text-slate-900"
                            )}>
                              {displayValue} {config?.unit || ""}
                            </td>
                            <td className="px-5 py-4 text-slate-600 text-sm">
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
            const criticalFindings = interpretation.criticalFindings;
            const warnings = interpretation.warnings;
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className={`mb-4 rounded-xl p-4 border shadow-sm avoid-break ${hasFindings ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <h3 className={`text-base font-bold mb-3 flex items-center tracking-wide ${hasFindings ? 'text-amber-900' : 'text-emerald-900'}`}>
                  <span className="text-lg mr-2">ℹ️</span> Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div className="mb-3">
                    <p className="font-bold text-red-800 mb-2 text-sm tracking-wide">⚠️ Critical Findings Requiring Immediate Attention:</p>
                    <div className="space-y-2">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="bg-red-50 border-l-4 border-red-600 p-3 text-sm font-medium text-red-900 rounded-md">
                          ● {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="space-y-2">
                    {warnings.map((warning, i) => (
                      <div key={i} className="bg-amber-50 border-l-4 border-amber-600 p-3 text-sm font-medium text-amber-900 rounded-md">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                )}
                {!hasFindings && (
                  <div className="text-sm text-emerald-800 bg-emerald-100 border-l-4 border-emerald-600 p-3 font-medium rounded-md">
                    ✓ All test results are within normal limits. No critical findings or abnormalities detected.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - If Present */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mb-4 border border-amber-300 rounded-xl p-4 bg-amber-50 shadow-sm avoid-break">
              <h3 className="font-bold text-sm mb-2 text-amber-900 flex items-center tracking-wide">
                <span className="mr-2">📝</span> Technician Notes:
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{formValues?.technicianNotes || labTest.technicianNotes}</p>
            </div>
          )}

          {/* SIGNATURE SECTION - Premium Professional Style - Always on Last Page */}
          <div className="grid grid-cols-2 gap-12 mt-10 mb-6 avoid-break">
            <div>
              <div className="border-t-2 border-slate-900 pt-3 mt-16">
                <p className="text-base font-bold text-slate-900 tracking-wide">Lab Technician:</p>
                <p className="text-sm text-slate-700 mt-1">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-900 pt-3 mt-16">
                <p className="text-base font-bold text-slate-900 tracking-wide">Date:</p>
                <p className="text-sm text-slate-700 mt-1">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
              </div>
            </div>
          </div>

          {/* FOOTER - Premium Professional Style */}
          <div className="text-center text-sm text-slate-600 border-t-2 border-slate-300 pt-5 mt-8 avoid-break">
            <p className="font-bold text-slate-800 tracking-widest text-xs mb-3">THIS IS A COMPUTER-GENERATED LABORATORY REPORT</p>
            <p className="font-bold text-slate-900 mt-2 text-lg tracking-wide">Bahr El Ghazal Clinic</p>
            <p className="text-slate-600 text-sm mt-1">Accredited Medical Facility | Republic of South Sudan</p>
            <p className="mt-3 italic text-slate-700">Your health is our priority</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
