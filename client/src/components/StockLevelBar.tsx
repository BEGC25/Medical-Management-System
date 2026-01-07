import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StockLevelBarProps {
  current: number;
  reorderLevel: number;
  maxDisplay?: number;
}

export default function StockLevelBar({ current, reorderLevel, maxDisplay }: StockLevelBarProps) {
  // Determine display max - use reorderLevel * 3 as reasonable max, or custom maxDisplay
  const displayMax = maxDisplay || Math.max(reorderLevel * 3, current);
  const percentage = Math.min((current / displayMax) * 100, 100);
  
  // Determine status
  const isOutOfStock = current === 0;
  const isCritical = current > 0 && current <= reorderLevel * 0.5;
  const isLow = current > reorderLevel * 0.5 && current <= reorderLevel;
  const isHealthy = current > reorderLevel;
  
  // Color based on status
  let colorClasses = "from-green-400 to-green-600";
  let bgColorClass = "bg-green-100 dark:bg-green-900/20";
  
  if (isOutOfStock) {
    colorClasses = "from-gray-300 to-gray-400";
    bgColorClass = "bg-gray-100 dark:bg-gray-800";
  } else if (isCritical) {
    colorClasses = "from-red-400 to-red-600";
    bgColorClass = "bg-red-100 dark:bg-red-900/20";
  } else if (isLow) {
    colorClasses = "from-amber-400 to-amber-600";
    bgColorClass = "bg-amber-100 dark:bg-amber-900/20";
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <div className={`h-2 rounded-full overflow-hidden ${bgColorClass}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${colorClasses} shadow-sm`}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Current Stock:</strong> {current} units</p>
            <p><strong>Reorder Level:</strong> {reorderLevel} units</p>
            <p className="text-gray-500">
              {isOutOfStock && "Out of stock"}
              {isCritical && "Critical - Reorder immediately"}
              {isLow && "Low stock - Reorder soon"}
              {isHealthy && "Healthy stock level"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
