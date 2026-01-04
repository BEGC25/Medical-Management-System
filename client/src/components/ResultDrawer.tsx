import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Patient = {
  firstName?: string;
  lastName?: string;
  patientId?: string;
};

type ResultFields = Record<string, Record<string, {
  type: "number" | "text" | "select" | "multiselect";
  unit?: string;
  range?: string;
  normal?: string;
  options?: string[];
}>>;

function parseJSON<T = any>(v: any, fallback: T): T {
  try { return typeof v === "string" ? JSON.parse(v) : (v ?? fallback); } catch { return fallback; }
}

function isAbnormal(val: string, cfg?: { normal?: string }) {
  if (!cfg?.normal) return false;
  return cfg.normal !== val && val !== "Negative" && val !== "Not seen";
}

export default function ResultDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "lab" | "xray" | "ultrasound" | null;
  data: any;
  patient?: Patient;
  resultFields?: ResultFields;
  onAcknowledge?: (orderLineId: number, value: boolean) => void;
  onAddToSummary?: (orderLineId: number, add: boolean) => void;
  onCopyToNotes?: (txt: string) => void;
}) {
  const { open, onOpenChange, kind, data, patient, resultFields } = props;

  // Common bits
  const paid = (data?.paymentStatus ?? data?.isPaid) === "paid" || data?.isPaid === 1 || data?.isPaid === true;
  const completed = data?.status === "completed";
  const orderLineId = data?.orderLine?.id ?? data?.orderLineId ?? data?.orderId;

  // LAB specifics
  const tests = React.useMemo<string[]>(
    () => parseJSON<string[]>(data?.tests, Array.isArray(data?.tests) ? data?.tests : []),
    [data]
  );
  const results = React.useMemo<Record<string, Record<string, string>>>(
    () => parseJSON<Record<string, Record<string, string>>>(data?.results, {}),
    [data]
  );

  const copySummary = () => {
    if (!props.onCopyToNotes) return;
    let txt = "";
    if (kind === "lab") {
      txt += `Lab (${data?.category ?? "—"} ${data?.testId ?? ""}):\n`;
      for (const [panel, fields] of Object.entries(results || {})) {
        txt += `• ${panel}\n`;
        for (const [name, value] of Object.entries(fields || {})) {
          txt += `   - ${name}: ${value}\n`;
        }
      }
    } else if (kind === "xray") {
      txt += `X-Ray (${data?.examType ?? data?.bodyPart ?? ""} ${data?.examId ?? ""}):\n`;
      if (data?.viewDescriptions) txt += `View Descriptions: ${data.viewDescriptions}\n`;
      if (data?.findings) txt += `Findings: ${data.findings}\n`;
      if (data?.impression) txt += `Impression: ${data.impression}\n`;
      if (data?.recommendations) txt += `Recommendations: ${data.recommendations}\n`;
    } else if (kind === "ultrasound") {
      txt += `Ultrasound (${data?.examType ?? ""} ${data?.examId ?? ""}):\n`;
      if (data?.findings) txt += `Findings: ${data.findings}\n`;
      if (data?.impression) txt += `Impression: ${data.impression}\n`;
    }
    props.onCopyToNotes?.(txt.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            {kind === "lab" && "Lab Test"}{kind === "xray" && "X-Ray"}{kind === "ultrasound" && "Ultrasound"}{" "}
            {data?.testId || data?.examId || data?.orderId ? `• ${data.testId ?? data.examId ?? data.orderId}` : ""}
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-3" />

        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium">Patient:</div>
              <div>{patient?.firstName} {patient?.lastName} <span className="text-xs text-muted-foreground">({patient?.patientId})</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={paid ? "default" : "secondary"}>{paid ? "paid" : "unpaid"}</Badge>
              <Badge variant={completed ? "default" : "secondary"}>{completed ? "completed" : (data?.status ?? "—")}</Badge>
              {data?.priority && <Badge variant="outline">{data.priority}</Badge>}
            </div>
          </div>
        </div>

        <ScrollArea className="px-6 pb-6 h-[65vh]">
          {/* LAB CONTENT */}
          {kind === "lab" && (
            <div className="space-y-6">
              {/* Tests ordered */}
              {tests?.length > 0 && (
                <div>
                  <div className="font-semibold mb-2">Tests Ordered</div>
                  <div className="flex flex-wrap gap-2">
                    {tests.map((t, i) => (
                      <Badge key={i} variant="outline">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Laboratory Results - SHOW DATA FIRST */}
              {results && Object.keys(results).length > 0 && (
                <div className="space-y-5">
                  <div className="font-semibold">Laboratory Results</div>
                  {Object.entries(results).map(([panel, fields]) => {
                    const cfg = resultFields?.[panel] || {};
                    return (
                      <div key={panel} className="rounded-md border p-4">
                        <div className="font-medium mb-2">{panel}</div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {Object.entries(fields).map(([name, value]) => {
                            const c = cfg[name];
                            const abnormal = isAbnormal(value, c);
                            return (
                              <div key={name} className="flex items-center justify-between border-b py-1">
                                <span className="text-muted-foreground">{name}</span>
                                <span className={abnormal ? "font-semibold text-red-600" : "font-semibold"}>
                                  {value} {c?.unit ? c.unit : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {cfg && Object.keys(cfg).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Normal ranges may vary by age, gender, and laboratory standards
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Clinical Interpretation - SHOW AT END AS REFERENCE */}
              {(() => {
                const criticalFindings: string[] = [];
                const warnings: string[] = [];

                // Helper function to check if titer is significant
                const getTiterValue = (titer: string): number => {
                  const match = titer?.match(/1:(\d+)/);
                  return match ? parseInt(match[1]) : 0;
                };

                // Analyze results for critical findings
                Object.entries(results).forEach(([testName, testData]) => {
                  // ===== MALARIA DETECTION =====
                  if (testName === "Blood Film for Malaria (BFFM)") {
                    const parasites = testData["Malaria Parasites"];
                    if (parasites && parasites !== "Not seen" && parasites !== "Negative") {
                      criticalFindings.push(`🔴 POSITIVE for ${parasites} malaria - Requires immediate treatment`);
                    }
                    if (testData["Gametocytes"] === "Seen") {
                      warnings.push(`⚠️ Gametocytes present - Patient is infectious`);
                    }
                  }

                  // ===== WIDAL TEST (TYPHOID) =====
                  if (testName === "Widal Test (Typhoid)") {
                    const oAg = getTiterValue(testData["S. Typhi (O)Ag"]);
                    const hAg = getTiterValue(testData["S. Typhi (H)Ag"]);
                    const paraA = getTiterValue(testData["S. Paratyphi A"]);
                    const paraB = getTiterValue(testData["S. Paratyphi B"]);
                    
                    if (oAg >= 320 || hAg >= 320) {
                      criticalFindings.push(`🔴 VERY HIGH typhoid titers (O:1:${oAg}, H:1:${hAg}) - Strongly suggests active typhoid infection`);
                    } else if (oAg >= 160 || hAg >= 160) {
                      warnings.push(`⚠️ HIGH typhoid titers (O:1:${oAg}, H:1:${hAg}) - Probable typhoid fever, start treatment`);
                    } else if (oAg >= 80 || hAg >= 80) {
                      warnings.push(`⚠️ Elevated typhoid titers - Consider typhoid fever`);
                    }

                    if (paraA >= 160 || paraB >= 160) {
                      warnings.push(`⚠️ Elevated paratyphoid titers detected`);
                    }
                  }

                  // ===== BRUCELLA TEST =====
                  if (testName === "Brucella Test (B.A.T)") {
                    const titer = getTiterValue(testData["Titer"]);
                    const result = testData["Brucella Antibody"];
                    
                    if (titer >= 160 || result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for Brucellosis (titer: 1:${titer}) - Zoonotic infection requiring treatment`);
                    } else if (titer >= 80) {
                      warnings.push(`⚠️ Possible Brucellosis - Consider patient history and clinical correlation`);
                    }
                  }

                  // ===== VDRL TEST (SYPHILIS) =====
                  if (testName === "VDRL Test (Syphilis)") {
                    const result = testData["VDRL"];
                    const titer = testData["Titer"];
                    
                    if (result === "Reactive" || result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for Syphilis (VDRL Reactive${titer ? `, titer: ${titer}` : ""}) - Requires confirmatory testing and treatment`);
                    }
                  }

                  // ===== HEPATITIS B (HBsAg) =====
                  if (testName === "Hepatitis B Test (HBsAg)") {
                    const result = testData["HBsAg"];
                    if (result === "Reactive" || result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for Hepatitis B - Patient is HBsAg positive, infectious`);
                    }
                  }

                  // ===== H. PYLORI TEST =====
                  if (testName === "H. Pylori Test") {
                    const result = testData["H. Pylori Antigen"];
                    if (result === "Positive") {
                      warnings.push(`⚠️ H. Pylori POSITIVE - Causative agent of peptic ulcer disease, requires treatment with antibiotics`);
                    }
                  }

                  // ===== HEPATITIS C TEST (HCV) =====
                  if (testName === "Hepatitis C Test (HCV)") {
                    const result = testData["HCV Antibody"];
                    if (result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for Hepatitis C - Chronic liver infection, requires confirmatory testing and specialist referral`);
                    }
                  }

                  // ===== HIV TEST =====
                  if (testName === "HIV Test") {
                    const result = testData["HIV Antibody"];
                    if (result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for HIV - Requires confirmatory testing, counseling, and antiretroviral therapy`);
                    }
                  }

                  // ===== GONORRHEA TEST =====
                  if (testName === "Gonorrhea Test") {
                    const result = testData["Gonorrhea"];
                    if (result === "Positive") {
                      criticalFindings.push(`🔴 POSITIVE for Gonorrhea - Sexually transmitted infection requiring antibiotic treatment and partner notification`);
                    }
                  }

                  // ===== PREGNANCY TEST (HCG) =====
                  if (testName === "Pregnancy Test (HCG)") {
                    const result = testData["β-hCG"];
                    if (result === "Positive") {
                      warnings.push(`⚠️ Pregnancy test POSITIVE - Confirm pregnancy and initiate prenatal care`);
                    }
                  }

                  // ===== URINE ANALYSIS =====
                  if (testName === "Urine Analysis") {
                    const appearance = testData["Appearance"];
                    const protein = testData["Protein"];
                    const glucose = testData["Glucose"];
                    const hbPigment = testData["Hb pigment"];
                    const nitrite = testData["Nitrite"];
                    const leucocytes = testData["Leucocytes"];

                    if (appearance?.toLowerCase().includes("bloody") || appearance?.toLowerCase().includes("red")) {
                      criticalFindings.push(`🔴 Bloody urine detected - Possible bleeding, trauma, or severe infection`);
                    }

                    if (protein && (protein.includes("+++") || protein.includes("++++"))) {
                      criticalFindings.push(`🔴 Severe proteinuria (${protein}) - Kidney damage likely, needs urgent evaluation`);
                    } else if (protein && protein !== "Negative" && protein !== "-") {
                      warnings.push(`⚠️ Proteinuria detected (${protein}) - Kidney function needs assessment`);
                    }

                    if (glucose && glucose !== "Negative" && glucose !== "-") {
                      warnings.push(`⚠️ Glucosuria (${glucose}) - Check blood glucose levels, rule out diabetes`);
                    }

                    if (hbPigment && (hbPigment === "Positive" || hbPigment.includes("+"))) {
                      warnings.push(`⚠️ Blood in urine (Hb ${hbPigment}) - Further investigation needed`);
                    }

                    if (nitrite === "Positive") {
                      warnings.push(`⚠️ Nitrite positive - Bacterial urinary tract infection likely`);
                    }

                    if (leucocytes && leucocytes !== "Negative" && leucocytes !== "-") {
                      warnings.push(`⚠️ Leucocytes in urine (${leucocytes}) - Urinary tract infection or inflammation`);
                    }
                  }

                  // ===== COMPLETE BLOOD COUNT (CBC) =====
                  if (testName === "Complete Blood Count (CBC)") {
                    const hb = parseFloat(testData["Hemoglobin"]);
                    const wbc = parseFloat(testData["WBC"]);
                    const platelets = parseFloat(testData["Platelets"]);
                    
                    if (!isNaN(hb) && hb < 7) {
                      criticalFindings.push(`🔴 SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
                    } else if (!isNaN(hb) && hb < 10) {
                      warnings.push(`⚠️ Moderate anemia (Hb: ${hb} g/dL) - Requires treatment`);
                    }
                    
                    if (!isNaN(wbc) && wbc > 15) {
                      warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible severe infection or leukemia`);
                    } else if (!isNaN(wbc) && wbc > 11) {
                      warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible infection`);
                    }

                    if (!isNaN(wbc) && wbc < 4) {
                      warnings.push(`⚠️ Low WBC (${wbc} x10³/µL) - Immunosuppression, needs evaluation`);
                    }

                    if (!isNaN(platelets) && platelets < 50) {
                      criticalFindings.push(`🔴 Severe thrombocytopenia (Platelets: ${platelets} x10³/µL) - Bleeding risk, urgent care needed`);
                    } else if (!isNaN(platelets) && platelets < 150) {
                      warnings.push(`⚠️ Low platelets (${platelets} x10³/µL) - Monitor for bleeding`);
                    }
                  }

                  // ===== LIVER FUNCTION TEST =====
                  if (testName === "Liver Function Test (LFT)") {
                    const alt = parseFloat(testData["ALT (SGPT)"]);
                    const ast = parseFloat(testData["AST (SGOT)"]);
                    const bilirubin = parseFloat(testData["Total Bilirubin"]);
                    
                    if (!isNaN(alt) && alt > 200) {
                      criticalFindings.push(`🔴 Severely elevated ALT (${alt} U/L) - Significant liver damage`);
                    } else if (!isNaN(alt) && alt > 100) {
                      warnings.push(`⚠️ Elevated ALT (${alt} U/L) - Liver function impaired`);
                    }
                    
                    if (!isNaN(ast) && ast > 200) {
                      criticalFindings.push(`🔴 Severely elevated AST (${ast} U/L) - Significant liver damage`);
                    } else if (!isNaN(ast) && ast > 100) {
                      warnings.push(`⚠️ Elevated AST (${ast} U/L) - Liver damage possible`);
                    }

                    if (!isNaN(bilirubin) && bilirubin > 3) {
                      warnings.push(`⚠️ Elevated bilirubin (${bilirubin} mg/dL) - Jaundice, liver dysfunction`);
                    }
                  }

                  // ===== RENAL FUNCTION TEST =====
                  if (testName === "Renal Function Test (RFT)") {
                    const creatinine = parseFloat(testData["Creatinine"]);
                    const urea = parseFloat(testData["Urea"]);
                    
                    if (!isNaN(creatinine) && creatinine > 3) {
                      criticalFindings.push(`🔴 Severely elevated creatinine (${creatinine} mg/dL) - Acute kidney injury or failure`);
                    } else if (!isNaN(creatinine) && creatinine > 1.5) {
                      warnings.push(`⚠️ Elevated creatinine (${creatinine} mg/dL) - Kidney function compromised`);
                    }

                    if (!isNaN(urea) && urea > 50) {
                      warnings.push(`⚠️ Elevated urea (${urea} mg/dL) - Kidney dysfunction`);
                    }
                  }

                  // ===== BLOOD GLUCOSE =====
                  if (testName.includes("Blood Sugar") || testName.includes("Blood Glucose")) {
                    const bloodGlucose = parseFloat(testData["Blood Glucose"]);
                    
                    if (!isNaN(bloodGlucose)) {
                      if (testName.includes("Fasting") && bloodGlucose > 200) {
                        criticalFindings.push(`🔴 Very high fasting glucose (${bloodGlucose} mg/dL) - Diabetes, needs urgent management`);
                      } else if (testName.includes("Fasting") && bloodGlucose > 126) {
                        warnings.push(`⚠️ Elevated fasting glucose (${bloodGlucose} mg/dL) - Diabetes likely`);
                      } else if (testName.includes("Random") && bloodGlucose > 300) {
                        criticalFindings.push(`🔴 Dangerously high blood sugar (${bloodGlucose} mg/dL) - Diabetic emergency risk`);
                      } else if (testName.includes("Random") && bloodGlucose > 200) {
                        warnings.push(`⚠️ High random blood sugar (${bloodGlucose} mg/dL) - Diabetes evaluation needed`);
                      }
                    }
                  }

                  // ===== ESR (ERYTHROCYTE SEDIMENTATION RATE) =====
                  if (testName === "ESR (Erythrocyte Sedimentation Rate)") {
                    const esr = parseFloat(testData["ESR (1 hour)"]);
                    if (!isNaN(esr) && esr > 50) {
                      warnings.push(`⚠️ Markedly elevated ESR (${esr} mm/hr) - Significant inflammation, infection, or malignancy possible`);
                    } else if (!isNaN(esr) && esr > 30) {
                      warnings.push(`⚠️ Elevated ESR (${esr} mm/hr) - Inflammatory process present`);
                    }
                  }

                  // ===== RHEUMATOID FACTOR =====
                  if (testName === "Rheumatoid Factor") {
                    const result = testData["RF"];
                    const titer = testData["Titer"];
                    if (result === "Positive") {
                      if (titer && (titer.includes(">80") || titer.includes("40-80"))) {
                        warnings.push(`⚠️ Rheumatoid Factor POSITIVE (titer: ${titer}) - Strongly suggests rheumatoid arthritis or autoimmune disease`);
                      } else {
                        warnings.push(`⚠️ Rheumatoid Factor POSITIVE - May indicate rheumatoid arthritis, requires clinical correlation`);
                      }
                    }
                  }

                  // ===== HEMOGLOBIN (HB) =====
                  if (testName === "Hemoglobin (HB)") {
                    const hb = parseFloat(testData["Hemoglobin"]);
                    if (!isNaN(hb) && hb < 7) {
                      criticalFindings.push(`🔴 SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
                    } else if (!isNaN(hb) && hb < 10) {
                      warnings.push(`⚠️ Moderate anemia (Hb: ${hb} g/dL) - Requires treatment and investigation`);
                    } else if (!isNaN(hb) && hb < 12) {
                      warnings.push(`⚠️ Mild anemia (Hb: ${hb} g/dL) - Monitor and consider iron supplementation`);
                    }
                  }

                  // ===== TOTAL WHITE BLOOD COUNT (TWBC) =====
                  if (testName === "Total White Blood Count (TWBC)") {
                    const wbc = parseFloat(testData["WBC"]);
                    if (!isNaN(wbc) && wbc > 15) {
                      warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible severe infection or leukemia`);
                    } else if (!isNaN(wbc) && wbc > 11) {
                      warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible infection`);
                    } else if (!isNaN(wbc) && wbc < 4) {
                      warnings.push(`⚠️ Low WBC (${wbc} x10³/µL) - Immunosuppression, requires evaluation`);
                    }
                  }
                });

                return (criticalFindings.length > 0 || warnings.length > 0) ? (
                  <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <div className="text-lg font-bold mb-2 text-yellow-900 flex items-center">
                      <span className="text-2xl mr-2">ℹ️</span> Clinical Interpretation
                    </div>
                    {criticalFindings.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-red-800 mb-2">Critical Findings Requiring Attention:</p>
                        <div className="space-y-1">
                          {criticalFindings.map((finding, i) => (
                            <div key={i} className="bg-red-100 border-l-4 border-red-600 p-2 text-sm">
                              {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {warnings.length > 0 && (
                      <div className="space-y-1">
                        {warnings.map((warning, i) => (
                          <div key={i} className="bg-yellow-100 border-l-4 border-yellow-600 p-2 text-sm">
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              {!results || Object.keys(results).length === 0 ? (
                <div className="rounded-md border bg-muted p-3 text-sm">No result values recorded yet.</div>
              ) : null}
            </div>
          )}

          {/* XRAY CONTENT */}
          {kind === "xray" && (
            <div className="space-y-4">
              {/* Exam Header */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">X-Ray Examination Report</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {data?.examId} • {data?.examType?.charAt(0).toUpperCase() + (data?.examType?.slice(1) || '')} 
                      {data?.bodyPart && ` - ${data.bodyPart}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-sm">
                  {data?.requestedDate && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Requested: {new Date(data.requestedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {data?.reportDate && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Completed: {new Date(data.reportDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Descriptions */}
              {data?.viewDescriptions && (
                <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-700 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <div className="font-bold text-green-900 dark:text-green-100">View Descriptions</div>
                  </div>
                  <div className="whitespace-pre-line text-sm text-green-900 dark:text-green-100 leading-relaxed">{data.viewDescriptions}</div>
                </div>
              )}

              {/* Radiological Findings */}
              {data?.findings && (
                <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <div className="font-bold text-blue-900 dark:text-blue-100">Radiological Findings</div>
                  </div>
                  <div className="whitespace-pre-line text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{data.findings}</div>
                </div>
              )}

              {/* Clinical Impression */}
              {data?.impression && (
                <div className="rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-700 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="font-bold text-purple-900 dark:text-purple-100">Clinical Impression</div>
                  </div>
                  <div className="whitespace-pre-line text-sm font-medium text-purple-900 dark:text-purple-100 leading-relaxed">{data.impression}</div>
                </div>
              )}

              {/* Recommendations */}
              {data?.recommendations && (
                <div className="rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div className="font-bold text-amber-900 dark:text-amber-100">Recommendations</div>
                  </div>
                  <div className="whitespace-pre-line text-sm text-amber-900 dark:text-amber-100 leading-relaxed">{data.recommendations}</div>
                </div>
              )}

              {/* Technical Details */}
              <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="font-bold text-gray-900 dark:text-gray-100">Technical Details</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {data?.imageQuality && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Image Quality:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{data.imageQuality}</span>
                    </div>
                  )}
                  {data?.technicalFactors && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Technical Factors:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{data.technicalFactors}</span>
                    </div>
                  )}
                  {data?.radiologist && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Radiologist:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{data.radiologist}</span>
                    </div>
                  )}
                  {data?.reportDate && (
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-600 dark:text-gray-400">Report Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{new Date(data.reportDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* If no meaningful data available */}
              {!data?.viewDescriptions && !data?.findings && !data?.impression && !data?.recommendations && 
               !data?.imageQuality && !data?.technicalFactors && !data?.radiologist && (
                <div className="rounded-md border bg-muted p-3 text-sm text-center">
                  No report data available yet. Report pending completion.
                </div>
              )}
            </div>
          )}

          {/* ULTRASOUND CONTENT */}
          {kind === "ultrasound" && (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <div className="font-medium">Exam Type</div>
                <div className="text-sm text-muted-foreground">{data?.examType ?? "—"}</div>
              </div>
              {data?.findings && (
                <div className="rounded-md border p-3">
                  <div className="font-medium text-blue-700">Findings</div>
                  <div className="whitespace-pre-line text-sm">{data.findings}</div>
                </div>
              )}
              {data?.impression && (
                <div className="rounded-md border p-3">
                  <div className="font-medium text-green-700">Impression</div>
                  <div className="whitespace-pre-line text-sm font-medium">{data.impression}</div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="px-6 py-4 flex flex-wrap gap-2">
          {typeof orderLineId === "number" && props.onAcknowledge && (
            <Button variant="outline" onClick={() => props.onAcknowledge!(orderLineId, true)}>Acknowledge</Button>
          )}
          {typeof orderLineId === "number" && props.onAddToSummary && (
            <Button variant="outline" onClick={() => props.onAddToSummary!(orderLineId, true)}>Add to Summary</Button>
          )}
          {props.onCopyToNotes && (
            <Button onClick={copySummary}>Copy to Notes</Button>
          )}
          <div className="ml-auto" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
