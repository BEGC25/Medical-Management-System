import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { formatLongDate } from "@/lib/date-utils";

/**
 * Reusable Lab Report Print Component - Premium "Billion Dollar" Edition
 * * Design Philosophy:
 * - Minimalist borders (hairlines only)
 * - Strict typography hierarchy (uppercase labels, sans-serif data)
 * - Status pills/badges for results
 * - Generous whitespace
 */

interface LabReportPrintProps {
  containerId: string;
  visible: boolean;
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
  patient?: {
    firstName?: string;
    lastName?: string;
    patientId?: string;
    age?: number | string;
    gender?: string;
    phoneNumber?: string;
  } | null;
  resultFields: Record<string, Record<string, {
    type: "number" | "text" | "select" | "multiselect";
    unit?: string;
    range?: string;
    normal?: string;
    options?: string[];
  }>>;
  includeInterpretation?: boolean;
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
    <div id={containerId} className="prescription bg-white text-slate-900" style={{ minHeight: 'auto', height: 'auto', position: 'relative' }}>
      
      {/* BACKGROUND WATERMARK - Adds immediate premium texture */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden">
        <img src={clinicLogo} alt="" className="w-[600px] h-[600px] object-contain grayscale" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 p-10 max-w-5xl mx-auto" style={{ width: '100%' }}>
          
          {/* HEADER SECTION - Minimalist & Authority */}
          <div className="flex justify-between items-end border-b border-slate-900 pb-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 relative">
                 <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">Bahr El Ghazal Clinic</h1>
                <p className="text-slate-500 text-sm font-medium tracking-wide mt-2 uppercase">Excellence in Healthcare • Aweil, South Sudan</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-light text-slate-400 tracking-widest uppercase">Lab Report</h2>
              <p className="text-slate-900 font-mono text-sm mt-1">#{labTest.testId}</p>
            </div>
          </div>

          {/* UNIFIED INFO GRID - Replacing clunky boxes with a clean data matrix */}
          <div className="bg-slate-50 rounded-lg p-6 mb-10 border border-slate-100">
             <div className="grid grid-cols-4 gap-y-6 gap-x-8">
                {/* Row 1 */}
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Patient Name</p>
                   <p className="text-base font-bold text-slate-900">{fullName(patient)}</p>
                </div>
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Patient ID</p>
                   <p className="text-base font-medium text-slate-900 font-mono">{labTest.patientId}</p>
                </div>
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Age / Gender</p>
                   <p className="text-base font-medium text-slate-900">{patient?.age || '-'} / {patient?.gender || '-'}</p>
                </div>
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Report Date</p>
                   <p className="text-base font-medium text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
                </div>

                {/* Row 2 */}
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Priority</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${labTest.priority === 'High' || labTest.priority === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                      {labTest.priority}
                    </span>
                </div>
                <div className="col-span-1">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Category</p>
                   <p className="text-base font-medium text-slate-900 capitalize">{labTest.category}</p>
                </div>
                <div className="col-span-2">
                   <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Tests Ordered</p>
                   <div className="flex flex-wrap gap-1">
                      {tests.map((t, i) => (
                        <span key={i} className="text-sm font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* RESULTS SECTION - Clean Tables with Status Pills */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-6">
              Diagnostic Results
            </h3>
            
            {Object.entries(results).map(([testName, testData], testIndex) => {
              const fields = resultFields[testName];
              return (
                <div key={testName} className="mb-10 avoid-break">
                  <div className="flex items-center mb-4">
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-2"></span>
                     <h4 className="text-lg font-bold text-slate-900">{testName}</h4>
                  </div>
                  
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[40%]">Parameter</th>
                        <th className="py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[30%]">Result</th>
                        <th className="py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[30%]">Ref. Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                        const config = fields?.[fieldName];
                        const isNormal = config?.normal === value;
                        const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                        
                        let displayValue = value;
                        if (config?.type === 'number' && value) {
                          displayValue = formatNumber(value);
                        }
                        
                        return (
                          <tr key={fieldName} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-medium text-slate-700 pl-2">{fieldName}</td>
                            <td className="py-4">
                              {/* PREMIUM STATUS PILL LOGIC */}
                              {isAbnormal ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-100 shadow-sm">
                                  {displayValue} {config?.unit}
                                </span>
                              ) : isNormal ? (
                                <span className="inline-flex items-center text-sm font-semibold text-emerald-700">
                                  {displayValue} {config?.unit}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900">
                                   {displayValue} {config?.unit}
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-slate-500 font-mono text-xs">
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

          {/* CLINICAL INTERPRETATION - Elegant "Doctor's Note" Style */}
          {includeInterpretation && (() => {
            const interpretation = interpretLabResults(results);
            const { criticalFindings, warnings } = interpretation;
            const hasFindings = criticalFindings.length > 0 || warnings.length > 0;

            if (!hasFindings) {
                return (
                    <div className="mb-8 p-6 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-lg avoid-break">
                         <div className="flex items-start">
                            <span className="text-emerald-600 text-xl mr-3">✓</span>
                            <div>
                                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-1">Normal Findings</h4>
                                <p className="text-sm text-emerald-800">All parameters are within standard reference ranges.</p>
                            </div>
                         </div>
                    </div>
                )
            }

            return (
              <div className="mb-8 avoid-break">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-4">
                    Clinical Interpretation
                 </h3>
                 <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                    {criticalFindings.length > 0 && (
                        <div className="mb-6">
                            <h5 className="text-red-700 font-bold text-xs uppercase tracking-wider mb-3 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Critical Findings
                            </h5>
                            <ul className="space-y-2">
                                {criticalFindings.map((f, i) => (
                                    <li key={i} className="text-sm font-medium text-slate-900 flex items-start">
                                        <span className="text-red-500 mr-2">●</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {warnings.length > 0 && (
                        <div>
                            <h5 className="text-amber-600 font-bold text-xs uppercase tracking-wider mb-3 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Observations
                            </h5>
                            <ul className="space-y-2">
                                {warnings.map((w, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start">
                                        <span className="text-amber-400 mr-2">●</span> {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </div>
              </div>
            );
          })()}

          {/* TECHNICIAN NOTES */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
             <div className="mb-8 p-6 bg-amber-50/30 border border-amber-100 rounded-lg avoid-break">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Technician Notes</p>
                <p className="text-sm text-slate-800 italic">"{formValues?.technicianNotes || labTest.technicianNotes}"</p>
             </div>
          )}

          {/* FOOTER & SIGNATURES - Bottom of last page */}
          <div className="mt-16 pt-8 border-t border-slate-200 avoid-break">
             <div className="grid grid-cols-2 gap-20 mb-12">
                <div>
                   <div className="h-px bg-slate-300 w-full mb-4"></div>
                   <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Authorized Signature</p>
                   <p className="text-sm text-slate-900 mt-1 font-medium">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</p>
                </div>
                <div>
                   <div className="h-px bg-slate-300 w-full mb-4"></div>
                   <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Verification Date</p>
                   <p className="text-sm text-slate-900 mt-1 font-medium">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
                </div>
             </div>
             
             <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Computer Generated Report • Bahr El Ghazal Clinic Systems</p>
                <p className="text-[10px] text-slate-300">ISO 15189 Compliant • {labTest.testId}</p>
             </div>
          </div>

      </div>
    </div>
  );
}
