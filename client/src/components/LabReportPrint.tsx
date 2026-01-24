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
    <div id={containerId} className="bg-white" style={{ minHeight: 'auto', height: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. TOP HEADER - Solid Dark Blue Block */}
      <div className="bg-slate-900 text-white p-8 flex justify-between items-center print:bg-slate-900 print:print-color-adjust-exact">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Bahr El Ghazal Clinic</h1>
          <p className="text-slate-300 text-sm font-medium">Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760</p>
        </div>
        <div className="bg-white rounded-full p-1 w-16 h-16 flex items-center justify-center">
            <img src={clinicLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">

        {/* 2. SECTION TITLE - Styled with Blue Accent Bar */}
        <div className="flex items-center mb-6 bg-blue-50 py-3 px-4 border-l-4 border-blue-600 print:bg-blue-50 print:print-color-adjust-exact">
            <h2 className="text-blue-900 font-bold uppercase tracking-widest text-sm">Laboratory Test Report</h2>
        </div>

        {/* 3. PATIENT INFO CARD - Rounded White Box with Grid */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8 grid grid-cols-3 gap-y-6 gap-x-4">
            {/* Row 1 */}
            <div className="col-span-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                <p className="text-lg font-bold text-slate-900">{fullName(patient)}</p>
            </div>
            <div className="col-span-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient ID</p>
                <p className="text-base font-semibold text-slate-900">{labTest.patientId}</p>
            </div>
            <div className="col-span-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Test ID</p>
                <p className="text-base font-semibold text-slate-900">{labTest.testId}</p>
            </div>

            {/* Row 2 */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Age / Gender</p>
                <p className="text-sm font-semibold text-slate-900">
                    {patient?.age ? `${patient.age} years` : '-'} 
                    <span className="mx-2 text-slate-300">|</span> 
                    {patient?.gender || '-'}
                </p>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">{labTest.category}</p>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">{labTest.priority}</p>
            </div>

            {/* Row 3 */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
            </div>
        </div>

        {/* 4. RESULTS SECTION */}
        <div className="flex items-center mb-0 bg-blue-50 py-3 px-4 border-l-4 border-blue-600 print:bg-blue-50 print:print-color-adjust-exact mt-8">
            <h2 className="text-blue-900 font-bold uppercase tracking-widest text-sm">Laboratory Results</h2>
        </div>

        {/* 5. TABLE - Dark Header + Contrast Rows */}
        <div className="mt-4 rounded-t-lg overflow-hidden border border-slate-200">
            {Object.entries(results).map(([testName, testData], index) => {
                 const fields = resultFields[testName];
                 return (
                    <div key={testName} className="mb-0 avoid-break">
                        {/* Table Header - Only show for first item or if you want it repeated */}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-blue-900 text-white uppercase text-xs font-bold tracking-wider print:bg-blue-900 print:print-color-adjust-exact">
                                <tr>
                                    <th className="px-6 py-4 w-[40%]">Parameter</th>
                                    <th className="px-6 py-4 w-[30%]">Result</th>
                                    <th className="px-6 py-4 w-[30%]">Normal Range</th>
                                </tr>
                            </thead>
                            
                            {/* Sub-Header for Test Name */}
                            <tbody>
                                <tr className="bg-blue-50 border-b border-blue-100 print:bg-blue-50 print:print-color-adjust-exact">
                                    <td colSpan={3} className="px-6 py-3 font-bold text-blue-800">
                                        {testName}
                                    </td>
                                </tr>

                                {/* Data Rows */}
                                {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                                    const config = fields?.[fieldName];
                                    const isNormal = config?.normal === value;
                                    const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                                    
                                    let displayValue = value;
                                    if (config?.type === 'number' && value) {
                                        displayValue = formatNumber(value);
                                    }

                                    return (
                                        <tr key={fieldName} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-700">{fieldName}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {isAbnormal ? (
                                                        <>
                                                            <span className="font-bold text-red-600 mr-2">{displayValue} {config?.unit}</span>
                                                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide print:bg-red-600 print:print-color-adjust-exact">
                                                                High/Abnormal
                                                            </span>
                                                        </>
                                                    ) : isNormal ? (
                                                        <span className="font-bold text-teal-600">{displayValue} {config?.unit}</span>
                                                    ) : (
                                                        <span className="font-bold text-slate-900">{displayValue} {config?.unit}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
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

        {/* 6. CLINICAL NOTES (If any) */}
        {includeInterpretation && (
             <div className="mt-8 border border-slate-200 rounded-lg p-6 bg-slate-50">
                <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-wider">Clinical Interpretation</h3>
                <div className="text-sm text-slate-700">
                     {/* Logic to show interpretation text */}
                     {interpretLabResults(results).criticalFindings.length > 0 ? (
                        <div className="space-y-1">
                            {interpretLabResults(results).criticalFindings.map((f, i) => (
                                <p key={i} className="text-red-700 font-medium">⚠️ {f}</p>
                            ))}
                        </div>
                     ) : (
                        <p className="text-emerald-700 font-medium">✓ Results appear within normal parameters.</p>
                     )}
                </div>
             </div>
        )}

        {/* 7. SIGNATURES */}
        <div className="mt-16 flex justify-between items-end pb-8 avoid-break">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lab Technician</p>
                <p className="text-sm font-bold text-slate-900">{formValues?.completedBy || labTest.completedBy || "Dr. Sarah M. Johnson"}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Report Date</p>
                <p className="text-sm font-bold text-slate-900">{formatLongDate(formValues?.completedDate || labTest.completedDate)}</p>
            </div>
        </div>

      </div>

      {/* 8. FOOTER - Solid Blue Block */}
      <div className="bg-slate-900 text-white py-6 text-center print:bg-slate-900 print:print-color-adjust-exact avoid-break">
        <p className="font-bold text-lg mb-1">Bahr El Ghazal Clinic</p>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Accredited Medical Facility | Republic of South Sudan</p>
      </div>

    </div>
  );
}
