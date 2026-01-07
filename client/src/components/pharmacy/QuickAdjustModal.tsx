import { useState, useEffect } from "react";
import { Plus, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drug } from "@shared/schema";

interface QuickAdjustModalProps {
  drug: (Drug & { stockOnHand: number }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (adjustment: {
    drugId: number;
    type: "receive" | "dispense" | "adjust";
    quantity: number;
    reason?: string;
  }) => void;
}

export function QuickAdjustModal({
  drug,
  open,
  onOpenChange,
  onConfirm,
}: QuickAdjustModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"receive" | "dispense" | "adjust">("receive");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");

  // Reset form when drug changes or modal closes
  useEffect(() => {
    if (!open) {
      setAdjustmentType("receive");
      setQuantity("");
      setReason("");
    }
  }, [open]);

  if (!drug) return null;

  const quantityNum = parseInt(quantity) || 0;
  let newStock = drug.stockOnHand;

  if (adjustmentType === "receive") {
    newStock += quantityNum;
  } else if (adjustmentType === "dispense") {
    newStock -= quantityNum;
  } else if (adjustmentType === "adjust") {
    // For adjust, quantity can be positive or negative
    newStock += quantityNum;
  }

  const isNegativeStock = newStock < 0;
  const isValid = quantityNum > 0 && !isNegativeStock;

  const handleIncrement = (amount: number) => {
    const current = parseInt(quantity) || 0;
    setQuantity(String(Math.max(0, current + amount)));
  };

  const handleConfirm = () => {
    if (!isValid) return;

    onConfirm({
      drugId: drug.id,
      type: adjustmentType,
      quantity: quantityNum,
      reason: reason.trim() || undefined,
    });

    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleConfirm();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleIncrement(-1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Quick Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust stock levels for {drug.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Drug Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                        p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{drug.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                  {drug.stockOnHand}
                </span>
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receive" id="receive" />
                <Label htmlFor="receive" className="cursor-pointer">
                  Receive (+) - Add stock
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dispense" id="dispense" />
                <Label htmlFor="dispense" className="cursor-pointer">
                  Dispense (-) - Remove stock
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adjust" id="adjust" />
                <Label htmlFor="adjust" className="cursor-pointer">
                  Adjust (±) - Manual correction
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quantity Input with Quick Buttons */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleIncrement(-10)}
                className="px-3"
              >
                -10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleIncrement(-1)}
                className="px-3"
              >
                -1
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="flex-1 text-center text-lg font-semibold"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleIncrement(1)}
                className="px-3"
              >
                +1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleIncrement(10)}
                className="px-3"
              >
                +10
              </Button>
            </div>
          </div>

          {/* New Stock Preview */}
          <div className={`p-4 rounded-lg border-2 ${
            isNegativeStock 
              ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700" 
              : "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-700"
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Stock Level:
              </span>
              <span className={`text-2xl font-bold ${
                isNegativeStock 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-green-600 dark:text-green-400"
              }`}>
                {newStock}
              </span>
            </div>
            {isNegativeStock && (
              <div className="flex items-start gap-2 mt-2 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Cannot set negative stock. Please adjust the quantity.</p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Save Adjustment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
