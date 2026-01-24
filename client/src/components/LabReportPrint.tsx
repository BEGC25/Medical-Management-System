// client/src/components/LabReportPrint.tsx
import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { formatLongDate } from "@/lib/date-utils";

/**
 * Premium lab report print layout (billion-dollar polish)
 * Improvements included:
 * 1) Category handling:
 *    - If multiple panels exist → shows "Mixed / Multi-panel"
 * 2) Status vs Overall:
 *    - "Status" reflects workflow state (Final / Completed / Verified)
 *    - Adds "Overall" computed from results: Normal / Abnormal
 * 3) Priority:
 *    - Shown ONLY for clinical copy (includeInterpretation=true)
 * 4) Adds Reported Time / Collected Time (if available in formValues)
 * 5) Adds Page numbering "Page X of Y" (print-safe, no external deps)
 * 6) Result column nowrap + slightly wider to avoid ugly wrapping
 * 7) Fixes Age formatting (no "years years")
 * 8) Print tuning: remove gray shell/shadow in print and reduce blank areas
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

    // Optional (only used if you already have these in your data)
    collectedDate?: string;
    reportedDate?: string;
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

    // Add these in your form if you want them displayed
    collectedDate?: string;
    reportedDate?: string;
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

function titleCase(v?: string) {
  if (!v) return "—";
  const s = v.trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—";
}

function formatAge(age: any) {
  if (age === null || age === undefined || age === "") return "—";
  const s = String(age).trim();
  if (/year/i.test(s)) return s; // already includes years
  const n = Number(s);
  if (Number.isFinite(n)) return `${n} years`;
  return s;
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
  const m = (v ?? "").toString().replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function computeOverallFlag(
  results: Record<string, Record<string, string>>,
  resultFields: LabReportPrintProps["resultFields"]
): "Normal" | "Abnormal" {
  let abnormal = false;

  for (const [panelName, panel] of Object.entries(results)) {
    const fields = resultFields[panelName] || {};

    for (const [fieldName, rawValue] of Object.entries(panel)) {
      const config = fields[fieldName];
      const value = (rawValue ?? "").toString().trim();

      if (!value) continue;

      const rangeText = config?.normal || config?.range;
      const numeric =
        config?.type === "number" ? tryParseNumber(value) : null;
      const range = parseNumericRange(rangeText);

      if (numeric !== null && range) {
        if (numeric < range.min || numeric > range.max) {
          abnormal = true;
          break;
        }
      } else if (config?.normal) {
        const same = normalize(value) === normalize(config.normal);
        if (!same && !isCommonNormalText(value)) {
          abnormal = true;
          break;
        }
      } else {
        // No explicit normal: only mark abnormal if it’s clearly not normal text
        if (!isCommonNormalText(value)) {
          abnormal = true;
          break;
        }
      }
    }

    if (abnormal) break;
  }

  return abnormal ? "Abnormal" : "Normal";
}

function computeCategoryLabel(
  labTestCategory: string | undefined,
  panelCount: number
) {
  const c = (labTestCategory ?? "").trim();
  if (panelCount > 1) return "Mixed / Multi-panel";
  return c || "—";
}

function computeStatusLabel(resultStatus?: string) {
  // Prefer workflow-like terms. If your DB already sends "Final", "Completed", etc. we keep it.
  const s = (resultStatus ?? "").trim();
  if (!s) return "Final";
  // Normalize common inputs like "normal" into workflow-friendly status
  const n = normalize(s);
  if (n === "normal" || n === "abnormal") return "Final";
  return titleCase(s);
}

/**
 * Page numbering (no runtime measurement libs).
 * Works in print reliably using CSS counters.
 */
