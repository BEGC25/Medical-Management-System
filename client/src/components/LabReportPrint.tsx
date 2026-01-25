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

    // Optional fields (kept for compatibility if your data already has them)
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
    reportedDate?: string;
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

function formatAgeCompact(age: any) {
  if (age === null || age === undefined || age === "") return "—";
  const s = String(age).trim();
  if (/[a-zA-Z]/.test(s)) return s;
  const n = Number(s);
  if (Number.isFinite(n)) return String(n);
  return s;
}

function isCommonNormalText(v: string) {
  const x = normalize(v);
  return x === "negative" || x === "not seen" || x === "none" || x === "normal";
}

interface NumericRange {
  min: number;
  max: number;
  isMinimumOnly: boolean;
}

function parseNumericRange(rangeText?: string): NumericRange | null {
  if (!rangeText) return null;
  const cleaned = rangeText.replace(/,/g, "");

  // Handle "minimum+" like "8+ hours" (supports decimals too)
  const minPlusMatch = cleaned.match(/(-?\d+(?:\.\d+)?)\s*\+/);
  if (minPlusMatch) {
    return { min: Number(minPlusMatch[1]), max: Number.MAX_SAFE_INTEGER, isMinimumOnly: true };
  }

  const nums = cleaned.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length >= 2) {
    const min = Math.min(nums[0], nums[1]);
    const max = Math.max(nums[0], nums[1]);
    return { min, max, isMinimumOnly: false };
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
      const numeric = config?.type === "number" ? tryParseNumber(value) : null;
      const range = parseNumericRange(rangeText);

      if (numeric !== null && range) {
        if (range.isMinimumOnly) {
          if (numeric < range.min) {
            abnormal = true;
            break;
          }
        } else {
          if (numeric < range.min || numeric > range.max) {
            abnormal = true;
            break;
          }
        }
      } else if (config?.normal) {
        const same = normalize(value) === normalize(config.normal);
        if (!same && !isCommonNormalText(value)) {
          abnormal = true;
          break;
        }
      } else {
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

function computeCategoryLabel(labTestCategory: string | undefined, panelCount: number) {
  const c = (labTestCategory ?? "").trim();
  if (panelCount > 1) return "Mixed / Multi-panel";
  return c || "—";
}

function computeStatusLabel(resultStatus?: string) {
  const s = (resultStatus ?? "").trim();
  if (!s) return "Final";
  const n = normalize(s);
  if (n === "normal" || n === "abnormal") return "Final";
  return titleCase(s);
}

function normalizeSpaces(v: string) {
  return (v ?? "").toString().replace(/\s+/g, " ").trim();
}

function shouldPreserveOriginalDisplay(value: string) {
  // Keep qualifiers intact: 14+ hours, >5, <1, etc.
  return /[+<>]/.test(value);
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

  const interpretation = includeInterpretation
    ? interpretLabResults(results)
    : { criticalFindings: [] as string[], warnings: [] as string[] };

  const reportedDate =
    formValues?.reportedDate ||
    labTest.reportedDate ||
    labTest.completedDate ||
    undefined;

  const rawStatus = formValues?.resultStatus || labTest.resultStatus;
  const statusLabel = computeStatusLabel(rawStatus);

  const completedBy = formValues?.completedBy || labTest.completedBy;
  const technicianNotes = formValues?.technicianNotes || labTest.technicianNotes;

  const patientName = fullName(patient) || "—";
  const panelCount = Object.keys(results || {}).length;
  const categoryLabel = computeCategoryLabel(labTest.category, panelCount);

  const overall = computeOverallFlag(results, resultFields);

  // Keep Priority only for clinical/internal copy (you asked if we need it)
  const showPriority = Boolean(includeInterpretation);
  const priorityLabel = titleCase(labTest.priority);

  const testCount = Array.isArray(tests) ? tests.length : 0;

  return (
    <div id={containerId} className="prescription" style={{ minHeight: "auto", height: "auto" }}>
      <style>{`
        /* Screen wrapper */
        #${containerId} .page-wrap { max-width: 1024px; margin: 0 auto; }

        @media print {
          /* Reduce page margins to give the table more room */
          @page { margin: 10mm; }

          html, body { margin: 0 !important; padding: 0 !important; }
          #${containerId} { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* IMPORTANT: remove width cap during printing */
          #${containerId} .page-wrap { max-width: none !important; width: 100% !important; margin: 0 !important; }
          #${containerId} .print-shell { background: #fff !important; padding: 0 !important; }
          #${containerId} .print-page { box-shadow: none !important; width: 100% !important; max-width: none !important; }
          #${containerId} .print-tight-x { padding-left: 16px !important; padding-right: 16px !important; }

          /* Make header and table feel less "squeezed" */
          #${containerId} .print-header-x { padding-left: 16px !important; padding-right: 16px !important; }

          /* Keep sections together when possible */
          #${containerId} .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          #${containerId} tbody.panel-block { break-inside: avoid; page-break-inside: avoid; }

          /* Cleaner row density for print */
          #${containerId} .print-table th { padding-top: 12px !important; padding-bottom: 12px !important; }
          #${containerId} .print-table td { padding-top: 11px !important; padding-bottom: 11px !important; }

          /* Prevent “Result” column from wrapping in print */
          #${containerId} .print-nowrap { white-space: nowrap !important; }
        }
      `}</style>

      <div className="bg-slate-100 py-8 print-shell">
        <div className="page-wrap">
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200 print-page">
            {/* HEADER */}
            <div className="bg-white px-8 py-6 avoid-break print-header-x">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-blue-900">Bahr El Ghazal Clinic</h1>
                  <p className="mt-1 text-base italic text-slate-600">Excellence in Healthcare</p>

                  <div className="mt-2 space-y-0.5 text-sm text-slate-700">
                    <div>Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760</div>
                    <div>Email: info@bahrghazalclinic.ss</div>
                  </div>
                </div>

                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  <img
                    src={clinicLogo}
                    alt="Bahr El Ghazal Clinic Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Premium divider (like your screenshot) */}
              <div className="mt-4 h-[2px] bg-blue-700 rounded-full" />
            </div>

            <div className="px-8 py-6 print-tight-x">
              {/* TITLE */}
              <div className="text-center py-3 avoid-break">
                <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-slate-900">
                  LABORATORY TEST REPORT
                </h2>
                {includeInterpretation && <p className="mt-1 text-sm text-slate-600">(Clinical Copy)</p>}
              </div>

              {/* TWO-BOX LAYOUT */}
              <div className="mt-5 grid grid-cols-2 gap-5 avoid-break items-stretch">
                {/* Patient Information */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
                  <div className="text-lg font-extrabold tracking-wide text-slate-900 uppercase">
                    Patient Information
                  </div>
                  <div className="h-[3px] bg-blue-900 mt-3 mb-5 rounded-full" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-semibold text-slate-600">Name:</div>
                      <div className="font-bold text-slate-900 text-right break-words leading-snug">
                        {patientName}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Patient ID:</div>
                      <div className="font-bold text-blue-800 tabular-nums">{labTest.patientId || "—"}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Age:</div>
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatAgeCompact(patient?.age)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Gender:</div>
                      <div className="font-bold text-slate-900">{patient?.gender || "—"}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Phone:</div>
                      <div className="font-bold text-slate-900 tabular-nums">{patient?.phoneNumber || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Test Details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
                  <div className="text-lg font-extrabold tracking-wide text-slate-900 uppercase">
                    Test Details
                  </div>
                  <div className="h-[3px] bg-blue-900 mt-3 mb-5 rounded-full" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Test ID:</div>
                      <div className="font-bold text-blue-800 tabular-nums">{labTest.testId || "—"}</div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="font-semibold text-slate-600">Category:</div>
                      <div className="font-bold text-slate-900 text-right break-words leading-snug">
                        {categoryLabel}
                      </div>
                    </div>

                    {showPriority && (
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-slate-600">Priority:</div>
                        <div className="font-bold text-slate-900">{priorityLabel}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Tests:</div>
                      <div className="font-bold text-slate-900 tabular-nums">{testCount}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Date:</div>
                      <div className="font-bold text-slate-900">{safeLongDate(reportedDate)}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Status:</div>
                      <div className="font-bold text-slate-900">{statusLabel}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-slate-600">Overall:</div>
                      <div
                        className={cx(
                          "font-bold",
                          overall === "Abnormal" ? "text-red-700" : "text-emerald-700"
                        )}
                      >
                        {overall}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TESTS ORDERED */}
              <div className="mt-5 avoid-break">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Tests Ordered
                </div>
                <div className="flex flex-wrap gap-2">
                  {tests.map((test, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-300"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION STRIP */}
              <div className="mt-5 bg-blue-50 border-l-4 border-blue-600 px-6 py-3 rounded-lg avoid-break">
                <div className="text-blue-800 font-semibold tracking-widest text-sm uppercase">
                  Laboratory Results
                </div>
              </div>

              {/* RESULTS TABLE */}
              <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm table-fixed print-table">
                  <colgroup>
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "36%" }} />
                  </colgroup>

                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                        Test Name
                      </th>
                      <th className="text-center px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                        Result
                      </th>
                      <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                        Normal Range
                      </th>
                    </tr>
                  </thead>

                  {/* Empty state */}
                  {Object.entries(results).length === 0 && (
                    <tbody>
                      <tr>
                        <td className="px-6 py-6 text-slate-600" colSpan={3}>
                          No results available.
                        </td>
                      </tr>
                    </tbody>
                  )}

                  {/* Each panel gets its own tbody (fixes key + improves print page-break behavior) */}
                  {Object.entries(results).map(([panelName, panel]) => {
                    const fields = resultFields[panelName] || {};

                    return (
                      <tbody key={panelName} className="panel-block">
                        <tr className="bg-blue-50">
                          <td className="px-6 py-3 font-semibold text-blue-900" colSpan={3}>
                            {panelName}
                          </td>
                        </tr>

                        {Object.entries(panel).map(([testItemName, rawValue], rowIdx) => {
                          const config = fields[testItemName];
                          const raw = normalizeSpaces((rawValue ?? "").toString());
                          const value = raw || "—";

                          const unit = (config?.unit ?? "").trim();
                          const unitAlreadyInValue =
                            unit && normalize(value).includes(normalize(unit));
                          const unitSuffix = unit && !unitAlreadyInValue ? ` ${unit}` : "";

                          const rangeText = config?.normal || config?.range || "—";

                          const valueHasPlus = /\d+\+/.test(value);
                          const rangeHasPlus = /\d+\+/.test(rangeText);
                          const shouldTryNumeric = config?.type === "number" || (valueHasPlus && rangeHasPlus);

                          const numeric = shouldTryNumeric ? tryParseNumber(value) : null;
                          const range = parseNumericRange(rangeText);

                          let isAbnormal = false;
                          if (numeric !== null && range) {
                            if (range.isMinimumOnly) {
                              if (numeric < range.min) isAbnormal = true;
                            } else {
                              if (numeric < range.min || numeric > range.max) isAbnormal = true;
                            }
                          } else if (config?.normal) {
                            const same = normalize(value) === normalize(config.normal);
                            if (!same && !isCommonNormalText(value) && value !== "—") isAbnormal = true;
                          } else {
                            if (value !== "—" && !isCommonNormalText(value)) isAbnormal = true;
                          }

                          // ✅ Preserve qualifiers like "14+ hours" while still using numeric for comparisons
                          const displayValue =
                            config?.type === "number" && numeric !== null && !shouldPreserveOriginalDisplay(value)
                              ? new Intl.NumberFormat("en-US").format(numeric)
                              : value;

                          const stripe = rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50";

                          return (
                            <tr
                              key={`${panelName}-${testItemName}`}
                              className={cx("border-t border-slate-200", stripe)}
                            >
                              <td className="px-6 py-4 text-slate-700 font-medium">
                                {testItemName}
                              </td>

                              <td className="px-6 py-4 text-center tabular-nums">
                                <span
                                  className={cx(
                                    isAbnormal ? "text-red-600 font-bold" : "text-slate-900 font-semibold",
                                    "print-nowrap"
                                  )}
                                >
                                  {displayValue}
                                  {unitSuffix}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-slate-500 leading-snug break-words">
                                {rangeText}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
                </table>
              </div>

              {/* Clinical interpretation */}
              {includeInterpretation && (
                <div className="mt-5 rounded-2xl border border-slate-200 p-5 bg-white avoid-break">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Clinical Interpretation
                  </div>

                  {(interpretation.criticalFindings.length > 0 || interpretation.warnings.length > 0) ? (
                    <div className="mt-3 space-y-3 text-sm text-slate-800">
                      {interpretation.criticalFindings.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <div className="font-semibold text-red-800">Critical Findings</div>
                          <ul className="mt-2 list-disc ml-5 space-y-1">
                            {interpretation.criticalFindings.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {interpretation.warnings.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <div className="font-semibold text-amber-900">Notes / Warnings</div>
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
                <div className="mt-5 rounded-2xl border border-slate-200 p-5 bg-white avoid-break">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Technician Notes
                  </div>
                  <p className="mt-2 text-sm text-slate-800 leading-relaxed">{technicianNotes}</p>
                </div>
              )}

              {/* Footer row */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-sm avoid-break">
                <div>
                  <div className="text-xs text-slate-500">Lab Technician</div>
                  <div className="font-semibold text-slate-900">{completedBy || "—"}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Report Date</div>
                  <div className="font-semibold text-slate-900">{safeLongDate(reportedDate)}</div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white text-center py-6">
              <div className="font-semibold text-lg">Bahr El Ghazal Clinic</div>
              <div className="text-sm text-blue-100 mt-1">
                Accredited Medical Facility | Republic of South Sudan
              </div>
              <div className="text-xs text-blue-200 mt-1 italic">
                Your health is our priority
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
