// client/src/components/LabReportPrint.tsx
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
  resultFields: Record<
    string,
    Record<
      string,
      {
        type: "number" | "text" | "select" | "multiselect";
        unit?: string;
        range?: string;
        normal?: string;
        options?: string[];
      }
    >
  >;
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

function fullName(
  p?: { firstName?: string; lastName?: string; patientId?: string } | null
) {
  if (!p) return "";
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return n || p.patientId || "";
}

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function safeLongDate(v?: string) {
  if (!v) return "—";
  try {
    return formatLongDate(v);
  } catch {
    return "—";
  }
}

function normalizeValue(v: string) {
  return (v ?? "").toString().trim().toLowerCase();
}

function isCommonNormalText(v: string) {
  const x = normalizeValue(v);
  return x === "negative" || x === "not seen" || x === "none" || x === "normal";
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
  const results = parseJSON<Record<string, Record<string, string>>>(
    labTest.results,
    {}
  );

  const interpretation = includeInterpretation
    ? interpretLabResults(results)
    : { criticalFindings: [] as string[], warnings: [] as string[] };

  const formatNumber = (num: number | string): string => {
    const parsed = typeof num === "string" ? parseFloat(num) : num;
    return isNaN(parsed)
      ? String(num)
      : new Intl.NumberFormat("en-US").format(parsed);
  };

  const completedDate = formValues?.completedDate || labTest.completedDate;
  const resultStatus = formValues?.resultStatus || labTest.resultStatus;
  const completedBy = formValues?.completedBy || labTest.completedBy;
  const technicianNotes = formValues?.technicianNotes || labTest.technicianNotes;

  return (
    <div id={containerId} className="prescription" style={{ minHeight: "auto", height: "auto" }}>
      <style>{`
        @media print {
          @page { margin: 14mm; }
          #${containerId} { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #${containerId} .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          #${containerId} .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white text-slate-900">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            {/* Top accent rule */}
            <div className="h-1 bg-slate-900" />

            <div className="p-7">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto] gap-6 items-start pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden bg-white">
                      <img
                        src={clinicLogo}
                        alt="Bahr El Ghazal Clinic"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Bahr El Ghazal Clinic
                      </h1>
                      <p className="mt-1 text-sm text-slate-600 italic">
                        Excellence in Healthcare
                      </p>
                      <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                        <div>Aweil, South Sudan</div>
                        <div>Tel: +211916759060 / +211928754760</div>
                        <div>Email: bahr.ghazal.clinic@gmail.com</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive metadata panel */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" style={{ minWidth: 320 }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                      Report
                    </div>
                    <span
                      className={cx(
                        "text-[11px] px-2 py-1 rounded-full border font-semibold",
                        normalizeValue(resultStatus || "") === "completed"
                          ? "border-emerald-200 text-emerald-800 bg-emerald-50"
                          : "border-slate-200 text-slate-700 bg-white"
                      )}
                    >
                      {resultStatus ? resultStatus : "—"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="text-slate-500">Test ID</div>
                    <div className="text-slate-900 font-semibold text-right">
                      {labTest.testId}
                    </div>

                    <div className="text-slate-500">Patient ID</div>
                    <div className="text-slate-900 font-semibold text-right">
                      {labTest.patientId}
                    </div>

                    <div className="text-slate-500">Category</div>
                    <div className="text-slate-900 text-right capitalize">
                      {labTest.category}
                    </div>

                    <div className="text-slate-500">Priority</div>
                    <div className="text-slate-900 text-right capitalize">
                      {labTest.priority}
                    </div>

                    <div className="text-slate-500">Issued</div>
                    <div className="text-slate-900 text-right">
                      {safeLongDate(completedDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="pt-6 pb-5">
                <div className="text-center">
                  <div className="text-[11px] tracking-[0.22em] text-slate-500 uppercase">
                    Laboratory Department
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    Laboratory Test Report
                    {includeInterpretation && (
                      <span className="text-base font-normal text-slate-500">
                        {" "}
                        — Clinical Copy
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              {/* Info blocks */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                      Patient Information
                    </h3>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Name</span>
                      <span className="font-semibold text-slate-900">
                        {fullName(patient) || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Patient ID</span>
                      <span className="font-semibold text-slate-900">
                        {labTest.patientId || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Age</span>
                      <span className="text-slate-900">{patient?.age ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Gender</span>
                      <span className="text-slate-900">{patient?.gender ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Phone</span>
                      <span className="text-slate-900">
                        {patient?.phoneNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                  <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                    Test Details
                  </h3>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Tests</span>
                      <span className="text-slate-900 font-semibold">
                        {tests.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Result Status</span>
                      <span className="text-slate-900">
                        {resultStatus || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Completed By</span>
                      <span className="text-slate-900">
                        {completedBy || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Completion Date</span>
                      <span className="text-slate-900">
                        {safeLongDate(completedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tests ordered (no chips) */}
              <div className="rounded-xl border border-slate-200 p-5 mb-6 avoid-break">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                    Tests Ordered
                  </h3>
                  <div className="text-xs text-slate-500">
                    Total: <span className="font-semibold text-slate-700">{tests.length}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {tests.length === 0 ? (
                    <div className="text-slate-600">—</div>
                  ) : (
                    tests.map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="text-slate-900">{t}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="mb-6">
                <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-4">
                  <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                    Laboratory Results
                  </h3>
                  <div className="text-xs text-slate-500">
                    Values flagged as abnormal are based on configured normals/ranges.
                  </div>
                </div>

                {Object.entries(results).map(([testName, testData]) => {
                  const fields = resultFields[testName];

                  return (
                    <div
                      key={testName}
                      className="rounded-2xl border border-slate-200 overflow-hidden mb-5 avoid-break"
                    >
                      {/* Section header */}
                      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[11px] tracking-[0.22em] text-slate-500 uppercase">
                              Test Panel
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900 truncate">
                              {testName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Table */}
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-200">
                            <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-slate-600 uppercase" style={{ width: "38%" }}>
                              Parameter
                            </th>
                            <th className="text-center px-5 py-3 text-xs font-semibold tracking-wide text-slate-600 uppercase" style={{ width: "26%" }}>
                              Result
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-slate-600 uppercase" style={{ width: "36%" }}>
                              Reference Range
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                            const config = fields?.[fieldName];

                            let displayValue = value;
                            if (config?.type === "number" && value) {
                              displayValue = formatNumber(value);
                            }

                            const expected = config?.normal ?? config?.range ?? "";
                            const hasExpectation = Boolean(expected);

                            const vNorm = normalizeValue(value);
                            const eNorm = normalizeValue(config?.normal || "");

                            const isNormal =
                              (config?.normal && vNorm === eNorm) ||
                              (!config?.normal && isCommonNormalText(value));

                            const isAbnormal =
                              hasExpectation &&
                              !isNormal &&
                              Boolean(value) &&
                              !isCommonNormalText(value) &&
                              normalizeValue(value) !== normalizeValue(config?.normal || "");

                            const bg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50";

                            return (
                              <tr key={fieldName} className={cx("border-b border-slate-100", bg)}>
                                <td className="px-5 py-3 font-medium text-slate-800">
                                  {fieldName}
                                </td>

                                <td className="px-5 py-3 text-center">
                                  <div className="inline-flex items-center justify-center gap-2">
                                    <span
                                      className={cx(
                                        "font-semibold",
                                        isAbnormal && "text-rose-700",
                                        isNormal && "text-emerald-700",
                                        !isNormal && !isAbnormal && "text-slate-900"
                                      )}
                                    >
                                      {displayValue} {config?.unit || ""}
                                    </span>

                                    {isAbnormal && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold tracking-wide">
                                        ABNORMAL
                                      </span>
                                    )}

                                    {isNormal && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold tracking-wide">
                                        NORMAL
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-5 py-3 text-slate-600">
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

              {/* Clinical Interpretation */}
              {includeInterpretation && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6 avoid-break">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                      Clinical Interpretation
                    </h3>
                  </div>

                  {interpretation.criticalFindings.length > 0 && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-white p-4">
                      <div className="text-sm font-semibold text-rose-800">
                        Critical findings (requires attention)
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-slate-800">
                        {interpretation.criticalFindings.map((f, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interpretation.warnings.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                      <div className="text-sm font-semibold text-amber-900">
                        Notes / warnings
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-slate-800">
                        {interpretation.warnings.map((w, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interpretation.criticalFindings.length === 0 &&
                    interpretation.warnings.length === 0 && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-900 font-medium">
                        All results appear within expected limits. No critical flags detected.
                      </div>
                    )}
                </div>
              )}

              {/* Technician Notes */}
              {technicianNotes && (
                <div className="rounded-2xl border border-slate-200 p-5 mb-6 avoid-break">
                  <h3 className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
                    Technician Notes
                  </h3>
                  <p className="mt-3 text-sm text-slate-800 leading-relaxed">
                    {technicianNotes}
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-10 mt-10 mb-6 avoid-break">
                <div>
                  <div className="border-t border-slate-300 pt-3">
                    <div className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                      Lab Technician
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {completedBy || "—"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-3">
                    <div className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                      Date
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {safeLongDate(completedDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-5 mt-8 border-t border-slate-200 text-center">
                <div className="text-[10px] tracking-[0.22em] text-slate-500 uppercase font-semibold">
                  Computer-generated laboratory report
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  Bahr El Ghazal Clinic
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Accredited Medical Facility • Republic of South Sudan
                </div>
                <div className="mt-3 text-xs italic text-slate-600">
                  Your health is our priority
                </div>
              </div>
            </div>
          </div>

          {/* Small print note (hidden if you want) */}
          <div className="no-print mt-4 text-xs text-slate-500 text-center">
            Tip: In the print dialog, disable “Headers and footers” for a clean, official PDF.
          </div>
        </div>
      </div>
    </div>
  );
}
