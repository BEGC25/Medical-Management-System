import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Beaker, XRay, Waves, Stethoscope, Pill, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Service, Drug } from "@shared/schema";

type CatalogItem =
  | { kind: "service"; id: number; name: string; category: string; price?: number }
  | { kind: "drug"; id: number; name: string; strength?: string; stock?: number };

function iconFor(kind: CatalogItem["kind"], category?: string) {
  if (kind === "drug") return <Pill className="h-4 w-4" />;
  if (category === "lab") return <Beaker className="h-4 w-4" />;
  if (category === "xray") return <XRay className="h-4 w-4" />;
  if (category === "ultrasound") return <Waves className="h-4 w-4" />;
  if (category === "consultation") return <Stethoscope className="h-4 w-4" />;
  return <Plus className="h-4 w-4" />;
}

export type OmniOrderBarProps = {
  encounterId: string;                 // currentEncounter.encounterId
  services: Service[];                 // from /api/services
  drugs: Drug[];                       // from /api/pharmacy/drugs
  onQueueDrug: (d: { id: number; name: string }) => void; // prefill Meds composer
  className?: string;
};

export default function OmniOrderBar({ encounterId, services, drugs, onQueueDrug, className }: OmniOrderBarProps) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<CatalogItem | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const catalog: CatalogItem[] = useMemo(() => {
    const svc: CatalogItem[] = services.map(s => ({
      kind: "service",
      id: s.id as number,
      name: s.name,
      category: s.category,
      price: (s as any).price,
    }));
    const meds: CatalogItem[] = drugs.map(d => ({
      kind: "drug",
      id: d.id as number,
      name: (d.genericName || d.name) + (d.strength ? ` ${d.strength}` : ""),
      strength: d.strength,
      stock: (d as any).stock,
    }));
    return [...svc, ...meds];
  }, [services, drugs]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return catalog.slice(0, 8);
    return catalog
      .filter(it =>
        it.name.toLowerCase().includes(term) ||
        (it.kind === "service" && (it.category || "").toLowerCase().includes(term))
      )
      .slice(0, 12);
  }, [q, catalog]);

  const createOrderLine = useMutation({
    mutationFn: async (svc: Extract<CatalogItem, { kind: "service" }>) => {
      const body = {
        encounterId,
        serviceId: svc.id,
        relatedType: svc.category,            // "lab" | "xray" | "ultrasound" | "consultation" | ...
        description: svc.name,
        quantity: 1,
        unitPriceSnapshot: svc.price ?? 0,
        totalPrice: svc.price ?? 0,
        department: svc.category,
        orderedBy: "Dr. System",
      };
      const res = await apiRequest("POST", "/api/order-lines", body);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/visits", encounterId, "orders"] });
      toast({ title: "Ordered", description: picked?.name || "Service added" });
      setPicked(null);
      setQ("");
    },
    onError: () => {
      toast({ title: "Failed to order", variant: "destructive" });
    },
  });

  const handlePick = (item: CatalogItem) => {
    setPicked(item);
    if (item.kind === "drug") {
      onQueueDrug({ id: item.id, name: item.name });
      toast({ title: "Queued medication", description: item.name });
      setQ("");
      return;
    }
    createOrderLine.mutate(item);
  };

  return (
    <div className={className}>
      <Card className="p-3 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-700/80 dark:text-blue-300" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order lab, imaging, service, or queue a drug…  (e.g., CBC, Chest X-Ray, Amoxicillin)"
            className="border-0 shadow-none focus-visible:ring-0 text-[15px]"
          />
          {createOrderLine.isPending && <Loader2 className="h-4 w-4 animate-spin text-blue-700" />}
        </div>

        {/* results list */}
        {results.length > 0 && (
          <div className="mt-3 grid md:grid-cols-2 gap-2">
            {results.map((it, idx) => (
              <button
                key={idx}
                onClick={() => handlePick(it)}
                className="flex items-center justify-between rounded-md border bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-800 transition p-2 text-left"
              >
                <div className="flex items-center gap-2">
                  {iconFor(it.kind, (it as any).category)}
                  <div>
                    <div className="font-medium leading-tight">{it.name}</div>
                    {it.kind === "service" && (
                      <div className="text-xs text-gray-500 capitalize">
                        {(it as any).category}
                      </div>
                    )}
                    {it.kind === "drug" && (
                      <div className="text-xs text-gray-500">
                        {(it as any).stock != null ? `Stock: ${(it as any).stock}` : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {it.kind === "service" && (it as any).price != null && (
                    <Badge variant="outline">SSP {(it as any).price}</Badge>
                  )}
                  <Plus className="h-4 w-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
