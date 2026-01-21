import { Drug } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Pill, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle,
  XCircle
} from "lucide-react";

interface DrugInfoModalProps {
  drug: Drug | null;
  stockInfo?: {
    stockOnHand: number;
    price: number;
    expiryDate?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Educational drug information based on generic name patterns
const getEducationalInfo = (drug: Drug) => {
  const name = drug.name.toLowerCase();
  const genericName = drug.genericName?.toLowerCase() || "";
  
  // Default educational information
  let info = {
    whatItDoes: "This medication is used to treat specific medical conditions. Consult with healthcare provider for specific uses.",
    commonUses: ["As prescribed by healthcare provider"],
    importantSafety: {
      dos: ["Take as prescribed", "Follow dosage instructions", "Store in cool, dry place"],
      donts: ["Do not share medication", "Do not exceed recommended dose", "Do not use if expired"]
    },
    howFastItWorks: {
      onset: "Varies by medication",
      duration: "Follow prescribed schedule"
    },
    specialGroups: {
      pregnancy: "Consult healthcare provider",
      breastfeeding: "Consult healthcare provider",
      children: "Use as directed by healthcare provider",
      elderly: "May require dose adjustment"
    }
  };

  // Paracetamol/Acetaminophen
  if (genericName.includes("acetaminophen") || genericName.includes("paracetamol")) {
    info = {
      whatItDoes: "Reduces pain and fever. Works by blocking pain signals in the brain and lowering body temperature. Safe for most patients including children and pregnant women.",
      commonUses: [
        "Headache and body pain",
        "Fever from malaria or infections",
        "Menstrual cramps",
        "Post-surgical pain",
        "Arthritis pain relief"
      ],
      importantSafety: {
        dos: ["Take with food or water", "Space doses 4-6 hours apart", "Safe for children and pregnancy"],
        donts: ["Maximum 8 tablets per day (4000mg)", "Avoid alcohol while taking", "Dangerous in severe liver disease", "Do not combine with other paracetamol products"]
      },
      howFastItWorks: {
        onset: "Pain relief: 30-60 minutes, Fever reduction: 1-2 hours",
        duration: "4-6 hours per dose"
      },
      specialGroups: {
        pregnancy: "Safe in all trimesters",
        breastfeeding: "Safe",
        children: "Safe from 3 months (dose by weight)",
        elderly: "Safe, use normal dose"
      }
    };
  }

  // Antimalarials
  if (name.includes("artemether") || name.includes("lumefantrine") || name.includes("coartem")) {
    info = {
      whatItDoes: "First-line treatment for uncomplicated malaria. Kills malaria parasites in the blood quickly. Combination therapy prevents resistance.",
      commonUses: [
        "Uncomplicated malaria (P. falciparum)",
        "First-line treatment in South Sudan",
        "All age groups"
      ],
      importantSafety: {
        dos: ["Take twice daily for 3 days", "Take with food or milk for best absorption", "Complete full 6-dose course", "Take at regular intervals (morning and evening)"],
        donts: ["Do not skip doses", "Do not stop if feeling better", "Avoid grapefruit juice", "Report persistent fever after treatment"]
      },
      howFastItWorks: {
        onset: "Fever reduction: 24-48 hours",
        duration: "3-day treatment course"
      },
      specialGroups: {
        pregnancy: "Safe in 2nd and 3rd trimester, consult for 1st trimester",
        breastfeeding: "Safe",
        children: "Safe from 5kg body weight, dose by weight",
        elderly: "Safe, monitor for side effects"
      }
    };
  }

  if (name.includes("artesunate") && name.includes("amodiaquine")) {
    info = {
      whatItDoes: "First-line malaria treatment in South Sudan. Combination of fast-acting artesunate and longer-acting amodiaquine. Highly effective cure rate (95%).",
      commonUses: [
        "Uncomplicated malaria (first-line in South Sudan)",
        "All Plasmodium species",
        "Pediatric and adult malaria"
      ],
      importantSafety: {
        dos: ["Take once daily for 3 days", "Take at same time each day", "Complete full 3-day course", "Can take with or without food"],
        donts: ["Do not use if severe liver disease", "Avoid in severe malaria (use injectable)", "Report yellowing of eyes", "Do not skip days"]
      },
      howFastItWorks: {
        onset: "Fever reduction: 24-36 hours",
        duration: "3-day treatment course"
      },
      specialGroups: {
        pregnancy: "Safe in 2nd and 3rd trimester",
        breastfeeding: "Safe",
        children: "Safe from 6 months, multiple pediatric formulations available",
        elderly: "Safe with normal kidney/liver function"
      }
    };
  }

  if (genericName.includes("quinine") && drug.form === "injection") {
    info = {
      whatItDoes: "EMERGENCY treatment for severe malaria. Given by slow IV infusion when patient cannot swallow or has severe disease. Life-saving medication.",
      commonUses: [
        "Severe malaria with complications",
        "Cerebral malaria",
        "When patient cannot take oral medication",
        "Alternative when artesunate unavailable"
      ],
      importantSafety: {
        dos: ["Give slowly by IV drip (over 4 hours)", "Monitor blood sugar closely", "Monitor for irregular heartbeat", "Switch to oral when patient can swallow"],
        donts: ["Never give as rapid injection", "Monitor for dangerous low blood sugar", "Watch for ringing in ears", "Do not use if heart problems without monitoring"]
      },
      howFastItWorks: {
        onset: "Starts working within hours",
        duration: "Given every 8 hours until oral possible"
      },
      specialGroups: {
        pregnancy: "Safe, monitor closely",
        breastfeeding: "Safe",
        children: "Safe, calculate dose by weight carefully",
        elderly: "Use with caution, monitor heart and blood sugar"
      }
    };
  }

  if (name.includes("artesunate") && drug.form === "injection") {
    info = {
      whatItDoes: "EMERGENCY treatment for severe malaria. Most effective medication for severe malaria. Can save lives within hours when given promptly.",
      commonUses: [
        "Severe malaria (first-line)",
        "Cerebral malaria",
        "Life-threatening malaria",
        "When patient cannot swallow"
      ],
      importantSafety: {
        dos: ["Give by IV or IM injection", "Give at 0, 12, and 24 hours, then daily", "Switch to oral ACT when patient can swallow", "Monitor for delayed hemolysis"],
        donts: ["Do not delay if severe malaria suspected", "Not for mild malaria", "Monitor blood count for 4 weeks after", "Report dark urine after treatment"]
      },
      howFastItWorks: {
        onset: "Fastest-acting antimalarial (hours)",
        duration: "Minimum 3 doses, then switch to oral"
      },
      specialGroups: {
        pregnancy: "Safe, preferred for severe malaria",
        breastfeeding: "Safe",
        children: "Safe, preferred in severe malaria",
        elderly: "Safe, highly effective"
      }
    };
  }

  // Antibiotics - Amoxicillin
  if (genericName.includes("amoxicillin") && !genericName.includes("clavulanate")) {
    info = {
      whatItDoes: "Kills bacteria causing infections. Penicillin-type antibiotic that works against many common bacteria.",
      commonUses: [
        "Chest infections (pneumonia, bronchitis)",
        "Ear infections",
        "Throat infections",
        "Skin and soft tissue infections",
        "Urinary tract infections"
      ],
      importantSafety: {
        dos: ["Take full course even if feeling better", "Take every 8 hours (3 times daily)", "Can take with or without food", "Finish all tablets"],
        donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "May reduce birth control effectiveness", "Report severe diarrhea"]
      },
      howFastItWorks: {
        onset: "Improvement in 2-3 days",
        duration: "Usually 5-7 days treatment"
      },
      specialGroups: {
        pregnancy: "Safe in all trimesters",
        breastfeeding: "Safe",
        children: "Safe, commonly used antibiotic",
        elderly: "Safe, adjust dose if kidney problems"
      }
    };
  }

  // Ibuprofen
  if (genericName.includes("ibuprofen")) {
    info = {
      whatItDoes: "Reduces pain, fever, and inflammation. Works by blocking chemicals that cause inflammation and pain in the body.",
      commonUses: [
        "Headaches and muscle pain",
        "Arthritis and joint pain",
        "Menstrual cramps",
        "Fever reduction",
        "Dental pain"
      ],
      importantSafety: {
        dos: ["Take with food or milk", "Drink plenty of water", "Use lowest effective dose", "Can combine with paracetamol"],
        donts: ["Do not take on empty stomach", "Avoid if stomach ulcers", "Not safe in late pregnancy", "May worsen high blood pressure or heart disease"]
      },
      howFastItWorks: {
        onset: "Pain relief: 30-60 minutes",
        duration: "4-6 hours per dose"
      },
      specialGroups: {
        pregnancy: "Avoid, especially 3rd trimester",
        breastfeeding: "Safe in small amounts",
        children: "Safe from 3 months (dose by weight)",
        elderly: "Use cautiously, watch for stomach problems"
      }
    };
  }

  return info;
};

export function DrugInfoModal({ drug, stockInfo, open, onOpenChange }: DrugInfoModalProps) {
  if (!drug) return null;

  const info = getEducationalInfo(drug);

  // Determine category
  const getCategoryInfo = (drug: Drug) => {
    const genericName = drug.genericName?.toLowerCase() || "";
    if (genericName.includes("paracetamol") || genericName.includes("acetaminophen") || 
        genericName.includes("ibuprofen")) {
      return "Analgesic (Pain Reliever & Fever Reducer)";
    }
    if (genericName.includes("artemether") || genericName.includes("coartem")) {
      return "Antimalarial (Malaria Treatment)";
    }
    if (genericName.includes("amoxicillin") || genericName.includes("antibiotic")) {
      return "Antibiotic (Bacterial Infection Treatment)";
    }
    return "Medication";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] w-[95%] max-h-[85vh] p-8 rounded-2xl shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Pill className="w-7 h-7 text-purple-600" />
              {drug.name}
            </DialogTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getCategoryInfo(drug)}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="text-[13px] bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                {drug.form}
              </Badge>
              <Badge variant="secondary" className="text-[13px] bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                {drug.strength}
              </Badge>
              {drug.genericName && (
                <Badge variant="secondary" className="text-[13px] bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                  {drug.genericName}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-140px)] pr-4">
          <div className="space-y-6">
            {/* What It Does */}
            <div>
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                <FileText className="w-[18px] h-[18px] text-blue-600" />
                <h3 className="font-bold text-base uppercase text-gray-800 dark:text-gray-200">What It Does</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed px-2">
                {info.whatItDoes}
              </p>
            </div>

            <Separator />

            {/* Common Uses */}
            <div>
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
                <Pill className="w-[18px] h-[18px] text-purple-600" />
                <h3 className="font-bold text-base uppercase text-gray-800 dark:text-gray-200">Common Uses</h3>
              </div>
              <ul className="space-y-1.5 px-2">
                {info.commonUses.map((use, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Important Safety */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-orange-500">
                <AlertTriangle className="w-[18px] h-[18px] text-orange-600" />
                <h3 className="font-bold text-base uppercase text-gray-800 dark:text-gray-200">Important Safety</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Do's Card */}
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="font-bold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2 text-base">
                    <CheckCircle className="w-5 h-5" />
                    Do's
                  </p>
                  <ul className="space-y-2">
                    {info.importantSafety.dos.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                        <span className="text-green-600 dark:text-green-400 text-base mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts Card */}
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2 text-base">
                    <XCircle className="w-5 h-5" />
                    Don'ts
                  </p>
                  <ul className="space-y-2">
                    {info.importantSafety.donts.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                        <span className="text-red-600 dark:text-red-400 text-base mt-0.5">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* How Fast It Works */}
            <div>
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-indigo-500">
                <Clock className="w-[18px] h-[18px] text-indigo-600" />
                <h3 className="font-bold text-base uppercase text-gray-800 dark:text-gray-200">How Fast It Works</h3>
              </div>
              <div className="space-y-2 text-gray-700 dark:text-gray-300 px-2">
                <p><span className="font-semibold">Onset:</span> {info.howFastItWorks.onset}</p>
                <p><span className="font-semibold">Duration:</span> {info.howFastItWorks.duration}</p>
              </div>
            </div>

            <Separator />

            {/* Special Groups */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-teal-500">
                <Users className="w-[18px] h-[18px] text-teal-600" />
                <h3 className="font-bold text-base uppercase text-gray-800 dark:text-gray-200">Special Groups</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pregnancy Card */}
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-xl">🤰</span>
                    Pregnancy
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {info.specialGroups.pregnancy.includes("Safe") ? "✅ " : 
                     info.specialGroups.pregnancy.includes("Consult") ? "⚠️ " : "❌ "}
                    {info.specialGroups.pregnancy}
                  </p>
                </div>

                {/* Breastfeeding Card */}
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-xl">🤱</span>
                    Breastfeeding
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {info.specialGroups.breastfeeding.includes("Safe") ? "✅ " : 
                     info.specialGroups.breastfeeding.includes("Consult") ? "⚠️ " : "❌ "}
                    {info.specialGroups.breastfeeding}
                  </p>
                </div>

                {/* Children Card */}
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-xl">👶</span>
                    Children
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {info.specialGroups.children.includes("Safe") ? "✅ " : 
                     info.specialGroups.children.includes("directed") ? "⚠️ " : "❌ "}
                    {info.specialGroups.children}
                  </p>
                </div>

                {/* Elderly Card */}
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-xl">👴</span>
                    Elderly
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {info.specialGroups.elderly.includes("Safe") ? "✅ " : 
                     info.specialGroups.elderly.includes("adjustment") ? "⚠️ " : "❌ "}
                    {info.specialGroups.elderly}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
