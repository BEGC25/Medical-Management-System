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
      if (data?.findings) txt += `Findings: ${data.findings}\n`;
      if (data?.impression) txt += `Impression: ${data.impression}\n`;
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

              {/* Pretty results */}
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
                                  {c?.range ? <span className="ml-2 text-xs text-muted-foreground">[{c.range}]</span> : null}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!results || Object.keys(results).length === 0 ? (
                <div className="rounded-md border bg-muted p-3 text-sm">No result values recorded yet.</div>
              ) : null}
            </div>
          )}

          {/* XRAY CONTENT */}
          {kind === "xray" && (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <div className="font-medium">Body Part</div>
                <div className="text-sm text-muted-foreground">{data?.bodyPart ?? "—"}</div>
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
