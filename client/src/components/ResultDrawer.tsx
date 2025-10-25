import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";

type Patient = { firstName?: string|null; lastName?: string|null; patientId: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "lab" | "xray" | "ultrasound" | null;
  data: any;
  patient?: Patient | null;
  resultFields?: Record<string, Record<string, { unit?: string; normal?: string; }>>;
  onAcknowledge: (orderLineId: number, val: boolean) => void;
  onAddToSummary: (orderLineId: number, val: boolean) => void;
  onCopyToNotes?: (txt: string) => void;
};

function safeJSON<T>(v: any, fb: T): T {
  try { return typeof v === "string" ? JSON.parse(v) : v ?? fb; } catch { return fb; }
}

export default function ResultDrawer({
  open, onOpenChange, kind, data, patient, resultFields = {}, onAcknowledge, onAddToSummary, onCopyToNotes
}: Props) {
  if (!data) return null;

  const requested = data.requestedDate || data.requestDate || data.createdAt;
  const completed = data.completedDate || data.reportDate || data.updatedAt;

  const headerTitle = kind === "lab" ? `Lab Test ${data.testId || data.orderId}`
                      : kind === "xray" ? `X-Ray ${data.examId || data.orderId}`
                      : kind === "ultrasound" ? `Ultrasound ${data.examId || data.orderId}`
                      : "Result";

  const fullName = patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "";

  const copyToNotes = () => {
    if (!onCopyToNotes) return;
    if (kind === "lab") {
      const tests = safeJSON<string[]>(data.tests, []);
      const results = safeJSON<Record<string, Record<string, string>>>(data.results, {});
      const lines: string[] = [`Lab: ${tests.join(", ")}`];
      Object.entries(results).forEach(([t, fields]) => {
        const vals = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("; ");
        lines.push(`${t} – ${vals}`);
      });
      onCopyToNotes(lines.join("\n"));
    } else if (kind === "xray") {
      const tx = [`X-Ray ${data.bodyPart || data.examType || ""}`.trim()];
      if (data.findings) tx.push(`Findings: ${data.findings}`);
      if (data.impression) tx.push(`Impression: ${data.impression}`);
      onCopyToNotes(tx.join("\n"));
    } else if (kind === "ultrasound") {
      const tx = [`Ultrasound ${data.examType || ""}`.trim()];
      if (data.findings) tx.push(`Findings: ${data.findings}`);
      if (data.impression) tx.push(`Impression: ${data.impression}`);
      onCopyToNotes(tx.join("\n"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {headerTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded p-3">
          <div><span className="font-medium">Patient:</span> {fullName || "—"} {patient ? `(${patient.patientId})` : ""}</div>
          <div><span className="font-medium">Status:</span> <Badge variant={data.status === "completed" ? "default" : "secondary"}>{data.status || "—"}</Badge></div>
          <div><span className="font-medium">Requested:</span> {requested ? new Date(requested).toLocaleString() : "—"}</div>
          {completed && <div><span className="font-medium">Completed:</span> {new Date(completed).toLocaleString()}</div>}
          {"paymentStatus" in data && (
            <div><span className="font-medium">Payment:</span> <Badge variant={data.paymentStatus === "paid" ? "default" : "destructive"}>{data.paymentStatus}</Badge></div>
          )}
        </div>

        {/* LAB */}
        {kind === "lab" && (
          <>
            {/* Clinical interpretation (simple rules) */}
            {(() => {
              const results = safeJSON<Record<string, Record<string, string>>>(data.results, {});
              const critical: string[] = [];
              const warn: string[] = [];

              const v = (t: string, f: string) => results?.[t]?.[f];

              const hb = parseFloat(v("Complete Blood Count (CBC)", "Hemoglobin") || "");
              if (!isNaN(hb) && hb < 7) critical.push(`SEVERE anemia (Hb ${hb} g/dL) – consider urgent transfusion`);
              else if (!isNaN(hb) && hb < 10) warn.push(`Moderate anemia (Hb ${hb} g/dL)`);

              const mp = v("Blood Film for Malaria (BFFM)", "Malaria Parasites");
              if (mp && mp !== "Not seen") critical.push(`Positive malaria: ${mp}`);

              return (critical.length + warn.length) > 0 ? (
                <div className="border-2 border-yellow-300 bg-yellow-50 rounded p-3">
                  <div className="font-semibold mb-2">Clinical Interpretation</div>
                  {critical.length > 0 && (
                    <div className="mb-2">
                      <div className="font-medium text-red-700">Critical Findings:</div>
                      <ul className="list-disc pl-5 text-red-700">
                        {critical.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {warn.length > 0 && (
                    <div>
                      <div className="font-medium text-yellow-800">Notable:</div>
                      <ul className="list-disc pl-5 text-yellow-800">
                        {warn.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Pretty results */}
            <div className="space-y-4">
              {safeJSON<string[]>(data.tests, []).map((t, i) => {
                const fields = Object.entries(safeJSON<Record<string, string>>(data.results, {})[t] || {});
                return (
                  <div key={i} className="rounded border p-3">
                    <div className="font-semibold mb-2">{t}</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {fields.map(([k, val]) => {
                        const cfg = (resultFields?.[t] || {})[k];
                        const normal = cfg?.normal;
                        const abnormal = normal && normal !== val && !["Not seen", "Negative"].includes(val);
                        const ok = normal && normal === val;
                        return (
                          <div key={k} className="flex justify-between border-b py-1">
                            <span className="text-gray-600">{k}</span>
                            <span className={`font-semibold ${ok ? "text-green-600" : ""} ${abnormal ? "text-red-600" : ""}`}>
                              {val} {cfg?.unit || ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              {data?.orderLine?.id && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onAcknowledge(data.orderLine.id, !data.orderLine.acknowledgedBy)}
                  >
                    {data.orderLine.acknowledgedBy ? "Unacknowledge" : "Acknowledge"}
                  </Button>
                  {!data.orderLine.addToCart && (
                    <Button variant="outline" onClick={() => onAddToSummary(data.orderLine.id, true)}>Add to Summary</Button>
                  )}
                </>
              )}
              {onCopyToNotes && <Button onClick={copyToNotes}>Copy to Notes</Button>}
            </div>
          </>
        )}

        {/* XRAY */}
        {kind === "xray" && (
          <div className="space-y-3">
            <div className="rounded border p-3">
              <div className="font-medium">• {data.bodyPart || data.examType || "—"}</div>
            </div>
            {data.findings && (
              <div className="rounded border p-3">
                <div className="font-semibold mb-1">Findings</div>
                <p className="whitespace-pre-line">{data.findings}</p>
              </div>
            )}
            {data.impression && (
              <div className="rounded border p-3">
                <div className="font-semibold mb-1">Impression</div>
                <p className="whitespace-pre-line">{data.impression}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {data?.orderLine?.id && (
                <>
                  <Button variant="outline" onClick={() => onAcknowledge(data.orderLine.id, !data.orderLine.acknowledgedBy)}>
                    {data.orderLine.acknowledgedBy ? "Unacknowledge" : "Acknowledge"}
                  </Button>
                  {!data.orderLine.addToCart && (
                    <Button variant="outline" onClick={() => onAddToSummary(data.orderLine.id, true)}>Add to Summary</Button>
                  )}
                </>
              )}
              {onCopyToNotes && <Button onClick={copyToNotes}>Copy to Notes</Button>}
            </div>
          </div>
        )}

        {/* ULTRASOUND */}
        {kind === "ultrasound" && (
          <div className="space-y-3">
            <div className="rounded border p-3">
              <div className="font-medium">• {data.examType || "—"}</div>
            </div>
            {data.findings && (
              <div className="rounded border p-3">
                <div className="font-semibold mb-1">Findings</div>
                <p className="whitespace-pre-line">{data.findings}</p>
              </div>
            )}
            {data.impression && (
              <div className="rounded border p-3">
                <div className="font-semibold mb-1">Impression</div>
                <p className="whitespace-pre-line">{data.impression}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {data?.orderLine?.id && (
                <>
                  <Button variant="outline" onClick={() => onAcknowledge(data.orderLine.id, !data.orderLine.acknowledgedBy)}>
                    {data.orderLine.acknowledgedBy ? "Unacknowledge" : "Acknowledge"}
                  </Button>
                  {!data.orderLine.addToCart && (
                    <Button variant="outline" onClick={() => onAddToSummary(data.orderLine.id, true)}>Add to Summary</Button>
                  )}
                </>
              )}
              {onCopyToNotes && <Button onClick={copyToNotes}>Copy to Notes</Button>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
