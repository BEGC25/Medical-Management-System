import { Drug } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pill } from "lucide-react";
import { getDrugQuickSummary } from "@/lib/drugEducation";

interface DrugInfoTooltipProps {
  drug: Drug;
  children: React.ReactNode;
}

// Generate quick summary from shared module
const getQuickSummary = (drug: Drug): string => {
  return getDrugQuickSummary(drug.genericName || drug.name);
};

export function DrugInfoTooltip({ drug, children }: DrugInfoTooltipProps) {
  const summary = getQuickSummary(drug);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs p-3 bg-gray-900 dark:bg-gray-800 text-white border-purple-600/50"
          side="top"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Pill className="w-4 h-4 text-purple-400" />
              {drug.name}
            </div>
            <p className="text-sm text-gray-200">{summary}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
