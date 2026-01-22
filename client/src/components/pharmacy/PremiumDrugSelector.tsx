import { useState, useMemo, useEffect } from "react";
import { Drug } from "@shared/schema";
import { Search, Package, CheckCircle, AlertTriangle, XCircle, Pill, Syringe, Droplets, Wind, FlaskConical, CircleDot, Pipette } from "lucide-react";
import { Input } from "@/components/ui/input";
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
}

interface PremiumDrugSelectorProps {
  drugs: DrugWithStock[];
  value: number;
  onChange: (drugId: number) => void;
  placeholder?: string;
}

// Categorize drugs based on generic name or name
const categorizeDrug = (drug: Drug): string => {
  // Combine name and genericName for comprehensive matching
  const searchText = `${drug.name} ${drug.genericName || ''}`.toLowerCase();
  
  // Antibiotics - check combined text
  const antibioticKeywords = [
    'amoxicillin', 'ampicillin', 'azithromycin', 'ciprofloxacin',
    'doxycycline', 'metronidazole', 'cephalexin', 'penicillin',
    'clindamycin', 'erythromycin', 'gentamicin', 'ceftriaxone',
    'antibiotic', 'cefixime', 'levofloxacin', 'trimethoprim',
    'nitrofurantoin', 'flucloxacillin'
  ];
  if (antibioticKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIBIOTICS";
  }
  
  // Antimalarials
  const antimalarialKeywords = [
    'artemether', 'artesunate', 'coartem', 'lumefantrine',
    'quinine', 'chloroquine', 'malaria', 'artemisinin',
    'primaquine', 'mefloquine', 'amodiaquine'
  ];
  if (antimalarialKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIMALARIALS";
  }
  
  // Analgesics / Pain Relief
  const analgesicKeywords = [
    'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin',
    'diclofenac', 'morphine', 'tramadol', 'codeine',
    'naproxen', 'pain', 'analgesic', 'meloxicam', 'piroxicam'
  ];
  if (analgesicKeywords.some(kw => searchText.includes(kw))) {
    return "ANALGESICS";
  }
  
  // Gastrointestinal
  const giKeywords = [
    'omeprazole', 'ranitidine', 'metoclopramide', 'loperamide',
    'antacid', 'bisacodyl', 'lactulose', 'ondansetron',
    'pantoprazole', 'esomeprazole', 'domperidone'
  ];
  if (giKeywords.some(kw => searchText.includes(kw))) {
    return "GASTROINTESTINAL";
  }
  
  // Vitamins & Supplements
  const vitaminKeywords = [
    'vitamin', 'folic', 'iron', 'calcium', 'zinc',
    'multivitamin', 'b12', 'b-complex', 'supplement'
  ];
  if (vitaminKeywords.some(kw => searchText.includes(kw))) {
    return "VITAMINS";
  }
  
  // Cardiovascular
  const cardioKeywords = [
    'amlodipine', 'atenolol', 'lisinopril', 'losartan',
    'furosemide', 'hydrochlorothiazide', 'enalapril', 'metoprolol',
    'nifedipine', 'digoxin', 'warfarin'
  ];
  if (cardioKeywords.some(kw => searchText.includes(kw))) {
    return "CARDIOVASCULAR";
  }
  
  // Antidiabetics
  const diabetesKeywords = [
    'metformin', 'glibenclamide', 'gliclazide', 'insulin',
    'glimepiride', 'diabetes', 'diabetic'
  ];
  if (diabetesKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIDIABETICS";
  }
  
  // Respiratory
  const respiratoryKeywords = [
    'salbutamol', 'beclomethasone', 'budesonide', 'theophylline',
    'montelukast', 'inhaler', 'nebulizer', 'asthma'
  ];
  if (respiratoryKeywords.some(kw => searchText.includes(kw))) {
    return "RESPIRATORY";
  }
  
  // Antihistamines / Allergy
  const antihistamineKeywords = [
    'cetirizine', 'loratadine', 'chlorpheniramine', 'diphenhydramine',
    'promethazine', 'antihistamine', 'allergy', 'fexofenadine'
  ];
  if (antihistamineKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIHISTAMINES";
  }
  
  // Antifungals
  const antifungalKeywords = [
    'fluconazole', 'clotrimazole', 'ketoconazole', 'nystatin',
    'miconazole', 'terbinafine', 'antifungal', 'griseofulvin'
  ];
  if (antifungalKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIFUNGALS";
  }
  
  // Steroids / Corticosteroids
  const steroidKeywords = [
    'prednisolone', 'dexamethasone', 'hydrocortisone', 'prednisone',
    'betamethasone', 'steroid', 'corticosteroid'
  ];
  if (steroidKeywords.some(kw => searchText.includes(kw))) {
    return "STEROIDS";
  }
  
  // Antiparasitics
  const antiparasiticKeywords = [
    'mebendazole', 'albendazole', 'ivermectin', 'praziquantel',
    'antiparasitic', 'deworming'
  ];
  if (antiparasiticKeywords.some(kw => searchText.includes(kw))) {
    return "ANTIPARASITICS";
  }

  return "OTHER";
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ANTIBIOTICS": return "🦠";
    case "ANTIMALARIALS": return "🦟";
    case "ANALGESICS": return "💊";
    case "GASTROINTESTINAL": return "🔬";
    case "CARDIOVASCULAR": return "❤️";
    case "ANTIDIABETICS": return "🩸";
    case "RESPIRATORY": return "🫁";
    case "ANTIHISTAMINES": return "🤧";
    case "ANTIFUNGALS": return "🍄";
    case "ANTIPARASITICS": return "🐛";
    case "STEROIDS": return "💪";
    case "VITAMINS": return "🌟";
    default: return "🩺";
  }
};

