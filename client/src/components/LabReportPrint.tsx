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

function normalizeSpaces(v: string) {
  return (v ?? "").toString().replace(/\s+/g, " ").trim();
}

function formatAgeCompact(age: any) {
  if (age === null || age === undefined || age === "") return "—";
  const s = String(age).trim();
  if (/[a-zA-Z]/.test(s)) return s;
  const n = Number(s);
  if (Number.isFinite(n)) return String(n);
  return s;
}

function genderInitial(g?: string) {
  const n = normalize(g);
  if (!n) return "";
  if (n.startsWith("m")) return "M";
  if (n.startsWith("f")) return "F";
  return (g ?? "").trim().charAt(0).toUpperCase();
}

/** ✅ requested: 30/M */
function formatAgeGender(age: any, gender?: string) {
  const a = formatAgeCompact(age);
  if (a === "—") return "—";
  const gi = genderInitial(gender);
  return gi ? `${a}/${gi}` : a;
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

function shouldPreserveOriginalDisplay(value: string) {
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

  // kept for future use (not printed in this layout)
  const _interpretation = includeInterpretation
    ? interpretLabResults(results, patient ?? undefined)
    : { criticalFindings: [] as string[], warnings: [] as string[] };

  const reportedDate =
    formValues?.reportedDate ||
    labTest.reportedDate ||
    labTest.completedDate ||
    undefined;

  const completedBy = formValues?.completedBy || labTest.completedBy;
  const technicianNotes = formValues?.technicianNotes || labTest.technicianNotes;

  const patientName = fullName(patient) || "—";
  const testCount = Array.isArray(tests) ? tests.length : 0;

  const patientId = labTest.patientId || "—";
  const phone = patient?.phoneNumber || "—";
  const ageGender = formatAgeGender(patient?.age, patient?.gender);

  return (
    <div id={containerId} className="prescription" style={{ minHeight: "auto", height: "auto" }}>
      <style>{`
        #${containerId} .page-wrap { max-width: 1024px; margin: 0 auto; }

        @media print {
          /* ✅ most consistent with “Margins: None”, and prevents tiny overflow that creates blank page */
          @page { margin: 0mm; }

          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; height: auto !important; }
          #${containerId} { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; padding: 0 !important; min-height: 0 !important; height: auto !important; }
          #${containerId}.prescription { min-height: 0 !important; height: auto !important; }

          /* Remove screen padding/background bars in print */
          #${containerId} .print-shell { background: #fff !important; padding: 0 !important; margin: 0 !important; }
          #${containerId} .print-shell.py-8 { padding: 0 !important; }
          #${containerId} .print-shell.bg-slate-100 { background: #fff !important; }

          /* Full width in print */
          #${containerId} .page-wrap { max-width: none !important; width: 100% !important; margin: 0 !important; }
          #${containerId} .print-page {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          /* Tight horizontal & vertical padding to avoid “extra 2px -> blank page” */
          #${containerId} .print-header-x { padding-left: 10px !important; padding-right: 10px !important; padding-top: 10px !important; padding-bottom: 10px !important; }
          #${containerId} .print-tight-x { padding-left: 10px !important; padding-right: 10px !important; padding-top: 10px !important; padding-bottom: 10px !important; }

          /* Keep blocks from splitting */
          #${containerId} .avoid-break { break-inside: avoid; page-break-inside: avoid; }

          /* Table: repeat header and break cleanly */
          #${containerId} table { page-break-inside: auto; }
          #${containerId} thead { display: table-header-group; }
          #${containerId} tfoot { display: table-footer-group; }
          #${containerId} tr { break-inside: avoid; page-break-inside: avoid; }

          /* Dense print rows */
          #${containerId} .print-table th { padding-top: 10px !important; padding-bottom: 10px !important; }
          #${containerId} .print-table td { padding-top: 9px !important; padding-bottom: 9px !important; }

          #${containerId} .print-nowrap { white-space: nowrap !important; }
        }
      `}</style>

      <div className="bg-slate-100 py-8 print-shell">
        <div className="page-wrap">
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200 print-page">
            {/* HEADER */}
            <div className="bg-white px-6 py-5 print-header-x avoid-break">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight text-blue-900">
                    Bahr El Ghazal Clinic
                  </h1>
                  <p className="mt-0.5 text-[15px] italic text-slate-600">
                    Excellence in Healthcare
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[13px] text-slate-700">
                    <div>Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760</div>
                    <div>Email: info@bahrghazalclinic.ss</div>
                  </div>
                </div>

                {/* Logo size stays premium */}
                <div className="w-[72px] h-[72px] flex items-center justify-center overflow-hidden">
                  <img
                    src={clinicLogo}
                    alt="Bahr El Ghazal Clinic Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-3 h-[2px] bg-blue-700 rounded-full" />
            </div>

            {/* CONTENT */}
            <div className="px-6 py-5 print-tight-x">
              {/* TITLE */}
              <div className="text-center py-2 avoid-break">
                <h2 className="text-[16px] font-bold tracking-[0.28em] uppercase text-slate-900">
                  LABORATORY TEST REPORT
                </h2>
              </div>

              {/* TWO-BOX LAYOUT */}
              <div className="mt-4 grid grid-cols-2 gap-4 items-stretch avoid-break">
                {/* Patient Information */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 h-full">
                  <div className="text-[14px] font-extrabold tracking-wider text-slate-900 uppercase">
                    Patient Information
                  </div>
                  <div className="h-[3px] bg-blue-900 mt-2.5 mb-3.5 rounded-full" />

                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-slate-600">Name:</div>
                      <div className="font-bold text-slate-900 text-right leading-snug break-words">
                        {patientName}
                      </div>
                    </div>

                    {/* ✅ separate Patient ID */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Patient ID:</div>
                      <div className="font-bold text-blue-800 tabular-nums text-right">
                        {patientId}
                      </div>
                    </div>

                    {/* ✅ separate Phone */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Phone:</div>
                      <div className="font-bold text-slate-900 tabular-nums text-right">
                        {phone}
                      </div>
                    </div>

                    {/* ✅ 30/M */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Age/Gender:</div>
                      <div className="font-bold text-slate-900 tabular-nums">{ageGender}</div>
                    </div>
                  </div>
                </div>

                {/* Test Details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 h-full">
                  <div className="text-[14px] font-extrabold tracking-wider text-slate-900 uppercase">
                    Test Details
                  </div>
                  <div className="h-[3px] bg-blue-900 mt-2.5 mb-3.5 rounded-full" />

                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Test ID:</div>
                      <div className="font-bold text-blue-800 tabular-nums">{labTest.testId || "—"}</div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Tests:</div>
                      <div className="font-bold text-slate-900 tabular-nums">{testCount}</div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-600">Date:</div>
                      <div className="font-bold text-slate-900">{safeLongDate(reportedDate)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TESTS ORDERED */}
              <div className="mt-4 avoid-break">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Tests Ordered
                </div>
                <div className="flex flex-wrap gap-2">
                  {tests.map((test, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-slate-100 text-slate-700 border border-slate-300"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION STRIP */}
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-600 px-5 py-2.5 rounded-lg avoid-break">
                <div className="text-blue-800 font-semibold tracking-[0.18em] text-[12px] uppercase">
                  Laboratory Results
                </div>
              </div>

              {/* RESULTS TABLE */}
              <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full border-collapse text-[13px] table-fixed print-table">
                  <colgroup>
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "36%" }} />
                  </colgroup>

                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">
                        Test Name
                      </th>
                      <th className="text-center px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">
                        Result
                      </th>
                      <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">
                        Normal Range
                      </th>
                    </tr>
                  </thead>

                  {Object.entries(results).length === 0 ? (
                    <tbody>
                      <tr>
                        <td className="px-4 py-5 text-slate-600" colSpan={3}>
                          No results available.
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    Object.entries(results).map(([panelName, panel]) => {
                      const fields = resultFields[panelName] || {};
                      return (
                        <tbody key={panelName}>
                          <tr className="bg-blue-50">
                            <td className="px-4 py-2.5 font-semibold text-blue-900" colSpan={3}>
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
                            const shouldTryNumeric =
                              config?.type === "number" || (valueHasPlus && rangeHasPlus);

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

                            const displayValue =
                              config?.type === "number" &&
                              numeric !== null &&
                              !shouldPreserveOriginalDisplay(value)
                                ? new Intl.NumberFormat("en-US").format(numeric)
                                : value;

                            const stripe = rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50";

                            return (
                              <tr
                                key={`${panelName}-${testItemName}`}
                                className={cx("border-t border-slate-200", stripe)}
                              >
                                <td className="px-4 py-3.5 text-slate-700 font-medium">
                                  {testItemName}
                                </td>

                                <td className="px-4 py-3.5 text-center tabular-nums">
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

                                <td className="px-4 py-3.5 text-slate-500 leading-snug break-words">
                                  {rangeText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      );
                    })
                  )}
                </table>
              </div>

              {/* Technician notes */}
              {technicianNotes && (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4 bg-white avoid-break">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Technician Notes
                  </div>
                  <p className="mt-2 text-[13px] text-slate-800 leading-relaxed">{technicianNotes}</p>
                </div>
              )}

              {/* SIGNATURE + FOOTER together */}
              <div className="avoid-break">
                <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[13px]">
                  <div>
                    <div className="text-[11px] text-slate-500">Lab Technician</div>
                    <div className="font-semibold text-slate-900">{completedBy || "—"}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">Report Date</div>
                    <div className="font-semibold text-slate-900">{safeLongDate(reportedDate)}</div>
                  </div>
                </div>

                <div className="mt-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-center py-6 rounded-b-2xl">
                  <div className="font-semibold text-[18px]">Bahr El Ghazal Clinic</div>
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
      </div>
    </div>
  );
}
