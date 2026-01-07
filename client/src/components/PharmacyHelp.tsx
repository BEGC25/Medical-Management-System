import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle, Clock, AlertCircle, Package } from "lucide-react";

export default function PharmacyHelp() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyHelpCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("pharmacyHelpCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Pharmacy Help & Guide
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick reference for dispensing medications safely
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            {isCollapsed ? (
              <>
                <span className="mr-2">Show Help</span>
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="mr-2">Hide Help</span>
                <ChevronUp className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="mt-6 space-y-6">
            {/* Tab Explanations */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                Understanding the Tabs
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h5 className="font-semibold text-green-900 dark:text-green-100">Ready to Dispense</h5>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Prescriptions that have been <strong>paid for</strong> and are ready to be dispensed to patients. 
                    Click "Dispense" to select a batch and give medication.
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-blue-900 dark:text-blue-100">Dispensed History</h5>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Previously dispensed medications. View who dispensed what, when. Useful for tracking and audits.
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h5 className="font-semibold text-orange-900 dark:text-orange-100">Awaiting Payment</h5>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Prescriptions not yet paid. Patient must go to <strong>Reception</strong> to pay before you can dispense.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Dispense */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                How to Dispense Medication (Step-by-Step)
              </h4>
              <div className="bg-white/80 dark:bg-gray-800/80 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
                    <div>
                      <strong>Go to "Ready to Dispense" tab</strong> - Find the prescription you need to fill.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">2</span>
                    <div>
                      <strong>Check patient allergies</strong> - If present, a red ALLERGIES badge will show. Verify the drug is safe.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">3</span>
                    <div>
                      <strong>Click "Dispense" button</strong> - A dialog will open showing patient info and prescription details.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">4</span>
                    <div>
                      <strong>Select a batch</strong> - Batches are sorted by expiry date (oldest first). Choose one with enough stock. 
                      Watch for <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                        <Clock className="w-3 h-3" /> expiring soon
                      </span> warnings.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">5</span>
                    <div>
                      <strong>Verify quantity</strong> - Make sure the selected batch has enough stock for the prescribed quantity.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">6</span>
                    <div>
                      <strong>Confirm Dispense</strong> - Click the button. Inventory will be updated automatically.
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Common Issues */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Common Issues & Solutions
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Prescription is Unpaid</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Solution:</strong> Patient must go to Reception desk to pay first. It will then appear in "Ready to Dispense".
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-red-900 dark:text-red-100 mb-1">No Stock Available / Insufficient Stock</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Solution:</strong> Go to <strong>Manage Inventory</strong> to check stock levels. 
                        Try another batch if available, or request stock replenishment.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Batch is Expiring Soon</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Solution:</strong> Use expiring batches first (FEFO - First Expiry, First Out). 
                        Batches expiring in &lt;90 days are highlighted.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Drug Not in Inventory</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Solution:</strong> Go to <strong>Manage Inventory → Add Drug</strong> to add the drug to your catalog, 
                        then receive stock batches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