const getCategoryDisplayName = (category: string) => {
  if (category === "OTHER") return "OTHER MEDICATIONS";
  return category;
};

const getFormIcon = (form: string) => {
  const iconClass = "w-5 h-5";
  switch (form?.toLowerCase()) {
    case 'tablet': 
      return <CircleDot className={`${iconClass} text-blue-500`} />;
    case 'capsule': 
      return <Pill className={`${iconClass} text-purple-500`} />;
    case 'syrup': 
      return <FlaskConical className={`${iconClass} text-amber-500`} />;
    case 'injection': 
      return <Syringe className={`${iconClass} text-red-500`} />;
    case 'cream': 
    case 'ointment':
      return <Droplets className={`${iconClass} text-pink-500`} />;
    case 'drops': 
      return <Pipette className={`${iconClass} text-cyan-500`} />;
    case 'inhaler': 
      return <Wind className={`${iconClass} text-teal-500`} />;
    default: 
      return <Pill className={`${iconClass} text-gray-500`} />;
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

const getStockBadgeClasses = (status: string) => {
  switch (status) {
    case 'green': // In Stock
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    case 'orange': // Low Stock  
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    case 'gray': // Out of Stock
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

export function PremiumDrugSelector({ drugs, value, onChange, placeholder = "Search and select a drug..." }: PremiumDrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Add debug logging for development
  useEffect(() => {
    if (drugs.length === 0) {
      console.warn('[PremiumDrugSelector] No drugs received - check API');
    } else if (drugs.length < 5) {
      console.log('[PremiumDrugSelector] Low drug count:', drugs.length, drugs);
    }
  }, [drugs]);

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
      ANALGESICS: [],
      ANTIMALARIALS: [],
      GASTROINTESTINAL: [],
      CARDIOVASCULAR: [],
      ANTIDIABETICS: [],
      RESPIRATORY: [],
      ANTIHISTAMINES: [],
      ANTIFUNGALS: [],
      ANTIPARASITICS: [],
      STEROIDS: [],
      VITAMINS: [],
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
        className="w-full px-4 py-3.5 text-left 
                   bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
                   border-2 border-gray-200 dark:border-gray-700 
                   rounded-xl 
                   hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                   transition-all duration-300 ease-out
                   group"
      >
        {selectedDrug ? (
          <div className="flex items-center gap-2">
            {getFormIcon(selectedDrug.form)}
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
        <div className="absolute z-50 w-full mt-2 
                        bg-white/80 dark:bg-gray-900/80 
                        backdrop-blur-xl 
                        border border-white/20 dark:border-gray-700/50
                        rounded-2xl 
                        shadow-2xl shadow-purple-500/10
                        overflow-hidden max-h-[500px] flex flex-col">
          {/* Total drug count */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <span className="text-sm font-semibold tracking-wide">
              {drugs.length} medications available
            </span>
          </div>
          
          {/* Search input */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 
                          bg-white dark:bg-gray-900 
                          border-2 border-gray-200 dark:border-gray-700
                          rounded-xl
                          focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                          placeholder:text-gray-400
                          transition-all duration-200"
                autoFocus
              />
            </div>
          </div>

          {/* Categorized drug list - USE NATIVE SCROLL */}
          <div 
            className="flex-1 overflow-y-auto relative"
            style={{ 
              maxHeight: "400px",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <div className="p-2">
              {Object.entries(categorizedDrugs).map(([category, categoryDrugs]) => {
                if (categoryDrugs.length === 0) return null;

                return (
                  <div key={category} className="mb-4">
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 mb-2 
                                    bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20
                                    border-l-4 border-purple-500
                                    rounded-r-lg">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        {getCategoryDisplayName(category)}
                      </span>
                      <Badge className="ml-auto bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-semibold">
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
                            className={`
                              w-full px-4 py-3.5 rounded-xl text-left 
                              transition-all duration-200 ease-out
                              hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 
                              dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20
                              hover:shadow-md hover:shadow-purple-500/5
                              hover:scale-[1.01] hover:-translate-y-0.5
                              ${isSelected 
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' 
                                : 'bg-white/50 dark:bg-gray-800/50'}
                            `}
                          >
                            <div className="flex items-start gap-2">
                              {getFormIcon(drug.form)}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight">
                                  {getDrugDisplayName(drug)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  {drug.genericName && <span>{drug.genericName} • </span>}
                                  <span className="capitalize">{drug.form}</span>
                                  {drug.manufacturer && <span> • {drug.manufacturer}</span>}
                                </div>
                                
                                {/* Educational Summary */}
                                {educationalSummary && educationalSummary !== DEFAULT_DRUG_INFO_MESSAGE && (
                                  <div className="text-xs text-gray-500 italic flex items-start gap-1 mt-1.5">
                                    <span className="mt-0.5">📝</span>
                                    <span className="line-clamp-2">{educationalSummary}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge className={`text-xs font-medium ${getStockBadgeClasses(stockStatus.color)}`}>
                                    {stockStatus.icon} {stockStatus.label}
                                    {drug.stockOnHand !== undefined && drug.stockOnHand > 0 && (
                                      <span className="ml-1">
                                        ({drug.stockOnHand} {drug.form?.toLowerCase() === 'tablet' ? 'tablets' : 
                                           drug.form?.toLowerCase() === 'capsule' ? 'capsules' : 
                                           drug.form?.toLowerCase() === 'injection' ? 'vials' :
                                           drug.form?.toLowerCase() === 'syrup' ? 'bottles' :
                                           drug.form?.toLowerCase() === 'cream' || drug.form?.toLowerCase() === 'ointment' ? 'tubes' :
                                           'units'})
                                      </span>
                                    )}
                                  </Badge>
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
            
            {/* Smooth Scroll Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
          </div>
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
