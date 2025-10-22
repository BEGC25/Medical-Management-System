import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Plus } from "lucide-react";

type BaseOrderLine = { id: number; acknowledgedBy?: string; addToCart?: number | boolean };
type LabPayload = any;         // your lab object
type XrayPayload = any;
type UsPayload = any;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "lab" | "xray" | "ultrasound";
  data: LabPayload | XrayPayload | UsPayload;
  onAcknowledge?: (orderLineId: number, value: boolean) => void;
  onAddToCart?: (orderLineId: number, value: boolean) => void;
  onCopyToNotes?: (text: string) => void;
};

export default function ResultDrawer({
  open, onOpenChange, kind, data, onAcknowledge, onAddToCart, onCopyToNotes
}: Props) {
  const ol: BaseOrderLine | undefined = (data as any)?.orderLine;

  const title =
    kind === "lab" ? `Lab Test ${data?.testId || ""}` :
    kind === "xray" ? `X-Ray ${data?.examId || ""}` :
    `Ultrasound ${data?.examId || ""}`;

  const summary =
    kind === "lab" ? `${(data?.category || "").toUpperCase()}` :
    kind === "xray" ? `${data?.bodyPart || ""} • ${data?.examType || ""}` :
    `${data?.examType || ""}`;

  const when =
    (data?.completedDate || data?.reportDate || data?.requestedDate || data?.requestDate) ?
    new Date(data.completedDate || data.reportDate || data.requestedDate || data.requestDate).toLocaleString() : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] sm:w-[620px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> {title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded border p-3 bg-white dark:bg-gray-900">
            <div className="font-semibold">{summary}</div>
            <div className="text-xs text-gray-500">{when}</div>
            <div className="mt-1">
              <Badge variant={(data?.paymentStatus === "paid") ? "default" : "destructive"}>
                {data?.paymentStatus || "unpaid"}
              </Badge>
              <Badge variant={(data?.status === "completed") ? "default" : "secondary"} className="ml-2">
                {data?.status}
              </Badge>
              {ol?.acknowledgedBy && (
                <Badge variant="outline" className="ml-2">✓ Acknowledged by {ol.acknowledgedBy}</Badge>
              )}
            </div>
          </div>

          {/* Minimal render of results text; you can swap in your rich tables here */}
          {kind === "lab" && data?.results && (
            <div className="rounded border p-3">
              <div className="font-semibold mb-2">Laboratory Results</div>
              <pre className="text-xs whitespace-pre-wrap">{typeof data.results === "string" ? data.results : JSON.stringify(data.results, null, 2)}</pre>
            </div>
          )}
          {kind !== "lab" && data?.findings && (
            <div className="rounded border p-3">
              <div className="font-semibold mb-2">Findings</div>
              <pre className="text-xs whitespace-pre-wrap">{data.findings}</pre>
            </div>
          )}
          {kind !== "lab" && data?.impression && (
            <div className="rounded border p-3">
              <div className="font-semibold mb-2">Impression</div>
              <pre className="text-xs whitespace-pre-wrap font-medium">{data.impression}</pre>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {ol && (
              <>
                <Button variant="outline" onClick={() => onAcknowledge?.(ol.id, !ol.acknowledgedBy)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {ol.acknowledgedBy ? "Unacknowledge" : "Acknowledge"}
                </Button>
                <Button variant="outline" onClick={() => onAddToCart?.(ol.id, !(ol.addToCart as any))}>
                  <Plus className="h-4 w-4 mr-2" />
                  {ol.addToCart ? "Remove from Summary" : "Add to Summary"}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => onCopyToNotes?.(buildNote(kind, data))}
            >
              Copy to Notes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function buildNote(kind: Props["kind"], data: any) {
  if (kind === "lab") {
    return `LAB: ${data?.category}\nRequested: ${data?.requestedDate}\nCompleted: ${data?.completedDate || "-"}\nSummary: ${data?.clinicalInfo || "-"}\nResults: ${typeof data?.results === "string" ? data.results : JSON.stringify(data?.results)}`;
  }
  if (kind === "xray") {
    return `XRAY: ${data?.bodyPart} • ${data?.examType}\nReport: ${data?.impression || "-"}\nFindings: ${data?.findings || "-"}`;
  }
  return `US: ${data?.examType}\nReport: ${data?.impression || "-"}\nFindings: ${data?.findings || "-"}`;
}
