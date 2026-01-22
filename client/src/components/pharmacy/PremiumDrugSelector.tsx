import { useState, useMemo } from "react";
import { Drug } from "@shared/schema";
import { Search, Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getDrugQuickSummary } from "@/lib/drugEducation";

// Default message returned when no educational info is available
const DEFAULT_DRUG_INFO_MESSAGE = "Consult with healthcare provider for information about this medication.";

// Helper function to display drug name with strength, avoiding duplication
const getDrugDisplayName = (drug: Drug): string => {
  if (!drug.strength) {
    return drug.name;
  }
  
  // Check if drug.name already ends with the strength (more precise than contains)
  const nameLower = drug.name.toLowerCase().trim();
  const strengthLower = drug.strength.toLowerCase().trim();
  
  if (nameLower.endsWith(strengthLower)) {
    return drug.name;
  }
  
  // Otherwise, append strength to name
  return `${drug.name} ${drug.strength}`;
};

interface DrugWithStock extends Drug {
  stockOnHand?: number;
  reorderLevel?: number;
}

interface PremiumDrugSelectorProps {
  drugs: DrugWithStock[];
  value: number;
  onChange: (drugId: number) => void;
  placeholder?: string;
}

// Categorize drugs based on generic name or name
const categorizeDrug = (drug: Drug): string => {
  const name = drug.name.toLowerCase();
  const genericName = drug.genericName?.toLowerCase() || "";
  
  // Antibiotics
  if (
    genericName.includes("amoxicillin") || genericName.includes("ampicillin") ||
    genericName.includes("azithromycin") || genericName.includes("ciprofloxacin") ||
    genericName.includes("doxycycline") || genericName.includes("metronidazole") ||
    genericName.includes("cephalexin") || genericName.includes("penicillin") ||
    name.includes("antibiotic")
  ) {
    return "ANTIBIOTICS";
  }
  
  // Antimalarials
  if (
    genericName.includes("artemether") || genericName.includes("artesunate") ||
    genericName.includes("coartem") || genericName.includes("lumefantrine") ||
    genericName.includes("quinine") || genericName.includes("chloroquine") ||
    name.includes("malaria")
  ) {
    return "ANTIMALARIALS";
  }
  
  // Analgesics
  if (
    genericName.includes("paracetamol") || genericName.includes("acetaminophen") ||
    genericName.includes("ibuprofen") || genericName.includes("aspirin") ||
    genericName.includes("diclofenac") || genericName.includes("morphine") ||
    name.includes("pain")
  ) {
    return "ANALGESICS";
  }
  
  return "OTHER";
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ANTIBIOTICS": return "🔬";
    case "ANTIMALARIALS": return "🦟";
    case "ANALGESICS": return "💊";
    default: return "🩺";
  }
};

const getStockStatus = (drug: DrugWithStock) => {
  const stock = drug.stockOnHand || 0;
  const reorder = drug.reorderLevel || 10;
  
  if (stock === 0) {
    return { label: "Out of Stock", icon: "⊘", color: "gray", badge: "muted" };
  } else if (stock <= reorder) {
    return { label: "Low Stock", icon: "⚠️", color: "orange", badge: "warning" };
  } else {
    return { label: "In Stock", icon: "✅", color: "green", badge: "success" };
  }
};

