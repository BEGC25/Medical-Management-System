import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Printer } from "lucide-react";

type VisitOrder = {
  orderId: number;
  name: string;
  type: string;      // lab|xray|ultrasound|consultation|...
  status: string;
  addToCart?: number | boolean;
  price?: number;    // if you have it on the object
};

type Props = {
  orders: VisitOrder[];
  onRemove: (orderId: number) => void;     // toggle addToCart false
  onPrint?: () => void;
};

export default function RightRailCart({ orders, onRemove, onPrint }: Props) {
  const items = orders.filter(o => !!o.addToCart);
  const total = items.reduce((sum, o) => sum + (o.price ?? 0), 0);

  return (
    <Card className="p-4 sticky top-4 h-fit space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <div className="font-semibold">Visit Cart</div>
        </div>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-500">No services in today’s visit yet.</p>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((o) => (
            <div key={o.orderId} className="rounded border p-2 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium leading-tight">{o.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{o.type} • {o.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  {o.price != null && (
                    <div className="text-sm font-semibold">SSP {o.price}</div>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onRemove(o.orderId)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t pt-2 flex items-center justify-between">
            <div className="text-sm font-medium">Subtotal</div>
            <div className="text-lg font-semibold">{total ? `SSP ${total}` : "—"}</div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Summary
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
