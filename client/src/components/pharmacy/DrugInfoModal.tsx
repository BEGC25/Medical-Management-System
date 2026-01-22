import { Drug } from "@shared/schema";
import { useEffect, useState } from "react";
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
  XCircle,
  Stethoscope,
  Activity,
  HeartPulse,
  Syringe,
  Zap
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger animations when modal opens
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [open]);

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
    if (genericName.includes("amoxicillin") || genericName.includes("ampicillin") || genericName.includes("antibiotic")) {
      return "Antibiotic (Bacterial Infection Treatment)";
    }
    return "Medication";
  };

  // Get quick summary for banner
  const getQuickSummary = (info: DrugEducationalInfo) => {
    // Extract first sentence as quick summary
    const firstSentence = info.whatItDoes.split('.')[0] + '.';
    return firstSentence;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[95%] max-h-[90vh] p-0 rounded-3xl shadow-2xl overflow-hidden border-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20">
        {/* Quick Summary Banner - Most Critical Info */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white px-8 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90 mb-0.5">Quick Reference</div>
              <div className="text-sm font-medium leading-snug">{getQuickSummary(info)}</div>
            </div>
          </div>
        </div>

        <DialogHeader className="px-8 pt-6 pb-4">
          <div className={`space-y-3 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Pill className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              {drug.name}
            </DialogTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {getCategoryInfo(drug)}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full px-4 py-1.5 font-semibold border border-purple-200 dark:border-purple-800">
                {drug.form}
              </Badge>
              <Badge variant="secondary" className="text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-1.5 font-semibold border border-indigo-200 dark:border-indigo-800">
                {drug.strength}
              </Badge>
              {drug.genericName && (
                <Badge variant="secondary" className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-4 py-1.5 font-semibold border border-blue-200 dark:border-blue-800">
                  {drug.genericName}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Custom Scroll Area with Fade Effects */}
        <div className="relative px-8 pb-8">
          {/* Top fade gradient */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-gray-900/80 dark:via-gray-900/40 dark:to-transparent z-10 pointer-events-none" />
          
          <ScrollArea className="h-[calc(90vh-280px)] premium-scrollarea">
            <div className="pr-4 space-y-5">
              {/* What It Does */}
              <div 
                className={`transition-all duration-500 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: '100ms' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-[2px]" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600/10 to-blue-500/10 dark:from-blue-500/20 dark:to-blue-400/20 border-l-4 border-blue-500">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-bold text-base uppercase tracking-wide text-blue-900 dark:text-blue-200">What It Does</h3>
                    </div>
                    <p className="px-5 py-4 text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {info.whatItDoes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Common Uses */}
              <div 
                className={`transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: '200ms' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-[2px]" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-purple-600/10 to-purple-500/10 dark:from-purple-500/20 dark:to-purple-400/20 border-l-4 border-purple-500">
                      <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-bold text-base uppercase tracking-wide text-purple-900 dark:text-purple-200">Common Uses</h3>
                    </div>
                    <ul className="space-y-2.5 px-5 py-4">
                      {info.commonUses.map((use, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-800 dark:text-gray-200 group/item hover:translate-x-1 transition-transform duration-200">
                          <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                          <span className="font-medium">{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important Safety - Enhanced with Prominence */}
              <div 
                className={`transition-all duration-500 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: '300ms' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-950/30 dark:to-red-900/20 backdrop-blur-sm border-2 border-orange-300 dark:border-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 ring-2 ring-orange-200/50 dark:ring-orange-800/50">
                  {/* Pulsing border effect for safety section */}
                  <div className="absolute inset-0 rounded-xl border-2 border-orange-400 dark:border-orange-600 animate-pulse opacity-30" />
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-[2px]" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-orange-600/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-400/30 border-l-4 border-orange-500">
                      <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                      <h3 className="font-bold text-lg uppercase tracking-wide text-orange-900 dark:text-orange-200">Important Safety</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                      {/* Do's Card */}
                      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-white/30 dark:bg-white/5" />
                        <div className="relative">
                          <p className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2 text-base">
                            <CheckCircle className="w-5 h-5" />
                            Do's
                          </p>
                          <ul className="space-y-2.5">
                            {info.importantSafety.dos.map((item, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-sm text-green-800 dark:text-green-200 font-medium">
                                <span className="text-green-600 dark:text-green-400 text-lg mt-0.5 flex-shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Don'ts Card */}
                      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-900/30 border-2 border-red-300 dark:border-red-700 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-white/30 dark:bg-white/5" />
                        <div className="relative">
                          <p className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2 text-base">
                            <XCircle className="w-5 h-5" />
                            Don'ts
                          </p>
                          <ul className="space-y-2.5">
                            {info.importantSafety.donts.map((item, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-sm text-red-800 dark:text-red-200 font-medium">
                                <span className="text-red-600 dark:text-red-400 text-lg mt-0.5 flex-shrink-0">✗</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How Fast It Works */}
              <div 
                className={`transition-all duration-500 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: '400ms' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-[2px]" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-600/10 to-indigo-500/10 dark:from-indigo-500/20 dark:to-indigo-400/20 border-l-4 border-indigo-500">
                      <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-base uppercase tracking-wide text-indigo-900 dark:text-indigo-200">How Fast It Works</h3>
                    </div>
                    <div className="space-y-3 px-5 py-4 text-gray-800 dark:text-gray-200">
                      <div className="flex items-start gap-2">
                        <HeartPulse className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-1" />
                        <p className="font-medium"><span className="font-bold text-indigo-700 dark:text-indigo-300">Onset:</span> {info.howFastItWorks.onset}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Syringe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-1" />
                        <p className="font-medium"><span className="font-bold text-indigo-700 dark:text-indigo-300">Duration:</span> {info.howFastItWorks.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Groups */}
              <div 
                className={`transition-all duration-500 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: '500ms' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 backdrop-blur-sm border border-teal-200/50 dark:border-teal-800/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-[2px]" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-teal-600/10 to-teal-500/10 dark:from-teal-500/20 dark:to-teal-400/20 border-l-4 border-teal-500">
                      <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="font-bold text-base uppercase tracking-wide text-teal-900 dark:text-teal-200">Special Groups</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
                      {/* Pregnancy Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border-2 border-teal-200 dark:border-teal-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20 dark:to-transparent" />
                        <div className="relative">
                          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <span className="text-2xl">🤰</span>
                            Pregnancy
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {info.specialGroups.pregnancy.includes("Safe") ? "✅ " : 
                             info.specialGroups.pregnancy.includes("Consult") ? "⚠️ " : "❌ "}
                            {info.specialGroups.pregnancy}
                          </p>
                        </div>
                      </div>

                      {/* Breastfeeding Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border-2 border-teal-200 dark:border-teal-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20 dark:to-transparent" />
                        <div className="relative">
                          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <span className="text-2xl">🤱</span>
                            Breastfeeding
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {info.specialGroups.breastfeeding.includes("Safe") ? "✅ " : 
                             info.specialGroups.breastfeeding.includes("Consult") ? "⚠️ " : "❌ "}
                            {info.specialGroups.breastfeeding}
                          </p>
                        </div>
                      </div>

                      {/* Children Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border-2 border-teal-200 dark:border-teal-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20 dark:to-transparent" />
                        <div className="relative">
                          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <span className="text-2xl">👶</span>
                            Children
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {info.specialGroups.children.includes("Safe") ? "✅ " : 
                             info.specialGroups.children.includes("directed") ? "⚠️ " : "❌ "}
                            {info.specialGroups.children}
                          </p>
                        </div>
                      </div>

                      {/* Elderly Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border-2 border-teal-200 dark:border-teal-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20 dark:to-transparent" />
                        <div className="relative">
                          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <span className="text-2xl">👴</span>
                            Elderly
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {info.specialGroups.elderly.includes("Safe") ? "✅ " : 
                             info.specialGroups.elderly.includes("adjustment") ? "⚠️ " : "❌ "}
                            {info.specialGroups.elderly}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          {/* Bottom fade gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-gray-900/80 dark:via-gray-900/40 dark:to-transparent pointer-events-none" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