export function PremiumDrugSelector({ drugs, value, onChange, placeholder = "Search and select a drug..." }: PremiumDrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter and categorize drugs
  const categorizedDrugs = useMemo(() => {
    const filtered = drugs.filter(drug => {
      const searchLower = searchQuery.toLowerCase();
      return (
        drug.name.toLowerCase().includes(searchLower) ||
        drug.genericName?.toLowerCase().includes(searchLower) ||
        drug.strength?.toLowerCase().includes(searchLower)
      );
    });

    const categories: Record<string, DrugWithStock[]> = {
      ANTIBIOTICS: [],
      ANTIMALARIALS: [],
      ANALGESICS: [],
      OTHER: []
    };

    filtered.forEach(drug => {
      const category = categorizeDrug(drug);
      categories[category].push(drug);
    });

    return categories;
  }, [drugs, searchQuery]);

  const selectedDrug = drugs.find(d => d.id === value);

  return (
    <div className="relative">
      {/* Display selected drug or trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg 
                   hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                   bg-white dark:bg-gray-800 transition-all duration-200"
      >
        {selectedDrug ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                {getDrugDisplayName(selectedDrug)}
              </div>
              <div className="text-xs text-gray-500">
                {selectedDrug.genericName} • {selectedDrug.form}
              </div>
            </div>
            {selectedDrug.stockOnHand !== undefined && (
              <Badge variant="outline" className="text-xs">
                {selectedDrug.stockOnHand} units
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 
                        dark:border-gray-600 rounded-lg shadow-2xl max-h-[500px] flex flex-col">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Categorized drug list */}
          <ScrollArea className="flex-1 scrollbar-premium" style={{ maxHeight: "400px" }}>
            <div className="p-2" onWheel={(e) => e.stopPropagation()}>
              {Object.entries(categorizedDrugs).map(([category, categoryDrugs]) => {
                if (categoryDrugs.length === 0) return null;

                return (
                  <div key={category} className="mb-4">
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-3 py-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                        {category}
                      </span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {categoryDrugs.length}
                      </Badge>
                    </div>

                    {/* Drugs in category */}
                    <div className="space-y-1">
                      {categoryDrugs.map(drug => {
                        const stockStatus = getStockStatus(drug);
                        const isSelected = drug.id === value;
                        const educationalSummary = getDrugQuickSummary(drug.genericName || drug.name);

                        return (
                          <button
                            key={drug.id}
                            type="button"
                            onClick={() => {
                              onChange(drug.id);
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full px-3 py-3 rounded-lg text-left transition-all duration-150
                              hover:bg-gray-50 dark:hover:bg-gray-700/50
                              ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400' : 'border border-transparent'}
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-lg mt-0.5">💊</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight">
                                  {getDrugDisplayName(drug)}
                                </div>
                                <div className="text-[13px] text-gray-600 dark:text-gray-400 mt-0.5">
                                  {drug.genericName && <span>{drug.genericName} • </span>}
                                  <span className="capitalize">{drug.form}</span>
                                  {drug.manufacturer && <span> • {drug.manufacturer}</span>}
                                </div>
                                
                                {/* Educational Summary */}
                                {educationalSummary && educationalSummary !== DEFAULT_DRUG_INFO_MESSAGE && (
                                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5 italic flex items-start gap-1">
                                    <span className="mt-0.5">📝</span>
                                    <span className="line-clamp-2">{educationalSummary}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={`text-[13px] font-medium flex items-center gap-1
                                    ${stockStatus.color === 'green' ? 'text-green-600 dark:text-green-500' : ''}
                                    ${stockStatus.color === 'orange' ? 'text-orange-600 dark:text-orange-500' : ''}
                                    ${stockStatus.color === 'gray' ? 'text-gray-400 dark:text-gray-500' : ''}
                                  `}>
                                    {stockStatus.icon} {stockStatus.label}
                                    {drug.stockOnHand > 0 && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        ({drug.stockOnHand} {drug.form?.toLowerCase() === 'tablet' ? 'tablets' : 
                                           drug.form?.toLowerCase() === 'capsule' ? 'capsules' : 
                                           drug.form?.toLowerCase() === 'injection' ? 'vials' :
                                           drug.form?.toLowerCase() === 'syrup' ? 'bottles' :
                                           drug.form?.toLowerCase() === 'cream' || drug.form?.toLowerCase() === 'ointment' ? 'tubes' :
                                           'units'})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {Object.values(categorizedDrugs).every(arr => arr.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No drugs found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setSearchQuery("");
          }}
        />
      )}
    </div>
  );
}
