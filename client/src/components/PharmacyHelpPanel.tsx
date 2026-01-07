import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Pill, Package, BookOpen, CheckCircle, Clock, AlertCircle, AlertTriangle, FileText, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function PharmacyHelpPanel() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("pharmacyHelpPanelOpen");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("pharmacyHelpPanelOpen", String(isOpen));
  }, [isOpen]);

  return (
    <>
      {/* Floating Toggle Button (when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-4 top-24 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-premium-lg hover:shadow-premium-xl transition-all duration-300 hover:scale-110"
              data-testid="help-panel-toggle"
            >
              <HelpCircle className="w-6 h-6 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Panel (when open) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-premium-2xl border-l border-gray-200 dark:border-gray-800 z-50 overflow-hidden flex flex-col"
              style={{
                backgroundImage: "radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 50%)",
              }}
            >
              {/* Header */}
              <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Pharmacy Help
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete guide for staff
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Tabbed Content */}
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="prescriptions" className="h-full">
                  <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 pt-4">
                    <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger value="prescriptions" className="flex items-center gap-2 py-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                        <Pill className="w-4 h-4" />
                        <span className="hidden sm:inline">Prescriptions</span>
                      </TabsTrigger>
                      <TabsTrigger value="inventory" className="flex items-center gap-2 py-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">Inventory</span>
                      </TabsTrigger>
                      <TabsTrigger value="quick-ref" className="flex items-center gap-2 py-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Quick Ref</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab 1: Prescription Management Help */}
                  <TabsContent value="prescriptions" className="p-6 space-y-6 m-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Understanding Tabs */}
                      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/30">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            Understanding the Tabs
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Ready to Dispense</h4>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                Prescriptions that are <strong>paid</strong> and ready to be given to patients.
                              </p>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="w-4 h-4 text-blue-600" />
                                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Dispensed History</h4>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                Past dispensing records. Use for tracking and audits.
                              </p>
                            </div>

                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100">Awaiting Payment</h4>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                Not yet paid. Patient must visit <strong>Reception</strong> first.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* How to Dispense */}
                      <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Pill className="w-5 h-5 text-indigo-600" />
                            How to Dispense (Step-by-Step)
                          </h3>
                          <ol className="space-y-2.5 text-sm">
                            {[
                              "Go to 'Ready to Dispense' tab",
                              "Check for ALLERGIES badge (red warning)",
                              "Click 'Dispense' button",
                              "Select batch (sorted by expiry - oldest first)",
                              "Verify quantity is available",
                              "Click 'Confirm Dispense'"
                            ].map((step, i) => (
                              <li key={i} className="flex gap-2.5">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold">
                                  {i + 1}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>

                      {/* Common Issues */}
                      <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            Common Issues
                          </h3>
                          <div className="space-y-2.5 text-sm">
                            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                              <h4 className="font-semibold text-orange-900 dark:text-orange-100 text-xs mb-1">Prescription Unpaid</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Patient must pay at Reception first.</p>
                            </div>
                            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                              <h4 className="font-semibold text-red-900 dark:text-red-100 text-xs mb-1">No Stock / Insufficient</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Check Inventory or try another batch.</p>
                            </div>
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-xs mb-1">Drug Not in Catalog</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Go to Inventory → Add Drug first.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* Tab 2: Inventory Management Help */}
                  <TabsContent value="inventory" className="p-6 space-y-6 m-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Inventory Tabs Explained */}
                      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/30">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Inventory Sections
                          </h3>
                          
                          <div className="space-y-2.5 text-sm">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-xs mb-1">📦 Stock Overview</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">See all drugs, quantities, prices, and expiry dates.</p>
                            </div>
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-800">
                              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-xs mb-1">📋 Drug Catalog</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Master list of all drugs your pharmacy sells.</p>
                            </div>
                            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                              <h4 className="font-semibold text-red-900 dark:text-red-100 text-xs mb-1">⚠️ Alerts</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Low stock and expiring soon warnings.</p>
                            </div>
                            <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                              <h4 className="font-semibold text-green-900 dark:text-green-100 text-xs mb-1">📝 Transaction History</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">All inventory movements (received, dispensed).</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* How to Add Drug */}
                      <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-teal-600" />
                            Adding a Drug (One-Time Setup)
                          </h3>
                          <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                            <p className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                              <strong>Note:</strong> Add drug to catalog once. Prices & expiry come later when receiving stock.
                            </p>
                            <ol className="space-y-1.5 ml-4 list-decimal">
                              <li>Click "Add Drug" button</li>
                              <li>Select from common drugs OR type custom name</li>
                              <li>Enter strength (e.g., 500mg)</li>
                              <li>Select form (tablet, syrup, etc.)</li>
                              <li>Set reorder level (alert threshold)</li>
                              <li>Save</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* How to Receive Stock */}
                      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Package className="w-5 h-5 text-emerald-600" />
                            Receiving Stock
                          </h3>
                          <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                            <p className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <strong>When:</strong> Each time you buy/receive drugs with new batch, expiry, price.
                            </p>
                            <ol className="space-y-1.5 ml-4 list-decimal">
                              <li>Click "Receive Stock"</li>
                              <li>Select drug from dropdown</li>
                              <li>Enter lot number (optional)</li>
                              <li>Enter expiry date (required)</li>
                              <li>Enter quantity received</li>
                              <li>Enter unit cost (price per item)</li>
                              <li>Save</li>
                            </ol>
                            <p className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800">
                              <strong>Bulk:</strong> For cartons, use "Units per Carton" × "Cartons" for auto-calculation.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* Tab 3: Quick Reference */}
                  <TabsContent value="quick-ref" className="p-6 space-y-6 m-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Key Concepts */}
                      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                            Key Concepts
                          </h3>
                          <div className="space-y-2.5 text-sm">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                              <h4 className="font-semibold text-xs mb-1">FEFO (First Expiry, First Out)</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Always dispense drugs expiring soonest first to minimize waste.</p>
                            </div>
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                              <h4 className="font-semibold text-xs mb-1">Batch/Lot</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Each drug purchase has unique batch with its own expiry & price.</p>
                            </div>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                              <h4 className="font-semibold text-xs mb-1">Reorder Level</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300">Minimum stock before system alerts you to reorder.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Troubleshooting */}
                      <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Troubleshooting
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-md border-l-2 border-red-500">
                              <p className="font-semibold mb-0.5">Can't find a drug?</p>
                              <p className="text-gray-700 dark:text-gray-300">Go to Inventory → Add Drug first, then Receive Stock.</p>
                            </div>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-md border-l-2 border-amber-500">
                              <p className="font-semibold mb-0.5">Stock not updating?</p>
                              <p className="text-gray-700 dark:text-gray-300">Click Refresh button or reload page.</p>
                            </div>
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-2 border-blue-500">
                              <p className="font-semibold mb-0.5">Need to adjust stock?</p>
                              <p className="text-gray-700 dark:text-gray-300">Contact supervisor - adjustments require authorization.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Status Badge Guide */}
                      <Card className="border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/30">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-pink-600" />
                            Status Badges
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">✓ PAID</span>
                              <span className="text-gray-700 dark:text-gray-300">Ready to dispense</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium">UNPAID</span>
                              <span className="text-gray-700 dark:text-gray-300">Needs payment first</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">✓ DISPENSED</span>
                              <span className="text-gray-700 dark:text-gray-300">Already given to patient</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> ALLERGIES
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">Check drug compatibility</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


