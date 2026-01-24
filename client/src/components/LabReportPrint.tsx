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

function normalize(v: any) {
  return (v ?? "").toString().trim().toLowerCase();
}

function isCommonNormalText(v: string) {
  const x = normalize(v);
  return x === "negative" || x === "not seen" || x === "none" || x === "normal";
}

/**
 * Attempts to parse a numeric range from strings like:
 * "13.5-17.5 g/dL (Male)" or "70-110 (fasting)" or "4,000-11,000 /µL"
 */
function parseNumericRange(rangeText?: string) {
  if (!rangeText) return null;
  const cleaned = rangeText.replace(/,/g, "");
  const nums = cleaned.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length >= 2) {
    const min = Math.min(nums[0], nums[1]);
    const max = Math.max(nums[0], nums[1]);
    return { min, max };
  }
  return null;
}

function tryParseNumber(v: string) {
  const n = Number((v ?? "").toString().replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) ? n : null;
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

  const completedDate = formValues?.completedDate || labTest.completedDate;
  const resultStatus = formValues?.resultStatus || labTest.resultStatus;
  const completedBy = formValues?.completedBy || labTest.completedBy;
  const technicianNotes = formValues?.technicianNotes || labTest.technicianNotes;

  const patientName = fullName(patient) || "—";
  const patientAge = patient?.age ?? "—";
  const patientGender = patient?.gender ?? "—";

  return (
    <div id={containerId} className="prescription" style={{ minHeight: "auto", height: "auto" }}>
      {/* Print tuning */}
      <style>{`
        @media print {
          @page { margin: 14mm; }
          #${containerId} { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #${containerId} .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Page background like your screenshot */}
      <div className="bg-slate-100 py-8">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
            {/* HEADER BAR (navy gradient) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Bahr El Ghazal Clinic
                  </h1>
                  <p className="mt-1 text-sm text-slate-200">
                    Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760
                  </p>
                </div>

                {/* Circle badge (logo in a ring) */}
                <div className="w-14 h-14 rounded-full border-4 border-white/90 bg-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={clinicLogo}
                    alt="BGC"
                    className="w-full h-full object-contain bg-white"
                    onError={(e) => {
                      // if image fails, show BG letters
                      const el = e.currentTarget;
                      el.style.display = "none";
                    }}
                  />
                  <span className="font-bold text-lg tracking-wide">BG</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-7">
              {/* SECTION STRIP: TITLE */}
              <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 rounded-lg">
                <div className="text-blue-800 font-semibold tracking-widest text-sm uppercase">
                  Laboratory Test Report
                </div>
              </div>

              {/* INFO CARD */}
              <div className="mt-6 rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Patient Name
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {patientName}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Patient ID
                    </div>
                    <div className="font-semibold text-slate-900">
                      {labTest.patientId || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Test ID
                    </div>
                    <div className="font-semibold text-slate-900">
                      {labTest.testId || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Age
                    </div>
                    <div className="font-semibold text-slate-900">
                      {patientAge} {patientAge !== "—" ? "years" : ""}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Gender
                    </div>
                    <div className="font-semibold text-slate-900">
                      {patientGender}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Completed Date
                    </div>
                    <div className="font-semibold text-slate-900">
                      {safeLongDate(completedDate)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Category
                    </div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {labTest.category || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Priority
                    </div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {labTest.priority || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Status
                    </div>
                    <div className="font-semibold text-slate-900">
                      {resultStatus || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION STRIP: RESULTS */}
              <div className="mt-7 bg-blue-50 border-l-4 border-blue-600 px-6 py-4 rounded-lg">
                <div className="text-blue-800 font-semibold tracking-widest text-sm uppercase">
                  Laboratory Results
                </div>
              </div>

              {/* RESULTS TABLE WRAPPER */}
              <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden shadow-sm avoid-break">
                <table className="w-full border-collapse text-sm">
                  {/* Table header (dark blue) */}
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs" style={{ width: "44%" }}>
                        Parameter
                      </th>
                      <th className="text-center px-6 py-4 font-semibold uppercase tracking-wider text-xs" style={{ width: "22%" }}>
                        Result
                      </th>
                      <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs" style={{ width: "34%" }}>
                        Normal Range
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(results).length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-slate-600" colSpan={3}>
                          No results available.
                        </td>
                      </tr>
                    )}

                    {Object.entries(results).map(([testName, testData], groupIdx) => {
                      const fields = resultFields[testName] || {};

                      return (
                        <>
                          {/* Group row (light blue) */}
                          <tr key={`group-${testName}`} className="bg-blue-50">
                            <td className="px-6 py-3 font-semibold text-blue-900" colSpan={3}>
                              {testName}
                            </td>
                          </tr>

                          {Object.entries(testData).map(([fieldName, rawValue], rowIdx) => {
                            const config = fields?.[fieldName];
                            const value = rawValue ?? "";
                            const unit = config?.unit ? ` ${config.unit}` : "";
                            const rangeText = config?.normal || config?.range || "—";

                            // Determine status (NORMAL / LOW / HIGH / ABNORMAL)
                            const numeric = config?.type === "number" ? tryParseNumber(value) : null;
                            const range = parseNumericRange(rangeText);

                            let status: "NORMAL" | "LOW" | "HIGH" | "ABNORMAL" | "" = "";
                            let isAbnormal = false;

                            if (numeric !== null && range) {
                              if (numeric < range.min) {
                                status = "LOW";
                                isAbnormal = true;
                              } else if (numeric > range.max) {
                                status = "HIGH";
                                isAbnormal = true;
                              } else {
                                status = "NORMAL";
                              }
                            } else {
                              // Text-based logic:
                              if (config?.normal) {
                                const same = normalize(value) === normalize(config.normal);
                                if (same || isCommonNormalText(value)) status = "NORMAL";
                                else {
                                  status = "HIGH"; // matches your screenshot style for positive detections
                                  isAbnormal = true;
                                }
                              } else {
                                if (isCommonNormalText(value)) status = "NORMAL";
                                else if (value) {
                                  // If value is not an obvious "normal" term, treat as abnormal
                                  status = "ABNORMAL";
                                  isAbnormal = true;
                                }
                              }
                            }

                            const displayValue =
                              config?.type === "number" && numeric !== null
                                ? new Intl.NumberFormat("en-US").format(numeric)
                                : value;

                            const stripe = rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50";

                            return (
                              <tr key={`${testName}-${fieldName}`} className={cx("border-t border-slate-200", stripe)}>
                                <td className="px-6 py-4 text-slate-700">
                                  {fieldName}
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <div className="inline-flex items-center gap-2 justify-center">
                                    <span
                                      className={cx(
                                        "font-semibold",
                                        isAbnormal && "text-red-600",
                                        !isAbnormal && status === "NORMAL" && "text-emerald-700",
                                        !isAbnormal && status !== "NORMAL" && "text-slate-900"
                                      )}
                                    >
                                      {displayValue}{unit}
                                    </span>

                                    {/* Pill badge */}
                                    {status && status !== "NORMAL" && (
                                      <span
                                        className={cx(
                                          "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                                          status === "LOW" && "bg-orange-100 text-orange-700",
                                          status === "HIGH" && "bg-red-100 text-red-700",
                                          status === "ABNORMAL" && "bg-red-100 text-red-700"
                                        )}
                                      >
                                        {status}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-slate-500">
                                  {rangeText}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Optional Interpretation (kept clean, no emojis) */}
              {includeInterpretation && (
                <div className="mt-6 rounded-2xl border border-slate-200 p-5 bg-white avoid-break">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Clinical Interpretation
                  </div>

                  {(interpretation.criticalFindings.length > 0 ||
                    interpretation.warnings.length > 0) ? (
                    <div className="mt-3 space-y-3 text-sm text-slate-800">
                      {interpretation.criticalFindings.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <div className="font-semibold text-red-800">
                            Critical Findings
                          </div>
                          <ul className="mt-2 list-disc ml-5 space-y-1">
                            {interpretation.criticalFindings.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {interpretation.warnings.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <div className="font-semibold text-amber-900">
                            Notes / Warnings
                          </div>
                          <ul className="mt-2 list-disc ml-5 space-y-1">
                            {interpretation.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 font-medium">
                      All results appear within expected limits. No critical flags detected.
                    </div>
                  )}
                </div>
              )}

              {/* Technician notes */}
              {technicianNotes && (
                <div className="mt-6 rounded-2xl border border-slate-200 p-5 bg-white avoid-break">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Technician Notes
                  </div>
                  <p className="mt-2 text-sm text-slate-800 leading-relaxed">
                    {technicianNotes}
                  </p>
                </div>
              )}

              {/* Footer row like screenshot */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between text-sm">
                <div>
                  <div className="text-xs text-slate-500">Lab Technician</div>
                  <div className="font-semibold text-slate-900">
                    {completedBy || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Report Date</div>
                  <div className="font-semibold text-slate-900">
                    {safeLongDate(completedDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom dark bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white text-center py-6">
              <div className="font-semibold">Bahr El Ghazal Clinic</div>
              <div className="text-sm text-slate-200 mt-1">
                Accredited Medical Facility | Republic of South Sudan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
