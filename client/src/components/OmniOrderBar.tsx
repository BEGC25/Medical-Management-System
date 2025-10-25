import {useMemo, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Search, FlaskConical, Scan, Waves, Stethoscope, Pill, Plus, Loader2} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {apiRequest} from "@/lib/queryClient";

type Service = {
  id: number;
  name: string;
  category?: string | null;
  department?: string | null;
  price?: number | null;
  code?: string | null;
  tags?: string[] | null;
};

type Drug = {
  id: number;
  name?: string | null;
  genericName?: string | null;
  strength?: string | null;
};

type Props = {
  encounterId: string;
  services: Service[];
  drugs: Drug[];
  onQueueDrug: (d: { id: number; name: string }) => void;
  className?: string;
};

type Kind = "lab" | "xray" | "ultrasound" | "consult" | "pharmacy";

const synonyms: Record<Kind, string[]> = {
  lab: ["lab", "laboratory", "hematology", "chemistry", "microbiology", "serology"],
  xray: ["xray", "x-ray", "radiology", "imaging", "xr"],
  ultrasound: ["ultrasound", "sono", "us", "sonography", "echo"],
  consult: ["consult", "consultation", "clinic", "doctor", "visit"],
  pharmacy: ["pharmacy", "drug", "medication", "dispensary", "rx"]
};

function normalizeKind(s: Service): Kind | "unknown" {
  const bucket = (s.category || s.department || "").toLowerCase();
  const name = (s.name || "").toLowerCase();
  const hay = `${bucket} ${name}`;
  for (const k of Object.keys(synonyms) as Kind[]) {
    if (synonyms[k].some(w => hay.includes(w))) return k;
  }
  return "unknown";
}

export default function OmniOrderBar({encounterId, services, drugs, onQueueDrug, className}: Props) {
  const [tab, setTab] = useState<Kind>("lab");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const mk = useMemo(() => {
    const catalog = services.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      price: s.price || 0,
      kind: normalizeKind(s) as Kind | "unknown",
      tags: s.tags || [],
      raw: s
    }));

    const byKind = (k: Kind) => catalog.filter(c => c.kind === k);

    const filter = (items: typeof catalog | { id: number; name: string }[]) => {
      if (!q.trim()) return items;
      const needle = q.toLowerCase();
      return items.filter((it: any) =>
        (it.name || "").toLowerCase().includes(needle) ||
        (it.code || "").toLowerCase().includes(needle) ||
        (Array.isArray(it.tags) ? it.tags.join(" ").toLowerCase().includes(needle) : false)
      );
    };

    const pharmacyItems = drugs.map(d => ({
      id: d.id,
      name: `${d.genericName || d.name || "Drug"}${d.strength ? ` ${d.strength}` : ""}`
    }));

    return {
      lab: filter(byKind("lab")),
      xray: filter(byKind("xray")),
      ultrasound: filter(byKind("ultrasound")),
      consult: filter(byKind("consult")),
      pharmacy: filter(pharmacyItems)
    };
  }, [services, drugs, q]);

  const orderMutation = useMutation({
    mutationFn: async (payload: { serviceId: number; kind: Kind; name: string; price: number }) => {
      const {serviceId, kind, name, price} = payload;
      const body = {
        encounterId,
        serviceId,
        relatedType: kind,
        description: name,
        quantity: 1,
        unitPriceSnapshot: price,
        totalPrice: price,
        department: kind,
        orderedBy: "Dr. System"
      };
      const res = await apiRequest("POST", "/api/order-lines", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/visits", encounterId, "orders"]});
    }
  });

  const TabBtn = ({k, icon: Icon, label}: { k: Kind; icon: any; label: string }) => (
    <Button
      type="button"
      variant={tab === k ? "default" : "outline"}
      onClick={() => setTab(k)}
      className="gap-2"
    >
      <Icon className="h-4 w-4"/>
      {label}
      <Badge variant="secondary" className="ml-1">
        {(mk as any)[k].length}
      </Badge>
    </Button>
  );

  const addService = (svc: any, kind: Kind) => {
    orderMutation.mutate({serviceId: svc.id, kind, name: svc.name, price: svc.price || 0});
  };

  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${className || ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <TabBtn k="lab" icon={FlaskConical} label="Lab"/>
        <TabBtn k="xray" icon={Scan} label="X-Ray"/>
        <TabBtn k="ultrasound" icon={Waves} label="Ultrasound"/>
        <TabBtn k="consult" icon={Stethoscope} label="Consult"/>
        <TabBtn k="pharmacy" icon={Pill} label="Pharmacy"/>

        <div className="ml-auto relative w-[320px]">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search services…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="mt-3">
        {/* Lab / XRay / US / Consult = services */}
        {tab !== "pharmacy" && (mk as any)[tab].length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(mk as any)[tab].map((svc: any) => (
              <div key={`${tab}-${svc.id}`} className="flex items-center justify-between rounded border p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{svc.name}</div>
                  <div className="text-xs text-gray-500">
                    {svc.code ? `Code: ${svc.code} • ` : ""} {svc.price ? `SSP ${svc.price}` : "—"}
                  </div>
                </div>
                <Button size="sm" onClick={() => addService(svc, tab)} disabled={orderMutation.isPending}>
                  {orderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4 mr-1"/>}
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Pharmacy = drugs to queue into Medications tab */}
        {tab === "pharmacy" && (mk as any).pharmacy.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(mk as any).pharmacy.map((d: any) => (
              <div key={`drug-${d.id}`} className="flex items-center justify-between rounded border p-3">
                <div className="font-medium truncate">{d.name}</div>
                <Button size="sm" onClick={() => onQueueDrug({id: d.id, name: d.name})}>
                  <Plus className="h-4 w-4 mr-1"/> Queue
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {(mk as any)[tab].length === 0 && (
          <div className="text-sm text-gray-500 p-4">
            No matching services. Try another tab or search term. If this keeps showing, set service
            categories to one of: <span className="font-mono">lab, xray, ultrasound, consultation, pharmacy</span>
            (synonyms like “radiology”, “laboratory”, “sono”, “consultation” are handled too).
          </div>
        )}
      </div>
    </div>
  );
}
