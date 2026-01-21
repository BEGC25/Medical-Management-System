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
  Package,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Pill className="w-6 h-6 text-purple-600" />
              {drug.name}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-sm">
                {drug.form}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {drug.strength}
              </Badge>
              {drug.genericName && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {drug.genericName}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* What It Does */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">What It Does</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {info.whatItDoes}
              </p>
            </div>

            <Separator />

            {/* Common Uses */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Common Uses</h3>
              </div>
              <ul className="space-y-1">
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
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Important Safety</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Do's
                  </p>
                  <ul className="space-y-1 ml-6">
                    {info.importantSafety.dos.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Don'ts
                  </p>
                  <ul className="space-y-1 ml-6">
                    {info.importantSafety.donts.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-red-600 mt-1">✗</span>
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
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">How Fast It Works</h3>
              </div>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Onset:</span> {info.howFastItWorks.onset}</p>
                <p><span className="font-medium">Duration:</span> {info.howFastItWorks.duration}</p>
              </div>
            </div>

            <Separator />

            {/* Special Groups */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Special Groups</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-400">Pregnancy:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{info.specialGroups.pregnancy}</p>
                </div>
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-400">Breastfeeding:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{info.specialGroups.breastfeeding}</p>
                </div>
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-400">Children:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{info.specialGroups.children}</p>
                </div>
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-400">Elderly:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{info.specialGroups.elderly}</p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            {stockInfo && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Stock Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-medium text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                      <p className="text-lg font-semibold">{stockInfo.stockOnHand} units</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-500 dark:text-gray-400">Price</p>
                      <p className="text-lg font-semibold">{stockInfo.price} SSP</p>
                    </div>
                    {stockInfo.expiryDate && (
                      <div>
                        <p className="font-medium text-sm text-gray-500 dark:text-gray-400">Expires</p>
                        <p className="text-lg font-semibold">
                          {(() => {
                            try {
                              const date = new Date(stockInfo.expiryDate);
                              if (isNaN(date.getTime())) {
                                return stockInfo.expiryDate;
                              }
                              return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              });
                            } catch {
                              return stockInfo.expiryDate;
                            }
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
