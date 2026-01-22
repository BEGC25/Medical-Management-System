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
import { getDrugEducationalInfo, DrugEducationalInfo } from "@/lib/drugEducation";

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

// Educational drug information from shared module
const getEducationalInfo = (drug: Drug): DrugEducationalInfo => {
  return getDrugEducationalInfo(drug.genericName || drug.name);
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
