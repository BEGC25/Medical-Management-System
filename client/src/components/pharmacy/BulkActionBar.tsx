import { Package, DollarSign, Download, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: () => void;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  position?: "top" | "bottom";
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  position = "bottom",
  className = "",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const positionClasses = position === "top" 
    ? "top-0 border-b" 
    : "bottom-0 border-t";

  return (
    <div
      className={`fixed left-0 right-0 z-50 ${positionClasses} bg-white dark:bg-gray-900 shadow-2xl 
                  animate-in slide-in-from-bottom duration-300 ${className}`}
    >
      <div className="container mx-auto px-6 py-4">
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </Button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={action.onClick}
                  className="shadow-premium-sm hover:shadow-premium-md transition-all duration-200"
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Common bulk actions for Stock Overview
export const getStockBulkActions = (
  onBulkReceive: () => void,
  onBulkPriceUpdate: () => void,
  onBulkExport: () => void
): BulkAction[] => [
  {
    id: "bulk-receive",
    label: "Bulk Receive Stock",
    icon: <Package className="w-4 h-4" />,
    variant: "default",
    onClick: onBulkReceive,
  },
  {
    id: "bulk-price",
    label: "Update Prices",
    icon: <DollarSign className="w-4 h-4" />,
    variant: "outline",
    onClick: onBulkPriceUpdate,
  },
  {
    id: "bulk-export",
    label: "Export Selected",
    icon: <Download className="w-4 h-4" />,
    variant: "outline",
    onClick: onBulkExport,
  },
];

// Common bulk actions for Drug Catalog
export const getCatalogBulkActions = (
  onBulkEdit: () => void,
  onBulkExport: () => void
): BulkAction[] => [
  {
    id: "bulk-edit",
    label: "Bulk Edit",
    icon: <Tag className="w-4 h-4" />,
    variant: "default",
    onClick: onBulkEdit,
  },
  {
    id: "bulk-export",
    label: "Export Selected",
    icon: <Download className="w-4 h-4" />,
    variant: "outline",
    onClick: onBulkExport,
  },
];
