// src/components/OmniOrderBar.tsx
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Lucide from "lucide-react"; // ✅ avoids missing named-export crashes
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // or swap for your own cx helper if you prefer
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Service, Drug } from "@shared/schema";

type Props = {
  encounterId: string;
  services: Service[];
  drugs: Drug[];
  onQueueDrug: (d: { id: number | string; name: string }) => void;
  className?: string;
};

// ✅ Safe icon map (fallbacks keep older lucide versions happy)
const Icons = {
  Search: Lucide.Search,
  Beaker: (Lucide as any).Beaker ?? (Lucide as any).FlaskConical ?? Lucide.TestTube,
  XRay: (Lucide as any).XRay ?? Lucide.Image,
  Waves: (Lucide as any).Waves ?? Lucide.Activity,
  Stethoscope: (Lucide as any).Stethoscope ?? (Lucide as any).HeartPulse ?? Lucide.Activity,
  Pill: Lucide.Pill,
  Plus: Lucide.Plus,
  Loader: (Lucide as any).Loader2 ?? Lucide.Loader,
};

const CATS = [
  { key: "lab", label: "Lab", icon: Icons.Beaker },
  { key: "xray", label: "X-Ray", icon: Icons.XRay },
  { key: "ultrasound", label: "Ultrasound", icon: Icons.Waves },
  { key: "consultation", label: "Consult", icon: Icons.Stethoscope },
  { key: "pharmacy", label: "Pharmacy", icon: Icons.Pill },
] as const;

export default function OmniOrderBar({ encounterId, services, drugs, onQueueDrug, className }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [active, setActive] = useState<(typeof CATS)[number]["key"]>("lab");
  const [term, setTerm] = useState("");

  // Filter helpers
  const normalized = term.trim().toLowerCase();

  const serviceMatches = useMemo(() => {
    const pool = services.filter((s) => (s.category || "").toLowerCase() === active);
    if (!normalized) return pool.slice(0, 8);
    return pool
      .filter((s) => [s.name, s.code, s.category].join(" ").toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [services, active, normalized]);

  const drugMatches = useMemo(() => {
    if (active !== "pharmacy") return [];
    const pool = drugs;
    if (!normalized) return pool.slice(0, 12);
    return pool
      .filter((d) =>
        [d.name, d.genericName, d.strength, d.form].filter(Boolean).join(" ").toLowerCase().includes(normalized)
      )
      .slice(0, 12);
  }, [active, drugs, normalized]);

  // Create an order-line for services (lab/xray/ultrasound/consultation)
  const addOrderMutation = useMutation({
    mutationFn: async (svc: Service) => {
      const body = {
        encounterId,
        serviceId: svc.id,
        relatedType: (svc.category || active) as string,
        description: svc.name,
        quantity: 1,
        unitPriceSnapshot: svc.price,
        totalPrice: svc.price,
        department: svc.category || active,
        orderedBy: "Dr. System",
      };
      const res = await apiRequest("POST", "/api/order-lines", body);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/visits", encounterId, "orders"] });
      toast({ title: "Added", description: "Order queued successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to add order.", variant: "destructive" }),
  });

  return (
    <Card className={cn("p-3 sm:p-4 border-2 border-blue-100 dark:border-blue-800", className)}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 overflow-x-auto">
        {CATS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant={active === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(key)}
            className="whitespace-nowrap"
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        ))}

        <div className="relative ml-auto min-w-[200px] flex-1 max-w-sm">
          <Icons.Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${active === "pharmacy" ? "drugs" : "services"}…`}
            className="pl-8"
          />
        </div>
      </div>

      {/* Results */}
      {active === "pharmacy" ? (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {drugMatches.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded border p-2 bg-white dark:bg-gray-900">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {d.genericName || d.name}
                  {d.strength ? <span className="text-muted-foreground"> • {d.strength}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">{d.form}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onQueueDrug({ id: d.id, name: d.genericName || d.name })}
                title="Queue drug for prescription"
              >
                <Icons.Plus className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {drugMatches.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">No matching drugs.</div>
          )}
        </ul>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {serviceMatches.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded border p-2 bg-white dark:bg-gray-900">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                  <Badge variant="secondary">{s.category}</Badge>
                  {s.price != null && <span>SSP {Number(s.price).toLocaleString()}</span>}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addOrderMutation.mutate(s)}
                disabled={addOrderMutation.isPending}
                title="Add order"
              >
                {addOrderMutation.isPending ? (
                  <Icons.Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Plus className="h-4 w-4" />
                )}
              </Button>
            </li>
          ))}
          {serviceMatches.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">No matching services.</div>
          )}
        </ul>
      )}
    </Card>
  );
}
