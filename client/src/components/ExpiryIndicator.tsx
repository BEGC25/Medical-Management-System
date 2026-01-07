import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface ExpiryIndicatorProps {
  expiryDate: string;
  showIcon?: boolean;
  showText?: boolean;
}

export default function ExpiryIndicator({ expiryDate, showIcon = true, showText = true }: ExpiryIndicatorProps) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysToExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine status
  const isExpired = daysToExpiry < 0;
  const isCritical = daysToExpiry >= 0 && daysToExpiry < 30;
  const isWarning = daysToExpiry >= 30 && daysToExpiry < 90;
  const isGood = daysToExpiry >= 90;
  
  // Colors and icons
  let colorClass = "text-green-600 dark:text-green-400";
  let bgClass = "bg-green-50 dark:bg-green-900/20";
  let borderClass = "border-green-200 dark:border-green-800";
  let Icon = CheckCircle;
  
  if (isExpired) {
    colorClass = "text-red-700 dark:text-red-400";
    bgClass = "bg-red-100 dark:bg-red-900/30";
    borderClass = "border-red-300 dark:border-red-700";
    Icon = AlertTriangle;
  } else if (isCritical) {
    colorClass = "text-red-600 dark:text-red-400";
    bgClass = "bg-red-50 dark:bg-red-900/20";
    borderClass = "border-red-200 dark:border-red-800";
    Icon = AlertTriangle;
  } else if (isWarning) {
    colorClass = "text-amber-600 dark:text-amber-400";
    bgClass = "bg-amber-50 dark:bg-amber-900/20";
    borderClass = "border-amber-200 dark:border-amber-800";
    Icon = Clock;
  }
  
  const shouldPulse = isExpired || isCritical;
  
  const statusText = isExpired 
    ? "EXPIRED" 
    : isCritical 
      ? `${daysToExpiry}d` 
      : isWarning 
        ? `${daysToExpiry}d`
        : expiry.toLocaleDateString();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={shouldPulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${bgClass} ${borderClass} border`}
          >
            {showIcon && <Icon className={`w-3.5 h-3.5 ${colorClass}`} />}
            {showText && <span className={`text-xs font-medium ${colorClass}`}>{statusText}</span>}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Expiry Date:</strong> {expiry.toLocaleDateString()}</p>
            {!isExpired && <p><strong>Days Remaining:</strong> {daysToExpiry} days</p>}
            <p className={colorClass}>
              {isExpired && "⚠️ Expired - Do not dispense"}
              {isCritical && "⚠️ Expires very soon - Use urgently"}
              {isWarning && "⚠️ Expires within 90 days"}
              {isGood && "✓ Good expiry date"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
