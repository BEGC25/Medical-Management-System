import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Package, 
  AlertTriangle,
  FileText,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  Archive
} from "lucide-react";
import { Link } from "wouter";

interface PharmacyHelpProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function PharmacyHelp({ collapsed, onCollapsedChange }: PharmacyHelpProps) {
  // Support both controlled and uncontrolled modes
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyHelpCollapsed");
    return saved === "true";
  });

  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  
  const handleToggle = () => {
    const newValue = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  useEffect(() => {
    if (collapsed === undefined) {
      localStorage.setItem("pharmacyHelpCollapsed", String(internalCollapsed));
    }
  }, [internalCollapsed, collapsed]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`
      fixed right-0 top-0 h-screen z-40 
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-0' : 'w-96'}
    `}>
      {/* Backdrop overlay when help is open */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 backdrop-blur-sm
                     transition-opacity duration-300"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}

      {/* Help Panel */}
      <div className={`
        h-full bg-white dark:bg-gray-900 border-l-2 border-blue-200 dark:border-blue-800
        shadow-premium-2xl transition-all duration-300
        ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-premium-md">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Pharmacy Guide
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Quick reference & help
                  </p>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Quick Jump</p>
                <div className="flex flex-col gap-1">
                  <button onClick={() => scrollToSection('tabs')} className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline">→ Tab Explanations</button>
                  <button onClick={() => scrollToSection('workflow')} className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline">→ Dispensing Workflow</button>
                  <button onClick={() => scrollToSection('inventory')} className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline">→ Inventory Management</button>
                  <button onClick={() => scrollToSection('safety')} className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline">→ Safety Reminders</button>
                  <button onClick={() => scrollToSection('issues')} className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline">→ Common Issues</button>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
            {/* Tab Explanations */}
            <div id="tabs">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                Understanding the Tabs
              </h4>
              <div className="space-y-3">
                <div className="bg-green-50/80 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 
                               transition-all duration-200 hover:shadow-premium-sm hover:border-green-300 dark:hover:border-green-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <h5 className="font-semibold text-green-900 dark:text-green-100 text-sm">Ready to Dispense</h5>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    Prescriptions that have been <strong>paid for</strong> and are ready to be dispensed to patients. 
                    Click "Dispense" to select a batch and give medication.
                  </p>
                </div>
                <div className="bg-blue-50/80 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Dispensed History</h5>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    Previously dispensed medications. View who dispensed what, when. Useful for tracking and audits.
                  </p>
                </div>
                <div className="bg-orange-50/80 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-orange-300 dark:hover:border-orange-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <h5 className="font-semibold text-orange-900 dark:text-orange-100 text-sm">Awaiting Payment</h5>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    Prescriptions not yet paid. Patient must go to <strong>Reception</strong> to pay before you can dispense.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Dispense */}
            <div id="workflow">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                Dispensing Workflow
              </h4>
              <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <ol className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">1</span>
                    <div className="leading-relaxed">
                      Go to <strong>"Ready to Dispense"</strong> tab
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">2</span>
                    <div className="leading-relaxed">
                      Check for <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-[10px] font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5" /> ALLERGIES
                      </span> badge
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">3</span>
                    <div className="leading-relaxed">
                      Click <strong>"Dispense"</strong> button
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">4</span>
                    <div className="leading-relaxed">
                      Select batch (FEFO - oldest expiry first)
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">5</span>
                    <div className="leading-relaxed">
                      Verify quantity matches prescription
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">6</span>
                    <div className="leading-relaxed">
                      Click <strong>"Confirm Dispense"</strong>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Inventory Management */}
            <div id="inventory">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Inventory Management
              </h4>
              <div className="space-y-2.5">
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                               transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">How to Use Manage Inventory</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        Click <strong>"Manage Inventory"</strong> button in header to:
                        <br/>• Add new drugs to catalog
                        <br/>• Receive stock batches with lot numbers
                        <br/>• View all stock levels across batches
                        <br/>• Track expiry dates and quantities
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                               transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">Handling Low Stock</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        When stock is low:
                        <br/>• Check all batches for the drug in Manage Inventory
                        <br/>• Consider substitutions if drug unavailable
                        <br/>• Request stock replenishment from supplier
                        <br/>• Inform prescribing doctor if unable to dispense
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                               transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">Expiring Batches</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <strong>FEFO principle</strong> (First Expiry, First Out):
                        <br/>• Always use batches expiring soonest
                        <br/>• Batches &lt;90 days are highlighted in amber
                        <br/>• Check expiry dates before dispensing
                        <br/>• Never dispense expired medications
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                               transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">Stock Reconciliation</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        Regularly verify physical stock matches system records:
                        <br/>• Check inventory page for discrepancies
                        <br/>• Report missing or damaged stock
                        <br/>• Update quantities if needed
                        <br/>• Document all adjustments
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                               transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start gap-2">
                    <Archive className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">Drug Substitutions</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        If prescribed drug unavailable:
                        <br/>• Contact prescribing doctor
                        <br/>• Get approval for generic/alternative
                        <br/>• Verify dosage equivalency
                        <br/>• Document the substitution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Reminders */}
            <div id="safety">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
                Safety & Verification
              </h4>
              <div className="bg-gradient-to-br from-red-50/80 to-pink-50/80 dark:from-red-900/20 dark:to-pink-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Always check for allergies</strong> - Red ALLERGIES badge appears if patient has known allergies. Verify drug compatibility.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Verify dosage</strong> - Confirm prescribed dosage matches what you're dispensing. Check for unusual doses.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Check expiry dates</strong> - Never dispense expired medications. System prevents this but always double-check.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Confirm patient identity</strong> - Verify patient ID matches prescription before dispensing.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Read instructions to patient</strong> - Explain dosage, frequency, and special instructions clearly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Common Issues */}
            <div id="issues">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                Common Issues & Solutions
              </h4>
              <div className="space-y-2.5">
                <div className="bg-orange-50/80 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-orange-300 dark:hover:border-orange-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-orange-900 dark:text-orange-100 text-xs mb-1">Prescription is Unpaid</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <strong>Solution:</strong> Patient must go to Reception desk to pay first. It will then appear in "Ready to Dispense".
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50/80 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-red-300 dark:hover:border-red-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-red-900 dark:text-red-100 text-xs mb-1">Insufficient Stock</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <strong>Solution:</strong> Go to <strong>Manage Inventory</strong> to check stock levels. 
                        Try another batch if available, or request stock replenishment.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50/80 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-amber-300 dark:hover:border-amber-700">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-xs mb-1">Batch is Expiring Soon</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <strong>Solution:</strong> Use expiring batches first (FEFO - First Expiry, First Out). 
                        Batches expiring in &lt;90 days are highlighted.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/80 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800
                               transition-all duration-200 hover:shadow-premium-sm hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-xs mb-1">Drug Not in Inventory</h5>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <strong>Solution:</strong> Go to <strong>Manage Inventory → Add Drug</strong> to add the drug to your catalog, 
                        then receive stock batches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
