import { Drug } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pill } from "lucide-react";

interface DrugInfoTooltipProps {
  drug: Drug;
  children: React.ReactNode;
}

// Generate quick summary based on drug type
const getQuickSummary = (drug: Drug): string => {
  const name = drug.name.toLowerCase();
  const genericName = drug.genericName?.toLowerCase() || "";
  
  // Paracetamol/Acetaminophen
  if (genericName.includes("acetaminophen") || genericName.includes("paracetamol")) {
    return "Pain reliever and fever reducer. Safe for most patients. Take with food.";
  }

  // Antimalarials
  if (name.includes("artemether") || name.includes("lumefantrine") || name.includes("coartem")) {
    return "First-line malaria treatment. Take twice daily for 3 days with food.";
  }

  if (name.includes("artesunate") && name.includes("amodiaquine")) {
    return "First-line malaria treatment in South Sudan. Take once daily for 3 days.";
  }

  if (name.includes("artesunate") && drug.form === "injection") {
    return "EMERGENCY treatment for severe malaria. Life-saving medication.";
  }

  if (genericName.includes("quinine") && drug.form === "injection") {
    return "Injectable treatment for severe malaria. Given by slow IV drip.";
  }

  // Antibiotics
  if (genericName.includes("amoxicillin")) {
    return "Antibiotic for bacterial infections. Take full course even if feeling better.";
  }

  if (genericName.includes("azithromycin")) {
    return "Antibiotic for chest, throat and ear infections. Short 3-5 day course.";
  }

  if (genericName.includes("ciprofloxacin")) {
    return "Antibiotic for urinary and stomach infections. Drink plenty of water.";
  }

  // Ibuprofen
  if (genericName.includes("ibuprofen")) {
    return "Pain, fever and inflammation reliever. Take with food to protect stomach.";
  }

  // Omeprazole
  if (genericName.includes("omeprazole")) {
    return "Reduces stomach acid for ulcers and heartburn. Take before breakfast.";
  }

  // Metformin
  if (genericName.includes("metformin")) {
    return "Controls blood sugar in diabetes. Take with meals to reduce stomach upset.";
  }

  // Amlodipine
  if (genericName.includes("amlodipine")) {
    return "Lowers blood pressure. Take once daily at same time.";
  }

  // Generic fallback
  return `${drug.form} medication. Consult healthcare provider for specific uses.`;
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
