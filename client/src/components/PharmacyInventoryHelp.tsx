import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Package, 
  AlertTriangle,
  Clock,
  FileText,
  TrendingDown,
  Plus,
  ShieldCheck,
  Archive
} from "lucide-react";

interface PharmacyInventoryHelpProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function PharmacyInventoryHelp({ collapsed, onCollapsedChange }: PharmacyInventoryHelpProps) {
  // Support both controlled and uncontrolled modes
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyInventoryHelpCollapsed");
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
      localStorage.setItem("pharmacyInventoryHelpCollapsed", String(internalCollapsed));
    }
  }, [internalCollapsed, collapsed]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Backdrop overlay when help is open */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 backdrop-blur-sm
                     transition-opacity duration-300"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}
      
      <div className={`
        fixed right-0 top-0 h-screen z-40 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-0' : 'w-96'}
      `}>
      {/* Help Panel */}
      <div className={`
        h-full bg-white dark:bg-gray-900 border-l-2 border-purple-200 dark:border-purple-800
        shadow-premium-2xl transition-all duration-300
        ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-premium-md">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Inventory Guide
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
                  <button onClick={() => scrollToSection('tabs')} className="text-xs text-left text-purple-600 dark:text-purple-400 hover:underline">→ Tab Explanations</button>
                  <button onClick={() => scrollToSection('workflow')} className="text-xs text-left text-purple-600 dark:text-purple-400 hover:underline">→ Managing Inventory</button>
                  <button onClick={() => scrollToSection('batches')} className="text-xs text-left text-purple-600 dark:text-purple-400 hover:underline">→ Batch Management</button>
                  <button onClick={() => scrollToSection('alerts')} className="text-xs text-left text-purple-600 dark:text-purple-400 hover:underline">→ Stock Alerts</button>
                  <button onClick={() => scrollToSection('issues')} className="text-xs text-left text-purple-600 dark:text-purple-400 hover:underline">→ Common Issues</button>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              {/* Tab Explanations */}
              <div id="tabs">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                  Understanding the Tabs
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50/80 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-blue-300 dark:hover:border-blue-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Stock Overview</h5>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      See all drugs at a glance with current stock levels, prices, and expiry dates. 
                      Monitor what's available and identify low stock items quickly.
                    </p>
                  </div>
                  <div className="bg-purple-50/80 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-purple-300 dark:hover:border-purple-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Archive className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <h5 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Drug Catalog</h5>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Master list of all drugs your pharmacy can sell. Add new drugs here with their basic information 
                      like names, forms, and strength.
                    </p>
                  </div>
                  <div className="bg-amber-50/80 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-amber-300 dark:hover:border-amber-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Alerts</h5>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Warnings about drugs running low or expiring soon. Check regularly to avoid stockouts 
                      and expired medications.
                    </p>
                  </div>
                  <div className="bg-gray-50/80 dark:bg-gray-800/20 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Transaction History</h5>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Complete log of all inventory movements - stock received, dispensed, and adjustments. 
                      Filter by date to audit specific periods.
                    </p>
                  </div>
                </div>
              </div>

              {/* Managing Inventory */}
              <div id="workflow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                  Managing Inventory
                </h4>
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <ol className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">1</span>
                      <div className="leading-relaxed">
                        <strong>Add Drug to Catalog:</strong> Click "Add Drug" button. Enter drug name, form, strength. 
                        This is a one-time setup per drug.
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">2</span>
                      <div className="leading-relaxed">
                        <strong>Receive Stock:</strong> When you buy drugs, click "Receive Stock". 
                        Select drug, enter batch details, expiry date, quantity, and cost.
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">3</span>
                      <div className="leading-relaxed">
                        <strong>Monitor Stock:</strong> Check "Stock Overview" to see current levels. 
                        "Alerts" tab shows what needs attention.
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">4</span>
                      <div className="leading-relaxed">
                        <strong>Track Changes:</strong> "Transaction History" logs all movements. 
                        Use date filters to view specific periods.
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Batch Management */}
              <div id="batches">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Batch Management
                </h4>
                <div className="space-y-2.5">
                  <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">What is a Batch?</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          Each time you buy drugs, they come in a batch with their own lot number, 
                          expiry date, and price. The system tracks each batch separately for FEFO 
                          (First Expiry, First Out) compliance.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">FEFO Principle</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          Always use batches expiring soonest first. The system automatically sorts 
                          batches by expiry date. Batches expiring in {'<'}90 days are highlighted.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex items-start gap-2">
                      <Plus className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-xs mb-1">Bulk vs Manual Entry</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          When receiving stock, use bulk fields (cartons × units) for large purchases, 
                          or enter manual quantity for individual items. System auto-calculates total.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Alerts */}
              <div id="alerts">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
                  Stock Alerts
                </h4>
                <div className="bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Low Stock:</strong> Appears when quantity falls below reorder level. 
                        Click "Receive Stock" to replenish immediately.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Expiring Soon:</strong> Shows batches expiring within 90 days. 
                        Prioritize these for dispensing to minimize waste.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Out of Stock:</strong> Drug has zero inventory. Add stock immediately 
                        or inform prescribers about unavailability.
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
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-orange-900 dark:text-orange-100 text-xs mb-1">Can't Find Drug</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Solution:</strong> Go to "Drug Catalog" tab and click "Add Drug". 
                          Enter drug details to add it to your catalog first, then receive stock.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50/80 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-red-300 dark:hover:border-red-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-red-900 dark:text-red-100 text-xs mb-1">Wrong Stock Count</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Solution:</strong> Physical count doesn't match system? 
                          Check "Transaction History" for discrepancies. Contact supervisor for adjustments.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50/80 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800
                                 transition-all duration-200 hover:shadow-premium-sm hover:border-amber-300 dark:hover:border-amber-700">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-xs mb-1">Expired Drugs</h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Solution:</strong> Never dispense expired medications. 
                          Segregate expired stock physically and document for disposal per regulations.
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
    </>
  );
}
