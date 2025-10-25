import {Printer, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";

type Props = {
  orders: any[];
  onRemove: (orderId: number) => void;
  onPrint: () => void;
};

export default function RightRailCart({orders, onRemove, onPrint}: Props) {
  const items = (orders || []).filter((o: any) => o.addToCart);
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="font-semibold mb-1">Visit Cart</div>
      <Badge variant="secondary" className="mb-3">{items.length} items</Badge>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No services in today’s visit yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((it: any) => (
            <div key={it.orderId} className="rounded border p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.name}</div>
                  <div className="text-xs text-gray-500">{(it.type || "").toUpperCase()} • {it.status || "—"}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(it.orderId)}>
                  <Trash2 className="h-4 w-4 text-red-600"/>
                </Button>
              </div>
            </div>
          ))}
          <Button className="w-full mt-2" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2"/> Print Summary
          </Button>
        </div>
      )}
    </div>
  );
}
