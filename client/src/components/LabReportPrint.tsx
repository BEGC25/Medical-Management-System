import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { formatLongDate } from "@/lib/date-utils";

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

// --- SMART RANGE PARSER ---
// Parses strings like "13.5-17.5" to determine if value is LOW or HIGH
function getAbnormalStatus(value: string, rangeString?: string): { label: string, color: string } | null {
  if (!value || !rangeString) return { label: "ABNORMAL", color: "bg-red-600" };
  
  // Clean up strings for parsing
  const cleanVal = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(cleanVal)) return { label: "ABNORMAL", color: "bg-red-600" };

  // Regex to find range "min-max"
  const rangeMatch = rangeString.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
  
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    
    if (cleanVal < min) return { label: "LOW", color: "bg-amber-500" }; // Orange for Low
    if (cleanVal > max) return { label: "HIGH", color: "bg-red-600" };   // Red for High
  }

  // Fallback for non-numeric ranges or complex strings
  return { label: "ABNORMAL", color: "bg-red-600" };
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

  const results = parseJSON<Record<string, Record<string, string>>>(labTest.results, {});

  const formatNumber = (num: number | string): string => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(parsed) ? String(num) : new Intl.NumberFormat('en-US').format(parsed);
  };

  return (
    <div id={containerId} className="bg-white font-sans text-slate-900" style={{ width: '100%', minHeight: '100%' }}>
      
      {/* 1. HEADER - Solid Blue Block with Logo Badge */}
      <div className="bg-[#1e293b] text-white px-8 py-6 flex justify-between items-center print:bg-[#1e293b] print:print-color-adjust-exact">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Bahr El Ghazal Clinic</h1>
          <p className="text-slate-300 text-sm font-medium">Aweil, South Sudan | Tel: +211 916 759 060</p>
        </div>
        <div className="bg-white rounded-full p-1 w-14 h-14 flex items-center justify-center shadow-lg">
           {/* If you have the 'BG' text logo from image, replace image tag with text: */}
           {/* <span className="text-blue-900 font-bold text-xl">BG</span> */}
           <img src={clinicLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
        </div>
      </div>

      <div className="p-8 max-w-[1100px] mx-auto">

        {/* 2. REPORT TITLE BAR */}
        <div className="flex items-center mb-6 border-l-4 border-blue-600 pl-4 py-1">
            <h2 className="text-blue-700 font-bold uppercase tracking-widest text-lg">Laboratory Test Report</h2>
        </div>

        {/* 3. PATIENT INFO CARD - Exact Grid Match */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] p-6 mb-8">
            <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                {/* Row 1 */}
                <div className="col-span-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                    <p className="text-xl font-bold text-slate-900">{fullName(patient)}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient ID</p>
                    <p className="text-base font-bold text-slate-800">{labTest.patientId}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Test ID</p>
                    <p className="text-base font-bold text-slate-800">{labTest.testId}</p>
                </div>

                {/* Row 2 */}
                <div className="col-span-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age</p>
                    <p className="text-sm font-bold text-slate-900">{patient?.age ? `${patient.age} years` : '-'}</p>
                </div>
                <div className="col-span-1">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                     <p className="text-sm font-bold text-slate-900">{patient?.gender || '-'}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-sm font-bold text-slate-900 capitalize">{labTest.category}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                    <p className="text-sm font-bold text-slate-900 capitalize">{labTest.priority}</p>
                </div>

                {/* Row 3 - Full Width Date */}
                <div className="col-span-4 border-t border-slate-100 pt-4 mt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Date</p>
                    <p className="text-sm font-bold text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
                </div>
            </div>
        </div>

        {/* 4. RESULTS SECTION */}
        <div className="flex items-center mb-4 border-l-4 border-blue-600 pl-4 py-1 mt-10">
            <h2 className="text-blue-700 font-bold uppercase tracking-widest text-sm">Laboratory Results</h2>
        </div>

        {/* 5. DATA TABLE - Compact & Colorful */}
        <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {Object.entries(results).map(([testName, testData], index) => {
                 const fields = resultFields[testName];
                 return (
                    <div key={testName} className="avoid-break">
                        <table className="w-full text-left text-sm border-collapse">
                            {/* Table Header - Dark Blue */}
                            {index === 0 && (
                                <thead className="bg-[#1d4ed8] text-white uppercase text-xs font-bold tracking-wider print:bg-[#1d4ed8] print:print-color-adjust-exact">
                                    <tr>
                                        <th className="px-6 py-3 w-[45%]">Test Name</th>
                                        <th className="px-6 py-3 w-[25%] text-center">Result</th>
                                        <th className="px-6 py-3 w-[30%]">Normal Range</th>
                                    </tr>
                                </thead>
                            )}
                            
                            <tbody>
                                {/* Sub-Section Header (Light Blue Bar) */}
                                <tr className="bg-blue-50/80 border-b border-blue-100 print:bg-blue-50 print:print-color-adjust-exact">
                                    <td colSpan={3} className="px-6 py-2 font-bold text-blue-800 text-sm">
                                        {testName}
                                    </td>
                                </tr>

                                {/* Data Rows */}
                                {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                                    const config = fields?.[fieldName];
                                    const isNormal = config?.normal === value;
                                    // Complex check for abnormal: exists, not equal to normal, not "Negative", not "Not seen"
                                    const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                                    
                                    let displayValue = value;
                                    if (config?.type === 'number' && value) {
                                        displayValue = formatNumber(value);
                                    }

                                    // Smart Badge Logic
                                    let statusBadge = null;
                                    if (isAbnormal) {
                                        const status = getAbnormalStatus(value, config?.normal || config?.range);
                                        statusBadge = status;
                                    }

                                    return (
                                        <tr key={fieldName} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-600">{fieldName}</td>
                                            
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* The Value */}
                                                    <span className={`font-bold ${isAbnormal ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {displayValue} <span className="text-xs text-slate-500 font-normal">{config?.unit}</span>
                                                    </span>

                                                    {/* The Badge (Pill) - Only if abnormal */}
                                                    {statusBadge && (
                                                        <span className={`${statusBadge.color} text-white text-[10px] font-bold px-2 py-[1px] rounded-full uppercase tracking-wider shadow-sm print:print-color-adjust-exact`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 text-slate-400 text-xs font-medium">
                                                {config?.normal || config?.range || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 )
            })}
        </div>

        {/* 6. INTERPRETATION & FOOTER */}
        {includeInterpretation && (
             <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">Clinical Interpretation</h3>
                <div className="text-sm">
                     {interpretLabResults(results).criticalFindings.length > 0 ? (
                        <div className="space-y-1 mt-2">
                            {interpretLabResults(results).criticalFindings.map((f, i) => (
                                <div key={i} className="flex items-center text-red-700 font-bold bg-white p-2 rounded border border-red-100 shadow-sm">
                                    <span className="mr-2 text-lg">⚠️</span> {f}
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-emerald-700 font-medium mt-2 flex items-center">
                            <span className="mr-2 text-lg">✓</span> Results appear within normal parameters.
                        </p>
                     )}
                </div>
             </div>
        )}

        {/* Signatures */}
        <div className="mt-12 flex justify-between items-end pb-4 border-t border-slate-200 pt-6 avoid-break">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lab Technician</p>
                <p className="text-sm font-bold text-slate-900">{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Date</p>
                <p className="text-sm font-bold text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
            </div>
        </div>

      </div>

      {/* 7. FOOTER BAR */}
      <div className="bg-[#1e293b] text-white py-4 text-center mt-auto print:bg-[#1e293b] print:print-color-adjust-exact">
        <p className="font-bold text-sm">Bahr El Ghazal Clinic</p>
        <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Accredited Medical Facility | Republic of South Sudan</p>
      </div>

    </div>
  );
}
