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
      return "Anti-inflammatory • Pain Reliever";
    }
    if (genericName.includes("artemether") || genericName.includes("coartem")) {
      return "Antimalarial • Malaria Treatment";
    }
    if (genericName.includes("amoxicillin") || genericName.includes("antibiotic")) {
      return "Antibiotic • Bacterial Infection Treatment";
    }
    return "Medication";
  };

  // Capitalize first letter of drug form
  const capitalizeForm = (form: string) => {
    return form.charAt(0).toUpperCase() + form.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[95%] max-h-[85vh] p-8 rounded-2xl bg-white dark:bg-gray-900 [box-shadow:0_0_0_1px_rgba(0,0,0,0.05),0_10px_25px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.08)]">
        <DialogHeader className="pb-6">
          <div className="space-y-3">
            <DialogTitle className="text-[28px] font-bold text-[#1a1a1a] dark:text-gray-100 flex items-center gap-3 uppercase">
              <Pill className="w-7 h-7 text-purple-600" />
              {drug.name}
            </DialogTitle>
            <div className="text-sm font-medium text-[#6b7280] dark:text-gray-400">
              {getCategoryInfo(drug)}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="text-[13px] font-medium bg-[#f3f4f6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 border border-[#e5e7eb] dark:border-gray-700 rounded-md px-3 py-1.5 shadow-none">
                {capitalizeForm(drug.form)}
              </Badge>
              <Badge variant="secondary" className="text-[13px] font-medium bg-[#f3f4f6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 border border-[#e5e7eb] dark:border-gray-700 rounded-md px-3 py-1.5 shadow-none">
                {drug.strength}
              </Badge>
              {drug.genericName && (
                <Badge variant="secondary" className="text-[13px] font-medium bg-[#f3f4f6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 border border-[#e5e7eb] dark:border-gray-700 rounded-md px-3 py-1.5 shadow-none">
                  {drug.genericName}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-140px)] pr-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-[#f1f1f1] dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-[3px] hover:[&::-webkit-scrollbar-thumb]:bg-[#a8a8a8]">
          <div className="space-y-7">
            {/* What It Does */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(99,102,241,0.04)] dark:bg-blue-900/10 rounded-lg border-t border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700">
                <FileText className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#374151] dark:text-gray-200">What It Does</h3>
              </div>
              <p className="text-[14px] leading-[1.7] text-[#1f2937] dark:text-gray-300 px-2">
                {info.whatItDoes}
              </p>
            </div>

            <Separator className="bg-[rgba(0,0,0,0.08)] dark:bg-gray-700" />

            {/* Common Uses */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(168,85,247,0.04)] dark:bg-purple-900/10 rounded-lg border-t border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700">
                <Pill className="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#374151] dark:text-gray-200">Common Uses</h3>
              </div>
              <ul className="space-y-2 px-2">
                {info.commonUses.map((use, index) => (
                  <li key={index} className="flex items-start gap-3 text-[14px] leading-[1.8] text-[#1f2937] dark:text-gray-300">
                    <span className="text-[#7c3aed] dark:text-purple-400 mt-1 text-base">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="bg-[rgba(0,0,0,0.08)] dark:bg-gray-700" />

            {/* Important Safety */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(251,146,60,0.04)] dark:bg-orange-900/10 rounded-lg border-t border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700">
                <AlertTriangle className="w-[18px] h-[18px] text-orange-600 dark:text-orange-400" />
                <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#374151] dark:text-gray-200">Important Safety</h3>
              </div>
              
              {/* Unified Container for Do's and Don'ts */}
              <div className="bg-[#fafafa] dark:bg-gray-800/30 border border-[rgba(0,0,0,0.08)] dark:border-gray-700 rounded-lg p-6 [box-shadow:0_1px_2px_rgba(0,0,0,0.04)]">
                {/* Do's Section */}
                <div className="mb-5">
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#059669] dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-[18px] h-[18px]" />
                    Do's
                  </p>
                  <div className="h-px bg-[rgba(0,0,0,0.06)] dark:bg-gray-700 mb-3" />
                  <ul className="space-y-2.5">
                    {info.importantSafety.dos.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-[14px] leading-[1.8] text-[#1f2937] dark:text-gray-300">
                        <span className="text-[#059669] dark:text-green-400 text-base mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts Section */}
                <div>
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#dc2626] dark:text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-[18px] h-[18px]" />
                    Don'ts
                  </p>
                  <div className="h-px bg-[rgba(0,0,0,0.06)] dark:bg-gray-700 mb-3" />
                  <ul className="space-y-2.5">
                    {info.importantSafety.donts.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-[14px] leading-[1.8] text-[#1f2937] dark:text-gray-300">
                        <span className="text-[#dc2626] dark:text-red-400 text-base mt-0.5 flex-shrink-0">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="bg-[rgba(0,0,0,0.08)] dark:bg-gray-700" />

            {/* How Fast It Works */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(99,102,241,0.04)] dark:bg-indigo-900/10 rounded-lg border-t border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700">
                <Clock className="w-[18px] h-[18px] text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#374151] dark:text-gray-200">How Fast It Works</h3>
              </div>
              <div className="space-y-2.5 text-[14px] leading-[1.7] text-[#1f2937] dark:text-gray-300 px-2">
                <p><span className="font-semibold text-[#374151] dark:text-gray-200">Onset:</span> {info.howFastItWorks.onset}</p>
                <p><span className="font-semibold text-[#374151] dark:text-gray-200">Duration:</span> {info.howFastItWorks.duration}</p>
              </div>
            </div>

            <Separator className="bg-[rgba(0,0,0,0.08)] dark:bg-gray-700" />

            {/* Special Groups */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(20,184,166,0.04)] dark:bg-teal-900/10 rounded-lg border-t border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700">
                <Users className="w-[18px] h-[18px] text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#374151] dark:text-gray-200">Special Groups</h3>
              </div>
              
              {/* Unified Container for Special Groups */}
              <div className="bg-[#fafafa] dark:bg-gray-800/30 border border-[rgba(0,0,0,0.08)] dark:border-gray-700 rounded-lg p-5 [box-shadow:0_1px_2px_rgba(0,0,0,0.04)]">
                {/* Pregnancy */}
                <div className="pb-4 mb-4 border-b border-[rgba(0,0,0,0.06)] dark:border-gray-700">
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#4b5563] dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span className="text-xl">🤰</span>
                    Pregnancy
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#1f2937] dark:text-gray-300 pl-8">
                    {info.specialGroups.pregnancy.includes("Safe") ? "✅ " : 
                     info.specialGroups.pregnancy.includes("Consult") ? "⚠️ " : "❌ "}
                    {info.specialGroups.pregnancy}
                  </p>
                </div>

                {/* Breastfeeding */}
                <div className="pb-4 mb-4 border-b border-[rgba(0,0,0,0.06)] dark:border-gray-700">
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#4b5563] dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span className="text-xl">🤱</span>
                    Breastfeeding
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#1f2937] dark:text-gray-300 pl-8">
                    {info.specialGroups.breastfeeding.includes("Safe") ? "✅ " : 
                     info.specialGroups.breastfeeding.includes("Consult") ? "⚠️ " : "❌ "}
                    {info.specialGroups.breastfeeding}
                  </p>
                </div>

                {/* Children */}
                <div className="pb-4 mb-4 border-b border-[rgba(0,0,0,0.06)] dark:border-gray-700">
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#4b5563] dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span className="text-xl">👶</span>
                    Children
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#1f2937] dark:text-gray-300 pl-8">
                    {info.specialGroups.children.includes("Safe") ? "✅ " : 
                     info.specialGroups.children.includes("directed") ? "⚠️ " : "❌ "}
                    {info.specialGroups.children}
                  </p>
                </div>

                {/* Elderly */}
                <div>
                  <p className="font-semibold text-[14px] uppercase tracking-wide text-[#4b5563] dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span className="text-xl">👴</span>
                    Elderly
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#1f2937] dark:text-gray-300 pl-8">
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