function PageCounterStyles() {
  return (
    <style>{`
      @media print {
        .print-page-number:after {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
    `}</style>
  );
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
  const reportedDate = formValues?.reportedDate || labTest.reportedDate;
  const collectedDate = formValues?.collectedDate || labTest.collectedDate;

  const rawStatus = formValues?.resultStatus || labTest.resultStatus;
  const completedBy = formValues?.completedBy || labTest.completedBy;
  const technicianNotes = formValues?.technicianNotes || labTest.technicianNotes;

  const patientName = fullName(patient) || "—";
  const panelCount = Object.keys(results || {}).length;
  const categoryLabel = computeCategoryLabel(labTest.category, panelCount);

  const overall = computeOverallFlag(results, resultFields);
  const statusLabel = computeStatusLabel(rawStatus);

  // Show priority only for clinical copy
  const showPriority = Boolean(includeInterpretation);
  const priorityLabel = titleCase(labTest.priority);

  return (
    <div id={containerId} className="prescription" style={{ minHeight: "auto", height: "auto" }}>
      {/* Print tuning */}
      <style>{`
        @media print {
          @page { margin: 14mm; }
          #${containerId} { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #${containerId} .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          #${containerId} .print-shell { background: #fff !important; padding: 0 !important; }
          #${containerId} .print-page { box-shadow: none !important; border-color: #e5e7eb !important; }
        }
      `}</style>
      <PageCounterStyles />

      {/* Screen background like your reference; removed in print */}
      <div className="bg-slate-100 py-8 print-shell">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200 print-page">
            {/* HEADER BAR */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white avoid-break">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Bahr El Ghazal Clinic
                  </h1>
                  <p className="mt-1 text-sm text-slate-200">
                    Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760
                  </p>
                </div>

                {/* Circle badge: ONLY your logo */}
                <div className="w-14 h-14 rounded-full border-4 border-white/90 bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={clinicLogo}
                    alt="Bahr El Ghazal Clinic"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-7">
              {/* SECTION STRIP: TITLE */}
              <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 rounded-lg avoid-break">
                <div className="text-blue-800 font-semibold tracking-widest text-sm uppercase">
                  Laboratory Test Report
                  {includeInterpretation && (
                    <span className="ml-3 text-blue-700/80 font-medium tracking-wide normal-case">
                      (Clinical Copy)
                    </span>
                  )}
                </div>
              </div>

              {/* INFO CARD */}
              <div className="mt-6 rounded-2xl border border-slate-200 shadow-sm p-6 avoid-break">
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
                      Test ID / Accession
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
                      {formatAge(patient?.age)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Gender
                    </div>
                    <div className="font-semibold text-slate-900">
                      {patient?.gender || "—"}
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
                    <div className="font-semibold text-slate-900">
                      {categoryLabel}
                    </div>
                  </div>

                  {showPriority ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">
                        Priority
                      </div>
                      <div className="font-semibold text-slate-900">
                        {priorityLabel}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Status
                    </div>
                    <div className="font-semibold text-slate-900">
                      {statusLabel}
                    </div>
                  </div>

                  {/* NEW: Overall flag */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Overall
                    </div>
                    <div
                      className={cx(
                        "font-semibold",
                        overall === "Abnormal" ? "text-red-700" : "text-emerald-700"
                      )}
                    >
                      {overall}
                    </div>
                  </div>

                  {/* NEW: Collected / Reported (only if present) */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Collected
                    </div>
                    <div className="font-semibold text-slate-900">
                      {collectedDate ? safeLongDate(collectedDate) : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Reported
                    </div>
                    <div className="font-semibold text-slate-900">
                      {reportedDate ? safeLongDate(reportedDate) : safeLongDate(completedDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION STRIP: RESULTS */}
              <div className="mt-7 bg-blue-50 border-l-4 border-blue-600 px-6 py-4 rounded-lg avoid-break">
                <div className="text-blue-800 font-semibold tracking-widest text-sm uppercase">
                  Laboratory Results
                </div>
              </div>

              {/* RESULTS TABLE WRAPPER (NO avoid-break to avoid blank space) */}
              <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th
                        className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs"
                        style={{ width: "48%" }}
                      >
                        Test Name
                      </th>
                      <th
                        className="text-center px-6 py-4 font-semibold uppercase tracking-wider text-xs"
                        style={{ width: "26%" }}
                      >
                        Result
                      </th>
                      <th
                        className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs"
                        style={{ width: "26%" }}
                      >
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

                    {Object.entries(results).map(([panelName, panel]) => {
                      const fields = resultFields[panelName] || {};

                      return (
                        <>
                          <tr key={`group-${panelName}`} className="bg-blue-50">
                            <td className="px-6 py-3 font-semibold text-blue-900" colSpan={3}>
                              {panelName}
                            </td>
                          </tr>

                          {Object.entries(panel).map(([testItemName, rawValue], rowIdx) => {
                            const config = fields[testItemName];
                            const value = (rawValue ?? "").toString().trim();
                            const unit = config?.unit ? ` ${config.unit}` : "";
                            const rangeText = config?.normal || config?.range || "—";

                            // Abnormal = red text only (no HIGH/LOW badges)
                            const numeric =
                              config?.type === "number" ? tryParseNumber(value) : null;
                            const range = parseNumericRange(rangeText);

                            let isAbnormal = false;

                            if (numeric !== null && range) {
                              if (numeric < range.min || numeric > range.max) isAbnormal = true;
                            } else if (config?.normal) {
                              const same = normalize(value) === normalize(config.normal);
                              if (!same && !isCommonNormalText(value) && Boolean(value)) isAbnormal = true;
                            } else {
                              if (value && !isCommonNormalText(value)) isAbnormal = true;
                            }

                            const displayValue =
                              config?.type === "number" && numeric !== null
                                ? new Intl.NumberFormat("en-US").format(numeric)
                                : value;

                            const stripe = rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50";

                            return (
                              <tr
                                key={`${panelName}-${testItemName}`}
                                className={cx("border-t border-slate-200", stripe)}
                              >
                                <td className="px-6 py-4 text-slate-700">
                                  {testItemName}
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <span
                                    className={cx(
                                      "font-semibold whitespace-nowrap",
                                      isAbnormal ? "text-red-600" : "text-slate-900"
                                    )}
                                  >
                                    {displayValue}
                                    {unit}
                                  </span>
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

              {/* Optional interpretation stays clean */}
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

              {/* Footer row */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between text-sm avoid-break">
                <div>
                  <div className="text-xs text-slate-500">Lab Technician</div>
                  <div className="font-semibold text-slate-900">
                    {completedBy || "—"}
                  </div>
                </div>

                {/* Page number (print only) */}
                <div className="text-center text-xs text-slate-500">
                  <span className="print-page-number" />
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Report Date</div>
                  <div className="font-semibold text-slate-900">
                    {safeLongDate(reportedDate || completedDate)}
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
