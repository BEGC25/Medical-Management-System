import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ResultHeaderCard, ResultSectionCard, KeyFindingCard } from "@/components/diagnostics";
import { LabReportPrint } from "@/components/LabReportPrint";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { Printer } from "lucide-react";

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
  userRole?: "admin" | "reception" | "doctor" | "lab" | "radiology" | "pharmacy";
}) {
  const { open, onOpenChange, kind, data, patient, resultFields, userRole } = props;
  const [showClinicalPrint, setShowClinicalPrint] = React.useState(false);

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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {kind === "lab" && "Lab Test"}{kind === "xray" && "X-Ray"}{kind === "ultrasound" && "Ultrasound"}{" "}
            {data?.testId || data?.examId || data?.orderId ? `• ${data.testId ?? data.examId ?? data.orderId}` : ""}
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-3 shrink-0" />

        <div className="px-6 pb-4 shrink-0">
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
          
          {/* Action Buttons */}
          {kind === "lab" && completed && (userRole === "doctor" || userRole === "admin") && (
            <div className="mt-3 flex justify-end gap-2">
              {props.onCopyToNotes && (
                <Button size="sm" variant="outline" onClick={copySummary}>
                  Copy to Notes
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowClinicalPrint(true);
                  setTimeout(() => {
                    const done = () => setShowClinicalPrint(false);
                    window.addEventListener("afterprint", done, { once: true });
                    window.print();
                  }, 100);
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Clinical Copy
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="px-6 pb-6 flex-1 min-h-0">
          {/* LAB CONTENT */}
          {kind === "lab" && (
            <div className="space-y-6">
              {/* Header Card */}
              <ResultHeaderCard
                modality="lab"
                title="Lab Test"
                subtitle={`${data?.testId ?? ""} • ${data?.category ?? "Blood Film for Malaria & CBC"}`}
                requestedAt={data?.requestedDate}
                completedAt={data?.completedAt}
                reportedAt={data?.reportDate}
              />

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
                      <ResultSectionCard 
                        key={panel} 
                        title={panel}
                        tone="neutral"
                      >
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
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
                      </ResultSectionCard>
                    );
                  })}
                </div>
              )}

              {/* Clinical Interpretation - SHOW AT END AS REFERENCE */}
              {(() => {
                // Use shared interpretation utility for consistent results between UI and print
                const interpretation = interpretLabResults(results);
                const { criticalFindings, warnings } = interpretation;

                // Use KeyFindingCard for clinical interpretation
                if (criticalFindings.length > 0 || warnings.length > 0) {
                  const severity = criticalFindings.length > 0 ? "critical" : "attention";
                  const summary = criticalFindings.length > 0 
                    ? criticalFindings[0] 
                    : warnings[0];
                  
                  const items = [];
                  
                  // Add remaining critical findings as items if there are multiple
                  if (criticalFindings.length > 1) {
                    for (let i = 1; i < criticalFindings.length; i++) {
                      items.push({ text: criticalFindings[i] });
                    }
                  }
                  
                  // Add warnings as items
                  const warningStart = criticalFindings.length > 0 ? 0 : 1;
                  for (let i = warningStart; i < warnings.length; i++) {
                    items.push({ text: warnings[i] });
                  }
                  
                  return (
                    <KeyFindingCard
                      severity={severity}
                      summary={summary}
                      items={items}
                    />
                  );
                }
                return (
                  <KeyFindingCard
                    severity="normal"
                    summary="All test results are within normal limits. No critical findings or abnormalities detected."
                  />
                );
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
              <ResultHeaderCard
                modality="xray"
                title="X-Ray Examination Report"
                subtitle={`${data?.examId ?? ""} • ${data?.examType?.charAt(0).toUpperCase() + (data?.examType?.slice(1) || '')}${data?.bodyPart ? ` - ${data.bodyPart}` : ""}`}
                requestedAt={data?.requestedDate}
                completedAt={data?.reportDate}
              />

              {/* View Descriptions */}
              {data?.viewDescriptions && (
                <ResultSectionCard
                  title="View Descriptions"
                  tone="accent-green"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.viewDescriptions}</div>
                </ResultSectionCard>
              )}

              {/* Radiological Findings */}
              {data?.findings && (
                <ResultSectionCard
                  title="Radiological Findings"
                  tone="accent-blue"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.findings}</div>
                </ResultSectionCard>
              )}

              {/* Clinical Impression */}
              {data?.impression && (
                <ResultSectionCard
                  title="Clinical Impression"
                  tone="accent-purple"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line font-medium">{data.impression}</div>
                </ResultSectionCard>
              )}

              {/* Recommendations */}
              {data?.recommendations && (
                <ResultSectionCard
                  title="Recommendations"
                  tone="accent-amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.recommendations}</div>
                </ResultSectionCard>
              )}

              {/* Technical Details */}
              <ResultSectionCard
                title="Technical Details"
                tone="neutral"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </ResultSectionCard>

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
              {/* Header Card */}
              <ResultHeaderCard
                modality="ultrasound"
                title="Ultrasound Examination Report"
                subtitle={`${data?.examId ?? ""} • ${data?.examType ?? "Complete Abdomen"}`}
                requestedAt={data?.requestDate}
                completedAt={data?.completedAt || data?.resultDate}
                reportedAt={data?.reportDate}
              />

              {/* Sonographic Findings */}
              {data?.findings && (
                <ResultSectionCard
                  title="Sonographic Findings"
                  tone="accent-blue"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  }
                >
                  <div className="whitespace-pre-line">{data.findings}</div>
                </ResultSectionCard>
              )}

              {/* Impression / Key Findings */}
              {data?.impression && (() => {
                // Determine severity based on impression content
                const impressionLower = data.impression.toLowerCase();
                const isNormal = impressionLower.includes("normal") && 
                                 !impressionLower.includes("abnormal") &&
                                 (impressionLower.includes("no abnormalities") || 
                                  impressionLower.includes("unremarkable") ||
                                  impressionLower.includes("within normal limits"));
                
                const severity = isNormal ? "normal" : "attention";
                
                return (
                  <KeyFindingCard
                    severity={severity}
                    title="Impression / Key Findings"
                    summary={data.impression}
                  />
                );
              })()}

              {/* Technical Details (if available) */}
              {(data?.technicalDetails || data?.probe || data?.limitations) && (
                <ResultSectionCard
                  title="Technical Details"
                  tone="neutral"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <div className="space-y-2 text-sm">
                    {data?.probe && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground">Probe Type:</span>
                        <span className="font-semibold">{data.probe}</span>
                      </div>
                    )}
                    {data?.technicalDetails && (
                      <div>
                        <span className="text-muted-foreground">Details:</span>
                        <p className="mt-1">{data.technicalDetails}</p>
                      </div>
                    )}
                    {data?.limitations && (
                      <div>
                        <span className="text-muted-foreground">Limitations:</span>
                        <p className="mt-1">{data.limitations}</p>
                      </div>
                    )}
                  </div>
                </ResultSectionCard>
              )}

              {/* Empty state */}
              {!data?.findings && !data?.impression && (
                <div className="rounded-md border bg-muted p-3 text-sm text-center">
                  No report data available yet. Report pending completion.
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator className="shrink-0" />

        <div className="px-6 py-4 flex flex-wrap gap-2 shrink-0">
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
      
      {/* Clinical Print Component for Lab Results (Doctors/Admins only) */}
      {kind === "lab" && data && patient && resultFields && (
        <LabReportPrint
          containerId="lab-clinical-print"
          visible={showClinicalPrint}
          labTest={{
            testId: data.testId || "",
            patientId: data.patientId || patient.patientId || "",
            category: data.category || "",
            priority: data.priority || "",
            tests: data.tests || [],
            results: data.results || {},
            completedDate: data.completedDate || data.completedAt,
            resultStatus: data.resultStatus || data.status,
            technicianNotes: data.technicianNotes,
          }}
          patient={patient}
          resultFields={resultFields}
          includeInterpretation={true}
        />
      )}
    </Dialog>
  );
}
