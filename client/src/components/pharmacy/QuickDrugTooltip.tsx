import { Drug } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickDrugTooltipProps {
  drug: Drug;
  children: React.ReactNode;
}

// Get quick info based on drug
const getQuickInfo = (drug: Drug) => {
  const genericName = drug.genericName?.toLowerCase() || "";
  
  // Paracetamol/Acetaminophen
  if (genericName.includes("acetaminophen") || genericName.includes("paracetamol")) {
    return {
      description: "Pain reliever and fever reducer",
      onset: "Works in 30-60 minutes",
      instruction: "Take with food or water",
    };
  }
  
  // Antimalarials
  if (genericName.includes("artemether") || genericName.includes("coartem")) {
    return {
      description: "Treats malaria infections",
      onset: "Fever drops in 24-48 hours",
      instruction: "Take with food for better absorption",
    };
  }
  
  // Antibiotics
  if (genericName.includes("amoxicillin") || genericName.includes("antibiotic")) {
    return {
      description: "Fights bacterial infections",
      onset: "Improvement in 2-3 days",
      instruction: "Complete full course even if better",
    };
  }
  
  // Ibuprofen
  if (genericName.includes("ibuprofen")) {
    return {
      description: "Reduces pain, fever and inflammation",
      onset: "Works in 20-30 minutes",
      instruction: "Take with food to avoid stomach upset",
    };
  }
  
  // Default
  return {
    description: "Follow healthcare provider's instructions",
    onset: "Timing varies by medication",
    instruction: "Take as prescribed",
  };
};

export function QuickDrugTooltip({ drug, children }: QuickDrugTooltipProps) {
  const info = getQuickInfo(drug);
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-[350px] p-4 bg-gray-900 dark:bg-gray-800 text-white border-gray-700 shadow-xl"
        >
          <div className="space-y-2.5">
            <div>
              <div className="font-bold text-[15px] flex items-center gap-2">
                <span>💊</span>
                <span className="uppercase">{drug.name}</span>
              </div>
              {drug.genericName && (
                <div className="text-[13px] text-gray-300">({drug.genericName})</div>
              )}
            </div>
            
            <div className="space-y-1.5 text-[13px]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📝</span>
                <span>{info.description}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⏱️</span>
                <span>{info.onset}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="mt-0.5">💊</span>
                <span>{info.instruction}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
              👆 Click ℹ️ for full information
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
